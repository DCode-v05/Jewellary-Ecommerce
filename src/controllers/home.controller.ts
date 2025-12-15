import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { subscribeEmailSchema } from "../validators/home.validator";
import { getUserId } from "../utils/getUserId";
import { ZodError } from "zod";
import { sendSubscriptionNotification } from "../utils/sendEmail";

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: Home page APIs for jewelry e-commerce - Product recommendations, hero banners, testimonials, and blog management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     accessTokenCookie:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: JWT access token stored in HTTP-only cookie for user authentication
 *   schemas:
 *     ProductImage:
 *       type: object
 *       description: Product image information
 *       properties:
 *         imageUrl:
 *           type: string
 *           description: URL of the product image
 *           example: "https://example.com/product-image.jpg"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *           example: "Gold diamond ring"
 *       required:
 *         - imageUrl
 *     HeroBannerProduct:
 *       type: object
 *       description: Hero banner product or default hero image data
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (Product ID or Default Hero Image ID)
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         name:
 *           type: string
 *           description: Product name (only for personalized recommendations)
 *           example: "Diamond Gold Ring Collection"
 *         bannerImage:
 *           type: string
 *           description: URL of the banner/hero image
 *           example: "https://example.com/hero-banner.jpg"
 *         bannerHeading:
 *           type: string
 *           nullable: true
 *           description: Main heading text for the banner
 *           example: "Exclusive Jewelry Collection"
 *         bannerBody:
 *           type: string
 *           nullable: true
 *           description: Descriptive body text for the banner
 *           example: "Discover our premium handcrafted jewelry pieces"
 *         altText:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the banner image
 *           example: "Hero banner showing jewelry collection"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp (for default hero images)
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp (for default hero images)
 *           example: "2024-01-20T15:45:00Z"
 *       required:
 *         - id
 *         - bannerImage
 *     RecommendedProduct:
 *       type: object
 *       description: Product information with rating and wishlist status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique product identifier
 *           example: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Diamond Engagement Ring"
 *         slug:
 *           type: string
 *           description: URL-friendly product identifier
 *           example: "diamond-engagement-ring"
 *         description:
 *           type: string
 *           description: Product description (empty string if null in database)
 *           example: "Beautiful 18k gold diamond engagement ring"
 *         price:
 *           type: string
 *           description: Product price formatted to 2 decimal places
 *           example: "1299.99"
 *         image:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *           description: Array of product images (maximum 10 images)
 *         averageRating:
 *           type: string
 *           description: Average customer rating formatted to 1 decimal place (0.0 if no reviews)
 *           example: "4.5"
 *         reviewCount:
 *           type: integer
 *           description: Total number of customer reviews
 *           example: 23
 *         isWishlisted:
 *           type: boolean
 *           description: Whether the product is in user's wishlist (false for unauthenticated users)
 *           example: true
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - description
 *         - price
 *         - image
 *         - averageRating
 *         - reviewCount
 *         - isWishlisted
 *     NewArrivalProduct:
 *       type: object
 *       description: Product with new arrival indicator (within last 7 days)
 *       allOf:
 *         - $ref: '#/components/schemas/RecommendedProduct'
 *         - type: object
 *           properties:
 *             isNew:
 *               type: boolean
 *               description: True if product was created within the last 7 days
 *               example: true
 *           required:
 *             - isNew
 *     DiscountedProduct:
 *       type: object
 *       description: Product with discount information
 *       allOf:
 *         - $ref: '#/components/schemas/RecommendedProduct'
 *         - type: object
 *           properties:
 *             discountPct:
 *               type: number
 *               nullable: true
 *               description: Discount percentage (null if no discount)
 *               example: 15.50
 *             discountTime:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: Discount expiration date and time (null if no expiry)
 *               example: "2024-12-31T23:59:59Z"
 *           required:
 *             - discountPct
 *             - discountTime
 *     Testimonial:
 *       type: object
 *       description: Customer review/testimonial with user and product information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique review identifier
 *           example: "c1d2e3f4-g5h6-7890-cdef-gh1234567890"
 *         rating:
 *           type: number
 *           minimum: 3.5
 *           maximum: 5
 *           description: Customer rating (only ratings >= 3.5 are included)
 *           example: 4.8
 *         comment:
 *           type: string
 *           nullable: true
 *           description: Customer review comment
 *           example: "Amazing quality and fast delivery!"
 *         userName:
 *           type: string
 *           description: Name of the customer who wrote the review
 *           example: "Sarah Johnson"
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *           nullable: true
 *           description: Customer's gender preference
 *           example: "FEMALE"
 *         address:
 *           type: object
 *           description: Customer's address information
 *           properties:
 *             state:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of states from customer's addresses
 *               example: ["California", "New York"]
 *         productName:
 *           type: string
 *           description: Name of the reviewed product
 *           example: "Diamond Engagement Ring"
 *         productSlug:
 *           type: string
 *           description: URL slug of the reviewed product
 *           example: "diamond-engagement-ring"
 *       required:
 *         - id
 *         - rating
 *         - comment
 *         - userName
 *         - gender
 *         - address
 *         - productName
 *         - productSlug
 *     SubscribeEmailRequest:
 *       type: object
 *       description: Email subscription request payload
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Valid email address for newsletter subscription
 *           example: "customer@example.com"
 *       required:
 *         - email
 *     BlogPost:
 *       type: object
 *       description: Blog post information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique blog post identifier
 *           example: "d1e2f3g4-h5i6-7890-defg-hi1234567890"
 *         title:
 *           type: string
 *           description: Blog post title
 *           example: "Latest Jewelry Trends for 2024"
 *         slug:
 *           type: string
 *           description: URL-friendly blog post identifier
 *           example: "latest-jewelry-trends-2024"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the blog post
 *           example: "e1f2g3h4-i5j6-7890-efgh-ij1234567890"
 *         content:
 *           type: string
 *           description: Complete blog post content
 *           example: "Discover the latest trends in jewelry design..."
 *         coverImage:
 *           type: string
 *           description: URL of the blog post cover image
 *           example: "https://example.com/blog-cover.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Blog post creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *       required:
 *         - id
 *         - title
 *         - slug
 *         - userId
 *         - content
 *         - coverImage
 *         - createdAt
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response format
 *       properties:
 *         error:
 *           type: string
 *           description: Error message or validation details
 *           example: "Failed to fetch products"
 *       required:
 *         - error
 *     SuccessResponse:
 *       type: object
 *       description: Standard success response format
 *       properties:
 *         message:
 *           type: string
 *           description: Success confirmation message
 *           example: "Email subscribed successfully"
 *       required:
 *         - message
 *     ValidationErrorResponse:
 *       type: object
 *       description: Validation error response from Zod schema validation
 *       properties:
 *         error:
 *           type: array
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
 *           description: Array of validation error details
 *           example: [{"path": ["email"], "message": "Invalid email format", "code": "invalid_string"}]
 *       required:
 *         - error
 *   responses:
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             error: "User not found"
 *     BadRequest:
 *       description: Bad request - Invalid input data
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - $ref: '#/components/schemas/ValidationErrorResponse'
 *           examples:
 *             simpleError:
 *               summary: Simple error message
 *               value:
 *                 error: "Email is already subscribed"
 *             validationError:
 *               summary: Validation error details
 *               value:
 *                 error: [{"path": ["email"], "message": "Invalid email format", "code": "invalid_string"}]
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             error: "Failed to fetch products"
 */

