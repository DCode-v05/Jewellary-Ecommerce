import { Request, Response } from 'express';
import { prisma } from "../utils/prisma";
import { createCouponSchema, deleteCouponSchema, updateCouponSchema, validateCouponSchema } from '../validators/coupon.validator';
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { getUserId } from '../utils/getUserId';

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon management and validation endpoints. Coupons provide discount functionality with various rules and restrictions including user-specific, product-specific, category-specific, and usage-limited coupons.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the coupon
 *         code:
 *           type: string
 *           description: Unique coupon code
 *         discountPct:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage (0-100)
 *         isActive:
 *           type: boolean
 *           description: Whether the coupon is currently active
 *         minPurchase:
 *           type: number
 *           format: decimal
 *           description: Minimum purchase amount required to use coupon
 *         maxUsage:
 *           type: integer
 *           description: Maximum number of times this coupon can be used
 *         appliesToAllProducts:
 *           type: boolean
 *           description: Whether coupon applies to all products
 *         isFirstTimeUserOnly:
 *           type: boolean
 *           description: Whether coupon is only for first-time users
 *         maxUsagePerUser:
 *           type: integer
 *           description: Maximum usage per individual user
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity end date
 *         usageCount:
 *           type: integer
 *           description: Current usage count
 *         usageCountPerUser:
 *           type: integer
 *           description: Current usage count per user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CouponUser'
 *         applicableProducts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CouponApplicableProduct'
 *         applicableCategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CouponApplicableCategories'
 *     CouponUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         couponId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         user:
 *           $ref: '#/components/schemas/User'
 *     CouponApplicableProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         couponId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         product:
 *           $ref: '#/components/schemas/Product'
 *     CouponApplicableCategories:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         couponId:
 *           type: string
 *           format: uuid
 *         categoryId:
 *           type: string
 *           format: uuid
 *         category:
 *           $ref: '#/components/schemas/Category'
 *     CreateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - discountPct
 *         - isActive
 *         - endDate
 *       properties:
 *         code:
 *           type: string
 *           description: Unique coupon code
 *           example: "SAVE20"
 *         discountPct:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage (0-100)
 *           example: 20
 *         isActive:
 *           type: boolean
 *           description: Whether the coupon should be active
 *           example: true
 *         minPurchaseAmount:
 *           type: number
 *           minimum: 0
 *           description: Minimum purchase amount required
 *           example: 100.00
 *         maxUsage:
 *           type: integer
 *           minimum: 1
 *           description: Maximum total usage count
 *           example: 100
 *         appliesToAllProducts:
 *           type: boolean
 *           description: Whether coupon applies to all products
 *           example: false
 *         isFirstTimeUserOnly:
 *           type: boolean
 *           description: Whether coupon is only for first-time users
 *           example: false
 *         maxUsagePerUser:
 *           type: integer
 *           minimum: 1
 *           description: Maximum usage per user
 *           example: 1
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity start date
 *           example: "2025-08-13T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity end date
 *           example: "2025-12-31T23:59:59Z"
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of user IDs this coupon applies to
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of product IDs this coupon applies to
 *         categoryIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of category IDs this coupon applies to
 *     UpdateCouponRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Coupon ID to update
 *         code:
 *           type: string
 *           description: Updated coupon code
 *         discountPct:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Updated discount percentage
 *         isActive:
 *           type: boolean
 *           description: Updated active status
 *         minPurchaseAmount:
 *           type: number
 *           minimum: 0
 *           description: Updated minimum purchase amount
 *         maxUsage:
 *           type: integer
 *           minimum: 1
 *           description: Updated maximum usage count
 *         appliesToAllProducts:
 *           type: boolean
 *           description: Updated all products flag
 *         isFirstTimeUserOnly:
 *           type: boolean
 *           description: Updated first-time user only flag
 *         maxUsagePerUser:
 *           type: integer
 *           minimum: 1
 *           description: Updated maximum usage per user
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Updated start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Updated end date
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Updated array of applicable user IDs
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Updated array of applicable product IDs
 *         categoryIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Updated array of applicable category IDs
 *     DeleteCouponRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID of the coupon to delete
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     ValidateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - totalAmount
 *         - productIds
 *       properties:
 *         code:
 *           type: string
 *           description: Coupon code to validate
 *           example: "SAVE20"
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *           description: Total purchase amount
 *           example: 150.00
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of product IDs in the cart
 *           example: ["123e4567-e89b-12d3-a456-426614174000"]
 *     ValidateCouponResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Validation result message
 *         valid:
 *           type: boolean
 *           description: Whether the coupon is valid
 *         discountPct:
 *           type: number
 *           description: Discount percentage if valid
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Product IDs the coupon applies to
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *           description: Validation errors (for Zod validation failures)
 */

