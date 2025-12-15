import { Request, Response } from 'express';
import { prisma } from "../utils/prisma";
import { getUserId } from '../utils/getUserId';
import { v4 as uuidv4 } from 'uuid';
import { createCartSchema, updateCartSchema, deleteCartSchema } from '../validators/cart.validator';
import { z } from "zod";

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management APIs for authenticated users. All endpoints require valid authentication cookie (accessToken).
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     CookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: JWT access token stored in HTTP-only cookie
 *   schemas:
 *     ProductInCart:
 *       type: object
 *       description: Product information included in cart items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique product identifier
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Gold Ring"
 *         price:
 *           type: number
 *           format: decimal
 *           description: Current product price
 *           example: 299.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity
 *           example: 25
 *         description:
 *           type: string
 *           nullable: true
 *           description: Product description
 *           example: "Beautiful gold ring with intricate design"
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
 *           description: Product images
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Image identifier
 *               imageUrl:
 *                 type: string
 *                 format: url
 *                 description: Image URL
 *                 example: "https://example.com/images/ring1.jpg"
 *               altText:
 *                 type: string
 *                 nullable: true
 *                 description: Alternative text for image
 *                 example: "Gold ring front view"
 *     CartItemResponse:
 *       type: object
 *       description: Individual cart item with product details
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Cart item identifier
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Product identifier
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Product variant identifier (if applicable)
 *           example: "789e0123-e89b-12d3-a456-426614174222"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product in cart
 *           example: 2
 *         product:
 *           $ref: '#/components/schemas/ProductInCart'
 *         variant:
 *           type: object
 *           nullable: true
 *           description: Product variant details (if applicable)
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Variant identifier
 *             name:
 *               type: string
 *               description: Name of the variant
 *             price:
 *               type: number
 *               format: decimal
 *               description: Variant price
 *             size:
 *               type: number
 *               format: decimal
 *               description: Variant size
 *             images:
 *               type: string
 *               description: Variant image URL or path
 *             stock:
 *               type: integer
 *               description: Available stock for this variant
 *     CartResponse:
 *       type: array
 *       description: List of cart items for the authenticated user
 *       items:
 *         $ref: '#/components/schemas/CartItemResponse'
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product to add to cart
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the product variant to add to cart (optional)
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Quantity of the product to add (defaults to 1 if not provided)
 *           example: 2
 *     UpdateCartRequest:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product to update in cart
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the product variant to update in cart (optional)
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: New quantity for the cart item
 *           example: 3
 *     DeleteFromCartRequest:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product to remove from cart
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the product variant to remove from cart (optional)
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *     CartItemUpdateResponse:
 *       type: object
 *       description: Response when cart item is updated or created
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Cart item identifier
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Product identifier
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Product variant identifier (if applicable)
 *           example: "789e0123-e89b-12d3-a456-426614174222"
 *         quantity:
 *           type: integer
 *           description: Updated quantity
 *           example: 3
 *         cartId:
 *           type: string
 *           format: uuid
 *           description: Cart identifier
 *           example: "789e0123-e89b-12d3-a456-426614174222"
 *     FullCartResponse:
 *       type: object
 *       description: Complete cart object returned when new cart is created
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Cart identifier
 *           example: "789e0123-e89b-12d3-a456-426614174222"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User identifier
 *           example: "user123-e89b-12d3-a456-426614174333"
 *         cartItems:
 *           type: array
 *           description: List of cart items
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               productId:
 *                 type: string
 *                 format: uuid
 *               variantId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               quantity:
 *                 type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Cart creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Cart last update timestamp
 *     DeleteCartResponse:
 *       type: object
 *       description: Response when cart item is successfully deleted
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Cart item deleted successfully"
 *         cart:
 *           type: object
 *           description: Updated cart after deletion
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "789e0123-e89b-12d3-a456-426614174222"
 *             userId:
 *               type: string
 *               format: uuid
 *               example: "user123-e89b-12d3-a456-426614174333"
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *             cartItems:
 *               type: array
 *               description: Remaining cart items after deletion
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   productId:
 *                     type: string
 *                     format: uuid
 *                   quantity:
 *                     type: integer
 *                   cartId:
 *                     type: string
 *                     format: uuid
 *     NoCartFoundResponse:
 *       type: object
 *       description: Response when user has no cart
 *       properties:
 *         error:
 *           type: string
 *           example: "No Cart found"
 *     CartNotFoundResponse:
 *       type: object
 *       description: Response when cart is not found during operations
 *       properties:
 *         error:
 *           type: string
 *           example: "Cart not found"
 *     CartItemNotFoundResponse:
 *       type: object
 *       description: Response when specific cart item is not found
 *       properties:
 *         error:
 *           type: string
 *           example: "Cart item not found"
 *     ValidationErrorResponse:
 *       type: object
 *       description: Response for validation errors (Zod validation failures)
 *       properties:
 *         error:
 *           type: array
 *           description: Array of validation error details
 *           items:
 *             type: object
 *             properties:
 *               path:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *               code:
 *                 type: string
 *     UnauthorizedErrorResponse:
 *       type: object
 *       description: Response for unauthorized access
 *       properties:
 *         error:
 *           type: string
 *           example: "Unauthorized"
 *     BadRequestErrorResponse:
 *       type: object
 *       description: Response for bad request errors
 *       properties:
 *         error:
 *           type: string
 *           example: "Product ID is required"
 *     InternalServerErrorResponse:
 *       type: object
 *       description: Response for internal server errors
 *       properties:
 *         error:
 *           type: string
 *           example: "Internal server error"
 */

