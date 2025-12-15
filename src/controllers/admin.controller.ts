import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { createProductSchema, updateProductSchema, deleteProductByNameSchema } from "../validators/product.validator";
import { createCategorySchema, updateCategorySchema, deleteCategorySchema } from "../validators/category.validator";
import { deleteReviewSchema } from "../validators/review.validator";
import { createBlogPostSchema, deleteBlogPostSchema, updateBlogPostSchema } from "../validators/blog.validator";
import { getUserId } from "../utils/getUserId";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "../utils/slugify";
import { z } from "zod";
import { uploadFile, deleteFile, renameFolder } from "../utils/manageFile";
import { createUserSchema, deleteUserSchema, updateUserSchema } from "../validators/profile.validator";
import { updateOrderStatusSchema } from "../validators/order.validator";

/**
 * @swagger
 * tags:
 *   - name: Admin - Products
 *     description: Admin endpoints for managing jewelry products
 *   - name: Admin - Categories  
 *     description: Admin endpoints for managing product categories
 *   - name: Admin - Reviews
 *     description: Admin endpoints for managing customer reviews
 *   - name: Admin - Blogs
 *     description: Admin endpoints for managing blog posts
 *   - name: Admin - Users
 *     description: Admin endpoints for managing user accounts
 *   - name: Admin - Orders
 *     description: Admin endpoints for managing customer orders
 *   - name: Admin - Contact Messages
 *     description: Admin endpoints for managing contact inquiries
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the user.
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: The name of the user.
 *           example: "John Doe"
 *         email:
 *           type: string
 *           description: The unique email address of the user.
 *           example: "john.doe@example.com"
 *         passwordHash:
 *           type: string
 *           description: The hashed password of the user.
 *           example: "$2b$10$..."
 *         phone:
 *           type: string
 *           description: The unique phone number of the user.
 *           example: "9876543210"
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: The role of the user.
 *           example: "ADMIN"
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified.
 *           example: true
 *         isSmsVerified:
 *           type: boolean
 *           description: Whether the user's phone number is verified via SMS.
 *           example: false
 *         isEmailSubscribed:
 *           type: boolean
 *           description: Whether the user is subscribed to email notifications.
 *           example: false
 *         gender:
 *           type: string
 *           description: The gender of the user (optional).
 *           example: "MALE"
 *         profileImageUrl:
 *           type: string
 *           description: URL of the user's profile image (optional).
 *           example: "https://example.com/images/profile.jpg"
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           description: The user's date of birth (optional).
 *           example: "1990-01-01T00:00:00Z"
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the user's last login (optional).
 *           example: "2025-07-31T22:41:00Z"
 *         firstDiscover:
 *           type: string
 *           description: Source or method through which the user discovered the platform (optional).
 *           example: "Google"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created.
 *           example: "2025-07-31T22:41:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was last updated.
 *           example: "2025-07-31T22:41:00Z"
 *       required:
 *         - id
 *         - name
 *         - email
 *         - passwordHash
 *         - phone
 *         - role
 *         - isEmailVerified
 *         - isSmsVerified
 *         - isEmailSubscribed
 *     ProductCreateInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - metalType
 *         - images
 *         - categoryName
 *       properties:
 *         name:
 *           type: string
 *           example: "Gold Ring"
 *         description:
 *           type: string
 *           example: "Elegant gold ring for women"
 *         metalType:
 *           type: string
 *           example: Gold
 *         price:
 *           type: number
 *           format: float
 *           example: 1999.99
 *         discountPct:
 *           type: number
 *           format: float
 *           example: 10.0
 *         discountTime:
 *           type: string
 *           example: "2024-12-31T23:59:59Z"
 *         weight:
 *           type: number
 *           format: float
 *           example: 25.5
 *         size:
 *           type: float
 *           example: 2.5
 *         stock:
 *           type: integer
 *           example: 15
 *         categoryName:
 *           type: string
 *           example: Rings
 *         tag:
 *           type: string
 *           example: bestseller
 *         bannerImageUrl:
 *           type: string
 *           format: uri
 *           example: https://example.com/banners/ring-banner.jpg
 *         bannerHeading:
 *           type: string
 *           example: "Special Offer"
 *         bannerBody:
 *           type: string
 *           example: "Limited time discount on gold rings"
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/images/ring1.jpg
 *               altText:
 *                 type: string
 *                 example: "Side view of gold ring"
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - variantName
 *               - stock
 *               - size
 *               - imageUrl
 *             properties:
 *               variantName:
 *                 type: string
 *                 example: "Size 7"
 *               stock:
 *                 type: integer
 *                 example: 10
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 1899.99
 *               size:
 *                 type: number
 *                 format: float
 *                 example: 7.0
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/images/ring1-size7.jpg
 *               altText:
 *                 type: string
 *                 example: "Gold ring size 7"
 *     ProductUpdateInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Gold Ring"
 *         newName:
 *           type: string
 *           example: "Platinum Ring"
 *         description:
 *           type: string
 *           example: "Updated elegant platinum ring"
 *         price:
 *           type: number
 *           example: 2499.99
 *         discountPct:
 *           type: number
 *           example: 15
 *         discountTime:
 *           type: string
 *           example: "2024-12-31T23:59:59Z"
 *         weight:
 *           type: number
 *           example: 30.5
 *         size:
 *           type: float
 *           example: 12.0
 *         stock:
 *           type: integer
 *           example: 20
 *         metalType:
 *           type: string
 *           example: Platinum
 *         newCategoryName:
 *           type: string
 *           example: "Premium Rings"
 *         bannerImageUrl:
 *           type: string
 *           format: uri
 *           example: https://example.com/banners/platinum-banner.jpg
 *         bannerHeading:
 *           type: string
 *           example: "Premium Collection"
 *         bannerBody:
 *           type: string
 *           example: "Exclusive platinum jewelry collection"
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *     ProductFull:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 4c62f003-d041-4a1f-b8de-749a6cf6df2d
 *         name:
 *           type: string
 *           example: "Diamond Necklace"
 *         slug:
 *           type: string
 *           example: diamond-necklace
 *         description:
 *           type: string
 *           example: "Stunning diamond necklace for evening wear"
 *         metalType:
 *           type: string
 *           example: Gold
 *         price:
 *           type: number
 *           format: float
 *           example: 4999.99
 *         discountPct:
 *           type: number
 *           example: 15
 *         discountTime:
 *           type: string
 *           format: date-time
 *           example: "2024-12-31T23:59:59Z"
 *         stock:
 *           type: integer
 *           example: 20
 *         weight:
 *           type: number
 *           example: 18.5
 *         size:
 *           type: number
 *           example: 8.5
 *         bannerImage:
 *           type: string
 *           format: uri
 *           example: https://example.com/banners/necklace-banner.jpg
 *         bannerHeading:
 *           type: string
 *           example: "Luxury Collection"
 *         bannerBody:
 *           type: string
 *           example: "Exquisite diamond jewelry for special occasions"
 *         tag:
 *           type: string
 *           example: luxury
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: URL or path to the category image
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the category image
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product image
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product this image belongs to
 *         imageUrl:
 *           type: string
 *           description: URL or path to the image file
 *           example: "product1.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the image
 *           example: "Front view of diamond ring"
 *       required:
 *         - id
 *         - productId
 *         - imageUrl
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product variant
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product this variant belongs to
 *         variantName:
 *           type: string
 *           description: Name of the variant (e.g., "Size 6", "18K Gold")
 *           example: "Size 6"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock for this variant
 *           example: 5
 *         price:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Price for this specific variant (if different from base product)
 *           example: 2899.99
 *         size:
 *           type: number
 *           format: float
 *           description: Size specification for the variant
 *           example: 6.0
 *         imageUrl:
 *           type: string
 *           description: URL or path to the variant-specific image
 *           example: "variant1.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the variant image
 *           example: "Size 6 variant"
 *       required:
 *         - id
 *         - productId
 *         - variantName
 *         - stock
 *         - size
 *         - imageUrl
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the review
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product being reviewed
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who wrote the review
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Star rating (1-5)
 *           example: 5
 *         headline:
 *           type: string
 *           nullable: true
 *           description: Short headline for the review
 *           example: "Absolutely stunning!"
 *         comment:
 *           type: string
 *           nullable: true
 *           description: Detailed review comment
 *           example: "This ring exceeded my expectations. The quality is exceptional."
 *         expectationMet:
 *           type: string
 *           enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *           nullable: true
 *           description: How well the product met customer expectations
 *           example: "EXCEEDED"
 *         wouldRecommend:
 *           type: boolean
 *           nullable: true
 *           description: Whether the customer would recommend this product
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *           example: "2025-08-07T15:30:00Z"
 *       required:
 *         - id
 *         - productId
 *         - userId
 *         - rating
 *         - createdAt
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the product
 *         name:
 *           type: string
 *           description: Name of the product
 *         slug:
 *           type: string
 *           description: URL-friendly slug of the product name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: Price of the product
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Image'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Variant'
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           nullable: true
 *           description: Wishlist items for the authenticated user, if provided
 *         cartItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *           nullable: true
 *           description: Cart items for the authenticated user, if provided
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           nullable: true
 *           description: Order items for the authenticated user, if provided
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - price
 *         - category
 *         - images
 *         - variants
 *
 *
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the image
 *         url:
 *           type: string
 *           description: URL of the image
 *       required:
 *         - id
 *         - url
 *
 *     Variant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the variant
 *         name:
 *           type: string
 *           description: Name of the variant (e.g., size, color)
 *         price:
 *           type: number
 *           format: float
 *           description: Price of the variant
 *       required:
 *         - id
 *         - name
 *         - price
 *
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the wishlist item
 *         wishlistId:
 *           type: string
 *           description: Identifier for the wishlist
 *       required:
 *         - id
 *         - wishlistId
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the cart item
 *         cartId:
 *           type: string
 *           description: Identifier for the cart
 *         quantity:
 *           type: integer
 *           description: Quantity of the product in the cart
 *       required:
 *         - id
 *         - cartId
 *         - quantity
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the order item
 *         orderId:
 *           type: string
 *           description: Identifier for the order
 *         quantity:
 *           type: integer
 *           description: Quantity of the product in the order
 *       required:
 *         - id
 *         - orderId
 *         - quantity
 *
 *     NotFoundError:
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
 *           description: Zod validation error details
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
 *     CategoryCreateInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Rings
 *         description:
 *           type: string
 *           example: "Collection of elegant rings"
 *         altText:
 *           type: string
 *           example: "Rings collection"
 *     CategoryUpdateInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Rings
 *         newName:
 *           type: string
 *           example: "Premium Rings"
 *         description:
 *           type: string
 *           example: "Updated collection of premium rings"
 *         altText:
 *           type: string
 *           example: "Premium rings collection"
 *     CategoryFull:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 4c62f003-d041-4a1f-b8de-749a6cf6df2d
 *         name:
 *           type: string
 *           example: Rings
 *         slug:
 *           type: string
 *           example: rings
 *         description:
 *           type: string
 *           example: "Collection of elegant rings"
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFull'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   path:
 *                     type: array
 *                     items:
 *                       type: string
 *                   message:
 *                     type: string
 *                     description: Error message
 *                     example: "Invalid input"
 *     CreateBlogPost:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - coverImage
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the blog post
 *           example: "My First Blog Post"
 *         content:
 *           type: string
 *           description: Content of the blog post
 *           example: "This is the content of my first blog post."
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: URL of the cover image
 *           example: https://example.com/image.jpg
 *     UpdateBlogPost:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID of the blog post to update
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         title:
 *           type: string
 *           description: Updated title of the blog post
 *           example: "Updated Blog Post Title"
 *         content:
 *           type: string
 *           description: Updated content of the blog post
 *           example: "This is the updated content."
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: Updated URL of the cover image
 *           example: https://example.com/updated-image.jpg
 *     DeleteBlogPost:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID of the blog post to delete
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: strongpassword123
 *         name:
 *           type: string
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *     ProductCreateJsonSchema:
 *       type: object
 *       description: JSON data structure for product creation (used in productData field)
 *       required:
 *         - name
 *         - price
 *         - stock
 *         - metalType
 *         - categoryName
 *         - images
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Name of the product
 *           example: "Diamond Ring"
 *         description:
 *           type: string
 *           description: Product description (optional)
 *           example: "Beautiful diamond ring"
 *         price:
 *           type: number
 *           description: Product price
 *           example: 2999.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Stock quantity
 *           example: 15
 *         metalType:
 *           type: string
 *           minLength: 1
 *           description: Type of metal used
 *           example: "Gold"
 *         discountPct:
 *           type: number
 *           description: Discount percentage (optional)
 *           example: 10.0
 *         discountTime:
 *           type: string
 *           description: Discount expiry time (optional)
 *           example: "2024-12-31T23:59:59Z"
 *         weight:
 *           type: number
 *           description: Product weight (optional)
 *           example: 25.5
 *         size:
 *           type: number
 *           description: Product size (optional)
 *           example: 7.0
 *         categoryName:
 *           type: string
 *           minLength: 1
 *           description: Category name
 *           example: "Rings"
 *         tag:
 *           type: string
 *           description: Product tag (optional)
 *           example: "bestseller"
 *         bannerHeading:
 *           type: string
 *           description: Banner heading (optional)
 *           example: "Premium Collection"
 *         bannerBody:
 *           type: string
 *           description: Banner body text (optional)
 *           example: "Luxury diamond jewelry"
 *         images:
 *           type: array
 *           minItems: 1
 *           description: Array of image metadata
 *           items:
 *             type: object
 *             properties:
 *               altText:
 *                 type: string
 *                 description: Alt text for image (optional)
 *                 example: "Front view of diamond ring"
 *         variants:
 *           type: array
 *           description: Array of product variants (optional)
 *           items:
 *             type: object
 *             required:
 *               - variantName
 *               - stock
 *               - size
 *               - price
 *             properties:
 *               variantName:
 *                 type: string
 *                 description: Name of the variant
 *                 example: "Size 6"
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 description: Variant stock
 *                 example: 5
 *               size:
 *                 type: number
 *                 description: Variant size
 *                 example: 6.0
 *               price:
 *                 type: number
 *                 description: Variant price
 *                 example: 2899.99
 *               altText:
 *                 type: string
 *                 description: Alt text for variant image (optional)
 *                 example: "Size 6 variant"
 *     ProductUpdateJsonSchema:
 *       type: object
 *       description: JSON data structure for product update (used in productData field)
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           minLength: 1
 *           description: Product ID
 *           example: "product-123"
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Updated name (optional)
 *           example: "Platinum Ring"
 *         description:
 *           type: string
 *           description: Updated description (optional)
 *           example: "Beautiful platinum ring"
 *         price:
 *           type: number
 *           description: Updated price (optional)
 *           example: 3999.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Updated stock (optional)
 *           example: 20
 *         metalType:
 *           type: string
 *           description: Updated metal type (optional)
 *           example: "Platinum"
 *         discountPct:
 *           type: number
 *           description: Updated discount percentage (optional)
 *           example: 15.0
 *         discountTime:
 *           type: string
 *           description: Updated discount expiry time (optional)
 *           example: "2024-12-31T23:59:59Z"
 *         weight:
 *           type: number
 *           description: Updated weight (optional)
 *           example: 30.5
 *         size:
 *           type: number
 *           description: Updated size (optional)
 *           example: 8.0
 *         newCategoryName:
 *           type: string
 *           description: New category name (optional)
 *           example: "Premium Rings"
 *         tag:
 *           type: string
 *           description: Updated tag (optional)
 *           example: "luxury"
 *         bannerHeading:
 *           type: string
 *           description: Updated banner heading (optional)
 *           example: "Luxury Collection"
 *         bannerBody:
 *           type: string
 *           description: Updated banner body (optional)
 *           example: "Premium platinum jewelry"
 *         images:
 *           type: array
 *           description: Updated image metadata (optional)
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 minLength: 1
 *                 description: Image ID (optional)
 *                 example: "img-123"
 *               imageUrl:
 *                 type: string
 *                 minLength: 1
 *                 description: Image URL (optional)
 *                 example: "https://example.com/ring.jpg"
 *               altText:
 *                 type: string
 *                 description: Alt text (optional)
 *                 example: "Front view"
 *         variants:
 *           type: array
 *           description: Updated variants (optional)
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 minLength: 1
 *                 description: Variant ID (optional)
 *                 example: "var-123"
 *               variantName:
 *                 type: string
 *                 description: Updated variant name (optional)
 *                 example: "Size 7"
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 description: Updated stock (optional)
 *                 example: 10
 *               price:
 *                 type: number
 *                 description: Updated price (optional)
 *                 example: 3799.99
 *               size:
 *                 type: number
 *                 description: Updated size (optional)
 *                 example: 7.0
 *               imageUrl:
 *                 type: string
 *                 minLength: 1
 *                 description: Updated image URL (optional)
 *                 example: "https://example.com/variant.jpg"
 *               altText:
 *                 type: string
 *                 description: Updated alt text (optional)
 *                 example: "Size 7 variant"
 *     CategoryDataJsonSchema:
 *       type: object
 *       description: JSON data structure for category creation/update (used in categoryData field)
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Category name
 *           example: "Rings"
 *         description:
 *           type: string
 *           description: Category description (optional)
 *           example: "Collection of elegant rings"
 *         altText:
 *           type: string
 *           description: Alt text for category image (optional)
 *           example: "Rings collection"
 *         newName:
 *           type: string
 *           minLength: 1
 *           description: New category name (for update operations, optional)
 *           example: "Premium Rings"
 *     BlogDataJsonSchema:
 *       type: object
 *       description: JSON data structure for blog post creation/update (used in blogData field)
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Blog post ID (for update operations, optional)
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           minLength: 1
 *           description: Blog post title
 *           example: "My First Blog Post"
 *         content:
 *           type: string
 *           minLength: 1
 *           description: Blog post content
 *           example: "This is the content of my first blog post."
 *     ContactMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the contact message.
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: The name of the person who sent the message.
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the sender.
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           description: The phone number of the sender.
 *           example: "+919876543210"
 *         message:
 *           type: string
 *           description: The content of the contact message.
 *           example: "I am interested in your jewelry collection. Please contact me."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the message was created.
 *           example: "2025-09-19T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the message was last updated.
 *           example: "2025-09-19T10:30:00Z"
 *       required:
 *         - id
 *         - name
 *         - email
 *         - phone
 *         - message
 *         - createdAt
 *         - updatedAt
 */