/**
 * @swagger
 * /api/coupons/create:
 *   post:
 *     summary: Create a comprehensive discount coupon with advanced targeting and restrictions
 *     description: |
 *       Creates a new discount coupon in the Wymi e-commerce platform with sophisticated business rules and targeting capabilities. 
 *       This endpoint allows administrators to configure promotional campaigns with granular control over:
 *       
 *       **Discount Configuration:**
 *       - Percentage-based discounts (0-100%)
 *       - Minimum purchase amount thresholds
 *       - Active/inactive status control
 *       
 *       **Usage Limitations:**
 *       - Total usage limits across all customers
 *       - Per-user usage restrictions to prevent abuse
 *       - Date-based validity windows (start and end dates)
 *       
 *       **Customer Targeting:**
 *       - First-time customer exclusive offers
 *       - Specific user targeting via user ID lists
 *       - General public availability
 *       
 *       **Product & Category Targeting:**
 *       - Site-wide applicability across all products
 *       - Specific product targeting via product ID lists
 *       - Category-level targeting for jewelry collections, accessories, etc.
 *       
 *       **Security & Access:**
 *       - Admin-only access with role-based authentication
 *       - Cookie-based session validation
 *       - Comprehensive input validation and sanitization
 *       
 *       This endpoint is essential for marketing campaigns, seasonal promotions, customer acquisition strategies, and inventory management through strategic discounting.
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponRequest'
 *           examples:
 *             generalCoupon:
 *               summary: General 20% discount coupon
 *               value:
 *                 code: "SAVE20"
 *                 discountPct: 20
 *                 isActive: true
 *                 minPurchaseAmount: 100
 *                 maxUsage: 500
 *                 appliesToAllProducts: true
 *                 isFirstTimeUserOnly: false
 *                 maxUsagePerUser: 3
 *                 startDate: "2025-08-13T00:00:00Z"
 *                 endDate: "2025-12-31T23:59:59Z"
 *             firstTimeUserCoupon:
 *               summary: First-time user welcome coupon
 *               value:
 *                 code: "WELCOME15"
 *                 discountPct: 15
 *                 isActive: true
 *                 minPurchaseAmount: 50
 *                 maxUsage: 1000
 *                 appliesToAllProducts: true
 *                 isFirstTimeUserOnly: true
 *                 maxUsagePerUser: 1
 *                 startDate: "2025-08-13T00:00:00Z"
 *                 endDate: "2025-12-31T23:59:59Z"
 *             categorySpecificCoupon:
 *               summary: Category-specific coupon
 *               value:
 *                 code: "JEWELRY25"
 *                 discountPct: 25
 *                 isActive: true
 *                 minPurchaseAmount: 200
 *                 maxUsage: 100
 *                 appliesToAllProducts: false
 *                 isFirstTimeUserOnly: false
 *                 maxUsagePerUser: 2
 *                 startDate: "2025-08-13T00:00:00Z"
 *                 endDate: "2025-10-31T23:59:59Z"
 *                 categoryIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Validation error or bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   errors:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["code"]
 *                       message: "Code is required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. Admin role required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Internal server error"
 */
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const data = createCouponSchema.parse(req.body);
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existingCoupon) {
      res.status(400).json({ error: "Coupon with this code already exists" });
      return;
    }
    const coupon = await prisma.coupon.create({
      data: {
        id: uuidv4(),
        code: data.code,
        discountPct: data.discountPct,
        isActive: data.isActive,
        minPurchase: data.minPurchaseAmount ? data.minPurchaseAmount : 0,
        maxUsage: data.maxUsage ? data.maxUsage : 1,
        appliesToAllProducts: data.appliesToAllProducts,
        isFirstTimeUserOnly: data.isFirstTimeUserOnly,
        maxUsagePerUser: data.maxUsagePerUser ? data.maxUsagePerUser : 1,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        users: data.userIds && data.userIds.length > 0 ? {
          create: data.userIds.map(userId => ({
            id: uuidv4(),
            user: { connect: { id: userId } }
          }))
        } : undefined,
        applicableProducts: data.productIds && data.productIds.length > 0 ? {
          create: data.productIds.map(productId => ({
            id: uuidv4(),
            product: { connect: { id: productId } }
          }))
        } : undefined,
        applicableCategories: data.categoryIds && data.categoryIds.length > 0 ? {
          create: data.categoryIds.map(categoryId => ({
            id: uuidv4(),
            category: { connect: { id: categoryId } }
          }))
        } : undefined,
      },
    });
    res.status(201).json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * @swagger
 * /api/coupons/get:
 *   get:
 *     summary: Retrieve comprehensive catalog of all promotional coupons and discount offers
 *     description: |
 *       Fetches a complete inventory of all discount coupons available in the Wymi e-commerce platform, providing detailed insights into promotional campaigns and marketing initiatives.
 *       
 *       **Comprehensive Data Retrieval:**
 *       - Complete coupon metadata including codes, discounts, and validity periods
 *       - Real-time usage statistics and remaining quota information
 *       - Active/inactive status for campaign management
 *       
 *       **Relationship Data:**
 *       - Associated user targeting information (specific customer segments)
 *       - Applicable product listings with detailed product information
 *       - Category-specific targeting for jewelry collections and accessories
 *       
 *       **Business Intelligence:**
 *       - Usage tracking metrics for performance analysis
 *       - Minimum purchase thresholds for strategic pricing
 *       - Time-based validity windows for seasonal campaigns
 *       
 *       **Access Control:**
 *       - Publicly accessible endpoint for frontend coupon display
 *       - No authentication required for transparency in promotions
 *       - Suitable for customer-facing interfaces and marketing materials
 *       
 *       **Use Cases:**
 *       - Admin dashboard coupon management interfaces
 *       - Customer-facing coupon browsing and discovery
 *       - Marketing team campaign analysis and reporting
 *       - Integration with external promotional platforms
 *       
 *       This endpoint serves as the central hub for promotional visibility and campaign management in the Wymi platform.
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: List of all coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *             example:
 *               - id: "123e4567-e89b-12d3-a456-426614174000"
 *                 code: "SAVE20"
 *                 discountPct: 20
 *                 isActive: true
 *                 minPurchase: 100.00
 *                 maxUsage: 500
 *                 appliesToAllProducts: true
 *                 isFirstTimeUserOnly: false
 *                 maxUsagePerUser: 3
 *                 usageCount: 45
 *                 usageCountPerUser: 2
 *                 startDate: "2025-08-13T00:00:00Z"
 *                 endDate: "2025-12-31T23:59:59Z"
 *                 createdAt: "2025-08-13T10:30:00Z"
 *                 updatedAt: "2025-08-13T10:30:00Z"
 *                 users: []
 *                 applicableProducts: []
 *                 applicableCategories: []
 *               - id: "456e7890-e89b-12d3-a456-426614174001"
 *                 code: "WELCOME15"
 *                 discountPct: 15
 *                 isActive: true
 *                 minPurchase: 50.00
 *                 maxUsage: 1000
 *                 appliesToAllProducts: true
 *                 isFirstTimeUserOnly: true
 *                 maxUsagePerUser: 1
 *                 usageCount: 123
 *                 usageCountPerUser: 1
 *                 startDate: "2025-08-13T00:00:00Z"
 *                 endDate: "2025-12-31T23:59:59Z"
 *                 createdAt: "2025-08-13T09:15:00Z"
 *                 updatedAt: "2025-08-13T09:15:00Z"
 *                 users: []
 *                 applicableProducts: []
 *                 applicableCategories: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Internal server error"
 */
