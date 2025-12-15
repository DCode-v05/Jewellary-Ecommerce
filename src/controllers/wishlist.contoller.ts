import { Request, Response } from 'express';
import { prisma } from "../utils/prisma";
import { getUserId } from '../utils/getUserId';
import { v4 as uuidv4 } from 'uuid';
import { createWishlistSchema, deleteWishlistSchema } from '../validators/wishlist.validator';
import { z } from "zod";

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management APIs for authenticated users. Allows users to save products for later purchase.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductImage:
 *       type: object
 *       description: Product image information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the image
 *           example: "img_123456"
 *         imageUrl:
 *           type: string
 *           description: URL to the product image
 *           example: "https://example.com/images/product1.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the image (accessibility)
 *           example: "Gold Ring Product Image"
 *         productId:
 *           type: string
 *           description: ID of the product this image belongs to
 *           example: "prod_123456"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the image was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the image was last updated
 *       required:
 *         - id
 *         - imageUrl
 *         - productId
 *         - createdAt
 *         - updatedAt
 *
 *     ProductCategory:
 *       type: object
 *       description: Product category information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the category
 *           example: "cat_123456"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Rings"
 *       required:
 *         - id
 *         - name
 *
 *     WishlistProduct:
 *       type: object
 *       description: Product information in wishlist context
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the product
 *           example: "prod_123456"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Gold Diamond Ring"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed product description
 *           example: "Beautiful 18k gold ring with diamond setting"
 *         slug:
 *           type: string
 *           description: URL-friendly version of product name
 *           example: "gold-diamond-ring"
 *         price:
 *           type: string
 *           description: Product price in decimal format
 *           example: "1299.99"
 *         size:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Product size
 *           example: 7.5
 *         discountPct:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Discount percentage applied to the product
 *           example: 15.50
 *         discountTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Discount expiration time (ISO 8601 format)
 *           example: "2025-12-31T23:59:59.000Z"
 *         applyDiscountToVariants:
 *           type: boolean
 *           nullable: true
 *           description: Whether discount applies to product variants
 *           example: true
 *         images:
 *           type: array
 *           description: Array of product images
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         category:
 *           $ref: '#/components/schemas/ProductCategory'
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - price
 *         - images
 *         - category
 *
 *     WishlistItem:
 *       type: object
 *       description: Individual item in user's wishlist
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the wishlist item
 *           example: "witem_123456"
 *         productId:
 *           type: string
 *           description: ID of the product in the wishlist
 *           example: "prod_123456"
 *         variantId:
 *           type: string
 *           nullable: true
 *           description: ID of the product variant in the wishlist (if applicable)
 *           example: "variant_123456"
 *         product:
 *           allOf:
 *             - $ref: '#/components/schemas/WishlistProduct'
 *             - nullable: true
 *           description: Product details (null if product was deleted)
 *         variant:
 *           type: object
 *           nullable: true
 *           description: Product variant details (if applicable)
 *           properties:
 *             id:
 *               type: string
 *               description: Variant identifier
 *             name:
 *               type: string
 *               description: Name of the variant
 *             price:
 *               type: string
 *               description: Variant price in decimal format
 *             size:
 *               type: number
 *               description: Variant size
 *             images:
 *               type: string
 *               description: Variant image URL or path
 *       required:
 *         - id
 *         - productId
 *
 *     WishlistResponse:
 *       type: array
 *       description: List of items in user's wishlist
 *       items:
 *         $ref: '#/components/schemas/WishlistItem'
 *
 *     WishlistCreateRequest:
 *       type: object
 *       description: Request body for adding product to wishlist
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to add to wishlist
 *           example: "prod_123456"
 *           minLength: 1
 *         variantId:
 *           type: string
 *           nullable: true
 *           description: ID of the product variant to add to wishlist (optional)
 *           example: "variant_123456"
 *       required:
 *         - productId
 *
 *     WishlistDeleteRequest:
 *       type: object
 *       description: Request body for removing product from wishlist
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to remove from wishlist
 *           example: "prod_123456"
 *           minLength: 1
 *         variantId:
 *           type: string
 *           nullable: true
 *           description: ID of the product variant to remove from wishlist (optional)
 *           example: "variant_123456"
 *       required:
 *         - productId
 *
 *     WishlistCreateResponse:
 *       type: object
 *       description: Response when adding product to wishlist
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the wishlist
 *           example: "wish_123456"
 *         userId:
 *           type: string
 *           description: ID of the user who owns the wishlist
 *           example: "user_123456"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the wishlist was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the wishlist was last updated
 *       required:
 *         - id
 *         - userId
 *         - createdAt
 *         - updatedAt
 *
 *     WishlistDeleteResponse:
 *       type: object
 *       description: Response when removing product from wishlist
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Wishlist item deleted successfully"
 *         wishlist:
 *           type: object
 *           description: Updated wishlist information
 *           properties:
 *             id:
 *               type: string
 *               example: "wish_123456"
 *             userId:
 *               type: string
 *               example: "user_123456"
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *             wishlistItems:
 *               type: array
 *               description: Remaining items in wishlist
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   productId:
 *                     type: string
 *                   wishlistId:
 *                     type: string
 *       required:
 *         - message
 *         - wishlist
 *
 *     ValidationErrorResponse:
 *       type: object
 *       description: Validation error response from Zod schema validation
 *       properties:
 *         error:
 *           type: array
 *           description: Array of validation error details
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Error code
 *                 example: "too_small"
 *               minimum:
 *                 type: number
 *                 description: Minimum required value (if applicable)
 *                 example: 1
 *               type:
 *                 type: string
 *                 description: Data type
 *                 example: "string"
 *               inclusive:
 *                 type: boolean
 *                 description: Whether minimum is inclusive
 *                 example: true
 *               exact:
 *                 type: boolean
 *                 description: Whether exact match is required
 *                 example: false
 *               message:
 *                 type: string
 *                 description: Human-readable error message
 *                 example: "String must contain at least 1 character(s)"
 *               path:
 *                 type: array
 *                 description: Path to the field with error
 *                 items:
 *                   type: string
 *                 example: ["productId"]
 *       required:
 *         - error
 *
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Unauthorized"
 *       required:
 *         - error
 *
 *     WishlistNotFoundResponse:
 *       type: object
 *       description: Response when user has no wishlist
 *       properties:
 *         error:
 *           type: string
 *           description: Error message indicating no wishlist found
 *           example: "Wishlist not found"
 *       required:
 *         - error
 *
 *     WishlistItemNotFoundResponse:
 *       type: object
 *       description: Response when trying to delete non-existent wishlist item
 *       properties:
 *         error:
 *           type: string
 *           description: Error message indicating wishlist item not found
 *           example: "Wishlist item not found"
 *       required:
 *         - error
 */


