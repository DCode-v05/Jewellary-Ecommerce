import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { getProductBySlugSchema } from "../validators/product.validator";
import { z } from "zod";
import { getUserId } from "../utils/getUserId";

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Name of the product
 *           example: "Gold Wedding Ring"
 *         slug:
 *           type: string
 *           description: URL-friendly slug of the product name
 *           example: "gold-wedding-ring"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the product
 *           example: "Beautiful 18k gold wedding ring with intricate design"
 *         metalType:
 *           type: string
 *           description: Type of metal used in the product (e.g., Gold, Silver, Platinum)
 *           example: "Gold"
 *         price:
 *           type: string
 *           description: Price of the product (stored as decimal with precision 10,2)
 *           example: "1299.99"
 *         discountPct:
 *           type: string
 *           nullable: true
 *           description: Discount percentage (stored as decimal with precision 10,2)
 *           example: "15.50"
 *         discountTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Discount expiration time (ISO 8601 format)
 *           example: "2025-12-31T23:59:59.000Z"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity
 *           example: 25
 *         weight:
 *           type: string
 *           nullable: true
 *           description: Weight of the product in grams (stored as decimal with precision 10,2)
 *           example: "5.75"
 *         size:
 *           type: string
 *           nullable: true
 *           description: Size of the product (stored as decimal)
 *           example: "7.5"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the category this product belongs to
 *           example: "456e7890-e89b-12d3-a456-426614174001"
 *         bannerImage:
 *           type: string
 *           nullable: true
 *           description: Banner image URL for the product
 *           example: "https://example.com/banner.jpg"
 *         bannerHeading:
 *           type: string
 *           nullable: true
 *           description: Banner heading text for promotional display
 *           example: "Limited Time Offer"
 *         bannerBody:
 *           type: string
 *           nullable: true
 *           description: Banner body text for promotional display
 *           example: "Get 20% off on all wedding rings"
 *         tag:
 *           type: string
 *           nullable: true
 *           description: Product tag for categorization or promotion
 *           example: "Bestseller"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp (ISO 8601 format)
 *           example: "2025-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Product last update timestamp (ISO 8601 format)
 *           example: "2025-01-15T10:30:00.000Z"
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *           description: Array of product images
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *           description: Array of product variants (different sizes, colors, etc.)
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *           description: Array of customer reviews for this product
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: Wishlist items for the authenticated user (only returned if user is authenticated via token cookie)
 *         cartItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *           description: Cart items for the authenticated user (only returned if user is authenticated via token cookie)
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: Order items for the authenticated user (only returned if user is authenticated via token cookie)
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - metalType
 *         - price
 *         - stock
 *         - categoryId
 *         - createdAt
 *         - updatedAt
 *         - category
 *         - images
 *         - variants
 *         - reviews
 *
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the image
 *           example: "789e0123-e89b-12d3-a456-426614174002"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product this image belongs to
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL of the product image
 *           example: "https://example.com/products/ring-image.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility and SEO
 *           example: "Gold wedding ring front view"
 *       required:
 *         - id
 *         - productId
 *         - imageUrl
 *
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the variant
 *           example: "abc1234-e89b-12d3-a456-426614174003"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product this variant belongs to
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantName:
 *           type: string
 *           description: Name of the variant (e.g., "Size 7", "Small", "Rose Gold")
 *           example: "Size 7"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity for this specific variant
 *           example: 10
 *         price:
 *           type: string
 *           nullable: true
 *           description: Price override for this variant (stored as decimal with precision 10,2). If null, uses main product price
 *           example: "1399.99"
 *         size:
 *           type: string
 *           description: Size specification for this variant (stored as decimal, required field)
 *           example: "7.0"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: Image URL specific to this variant (required field)
 *           example: "https://example.com/products/ring-size7.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the variant image
 *           example: "Gold wedding ring size 7"
 *       required:
 *         - id
 *         - productId
 *         - variantName
 *         - stock
 *         - size
 *         - imageUrl
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the category
 *           example: "456e7890-e89b-12d3-a456-426614174001"
 *         name:
 *           type: string
 *           description: Name of the category (unique across all categories)
 *           example: "Wedding Rings"
 *         slug:
 *           type: string
 *           description: URL-friendly slug of the category name (unique across all categories)
 *           example: "wedding-rings"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the category
 *           example: "Beautiful wedding rings for your special day"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: Category image URL for display purposes
 *           example: "https://example.com/categories/wedding-rings.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for category image accessibility
 *           example: "Wedding rings category"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp (ISO 8601 format)
 *           example: "2025-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Category last update timestamp (ISO 8601 format)
 *           example: "2025-01-15T10:30:00.000Z"
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - createdAt
 *         - updatedAt
 *
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the review
 *           example: "def5678-e89b-12d3-a456-426614174004"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product being reviewed
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who wrote the review
 *           example: "user123-e89b-12d3-a456-426614174005"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating given to the product (1-5 stars)
 *           example: 4
 *         comment:
 *           type: string
 *           nullable: true
 *           description: Detailed review comment from the customer
 *           example: "Beautiful ring, excellent quality and fast delivery!"
 *         headline:
 *           type: string
 *           nullable: true
 *           description: Short review headline or summary
 *           example: "Excellent quality ring"
 *         expectationMet:
 *           type: string
 *           enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *           nullable: true
 *           description: How well the product met customer expectations
 *           example: "EXCEEDED"
 *         wouldRecommend:
 *           type: boolean
 *           nullable: true
 *           description: Whether the customer would recommend this product to others
 *           default: false
 *           example: true
 *         reviewMedia:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewMedia'
 *           description: Images or videos uploaded by the customer with their review
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation timestamp (ISO 8601 format)
 *           example: "2025-02-01T15:30:00.000Z"
 *       required:
 *         - id
 *         - productId
 *         - userId
 *         - rating
 *         - createdAt
 *
 *     ReviewMedia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the review media
 *           example: "media12-e89b-12d3-a456-426614174006"
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated review
 *           example: "def5678-e89b-12d3-a456-426614174004"
 *         mediaUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL of the uploaded media file (image or video)
 *           example: "https://example.com/reviews/customer-photo.jpg"
 *         mediaType:
 *           type: string
 *           enum: [IMAGE, VIDEO]
 *           nullable: true
 *           description: Type of media uploaded by the customer
 *           example: "IMAGE"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *           example: "Customer photo of gold wedding ring"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Media upload timestamp (ISO 8601 format)
 *           example: "2025-02-01T15:35:00.000Z"
 *       required:
 *         - id
 *         - reviewId
 *         - createdAt
 *
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the wishlist item
 *           example: "wish123-e89b-12d3-a456-426614174007"
 *         wishlistId:
 *           type: string
 *           format: uuid
 *           description: ID of the user's wishlist
 *           example: "wishlist-e89b-12d3-a456-426614174008"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product added to wishlist
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *       required:
 *         - id
 *         - wishlistId
 *         - productId
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the cart item
 *           example: "cart123-e89b-12d3-a456-426614174009"
 *         cartId:
 *           type: string
 *           format: uuid
 *           description: ID of the user's shopping cart
 *           example: "cartabc-e89b-12d3-a456-426614174010"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product in the cart
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product in cart
 *           example: 2
 *       required:
 *         - id
 *         - cartId
 *         - productId
 *         - quantity
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the order item
 *           example: "order12-e89b-12d3-a456-426614174011"
 *         orderId:
 *           type: string
 *           format: uuid
 *           description: ID of the order this item belongs to
 *           example: "orderab-e89b-12d3-a456-426614174012"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product that was ordered
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product ordered
 *           example: 1
 *         price:
 *           type: string
 *           description: Price at the time of order (stored as decimal with precision 10,2)
 *           example: "1299.99"
 *       required:
 *         - id
 *         - orderId
 *         - productId
 *         - quantity
 *         - price
 *
 *     ProductNotFoundError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message indicating the product was not found
 *           example: "Product not found"
 *       required:
 *         - error
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           description: Zod validation error object containing detailed error information
 *           properties:
 *             issues:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     description: Error code from Zod validation
 *                     example: "too_small"
 *                   path:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Path to the field that caused the error
 *                     example: ["slug"]
 *                   message:
 *                     type: string
 *                     description: Human-readable error message
 *                     example: "Slug is required"
 *                   minimum:
 *                     type: number
 *                     description: Minimum value requirement (if applicable)
 *                   type:
 *                     type: string
 *                     description: Expected data type
 *             name:
 *               type: string
 *               example: "ZodError"
 *       required:
 *         - error
 *
 *     ServerError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message for server failure
 *           example: "Failed to fetch product details"
 *       required:
 *         - error
 */