/**
 * @swagger
 * /api/admin/products/create:
 *   post:
 *     tags:
 *       - Admin - Products
 *     summary: Create a new product
 *     description: |
 *       Creates a new jewelry product with images and variants. Requires admin authentication.
 *       
 *       **Important Notes:**
 *       - Product name must be unique (automatically creates URL-friendly slug)
 *       - Category must exist before creating product
 *       - Supports multiple images and product variants
 *       - File uploads: bannerImage (1), productImages (up to 10), variantImages (up to 10)
 *       
 *       **Authentication Required:** Admin role
 *     operationId: createProduct
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productData
 *             properties:
 *               productData:
 *                 type: string
 *                 description: |
 *                   JSON string containing product data with the following structure:
 *                   
 *                   Required fields:
 *                   - name (string): Product name
 *                   - price (number): Product price
 *                   - stock (integer): Stock quantity (min: 0)
 *                   - metalType (string): Type of metal
 *                   - categoryName (string): Category name
 *                   - images (array): Array of image objects with optional altText
 *                   
 *                   Optional fields:
 *                   - description (string): Product description
 *                   - discountPct (number): Discount percentage
 *                   - discountTime (string): Discount expiry time (ISO format)
 *                   - weight (number): Product weight
 *                   - size (number): Product size
 *                   - tag (string): Product tag
 *                   - bannerHeading (string): Banner heading
 *                   - bannerBody (string): Banner body text
 *                   - variants (array): Product variants with variantName, stock, size, price, altText
 *                 example: '{"name":"Diamond Ring","description":"Beautiful diamond ring","metalType":"Gold","price":2999.99,"stock":15,"weight":25.5,"size":7.0,"categoryName":"Rings","tag":"bestseller","bannerHeading":"Premium Collection","bannerBody":"Luxury diamond jewelry","discountPct":10.0,"discountTime":"2024-12-31T23:59:59Z","images":[{"altText":"Front view of diamond ring"},{"altText":"Side view of diamond ring"}],"variants":[{"variantName":"Size 6","stock":5,"size":6.0,"price":2899.99,"altText":"Size 6 variant"}]}'
 *                 x-postman-schema:
 *                   $ref: '#/components/schemas/ProductCreateJsonSchema'
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image for the product (optional)
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (max 10 files)
 *               variantImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Variant images (max 10 files)
 *     responses:
 *       '201':
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Products created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/ProductFull'
 *       '400':
 *         description: Bad Request - Validation errors or business logic violations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: string
 *                       example: "Product with this name already exists."
 *                     - type: string
 *                       example: "Category does not exist."
 *                     - type: string
 *                       example: "Failed to create product"
 *                     - type: object
 *                       description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error - Unexpected server failure
 * 
 * @example
 * # Postman Usage Instructions
 * This endpoint should be used in Postman with the following form-data structure:
 * 
 * Form Data Fields:
 * - productData (Text): JSON string with product information
 * - bannerImage (File): Product banner image (optional)
 * - productImages (File): Multiple product images (max 10)
 * - variantImages (File): Multiple variant images (max 10)
 * 
 * Example productData JSON:
 * ```json
 * {
 *   "name": "Diamond Ring",
 *   "description": "Beautiful diamond ring",
 *   "metalType": "Gold",
 *   "price": 2999.99,
 *   "stock": 15,
 *   "weight": 25.5,
 *   "size": 7.0,
 *   "categoryName": "Rings",
 *   "tag": "bestseller",
 *   "bannerHeading": "Premium Collection",
 *   "bannerBody": "Luxury diamond jewelry",
 *   "discountPct": 10.0,
 *   "discountTime": "2024-12-31T23:59:59Z",
 *   "images": [
 *     {"altText": "Front view of diamond ring"},
 *     {"altText": "Side view of diamond ring"}
 *   ],
 *   "variants": [
 *     {
 *       "variantName": "Size 6",
 *       "stock": 5,
 *       "size": 6.0,
 *       "price": 2899.99,
 *       "altText": "Size 6 variant"
 *     }
 *   ]
 * }
 * ```
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = JSON.parse(req.body.productData);
    const data = createProductSchema.parse(productData);  
    const slug = slugify(data.name);
    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: slug,
      },
    });
    if (existingProduct) {
      res.status(400).json({ error: "Product with this name already exists." });
      return;
    }
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: data.categoryName,
      },
    });
    if (!existingCategory) {
      res.status(400).json({ error: "Category does not exist." });
      return;
    }
    let bannerImageKey: string | null = null;
    const productImageKeys: string[] = [];
    const variantImageKeys: string[] = [];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files["bannerImage"] && files["bannerImage"][0]) {
      bannerImageKey = `products/${slugify(data.name)}/${uuidv4()}.jpg`;
      await uploadFile(files["bannerImage"][0], bannerImageKey);
    }
    if (files["productImages"]) {
      for (const file of files["productImages"]) {
        const productImageKey = `products/${slugify(data.name)}/images/${uuidv4()}.jpg`;
        productImageKeys.push(productImageKey);
        await uploadFile(file, productImageKey);
      }
    }
    if (files["variantImages"]) {
      for (const file of files["variantImages"]) {
        const variantImageKey = `products/${slugify(data.name)}/variants/${uuidv4()}.jpg`;
        variantImageKeys.push(variantImageKey);
        await uploadFile(file, variantImageKey);
      }
    } 
    const product = await prisma.product.create({
      data: {
        id: uuidv4(),
        name: data.name,
        slug: slug,
        description: data.description || "",
        metalType: data.metalType,
        discountPct: data.discountPct || 0,
        discountTime: data.discountTime ? new Date(data.discountTime) : null,
        applyDiscountToVariants: data.applyDiscountToVariants || false,
        weight: data.weight || 0,
        size: data.size || 0,
        stock: data.stock || 0,
        tag: data.tag || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
        price: parseFloat(data.price.toString()),
        bannerBody: data.bannerBody || "",
        bannerHeading: data.bannerHeading || "",
        bannerImage: '/' + bannerImageKey || "",
        category: {
          connect: { id: existingCategory.id },
        },
        images: {
          create: data.images.map((image) => ({
            imageUrl: productImageKeys && productImageKeys.length > 0 ? "/" + productImageKeys.shift() : "",
            altText: image.altText || "",
          })),
        },
        variants: data.variants ? {
          create: data.variants.map((variant) => ({
            variantName: variant.variantName,
            stock: variant.stock,
            price: parseFloat(variant.price.toString()),
            size: variant.size || "",
            imageUrl: variantImageKeys && variantImageKeys.length > 0 ? "/" + variantImageKeys.shift() : "",
            altText: variant.altText || "",
          })),
        } : undefined,
      },
    });
    res.status(201).json({ message: "Products created successfully", product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error });
      return;
    }
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

/**
 * @swagger
 * /api/admin/products/get:
 *   get:
 *     tags:
 *       - Admin - Products
 *     summary: Get all products
 *     description: |
 *       Retrieves a complete list of all products with their associated data.
 *       
 *       **Product Fields Included:**
 *       - Basic info: id, name, slug, description, metalType
 *       - Pricing: price, discountPct, discountTime
 *       - Inventory: stock
 *       - Physical: weight, size
 *       - Marketing: bannerImage, bannerHeading, bannerBody, tag
 *       - Timestamps: createdAt, updatedAt
 *       
 *       **Related Data Included:**
 *       - **Category**: Complete category details (id, name, slug, description, imageUrl, altText)
 *       - **Images**: Array of product images with URLs and alt text
 *       - **Variants**: Array of product variants with pricing, stock, and size info
 *       - **Reviews**: Array of customer reviews with ratings, comments, and recommendations
 *       
 *       **Ordering**: Products ordered by creation date (newest first)
 *       
 *       **No authentication required** - Public endpoint
 *     operationId: getAllProducts
 *     responses:
 *       '200':
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductFull'
 *               example:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "Diamond Ring"
 *                   slug: "diamond-ring"
 *                   description: "Beautiful diamond ring"
 *                   metalType: "Gold"
 *                   price: 2999.99
 *                   discountPct: 10.0
 *                   discountTime: "2024-12-31T23:59:59Z"
 *                   stock: 15
 *                   weight: 25.5
 *                   size: 7.0
 *                   bannerImage: "banner.jpg"
 *                   bannerHeading: "Premium Collection"
 *                   bannerBody: "Luxury diamond jewelry"
 *                   tag: "bestseller"
 *                   categoryId: "cat-123"
 *                   createdAt: "2025-08-08T10:00:00Z"
 *                   updatedAt: "2025-08-08T10:00:00Z"
 *                   category:
 *                     id: "cat-123"
 *                     name: "Rings"
 *                     slug: "rings"
 *                     description: "Collection of beautiful rings"
 *                     imageUrl: "category.jpg"
 *                     altText: "Rings category"
 *                     createdAt: "2025-08-01T10:00:00Z"
 *                     updatedAt: "2025-08-01T10:00:00Z"
 *                   images:
 *                     - id: "img-001"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       imageUrl: "product1.jpg"
 *                       altText: "Front view of diamond ring"
 *                     - id: "img-002"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       imageUrl: "product2.jpg"
 *                       altText: "Side view of diamond ring"
 *                   variants:
 *                     - id: "var-001"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       variantName: "Size 6"
 *                       stock: 5
 *                       price: 2899.99
 *                       size: 6.0
 *                       imageUrl: "variant1.jpg"
 *                       altText: "Size 6 variant"
 *                     - id: "var-002"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       variantName: "Size 8"
 *                       stock: 8
 *                       price: 2999.99
 *                       size: 8.0
 *                       imageUrl: "variant2.jpg"
 *                       altText: "Size 8 variant"
 *                   reviews:
 *                     - id: "123e4567-e89b-12d3-a456-426614174000"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       userId: "user-123"
 *                       rating: 5
 *                       headline: "Absolutely stunning!"
 *                       comment: "This ring exceeded my expectations. The quality is exceptional."
 *                       expectationMet: "EXCEEDED"
 *                       wouldRecommend: true
 *                       createdAt: "2025-08-07T15:30:00Z"
 *                     - id: "123e4567-e89b-12d3-a456-426614174000"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       userId: "user-456"
 *                       rating: 4
 *                       headline: "Beautiful design"
 *                       comment: "Love the design, fits perfectly."
 *                       expectationMet: "MET"
 *                       wouldRecommend: true
 *                       createdAt: "2025-08-06T12:15:00Z"
 *       '500':
 *         description: Internal Server Error - Database or server failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch products"
 *                 message:
 *                   type: string
 *                   example: "Database connection failed"
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
        variants: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products", message: error instanceof Error ? error.message : "Unknown error" });
    return;
  }
};

/**
 * @swagger
 * /api/admin/products/update:
 *   put:
 *     tags:
 *       - Admin - Products
 *     summary: Update an existing product
 *     description: |
 *       Updates an existing product identified by its current name. Supports partial updates.
 *       
 *       **Key Features:**
 *       - Find product by current name (converted to slug)
 *       - Can rename product using 'newName' field
 *       - Can change category using 'newCategoryName'
 *       - Replaces all images and variants with new data
 *       - Supports file uploads for images
 *       
 *       **Authentication Required:** Admin role
 *     operationId: updateProduct
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productData
 *             properties:
 *               productData:
 *                 type: string
 *                 description: |
 *                   JSON string containing product update data with the following structure:
 *                   
 *                   Required fields:
 *                   - id (string): Product ID to update
 *                   
 *                   Optional update fields:
 *                   - name (string): Updated product name
 *                   - description (string): Updated description
 *                   - price (number): Updated price
 *                   - stock (integer): Updated stock (min: 0)
 *                   - metalType (string): Updated metal type
 *                   - newCategoryName (string): New category name
 *                   - discountPct (number): Updated discount percentage
 *                   - discountTime (string): Updated discount expiry (ISO format)
 *                   - weight (number): Updated weight
 *                   - size (number): Updated size
 *                   - tag (string): Updated tag
 *                   - bannerHeading (string): Updated banner heading
 *                   - bannerBody (string): Updated banner body
 *                   - images (array): Updated image objects (replaces all existing)
 *                   - variants (array): Updated variants (replaces all existing)
 *                 example: '{"id":"product-123","name":"Diamond Ring","description":"Updated premium diamond ring","price":3499.99,"stock":20,"newCategoryName":"Premium Rings","metalType":"White Gold","weight":30.0,"size":7.5,"discountPct":15.0,"images":[{"id":"img-1","altText":"Updated front view"},{"altText":"New side view"}],"variants":[{"id":"var-1","variantName":"Size 6.5","stock":8,"size":6.5,"price":3399.99,"altText":"Size 6.5 variant"}]}'
 *                 x-postman-schema:
 *                   $ref: '#/components/schemas/ProductUpdateJsonSchema'
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: New banner image (optional)
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New product images (optional, replaces all existing)
 *               variantImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New variant images (optional, replaces all existing)
 *     responses:
 *       '200':
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/ProductFull'
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: object
 *                       description: Zod validation errors
 *                     - type: string
 *                       example: "Failed to update product"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 *       '500':
 *         description: Internal Server Error - Database or server failure
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productData = JSON.parse(req.body.productData);
    const data = updateProductSchema.parse(productData);

    if (!data.id) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }
    const existingProduct = await prisma.product.findUnique({
      where: { id: data.id },
    });
    if (!existingProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (data.name) {
      const existingNameProduct = await prisma.product.findUnique({
        where: { slug: slugify(data.name) },
      });
      if (existingNameProduct && existingNameProduct.id !== data.id) {
        res.status(400).json({ error: "Another product with this name already exists." });
        return;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name || existingProduct.name,
        slug: data.name ? slugify(data.name) : existingProduct.slug,
        description: data.description || existingProduct.description,
        price: data.price || existingProduct.price,
        stock: data.stock || existingProduct.stock,
        metalType: data.metalType || existingProduct.metalType,
        discountPct: data.discountPct || existingProduct.discountPct,
        discountTime: data.discountTime ? new Date(data.discountTime) : existingProduct.discountTime,
        applyDiscountToVariants: data.applyDiscountToVariants || existingProduct.applyDiscountToVariants,
        weight: data.weight || existingProduct.weight,
        size: data.size || existingProduct.size,
        tag: data.tag || existingProduct.tag,
        isActive: data.isActive !== undefined ? data.isActive : existingProduct.isActive,
        bannerHeading: data.bannerHeading || existingProduct.bannerHeading,
        bannerBody: data.bannerBody || existingProduct.bannerBody,
        categoryId: data.newCategoryName ? (await prisma.category.findUnique({ where: { name: data.newCategoryName } }))?.id : existingProduct.categoryId
      }
    });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (req.files && files["bannerImage"] && files["bannerImage"][0]) {
      if (existingProduct.bannerImage) {
        await deleteFile(existingProduct.bannerImage.replace("/", ""));
      }
      const bannerImageKey = `products/${updatedProduct.slug}/${uuidv4()}.jpg`;
      await uploadFile(files["bannerImage"][0], bannerImageKey);
      await prisma.product.update({
        where: { id: updatedProduct.id },
        data: { bannerImage: '/' + bannerImageKey }
      });
    }

    if (data.images && data.images.length > 0) {
      for (const image of data.images) {
        const productImage = await prisma.productImage.findUnique({
          where: { id: image.id },
        });
        if (productImage) {
          await prisma.productImage.update({
            where: { id: productImage.id },
            data: { altText: image.altText || productImage.altText },
          });
        }
      }
    }
    
    if (data.productImages && data.productImages.length > 0) {
      for (const image of data.productImages) {
        const productImage = await prisma.productImage.findUnique({
          where: { id: image.id },
        });
        if (productImage) {
          if (productImage.imageUrl) {
            await deleteFile(productImage.imageUrl.replace("/", ""));
          }
          const key = `products/${updatedProduct.slug}/images/${uuidv4()}.jpg`;
          for (const file of files["productImages"]) {
            if (file.originalname === image.fileName) {
              await uploadFile(file, key);
            }
          }
          await prisma.productImage.update({
            where: { id: productImage.id },
            data: { imageUrl: '/' + key }
          });
        }
      }
    }

    if (data.newProductImages && data.newProductImages.length > 0) {
      for (const image of data.newProductImages) {
        const key = `products/${updatedProduct.slug}/images/${uuidv4()}.jpg`;
        for (const file of files["productImages"]) {
          if (file.originalname === image.fileName) {
            await uploadFile(file, key);
          }
        }
        await prisma.productImage.create({
          data: {
            productId: updatedProduct.id,
            imageUrl: '/' + key,
            altText: image.altText || ""
          }
        });
      }
    }

    if (data.deleteProductImages && data.deleteProductImages.length > 0) {
      for (const image of data.deleteProductImages) {
        const productImage = await prisma.productImage.findUnique({
          where: { id: image.id }
        });
        if (productImage) {
          if (productImage.imageUrl) {
            await deleteFile(productImage.imageUrl.replace("/", ""));
          }
          await prisma.productImage.delete({
            where: { id: image.id }
          });
        }
      }
    }

    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        const productVariant = await prisma.productVariant.findUnique({
          where: { id: variant.id },
        });
        if (productVariant) {
          await prisma.productVariant.update({
            where: { id: productVariant.id },
            data: {
              variantName: variant.variantName || productVariant.variantName,
              stock: variant.stock || productVariant.stock,
              price: variant.price || productVariant.price,
              size: variant.size || productVariant.size,
              altText: variant.altText || productVariant.altText,
            },
          });
        }
      }
    }

    if (data.variantImages && data.variantImages.length > 0) {
      for (const variant of data.variantImages) {
        const productVariant = await prisma.productVariant.findUnique({
          where: { id: variant.id },
        });
        if (productVariant) {
          if (productVariant.imageUrl) {
            await deleteFile(productVariant.imageUrl.replace("/", ""));
          }
          const key = `products/${updatedProduct.slug}/variants/${uuidv4()}.jpg`;
          for (const file of files["variantImages"]) {
            if (file.originalname === variant.fileName) {
              await uploadFile(file, key);
            }
          }
          await prisma.productVariant.update({
            where: { id: productVariant.id },
            data: { imageUrl: '/' + key }
          });
        }
      }
    }
 
    if (data.newVariants && data.newVariants.length > 0) {
      for (const variant of data.newVariants) {
        const key = `products/${updatedProduct.slug}/variants/${uuidv4()}.jpg`;
        for (const file of files["variantImages"]) {
          if (file.originalname === variant.fileName) {
            await uploadFile(file, key);
          }
        }
        await prisma.productVariant.create({
          data: {
            productId: updatedProduct.id,
            variantName: variant.variantName,
            stock: variant.stock,
            price: variant.price,
            size: variant.size,
            altText: variant.altText || "",
            imageUrl: '/' + key
          }
        });
      }
    }

    if (data.deleteVariants && data.deleteVariants.length > 0) {
      for (const variant of data.deleteVariants) {
        const variantId = await prisma.productVariant.findUnique({
          where: { id: variant.id }
        });
        if (variantId) {
          if (variantId.imageUrl) {
            await deleteFile(variantId.imageUrl.replace("/", ""));
          }
          await prisma.productVariant.delete({
            where: { id: variant.id }
          });
        }
      }
    }
 
    res.status(200).json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product", details: error instanceof Error ? error.message : undefined });
  }
};

/**
 * @swagger
 * /api/admin/products/delete:
 *   delete:
 *     tags:
 *       - Admin - Products
 *     summary: Delete a product
 *     description: |
 *       Permanently deletes a product and all its associated data.
 *       
 *       **WARNING: This action is irreversible!**
 *       
 *       **What gets deleted:**
 *       - Product record
 *       - All product images and variants
 *       - All customer reviews and review media
 *       - All cart items containing this product
 *       - All wishlist items containing this product
 *       - All order items (historical orders)
 *       - All user activity logs
 *       - All recommendation records
 *       
 *       **Authentication Required:** Admin role
 *     operationId: deleteProductByName
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Exact name of the product to delete
 *                 example: "Diamond Ring"
 *             example:
 *               name: "Diamond Ring"
 *     responses:
 *       '200':
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       '400':
 *         description: Bad Request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: object
 *                       description: Zod validation errors
 *                     - type: string
 *                       example: "Failed to delete product"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 *       '500':
 *         description: Internal Server Error - Database or server failure
 */