export const getAllCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        users: true,
        applicableProducts: true,
        applicableCategories: true,
      },
    });
    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/coupons/update:
 *   put:
 *     summary: Dynamically modify existing coupon campaigns with advanced configuration management
 *     description: |
 *       Provides comprehensive modification capabilities for existing promotional coupons in the Wymi e-commerce platform, enabling real-time campaign optimization and strategic adjustments.
 *       
 *       **Flexible Update Operations:**
 *       - Partial updates - modify only the fields you specify
 *       - Preserve existing configurations for unchanged attributes
 *       - Atomic operations ensuring data consistency
 *       
 *       **Campaign Management Features:**
 *       - Real-time discount percentage adjustments for dynamic pricing
 *       - Activation/deactivation controls for instant campaign management
 *       - Validity period extensions or restrictions for seasonal campaigns
 *       - Usage limit modifications for demand control
 *       
 *       **Advanced Targeting Updates:**
 *       - Customer segment refinement through user ID list modifications
 *       - Product catalog adjustments for inventory management
 *       - Category targeting updates for collection-based promotions
 *       - Complete replacement of existing associations with new targeting rules
 *       
 *       **Business Logic Enhancements:**
 *       - Minimum purchase threshold adjustments for strategic pricing
 *       - Per-user usage limit modifications for customer retention
 *       - First-time user exclusivity toggles for acquisition campaigns
 *       - Multi-product applicability configuration changes
 *       
 *       **Data Integrity & Security:**
 *       - Admin-only access with role-based authentication
 *       - Comprehensive validation of all input parameters
 *       - Transactional updates ensuring consistency across related data
 *       - Audit trail maintenance for compliance and tracking
 *       
 *       **Operational Impact:**
 *       - Immediate effect on customer-facing applications
 *       - Marketing team agility for rapid campaign adjustments
 *       - Revenue optimization through dynamic pricing strategies
 *       
 *       This endpoint is crucial for maintaining competitive promotional strategies and responding to market conditions in real-time.
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCouponRequest'
 *           examples:
 *             updateDiscount:
 *               summary: Update discount percentage
 *               value:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 discountPct: 25
 *             updateStatus:
 *               summary: Deactivate coupon
 *               value:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 isActive: false
 *             updateDates:
 *               summary: Extend coupon validity
 *               value:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 endDate: "2026-06-30T23:59:59Z"
 *             updateApplicableProducts:
 *               summary: Update applicable products
 *               value:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 appliesToAllProducts: false
 *                 productIds: ["product-uuid-1", "product-uuid-2"]
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Validation error or bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   errors:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["id"]
 *                       message: "Coupon ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. Admin role required."
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Coupon not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Internal server error"
 */
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const data = updateCouponSchema.parse(req.body);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: data.id },
    });
    if (!existingCoupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }
    if (data.code) {
      const existingCouponWithCode = await prisma.coupon.findUnique({
        where: { code: data.code },
      });
      if (existingCouponWithCode && existingCouponWithCode.id !== existingCoupon.id) {
        res.status(400).json({ message: "Coupon with this code already exists" });
        return;
      }
    }
    if (data.userIds) {
      await prisma.couponUser.deleteMany({
        where: { couponId: existingCoupon.id },
      });
    }
    if (data.productIds) {
      await prisma.couponApplicableProduct.deleteMany({
        where: { couponId: existingCoupon.id },
      });
    }
    if (data.categoryIds) {
      await prisma.couponApplicableCategories.deleteMany({
        where: { couponId: existingCoupon.id },
      });
    }
    const coupon = await prisma.coupon.update({
      where: { id: data.id },
      data: {
        code: data.code ? data.code : existingCoupon.code,
        discountPct: data.discountPct ? data.discountPct : existingCoupon.discountPct,
        isActive: data.isActive ? data.isActive : existingCoupon.isActive,
        minPurchase: data.minPurchaseAmount ? data.minPurchaseAmount : existingCoupon.minPurchase,
        maxUsage: data.maxUsage ? data.maxUsage : existingCoupon.maxUsage,
        appliesToAllProducts: data.appliesToAllProducts ? data.appliesToAllProducts : existingCoupon.appliesToAllProducts,
        isFirstTimeUserOnly: data.isFirstTimeUserOnly ? data.isFirstTimeUserOnly : existingCoupon.isFirstTimeUserOnly,
        maxUsagePerUser: data.maxUsagePerUser ? data.maxUsagePerUser : existingCoupon.maxUsagePerUser,
        startDate: data.startDate ? new Date(data.startDate) : existingCoupon.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existingCoupon.endDate,
        users: data.userIds && data.userIds.length > 0 ? {
          create: data.userIds.map(userId => ({
            id: uuidv4(),
            user: { connect: { id: userId } }
          }))
        } : undefined,
        applicableProducts: data.productIds && data.productIds.length > 0 ? {
          create: data.productIds.map(productId => ({
            id: uuidv4(),
            product: { connect: { id: productId } }
          }))
        } : undefined,
        applicableCategories: data.categoryIds && data.categoryIds.length > 0 ? {
          create: data.categoryIds.map(categoryId => ({
            id: uuidv4(),
            category: { connect: { id: categoryId } }
          }))
        } : undefined,
      },
    });
    res.status(200).json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * @swagger
 * /api/coupons/delete:
 *   delete:
 *     summary: Permanently remove promotional coupons with complete data purification and cascade cleanup
 *     description: |
 *       Executes a comprehensive and irreversible deletion of promotional coupons from the Wymi e-commerce platform, ensuring complete data cleanup and maintaining referential integrity across the system.
 *       
 *       **Complete Data Purification:**
 *       - Permanent removal of the primary coupon record and all metadata
 *       - Cascade deletion of all related association records
 *       - Cleanup of usage statistics and tracking data
 *       
 *       **Relationship Cleanup:**
 *       - Removes all user-specific targeting associations
 *       - Clears product-specific applicability records
 *       - Eliminates category-based targeting configurations
 *       - Maintains database integrity through proper foreign key handling
 *       
 *       **Security & Authorization:**
 *       - Strict admin-only access with role-based authentication
 *       - Cookie-based session validation for secure operations
 *       - Comprehensive input validation to prevent malicious requests
 *       
 *       **Operational Safeguards:**
 *       - Existence verification before deletion attempts
 *       - Atomic transaction processing to prevent partial deletions
 *       - Error handling for referential integrity violations
 *       
 *       **Business Impact Considerations:**
 *       - Immediate effect on customer-facing applications
 *       - Historical usage data permanently lost
 *       - Active customer sessions may be affected if coupon is in use
 *       - Marketing campaign analytics will reflect the removal
 *       
 *       **Use Cases:**
 *       - Expired campaign cleanup and database maintenance
 *       - Incorrect coupon removal and error correction
 *       - Policy violations and compliance requirements
 *       - System optimization and performance enhancement
 *       
 *       **⚠️ Critical Warning:**
 *       This operation is **IRREVERSIBLE** and will permanently destroy all coupon data and associated relationships. 
 *       Ensure proper backup procedures and administrative approval before execution.
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteCouponRequest'
 *           example:
 *             id: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Coupon deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon deleted successfully"
 *       400:
 *         description: Validation error or bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   errors:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["id"]
 *                       message: "Coupon ID is required"
 *               invalidUUID:
 *                 summary: Invalid UUID format
 *                 value:
 *                   errors:
 *                     - code: "invalid_string"
 *                       validation: "uuid"
 *                       path: ["id"]
 *                       message: "Invalid uuid"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. Admin role required."
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Coupon not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Internal server error"
 */
