from fastapi import FastAPI, Request, HTTPException
import os
import psycopg2
import pandas as pd
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares
import pickle
from dotenv import dotenv_values
import uuid
from datetime import datetime
import jwt
import uvicorn

# ---- Load env first, .env as fallback
_cfg_file = dotenv_values(".env")
config = {**_cfg_file, **os.environ}

def require(k: str) -> str:
    v = config.get(k)
    if not v:
        raise RuntimeError(f"Missing required config: {k}")
    return v

app = FastAPI()

def get_db_params():
    return {
        "host": require("DB_HOST"),
        "dbname": require("DB_NAME"),
        "user": require("DB_USER"),
        "password": require("DB_PASS"),
        "port": require("DB_PORT"),
    }

SCHEMA = config.get("SCHEMA", "public")
ALS_MODEL_PATH = config.get("ALS_MODEL_PATH", "/app/models/als.pkl")

def verify_encrypted_key(token: str):
    try:
        decoded = jwt.decode(token, require("ENCRYPTION_SECRET"), algorithms=["HS256"])
        return decoded.get("apiKey") == require("RECOMMENDATION_API_KEY")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=403, detail="Key expired")
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Invalid token: {e}")

def get_database_connection():
    return psycopg2.connect(**get_db_params())

def fetch_user_data(cursor):
    cursor.execute('SELECT id FROM "User";')
    all_users = [row[0] for row in cursor.fetchall()]
    cursor.execute('''
        SELECT "userId", "productId", "activityType", "createdAt" 
        FROM "UserActivityLog" 
        WHERE "createdAt" >= (NOW() - INTERVAL '30 days');
    ''')
    rows = cursor.fetchall()
    return all_users, rows

def process_user_activity(rows):
    if len(rows) > 0 and len(rows[0]) == 4:
        user_activity = pd.DataFrame(rows, columns=['userId', 'productId', 'activityType', 'createdAt'])
    else:
        user_activity = pd.DataFrame(rows, columns=['userId', 'productId', 'activityType'])
    activity_weight = {'VIEW': 1.0, 'CLICK': 2.0, 'CART': 3.0, 'PURCHASE': 5.0}
    user_activity['score'] = user_activity['activityType'].map(activity_weight).fillna(0)
    return user_activity[user_activity['score'] > 0]

@app.post("/train_and_push")
def train_and_push(req: Request):
    connection = None
    try:
        token = req.headers.get("x-api-key")
        if not token or not verify_encrypted_key(token):
            raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

        connection = get_database_connection()
        cursor = connection.cursor()
        cursor.execute(f'SET search_path TO {SCHEMA};')

        all_users, rows = fetch_user_data(cursor)
        user_activity = process_user_activity(rows)

        if user_activity.empty:
            return {"status": "no user", "message": "No valid activity logs found in last 30 days"}

        product_ids = user_activity['productId'].unique()
        user_id_map = {uid: idx for idx, uid in enumerate(all_users)}
        product_id_map = {pid: idx for idx, pid in enumerate(product_ids)}

        user_activity['userIdx'] = user_activity['userId'].map(user_id_map)
        user_activity['productIdx'] = user_activity['productId'].map(product_id_map)

        from scipy.sparse import csr_matrix
        user_item_matrix = csr_matrix(
            (user_activity['score'].values,
             (user_activity['userIdx'].values, user_activity['productIdx'].values)),
            shape=(len(all_users), len(product_ids))
        )

        als_model = AlternatingLeastSquares(factors=50, regularization=0.01, iterations=100)
        als_model.fit(user_item_matrix)

        with open(ALS_MODEL_PATH, 'wb') as f:
            pickle.dump({
                "als_model": als_model,
                "user_id_map": user_id_map,
                "product_id_map": product_id_map,
                "user_items": user_item_matrix
            }, f)

        reverse_product_map = {v: k for k, v in product_id_map.items()}

        for userId in all_users:
            if userId not in user_id_map:
                continue
            user_idx = user_id_map[userId]
            if user_idx >= user_item_matrix.shape[0]:
                continue

            user_items_single = user_item_matrix[user_idx:user_idx+1]
            item_ids, scores = als_model.recommend(userid=0, user_items=user_items_single, N=5)
            results = [{"product_id": reverse_product_map[item_ids[i]], "score": float(scores[i])}
                       for i in range(len(item_ids))]

            cursor.execute('DELETE FROM "RecommendedProduct" WHERE "userId" = %s;', (userId,))
            for r in results:
                cursor.execute('SELECT 1 FROM "Product" WHERE id = %s AND active = TRUE LIMIT 1;', (r["product_id"],))
                if cursor.fetchone() is None:
                    continue
                now = datetime.now()
                cursor.execute(
                    'INSERT INTO "RecommendedProduct" (id, "userId", "productId", "createdAt", "updatedAt") '
                    'VALUES (%s, %s, %s, %s, %s);',
                    (str(uuid.uuid4()), userId, r["product_id"], now, now)
                )
        connection.commit()
        return {"status": "success", "message": f"Trained and pushed recommendations for {len(all_users)} users (last 30 days activity)"}

    except Exception as e:
        if connection:
            connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(config.get("PORT", 8000)))