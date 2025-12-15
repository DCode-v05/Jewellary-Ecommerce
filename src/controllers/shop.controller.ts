import { Request, Response } from 'express';
import { prisma } from "../utils/prisma";
import { getUserId } from '../utils/getUserId';

/**
 * @swagger
 * tags:
 *   name: Shop
 *   description: Public shop APIs for browsing and discovering products. Most endpoints work without authentication but provide enhanced data when authenticated.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShopProductImage:
 *       type: object
 *       description: Product image information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the image
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         imageUrl:
 *           type: string
 *           description: URL of the product image
 *           example: "https://example.com/images/product1.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *           example: "Gold ring with diamond"
 *         productId:
 *           type: string
 *           description: ID of the associated product
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *       required:
 *         - id
 *         - imageUrl
 *         - productId
 * 
 *     ShopProductVariant:
 *       type: object
 *       description: Product variant with different size and stock information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the variant
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         variantName:
 *           type: string
 *           description: Name of the product variant
 *           example: "Small Gold Ring"
 *         size:
 *           type: number
 *           description: Size of the variant as decimal number
 *           example: 7.5
 *         stock:
 *           type: integer
 *           description: Available stock quantity for this variant
 *           minimum: 0
 *           example: 15
 *         price:
 *           type: string
 *           nullable: true
 *           description: Variant-specific price as decimal string (if different from base product)
 *           example: "299.99"
 *         imageUrl:
 *           type: string
 *           description: URL of the variant-specific image
 *           example: "https://example.com/images/variant1.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for variant image
 *           example: "Small gold ring variant"
 *         productId:
 *           type: string
 *           description: ID of the parent product
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *       required:
 *         - id
 *         - variantName
 *         - size
 *         - stock
 *         - imageUrl
 *         - productId
 *     ShopProductCategory:
 *       type: object
 *       description: Product category information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the category
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Rings"
 *         slug:
 *           type: string
 *           description: URL-friendly category identifier
 *           example: "rings"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Category description
 *           example: "Beautiful collection of rings for all occasions"
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: Category banner image URL
 *           example: "https://example.com/images/rings-category.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for category image
 *           example: "Rings category banner"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the category was created
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the category was last updated
 *           example: "2024-01-15T10:30:00Z"
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - createdAt
 *         - updatedAt

 *     WishlistItem:
 *       type: object
 *       description: User's wishlist item (only included for authenticated users)
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the wishlist item
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         userId:
 *           type: string
 *           description: ID of the user who added this to wishlist
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         productId:
 *           type: string
 *           description: ID of the product in wishlist
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *       required:
 *         - id
 *         - userId
 *         - productId

 *     CartItem:
 *       type: object
 *       description: User's cart item (only included for authenticated users)
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the cart item
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product in cart
 *           example: 2
 *         userId:
 *           type: string
 *           description: ID of the user who added this to cart
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         productId:
 *           type: string
 *           description: ID of the product in cart
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *       required:
 *         - id
 *         - quantity
 *         - userId
 *         - productId
 *     ShopProduct:
 *       type: object
 *       description: Complete product information including related data
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the product
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Diamond Gold Ring"
 *         slug:
 *           type: string
 *           description: URL-friendly product identifier
 *           example: "diamond-gold-ring"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed product description
 *           example: "Elegant 18k gold ring with premium diamond"
 *         metalType:
 *           type: string
 *           description: Type of metal used in the product
 *           example: "Gold"
 *         price:
 *           type: string
 *           description: Product price as decimal string
 *           example: "299.99"
 *         discountPct:
 *           type: string
 *           nullable: true
 *           description: Discount percentage as decimal string
 *           example: "15.50"
 *         discountTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the discount expires
 *           example: "2024-12-31T23:59:59Z"
 *         stock:
 *           type: integer
 *           description: Available stock quantity
 *           minimum: 0
 *           example: 25
 *         weight:
 *           type: string
 *           nullable: true
 *           description: Product weight as decimal string in grams
 *           example: "12.50"
 *         size:
 *           type: string
 *           nullable: true
 *           description: Default product size as decimal
 *           example: "7.0"
 *         bannerImage:
 *           type: string
 *           nullable: true
 *           description: Banner image URL for product promotion
 *           example: "https://example.com/banners/product-banner.jpg"
 *         bannerHeading:
 *           type: string
 *           nullable: true
 *           description: Banner heading text
 *           example: "Limited Time Offer!"
 *         bannerBody:
 *           type: string
 *           nullable: true
 *           description: Banner body text
 *           example: "Get 20% off on this exclusive piece"
 *         tag:
 *           type: string
 *           nullable: true
 *           description: Product tag for categorization
 *           example: "Festive"
 *         categoryId:
 *           type: string
 *           description: ID of the product category
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the product was created
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the product was last updated
 *           example: "2024-01-15T10:30:00Z"
 *         category:
 *           $ref: '#/components/schemas/ShopProductCategory'
 *           description: Complete category information
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShopProductImage'
 *           description: Array of product images
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShopProductVariant'
 *           description: Array of product variants (different sizes/options)
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: Wishlist items for authenticated user (empty array for unauthenticated)
 *         cartItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *           description: Cart items for authenticated user (empty array for unauthenticated)
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
 *         - wishlistItems
 *         - cartItems
 *
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response format
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Internal server error"
 *       required:
 *         - message
 *
 *     DetailedErrorResponse:
 *       type: object
 *       description: Detailed error response with additional information
 *       properties:
 *         error:
 *           type: string
 *           description: Error type
 *           example: "Internal server error"
 *         message:
 *           type: string
 *           description: Detailed error message
 *           example: "Database connection failed"
 *       required:
 *         - error
 *         - message
 *
 *     NoResultsResponse:
 *       type: object
 *       description: Response when no data is found
 *       properties:
 *         message:
 *           type: string
 *           description: No results message
 *           example: "No products found"
 *       required:
 *         - message
 *
 *     CategoryResponse:
 *       type: object
 *       description: Category information for filters
 *       properties:
 *         id:
 *           type: string
 *           description: Unique category identifier
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Rings"
 *       required:
 *         - id
 *         - name
 *
 *     MetalTypeResponse:
 *       type: object
 *       description: Metal type information for filters
 *       properties:
 *         metalType:
 *           type: string
 *           description: Type of metal
 *           example: "Gold"
 *       required:
 *         - metalType
 *
 *     TagResponse:
 *       type: object
 *       description: Product tag information for filters
 *       properties:
 *         tag:
 *           type: string
 *           description: Product tag
 *           example: "Festive"
 *       required:
 *         - tag
 *
 *     RecommendedProductWrapper:
 *       type: object
 *       description: Wrapper for personalized recommended products
 *       properties:
 *         id:
 *           type: string
 *           description: Recommendation record ID
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         userId:
 *           type: string
 *           description: User ID for whom this is recommended
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         productId:
 *           type: string
 *           description: Recommended product ID
 *           example: "cl8h2tz0a0000u1i3bxy12345"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the recommendation was created
 *           example: "2024-01-15T10:30:00Z"
 *         product:
 *           $ref: '#/components/schemas/ShopProduct'
 *           description: Complete product information
 *       required:
 *         - id
 *         - userId
 *         - productId
 *         - createdAt
 *         - product
 */