/**
 * @swagger
 * /api/home/hero-banner:
 *   get:
 *     summary: Get hero banner content
 *     tags: [Home]
 *     description: |
 *       Retrieves hero banner content for the homepage. Behavior depends on user authentication:
 *       
 *       **For authenticated users (with accessToken cookie):**
 *       - Returns personalized recommended products with banner information
 *       - Fallback to default hero images if no personalized recommendations exist
 *       
 *       **For unauthenticated users:**
 *       - Returns default hero images from DefaultHeroBannerImages table
 *       
 *       **Response Logic:**
 *       1. Check for accessToken cookie
 *       2. If authenticated: Look for user's recommended products with banner data
 *       3. If no personalized content: Return default hero images (max 10)
 *       4. If no default content exists: Return error message
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved hero banner content
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/HeroBannerProduct'
 *                   description: Array of hero banner items (personalized products or default images)
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No default products found"]
 *                       description: Error when no hero banner content is available
 *             examples:
 *               personalizedBanner:
 *                 summary: Personalized hero banner (authenticated user)
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Diamond Ring Collection"
 *                     bannerImage: "https://example.com/diamond-ring-banner.jpg"
 *                     bannerHeading: "Exclusive Diamond Collection"
 *                     bannerBody: "Discover our premium handcrafted rings"
 *               defaultBanner:
 *                 summary: Default hero banner (unauthenticated or no personalization)
 *                 value:
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     bannerImage: "https://example.com/default-hero.jpg"
 *                     bannerHeading: "Welcome to Our Jewelry Store"
 *                     bannerBody: "Premium jewelry for every occasion"
 *                     altText: "Hero banner showing jewelry collection"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-20T15:45:00Z"
 *               noContent:
 *                 summary: No hero banner content available
 *                 value:
 *                   error: "No default products found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Internal server error
 *             value:
 *               error: "Error Fetching Recommended Products"
 */
