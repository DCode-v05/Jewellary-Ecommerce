import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { getUserId } from "../utils/getUserId";
import { ZodError } from "zod";
import { createReviewSchema, updateReviewSchema, deleteReviewSchema, getReviewByProductIdSchema } from "../validators/review.validator";
import { v4 as uuidv4 } from "uuid";
import { uploadFile, deleteFile } from "../utils/manageFile";

/**
 * @swagger
 * tags:
 *   name: Review
 *   description: |
 *     Product Review Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReviewData:
 *       type: object
 *       required:
 *         - productId
 *         - rating
 *         - comment
 *         - headline
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: UUID of the product being reviewed
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Product rating from 1 to 5 stars
 *           example: 5
 *         comment:
 *           type: string
 *           minLength: 1
 *           description: Review comment (required)
 *           example: "This product exceeded my expectations. Great quality and fast delivery."
 *         headline:
 *           type: string
 *           minLength: 1
 *           description: Review headline (required)
 *           example: "Outstanding product quality!"
 *         expectationMet:
 *           type: string
 *           enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *           nullable: true
 *           description: How well the product met expectations
 *           example: "EXCEEDED"
 *         wouldRecommend:
 *           type: boolean
 *           nullable: true
 *           description: Whether user would recommend this product
 *           example: true
 *         firstDiscover:
 *           type: string
 *           nullable: true
 *           description: How the user first discovered the product
 *           example: "Google search"
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, VIDEO]
 *                 description: Type of media file
 *           description: Media metadata array (actual files uploaded separately)
 *           example: [{"mediaType": "IMAGE"}, {"mediaType": "VIDEO"}]
 *     UpdateReviewData:
 *       type: object
 *       required:
 *         - reviewId
 *       properties:
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: UUID of the review to update
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Updated rating (optional)
 *           example: 4
 *         comment:
 *           type: string
 *           minLength: 1
 *           description: Updated comment (optional but must be non-empty if provided)
 *           example: "Updated review comment"
 *         headline:
 *           type: string
 *           minLength: 1
 *           description: Updated headline (optional but must be non-empty if provided)
 *           example: "Updated headline"
 *         expectationMet:
 *           type: string
 *           enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *           nullable: true
 *           description: Updated expectation level
 *           example: "MET"
 *         wouldRecommend:
 *           type: boolean
 *           nullable: true
 *           description: Updated recommendation flag
 *           example: false
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, VIDEO]
 *           description: Updated media metadata (replaces all existing media)
 *     ReviewMedia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the review media
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated review
 *         mediaUrl:
 *           type: string
 *           nullable: true
 *           description: S3 URL of the media file
 *           example: "reviews/550e8400-e29b-41d4-a716-446655440001/images/abc123.jpg"
 *         mediaType:
 *           type: string
 *           enum: [IMAGE, VIDEO]
 *           nullable: true
 *           description: Type of media (IMAGE or VIDEO)
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Media creation timestamp
 *       required:
 *         - id
 *         - reviewId
 *         - createdAt
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique review identifier
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Product being reviewed
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User who created the review
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Product rating (1-5 stars)
 *         comment:
 *           type: string
 *           nullable: true
 *           description: Review comment
 *         headline:
 *           type: string
 *           nullable: true
 *           description: Review headline
 *         expectationMet:
 *           type: string
 *           enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *           nullable: true
 *           description: How well product met expectations
 *         wouldRecommend:
 *           type: boolean
 *           nullable: true
 *           default: false
 *           description: Whether user recommends the product
 *         reviewMedia:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewMedia'
 *           description: Associated media files
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation timestamp
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *           description: Basic product information
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *           description: Basic user information
 *       required:
 *         - id
 *         - productId
 *         - userId
 *         - rating
 *         - createdAt
 *     ValidationError:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Error code (e.g., invalid_type, too_small)
 *           example: "invalid_type"
 *         path:
 *           type: array
 *           items:
 *             type: string
 *           description: Path to the field that failed validation
 *           example: ["rating"]
 *         message:
 *           type: string
 *           description: Human-readable error message
 *           example: "Expected number, received string"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *       required:
 *         - error
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: JWT token stored in httpOnly cookie for authentication
 */