/**
 * @swagger
 * paths:
 *   /api/products/details/{slug}:
 *     get:
 *       summary: Get product details by slug
 *       description: |
 *         Retrieves comprehensive product information including:
 *         - Basic product details (name, price, description, stock, etc.)
 *         - Product category information
 *         - All product images and variants
 *         - Customer reviews with media
 *         - User-specific data (wishlist, cart, and order items) if authenticated
 *         
 *         **Authentication**: Optional. If a valid JWT token is provided in the 'accessToken' cookie, 
 *         the response will include user-specific wishlist items, cart items, and order items.
 *         
 *         **Note**: Product not found returns HTTP 200 with error message, not HTTP 404.
 *       operationId: getProductDetailsBySlug
 *       tags:
 *         - Product
 *       parameters:
 *         - name: slug
 *           in: path
 *           required: true
 *           description: |
 *             The unique URL-friendly identifier for the product. 
 *             This is generated from the product name and must be non-empty.
 *           schema:
 *             type: string
 *             minLength: 1
 *           example: "gold-wedding-ring"
 *         - name: token
 *           in: cookie
 *           required: false
 *           description: |
 *             JWT authentication token for accessing user-specific data.
 *             If provided and valid, the response will include wishlist items, 
 *             cart items, and order items for the authenticated user.
 *           schema:
 *             type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       responses:
 *         '200':
 *           description: |
 *             Request processed successfully. This includes both successful product retrieval 
 *             and cases where the product is not found (returns error message).
 *           content:
 *             application/json:
 *               schema:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ProductResponse'
 *                   - $ref: '#/components/schemas/ProductNotFoundError'
 *               examples:
 *                 success:
 *                   summary: Product found successfully
 *                   value:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     name: "Gold Wedding Ring"
 *                     slug: "gold-wedding-ring"
 *                     price: "1299.99"
 *                     stock: 25
 *                     category:
 *                       name: "Wedding Rings"
 *                       slug: "wedding-rings"
 *                 not_found:
 *                   summary: Product not found
 *                   value:
 *                     error: "Product not found"
 *         '400':
 *           description: |
 *             Validation error - Invalid input parameters. 
 *             This occurs when the slug parameter is missing or empty.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               example:
 *                 error:
 *                   issues:
 *                     - code: "too_small"
 *                       path: ["slug"]
 *                       message: "Slug is required"
 *                       minimum: 1
 *                       type: "string"
 *                   name: "ZodError"
 *         '500':
 *           description: |
 *             Internal server error - Database connection issues or other server problems.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ServerError'
 *               example:
 *                 error: "Failed to fetch product details"
 */