/**
 * @swagger
 * /api/shop/all-products:
 *   get:
 *     summary: Get all available products
 *     tags: [Shop]
 *     description: |
 *       Retrieves all products from the store with complete information including:
 *       - Product details (name, price, description, stock, etc.)
 *       - Product images and variants
 *       - Category information
 *       
 *       **Authentication Enhancement:**
 *       - **Unauthenticated users**: Get basic product information
 *       - **Authenticated users**: Additionally get personalized data (wishlist status, cart items, order history)
 *       
 *       Products are ordered by creation date (newest first).
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: false
 *         description: |
 *           JWT authentication token. Optional - provides enhanced data when present.
 *           - If provided and valid: includes user-specific wishlist, cart, and order data
 *           - If not provided: returns basic product information only
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShopProduct'
 *                   description: Array of products with complete information
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no products exist in the database
 *             examples:
 *               success:
 *                 summary: Successful response with products
 *                 value:
 *                   - id: "cl8h2tz0a0000u1i3bxy12345"
 *                     name: "Diamond Gold Ring"
 *                     slug: "diamond-gold-ring"
 *                     metalType: "Gold"
 *                     price: "299.99"
 *                     stock: 25
 *                     category:
 *                       id: "cat123"
 *                       name: "Rings"
 *                     images: []
 *                     variants: []
 *                     wishlistItems: []
 *                     cartItems: []
 *               no_products:
 *                 summary: No products found
 *                 value:
 *                   message: "No products found"
 *       500:
 *         description: Server error occurred while fetching products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   error: "Internal server error"
 *                   message: "Database connection failed"
 */