export const getHeroBanner = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if (req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
      const recommendedProducts = await prisma.recommendedProduct.findMany({
        where: { user: { id: userId ? userId : undefined } },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              bannerImage: true,
              bannerHeading: true,
              bannerBody: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (recommendedProducts.length != 0) {
        const result = recommendedProducts.map(
        (item: (typeof recommendedProducts)[number]) => {
          const product = item.product;
          return {
              id: product.id,
              name: product.name,
              bannerImage: product.bannerImage,
              bannerHeading: product.bannerHeading || "",
              bannerBody: product.bannerBody || "",
            };
          }
        );
        res.status(200).json(result);
        return;
      }
    }
    const defaultBanner = await prisma.defaultHeroBannerImages.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (!defaultBanner || defaultBanner.length === 0) {
      res.status(200).json({ error: "No default products found" });
      return;
    }
    res.status(200).json(defaultBanner);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Error Fetching Recommended Products" });
  }
};

/**
 * @swagger
 * /api/home/recommended-products:
 *   get:
 *     summary: Get recommended products
 *     tags: [Home]
 *     description: |
 *       Retrieves recommended products for the homepage. Behavior depends on user authentication:
 *       
 *       **For authenticated users (with accessToken cookie):**
 *       - Returns personalized recommended products from RecommendedProduct table
 *       - Includes wishlist status based on user's wishlist
 *       - Fallback to default product list if no personalized recommendations
 *       
 *       **For unauthenticated users:**
 *       - Returns latest products (by creation date) with stock > 0
 *       - All products marked as not wishlisted
 *       
 *       **Product Data Includes:**
 *       - Basic product information (name, price, description)
 *       - Up to 10 product images
 *       - Average rating calculated from all reviews
 *       - Total review count
 *       - Wishlist status (authenticated users only)
 *       
 *       **Limits:** Maximum 10 products returned
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved recommended products
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecommendedProduct'
 *                   description: Array of recommended products
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No products found"]
 *                       description: Error when no products are available
 *             examples:
 *               authenticatedUser:
 *                 summary: Personalized recommendations (authenticated user)
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Diamond Engagement Ring"
 *                     slug: "diamond-engagement-ring"
 *                     description: "Beautiful 18k gold diamond engagement ring"
 *                     price: "1299.99"
 *                     image:
 *                       - imageUrl: "https://example.com/ring1.jpg"
 *                         altText: "Front view of diamond ring"
 *                       - imageUrl: "https://example.com/ring2.jpg"
 *                         altText: "Side view of diamond ring"
 *                     averageRating: "4.5"
 *                     reviewCount: 23
 *                     isWishlisted: true
 *               unauthenticatedUser:
 *                 summary: Default recommendations (unauthenticated user)
 *                 value:
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     name: "Gold Necklace"
 *                     slug: "gold-necklace"
 *                     description: "Elegant 14k gold chain necklace"
 *                     price: "599.99"
 *                     image:
 *                       - imageUrl: "https://example.com/necklace1.jpg"
 *                         altText: "Gold necklace display"
 *                     averageRating: "4.2"
 *                     reviewCount: 15
 *                     isWishlisted: false
 *               noProducts:
 *                 summary: No products available
 *                 value:
 *                   error: "No products found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Internal server error
 *             value:
 *               error: "Failed to fetch recommended products"
 */