export const productDetailsBySlug = async (req: Request, res: Response) => {
  try {
    const data = getProductBySlugSchema.parse(req.params);
    let userId: string | null = null;
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    const product = await prisma.product.findUnique({
      where: {
        slug: data.slug,
        isActive: true,
      },
      include: {
        category: true,
        images: true,
        variants: true,
        wishlistItems: userId ? {
          where: { wishlist: { userId: userId } }
        } : undefined,
        cartItems: userId ? {
          where: { cart: { userId: userId } }
        } : undefined,
      },
    });
    if (!product) {
      res.status(200).json({ error: "Product not found" });
      return;
    }
    const order = userId ? await prisma.order.findFirst({
        where: {
          userId: userId,
          orderStatus: {
            in: ["DELIVERED", "RETURNED"]
          },
          orderItems: { some: { productId: product.id } }
        }
      }) : null;
    
    const result = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      metalType: product.metalType,
      price: product.price,
      discountPct: product.discountPct,
      discountTime: product.discountTime,
      stock: product.stock,
      weight: product.weight,
      size: product.size,
      categoryId: product.categoryId,
      bannerImage: product.bannerImage,
      bannerHeading: product.bannerHeading,
      bannerBody: product.bannerBody,
      tag: product.tag,
      applyDiscountToVariants: product.applyDiscountToVariants,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description,
        imageUrl: product.category.imageUrl,
        altText: product.category.altText,
        createdAt: product.category.createdAt,
        updatedAt: product.category.updatedAt,
      },
      images: product.images.map(image => ({
        id: image.id,
        productId: image.productId,
        imageUrl: image.imageUrl,
        altText: image.altText,
      })),
      variants: product.variants.map(variant => ({
        id: variant.id,
        productId: variant.productId,
        variantName: variant.variantName,
        price: variant.price,
        stock: variant.stock,
        size: variant.size,
        imageUrl: variant.imageUrl,
        altText: variant.altText,
      })),
      orderStatus: order ? order.orderStatus : null,
    }
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error });
      return;
    }
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
}