export const deleteProductByName = async (req: Request, res: Response) => {
  try {
    const data = deleteProductByNameSchema.parse(req.body);
    const product = await prisma.product.findUnique({
      where: {
        slug: slugify(data.name),
      },
      include: {
        reviews: {
          include: {
            reviewMedia: true,
          },
        },
        images: true,
        variants: true,
        cartItems: true,
        wishlistItems: true,
        orderItems: true,
      },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const orders = await prisma.orderItem.findMany({
      where: { productId: product.id },
    });
    if (orders && orders.length > 0) {
      res.status(400).json({ error: "Cannot delete product associated with existing orders" });
      return;
    }
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await deleteFile(image.imageUrl.replace("/", ""));
      }
    }
    await prisma.productImage.deleteMany({
      where: {
        productId: product.id,
      },
    });

    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.imageUrl) {
          await deleteFile(variant.imageUrl.slice(1));
        }
      }
    }
    await prisma.productVariant.deleteMany({
      where: {
        productId: product.id,
      },
    });

    if (product.reviews && product.reviews.length > 0) {
      for (const review of product.reviews) {
        if (review.reviewMedia && review.reviewMedia.length > 0) {
          for (const media of review.reviewMedia) {
            if (media.mediaUrl) {
              await deleteFile(media.mediaUrl.replace("/", ""));
            }
          }
        }
      }
    }
    await prisma.reviewMedia.deleteMany({
      where: {
        review: {
          productId: product.id,
        },
      },
    });
    await prisma.review.deleteMany({
      where: { productId: product.id },
    });

    if (product.bannerImage) {
      await deleteFile(product.bannerImage.replace("/", ""));
    }

    await prisma.cartItem.deleteMany({
      where: { productId: product.id },
    });
    await prisma.wishlistItem.deleteMany({
      where: { productId: product.id },
    });
    await prisma.userActivityLog.deleteMany({
      where: { productId: product.id },
    });
    await prisma.recommendedProduct.deleteMany({
      where: { productId: product.id },
    });
    await prisma.product.delete({
      where: {
        id: product.id,
      },
    });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error });
      return;
    }
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * @swagger
 * /api/admin/categories/create:
 *   post:
 *     tags:
 *       - Admin - Categories
 *     summary: Create a new category
 *     description: |
 *       Creates a new product category with an optional image.
 *       
 *       **Important Notes:**
 *       - Category name must be unique
 *       - Automatically generates URL-friendly slug
 *       - Supports image upload for category display
 *       
 *       **Authentication Required:** Admin role
 *     operationId: createCategory
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - categoryData
 *             properties:
 *               categoryData:
 *                 type: string
 *                 description: |
 *                   JSON string containing category data with the following structure:
 *                   
 *                   Required fields:
 *                   - name (string): Category name
 *                   
 *                   Optional fields:
 *                   - description (string): Category description
 *                   - altText (string): Alt text for category image
 *                 example: '{"name":"Rings","description":"Collection of beautiful rings","altText":"Rings category image"}'
 *                 x-postman-schema:
 *                   $ref: '#/components/schemas/CategoryDataJsonSchema'
 *                 x-postman-media-type: application/json
 *               categoryImage:
 *                 type: string
 *                 format: binary
 *                 description: Category display image (optional)
 *     responses:
 *       '201':
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 category:
 *                   $ref: '#/components/schemas/CategoryFull'
 *       '400':
 *         description: Bad Request - Validation errors or duplicate category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: string
 *                       example: "Category with this name already exists"
 *                     - type: string
 *                       example: "Error Creating category"
 *                     - type: array
 *                       description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error
 * 
 * @example
 * # Postman Usage Instructions
 * This endpoint should be used in Postman with the following form-data structure:
 * 
 * Form Data Fields:
 * - categoryData (Text): JSON string with category information
 * - categoryImage (File): Category display image (optional)
 * 
 * Example categoryData JSON:
 * ```json
 * {
 *   "name": "Rings",
 *   "description": "Collection of beautiful rings",
 *   "altText": "Rings category image"
 * }
 * ```
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = JSON.parse(req.body.categoryData);
    const data = createCategorySchema.parse(categoryData);
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: data.name,
      },
    });
    if (existingCategory) {
      res.status(400).json({ error: "Category with this name already exists" });
      return;
    }
    const key = `categories/${slugify(data.name)}/${uuidv4()}.jpg`;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files['categoryImage'] && files['categoryImage'][0]) {
      await uploadFile(files['categoryImage'][0], key);
    }
    const slug = slugify(data.name);
    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name: data.name,
        slug: slug,
        description: data.description,
        imageUrl: "/" + key,
        altText: data.altText || "",
      },
    });
    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Creating category error:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Error Creating category", details: (error as Error).message });
  }
};