export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    if(req.cookies.accessToken == null) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    userId = getUserId(req.cookies.accessToken);
    const products = userId ? await prisma.recommendedProduct.findMany({
      where: { userId: userId },
      include: {
        product: {
          include: {
            images: { take: 10 },
            reviews: true,
            wishlistItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }) : [];
    if (products.length == 0) {
      res.status(200).json({ error: "No Recommended products found" });
      return;
    }
    const wishlist = userId ? await prisma.wishlist.findMany({ 
      where: { userId: userId }, 
      include: { wishlistItems: true }
    }) : [];
    const allWishlistItems = wishlist.flatMap(w => w.wishlistItems);
    const result = await Promise.all(products.map(async (item: (typeof products)[number]) => {
      const product = item.product;
      const averageRating: number = product.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / (product.reviews.length || 1);
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        stock: product.stock,
        size: product.size,
        price: product.price.toFixed(2),
        discountPct: product.discountPct || null,
        discountTime: product.discountTime || null,
        image: product.images.map(
          (img: { imageUrl: string; altText: string | null }) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
          })
        ),
        averageRating: averageRating.toFixed(1),
        reviewCount: product.reviews.length,
        isWishlisted: userId ? allWishlistItems.some((item: { productId: string }) => item.productId === product.id) : false,
      };
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Failed to fetch recommended products" });
  }
};

/**
 * @swagger
 * /api/home/new-arrivals:
 *   get:
 *     summary: Get new arrival products
 *     tags: [Home]
 *     description: |
 *       Retrieves the latest products in the catalog, ordered by creation date (newest first).
 *       
 *       **Features:**
 *       - Returns all products (no stock filtering)
 *       - Includes **isNew** flag for products created within last 7 days
 *       - Shows wishlist status for authenticated users
 *       - Includes product images, ratings, and review counts
 *       
 *       **Authentication:**
 *       - Optional: Works for both authenticated and unauthenticated users
 *       - Authenticated users see their wishlist status
 *       - Unauthenticated users see **isWishlisted: false** for all products
 *       
 *       **Limits:** Maximum 10 products returned
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved new arrival products
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewArrivalProduct'
 *                   description: Array of newest products with new arrival indicator
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No new arrivals found"]
 *                       description: Error when no products exist in catalog
 *             examples:
 *               successResponse:
 *                 summary: New arrivals with mixed new/old products
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Diamond Tennis Bracelet"
 *                     slug: "diamond-tennis-bracelet"
 *                     description: "Stunning diamond tennis bracelet in 18k white gold"
 *                     price: "2199.99"
 *                     image:
 *                       - imageUrl: "https://example.com/bracelet1.jpg"
 *                         altText: "Diamond tennis bracelet"
 *                     averageRating: "4.8"
 *                     reviewCount: 5
 *                     isNew: true
 *                     isWishlisted: false
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     name: "Gold Stud Earrings"
 *                     slug: "gold-stud-earrings"
 *                     description: "Classic 14k gold stud earrings"
 *                     price: "299.99"
 *                     image:
 *                       - imageUrl: "https://example.com/earrings1.jpg"
 *                         altText: "Gold stud earrings"
 *                     averageRating: "4.3"
 *                     reviewCount: 12
 *                     isNew: false
 *                     isWishlisted: true
 *               noProducts:
 *                 summary: No products in catalog
 *                 value:
 *                   error: "No new arrivals found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch products"
 */
export const getNewArrivals = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { take: 10 },
        variants: true,
        reviews: true,
        wishlistItems: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (!products || products.length === 0) {
      res.status(200).json({ error: "No new arrivals found" });
      return;
    }
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    const wishlist = userId ? await prisma.wishlist.findMany({ 
      where: { userId: userId }, 
      include: { wishlistItems: true }
    }) : [];
    const allWishlistItems = wishlist.flatMap(w => w.wishlistItems);
    const result = await Promise.all(products.map((product: (typeof products)[number]) => {
      const averageRating: number = product.reviews.length > 0 ? product.reviews.reduce( (acc: number, r: { rating: number }) => acc + r.rating, 0 ) / product.reviews.length : 0;
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price.toFixed(2),
        stock: product.stock,
        size: product.size,
        discountPct: product.discountPct || null,
        discountTime: product.discountTime || null,
        image: product.images.map(
          (img: { imageUrl: string; altText: string | null }) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
          })
        ),
        averageRating: averageRating.toFixed(1),
        reviewCount: product.reviews.length,
        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isWishlisted: userId ? allWishlistItems.some((item: { productId: string }) => item.productId === product.id) : false,
        variant: product.variants,
      };
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching full product list:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * @swagger
 * /api/home/best-sellers:
 *   get:
 *     summary: Get best-selling products
 *     tags: [Home]
 *     description: |
 *       Retrieves top-selling products based on order frequency. Products are ranked by the number of times they appear in orders.
 *       
 *       **Ranking Logic:**
 *       - Primary sort: Number of order items (descending) - products with most orders first
 *       - Secondary sort: Creation date (descending) - newer products break ties
 *       
 *       **Features:**
 *       - Includes all products regardless of stock status
 *       - Shows wishlist status for authenticated users
 *       - Includes product images (up to 10), ratings, and review counts
 *       - Returns standard product information with average ratings
 *       
 *       **Authentication:**
 *       - Optional: Works for both authenticated and unauthenticated users
 *       - Authenticated users see their personal wishlist status
 *       - Unauthenticated users see **isWishlisted: false** for all products
 *       
 *       **Limits:** Maximum 10 products returned
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved best-selling products
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecommendedProduct'
 *                   description: Array of best-selling products ordered by popularity
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No best-selling products found"]
 *                       description: Error when no products exist in catalog
 *             examples:
 *               successResponse:
 *                 summary: Best-selling products ranked by orders
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Classic Diamond Ring"
 *                     slug: "classic-diamond-ring"
 *                     description: "Timeless solitaire diamond engagement ring"
 *                     price: "1899.99"
 *                     image:
 *                       - imageUrl: "https://example.com/bestseller1.jpg"
 *                         altText: "Classic diamond solitaire ring"
 *                     averageRating: "4.9"
 *                     reviewCount: 47
 *                     isWishlisted: true
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     name: "Pearl Necklace Set"
 *                     slug: "pearl-necklace-set"
 *                     description: "Elegant freshwater pearl necklace and earring set"
 *                     price: "449.99"
 *                     image:
 *                       - imageUrl: "https://example.com/pearls1.jpg"
 *                         altText: "Pearl necklace and earring set"
 *                     averageRating: "4.6"
 *                     reviewCount: 32
 *                     isWishlisted: false
 *               noProducts:
 *                 summary: No products in catalog
 *                 value:
 *                   error: "No best-selling products found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch best-selling products"
 */
export const getBestSellers = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { take: 10 },
        reviews: true,
        variants: true,
        wishlistItems: true,
      },
      orderBy: [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }],
      take: 10,
    });
    if (!products || products.length === 0) {
      res.status(200).json({ error: "No best-selling products found" });
      return;
    }
    if(req.cookies.accessToken) {
        userId = getUserId(req.cookies.accessToken);
      }
    const wishlist = userId ? await prisma.wishlist.findMany({ 
      where: { userId: userId }, 
      include: { wishlistItems: true }
    }) : [];
    const allWishlistItems = wishlist.flatMap(w => w.wishlistItems);
    const result = await Promise.all(products.map((product: (typeof products)[number]) => {
      const averageRating: number = product.reviews.length > 0 ? product.reviews.reduce( (acc: number, r: { rating: number }) => acc + r.rating, 0 ) / product.reviews.length : 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price.toFixed(2),
        stock: product.stock,
        size: product.size,
        discountPct: product.discountPct || null,
        discountTime: product.discountTime || null,
        image: product.images.map(
          (img: { imageUrl: string; altText: string | null }) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
          })
        ),
        averageRating: averageRating.toFixed(1),
        reviewCount: product.reviews.length,
        isWishlisted: userId ? allWishlistItems.some((item: { productId: string }) => item.productId === product.id) : false,
        variant: product.variants,
      };
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching best-selling products:", error);
    res.status(500).json({ error: "Failed to fetch best-selling products" });
  }
};