/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     tags: [Review]
 *     summary: Create a new product review
 *     description: |
 *       Creates a new review for a product. User must be authenticated and have purchased the product 
 *       (order status must be DELIVERED or RETURNED). Supports optional media uploads (images/videos).
 *       
 *       **Prerequisites:**
 *       - User must be authenticated via accessToken cookie
 *       - User must have purchased the product with delivered/returned order status
 *       
 *       **Request Structure:**
 *       - Uses multipart/form-data for file uploads
 *       - reviewData field contains JSON with review details
 *       - media field contains optional file uploads (up to 10 files)
 *
 *       **Key Features:**
 *       - Create reviews with rating, comment, headline, and media uploads
 *       - Support for image and video media uploads (up to 10 files)
 *       - Expectation tracking and recommendation flags
 *     
 *       **Authentication:**
 *       This endpoint requires authentication via **accessToken** cookie containing a valid JWT.
 *     
 *       **Business Rules:**
 *       - Users can only review products they have purchased (order status: DELIVERED or RETURNED)
 *       - Comment and headline are required when creating reviews
 *       - Media files are optional but limited to 10 files per review
 *       - Supported media types: IMAGE, VIDEO
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT authentication token for user verification
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - reviewData
 *             properties:
 *               reviewData:
 *                 type: string
 *                 description: |
 *                   JSON string containing review data with the following structure:
 *                   
 *                   Required fields:
 *                   - productId (string): UUID of the product being reviewed
 *                   - rating (integer): Rating from 1-5 stars
 *                   - comment (string): Review comment text
 *                   - headline (string): Review headline
 *                   
 *                   Optional fields:
 *                   - media (array): Array of media metadata objects with mediaType [IMAGE, VIDEO]
 *                   - expectationMet (string): Expectation level [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *                   - wouldRecommend (boolean): Would recommend flag
 *                   - firstDiscover (string): How they discovered the product
 *                 example: '{"productId":"550e8400-e29b-41d4-a716-446655440000","rating":5,"comment":"Excellent product quality","headline":"Highly recommended","expectationMet":"EXCEEDED","wouldRecommend":true,"firstDiscover":"Google search"}'
 *                 x-postman-schema:
 *                   $ref: '#/components/schemas/CreateReviewData'
 *                 x-postman-media-type: application/json
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Optional media files (images/videos) for the review. Maximum 10 files allowed.
 *           encoding:
 *             reviewData:
 *               contentType: application/json
 *             media:
 *               contentType: image/*, video/*
 *     responses:
 *       200:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Unique review identifier
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 productId:
 *                   type: string
 *                   format: uuid
 *                 rating:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 5
 *                 comment:
 *                   type: string
 *                   nullable: true
 *                 headline:
 *                   type: string
 *                   nullable: true
 *                 expectationMet:
 *                   type: string
 *                   enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *                   nullable: true
 *                 wouldRecommend:
 *                   type: boolean
 *                   default: false
 *               example:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 userId: "550e8400-e29b-41d4-a716-446655440002"
 *                 productId: "550e8400-e29b-41d4-a716-446655440000"
 *                 rating: 5
 *                 comment: "Excellent product quality"
 *                 headline: "Highly recommended"
 *                 expectationMet: "EXCEEDED"
 *                 wouldRecommend: true
 *       400:
 *         description: Bad Request - Validation error or invalid media format
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid media format (JSON expected)"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                           path:
 *                             type: array
 *                             items:
 *                               type: string
 *                           message:
 *                             type: string
 *                         example:
 *                           code: "invalid_type"
 *                           path: ["rating"]
 *                           message: "Expected number, received string"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User has not purchased this product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User did not purchase this product"
 *       404:
 *         description: Not Found - Product does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 * 
 * @example
 * # Postman Usage Instructions
 * This endpoint should be used in Postman with the following form-data structure:
 * 
 * Form Data Fields:
 * - reviewData (Text): JSON string with review information
 * - media (File): Multiple media files - images or videos (optional, max 10)
 * 
 * Example reviewData JSON:
 * ```json
 * {
 *   "productId": "550e8400-e29b-41d4-a716-446655440000",
 *   "rating": 5,
 *   "comment": "Excellent product quality",
 *   "headline": "Highly recommended",
 *   "expectationMet": "EXCEEDED",
 *   "wouldRecommend": true,
 *   "firstDiscover": "Google search"
 * }
 * ```
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reviewData = JSON.parse(req.body.reviewData);
    const data = createReviewSchema.parse(reviewData);

    const productId = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!productId) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const order = await prisma.order.findFirst({
      where: {
        userId: userId,
        orderStatus: { in: ["DELIVERED", "RETURNED"] }, 
        orderItems: {
          some: {
            productId: data.productId,
          },
        },
      },
    });
    if (!order) {
      res.status(403).json({ error: "User did not purchase this product" });
      return;
    }
    const review = await prisma.review.create({
      data: {
        id: uuidv4(),
        userId: userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        headline: data.headline,
        expectationMet: data.expectationMet? data.expectationMet : null,
        wouldRecommend: data.wouldRecommend? data.wouldRecommend : false,
      }
    })

    if(data.media && data.media.length > 0) {
      const files = req.files as Express.Multer.File[];

      const mediaData = await Promise.all(
        data.media.map(async (mediaItem, index) => {
          let key: string | null = null;

          if (mediaItem.mediaType === "IMAGE") {
            key = `reviews/${review.id}/images/${uuidv4()}.jpg`;
          } else if (mediaItem.mediaType === "VIDEO") {
            key = `reviews/${review.id}/videos/${uuidv4()}.mp4`;
          }

          if (key && files[index]) {
            await uploadFile(files[index], key);
          }

          return {
            id: uuidv4(),
            reviewId: review.id,
            mediaUrl: "/" + key,
            mediaType: mediaItem.mediaType,
          };
        })
      );
      await prisma.reviewMedia.createMany({
          data: mediaData,
      });
    }
    if(data.firstDiscover) {
        await prisma.user.update({
            where: { id: userId },
            data: { firstDiscover: data.firstDiscover },
        });
    }
    res.status(200).json(review);
  } catch (error) {
    if (error instanceof ZodError) {
        res.status(400).json({ error: error.errors });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/reviews/user/get:
 *   get:
 *     tags: [Review]
 *     summary: Get all reviews by user ID
 *     description: |
 *       Fetches all reviews written by the authenticated user.
 *       **Authentication:**
 *       This endpoint requires authentication via **accessToken** cookie containing a valid JWT.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT authentication token for user verification
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
export const getReviewsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req.cookies.accessToken);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reviews = await prisma.review.findMany({
      where: { userId: userId },
      include: { 
        product: true,
        reviewMedia: true, 
      },
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/reviews/product/get:
 *   get:
 *     tags: [Review]
 *     summary: Get all reviews by product ID
 *     description: |
 *       Fetches all reviews for a specific product.
 *       **Authentication:**
 *       This endpoint requires authentication via **accessToken** cookie containing a valid JWT.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT authentication token for user verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product to fetch reviews for
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
export const getReviewsByProductId = async (req: Request, res: Response) => {
  try {
    const data = getReviewByProductIdSchema.parse(req.params);
    const reviews = await prisma.review.findMany({
      where: { productId: data.id },
      include: {
        user: {
          include: {
            addresses: {
              select: {
                city: true,
              }
            }
          }
        },
        reviewMedia: true,
      },
    });
    if (reviews.length === 0) {
      res.status(200).json({ error: "No reviews found for this product" });
      return;
    }
    res.status(200).json(reviews);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/reviews/update:
 *   put:
 *     tags: [Review]
 *     summary: Update an existing review
 *     description: |
 *       Updates an existing review owned by the authenticated user. Only the review creator can update their review.
 *       Supports updating media files (replaces all existing media with new uploads).
 *       
 *       **Prerequisites:**
 *       - User must be authenticated via accessToken cookie
 *       - User must be the owner of the review
 *       
 *       **Request Structure:**
 *       - Uses multipart/form-data for file uploads
 *       - All fields are optional except reviewId
 *       - When media is provided, it replaces ALL existing media
 *
 *       **Key Features:**
 *       - Update existing reviews (owners only)
 *       - Support for updating media files (replaces all existing media)
 *       - Expectation tracking and recommendation flags
 *     
 *       **Authentication:**
 *       This endpoint requires authentication via **accessToken** cookie containing a valid JWT.
 *     
 *       **Business Rules:**
 *       - Users can only update their own reviews
 *       - All fields are optional except reviewId
 *       - When media is provided, it replaces ALL existing media
 *       - Supported media types: IMAGE, VIDEO
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT authentication token for user verification
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - reviewId
 *             properties:
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the review to update
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating (1-5 stars)
 *               comment:
 *                 type: string
 *                 description: Updated comment text
 *               headline:
 *                 type: string
 *                 description: Updated review headline
 *               expectationMet:
 *                 type: string
 *                 enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *                 description: Updated expectation level
 *               wouldRecommend:
 *                 type: boolean
 *                 description: Updated recommendation flag
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: |
 *                   Updated media files. If provided, replaces ALL existing media.
 *                   To remove all media, send empty array. Maximum 10 files allowed.
 *           example:
 *             reviewId: "550e8400-e29b-41d4-a716-446655440001"
 *             rating: 4
 *             comment: "Updated review comment"
 *             headline: "Updated headline"
 *             expectationMet: "MET"
 *             wouldRecommend: true
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 productId:
 *                   type: string
 *                   format: uuid
 *                 rating:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 5
 *                 comment:
 *                   type: string
 *                   nullable: true
 *                 headline:
 *                   type: string
 *                   nullable: true
 *                 expectationMet:
 *                   type: string
 *                   enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *                   nullable: true
 *                 wouldRecommend:
 *                   type: boolean
 *               example:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 userId: "550e8400-e29b-41d4-a716-446655440002"
 *                 productId: "550e8400-e29b-41d4-a716-446655440000"
 *                 rating: 4
 *                 comment: "Updated review comment"
 *                 headline: "Updated headline"
 *                 expectationMet: "MET"
 *                 wouldRecommend: true
 *       400:
 *         description: Bad Request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *                     example:
 *                       code: "invalid_type"
 *                       path: ["reviewId"]
 *                       message: "Required"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Not Found - Review not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     review_not_found:
 *                       value: "Review not found"
 *                     not_owner:
 *                       value: "Review not found for this user"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const reviewData = JSON.parse(req.body.reviewData);
    const data = updateReviewSchema.parse(reviewData);
    const review = await prisma.review.findUnique({
      where: { id: data.reviewId },
      include: { reviewMedia: true },
    });
    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    if (review.userId !== userId) {
      res.status(404).json({ error: "Review not found for this user" });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: {
        rating: data.rating || review.rating,
        comment: data.comment || review.comment,
        headline: data.headline || review.headline,
        expectationMet: data.expectationMet || review.expectationMet,
        wouldRecommend: data.wouldRecommend ? data.wouldRecommend : review.wouldRecommend,
      }
    });

    if (data.createMedia && data.createMedia.length > 0) {
      const files = req.files as Express.Multer.File[];
      for (const media of data.createMedia) {
        let key: string | null = null;
        if (media.mediaType === "IMAGE") {
          key = `reviews/${review.id}/images/${uuidv4()}.jpg`;
        } else if (media.mediaType === "VIDEO") {
          key = `reviews/${review.id}/videos/${uuidv4()}.mp4`;
        }
        if (key) {
          for (const file of files) {
            if (file.originalname === media.fileName) {
              await uploadFile(file, key);
            }
          }
          await prisma.reviewMedia.create({
            data: {
              reviewId: review.id,
              mediaType: media.mediaType,
              mediaUrl: "/" + key,
            }
          });
        }
      }
    }

    if (data.updateMedia && data.updateMedia.length > 0) {
      const files = req.files as Express.Multer.File[];
      for(const media of data.updateMedia) {
        const reviewMedia = await prisma.reviewMedia.findUnique({
          where: { id: media.id }
        });
        if (reviewMedia) {
          if (reviewMedia.mediaUrl) {
            await deleteFile(reviewMedia.mediaUrl.replace("/", ""));
          }
          let key: string | null = null;
          if (reviewMedia.mediaType === "IMAGE") {
            key = `reviews/${review.id}/images/${uuidv4()}.jpg`;
          } else if (reviewMedia.mediaType === "VIDEO") {
            key = `reviews/${review.id}/videos/${uuidv4()}.mp4`;
          }
          if (key){
            for (const file of files) {
              if (file.originalname === media.fileName) {
                await uploadFile(file, key);
              }
            }
            await prisma.reviewMedia.update({
              where: { id: media.id },
              data: { mediaUrl: "/" + key }
            });
          }
        }
      }
    }

    if (data.deleteMedia && data.deleteMedia.length > 0) {
      for (const mediaId of data.deleteMedia) {
        const reviewMedia = await prisma.reviewMedia.findUnique({
          where: { id: mediaId.id }
        });
        if (reviewMedia) {
          if (reviewMedia.mediaUrl) {
            await deleteFile(reviewMedia.mediaUrl.replace("/", ""));
          }
          await prisma.reviewMedia.delete({
            where: { id: mediaId.id }
          });
        }
      }
    }

    res.status(200).json(updatedReview);
  } catch (error) {
    if (error instanceof ZodError) {
        res.status(400).json({ error: error.errors });
    } else {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

/**
 * @swagger
 * /api/reviews/delete:
 *   delete:
 *     tags: [Review]
 *     summary: Delete a review
 *     description: |
 *       Deletes a review owned by the authenticated user. Only the review creator can delete their review.
 *       This action also deletes all associated media files and cannot be undone.
 *       
 *       **Prerequisites:**
 *       - User must be authenticated via accessToken cookie
 *       - User must be the owner of the review
 *       
 *       **Note:** This operation permanently deletes the review and all associated media.
 *
 *       **Key Features:**
 *       - Delete reviews (owners only)
 *       - Deletes all associated media files (cannot be undone)
 *
 *       **Authentication:**
 *       This endpoint requires authentication via **accessToken** cookie containing a valid JWT.
 *
 *       **Business Rules:**
 *       - Users can only delete their own reviews
 *       - This operation permanently deletes the review and all associated media
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT authentication token for user verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the review to delete
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success confirmation message
 *               example:
 *                 message: "Review deleted successfully"
 *       400:
 *         description: Bad Request - Invalid review ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *                   example:
 *                     - code: "invalid_type"
 *                       path: ["id"]
 *                       message: "Required"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User is not the owner of the review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You can only delete your own reviews"
 *       404:
 *         description: Not Found - Review does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Review not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if(req.cookies.accessToken) {
        userId = getUserId(req.cookies.accessToken);
    }
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const data = deleteReviewSchema.parse(req.body);
    const review = await prisma.review.findUnique({
        where: { id: data.id },
        include: { reviewMedia: true },
    });
    if (!review) {
        res.status(404).json({ error: "Review not found" });
        return;
    }
    if (review.userId !== userId) {
        res.status(403).json({ error: "You can only delete your own reviews" });
        return;
    }
    if (review.reviewMedia.length > 0) {
        for (const media of review.reviewMedia) {
            if (media.mediaUrl) {
                await deleteFile(media.mediaUrl.replace("/", ""));
            }
        }
    }
    await prisma.reviewMedia.deleteMany({
        where: { reviewId: review.id },
    });
    await prisma.review.delete({
        where: { id: review.id },
    });
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};