/**
 * @swagger
 * /api/admin/categories/get:
 *   get:
 *     tags:
 *       - Admin - Categories
 *     summary: Get all categories
 *     description: |
 *       Retrieves a complete list of all product categories.
 *       
 *       **Returns:**
 *       - All category details (name, description, image, etc.)
 *       - Ordered by creation date (newest first)
 *       
 *       **No authentication required** - Public endpoint
 *     operationId: getAllCategories
 *     responses:
 *       '200':
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryFull'
 *               example:
 *                 - id: "cat-123"
 *                   name: "Rings"
 *                   slug: "rings"
 *                   description: "Collection of beautiful rings"
 *                   imageUrl: "category.jpg"
 *                   altText: "Rings category"
 *                   createdAt: "2025-08-08T10:00:00Z"
 *                   updatedAt: "2025-08-08T10:00:00Z"
 *       '500':
 *         description: Internal Server Error - Database or server failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Fetching categories error: Database connection failed"
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Fetching categories error:", error);
    res.status(500).json({
      error: "Fetching categories error: " + (error as Error).message,
    });
  }
};

/**
 * @swagger
 * /api/admin/categories/update:
 *   put:
 *     tags:
 *       - Admin - Categories
 *     summary: Update an existing category
 *     description: |
 *       Updates an existing category identified by its current name.
 *       
 *       **Features:**
 *       - Find category by current name
 *       - Can rename category using 'newName' field
 *       - Supports partial updates (only provided fields are updated)
 *       - Can update category image
 *       
 *       **Authentication Required:** Admin role
 *     operationId: updateCategory
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - categoryData
 *             properties:
 *               categoryData:
 *                 type: string
 *                 description: |
 *                   JSON string containing category update data with the following structure:
 *                   
 *                   Required fields:
 *                   - name (string): Current category name
 *                   
 *                   Optional fields:
 *                   - newName (string): New category name
 *                   - description (string): Updated description
 *                   - altText (string): Updated alt text for category image
 *                 example: '{"name":"Rings","newName":"Premium Rings","description":"Updated collection of premium rings","altText":"Premium rings category"}'
 *                 x-postman-schema:
 *                   $ref: '#/components/schemas/CategoryDataJsonSchema'
 *                 x-postman-media-type: application/json
 *               categoryImage:
 *                 type: string
 *                 format: binary
 *                 description: New category image (optional)
 *     responses:
 *       '200':
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 category:
 *                   $ref: '#/components/schemas/CategoryFull'
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Category not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Updating category error: Database connection failed"
 * 
 * @example
 * # Postman Usage Instructions
 * This endpoint should be used in Postman with the following form-data structure:
 * 
 * Form Data Fields:
 * - categoryData (Text): JSON string with category update information
 * - categoryImage (File): New category image (optional)
 * 
 * Example categoryData JSON:
 * ```json
 * {
 *   "name": "Rings",
 *   "newName": "Premium Rings",
 *   "description": "Updated collection of premium rings",
 *   "altText": "Premium rings category"
 * }
 * ```
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = JSON.parse(req.body.categoryData);
    const data = updateCategorySchema.parse(categoryData);

    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (!existingCategory) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    if (data.newName && data.newName == data.name) {
      res.status(400).json({ error: "New name must be different from the current name" });
      return;
    }

    let key: string | null = null;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files['categoryImage'] && files['categoryImage'][0]) {
      key = data.newName ? `categories/${slugify(data.newName)}/${uuidv4()}.jpg` : `categories/${slugify(data.name)}/${uuidv4()}.jpg`;
      if (existingCategory.imageUrl) {
        await deleteFile(existingCategory.imageUrl.replace("/", ""));
      }
      await uploadFile(files['categoryImage'][0], key);
      await prisma.category.update({
        where: { id: existingCategory.id },
        data: { imageUrl: '/' + key }
      });
    }
  
    if (data.newName && data.name !== data.newName) {
      await renameFolder(`categories/${slugify(data.name)}`, `categories/${slugify(data.newName)}`);
      const oldKey = existingCategory.imageUrl;
      if (oldKey && !key) {
        const newKey = oldKey.replace(`categories/${slugify(data.name)}`, `categories/${slugify(data.newName)}`);
        await prisma.category.update({
          where: { id: existingCategory.id },
          data: { imageUrl: newKey }
        });
      }
    }
    const updateCategory = await prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        name: data.newName ?? data.name,
        slug: data.newName ? slugify(data.newName) : slugify(data.name),
        description: data.description ?? existingCategory.description,
        altText: data.altText || existingCategory.altText,
      },
    });
    res.status(200).json({
      message: "Category updated successfully",
      category: updateCategory,
    });
  } catch (error) {
    console.error("Updating category error:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({
        error: "Updating category error: " + (error as Error).message,
      });
    }
  }
};

/**
 * @swagger
 * /api/admin/categories/delete:
 *   delete:
 *     tags:
 *       - Admin - Categories
 *     summary: Delete a category
 *     description: |
 *       Permanently deletes a category.
 *       
 *       **RESTRICTION:** Cannot delete categories that contain products
 *       
 *       **Before deletion, the system checks:**
 *       - Category exists
 *       - No products are assigned to this category
 *       
 *       **Authentication Required:** Admin role
 *     operationId: deleteCategoryByName
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Exact name of the category to delete
 *                 example: "Rings"
 *             example:
 *               name: "Rings"
 *     responses:
 *       '200':
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *       '400':
 *         description: Bad Request - Category has products or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cannot delete category with existing products"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Category not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Deleting category error: Database connection failed"
 */