/**
 * @swagger
 * /api/home/most-viewed:
 *   get:
 *     summary: Get most viewed products
 *     tags: [Home]
 *     description: |
 *       Retrieves products with the highest view counts based on user activity tracking in the last 30 days.
 *       
 *       **View Tracking Logic:**
 *       - Analyzes UserActivityLog entries with **activityType: "VIEW"**
 *       - Only considers views from the last 30 days
 *       - Groups by product ID and counts total views
 *       - Returns products ordered by view count (descending)
 *       
 *       **Features:**
 *       - Based on actual user engagement data
 *       - Shows wishlist status for authenticated users
 *       - Includes product images (up to 10), ratings, and review counts
 *       - Returns standard product information with calculated average ratings
 *       
 *       **Authentication:**
 *       - Optional: Works for both authenticated and unauthenticated users
 *       - Authenticated users see their personal wishlist status
 *       - Unauthenticated users see **isWishlisted: false** for all products
 *       
 *       **Limits:** Maximum 10 products returned
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved most viewed products
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecommendedProduct'
 *                   description: Array of most viewed products ordered by view count
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No most viewed products found"]
 *                       description: Error when no products have been viewed in the last 30 days
 *             examples:
 *               successResponse:
 *                 summary: Most viewed products based on last 30 days activity
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Trending Diamond Earrings"
 *                     slug: "trending-diamond-earrings"
 *                     description: "Popular diamond stud earrings in multiple settings"
 *                     price: "799.99"
 *                     image:
 *                       - imageUrl: "https://example.com/trending1.jpg"
 *                         altText: "Diamond stud earrings"
 *                     averageRating: "4.7"
 *                     reviewCount: 89
 *                     isWishlisted: false
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     name: "Popular Gold Chain"
 *                     slug: "popular-gold-chain"
 *                     description: "Frequently viewed 18k gold chain necklace"
 *                     price: "699.99"
 *                     image:
 *                       - imageUrl: "https://example.com/chain1.jpg"
 *                         altText: "Gold chain necklace"
 *                     averageRating: "4.4"
 *                     reviewCount: 65
 *                     isWishlisted: true
 *               noViews:
 *                 summary: No viewed products in timeframe
 *                 value:
 *                   error: "No most viewed products found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch most viewed products"
 */