/**
 * @swagger
 * /api/wishlist/create:
 *   post:
 *     summary: Add a product to user's wishlist
 *     description: |
 *       Adds a product to the authenticated user's wishlist. If the user doesn't have a wishlist yet, 
 *       it creates a new one. If the wishlist already exists, it adds the product to the existing wishlist.
 *       
 *       **Authentication Required**: This endpoint requires a valid JWT token in cookies.
 *       
 *       **Behavior**:
 *       - Creates new wishlist if user doesn't have one (returns 201)
 *       - Adds product to existing wishlist (returns 200)
 *       - Product ID must be valid and exist in the database
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistCreateRequest'
 *           examples:
 *             addProduct:
 *               summary: Add product to wishlist
 *               value:
 *                 productId: "prod_123456789"
 *     responses:
 *       200:
 *         description: Product successfully added to existing wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistCreateResponse'
 *             examples:
 *               existingWishlist:
 *                 summary: Product added to existing wishlist
 *                 value:
 *                   id: "wish_123456789"
 *                   userId: "user_123456789"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T14:25:30.000Z"
 *       201:
 *         description: New wishlist created and product added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistCreateResponse'
 *             examples:
 *               newWishlist:
 *                 summary: New wishlist created with product
 *                 value:
 *                   id: "wish_123456789"
 *                   userId: "user_123456789"
 *                   createdAt: "2024-01-15T14:25:30.000Z"
 *                   updatedAt: "2024-01-15T14:25:30.000Z"
 *       400:
 *         description: Validation error - Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               missingProductId:
 *                 summary: Missing productId
 *                 value:
 *                   error:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["productId"]
 *                       message: "Required"
 *               emptyProductId:
 *                 summary: Empty productId
 *                 value:
 *                   error:
 *                     - code: "too_small"
 *                       minimum: 1
 *                       type: "string"
 *                       inclusive: true
 *                       exact: false
 *                       message: "String must contain at least 1 character(s)"
 *                       path: ["productId"]
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: No authentication token
 *                 value:
 *                   error: "Unauthorized"
 *       500:
 *         description: Internal server error - Database or server issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   error: "Internal server error"
 */