export const deleteCategoryByName = async (req: Request, res: Response) => {
  try {
    const data = deleteCategorySchema.parse(req.body);
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (!existingCategory) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const productsInCategory = await prisma.product.findMany({
      where: { categoryId: existingCategory.id },
    });
    if (productsInCategory.length > 0) {
      res.status(400).json({ error: "Cannot delete category with existing products" });
      return;
    }
    if (existingCategory.imageUrl) {
      await deleteFile(existingCategory.imageUrl.replace("/", ""));
    }
    await prisma.category.delete({
      where: { name: data.name },
    });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Deleting category error:", error);
    res
      .status(500)
      .json({ error: "Deleting category error: " + (error as Error).message });
  }
};

/**
 * @swagger
 * /api/admin/reviews/get:
 *   get:
 *     tags:
 *       - Admin - Reviews
 *     summary: Get all customer reviews
 *     description: |
 *       Retrieves all customer reviews with comprehensive details.
 *       
 *       **Includes:**
 *       - Review content (rating, comment, headline)
 *       - Product information (ID, name)
 *       - Customer information (name, email, city, discovery source)
 *       - Review media (images/videos)
 *       - Expectation and recommendation data
 *       
 *       **Authentication Required:** Admin role
 *     operationId: getReviews
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Review ID
 *                       productId:
 *                         type: string
 *                         description: Product ID
 *                       productName:
 *                         type: string
 *                         description: Product name
 *                       userName:
 *                         type: string
 *                         description: Customer name
 *                       city:
 *                         type: string
 *                         nullable: true
 *                         description: Customer city
 *                       email:
 *                         type: string
 *                         description: Customer email
 *                       rating:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 5
 *                         description: Star rating (1-5)
 *                       comment:
 *                         type: string
 *                         nullable: true
 *                         description: Review comment
 *                       headline:
 *                         type: string
 *                         nullable: true
 *                         description: Review headline
 *                       expectationMet:
 *                         type: string
 *                         enum: [DID_NOT_MEET, ALMOST_MET, MET, EXCEEDED, GREATLY_EXCEEDED]
 *                         nullable: true
 *                         description: How well product met expectations
 *                       wouldRecommend:
 *                         type: boolean
 *                         nullable: true
 *                         description: Would customer recommend this product
 *                       firstDiscover:
 *                         type: string
 *                         nullable: true
 *                         description: How customer discovered the product
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             mediaUrl:
 *                               type: string
 *                               nullable: true
 *                             mediaType:
 *                               type: string
 *                               enum: [IMAGE, VIDEO]
 *                               nullable: true
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "No reviews found"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
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
export const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            addresses: {
              select: {
                city: true,
              },
            },
            firstDiscover: true,
          },
        },
        reviewMedia: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!reviews || reviews.length === 0) {
      res.status(200).json({ error: "No reviews found" });
      return;
    }
    const result = reviews.map((review: typeof reviews[0]) => ({
      id: review.id,
      productId: review.product.id,
      productName: review.product.name,
      userName: review.user.name,
      city:
        review.user.addresses.length > 0 ? review.user.addresses[0].city : null,
      email: review.user.email,
      rating: review.rating,
      comment: review.comment,
      headline: review.headline,
      expectationMet: review.expectationMet,
      wouldRecommend: review.wouldRecommend,
      firstDiscover: review.user.firstDiscover,
      media: review.reviewMedia.map((media: typeof review.reviewMedia[0]) => ({
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
      })),
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/admin/reviews/delete:
 *   delete:
 *     tags:
 *       - Admin - Reviews
 *     summary: Delete a customer review
 *     description: |
 *       Permanently deletes a customer review by its ID.
 *       
 *       **WARNING:** This action is irreversible!
 *       
 *       **What gets deleted:**
 *       - Review record
 *       - Associated review media (images/videos)
 *       
 *       **Authentication Required:** Admin role
 *     operationId: deleteReview
 *     security:
 *       - cookieAuth: []
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
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '200':
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review deleted successfully"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Review not found"
 *       '500':
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
    const data = deleteReviewSchema.parse(req.body);
    const review = await prisma.review.findUnique({
      where: { id: data.id },
      include: {
        reviewMedia: true,
      }
    });
    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    if (review.reviewMedia && review.reviewMedia.length > 0) {
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

/**
 * @swagger
 * /api/admin/blogs/create:
 *   post:
 *     tags:
 *       - Admin - Blogs
 *     summary: Create a new blog post
 *     description: |
 *       Creates a new blog post with cover image.
 *       
 *       **Features:**
 *       - Automatically generates URL-friendly slug from title
 *       - Associates blog post with authenticated admin user
 *       - Supports cover image upload
 *       
 *       **Authentication Required:** Admin role
 *     operationId: createBlogPost
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog post title
 *                 example: "Top 10 Jewelry Trends for 2025"
 *               content:
 *                 type: string
 *                 description: Blog post content (supports HTML/Markdown)
 *                 example: "Discover the latest jewelry trends that will dominate 2025..."
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image for the blog post (optional)
 *     responses:
 *       '200':
 *         description: Blog post created successfully
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
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 content:
 *                   type: string
 *                 coverImage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const data = createBlogPostSchema.parse(req.body);
    let userId: string | null = null;
    if (req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const key = `blogs/${uuidv4()}.jpg`;
    const files = req.files as Express.Multer.File[];
    if (files) {
      await uploadFile(files[0], key);
    }
    const blogPost = await prisma.blog.create({
      data: {
        id: uuidv4(),
        userId: userId,
        title: data.title,
        slug: slugify(data.title),
        content: data.content,
        coverImage: "/" + key,
      },
    });
    res.status(200).json(blogPost);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error creating blog post:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * @swagger
 * /api/admin/blogs/update:
 *   put:
 *     tags:
 *       - Admin - Blogs
 *     summary: Update an existing blog post
 *     description: |
 *       Updates an existing blog post by ID. Supports partial updates.
 *       
 *       **Features:**
 *       - Update title, content, or cover image
 *       - Regenerates slug if title is changed
 *       - Only provided fields are updated
 *       
 *       **Authentication Required:** Admin role
 *     operationId: updateBlogPost
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the blog post to update
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               title:
 *                 type: string
 *                 description: Updated blog post title (optional)
 *                 example: "Updated: Top 10 Jewelry Trends for 2025"
 *               content:
 *                 type: string
 *                 description: Updated blog post content (optional)
 *                 example: "Updated content with new trends..."
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: New cover image (optional)
 *     responses:
 *       '200':
 *         description: Blog post updated successfully
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
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 content:
 *                   type: string
 *                 coverImage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Blog post not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const data = updateBlogPostSchema.parse(req.body);
    const existingPost = await prisma.blog.findUnique({
      where: { id: data.id },
    });
    if (!existingPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    const key = `blogs/${uuidv4()}.jpg`;
    const files = req.files as Express.Multer.File[];
    if (files && files[0]) {
      if (existingPost.coverImage) {
        await deleteFile(existingPost.coverImage.replace("/", ""));
      }
      await uploadFile(files[0], key);
    }
    const blogPost = await prisma.blog.update({
      where: { id: data.id },
      data: {
        title: data.title ? data.title : existingPost.title,
        slug: data.title ? slugify(data.title) : existingPost.slug,
        content: data.content ? data.content : existingPost.content,
        coverImage: req.files ? "/" + key : existingPost.coverImage,
      },
    });
    res.status(200).json(blogPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    }
    console.error("Error updating blog post:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * @swagger
 * /api/admin/blogs/delete:
 *   delete:
 *     tags:
 *       - Admin - Blogs
 *     summary: Delete a blog post
 *     description: |
 *       Permanently deletes a blog post by ID and returns updated blog list.
 *       
 *       **WARNING:** This action is irreversible!
 *       
 *       **After deletion:**
 *       - Returns updated list of all remaining blog posts
 *       - Blog posts ordered by creation date (newest first)
 *       
 *       **Authentication Required:** Admin role
 *     operationId: deleteBlogPost
 *     security:
 *       - cookieAuth: []
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
 *                 description: ID of the blog post to delete
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '200':
 *         description: Blog post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Blog post deleted successfully"
 *                 blogs:
 *                   type: array
 *                   description: Updated list of remaining blog posts
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       content:
 *                         type: string
 *                       coverImage:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   description: Zod validation errors
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Blog post not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const data = deleteBlogPostSchema.parse(req.body);
    const existingPost = await prisma.blog.findUnique({
      where: { id: data.id },
    });
    if (!existingPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    if (existingPost.coverImage) {
      await deleteFile(existingPost.coverImage.replace("/", ""));
    }
    await prisma.blog.delete({
      where: { id: data.id },
    });
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ message: "Blog post deleted successfully", blogs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error deleting blog post:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * @swagger
 * /api/admin/users/create:
 *   post:
 *     tags:
 *       - Admin - Users
 *     summary: Create a new user account
 *     description: |
 *       Creates a new user account with admin privileges.
 *       
 *       **Features:**
 *       - Creates user with encrypted password
 *       - Validates email uniqueness
 *       - Supports both USER and ADMIN roles
 *       - Phone number validation (Indian format: +91XXXXXXXXXX)
 *       - Password requirements: min 8 chars, uppercase, lowercase, numbers
 *       
 *       **Authentication Required:** Admin role
 *     operationId: createUser
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Unique email address
 *                 example: "jane.smith@example.com"
 *               phone:
 *                 type: string
 *                 pattern: "^\\+91\\d{10}$"
 *                 description: Phone number in Indian format (+91 followed by 10 digits)
 *                 example: "+919876543210"
 *               password:
 *                 type: string
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$"
 *                 description: Strong password (min 8 chars, uppercase, lowercase, numbers)
 *                 example: "SecurePass123"
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 description: User role
 *                 example: "USER"
 *             example:
 *               name: "Jane Smith"
 *               email: "jane.smith@example.com"
 *               phone: "+919876543210"
 *               password: "SecurePass123"
 *               role: "USER"
 *     responses:
 *       '201':
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               name: "Jane Smith"
 *               email: "jane.smith@example.com"
 *               phone: "+919876543210"
 *               role: "USER"
 *               isEmailVerified: false
 *               isSmsVerified: false
 *               isEmailSubscribed: false
 *               createdAt: "2025-08-08T10:00:00Z"
 *               updatedAt: "2025-08-08T10:00:00Z"
 *       '400':
 *         description: Bad Request - Validation errors or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: string
 *                       example: "User with this email already exists"
 *                     - type: array
 *                       description: Zod validation errors
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: array
 *                             items:
 *                               type: string
 *                           message:
 *                             type: string
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      res.status(400).json({ error: "User with this phone number already exists" });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role,
        isEmailVerified: true,
        isSmsVerified: true
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error creating user:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * @swagger
 * /api/admin/users/get:
 *   get:
 *     tags:
 *       - Admin - Users
 *     summary: Get all users
 *     description: |
 *       Retrieves a complete list of all registered users in the system.
 *       
 *       **Returns:**
 *       - All user information (excluding password hash for security)
 *       - User profile data, roles, verification status
 *       - Contact information and preferences
 *       
 *       **Authentication Required:** Admin role
 *     operationId: getAllUsers
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *               example:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   phone: "+911234567890"
 *                   role: "USER"
 *                   isEmailVerified: true
 *                   isSmsVerified: false
 *                   isEmailSubscribed: true
 *                   gender: "MALE"
 *                   profileImageUrl: null
 *                   dateOfBirth: null
 *                   lastLoginAt: "2025-08-07T15:30:00Z"
 *                   firstDiscover: "Google"
 *                   createdAt: "2025-08-01T10:00:00Z"
 *                   updatedAt: "2025-08-07T15:30:00Z"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/admin/users/update:
 *   put:
 *     tags:
 *       - Admin - Users
 *     summary: Update an existing user account
 *     description: |
 *       Updates an existing user account with new information.
 *       
 *       **Features:**
 *       - Updates user profile information
 *       - Supports partial updates (optional fields)
 *       - Password encryption for security
 *       - Email and phone validation
 *       - Role modification capability
 *       - Profile image upload support
 *       
 *       **Authentication Required:** Admin role
 *     operationId: updateUser
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier of the user to update
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               name:
 *                 type: string
 *                 description: Full name of the user (optional)
 *                 example: "Jane Smith Updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (optional)
 *                 example: "jane.updated@example.com"
 *               phone:
 *                 type: string
 *                 pattern: "^\\+91\\d{10}$"
 *                 description: Phone number in Indian format (optional)
 *                 example: "+919876543211"
 *               password:
 *                 type: string
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$"
 *                 description: New password (optional)
 *                 example: "NewSecurePass123"
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 description: User role (optional)
 *                 example: "ADMIN"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (optional)
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               name: "Jane Smith Updated"
 *               email: "jane.updated@example.com"
 *               phone: "+919876543211"
 *               role: "ADMIN"
 *     responses:
 *       '200':
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               name: "Jane Smith Updated"
 *               email: "jane.updated@example.com"
 *               phone: "+919876543211"
 *               role: "ADMIN"
 *               isEmailVerified: true
 *               isSmsVerified: false
 *               isEmailSubscribed: false
 *               profileImageUrl: "https://example.com/uploads/profile.jpg"
 *               createdAt: "2025-08-08T10:00:00Z"
 *               updatedAt: "2025-08-09T12:00:00Z"
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: array
 *                       description: Zod validation errors
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: array
 *                             items:
 *                               type: string
 *                           message:
 *                             type: string
 *                       example:
 *                         - path: ["id"]
 *                           message: "User ID is required"
 *                         - path: ["email"]
 *                           message: "Invalid email address"
 *                         - path: ["phone"]
 *                           message: "Phone number must be in the 10 digit"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Not Found - User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: data.id },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        res.status(400).json({ error: "User with this email already exists" });
        return;
      }
    }
    if (data.phone && data.phone !== user.phone) { 
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        res.status(400).json({ error: "User with this phone number already exists" });
        return;
      }
    }
    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name ? data.name : user.name,
        email: data.email ? data.email : user.email,
        phone: data.phone ? data.phone : user.phone,
        role: data.role ? data.role : user.role,
        passwordHash: data.passwordHash ? data.passwordHash : user.passwordHash,
        isEmailVerified: data.isEmailVerified ?  data.isEmailVerified : user.isEmailVerified,
        isSmsVerified: data.isSmsVerified ? data.isSmsVerified : user.isSmsVerified,
      },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @swagger
 * /api/admin/users/delete:
 *   delete:
 *     tags:
 *       - Admin - Users
 *     summary: Delete a user account
 *     description: |
 *       Permanently deletes a user account and all associated data.
 *       
 *       **Warning:** This action is irreversible and will delete:
 *       - User profile and authentication data
 *       - Profile images from storage
 *       - All user addresses
 *       - Order history
 *       - Wishlist items
 *       - Cart contents
 *       - Product recommendations
 *       - Reviews and review media
 *       - Blog posts authored by user
 *       - Refresh tokens and activity logs
 *       
 *       **Authentication Required:** Admin role
 *     operationId: deleteUser
 *     security:
 *       - cookieAuth: []
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
 *                 description: Unique identifier of the user to delete
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '204':
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       '400':
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   oneOf:
 *                     - type: array
 *                       description: Zod validation errors
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: array
 *                             items:
 *                               type: string
 *                           message:
 *                             type: string
 *                       example:
 *                         - path: ["id"]
 *                           message: "User ID is required"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '404':
 *         description: Not Found - User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Detailed error message
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if (req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    const data = deleteUserSchema.parse(req.body);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (userId === data.id) {
      res.status(400).json({ error: "Admin cannot delete their own account" });
      return;
    } 
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      include: {
        addresses: true,
        orders: true,
        wishlist: true,
        cart: true,
        recommendedProducts: true,
        reviews: {
          include: {
            reviewMedia: true
          }
        },
        refreshTokens: true,
        userActivities: true,
        blogs: true
      }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.profileImageUrl) {
      await deleteFile(user.profileImageUrl);
    }
    if (user.addresses.length > 0) {
      await prisma.address.deleteMany({
        where: { userId: user.id },
      });
    }
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
    });
    for (const order of orders) {
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id },
      });
    }
    await prisma.order.deleteMany({
      where: { userId: user.id },
    });

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: user.id },
    });
    for (const wishlist of wishlists) {
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id },
      });
    }
    await prisma.wishlist.deleteMany({
      where: { userId: user.id },
    });

    const carts = await prisma.cart.findMany({
      where: { userId: user.id },
    });
    for (const cart of carts) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
    await prisma.cart.deleteMany({
      where: { userId: user.id },
    });
    
    await prisma.recommendedProduct.deleteMany({
      where: { userId: user.id },
    });
    await prisma.blog.deleteMany({
      where: { userId: user.id },
    });
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
    await prisma.userActivityLog.deleteMany({
      where: { userId: user.id },
    });

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: { reviewMedia: true },
    });
    if (reviews.length > 0) {
      await prisma.reviewMedia.deleteMany({
        where: { reviewId: { in: reviews.map((review: typeof reviews[0]) => review.id) } },
      });
      await prisma.review.deleteMany({
        where: { userId: user.id },
      });
    }
    await prisma.user.delete({
      where: { id: user.id },
    });
    res.status(204).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error deleting user:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @swagger
 * /api/admin/orders/update-status:
 *   put:
 *     tags:
 *       - Admin - Orders
 *     summary: Update order status
 *     description: |
 *       Updates the status of an existing order. Only certain status transitions are allowed.
 *       
 *       **Available Status Options:**
 *       - PAYMENT_SUCCESS: Payment has been successfully processed
 *       - READY_FOR_PICKUP: Order is ready for customer pickup
 *       - DELIVERED: Order has been delivered to customer
 *       - RETURNED: Order has been returned by customer
 *       
 *       **Authentication Required:** Admin role
 *     operationId: updateOrderStatus
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Unique identifier of the order to update
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               status:
 *                 type: string
 *                 enum: [PAYMENT_SUCCESS, READY_FOR_PICKUP, DELIVERED, RETURNED]
 *                 description: New status for the order
 *                 example: "DELIVERED"
 *             example:
 *               orderId: "123e4567-e89b-12d3-a456-426614174000"
 *               status: "DELIVERED"
 *     responses:
 *       '200':
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Order ID
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 status:
 *                   type: string
 *                   description: Updated order status
 *                   example: "DELIVERED"
 *                 totalAmount:
 *                   type: number
 *                   format: decimal
 *                   description: Total order amount
 *                   example: 1299.99
 *                 userId:
 *                   type: string
 *                   description: ID of the user who placed the order
 *                   example: "user123"
 *                 paymentMethod:
 *                   type: string
 *                   enum: [COD, CARD, UPI, NETBANKING]
 *                   description: Payment method used
 *                   example: "CARD"
 *                 deliveryMethod:
 *                   type: string
 *                   enum: [SHIPPING, STORE]
 *                   description: Delivery method
 *                   example: "SHIPPING"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Order creation timestamp
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Order last update timestamp
 *                   example: "2024-01-16T14:45:00.000Z"
 *       '400':
 *         description: Bad Request - Validation errors
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
 *                         example: "invalid_enum_value"
 *                       message:
 *                         type: string
 *                         example: "Invalid status"
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["status"]
 *               example:
 *                 error:
 *                   - code: "invalid_enum_value"
 *                     message: "Invalid status"
 *                     path: ["status"]
 *       '401':
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized access"
 *       '403':
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access forbidden: Admin role required"
 *       '404':
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Additional error details
 *                   example: "Database connection failed"
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const data = updateOrderStatusSchema.parse(req.body);
    
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const updatedOrder = await prisma.order.update({
      where: { id: data.orderId },
      data: { orderStatus: data.status },
    });
    res.status(200).json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error updating order status:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @swagger
 * /api/admin/contact-messages/get:
 *   get:
 *     tags:
 *       - Admin - Contact Messages
 *     summary: Get all contact messages
 *     description: |
 *       Retrieves a complete list of all contact messages submitted through the contact form.
 *       
 *       **Returns:**
 *       - All contact messages ordered by creation date (newest first)
 *       - Contact information including name, email, phone, and message content
 *       - Creation and update timestamps
 *       
 *       **Authentication Required:** Admin role
 *     operationId: getContactMessages
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Contact messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContactMessage'
 *                   example:
 *                     - id: "123e4567-e89b-12d3-a456-426614174000"
 *                       name: "John Doe"
 *                       email: "john.doe@example.com"
 *                       phone: "+919876543210"
 *                       message: "I am interested in your jewelry collection. Please contact me."
 *                       createdAt: "2025-09-19T10:30:00Z"
 *                       updatedAt: "2025-09-19T10:30:00Z"
 *                     - id: "456e7890-e12b-34c5-d678-901234567890"
 *                       name: "Jane Smith"
 *                       email: "jane.smith@example.com"
 *                       phone: "+918765432109"
 *                       message: "Do you have any diamond rings available?"
 *                       createdAt: "2025-09-18T14:15:00Z"
 *                       updatedAt: "2025-09-18T14:15:00Z"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "No contact messages found"
 *       '401':
 *         description: Unauthorized - Invalid or missing authentication token
 *       '403':
 *         description: Forbidden - User is not an admin
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export const getContactMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (messages.length === 0) {
      res.status(200).json({ message: "No contact messages found" });
      return;
    }
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};