export const getMostViewed = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    const viewCounts = await prisma.userActivityLog.groupBy({
      by: ["productId"],
      _count: { id: true },
      where: {
        activityType: "VIEW",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });
    const productIds = viewCounts.map(
      (result: { productId: string }) => result.productId
    );
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: { take: 10 },
        reviews: true,
        variants: true,
        wishlistItems: true,
      },
    });
    if (!products || products.length === 0) {
      res.status(200).json({ error: "No most viewed products found" });
      return;
    }
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    const wishlist = userId ? await prisma.wishlist.findMany({ 
      where: { userId: userId }, 
      include: { wishlistItems: true }
    }) : [];
    const allWishlistItems = wishlist.flatMap(w => w.wishlistItems);
    const result = products.map((product: (typeof products)[number]) => {
      const averageRating: number = product.reviews.length > 0 ? product.reviews.reduce( (acc: number, r: { rating: number }) => acc + r.rating, 0 ) / product.reviews.length : 0;
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price.toFixed(2),
        stock: product.stock,
        size: product.size,
        discountPct: product.discountPct || null,
        discountTime: product.discountTime || null,
        image: product.images.map(
          (img: { imageUrl: string; altText: string | null }) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
          })
        ),
        averageRating: averageRating.toFixed(1),
        reviewCount: product.reviews.length,
        isWishlisted: userId ? allWishlistItems.some((item: { productId: string }) => item.productId === product.id) : false,
        variant: product.variants,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching most viewed products:", error);
    res.status(500).json({ error: "Failed to fetch most viewed products" });
  }
};

/**
 * @swagger
 * /api/home/discounted-products:
 *   get:
 *     summary: Get discounted products
 *     tags: [Home]
 *     description: |
 *       Retrieves products that currently have isActive discounts. Products are filtered by having a discount percentage greater than 0 and ordered by discount percentage (highest first).
 *       
 *       **Discount Logic:**
 *       - Only includes products where **discountPct > 0**
 *       - Sorted by discount percentage in descending order (highest discounts first)
 *       - Includes both discount percentage and expiration time (if set)
 *       
 *       **Features:**
 *       - Shows current discount percentage and expiration time
 *       - Includes wishlist status for authenticated users
 *       - Returns product images (up to 10), ratings, and review counts
 *       - Price shown is original price (before discount calculation)
 *       
 *       **Authentication:**
 *       - Optional: Works for both authenticated and unauthenticated users
 *       - Authenticated users see their personal wishlist status
 *       - Unauthenticated users see **isWishlisted: false** for all products
 *       
 *       **Limits:** Maximum 10 products returned
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved discounted products
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiscountedProduct'
 *                   description: Array of discounted products ordered by discount percentage
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No discounted products found"]
 *                       description: Error when no products have isActive discounts
 *             examples:
 *               successResponse:
 *                 summary: Products with isActive discounts
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Sale Diamond Bracelet"
 *                     slug: "sale-diamond-bracelet"
 *                     description: "Elegant diamond tennis bracelet - limited time offer"
 *                     price: "1999.99"
 *                     discountPct: 25.00
 *                     discountTime: "2024-12-31T23:59:59Z"
 *                     image:
 *                       - imageUrl: "https://example.com/sale-bracelet.jpg"
 *                         altText: "Diamond tennis bracelet on sale"
 *                     averageRating: "4.8"
 *                     reviewCount: 42
 *                     isWishlisted: true
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     name: "Clearance Gold Ring"
 *                     slug: "clearance-gold-ring"
 *                     description: "Beautiful 14k gold ring - clearance pricing"
 *                     price: "599.99"
 *                     discountPct: 15.50
 *                     discountTime: null
 *                     image:
 *                       - imageUrl: "https://example.com/clearance-ring.jpg"
 *                         altText: "Gold ring on clearance"
 *                     averageRating: "4.2"
 *                     reviewCount: 18
 *                     isWishlisted: false
 *               noDiscounts:
 *                 summary: No products with isActive discounts
 *                 value:
 *                   error: "No discounted products found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch discounted products"
 */
export const getDiscountedProducts = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;
    const products = await prisma.product.findMany({
      where: { discountPct: { gt: 0 }, isActive: true },
      include: {
        images: { take: 10 },
        reviews: true,
        variants: true,
        wishlistItems: true,
      },
      orderBy: { discountPct: "desc" },
      take: 10,
    });
    if (!products || products.length === 0) {
      res.status(200).json({ error: "No discounted products found" });
      return;
    }
    if(req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    const wishlist = userId ? await prisma.wishlist.findMany({ 
      where: { userId: userId }, 
      include: { wishlistItems: true }
    }) : [];
    const allWishlistItems = wishlist.flatMap(w => w.wishlistItems);
    const result = products.map((product: (typeof products)[number]) => {
      const averageRating: number = product.reviews.length > 0 ? product.reviews.reduce( (acc: number, r: { rating: number }) => acc + r.rating, 0 ) / product.reviews.length : 0;
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price.toFixed(2),
        stock: product.stock,
        size: product.size,
        discountPct: product.discountPct || null,
        discountTime: product.discountTime || null,
        image: product.images.map(
          (img: { imageUrl: string; altText: string | null }) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
          })
        ),
        averageRating: averageRating.toFixed(1),
        reviewCount: product.reviews.length,
        isWishlisted: userId ? allWishlistItems.some((item: { productId: string }) => item.productId === product.id) : false,
        variant: product.variants,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching discounted products:", error);
    res.status(500).json({ error: "Failed to fetch discounted products" });
  }
};