export const createWishlist = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = createWishlistSchema.parse(req.body);
        const existingWishlist = await prisma.wishlist.findFirst({
            where: { userId: user },
            include: { wishlistItems: true }
        });
        if(existingWishlist) {
            if (data.variantId) {
                if (existingWishlist.wishlistItems.some(item => item.variantId === data.variantId)) {
                    res.status(400).json({ error: "Variant already in wishlist" });
                    return;
                }
            }
            else {
                if (existingWishlist.wishlistItems.some(item => item.productId === data.productId)) {
                    res.status(400).json({ error: "Product already in wishlist" });
                    return;
                }
            }
            const wishlist = await prisma.wishlist.update({
                where: { id: existingWishlist.id },
                data: {
                    wishlistItems: {
                        create: [
                            {
                                id: uuidv4(),
                                productId: data.productId,
                                variantId: data.variantId || null,
                            }
                        ]
                    }
                }
            });
            res.status(200).json(wishlist);
            return;
        }
        const wishlist = await prisma.wishlist.create({
            data: {
                id: uuidv4(),
                userId: user,
                wishlistItems: {
                    create: [
                        {
                            id: uuidv4(),
                            productId: data.productId,
                            variantId: data.variantId || null,
                        }
                    ]
                }
            }
        });
        res.status(201).json(wishlist);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        console.error("Error creating wishlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * @swagger
 * /api/wishlist/get:
 *   get:
 *     summary: Retrieve user's wishlist
 *     description: |
 *       Fetches all items in the authenticated user's wishlist with complete product details.
 *       Returns an empty array if the user has no wishlist or the wishlist is empty.
 *       
 *       **Authentication Required**: This endpoint requires a valid JWT token in cookies.
 *       
 *       **Response Details**:
 *       - Returns array of wishlist items with full product information
 *       - Each item includes product details like name, price, images, and category
 *       - Product can be null if the product was deleted from the system
 *       - Returns special error object if user has no wishlist at all
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved wishlist items or wishlist not found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/WishlistResponse'
 *                 - $ref: '#/components/schemas/WishlistNotFoundResponse'
 *             examples:
 *               wishlistWithItems:
 *                 summary: Wishlist with products
 *                 value:
 *                   - id: "witem_123456789"
 *                     productId: "prod_123456789"
 *                     product:
 *                       id: "prod_123456789"
 *                       name: "Gold Diamond Ring"
 *                       description: "Beautiful 18k gold ring with diamond setting"
 *                       slug: "gold-diamond-ring"
 *                       price: "1299.99"
 *                       images:
 *                         - id: "img_123456789"
 *                           imageUrl: "https://example.com/images/ring1.jpg"
 *                           altText: "Gold Diamond Ring Front View"
 *                           productId: "prod_123456789"
 *                           createdAt: "2024-01-15T10:30:00.000Z"
 *                           updatedAt: "2024-01-15T10:30:00.000Z"
 *                       category:
 *                         id: "cat_123456789"
 *                         name: "Rings"
 *                   - id: "witem_987654321"
 *                     productId: "prod_987654321"
 *                     product:
 *                       id: "prod_987654321"
 *                       name: "Silver Necklace"
 *                       description: "Elegant silver chain necklace"
 *                       slug: "silver-necklace"
 *                       price: "599.99"
 *                       images:
 *                         - id: "img_987654321"
 *                           imageUrl: "https://example.com/images/necklace1.jpg"
 *                           altText: "Silver Necklace"
 *                           productId: "prod_987654321"
 *                           createdAt: "2024-01-15T11:00:00.000Z"
 *                           updatedAt: "2024-01-15T11:00:00.000Z"
 *                       category:
 *                         id: "cat_987654321"
 *                         name: "Necklaces"
 *               emptyWishlist:
 *                 summary: Empty wishlist
 *                 value: []
 *               wishlistNotFound:
 *                 summary: User has no wishlist
 *                 value:
 *                   error: "Wishlist not found"
 *               deletedProduct:
 *                 summary: Wishlist item with deleted product
 *                 value:
 *                   - id: "witem_123456789"
 *                     productId: "prod_deleted"
 *                     product: null
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: No authentication token
 *                 value:
 *                   error: "Unauthorized"
 *       500:
 *         description: Internal server error - Database or server issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   error: "Internal server error"
 */
export const getWishlist = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const wishlist = await prisma.wishlist.findFirst({
            where: { userId: user },
            include: { 
                wishlistItems: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                variants: true,
                                category: true,
                                reviews: true
                            }
                        },
                        variant: true
                    }
                },
            },
        });
        if(!wishlist) {
            res.status(200).json({ error: "Wishlist not found" });
            return;
        }
        const result = {
            wishlistId: wishlist.id,
            items: wishlist.wishlistItems.map((item: typeof wishlist.wishlistItems[0]) => ({
                wishlistItemId: item.id,
                productId: item.productId,
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    description: item.product.description,
                    slug: item.product.slug,
                    price: item.product.price,
                    size: item.product.size,
                    stock: item.product.stock,
                    isActive: item.product.isActive,
                    discountPct: item.product.discountPct,  
                    discountTime: item.product.discountTime,
                    applyDiscountToVariants: item.product.applyDiscountToVariants,
                    reviewCount: item.product.reviews.length,
                    averageRating: item.product.reviews.length > 0 ? (item.product.reviews.reduce((sum, r) => sum + r.rating, 0) / item.product.reviews.length).toFixed(1) : 0,
                    images: item.product.images,
                    category: {
                        id: item.product.category.id,
                        name: item.product.category.name
                    }
                } : null,
                variant: item.variant ? {
                    id: item.variant.id,
                    name: item.variant.variantName,
                    price: item.variant.price,
                    stock: item.variant.stock,
                    images: item.variant.imageUrl,
                    size: item.variant.size
                } : null
            }))
        };
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * /api/wishlist/delete:
 *   delete:
 *     summary: Remove a product from user's wishlist
 *     description: |
 *       Removes a specific product from the authenticated user's wishlist by product ID.
 *       Returns the updated wishlist information after successful deletion.
 *       
 *       **Authentication Required**: This endpoint requires a valid JWT token in cookies.
 *       
 *       **Behavior**:
 *       - Finds and removes the wishlist item containing the specified product
 *       - Returns success message with updated wishlist details
 *       - Returns error message if the product is not in the wishlist
 *       - Product ID must be provided and valid
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistDeleteRequest'
 *           examples:
 *             removeProduct:
 *               summary: Remove product from wishlist
 *               value:
 *                 productId: "prod_123456789"
 *     responses:
 *       200:
 *         description: Product successfully removed from wishlist or item not found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/WishlistDeleteResponse'
 *                 - $ref: '#/components/schemas/WishlistItemNotFoundResponse'
 *             examples:
 *               successfulDeletion:
 *                 summary: Product successfully removed
 *                 value:
 *                   message: "Wishlist item deleted successfully"
 *                   wishlist:
 *                     id: "wish_123456789"
 *                     userId: "user_123456789"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T14:25:30.000Z"
 *                     wishlistItems:
 *                       - id: "witem_987654321"
 *                         productId: "prod_987654321"
 *                         wishlistId: "wish_123456789"
 *               itemNotFound:
 *                 summary: Product not in wishlist
 *                 value:
 *                   error: "Wishlist item not found"
 *       400:
 *         description: Validation error - Invalid request body or missing product ID
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingProductId:
 *                 summary: Missing productId in request body
 *                 value:
 *                   error:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["productId"]
 *                       message: "Required"
 *               emptyProductId:
 *                 summary: Empty productId
 *                 value:
 *                   error:
 *                     - code: "too_small"
 *                       minimum: 1
 *                       type: "string"
 *                       inclusive: true
 *                       exact: false
 *                       message: "String must contain at least 1 character(s)"
 *                       path: ["productId"]
 *               productIdRequired:
 *                 summary: Product ID is required (fallback validation)
 *                 value:
 *                   error: "Product ID is required"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: No authentication token
 *                 value:
 *                   error: "Unauthorized"
 *       500:
 *         description: Internal server error - Database or server issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   error: "Internal server error"
 */
export const deleteWishlistItem = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = deleteWishlistSchema.parse(req.body);
        if (!data.wishlistItemId) {
            res.status(400).json({ error: "Wishlist item ID is required" });
            return;
        }
        
        const wishlistItem = await prisma.wishlistItem.findFirst({
            where: { id: data.wishlistItemId }
        });
        
        if (!wishlistItem) {
            res.status(200).json({ error: "Wishlist item not found" });
            return;
        }

        await prisma.wishlistItem.delete({
            where: { id: wishlistItem.id }
        });
        const updatedWishlist = await prisma.wishlist.findFirst({
            where: { userId: user },
            include: {
                wishlistItems: true
            }
        });
        res.status(200).json({ message: "Wishlist item deleted successfully", wishlist: updatedWishlist });
    } catch (error) {
        console.error("Error deleting wishlist item:", error);
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};