/**
 * @swagger
 * /api/cart/create:
 *   post:
 *     summary: Add product to cart
 *     description: |
 *       Adds a product to the user's shopping cart. If the user doesn't have a cart, creates a new one.
 *       If the product already exists in the cart, increases the quantity by the specified amount.
 *       If the user already has a cart but the product is not in it, adds the product to the existing cart.
 *       
 *       **Authentication Required:** User must be authenticated with a valid accessToken cookie.
 *       
 *       **Behavior:**
 *       - New user (no cart): Creates cart with the product (Status 201)
 *       - Existing cart, new product: Adds product to cart (Status 200)  
 *       - Existing cart, existing product: Increases quantity (Status 200)
 *     tags: [Cart]
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *           examples:
 *             add_single_item:
 *               summary: Add single item
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 quantity: 1
 *             add_multiple_items:
 *               summary: Add multiple quantities
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 quantity: 3
 *             add_without_quantity:
 *               summary: Add item (default quantity)
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '201':
 *         description: New cart created successfully with the product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FullCartResponse'
 *             example:
 *               id: "789e0123-e89b-12d3-a456-426614174222"
 *               userId: "user123-e89b-12d3-a456-426614174333"
 *               cartItems:
 *                 - id: "456e7890-e89b-12d3-a456-426614174111"
 *                   productId: "123e4567-e89b-12d3-a456-426614174000"
 *                   quantity: 1
 *               createdAt: "2025-08-09T10:30:00.000Z"
 *               updatedAt: "2025-08-09T10:30:00.000Z"
 *       '200':
 *         description: Product added to existing cart or quantity updated
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CartItemUpdateResponse'
 *                 - $ref: '#/components/schemas/FullCartResponse'
 *             examples:
 *               quantity_updated:
 *                 summary: Existing product quantity increased
 *                 value:
 *                   id: "456e7890-e89b-12d3-a456-426614174111"
 *                   productId: "123e4567-e89b-12d3-a456-426614174000"
 *                   quantity: 3
 *                   cartId: "789e0123-e89b-12d3-a456-426614174222"
 *               new_product_added:
 *                 summary: New product added to existing cart
 *                 value:
 *                   id: "789e0123-e89b-12d3-a456-426614174222"
 *                   userId: "user123-e89b-12d3-a456-426614174333"
 *                   cartItems:
 *                     - id: "456e7890-e89b-12d3-a456-426614174111"
 *                       productId: "123e4567-e89b-12d3-a456-426614174000"
 *                       quantity: 2
 *                     - id: "567e8901-e89b-12d3-a456-426614174444"
 *                       productId: "234e5678-e89b-12d3-a456-426614174555"
 *                       quantity: 1
 *       '400':
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/BadRequestErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   error:
 *                     - path: ["productId"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *               missing_product_id:
 *                 summary: Product ID missing
 *                 value:
 *                   error: "Product ID is required"
 *       '401':
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
export const createCart = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = createCartSchema.parse(req.body);
        if(!data.productId) {
            res.status(400).json({ error: "Product ID is required" });
            return;
        }
        if(data.variantId) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: data.variantId }
            });
            if (variant && variant.stock < 1) {
                res.status(400).json({ error: "Insufficient stock for the selected variant" });
                return;
            }
            const variantInCart = await prisma.cartItem.findFirst({
                where: { variantId: data.variantId, cart: { userId: user } }
            });
            if (variant && variantInCart && variant.stock - variantInCart.quantity < 0) {
                res.status(400).json({ error: "Insufficient stock for the selected variant" });
                return;
            }
        }
        else {
            const product = await prisma.product.findUnique({
                where: { id: data.productId }
            });
            if (product && product.stock < 1) {
                res.status(400).json({ error: "Insufficient stock for the selected product" });
                return;
            }
            const ProductInCart = await prisma.cartItem.findFirst({
                where: { productId: data.productId, cart: { userId: user } }
            });
            if (product && ProductInCart && product.stock - ProductInCart.quantity < 0) {
                res.status(400).json({ error: "Insufficient stock for the selected product" });
                return;
            }
        }
        const existingCart = await prisma.cart.findFirst({
            where: { userId: user }
        });
        if(existingCart) {
            const existingCartItem = await prisma.cartItem.findFirst({
                where: { 
                cartId: existingCart.id, 
                productId: data.productId, 
                variantId: data.variantId || null }
            });
            if(existingCartItem) {
                const updatedCartItem = await prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: existingCartItem.quantity + (data.quantity || 1) }
                });
                res.status(200).json(updatedCartItem);
                return;
            }
            const cart = await prisma.cart.update({
                where: { id: existingCart.id },
                data: {
                    cartItems: {
                        create: [
                            {
                                id: uuidv4(),
                                productId: data.productId,
                                variantId: data.variantId || null,
                                quantity: data.quantity || 1
                            }
                        ]
                    }
                }
            });
            res.status(200).json(cart);
            return;
        }
        const cart = await prisma.cart.create({
            data: {
                id: uuidv4(),
                userId: user,
                cartItems: {
                    create: [
                        {
                            id: uuidv4(),
                            productId: data.productId,
                            variantId: data.variantId || null,
                            quantity: data.quantity || 1
                        }
                    ]
                }
            }
        });
        res.status(201).json(cart);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error creating cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * @swagger
 * /api/cart/get:
 *   get:
 *     summary: Get current user's cart
 *     description: |
 *       Retrieves the authenticated user's shopping cart with all cart items and their associated product details.
 *       Returns an array of cart items, each containing product information including images.
 *       
 *       **Authentication Required:** User must be authenticated with a valid accessToken cookie.
 *       
 *       **Response Format:**
 *       - Success: Array of cart items with full product details
 *       - No cart: Object with error message indicating no cart found
 *       
 *       **Product Details Included:**
 *       - Basic product info (id, name, price, description)
 *       - Product images with URLs and alt text
 *       - Cart-specific info (quantity, cart item ID)
 *     tags: [Cart]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       '200':
 *         description: Cart retrieved successfully or no cart found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CartResponse'
 *                 - $ref: '#/components/schemas/NoCartFoundResponse'
 *             examples:
 *               cart_with_items:
 *                 summary: Cart with products
 *                 value:
 *                   - id: "456e7890-e89b-12d3-a456-426614174111"
 *                     productId: "123e4567-e89b-12d3-a456-426614174000"
 *                     quantity: 2
 *                     product:
 *                       id: "123e4567-e89b-12d3-a456-426614174000"
 *                       name: "Gold Ring"
 *                       price: 299.99
 *                       description: "Beautiful gold ring with intricate design"
 *                       images:
 *                         - id: "img123-e89b-12d3-a456-426614174666"
 *                           imageUrl: "https://example.com/images/ring1.jpg"
 *                           altText: "Gold ring front view"
 *                         - id: "img124-e89b-12d3-a456-426614174777"
 *                           imageUrl: "https://example.com/images/ring2.jpg"
 *                           altText: "Gold ring side view"
 *                   - id: "567e8901-e89b-12d3-a456-426614174222"
 *                     productId: "234e5678-e89b-12d3-a456-426614174111"
 *                     quantity: 1
 *                     product:
 *                       id: "234e5678-e89b-12d3-a456-426614174111"
 *                       name: "Silver Necklace"
 *                       price: 149.99
 *                       description: "Elegant silver necklace"
 *                       images:
 *                         - id: "img125-e89b-12d3-a456-426614174888"
 *                           imageUrl: "https://example.com/images/necklace1.jpg"
 *                           altText: "Silver necklace"
 *               empty_cart:
 *                 summary: No cart found
 *                 value:
 *                   error: "No Cart found"
 *       '401':
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
export const getCart = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const cart = await prisma.cart.findFirst({
            where: { userId: user },
            select: {
                id: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                cartItems: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                variants: true,
                                category: true
                            }
                        },
                        variant: true
                    }
                }
            }
        });

        if(!cart) {
            res.status(200).json({ error: "No Cart found" });
            return;
        }
        const result= {
            cartId: cart.id,
            items: cart.cartItems.map((item: typeof cart.cartItems[0]) => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    price: item.product.price,
                    stock: item.product.stock,
                    isActive: item.product.isActive,
                    description: item.product.description,
                    size: item.product.size,
                    discountPct: item.product.discountPct,
                    discountTime: item.product.discountTime,
                    applyDiscountToVariants: item.product.applyDiscountToVariants,
                    images: item.product.images
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
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Internal server error"});
    }
}

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Update quantity of a cart item
 *     description: |
 *       Updates the quantity of a specific product in the user's cart. Both productId and quantity are required.
 *       The quantity will be set to the exact value provided (not added to existing quantity).
 *       
 *       **Authentication Required:** User must be authenticated with a valid accessToken cookie.
 *       
 *       **Requirements:**
 *       - User must have an existing cart
 *       - Product must already exist in the cart
 *       - Quantity must be at least 1
 *       
 *       **Behavior:**
 *       - Sets the cart item quantity to the exact value specified
 *       - Returns the updated cart item details
 *       - Returns error messages with 200 status for business logic errors (cart/item not found)
 *     tags: [Cart]
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartRequest'
 *           examples:
 *             update_quantity:
 *               summary: Update item quantity
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 quantity: 5
 *             reduce_quantity:
 *               summary: Reduce quantity to minimum
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 quantity: 1
 *     responses:
 *       '200':
 *         description: Cart item updated successfully or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CartItemUpdateResponse'
 *                 - $ref: '#/components/schemas/CartNotFoundResponse'
 *                 - $ref: '#/components/schemas/CartItemNotFoundResponse'
 *             examples:
 *               success_update:
 *                 summary: Successfully updated cart item
 *                 value:
 *                   id: "456e7890-e89b-12d3-a456-426614174111"
 *                   productId: "123e4567-e89b-12d3-a456-426614174000"
 *                   quantity: 5
 *                   cartId: "789e0123-e89b-12d3-a456-426614174222"
 *               cart_not_found:
 *                 summary: User has no cart
 *                 value:
 *                   error: "Cart not found"
 *               item_not_found:
 *                 summary: Product not in cart
 *                 value:
 *                   error: "Cart item not found"
 *       '400':
 *         description: Invalid request data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   error:
 *                     - path: ["productId"]
 *                       message: "Required"
 *                       code: "invalid_type"
 *                     - path: ["quantity"]
 *                       message: "Required"
 *                       code: "invalid_type"
 *               invalid_quantity:
 *                 summary: Invalid quantity value
 *                 value:
 *                   error:
 *                     - path: ["quantity"]
 *                       message: "Number must be greater than or equal to 1"
 *                       code: "too_small"
 *       '401':
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
export const updateCart = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        const data = updateCartSchema.parse(req.body);
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const cart = await prisma.cart.findFirst({
            where: { userId: user }
        });
        if(!cart) {
            res.status(200).json({ error: "Cart not found" });
            return;
        }
        const cartItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, id: data.cartItemId }
        });
        if(!cartItem) {
            res.status(200).json({ error: "Cart item not found" });
            return;
        }
        if(cartItem) {
            const updatedCartItem = await prisma.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity: data.quantity }
            });
            res.status(200).json(updatedCartItem);
            return;
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * @swagger
 * /api/cart/delete:
 *   delete:
 *     summary: Remove a product from the cart
 *     description: |
 *       Removes a specific product from the user's shopping cart completely, regardless of quantity.
 *       After successful deletion, returns the updated cart with remaining items.
 *       
 *       **Authentication Required:** User must be authenticated with a valid accessToken cookie.
 *       
 *       **Requirements:**
 *       - User must have an existing cart
 *       - Product must exist in the cart
 *       
 *       **Behavior:**
 *       - Completely removes the product from cart (all quantities)
 *       - Returns success message with updated cart information
 *       - Returns error messages with 200 status for business logic errors (cart/item not found)
 *       - Updated cart includes all remaining cart items
 *     tags: [Cart]
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       description: Product ID to remove from the cart
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteFromCartRequest'
 *           examples:
 *             remove_product:
 *               summary: Remove product from cart
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '200':
 *         description: Product removed successfully or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/DeleteCartResponse'
 *                 - $ref: '#/components/schemas/CartNotFoundResponse'
 *                 - $ref: '#/components/schemas/CartItemNotFoundResponse'
 *             examples:
 *               success_deletion:
 *                 summary: Product successfully removed
 *                 value:
 *                   message: "Cart item deleted successfully"
 *                   cart:
 *                     id: "789e0123-e89b-12d3-a456-426614174222"
 *                     userId: "user123-e89b-12d3-a456-426614174333"
 *                     createdAt: "2025-08-09T10:30:00.000Z"
 *                     updatedAt: "2025-08-09T12:45:00.000Z"
 *                     cartItems:
 *                       - id: "567e8901-e89b-12d3-a456-426614174444"
 *                         productId: "234e5678-e89b-12d3-a456-426614174555"
 *                         quantity: 2
 *                         cartId: "789e0123-e89b-12d3-a456-426614174222"
 *               cart_not_found:
 *                 summary: User has no cart
 *                 value:
 *                   error: "Cart not found"
 *               item_not_found:
 *                 summary: Product not in cart
 *                 value:
 *                   error: "Cart item not found"
 *               empty_cart_after_deletion:
 *                 summary: Cart becomes empty after deletion
 *                 value:
 *                   message: "Cart item deleted successfully"
 *                   cart:
 *                     id: "789e0123-e89b-12d3-a456-426614174222"
 *                     userId: "user123-e89b-12d3-a456-426614174333"
 *                     createdAt: "2025-08-09T10:30:00.000Z"
 *                     updatedAt: "2025-08-09T12:45:00.000Z"
 *                     cartItems: []
 *       '400':
 *         description: Invalid request data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               missing_product_id:
 *                 summary: Product ID is required
 *                 value:
 *                   error:
 *                     - path: ["productId"]
 *                       message: "Required"
 *                       code: "invalid_type"
 *               invalid_product_id:
 *                 summary: Invalid product ID format
 *                 value:
 *                   error:
 *                     - path: ["productId"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *       '401':
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
export const deleteCartByCartItem = async (req: Request, res: Response) => {
    try {
        let user: string | null = null;
        const data = deleteCartSchema.parse(req.body);
        if(req.cookies.accessToken) {
            user = getUserId(req.cookies.accessToken);
        }
        if(!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const cart = await prisma.cart.findFirst({
            where: { userId: user }
        });
        if(!cart) {
            res.status(200).json({ error: "Cart not found" });
            return;
        }
        const cartItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, id: data.cartItemId }
        });
        if(!cartItem) {
            res.status(200).json({ error: "Cart item not found" });
            return;
        }
        await prisma.cartItem.delete({
            where: { id: cartItem.id }
        });
        const updatedCart = await prisma.cart.findFirst({
            where: { userId: user },
            include: {
                cartItems: true
            }
        });
        res.status(200).json({ message: "Cart item deleted successfully", cart: updatedCart });
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};