/**
 * @swagger
 * /api/home/testimonials:
 *   get:
 *     summary: Get customer testimonials
 *     tags: [Home]
 *     description: |
 *       Retrieves high-quality customer reviews to display as testimonials on the homepage. Only includes reviews with ratings of 3.5 or higher to showcase positive customer experiences.
 *       
 *       **Review Filtering:**
 *       - Only reviews with rating >= 3.5 are included
 *       - Ordered by creation date (newest first)
 *       - Includes customer and product information for context
 *       
 *       **Customer Information:**
 *       - Customer name and gender (from User table)
 *       - All customer address states for credibility
 *       - Review rating and comment content
 *       
 *       **Product Information:**
 *       - Product name and slug for reference
 *       - Links testimonial to specific products
 *       
 *       **Privacy Note:**
 *       - Only publicly appropriate customer information is exposed
 *       - No sensitive data like email or full addresses
 *       
 *       **Limits:** Maximum 20 testimonials returned
 *     responses:
 *       '200':
 *         description: Successfully retrieved customer testimonials
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Testimonial'
 *                   description: Array of high-quality customer testimonials
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No testimonials found"]
 *                       description: Error when no reviews meet the rating threshold
 *             examples:
 *               successResponse:
 *                 summary: Customer testimonials with ratings >= 3.5
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     rating: 5
 *                     comment: "Absolutely stunning ring! The quality exceeded my expectations and the customer service was exceptional."
 *                     userName: "Sarah Johnson"
 *                     gender: "FEMALE"
 *                     address:
 *                       state: ["California", "Nevada"]
 *                     productName: "Diamond Engagement Ring"
 *                     productSlug: "diamond-engagement-ring"
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     rating: 4.5
 *                     comment: "Beautiful necklace, perfect for special occasions. Fast shipping too!"
 *                     userName: "Michael Chen"
 *                     gender: "MALE"
 *                     address:
 *                       state: ["New York"]
 *                     productName: "Pearl Necklace Set"
 *                     productSlug: "pearl-necklace-set"
 *                   - id: "c1d2e3f4-g5h6-7890-cdef-gh1234567890"
 *                     rating: 4
 *                     comment: "Great value for money. Would definitely recommend to friends."
 *                     userName: "Alex Rivera"
 *                     gender: "OTHER"
 *                     address:
 *                       state: ["Texas", "Arizona"]
 *                     productName: "Gold Chain Bracelet"
 *                     productSlug: "gold-chain-bracelet"
 *               noTestimonials:
 *                 summary: No qualifying testimonials
 *                 value:
 *                   error: "No testimonials found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch testimonials"
 */
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { rating: { gte: 3.5 } },
      include: {
        user: {
          select: {
            name: true,
            gender: true,
            addresses: true,
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (!reviews || reviews.length === 0) {
      res.status(200).json({ error: "No testimonials found" });
      return;
    }
    const result = reviews.map((review: (typeof reviews)[number]) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      gender: review.user.gender,
      productName: review.product.name,
      productSlug: review.product.slug,
      createAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
};

/**
 * @swagger
 * /api/home/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Home]
 *     description: |
 *       Allows registered users to subscribe their email address to receive newsletter updates and promotional content from the jewelry store.
 *       
 *       **Business Logic:**
 *       - User must already have an account in the system (email must exist in User table)
 *       - Prevents duplicate subscriptions (checks isEmailSubscribed flag)
 *       - Sends confirmation notification email upon successful subscription
 *       - Updates user's subscription status in the database
 *       
 *       **Validation:**
 *       - Email format validation using Zod schema
 *       - Email must be a valid, registered user email
 *       
 *       **Process Flow:**
 *       1. Validate email format in request body
 *       2. Check if user exists with the provided email
 *       3. Verify user is not already subscribed
 *       4. Send subscription confirmation email
 *       5. Update user's isEmailSubscribed flag to true
 *       
 *       **Authentication:**
 *       - No authentication required (public endpoint)
 *       - Only requires valid email of existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscribeEmailRequest'
 *           examples:
 *             validRequest:
 *               summary: Valid subscription request
 *               value:
 *                 email: "customer@example.com"
 *     responses:
 *       '200':
 *         description: Email subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Bad request - Invalid email format or user already subscribed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               alreadySubscribed:
 *                 summary: User is already subscribed
 *                 value:
 *                   error: "Email is already subscribed"
 *               validationError:
 *                 summary: Invalid email format
 *                 value:
 *                   error: [{"path": ["email"], "message": "Invalid email format", "code": "invalid_string"}]
 *       '404':
 *         description: User account not found - Email is not registered in the system
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
export const subscribeEmail = async (req: Request, res: Response) => {
  try {
    const data = subscribeEmailSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (user) {
      if (user.isEmailSubscribed) {
        res.status(400).json({ error: "Email is already subscribed" });
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailSubscribed: true,
        },
      });
    }
    const subscribedUser = await prisma.subscribedUsers.findUnique({
      where: { email: data.email },
    });
    if (!subscribedUser) {
      await prisma.subscribedUsers.create({
        data: {
          email: data.email,
        },
      });
    }
    sendSubscriptionNotification(data.email);
    res.status(200).json({ message: "Email subscribed successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;}
    console.error("Error subscribing email:", error);
    res.status(500).json({ error: "Failed to subscribe email", details: error instanceof Error ? error.message : undefined });
  }
};

/**
 * @swagger
 * /api/home/blog-posts:
 *   get:
 *     summary: Get all blog posts
 *     tags: [Home]
 *     description: |
 *       Retrieves all blog posts from the system, ordered by creation date (newest first). This endpoint provides blog content for the homepage or blog listing pages.
 *       
 *       **Blog Post Information:**
 *       - Complete blog post details including title, content, and metadata
 *       - Author information (userId) for attribution
 *       - URL-friendly slug for routing
 *       - Cover image for visual presentation
 *       - Creation timestamp for chronological ordering
 *       
 *       **Ordering:**
 *       - Posts are sorted by creation date in descending order (newest first)
 *       - Ensures latest content appears at the top
 *       
 *       **Content:**
 *       - Returns full blog post content (not truncated)
 *       - Includes all necessary data for blog display
 *       - Cover image URLs for featured images
 *       
 *       **Authentication:**
 *       - No authentication required (public endpoint)
 *       - Anyone can view blog posts
 *     responses:
 *       '200':
 *         description: Successfully retrieved blog posts
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                   description: Array of all blog posts ordered by creation date
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       enum: ["No blog posts found"]
 *                       description: Error when no blog posts exist in the system
 *             examples:
 *               successResponse:
 *                 summary: Blog posts retrieved successfully
 *                 value:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     title: "Latest Jewelry Trends for 2024"
 *                     slug: "latest-jewelry-trends-2024"
 *                     userId: "u1s2e3r4-i5d6-7890-user-id1234567890"
 *                     content: "Discover the hottest jewelry trends this year, from minimalist designs to statement pieces that make a bold impression..."
 *                     coverImage: "https://example.com/blog/trends-2024.jpg"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                   - id: "b1c2d3e4-f5g6-7890-bcde-fg1234567890"
 *                     title: "How to Care for Your Diamond Jewelry"
 *                     slug: "diamond-jewelry-care-guide"
 *                     userId: "u2s3e4r5-i6d7-8901-user-id2345678901"
 *                     content: "Proper care and maintenance of your diamond jewelry ensures it remains beautiful for generations. Here's our comprehensive guide..."
 *                     coverImage: "https://example.com/blog/diamond-care.jpg"
 *                     createdAt: "2024-01-10T14:45:00Z"
 *                   - id: "c1d2e3f4-g5h6-7890-cdef-gh1234567890"
 *                     title: "Choosing the Perfect Engagement Ring"
 *                     slug: "perfect-engagement-ring-guide"
 *                     userId: "u3s4e5r6-i7d8-9012-user-id3456789012"
 *                     content: "Selecting an engagement ring is one of life's most important decisions. Our expert guide covers everything from diamond quality to setting styles..."
 *                     coverImage: "https://example.com/blog/engagement-guide.jpg"
 *                     createdAt: "2024-01-05T09:15:00Z"
 *               noBlogPosts:
 *                 summary: No blog posts available
 *                 value:
 *                   error: "No blog posts found"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *         examples:
 *           serverError:
 *             summary: Database or server error
 *             value:
 *               error: "Failed to fetch blog posts"
 */
export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        userId: true,
        coverImage: true,
        content: true,
        createdAt: true,
      },
    });
    if (!posts || posts.length === 0) {
      res.status(200).json({ error: "No blog posts found" });
      return;
    }
    const result = posts.map((post: (typeof posts)[number]) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      userId: post.userId,
      content: post.content,
      coverImage: post.coverImage,
      createdAt: post.createdAt,
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
};