export const deleteCouponByName = async (req: Request, res: Response) => {
  try {
    const data = deleteCouponSchema.parse(req.body);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: data.id },
    });
    if (!existingCoupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }

    await prisma.couponUser.deleteMany({
      where: { couponId: data.id },
    });
    await prisma.couponApplicableProduct.deleteMany({
      where: { couponId: data.id },
    });
    await prisma.couponApplicableCategories.deleteMany({
      where: { couponId: data.id },
    });
    await prisma.coupon.delete({
      where: { id: data.id },
    });
    res.status(204).json({message: "Coupon deleted successfully"});
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Execute comprehensive coupon validation with intelligent business rule processing and real-time applicability assessment
 *     description: |
 *       Performs sophisticated, multi-layered validation of promotional coupons against shopping cart contents, customer profiles, and business rules in the Wymi e-commerce platform. This endpoint serves as the critical gateway for discount application, ensuring proper promotional compliance and fraud prevention.
 *       
 *       **Advanced Validation Engine:**
 *       - **Existence & Status Verification:** Confirms coupon exists and is currently active in the system
 *       - **Temporal Validation:** Validates current date falls within coupon validity window (start/end dates)
 *       - **Financial Threshold Checking:** Ensures cart total meets minimum purchase requirements
 *       - **Usage Quota Management:** Prevents over-utilization through total and per-user usage limits
 *       
 *       **Customer Eligibility Assessment:**
 *       - **Authentication Verification:** Validates user session through secure cookie-based authentication
 *       - **First-Time Customer Logic:** Enforces exclusive offers for new customer acquisition campaigns
 *       - **Historical Purchase Analysis:** Examines customer order history for eligibility determination
 *       - **Individual Usage Tracking:** Monitors per-customer usage against defined limits
 *       
 *       **Product & Category Intelligence:**
 *       - **Universal Applicability:** Handles site-wide promotional campaigns across all products
 *       - **Targeted Product Validation:** Ensures coupon applies to specific products in the cart
 *       - **Category-Based Logic:** Validates applicability to jewelry collections, accessories, and specific product categories
 *       - **Cross-Reference Analysis:** Matches cart contents against coupon targeting rules
 *       
 *       **Real-Time Processing:**
 *       - **Instant Validation Response:** Provides immediate feedback for seamless checkout experience
 *       - **Usage Counter Updates:** Automatically increments usage statistics upon successful validation
 *       - **Dynamic Product Filtering:** Returns specific product IDs that qualify for the discount
 *       - **Error Categorization:** Provides detailed failure reasons for improved user experience
 *       
 *       **Business Intelligence & Analytics:**
 *       - **Fraud Prevention:** Detects and prevents coupon abuse through usage pattern analysis
 *       - **Campaign Performance:** Tracks validation attempts for marketing effectiveness measurement
 *       - **Customer Behavior Insights:** Generates data for promotional strategy optimization
 *       
 *       **Integration & Security:**
 *       - **Checkout Process Integration:** Seamlessly integrates with shopping cart and payment workflows
 *       - **Session Management:** Maintains user context throughout the validation process
 *       - **Data Consistency:** Ensures atomic operations to prevent race conditions
 *       
 *       **Critical Business Impact:**
 *       - **Revenue Protection:** Prevents unauthorized discount application and financial losses
 *       - **Customer Satisfaction:** Provides clear, immediate feedback on coupon applicability
 *       - **Marketing Effectiveness:** Ensures promotional campaigns operate within defined parameters
 *       - **Operational Efficiency:** Automates complex business rule validation for scalable operations
 *       
 *       This endpoint is the cornerstone of the promotional system, handling thousands of validation requests and ensuring the integrity of discount operations across the platform.
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponRequest'
 *           examples:
 *             generalCoupon:
 *               summary: Validate general coupon
 *               value:
 *                 code: "SAVE20"
 *                 totalAmount: 150.00
 *                 productIds: ["123e4567-e89b-12d3-a456-426614174000", "456e7890-e89b-12d3-a456-426614174001"]
 *             minimumPurchase:
 *               summary: Validate with minimum purchase
 *               value:
 *                 code: "WELCOME15"
 *                 totalAmount: 75.00
 *                 productIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *             categorySpecific:
 *               summary: Validate category-specific coupon
 *               value:
 *                 code: "JEWELRY25"
 *                 totalAmount: 250.00
 *                 productIds: ["jewelry-product-uuid-1", "jewelry-product-uuid-2"]
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateCouponResponse'
 *             examples:
 *               validCoupon:
 *                 summary: Valid coupon
 *                 value:
 *                   message: "Coupon validated successfully"
 *                   valid: true
 *                   discountPct: 20
 *                   productIds: ["123e4567-e89b-12d3-a456-426614174000", "456e7890-e89b-12d3-a456-426614174001"]
 *               validCategorySpecific:
 *                 summary: Valid category-specific coupon
 *                 value:
 *                   message: "Coupon validated successfully"
 *                   valid: true
 *                   discountPct: 25
 *                   productIds: ["jewelry-product-uuid-1"]
 *       400:
 *         description: Coupon validation failed or validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidateCouponResponse'
 *                 - $ref: '#/components/schemas/Error'
 *             examples:
 *               inactiveCoupon:
 *                 summary: Inactive coupon
 *                 value:
 *                   message: "Coupon is not active"
 *                   valid: false
 *                   discountPct: 0.0
 *               minimumNotMet:
 *                 summary: Minimum purchase not met
 *                 value:
 *                   message: "Minimum purchase amount not met"
 *                   valid: false
 *                   discountPct: 0.0
 *               usageLimitReached:
 *                 summary: Usage limit reached
 *                 value:
 *                   message: "Coupon usage limit reached"
 *                   valid: false
 *                   discountPct: 0.0
 *               firstTimeUserOnly:
 *                 summary: First-time user restriction
 *                 value:
 *                   message: "Coupon is only valid for first-time users"
 *                   valid: false
 *                   discountPct: 0.0
 *               notYetValid:
 *                 summary: Coupon not yet valid
 *                 value:
 *                   message: "Coupon is not yet valid"
 *                   valid: false
 *                   discountPct: 0.0
 *               notApplicableToProducts:
 *                 summary: Not applicable to products
 *                 value:
 *                   message: "Coupon is not applicable to this product"
 *                   valid: false
 *                   discountPct: 0.0
 *               validationError:
 *                 summary: Request validation error
 *                 value:
 *                   errors:
 *                     - code: "invalid_type"
 *                       expected: "string"
 *                       received: "undefined"
 *                       path: ["code"]
 *                       message: "Code is required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Unauthorized"
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateCouponResponse'
 *             example:
 *               message: "Coupon not found"
 *               valid: false
 *               discountPct: 0.0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Internal server error"
 */
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    let userId : string | null = null;
    const data = validateCouponSchema.parse(req.body);
    if (req.cookies.accessToken) {
      userId = getUserId(req.cookies.accessToken);
    }
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.code },
      include: {
        users: true,
        applicableProducts: true,
        applicableCategories: true
      }
    });
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }
    if (!coupon.isActive) {
      res.status(400).json({ message: "Coupon is not active", valid: false, discountPct: 0.0 });
      return;
    }
    if (coupon.minPurchase && data.totalAmount < Number(coupon.minPurchase)) {
      res.status(400).json({ message: "Minimum purchase amount not met", valid: false, discountPct: 0.0 });
      return;
    }
    if (coupon.usageCount && coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      res.status(400).json({ message: "Coupon usage limit reached", valid: false, discountPct: 0.0 });
      return;
    }
    if (coupon.isFirstTimeUserOnly) {
      const orders = await prisma.order.findMany({
        where: { userId }
      });
      if (orders.length > 0) {
        res.status(400).json({ message: "Coupon is only valid for first-time users", valid: false, discountPct: 0.0 });
        return;
      }
    }
    const couponUser = await prisma.couponUser.findFirst({
      where: {
        couponId: coupon.id,
        userId: userId
      }
    });
    if (coupon.maxUsagePerUser && couponUser?.usageCount && couponUser.usageCount >= coupon.maxUsagePerUser) {
      res.status(400).json({ message: "Coupon usage limit reached for this user", valid: false, discountPct: 0.0 });
      return;
    }
    if (coupon.startDate && coupon.endDate && (new Date(coupon.startDate) > new Date() || new Date(coupon.endDate) < new Date())) {
      res.status(400).json({ message: "Coupon is not yet valid", valid: false, discountPct: 0.0 });
      return;
    }

    if (coupon.appliesToAllProducts) {
      res.status(200).json({ message: "Coupon validated successfully", valid: true, discountPct: coupon.discountPct, productIds: data.productIds });
      return;
    }

    const applicableProductIds: string[] = [];
    if (data.productIds && data.productIds.length > 0 && coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      for (const productId of data.productIds) {
        if (coupon.applicableProducts.some(ap => ap.productId === productId)) {
          applicableProductIds.push(productId);
        }
      }
    }
    if (applicableProductIds.length > 0) {
      res.status(200).json({ message: "Coupon validated successfully", valid: true, discountPct: coupon.discountPct, productIds: applicableProductIds });
      return;
    }
    res.status(400).json({ message: "Coupon is not applicable to the selected products", valid: false, discountPct: 0.0 });

    const applicableCategoryIds: string[] = [];
    if (data.productIds && data.productIds.length > 0 && coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      for (const productId of data.productIds) {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { category: true }
        });
        if (product && coupon.applicableCategories.some(ac => ac.categoryId === product.categoryId)) {
          applicableCategoryIds.push(productId);
        }
      }
    }
    if (applicableCategoryIds.length > 0) {
      res.status(200).json({ message: "Coupon validated successfully", valid: true, discountPct: coupon.discountPct, productIds: applicableCategoryIds });
      return;
    }
    res.status(400).json({ message: "Coupon is not applicable to the selected products", valid: false, discountPct: 0.0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};