export const getShopAllProducts = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                images: true,
                variants: true,
                category: true,
                reviews: true,
                wishlistItems: userId ? {
                    where: { wishlist: { userId: userId } }
                } : undefined,
                cartItems: userId ? {
                    where: { cart: { userId: userId } }
                } : undefined,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!products || products.length === 0) {
            res.status(200).json({ message: 'No products found' });
            return;
        }
        const result = products.map((product => {
            const averageRating: number = product.reviews.length > 0 ? product.reviews.reduce( (acc: number, r: { rating: number }) => acc + r.rating, 0 ) / product.reviews.length : 0;
            return {
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
                reviewCount: product.reviews.length,
                averageRating: averageRating,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                category: product.category,
                images: product.images,
                variants: product.variants,
                wishlistItems: product.wishlistItems,
                cartItems: product.cartItems,
            };
        }));
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
};

/**
 * @swagger
 * /api/shop/best-sellers:
 *   get:
 *     summary: Get best-selling products
 *     tags: [Shop]
 *     description: |
 *       Retrieves products ranked by sales performance (number of order items).
 *       Products with the highest number of orders appear first.
 *       
 *       **Ranking Logic:**
 *       - Products are ordered by total order count (descending)
 *       - Includes all products that have been ordered at least once
 *       - Products with no orders may not appear in results
 *       
 *       **Authentication Enhancement:**
 *       - **Unauthenticated users**: Get basic product information
 *       - **Authenticated users**: Additionally get personalized data (wishlist status, cart items, order history)
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: false
 *         description: |
 *           JWT authentication token. Optional - provides enhanced data when present.
 *           When provided, includes user-specific wishlist, cart, and order information.
 *     responses:
 *       200:
 *         description: Best-selling products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShopProduct'
 *                   description: Array of products ordered by sales performance
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no best-selling products are found
 *             examples:
 *               success:
 *                 summary: Successful response with best sellers
 *                 value:
 *                   - id: "cl8h2tz0a0000u1i3bxy12345"
 *                     name: "Popular Diamond Ring"
 *                     slug: "popular-diamond-ring"
 *                     metalType: "Gold"
 *                     price: "399.99"
 *                     stock: 15
 *                     category:
 *                       name: "Rings"
 *               no_best_sellers:
 *                 summary: No best sellers found
 *                 value:
 *                   message: "No best sellers found"
 *       500:
 *         description: Server error occurred while fetching best sellers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getShopBestSellers = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        const bestSellers = await prisma.product.findMany({
            include: {
                images: true,
                variants: true,
                category: true,
                wishlistItems: userId ? {
                    where: { wishlist: { userId: userId } }
                } : undefined,
                cartItems: userId ? {
                    where: { cart: { userId: userId } }
                } : undefined,
            },
            orderBy: { orderItems: { _count: 'desc' } },
        });
        if (!bestSellers || bestSellers.length === 0) {
            res.status(200).json({ message: 'No best sellers found' });
            return;
        }
        res.status(200).json(bestSellers);
    } catch (error) {
        console.error("Error fetching best sellers:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/shop/most-viewed:
 *   get:
 *     summary: Get most viewed products
 *     tags: [Shop]
 *     description: |
 *       Retrieves products with the highest view count based on user activity tracking.
 *       Only considers VIEW activities from the last 30 days to show trending products.
 *       
 *       **Ranking Logic:**
 *       - Tracks user VIEW activities from UserActivityLog table
 *       - Only includes views from the last 30 days (rolling window)
 *       - Products are ordered by total view count (descending)
 *       - Products with no recent views will not appear in results
 *       
 *       **Authentication Enhancement:**
 *       - **Unauthenticated users**: Get basic product information
 *       - **Authenticated users**: Additionally get personalized data (wishlist status, cart items, order history)
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: false
 *         description: |
 *           JWT authentication token. Optional - provides enhanced data when present.
 *           When provided, includes user-specific wishlist, cart, and order information.
 *     responses:
 *       200:
 *         description: Most viewed products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShopProduct'
 *                   description: Array of products ordered by view count (last 30 days)
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no viewed products are found in the last 30 days
 *             examples:
 *               success:
 *                 summary: Successful response with most viewed products
 *                 value:
 *                   - id: "cl8h2tz0a0000u1i3bxy12345"
 *                     name: "Trending Gold Necklace"
 *                     slug: "trending-gold-necklace"
 *                     metalType: "Gold"
 *                     price: "599.99"
 *                     stock: 8
 *                     category:
 *                       name: "Necklaces"
 *               no_most_viewed:
 *                 summary: No most viewed products found
 *                 value:
 *                   message: "No most viewed products found"
 *       500:
 *         description: Server error occurred while fetching most viewed products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getShopMostViewed = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        const viewCounts = await prisma.userActivityLog.groupBy({
            by: ['productId'],
            _count: { id: true },
            where: { 
                activityType: "VIEW",
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
            },
            orderBy: { _count: { id: 'desc' } },
        });
        const productIdsByView  = viewCounts.map((viewCount: { productId: string }) => viewCount.productId);
        const products  = await prisma.product.findMany({
            where: { id: { in: productIdsByView  } },
            include: {
                images: true,
                variants: true,
                category: true,
                wishlistItems: userId ? {
                    where: { wishlist: { userId: userId } }
                } : undefined,
                cartItems: userId ? {
                    where: { cart: { userId: userId } }
                } : undefined,
            },
        });
        const mostViewedProducts = productIdsByView.map((productId: string) => products.find((p: typeof products[0]) => p.id === productId)).filter(Boolean);
        if (mostViewedProducts.length === 0) {
            res.status(200).json({ message: 'No most viewed products found' });
            return;
        }
        res.status(200).json(mostViewedProducts);
    } catch (error) {
        console.error("Error fetching most viewed products:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/shop/recommended:
 *   get:
 *     summary: Get personalized or default product recommendations
 *     tags: [Shop]
 *     description: |
 *       Returns product recommendations with intelligent fallback logic.
 *       
 *       **Recommendation Logic:**
 *       1. **Authenticated users with recommendations**: Returns personalized products from RecommendedProduct table
 *       2. **Authenticated users without recommendations**: Returns default products (newest first)
 *       3. **Unauthenticated users**: Returns default products (newest first)
 *       
 *       **Response Format:**
 *       - **Personalized recommendations**: Returns recommendation wrapper objects with nested product data
 *       - **Default recommendations**: Returns direct product objects
 *       
 *       **Authentication Enhancement:**
 *       For authenticated users with personalized recommendations, includes user-specific data (wishlist, cart, orders).
 *     parameters:
 *       - in: cookie
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: false
 *         description: |
 *           JWT authentication token. Optional but affects response behavior:
 *           - **Not provided**: Returns default products
 *           - **Provided**: Returns personalized recommendations if available, otherwise default products
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/RecommendedProductWrapper'
 *                     description: Personalized recommendation (when user has recommendations)
 *                   - $ref: '#/components/schemas/ShopProduct'
 *                     description: Default product (when no personalized recommendations)
 *             examples:
 *               personalized_recommendations:
 *                 summary: Personalized recommendations for authenticated user
 *                 value:
 *                   - id: "rec123"
 *                     userId: "user123"
 *                     productId: "prod123"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     product:
 *                       id: "prod123"
 *                       name: "Recommended Ring"
 *                       price: "199.99"
 *                       wishlistItems:
 *                         - id: "wish123"
 *                           userId: "user123"
 *               default_recommendations:
 *                 summary: Default recommendations (no personalization)
 *                 value:
 *                   - id: "prod456"
 *                     name: "Latest Gold Ring"
 *                     price: "299.99"
 *                     wishlistItems: []
 *                     cartItems: []
 *       500:
 *         description: Server error occurred while fetching recommendations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getShopRecommedations = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            const defaultProducts = await prisma.product.findMany({
                include: {
                    images: true,
                    variants: true,
                        category: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json(defaultProducts);
            return;
        }
        const products = await prisma.recommendedProduct.findMany({
            where: { userId: userId },
            include: {
                product: {
                    include: {
                        images: true,
                        variants: true,
                        category: true,
                        wishlistItems: userId ? {
                            where: { wishlist: { userId: userId } }
                        } : undefined,
                        cartItems: userId ? {
                            where: { cart: { userId: userId } }
                        } : undefined,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!products || products.length === 0) {
            const defaultProducts = await prisma.product.findMany({
                include: {
                    images: true,
                    variants: true,
                    category: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json(defaultProducts);
            return;
        }
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/shop/categories:
 *   get:
 *     summary: Get all unique product categories
 *     tags: [Shop]
 *     description: |
 *       Retrieves all distinct product categories available in the store.
 *       Useful for building category filters and navigation menus.
 *       
 *       **Data Source:**
 *       - Fetches from Category table with distinct names
 *       - Only returns categories that exist in the system
 *       - Returns minimal category information (id and name only)
 *       
 *       **No Authentication Required:**
 *       This endpoint is public and does not require authentication.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryResponse'
 *                   description: Array of available categories
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no categories are found
 *             examples:
 *               success:
 *                 summary: Successful response with categories
 *                 value:
 *                   - id: "cl8h2tz0a0000u1i3bxy12345"
 *                     name: "Rings"
 *                   - id: "cl8h2tz0a0000u1i3bxy12346"
 *                     name: "Necklaces"
 *                   - id: "cl8h2tz0a0000u1i3bxy12347"
 *                     name: "Bracelets"
 *               no_categories:
 *                 summary: No categories found
 *                 value:
 *                   message: "No categories found"
 *       500:
 *         description: Server error occurred while fetching categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            distinct: ['name'],
            select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                altText: true
            },
        });
        if (!categories || categories.length === 0) {
            res.status(200).json({ message: 'No categories found' });
            return;
        }
        res.status(200).json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/shop/metal-types:
 *   get:
 *     summary: Get all unique metal types used in products
 *     tags: [Shop]
 *     description: |
 *       Retrieves a list of all distinct metal types available across all products.
 *       Useful for building metal type filters in product search and filtering interfaces.
 *       
 *       **Data Source:**
 *       - Fetches from Product table with distinct metalType values
 *       - Only returns metal types that are currently used in products
 *       - Examples: "Gold", "Silver", "Platinum", "Rose Gold", etc.
 *       
 *       **No Authentication Required:**
 *       This endpoint is public and does not require authentication.
 *     responses:
 *       200:
 *         description: Metal types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/MetalTypeResponse'
 *                   description: Array of available metal types
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no metal types are found
 *             examples:
 *               success:
 *                 summary: Successful response with metal types
 *                 value:
 *                   - metalType: "Gold"
 *                   - metalType: "Silver"
 *                   - metalType: "Platinum"
 *                   - metalType: "Rose Gold"
 *               no_metal_types:
 *                 summary: No metal types found
 *                 value:
 *                   message: "No metal types found"
 *       500:
 *         description: Server error occurred while fetching metal types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getAllMetalTypes = async (req: Request, res: Response) => {
    try {
        const metalTypes = await prisma.product.findMany({
            distinct: ['metalType'],
            select: {
                metalType: true,
            },
        });
        if (!metalTypes || metalTypes.length === 0) {
            res.status(200).json({ message: 'No metal types found' });
            return;
        }
        res.status(200).json(metalTypes);
    } catch (error) {
        console.error("Error fetching metal types:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/shop/tags:
 *   get:
 *     summary: Get all unique product tags
 *     tags: [Shop]
 *     description: |
 *       Retrieves all unique non-null tags associated with products.
 *       Tags are used for additional product categorization and filtering.
 *       
 *       **Data Source:**
 *       - Fetches from Product table with distinct tag values
 *       - Excludes products where tag is null
 *       - Only returns tags that are currently assigned to products
 *       - Examples: "Festive", "Wedding", "Casual", "Formal", etc.
 *       
 *       **Use Cases:**
 *       - Building tag-based filters
 *       - Product discovery by themes/occasions
 *       - Enhanced search functionality
 *       
 *       **No Authentication Required:**
 *       This endpoint is public and does not require authentication.
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/TagResponse'
 *                   description: Array of available product tags
 *                 - $ref: '#/components/schemas/NoResultsResponse'
 *                   description: When no tags are found
 *             examples:
 *               success:
 *                 summary: Successful response with tags
 *                 value:
 *                   - tag: "Festive"
 *                   - tag: "Wedding"
 *                   - tag: "Casual"
 *                   - tag: "Formal"
 *                   - tag: "Anniversary"
 *               no_tags:
 *                 summary: No tags found
 *                 value:
 *                   message: "No tags found"
 *       500:
 *         description: Server error occurred while fetching tags
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   message: "Internal server error"
 */
export const getAllTags = async (req: Request, res: Response) => {
    try {
        const tags = await prisma.product.findMany({
            distinct: ['tag'],
            select: {
                tag: true,
            },
            where: {
                tag: {
                    not: null,
                },
            },
        });
        if (!tags || tags.length === 0) {
            res.status(200).json({ message: 'No tags found' });
            return;
        }
        res.status(200).json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};