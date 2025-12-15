import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { getUserId } from "../utils/getUserId";
import { createUserActivityLogSchema } from "../validators/recommend.validator";
import { ZodError } from "zod";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";


/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Machine Learning-powered Product Recommendation System APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserActivityLogRequest:
 *       type: object
 *       required:
 *         - productId
 *         - activityType
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the product that the user interacted with
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         activityType:
 *           type: string
 *           enum:
 *             - VIEW
 *             - CLICK
 *             - ADD_TO_CART
 *             - PURCHASE
 *           description: Type of user activity performed on the product
 *           example: VIEW
 *     UserActivityLogResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the activity log entry
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the user who performed the activity
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the product that was interacted with
 *           example: "789e1234-e89b-12d3-a456-426614174222"
 *         activityType:
 *           type: string
 *           enum:
 *             - VIEW
 *             - CLICK
 *             - ADD_TO_CART
 *             - PURCHASE
 *           description: Type of user activity that was logged
 *           example: VIEW
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the activity was logged
 *           example: "2025-08-29T10:30:00.000Z"
 *     TrainModelResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message indicating model training completion
 *           example: "Model training completed successfully"
 *     RecommendationResponse:
 *       type: array
 *       description: Array of recommended product IDs for the user
 *       items:
 *         type: string
 *         format: uuid
 *         description: Product ID recommended for the user
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     RecommendationErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message when no recommendations are available
 *           example: "No recommendations found for this user"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing what went wrong
 *           example: "Invalid input"
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: Authentication token stored in HTTP-only cookie
 */

function getEncryptedKey() {
    return jwt.sign(
        { apiKey: process.env.RECOMMENDATION_API_KEY }, 
        process.env.ENCRYPTION_SECRET!, 
        { expiresIn: "5m" }
    );
}

/**
 * @swagger
 * /api/recommend/user-activity-log:
 *   post:
 *     tags:
 *       - Recommendations
 *     summary: Log user activity for recommendation system
 *     description: |
 *       Records user interactions with products to build behavioral data for the recommendation system.
 *       This endpoint captures various types of user activities that help train machine learning models
 *       to provide personalized product recommendations.
 *       
 *       **Supported Activity Types:**
 *       - **VIEW**: User viewed a product detail page
 *       - **CLICK**: User clicked on a product (from search results, category pages, etc.)
 *       - **ADD_TO_CART**: User added the product to their shopping cart
 *       - **PURCHASE**: User completed a purchase of the product
 *       
 *       This data is crucial for understanding user preferences and generating accurate recommendations.
 *       The activity logs are used by the ML training process to identify patterns in user behavior
 *       and create personalized shopping experiences.
 *       
 *       **Authentication Required**: User must be authenticated via accessToken cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserActivityLogRequest'
 *           examples:
 *             product_view:
 *               summary: User viewed a product
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 activityType: "VIEW"
 *             add_to_cart:
 *               summary: User added product to cart
 *               value:
 *                 productId: "456e7890-e89b-12d3-a456-426614174111"
 *                 activityType: "ADD_TO_CART"
 *             purchase:
 *               summary: User purchased a product
 *               value:
 *                 productId: "789e1234-e89b-12d3-a456-426614174222"
 *                 activityType: "PURCHASE"
 *     responses:
 *       '201':
 *         description: User activity log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserActivityLogResponse'
 *             examples:
 *               success:
 *                 summary: Activity logged successfully
 *                 value:
 *                   id: "987e6543-e89b-12d3-a456-426614174333"
 *                   userId: "456e7890-e89b-12d3-a456-426614174111"
 *                   productId: "123e4567-e89b-12d3-a456-426614174000"
 *                   activityType: "VIEW"
 *                   createdAt: "2025-08-29T10:30:00.000Z"
 *       '400':
 *         description: Bad request due to invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Invalid request data
 *                 value:
 *                   error: "Validation failed: productId must be a valid UUID"
 *               missing_fields:
 *                 summary: Required fields missing
 *                 value:
 *                   error: "Required fields: productId, activityType"
 *       '401':
 *         description: Unauthorized - Authentication token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Authentication required
 *                 value:
 *                   error: "Unauthorized"
 *       '500':
 *         description: Internal server error during activity logging
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Database or server error
 *                 value:
 *                   error: "Internal server error"
 */
export const createUserActivityLog = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = createUserActivityLogSchema.parse(req.body);
        const existingProduct = await prisma.product.findUnique({
            where: { id: data.productId },
        });
        if (!existingProduct) {
            res.status(400).json({ error: "Invalid productId: Product does not exist" });
            return;
        }
        const userActivityLog = await prisma.userActivityLog.create({
            data: {
                id: uuidv4(),
                userId: userId,
                productId: data.productId,
                activityType: data.activityType,
            },
        });
        res.status(201).json(userActivityLog);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @swagger
 * /api/recommend/train-and-recommend:
 *   post:
 *     tags:
 *       - Recommendations
 *     summary: Train the recommendation machine learning model
 *     description: |
 *       Triggers the training process for the recommendation machine learning model using stored user activity data.
 *       This endpoint communicates with an external recommendation service to train the model based on user interactions
 *       with products (views, clicks, cart additions, purchases). The training process analyzes user behavior patterns
 *       to generate personalized product recommendations.
 *       
 *       **Note:** This is typically an admin-only operation that should be run periodically to keep the recommendation
 *       model updated with latest user behavior data.
 *     responses:
 *       '200':
 *         description: Model training completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrainModelResponse'
 *             examples:
 *               success:
 *                 summary: Successful training
 *                 value:
 *                   message: "Model training completed successfully"
 *       '404':
 *         description: No user activities found for training
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_data:
 *                 summary: No training data available
 *                 value:
 *                   error: "No user activities found for training"
 *       '500':
 *         description: Internal server error during training process
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Training failed
 *                 value:
 *                   error: "Internal server error"
 *               external_api_error:
 *                 summary: External recommendation service error
 *                 value:
 *                   error: "Recommendation service training failed"
 */

export const trainModelAndRecommend = async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${process.env.RECOMMENDATION_API_URL!}/train_and_push`, {
            method: "POST",
            headers: {
                "x-api-key": getEncryptedKey(),
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            res.status(response.status).json({ error: errorData.detail});
            return;
        }
        const data = await response.json();
        if (data.status === "no user") {
            res.status(404).json({ error: "No user activities found for training" });
            return;
        }
        if (data.status === "error") {
            res.status(500).json({ error: data.message });
            return;
        }
        res.status(200).json({ message: "Model training and recommendation completed successfully" });
    } catch (error) {
        console.error("Error in Training Model:", error);
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};