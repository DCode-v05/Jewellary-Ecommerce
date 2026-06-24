# Suvish — Jewellery E-commerce API

**A production jewellery storefront backend: a TypeScript REST API plus a Python ALS recommendation service, wired to real payment, shipping, and storage providers.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat&logo=amazons3&logoColor=white) ![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat&logo=razorpay&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## Overview

This is the backend for a direct-to-customer jewellery store (live storefront at [suvish.store](https://suvish.store/)). It handles everything a real online shop needs: accounts and login, a product catalogue with variants, cart and wishlist, the full order lifecycle, payments, shipping, coupons, reviews, and a recommendation engine that personalizes the homepage from how each user actually behaves.

I built this during my backend/ML internship at **Synvolve Intellis** (Jun–Sep 2025) as the lead backend author. The codebase is a hybrid: a Node.js + TypeScript Express API for the transactional core, and a separate Python FastAPI microservice for the machine-learning recommendations, both reading and writing the same PostgreSQL database through a shared schema. The API surface is split across 16 route groups and 16 controllers, and the database schema covers roughly 40 models and enums backed by 46 Prisma migrations — so this is a fairly complete store, not a toy CRUD demo.

## Key Features

- **Authentication & sessions** — JWT-based auth with refresh tokens (stored in a `RefreshToken` table), role-based access control (`ADMIN` / `USER`), OTP handling, and CSRF protection on state-changing routes.
- **Product catalogue** — categories, products, and `ProductVariant` records (size, weight, metal type), product images uploaded to AWS S3, slugged URLs, and an `active` flag so admins can hide products without deleting them.
- **Cart & wishlist** — full cart and wishlist management keyed to product variants, so a 22k-gold ring in size 7 is a distinct line item from the same ring in size 9.
- **Order lifecycle** — orders move through a real status machine (ordered → delivered / cancelled, with cancellation video support), sequential order and invoice numbering via dedicated counter tables, GST calculation, and invoice generation.
- **Payments** — Razorpay integration for order creation, payment capture, and verification.
- **Shipping** — ShipRocket integration for logistics (the shipping controller is the single largest file in the repo, covering serviceability, shipment creation, and tracking).
- **Coupons & marketing** — a coupon system with per-user usage limits, product- and category-scoped applicability, and flash-sale support.
- **Reviews & ratings** — product reviews with star ratings, an expectation level, and attached review media (images/video).
- **Recommendation engine** — collaborative filtering (ALS) over the last 30 days of user activity, precomputed in batch and served on the homepage with a sensible default fallback.
- **Storefront content** — admin-managed hero banners, flash-sale images, trending-now picks, a blog, email subscriptions, and a contact-message inbox.
- **Notifications** — transactional email via SendGrid and SMS/OTP via Twilio.
- **API documentation** — Swagger UI served at `/api-docs`, with a JSON spec at `/api-docs.json`.
- **Input validation** — every route group has a matching set of Zod schemas (15 validator files) so malformed payloads are rejected before they reach the controller.

## How It Works

The system is two services sharing one PostgreSQL database. The Node API owns all the synchronous request/response traffic; the Python service runs a periodic, heavier ML job. They never call each other's internals — they coordinate entirely through the database tables Prisma defines.

### The Express API (TypeScript)

`src/app.ts` is the entry point. It wires up Helmet for HTTP headers, CORS configured against the frontend origin with credentials, cookie parsing, Morgan request logging, a 100 MB JSON/body limit (large product image uploads), and the Swagger docs, then mounts 16 route groups under `/api`:

```
/api/auth        /api/products   /api/admin      /api/home
/api/shop        /api/cart       /api/wishlist   /api/reviews
/api/profile     /api/orders     /api/recommend  /api/coupons
/api/default     /api/shiprocket /api/razorpay   /api (csrf)
```

Each route group follows the same layout: a thin `routes/*.ts` file that applies middleware (`verifyToken`, CSRF, Multer-S3 upload) and points to a `controllers/*.ts` file that holds the business logic, with request bodies checked against `validators/*.ts` Zod schemas. Data access goes through a single shared Prisma client (`utils/prisma.ts`), and helpers in `utils/` cover S3 file management, OTP, email, slugs, and pulling the user id off the verified token. Express 5 is used directly, and a final error-handling middleware normalizes everything to a JSON `{ error }` shape.

### The recommendation microservice (Python / FastAPI)

`recommendation/main.py` is a self-contained FastAPI app exposing one protected endpoint, `POST /train_and_push`, guarded by a JWT-encoded API key (the token's `apiKey` claim must match a shared secret). When triggered, it:

1. **Pulls activity** — reads all users and every `UserActivityLog` row from the last 30 days directly from PostgreSQL via `psycopg2`.
2. **Scores interactions** — maps each activity type to an implicit-feedback weight (`VIEW` = 1.0, `CLICK` = 2.0, `CART` = 3.0, `PURCHASE` = 5.0) and drops anything that scores zero.
3. **Builds the matrix** — assembles a sparse user×item matrix (`scipy.sparse.csr_matrix`) from those weighted scores.
4. **Trains ALS** — fits an `implicit` `AlternatingLeastSquares` model with `factors=50`, `regularization=0.01`, and `iterations=100`, then pickles the model and its id-maps to disk for reuse.
5. **Writes back recommendations** — generates the top 5 products per user, filters out any product that is missing or inactive, clears that user's old `RecommendedProduct` rows, and inserts the fresh set in a single committed transaction (rolled back on any error).

Because the read path on the API side just selects precomputed `RecommendedProduct` rows for the logged-in user (and falls back to a default list when there are none), the homepage stays fast — the expensive matrix factorization happens offline in batch, not per request. On the Node side, `recommend.controller.ts` logs activity (`/api/recommend/user-activity-log`) and exposes a `/train-and-recommend` trigger, which is what kicks off the Python job.

### Data model

The Prisma schema (`prisma/schema.prisma`) defines around 40 models and enums, including `User`, `Product`, `ProductVariant`, `Category`, `Cart`/`CartItem`, `Wishlist`/`WishlistItem`, `Order`/`OrderItem`, `Address`, `Review`/`ReviewMedia`, `Coupon` (with per-user and per-product/category scoping tables), `UserActivityLog`, `RecommendedProduct`, `RefreshToken`, `Blog`, several `Default*` content tables for the storefront, and `OrderCounter`/`InvoiceCounter` for human-readable sequential numbers. The 46 timestamped migrations under `prisma/migrations/` are the actual history of how the schema evolved over the build.

## Tech Stack

- **Languages:** TypeScript (primary), Python, SQL/PLpgSQL
- **API framework:** Node.js, Express 5
- **ORM & database:** Prisma 6, PostgreSQL
- **Validation & security:** Zod, JWT (`jsonwebtoken`), `bcryptjs`, Helmet, `csurf`, `express-rate-limit`, CORS
- **ML / recommendation:** FastAPI, `implicit` (ALS), Pandas, SciPy, `psycopg2`, Uvicorn
- **Integrations:** Razorpay (payments), ShipRocket (shipping), AWS S3 via `@aws-sdk/client-s3` + `multer-s3` (image storage), Twilio (SMS/OTP), SendGrid (email)
- **Docs & tooling:** Swagger (`swagger-jsdoc` + `swagger-ui-express`), ESLint, `ts-node-dev`, `tsx`, Docker

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Python 3.10+ (for the recommendation service)
- Accounts/keys for the integrations you want live (Razorpay, ShipRocket, AWS S3, Twilio, SendGrid)

### Installation

```bash
git clone https://github.com/DCode-v05/Jewellary-Ecommerce.git
cd Jewellary-Ecommerce
npm install
```

### Environment configuration

Copy the example file and fill in your values (database URL, `JWT_SECRET`, AWS, Razorpay, ShipRocket, Twilio, SendGrid keys, and `FRONTEND_URL`):

```bash
cp .env.example .env
```

### Database setup

```bash
npx prisma migrate dev   # apply the schema
npm run seed             # optional: seed catalogue/default content
```

### Running the API

```bash
npm run dev              # development (ts-node-dev, auto-respawn)
# or
npm run build && npm start   # production (compiled to dist/)
```

The API listens on `http://localhost:5000` by default. Swagger UI is at `http://localhost:5000/api-docs`.

### Running the recommendation service

```bash
cd recommendation
python -m venv venv && source venv/bin/activate   # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # set DB_HOST/DB_NAME/DB_USER/DB_PASS/DB_PORT, the API-key secret, etc.
python main.py             # serves on port 8000
```

## Usage

- **Explore the API:** open `/api-docs` for the live Swagger UI, or fetch the raw spec at `/api-docs.json`.
- **Auth flow:** register and log in via `/api/auth` to receive a token/cookie, then call protected routes with it.
- **Shopping:** browse via `/api/shop` and `/api/products`, add to `/api/cart` or `/api/wishlist`, then place orders through `/api/orders` with payment handled by `/api/razorpay` and fulfilment by `/api/shiprocket`.
- **Admin:** routes under `/api/admin` are gated to the `ADMIN` role for managing products, categories, coupons, banners, and orders.
- **Recommendations:** user interactions are logged through `/api/recommend/user-activity-log`; the `/train-and-recommend` trigger runs the Python ALS job, after which the homepage serves each user their precomputed picks.

## Project Structure

```
Jewellary-Ecommerce/
├── src/
│   ├── app.ts                 # Express entry point, middleware, route mounting
│   ├── controllers/           # 16 controllers (auth, admin, order, cart, coupon,
│   │                          #   razorpay, shipRocket, recommend, review, ...)
│   ├── routes/                # 16 route groups, one per controller
│   ├── middlewares/           # auth (JWT), CSRF, Multer-S3, OTP
│   ├── validators/            # 15 Zod schema files, one per resource
│   ├── utils/                 # Prisma client, S3 files, email, OTP, slugs
│   └── prisma/                # seed.ts / truncate.ts scripts
├── recommendation/
│   ├── main.py                # FastAPI ALS service: train + push recommendations
│   ├── requirements.txt       # implicit, pandas, scipy, fastapi, psycopg2, ...
│   └── .env.example
├── prisma/
│   ├── schema.prisma          # ~40 models/enums
│   └── migrations/            # 46 timestamped migrations
├── package.json               # scripts: dev / build / start / seed / truncate / lint
├── tsconfig.json
└── .env.example
```

---

## Contact

**Portfolio:** [Denistan](https://www.denistan.me)<br>
**LinkedIn:** [Denistan](https://www.linkedin.com/in/denistanb)<br>
**GitHub:** [DCode-v05](https://github.com/DCode-v05)<br>
**LeetCode:** [Denistan_B](https://leetcode.com/u/Denistan_B)<br>
**Email:** [denistanb05@gmail.com](mailto:denistanb05@gmail.com)

Made with ❤️ by **Denistan B**
