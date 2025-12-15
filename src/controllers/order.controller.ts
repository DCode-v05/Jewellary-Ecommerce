import axios from "axios";
import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId";
import { prisma } from "../utils/prisma";
import { cancelOrderSchema, createOrderSchema, getOrderSchema, makePaymentFailedSchema, updateAddressSchema } from "../validators/order.validator";
import { z } from "zod";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { getShipRocketLogin } from "./shipRocket.controller";
import { createRazorPayOrderFromOrder } from "./razorpay.controller";
import { uploadFile } from "../utils/manageFile";

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management APIs for creating, retrieving, updating, and cancelling orders
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       description: Address information for shipping or billing
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the address (optional for new addresses, auto-generated if not provided)
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         firstName:
 *           type: string
 *           minLength: 1
 *           description: First name of the address holder
 *           example: "John"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           description: Last name of the address holder
 *           example: "Doe"
 *         phoneNumber:
 *           type: string
 *           minLength: 1
 *           description: Phone number for the address
 *           example: "9876543210"
 *         address1:
 *           type: string
 *           minLength: 1
 *           description: Primary address line
 *           example: "123 Main St"
 *         address2:
 *           type: string
 *           description: Secondary address line (optional)
 *           example: "Apt 4B"
 *         city:
 *           type: string
 *           minLength: 1
 *           description: City of the address
 *           example: "Kochi"
 *         state:
 *           type: string
 *           minLength: 1
 *           description: State of the address
 *           example: "Kerala"
 *         zipCode:
 *           type: string
 *           minLength: 1
 *           description: ZIP/Postal code of the address
 *           example: "682001"
 *       required:
 *         - firstName
 *         - lastName
 *         - phoneNumber
 *         - address1
 *         - city
 *         - state
 *         - zipCode
 *     OrderItemInput:
 *       type: object
 *       description: Product item to be included in the order
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the product
 *           example: "789e1234-f56a-78b9-c123-456789123456"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: The unique identifier of the product variant (optional)
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product in the order
 *           example: 2
 *       required:
 *         - productId
 *         - quantity
 *     CreateOrderRequest:
 *       type: object
 *       description: Request body for creating a new order
 *       properties:
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *           description: Total amount for the order (must match calculated total from items)
 *           example: 199.99
 *         couponDiscount:
 *           type: number
 *           minimum: 0
 *           description: Discount amount applied from coupons (optional)
 *           example: 20.00
 *         deliveryCharge:
 *           type: number
 *           minimum: 0
 *           description: Shipping/delivery charge for the order
 *           example: 50.00
 *         gstAmount:
 *           type: number
 *           minimum: 0
 *           description: GST (tax) amount for the order
 *           example: 18.00
 *         additionalCharge:
 *           type: number
 *           minimum: 0
 *           description: Any additional charges (optional)
 *           example: 10.00
 *         paymentMethod:
 *           type: string
 *           enum: [COD, CARD, UPI, NETBANKING]
 *           description: Payment method for the order. COD orders are automatically marked as ORDERED, others as PENDING
 *           example: "COD"
 *         deliveryMethod:
 *           type: string
 *           enum: [SHIPPING, STORE]
 *           description: Delivery method for the order. STORE pickup doesn't require shipping setup
 *           example: "SHIPPING"
 *         isDefault:
 *           type: boolean
 *           description: Whether billing address is the same as shipping address. If true, billingAddress can be omitted
 *           example: true
 *         isGift:
 *           type: boolean
 *           description: Whether this order is a gift (optional)
 *           example: false
 *         to:
 *           type: string
 *           description: Gift recipient name (optional, used when isGift is true)
 *           example: "Jane Smith"
 *         from:
 *           type: string
 *           description: Gift sender name (optional, used when isGift is true)
 *           example: "John Doe"
 *         message:
 *           type: string
 *           description: Gift message (optional, used when isGift is true)
 *           example: "Happy Birthday! Hope you love this gift."
 *         shippingAddress:
 *           $ref: '#/components/schemas/Address'
 *         billingAddress:
 *           allOf:
 *             - $ref: '#/components/schemas/Address'
 *             - description: Billing address (optional if isDefault is true)
 *         items:
 *           type: array
 *           minItems: 1
 *           description: List of products to order with quantities
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *         couponIds:
 *           type: array
 *           description: List of coupon IDs to apply to the order (optional)
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Coupon ID
 *                 example: "cpn-123e4567-e89b-12d3-a456-426614174000"
 *             required:
 *               - id
 *       required:
 *         - totalAmount
 *         - deliveryCharge
 *         - gstAmount
 *         - paymentMethod
 *         - deliveryMethod
 *         - isDefault
 *         - shippingAddress
 *         - items
 *     Order:
 *       type: object
 *       description: Complete order information with all related data
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the order
 *           example: "SUV-23010112000045"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the user who placed the order
 *           example: "456e7890-f12b-34c5-d678-901234567890"
 *         totalAmount:
 *           type: string
 *           description: Total amount for the order (stored as Decimal)
 *           example: "199.99"
 *         couponDiscount:
 *           type: string
 *           nullable: true
 *           description: Discount amount applied from coupons (stored as Decimal)
 *           example: "20.00"
 *         deliveryCharge:
 *           type: string
 *           description: Delivery charge for the order (stored as Decimal)
 *           example: "15.00"
 *         gstAmount:
 *           type: string
 *           description: GST amount for the order (stored as Decimal)
 *           example: "25.99"
 *         additionalCharge:
 *           type: string
 *           nullable: true
 *           description: Any additional charges (stored as Decimal)
 *           example: "5.00"
 *         status:
 *           type: string
 *           enum: [PENDING, PAID, ORDERED, SCHEDULED, READY_FOR_PICKUP, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *           description: Current status of the order. COD orders start as ORDERED, others as PENDING
 *           example: "ORDERED"
 *         paymentMethod:
 *           type: string
 *           enum: [COD, CARD, UPI, NETBANKING]
 *           description: Payment method used for the order
 *           example: "COD"
 *         deliveryMethod:
 *           type: string
 *           enum: [SHIPPING, STORE]
 *           description: Delivery method for the order
 *           example: "SHIPPING"
 *         trackingId:
 *           type: string
 *           nullable: true
 *           description: Tracking ID for the order (provided by Shiprocket for shipping orders)
 *           example: "SHIP123456789"
 *         shippingAddressId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: The unique identifier for the shipping address
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         billingAddressId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: The unique identifier for the billing address
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         orderItems:
 *           type: array
 *           description: List of items in the order with product details
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         isGift:
 *           type: boolean
 *           nullable: true
 *           description: Whether this order is a gift
 *           example: false
 *         from:
 *           type: string
 *           nullable: true
 *           description: Gift sender name (if isGift is true)
 *           example: "John Doe"
 *         to:
 *           type: string
 *           nullable: true
 *           description: Gift recipient name (if isGift is true)
 *           example: "Jane Smith"
 *         message:
 *           type: string
 *           nullable: true
 *           description: Gift message (if isGift is true)
 *           example: "Happy Birthday!"
 *         cancelReason:
 *           type: string
 *           nullable: true
 *           description: Reason for order cancellation (if status is CANCELLED)
 *           example: "Customer requested cancellation"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the order was created
 *           example: "2025-07-31T22:41:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the order was last updated
 *           example: "2025-07-31T22:41:00Z"
 *     OrderItem:
 *       type: object
 *       description: Individual item within an order with full product information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the order item
 *           example: "789e1234-f56a-78b9-c123-456789123456"
 *         orderId:
 *           type: string
 *           description: The unique identifier of the associated order
 *           example: "SUV-23010112000045"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the product
 *           example: "789e1234-f56a-78b9-c123-456789123456"
 *         variantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: The unique identifier of the product variant (if applicable)
 *           example: "456e7890-e89b-12d3-a456-426614174111"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product in the order
 *           example: 2
 *         price:
 *           type: string
 *           description: Total price for this order item (product price * quantity, stored as Decimal)
 *           example: "199.98"
 *         variant:
 *           type: object
 *           nullable: true
 *           description: Product variant details (if applicable)
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Variant identifier
 *             variantName:
 *               type: string
 *               description: Name of the variant
 *             price:
 *               type: string
 *               description: Variant price in decimal format
 *             size:
 *               type: number
 *               description: Variant size
 *             imageUrl:
 *               type: string
 *               description: Variant image URL
 *             stock:
 *               type: integer
 *               description: Available stock for this variant
 *         product:
 *           type: object
 *           description: Complete product information
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The unique identifier for the product
 *               example: "789e1234-f56a-78b9-c123-456789123456"
 *             name:
 *               type: string
 *               description: Name of the product
 *               example: "Gold Wedding Ring"
 *             slug:
 *               type: string
 *               description: URL-friendly slug for the product
 *               example: "gold-wedding-ring"
 *             description:
 *               type: string
 *               nullable: true
 *               description: Detailed description of the product
 *               example: "Elegant 18k gold wedding ring with diamond accents"
 *             metalType:
 *               type: string
 *               description: Type of metal used in the product
 *               example: "18k Gold"
 *             price:
 *               type: string
 *               description: Current price of the product (stored as Decimal)
 *               example: "99.99"
 *             discountPct:
 *               type: string
 *               nullable: true
 *               description: Discount percentage on the product
 *               example: "10.00"
 *             discountTime:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: Expiry time for the discount
 *               example: "2025-12-31T23:59:59Z"
 *             stock:
 *               type: integer
 *               description: Available stock for the product
 *               example: 100
 *             weight:
 *               type: string
 *               nullable: true
 *               description: Weight of the product in grams
 *               example: "15.50"
 *             size:
 *               type: string
 *               nullable: true
 *               description: Size of the product
 *               example: "7.5"
 *             categoryId:
 *               type: string
 *               format: uuid
 *               description: Category identifier
 *               example: "cat-123e4567-e89b-12d3-a456-426614174000"
 *             bannerImage:
 *               type: string
 *               nullable: true
 *               description: URL of the banner image for the product
 *               example: "https://example.com/banner.jpg"
 *             bannerHeading:
 *               type: string
 *               nullable: true
 *               description: Heading for the banner image
 *               example: "Exclusive Wedding Collection"
 *             bannerBody:
 *               type: string
 *               nullable: true
 *               description: Body text for the banner image
 *               example: "Limited time offer on selected wedding rings!"
 *             tag:
 *               type: string
 *               nullable: true
 *               description: Tags associated with the product
 *               example: "wedding,gold,diamond"
 *             images:
 *               type: array
 *               description: Product images
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Image identifier
 *                   imageUrl:
 *                     type: string
 *                     format: url
 *                     description: Image URL
 *                   altText:
 *                     type: string
 *                     nullable: true
 *                     description: Alternative text for image
 *             category:
 *               type: object
 *               description: Product category information
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Category identifier
 *                 name:
 *                   type: string
 *                   description: Category name
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the product was created
 *               example: "2025-07-01T10:00:00Z"
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the product was last updated
 *               example: "2025-07-15T14:30:00Z"
 *     OrderIdRequest:
 *       type: object
 *       description: Request body containing order ID
 *       properties:
 *         orderId:
 *           type: string
 *           description: The unique identifier of the order
 *           example: "SUV-23010112000045"
 *       required:
 *         - orderId
 *     UpdateAddressRequest:
 *       type: object
 *       description: Request body for updating order addresses
 *       properties:
 *         orderId:
 *           type: string
 *           description: The unique identifier of the order
 *           example: "SUV-23010112000045"
 *         shippingAddress:
 *           allOf:
 *             - $ref: '#/components/schemas/Address'
 *             - description: New shipping address (optional, only update if provided)
 *         billingAddress:
 *           allOf:
 *             - $ref: '#/components/schemas/Address'
 *             - description: New billing address (optional, only update if provided)
 *       required:
 *         - orderId
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response format
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Order not found"
 *         details:
 *           oneOf:
 *             - type: string
 *               description: Additional error details
 *             - type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   path:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                     description: Path to the field that caused the error
 *                   message:
 *                     type: string
 *                     description: Validation error message
 *                   code:
 *                     type: string
 *                     description: Error code
 *               description: Validation errors from Zod schema validation
 *     SuccessResponse:
 *       type: object
 *       description: Standard success response format
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Operation completed successfully"
 *   securitySchemes:
 *     cookieAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login endpoint. Include in Authorization header as 'Bearer <token>'
 *     CsrfToken:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *       description: CSRF token obtained from /api/csrf endpoint. Required for state-changing operations
 */


const orderIdGenerator = async () => {
    const counter = await prisma.orderCounter.create({
        data: {}
    });

    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `SUV-${yy}${mm}${dd}${hh}${min}${counter.id.toString().padStart(4, "0")}`;
};

const invoiceIdGenerator = async () => {
    const counter = await prisma.invoiceCounter.create({
        data: {}
    });

    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `INV-${yy}${mm}${dd}${hh}${min}${counter.id.toString().padStart(4, "0")}`;
};

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Create a new order
 *     description: |
 *       Creates a new order with the provided items, addresses, and payment details.
 *       - If address IDs are not provided, new addresses will be created and stored
 *       - For COD orders, status is automatically set to ORDERED
 *       - For other payment methods, status is set to PENDING
 *       - For SHIPPING delivery method, creates a Shiprocket order for tracking
 *       - Product stock is automatically reduced after successful order creation
 *       - Order items prices are calculated based on current product prices
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       - CsrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *           examples:
 *             cod_order:
 *               summary: COD Order with Same Billing Address
 *               value:
 *                 totalAmount: 199.99
 *                 deliveryCharge: 50.00
 *                 gstAmount: 18.00
 *                 paymentMethod: "COD"
 *                 deliveryMethod: "SHIPPING"
 *                 isDefault: true
 *                 shippingAddress:
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   phoneNumber: "9876543210"
 *                   address1: "123 Main St"
 *                   address2: "Apt 4B"
 *                   city: "Kochi"
 *                   state: "Kerala"
 *                   zipCode: "682001"
 *                 items:
 *                   - productId: "789e1234-f56a-78b9-c123-456789123456"
 *                     quantity: 2
 *             card_order_different_billing:
 *               summary: Card Payment with Different Billing Address
 *               value:
 *                 totalAmount: 599.99
 *                 deliveryCharge: 75.00
 *                 gstAmount: 54.00
 *                 paymentMethod: "CARD"
 *                 deliveryMethod: "SHIPPING"
 *                 isDefault: false
 *                 shippingAddress:
 *                   firstName: "Jane"
 *                   lastName: "Smith"
 *                   phoneNumber: "9876543210"
 *                   address1: "456 Oak Ave"
 *                   city: "Mumbai"
 *                   state: "Maharashtra"
 *                   zipCode: "400001"
 *                 billingAddress:
 *                   firstName: "Jane"
 *                   lastName: "Smith"
 *                   phoneNumber: "9876543210"
 *                   address1: "789 Business St"
 *                   city: "Mumbai"
 *                   state: "Maharashtra"
 *                   zipCode: "400002"
 *                 items:
 *                   - productId: "789e1234-f56a-78b9-c123-456789123456"
 *                     quantity: 1
 *                   - productId: "abc1234-def5-67gh-89ij-123456789012"
 *                     quantity: 3
 *             gift_order_with_coupons:
 *               summary: Gift Order with Coupons Applied
 *               value:
 *                 totalAmount: 299.99
 *                 couponDiscount: 30.00
 *                 deliveryCharge: 25.00
 *                 gstAmount: 27.00
 *                 additionalCharge: 5.00
 *                 paymentMethod: "UPI"
 *                 deliveryMethod: "SHIPPING"
 *                 isDefault: true
 *                 isGift: true
 *                 to: "Sarah Johnson"
 *                 from: "Mike Wilson"
 *                 message: "Happy Anniversary! Hope you love this special gift."
 *                 shippingAddress:
 *                   firstName: "Sarah"
 *                   lastName: "Johnson"
 *                   phoneNumber: "9876543210"
 *                   address1: "789 Love Street"
 *                   address2: "Suite 202"
 *                   city: "Delhi"
 *                   state: "Delhi"
 *                   zipCode: "110001"
 *                 items:
 *                   - productId: "def7890-abc1-23de-45fg-678901234567"
 *                     variantId: "var-123e4567-e89b-12d3-a456-426614174000"
 *                     quantity: 1
 *                 couponIds:
 *                   - id: "cpn-123e4567-e89b-12d3-a456-426614174000"
 *                   - id: "cpn-456e7890-f12b-34c5-d678-901234567890"
 *             store_pickup:
 *               summary: Store Pickup Order
 *               value:
 *                 totalAmount: 99.99
 *                 deliveryCharge: 0.00
 *                 gstAmount: 9.00
 *                 paymentMethod: "UPI"
 *                 deliveryMethod: "STORE"
 *                 isDefault: true
 *                 shippingAddress:
 *                   firstName: "Bob"
 *                   lastName: "Wilson"
 *                   phoneNumber: "9876543210"
 *                   address1: "321 Store St"
 *                   city: "Bangalore"
 *                   state: "Karnataka"
 *                   zipCode: "560001"
 *                 items:
 *                   - productId: "def7890-abc1-23de-45fg-678901234567"
 *                     quantity: 1
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Order'
 *                 - type: object
 *                   properties:
 *                     id:
 *                       example: "SUV-23010112000045"
 *                     status:
 *                       example: "ORDERED"
 *                     trackingId:
 *                       example: "SHIP789123456"
 *             examples:
 *               cod_order_response:
 *                 summary: COD Order Response
 *                 value:
 *                   id: "SUV-23010112000045"
 *                   userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *                   totalAmount: "199.99"
 *                   status: "ORDERED"
 *                   paymentMethod: "COD"
 *                   deliveryMethod: "SHIPPING"
 *                   trackingId: "SHIP789123456"
 *                   shippingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                   billingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                   createdAt: "2025-08-09T10:30:00Z"
 *                   updatedAt: "2025-08-09T10:30:00Z"
 *               pending_order_response:
 *                 summary: Pending Order Response (Non-COD)
 *                 value:
 *                   id: "SUV-23010112000045"
 *                   userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *                   totalAmount: "599.99"
 *                   status: "PENDING"
 *                   paymentMethod: "CARD"
 *                   deliveryMethod: "SHIPPING"
 *                   trackingId: null
 *                   shippingAddressId: "addr-222e3333-f44g-55h6-i789-012345678901"
 *                   billingAddressId: "addr-333e4444-f55g-66h7-i890-123456789012"
 *                   createdAt: "2025-08-09T10:30:00Z"
 *                   updatedAt: "2025-08-09T10:30:00Z"
 *       400:
 *         description: Invalid request data or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation Error
 *                 value:
 *                   error: "Validation failed"
 *                   details:
 *                     - path: ["items", 0, "quantity"]
 *                       message: "Number must be greater than or equal to 1"
 *                       code: "too_small"
 *                     - path: ["shippingAddress", "firstName"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *               product_not_found:
 *                 summary: Product Not Found
 *                 value:
 *                   error: "Internal server error"
 *                   details: "Product with id abc123 not found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       500:
 *         description: Internal server error - Database error, Shiprocket API error, or other system error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               database_error:
 *                 summary: Database Error
 *                 value:
 *                   error: "Internal server error"
 *                   details: "Database connection failed"
 *               shiprocket_error:
 *                 summary: Shiprocket API Error
 *                 value:
 *                   error: "Failed to create shipping order"
 */
export const createOrder = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const order = createOrderSchema.parse(req.body);
        if (order.items.length > 0) {
            const inActiveProducts = [];
            for (const item of order.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    res.status(404).json({ error: `Product with id ${item.productId} not found` });
                    return;
                }
                if (!product.isActive) {
                    inActiveProducts.push(item.productId);
                }
            }
            if (inActiveProducts.length > 0) {
                res.status(400).json({
                    error: "Some products are inactive",
                    details: inActiveProducts,
                });
                return;
            }
        }
        
        if (order.items.length > 0) {
            const inSufficientStockItems = [];
            for (const item of order.items) {
                if (item.variantId){
                    const variant = await prisma.productVariant.findUnique({
                        where: { id: item.variantId },
                    });
                    if (variant && variant.stock < item.quantity) {
                        inSufficientStockItems.push({
                            productId: item.productId,
                            variantId: item.variantId,
                            availableStock: variant.stock || 0,
                        });
                    }
                } else {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                    });
                    if (product && product.stock < item.quantity) {
                        inSufficientStockItems.push({
                            productId: item.productId,
                            variantId: null,
                            availableStock: product.stock || 0,
                        });
                    }
                }
            }
            if (inSufficientStockItems.length > 0) {
                res.status(400).json({
                    error: "Insufficient stock for some items",
                    details: inSufficientStockItems,
                });
                return;
            }
        }
        let shippingAddressId = null;
        let billingAddressId = null;
        if (order.shippingAddress) {
            shippingAddressId = order.shippingAddress.id ? order.shippingAddress.id : uuidv4();
            if (!order.shippingAddress.id) {
                await prisma.address.create({
                    data: {
                        id: shippingAddressId,
                        userId: userId,
                        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                        phone: order.shippingAddress.phoneNumber,
                        addressLine1: order.shippingAddress.address1,
                        addressLine2: order.shippingAddress.address2 || "",
                        city: order.shippingAddress.city,
                        state: order.shippingAddress.state,
                        zipCode: order.shippingAddress.zipCode,
                    },
                });
            }
            billingAddressId = shippingAddressId;
            if (!order.isDefault && order.billingAddress) {
                billingAddressId = order.billingAddress.id ? order.billingAddress.id : uuidv4();
                if (!order.billingAddress.id) {
                    await prisma.address.create({
                        data: {
                            id: billingAddressId,
                            userId: userId,
                            name: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
                            phone: order.billingAddress.phoneNumber,
                            addressLine1: order.billingAddress.address1,
                            addressLine2: order.billingAddress.address2 || "",
                            city: order.billingAddress.city,
                            state: order.billingAddress.state,
                            zipCode: order.billingAddress.zipCode,
                        },
                    });
                }
            }
        }
        const createdOrder = await prisma.order.create({
            data: {
                id: await orderIdGenerator(),
                userId: userId,
                totalAmount: order.totalAmount,
                couponDiscount: order.couponDiscount || 0,
                deliveryCharge: order.deliveryCharge,
                gstAmount: order.gstAmount,
                additionalCharge: order.additionalCharge || 0,
                paymentMethod: order.paymentMethod,
                deliveryMethod: order.deliveryMethod,
                orderStatus: OrderStatus.ORDERED,
                paymentStatus: PaymentStatus.PENDING,
                shippingAddressId: shippingAddressId,
                billingAddressId: billingAddressId,
                invoiceId: await invoiceIdGenerator(),
                isGift: order.isGift || false,
                to: order.to || "",
                from: order.from || "",
                message: order.message || "",
            },
        });
        for (const item of order.items) {
            if (item.variantId){
                const variant = await prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                });
                if (!variant) {
                    res.status(404).json({ error: "Variant not found" });
                    return;
                }
                await prisma.orderItem.create({
                    data: {
                        id: uuidv4(),
                        orderId: createdOrder.id,
                        productId: item.productId,
                        variantId: item.variantId || null,
                        quantity: item.quantity,
                        price: Number(variant.price) * item.quantity,
                    },
                });
                if (order.paymentMethod === "COD") {
                    await prisma.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: variant.stock - item.quantity,
                        },
                    });
                }
            } else {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    res.status(404).json({ error: "Product not found" });
                    return;
                }
                await prisma.orderItem.create({
                    data: {
                        id: uuidv4(),
                        orderId: createdOrder.id,
                        productId: item.productId,
                        variantId: item.variantId || null,
                        quantity: item.quantity,
                        price: Number(product.price) * item.quantity,
                    },
                });
                if (order.paymentMethod === "COD") {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: product.stock - item.quantity,
                        },
                    });
                }
            }
        }
        if (order.paymentMethod === "COD") {
            const carts = await prisma.cart.findUnique({
                where: { id: order.cartId },
                include: { cartItems: true },
            });
            if (carts) {
                await prisma.cartItem.deleteMany({
                    where: { cartId: carts.id },
                });
                await prisma.cart.delete({
                    where: { id: carts.id },
                });
            }
            if (order.couponIds && order.couponIds.length > 0) {
                for(const coupon of order.couponIds) {
                    await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: {
                            usageCount: { increment: 1 },
                        },
                    });
                    await prisma.couponUser.upsert({
                        where: { couponId_userId: { couponId: coupon.id, userId: userId } },
                        update: {
                            usageCount: { increment: 1 }
                        },
                        create: {
                            couponId: coupon.id,
                            userId: userId,
                            usageCount: 1
                        }
                    });
                }
            }
        }
        let razorpayOrder = null;
        if (order.paymentMethod === "CARD" || order.paymentMethod === "UPI" || order.paymentMethod === "NETBANKING") {
            razorpayOrder = await createRazorPayOrderFromOrder(order.totalAmount, "INR", createdOrder.id);
        }
        res.status(200).json({ createdOrder, razorpayOrder, couponIds: order.couponIds });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error creating order:", JSON.stringify(error, null, 2));
        res.status(500).json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : JSON.stringify(error, null, 2)
        });
    }
};

/**
 * @swagger
 * /api/orders/payment-failed:
 *   post:
 *     summary: Mark order payment as failed
 *     description: |
 *       Marks an existing order's payment status as failed.
 *       - Only the order owner can mark their order payment as failed
 *       - Updates the order status to "FAILED"
 *       - Requires valid authentication (user must be logged in)
 *       - Order must exist and belong to the authenticated user
 *       - This action is typically used when payment processing fails
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       description: Request body containing the order ID to mark as payment failed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderIdRequest'
 *           example:
 *             orderId: "SUV-23010112000045"
 *     responses:
 *       200:
 *         description: Payment marked as failed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Payment marked as failed"
 *             example:
 *               message: "Payment marked as failed"
 *       400:
 *         description: Bad request - Invalid input or missing order ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Order ID is required"
 *             example:
 *               error: "Order ID is required"
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Unauthorized"
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Order not found or doesn't belong to the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Order not found"
 *             example:
 *               error: "Order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Internal server error"
 *                 details:
 *                   type: string
 *                   description: Additional error details
 *                   example: "Database connection failed"
 *             example:
 *               error: "Internal server error"
 *               details: "Database connection failed"
 */
export const makePaymentFailed = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = makePaymentFailedSchema.parse(req.body);
        if (!data.orderId) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }
        const order = await prisma.order.findUnique({
            where: { id: data.orderId, userId: userId },
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        await prisma.order.update({
            where: { id: data.orderId },
            data: { paymentStatus: PaymentStatus.FAILED },
        });
        await prisma.orderItem.deleteMany({
            where: { orderId: data.orderId },
        });
        await prisma.order.delete({
            where: { id: data.orderId },
        });
        res.status(200).json({ message: "Payment marked as failed" });
    } catch (error) {
        console.error("Error marking payment as failed:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * @swagger
 * /api/orders/get:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     description: |
 *       Retrieves a list of all orders placed by the authenticated user.
 *       - Returns orders sorted by creation date (newest first)
 *       - Includes complete order details with product information
 *       - Returns empty response with 200 status if no orders are found
 *       - Each order includes all order items with full product details
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully or no orders found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                   description: List of user orders with full details
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "No Orders found"
 *                   description: Response when user has no orders
 *             examples:
 *               orders_found:
 *                 summary: User Has Orders
 *                 value:
 *                   - id: "SUV-23010112000045"
 *                     userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *                     totalAmount: "199.99"
 *                     status: "DELIVERED"
 *                     paymentMethod: "COD"
 *                     deliveryMethod: "SHIPPING"
 *                     trackingId: "SHIP789123456"
 *                     shippingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                     billingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                     orderItems:
 *                       - id: "item-789e1234-f56a-78b9-c123-456789123456"
 *                         orderId: "SUV-23010112000045"
 *                         productId: "prod-abc1234-def5-67gh-89ij-123456789012"
 *                         quantity: 2
 *                         price: "199.98"
 *                         product:
 *                           id: "prod-abc1234-def5-67gh-89ij-123456789012"
 *                           name: "Gold Wedding Ring"
 *                           slug: "gold-wedding-ring"
 *                           description: "Elegant 18k gold wedding ring"
 *                           metalType: "18k Gold"
 *                           price: "99.99"
 *                           discountPct: null
 *                           stock: 98
 *                           weight: "15.50"
 *                           size: "7.5"
 *                           categoryId: "cat-123e4567-e89b-12d3-a456-426614174000"
 *                     createdAt: "2025-08-01T10:30:00Z"
 *                     updatedAt: "2025-08-05T14:45:00Z"
 *                   - id: "ord-234f5678-g90h-23i4-j567-890123456789"
 *                     userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *                     totalAmount: "299.99"
 *                     status: "SHIPPED"
 *                     paymentMethod: "UPI"
 *                     deliveryMethod: "SHIPPING"
 *                     trackingId: "SHIP890234567"
 *                     shippingAddressId: "addr-222e3333-f44g-55h6-i789-012345678901"
 *                     billingAddressId: "addr-222e3333-f44g-55h6-i789-012345678901"
 *                     orderItems:
 *                       - id: "item-890f2345-g67h-89i0-j234-567890123456"
 *                         orderId: "ord-234f5678-g90h-23i4-j567-890123456789"
 *                         productId: "prod-def5678-ghi9-01jk-23lm-456789012345"
 *                         quantity: 1
 *                         price: "299.99"
 *                         product:
 *                           id: "prod-def5678-ghi9-01jk-23lm-456789012345"
 *                           name: "Diamond Necklace"
 *                           slug: "diamond-necklace"
 *                           description: "Premium diamond necklace"
 *                           metalType: "Platinum"
 *                           price: "299.99"
 *                           discountPct: "10.00"
 *                           stock: 5
 *                           weight: "25.00"
 *                           size: null
 *                           categoryId: "cat-234f5678-g90h-23i4-j567-890123456789"
 *                     createdAt: "2025-08-03T16:20:00Z"
 *                     updatedAt: "2025-08-04T11:15:00Z"
 *               no_orders:
 *                 summary: User Has No Orders
 *                 value:
 *                   error: "No Orders found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       500:
 *         description: Internal server error - Database error or other system error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
export const getOrdersByUser = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req.cookies.accessToken);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const orders = await prisma.order.findMany({
            where: { userId: userId },
            include: {
                user: true,
                orderItems: {
                    include: { 
                        product: {
                            include: {
                                images: true,
                                category: true,
                            }
                        },
                        variant: true
                    },
                },
            },
        });
        if (!orders || orders.length === 0) {
            res.status(200).json({ error: "No Orders found" });
            return;
        }

        const result = await Promise.all(orders.map(async (order) => {
            const shippingAddress = order.shippingAddressId ? await prisma.address.findUnique({
                where: { id: order.shippingAddressId },
            }) : null;
            return {
                id: order.id,
                userId: order.userId,
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone,
                totalAmount: order.totalAmount,
                couponDiscount: order.couponDiscount,
                deliveryCharge: order.deliveryCharge,
                gstAmount: order.gstAmount,
                additionalCharge: order.additionalCharge,
                orderStatus: order.orderStatus, 
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                deliveryMethod: order.deliveryMethod,
                trackingId: order.trackingId,
                paymentId: order.paymentId,
                isGift: order.isGift,
                from: order.from,
                to: order.to,
                message: order.message,
                amountRefunded: order.amountRefunded,
                invoiceId: order.invoiceId,
                cancelReason: order.cancelReason,
                cancelVideoUrl: order.cancelVideo,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                address: {
                    id: shippingAddress?.id,
                    userId: shippingAddress?.userId,
                    name: shippingAddress?.name,
                    phone: shippingAddress?.phone,
                    addressLine1: shippingAddress?.addressLine1,
                    addressLine2: shippingAddress?.addressLine2,
                    city: shippingAddress?.city,
                    state: shippingAddress?.state,
                    zipcode: shippingAddress?.zipCode,
                    country: shippingAddress?.country,
                    createdAt: shippingAddress?.createdAt,
                    updatedAt: shippingAddress?.updatedAt,
                },
                orderItems: order.orderItems.map((item) => ({
                    id: item.id,
                    orderId: item.orderId,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price,
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        slug: item.product.slug,
                        description: item.product.description,
                        metalType: item.product.metalType,
                        price: item.product.price,
                        discountPct: item.product.discountPct,
                        discountTime: item.product.discountTime,
                        stock: item.product.stock,
                        weight: item.product.weight,
                        size: item.product.size,
                        categoryId: item.product.categoryId,
                        tag: item.product.tag,
                        applyDiscountToVariants: item.product.applyDiscountToVariants,
                        images: item.product.images.map((image) => ({
                            id: image.id,
                            productId: image.productId,
                            imageUrl: image.imageUrl,
                            altText: image.altText,
                        })),
                        category: {
                            id: item.product.category.id,
                            name: item.product.category.name,
                            slug: item.product.category.slug,
                            description: item.product.category.description,
                        },
                    },
                    variant: {
                        id: item.variant?.id,
                        productId: item.variant?.productId,
                        variantName: item.variant?.variantName,
                        price: item.variant?.price,
                        stock: item.variant?.stock,
                        imageUrl: item.variant?.imageUrl,
                        altText: item.variant?.altText,
                    },
                }))
            };
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
};

/**
 * @swagger
 * /api/orders/get-by-id:
 *   get:
 *     summary: Get a specific order by ID
 *     description: |
 *       Retrieves detailed information for a specific order by its unique identifier.
 *       - Only returns orders that belong to the authenticated user
 *       - Includes complete order details with all order items and product information
 *       - Returns 404 if order doesn't exist or doesn't belong to the user
 *       
 *       **Note:** This endpoint currently uses POST body for the order ID parameter, 
 *       which is not RESTful. Consider using query parameters or path parameters instead.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       description: Request body containing the order ID to retrieve
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderIdRequest'
 *           example:
 *             orderId: "SUV-23010112000045"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *             example:
 *               id: "SUV-23010112000045"
 *               userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *               totalAmount: "199.99"
 *               status: "SHIPPED"
 *               paymentMethod: "COD"
 *               deliveryMethod: "SHIPPING"
 *               trackingId: "SHIP789123456"
 *               shippingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *               billingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *               orderItems:
 *                 - id: "item-789e1234-f56a-78b9-c123-456789123456"
 *                   orderId: "SUV-23010112000045"
 *                   productId: "prod-abc1234-def5-67gh-89ij-123456789012"
 *                   quantity: 2
 *                   price: "199.98"
 *                   product:
 *                     id: "prod-abc1234-def5-67gh-89ij-123456789012"
 *                     name: "Gold Wedding Ring"
 *                     slug: "gold-wedding-ring"
 *                     description: "Elegant 18k gold wedding ring with diamond accents"
 *                     metalType: "18k Gold"
 *                     price: "99.99"
 *                     discountPct: null
 *                     discountTime: null
 *                     stock: 98
 *                     weight: "15.50"
 *                     size: "7.5"
 *                     categoryId: "cat-123e4567-e89b-12d3-a456-426614174000"
 *                     bannerImage: "https://example.com/banner.jpg"
 *                     bannerHeading: "Wedding Collection"
 *                     bannerBody: "Exclusive wedding rings"
 *                     tag: "wedding,gold,diamond"
 *                     createdAt: "2025-07-01T10:00:00Z"
 *                     updatedAt: "2025-07-15T14:30:00Z"
 *               createdAt: "2025-08-01T10:30:00Z"
 *               updatedAt: "2025-08-03T16:45:00Z"
 *       400:
 *         description: Invalid request data - Missing or invalid order ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_order_id:
 *                 summary: Missing Order ID
 *                 value:
 *                   error: "Invalid request data"
 *                   details:
 *                     - path: ["orderId"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *               invalid_uuid:
 *                 summary: Invalid UUID Format
 *                 value:
 *                   error: "Invalid request data"
 *                   details:
 *                     - path: ["orderId"]
 *                       message: "Invalid uuid"
 *                       code: "invalid_string"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Order not found - Order doesn't exist or doesn't belong to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Order not found"
 *       500:
 *         description: Internal server error - Database error or other system error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *               details: "Database connection failed"
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const data = getOrderSchema.parse(req.params);
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
                user: true,
                orderItems: {
                    include: { 
                        product: {
                            include: {
                                category: true,
                                images: true,
                            },
                        },
                        variant: true
                    },
                },
            },
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        let shippingAddress = null;
        if (order.shippingAddressId) {
            shippingAddress = await prisma.address.findUnique({
                where: { id: order.shippingAddressId },
            });

        }
        let billingAddress = null;
        if (order.billingAddressId) {
            billingAddress = await prisma.address.findUnique({
                where: { id: order.billingAddressId },
            });
        }
        const result = {
            id: order.id,
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
            totalAmount: order.totalAmount,
            couponDiscount: order.couponDiscount,
            deliveryCharge: order.deliveryCharge,
            gstAmount: order.gstAmount,
            additionalCharge: order.additionalCharge,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            deliveryMethod: order.deliveryMethod,
            trackingId: order.trackingId,
            paymentId: order.paymentId,
            isGift: order.isGift,
            from: order.from,
            to: order.to,
            message: order.message,
            cancelReason: order.cancelReason,
            cancelVideoUrl: order.cancelVideo,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shippingAddress: {
                id: shippingAddress?.id,
                userId: shippingAddress?.userId,
                name: shippingAddress?.name,
                phone: shippingAddress?.phone,
                addressLine1: shippingAddress?.addressLine1,
                addressLine2: shippingAddress?.addressLine2,
                city: shippingAddress?.city,
                state: shippingAddress?.state,
                zipcode: shippingAddress?.zipCode,
                country: shippingAddress?.country,
                createdAt: shippingAddress?.createdAt,
                updatedAt: shippingAddress?.updatedAt,
            },
            billingAddress: {
                id: billingAddress?.id,
                userId: billingAddress?.userId,
                name: billingAddress?.name,
                phone: billingAddress?.phone,
                addressLine1: billingAddress?.addressLine1,
                addressLine2: billingAddress?.addressLine2,
                city: billingAddress?.city,
                state: billingAddress?.state,
                zipcode: billingAddress?.zipCode,
                country: billingAddress?.country,
                createdAt: billingAddress?.createdAt,
                updatedAt: billingAddress?.updatedAt,
            },
            orderItems: order.orderItems.map((item) => ({
                id: item.id,
                orderId: item.orderId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    description: item.product.description,
                    metalType: item.product.metalType,
                    price: item.product.price,
                    discountPct: item.product.discountPct,
                    discountTime: item.product.discountTime,
                    stock: item.product.stock,
                    weight: item.product.weight,
                    size: item.product.size,
                    categoryId: item.product.categoryId,
                    tag: item.product.tag,
                    applyDiscountToVariants: item.product.applyDiscountToVariants,
                    images: item.product.images.map((image) => ({
                        id: image.id,
                        productId: image.productId,
                        imageUrl: image.imageUrl,
                        altText: image.altText,
                    })),
                    category: {
                        id: item.product.category.id,
                        name: item.product.category.name,
                        slug: item.product.category.slug,
                        description: item.product.category.description,
                    },
                },
                variant: {
                    id: item.variant?.id,
                    productId: item.variant?.productId,
                    variantName: item.variant?.variantName,
                    price: item.variant?.price,
                    stock: item.variant?.stock,
                    imageUrl: item.variant?.imageUrl,
                    altText: item.variant?.altText,
                },
            }))
        };
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Invalid request data", details: error.errors });
            return;
        }
        console.error("Error fetching order:", error);
        res.status(500).json({ 
            error: "Internal server error", 
            details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error) 
        });
    }
};

/**
 * @swagger
 * /api/orders/tracking:
 *   get:
 *     summary: Get real-time tracking information for all user orders
 *     description: |
 *       Retrieves tracking information for all orders belonging to the authenticated user. This endpoint:
 *       - Fetches all orders for the authenticated user from the database
 *       - Queries Shiprocket API for real-time tracking data for each order that has a tracking ID
 *       - Automatically updates order status based on tracking information:
 *         - Updates status from "ORDERED" to "SHIPPED" when pickup_date is available
 *         - Updates status from "SHIPPED" to "DELIVERED" when delivery_date is available
 *       - Returns updated order information with current tracking status
 *       
 *       **Authentication Required**: User must be logged in with a valid JWT token in cookies.
 *       **External API**: Integrates with Shiprocket courier tracking API for real-time updates.
 *       **Auto-Update**: Order statuses are automatically synchronized with shipping provider data.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved tracking information for all user orders
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   description: List of user orders with updated tracking information
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         description: The unique identifier of the order
 *                         example: "SUV-23010112000045"
 *                       status:
 *                         type: string
 *                         enum: [PENDING, PAID, ORDERED, SCHEDULED, READY_FOR_PICKUP, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *                         description: Current status of the order (automatically updated based on tracking data)
 *                         example: "SHIPPED"
 *                       trackingId:
 *                         type: string
 *                         nullable: true
 *                         description: Tracking ID from shipping provider (null if not available)
 *                         example: "SHIP123456789"
 *                     required:
 *                       - orderId
 *                       - status
 *                       - trackingId
 *                 - type: object
 *                   description: Response when no orders are found
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "No orders found"
 *             examples:
 *               ordersWithTracking:
 *                 summary: Orders with tracking information
 *                 value:
 *                   - id: "123e4567-e89b-12d3-a456-426614174000"
 *                     userId: "456e7890-f12b-34c5-d678-901234567890"
 *                     totalAmount: "199.99"
 *                     status: "SHIPPED"
 *                     paymentMethod: "COD"
 *                     deliveryMethod: "SHIPPING"
 *                     trackingId: "SHIP123456789"
 *                     createdAt: "2025-08-24T10:00:00Z"
 *                     updatedAt: "2025-08-25T11:30:00Z"
 *                     trackingData:
 *                       shipment_track:
 *                         pickup_date: "2025-08-25T10:30:00Z"
 *                         current_status: "In Transit"
 *                         shipment_track_activities:
 *                           - date: "2025-08-24T10:00:00Z"
 *                             status: "Picked Up"
 *                             location: "Mumbai Hub"
 *                             activity: "Shipment picked up from origin"
 *                           - date: "2025-08-25T08:00:00Z"
 *                             status: "In Transit"
 *                             location: "Delhi Hub"
 *                             activity: "Shipment arrived at sorting facility"
 *               noOrders:
 *                 summary: No orders found
 *                 value:
 *                   error: "No orders found"
 *       401:
 *         description: |
 *           Unauthorized - User authentication failed. This can happen when:
 *           - No authentication token is provided in cookies
 *           - Authentication token is invalid or expired
 *           - User session has been terminated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       500:
 *         description: |
 *           Internal server error occurred while fetching tracking information. This can happen due to:
 *           - Database connection issues
 *           - Shiprocket API connectivity problems
 *           - Network timeouts or service unavailability
 *           - Invalid tracking ID format or missing tracking data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: General server error
 *                 value:
 *                   error: "Internal server error"
 *                   details: "Unable to connect to tracking service"
 *               apiError:
 *                 summary: External API error
 *                 value:
 *                   error: "Internal server error"
 *                   details: "Shiprocket API returned invalid response"
 */
export const getOrderTracking = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const orders = await prisma.order.findMany({
            where: { userId: userId },
        });
        if (!orders || orders.length === 0) {
            res.status(200).json({ error: "No orders found" });
            return;
        }
        for (const order of orders) {
            let shiprocketToken;
            if (order.trackingId) {
                if (req.cookies.shiprocket_token) {
                    shiprocketToken = req.cookies.shiprocket_token;
                } else {
                    await getShipRocketLogin(req, res);
                    shiprocketToken = req.cookies.shiprocket_token;
                }
                const tracking = await axios.post(`${process.env.SHIPROCKET_API_URL}/courier/track/shipment/${order.trackingId}`, {
                    headers: {
                        Authorization: `Bearer ${shiprocketToken}`,
                    },
                });
                if (["ORDERED", "SHIPPED"].includes(order.orderStatus) && tracking.data.tracking_data.shipment_track.delivery_date) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { orderStatus: OrderStatus.DELIVERED },
                    });
                }
                if (["ORDERED"].includes(order.orderStatus) && tracking.data.tracking_data.shipment_track.pickup_date) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { orderStatus: OrderStatus.SHIPPED },
                    });
                }
            }
        }
        const result = orders.map(order => ({
            orderId: order.id,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            trackingId: order.trackingId || null,
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching tracking information:", error);
        res.status(500).json({
            error: "Internal server error",
            details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
        });
    }
};

/**
 * @swagger
 * /api/orders/update-address:
 *   put:
 *     summary: Update shipping and/or billing address for an existing order
 *     description: |
 *       Updates the shipping and/or billing addresses for an existing order.
 *       - Only the order owner can update addresses
 *       - Both shippingAddress and billingAddress are optional in the request
 *       - If address ID is provided, it updates the existing address record
 *       - For shipping orders, also updates the address with Shiprocket API
 *       - Store pickup orders don't trigger Shiprocket address updates
 *       - Address updates are reflected in the user's saved addresses
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       - CsrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAddressRequest'
 *           examples:
 *             update_shipping_only:
 *               summary: Update Shipping Address Only
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 shippingAddress:
 *                   id: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                   name: "John Doe"
 *                   phone: "9876543210"
 *                   addressLine1: "456 New Street"
 *                   addressLine2: "Suite 5C"
 *                   city: "Kochi"
 *                   state: "Kerala"
 *                   zipCode: "682002"
 *             update_both_addresses:
 *               summary: Update Both Addresses
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 shippingAddress:
 *                   id: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                   name: "Jane Smith"
 *                   phone: "9876543210"
 *                   addressLine1: "789 Updated Ave"
 *                   city: "Mumbai"
 *                   state: "Maharashtra"
 *                   zipCode: "400001"
 *                 billingAddress:
 *                   id: "addr-222e3333-f44g-55h6-i789-012345678901"
 *                   name: "Jane Smith"
 *                   phone: "9876543210"
 *                   addressLine1: "123 Business Plaza"
 *                   city: "Mumbai"
 *                   state: "Maharashtra"
 *                   zipCode: "400002"
 *             update_billing_only:
 *               summary: Update Billing Address Only
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 billingAddress:
 *                   id: "addr-333e4444-f55g-66h7-i890-123456789012"
 *                   name: "Bob Wilson"
 *                   phone: "9876543210"
 *                   addressLine1: "321 Corporate St"
 *                   city: "Bangalore"
 *                   state: "Karnataka"
 *                   zipCode: "560001"
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: "Address updated successfully"
 *       400:
 *         description: Invalid request data - Missing order ID or invalid address data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_order_id:
 *                 summary: Missing Order ID
 *                 value:
 *                   error: "Validation failed"
 *                   details:
 *                     - path: ["orderId"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *               invalid_address:
 *                 summary: Invalid Address Data
 *                 value:
 *                   error: "Validation failed"
 *                   details:
 *                     - path: ["shippingAddress", "firstName"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *                     - path: ["shippingAddress", "zipCode"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Order not found - Order doesn't exist or doesn't belong to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Order not found"
 *       500:
 *         description: Internal server error - Database error, Shiprocket API error, or other system error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               database_error:
 *                 summary: Database Error
 *                 value:
 *                   error: "Internal server error"
 *               shiprocket_error:
 *                 summary: Shiprocket Update Failed
 *                 value:
 *                   error: "Failed to update shipping address"
 *               billing_update_error:
 *                 summary: Billing Address Update Failed
 *                 value:
 *                   error: "Failed to update billing address"
 */
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req.cookies.accessToken);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = updateAddressSchema.parse(req.body);
        const order = await prisma.order.findUnique({
            where: { id: data.orderId, userId: userId },
            include: {
                user: {
                    select: {
                        email: true,
                        phone: true,
                    },
                },
            }
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        if (order.deliveryMethod !== "SHIPPING") {
            res.status(400).json({ error: "Invalid delivery method" });
            return;
        }
        if (order.orderStatus !== "ORDERED") {
            res.status(400).json({ error: "Invalid order status" });
            return;
        }
        const shippingAddress = await prisma.address.create({
            data: {
                id: uuidv4(),
                userId: userId,
                name: `${data.shippingAddress.firstName} ${data.shippingAddress.lastName}`,
                phone: data.shippingAddress.phoneNumber,
                addressLine1: data.shippingAddress.address1,
                addressLine2: data.shippingAddress.address2,
                city: data.shippingAddress.city,
                state: data.shippingAddress.state,
                zipCode: data.shippingAddress.zipCode,
            },
        });
        await prisma.order.update({
            where: { id: order.id },
            data: { 
                shippingAddressId: shippingAddress.id,
            },
        });
            // let shiprocketToken;
            // if (req.cookies.shiprocket_token) {
            //     shiprocketToken = req.cookies.shiprocket_token;
            // } else {
            //     await getShipRocketLogin(req, res);
            //     shiprocketToken = req.cookies.shiprocket_token;
            // }
            // const updateShippingAddress = await axios.post(`${process.env.SHIPROCKET_API_URL}/orders/update/adhoc`, {
            //     order_id: order.trackingId,
            //     shipping_customer_name: data.shippingAddress.firstName,
            //     shipping_last_name: data.shippingAddress.lastName,
            //     shipping_address: data.shippingAddress.address1,
            //     shipping_address_2: data.shippingAddress.address2 || "",
            //     shipping_city: data.shippingAddress.city,
            //     shipping_state: data.shippingAddress.state,
            //     shipping_pincode: data.shippingAddress.zipCode,
            //     shipping_country: "India",
            //     shipping_email: order.user.email,
            //     shipping_phone: order.user.phone,
            // }, {
            //     headers: {
            //         "Content-Type": "application/json",
            //         "Authorization": `Bearer ${shiprocketToken}`,
            //     }
            // });
            // if (updateShippingAddress.status !== 200) {
            //     res.status(updateShippingAddress.status).json({ error: "Failed to update shipping address" });
            //     return;
            // }
        res.status(200).json({ message: "Address updated successfully" });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : "Unknown error" });
    }
};

/**
 * @swagger
 * /api/orders/cancel:
 *   delete:
 *     summary: Cancel an existing order
 *     description: |
 *       Cancels an existing order and restores product inventory.
 *       - Only orders with status "ORDERED" can be cancelled
 *       - Only the order owner can cancel their orders
 *       - For shipping orders, also cancels the shipment with Shiprocket
 *       - Product stock is automatically restored after successful cancellation
 *       - Order status is changed to "CANCELLED"
 *       - Cancellation is irreversible
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       - CsrfToken: []
 *     requestBody:
 *       required: true
 *       description: Request body containing the order ID to cancel
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderIdRequest'
 *           example:
 *             orderId: "SUV-23010112000045"
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Order cancelled successfully"
 *                 updatedOrder:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Order'
 *                     - type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: ["CANCELLED"]
 *                           example: "CANCELLED"
 *             example:
 *               message: "Order cancelled successfully"
 *               updatedOrder:
 *                 id: "SUV-23010112000045"
 *                 userId: "usr-456e7890-f12b-34c5-d678-901234567890"
 *                 totalAmount: "199.99"
 *                 status: "CANCELLED"
 *                 paymentMethod: "COD"
 *                 deliveryMethod: "SHIPPING"
 *                 trackingId: "SHIP789123456"
 *                 shippingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                 billingAddressId: "addr-111e2222-f33g-44h5-i678-901234567890"
 *                 createdAt: "2025-08-01T10:30:00Z"
 *                 updatedAt: "2025-08-09T15:45:00Z"
 *       400:
 *         description: Order cannot be cancelled - Order status doesn't allow cancellation or invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               cannot_cancel:
 *                 summary: Order Cannot Be Cancelled
 *                 value:
 *                   error: "Order cannot be cancelled"
 *               invalid_order_id:
 *                 summary: Invalid Order ID
 *                 value:
 *                   error: "Validation failed"
 *                   details:
 *                     - path: ["orderId"]
 *                       message: "String must contain at least 1 character(s)"
 *                       code: "too_small"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Order not found - Order doesn't exist or doesn't belong to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Order not found"
 *       500:
 *         description: Internal server error - Database error, Shiprocket API error, or other system error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               database_error:
 *                 summary: Database Error
 *                 value:
 *                   error: "Internal server error"
 *               shiprocket_error:
 *                 summary: Shiprocket Cancellation Failed
 *                 value:
 *                   error: "Failed to cancel shipping order"
 */
export const cancelOrder = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = cancelOrderSchema.parse(req.body);
        const order = await prisma.order.findUnique({
            where: { id: data.orderId, userId: userId },
            include: {
                orderItems: true,
            },
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        if (!["ORDERED"].includes(order.orderStatus)) {
            res.status(400).json({ error: "Order cannot be cancelled" });
            return;
        }
        if (order.deliveryMethod !== "STORE" && order.trackingId) {
            let shiprocketToken;
            if (req.cookies.shiprocket_token) {
                shiprocketToken = req.cookies.shiprocket_token;
            } else {
                await getShipRocketLogin(req, res);
                shiprocketToken = req.cookies.shiprocket_token;
            }
            const cancelOrder = await axios.post(`${process.env.SHIPROCKET_API_URL}/orders/cancel`, {
                ids: [Number(order.trackingId)],
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${shiprocketToken}`,
                }
            });
            if (cancelOrder.status !== 200) {
                res.status(cancelOrder.status).json({ error: "Failed to cancel shipping order" });
                return;
            } 
        }
        for(const item of order.orderItems) {
            if (item.variantId) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { variants: true },
                });
                if (product) {
                    await prisma.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: product.stock + item.quantity,
                        },
                    });
                }    
            }
            else {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (product) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: product.stock + item.quantity,
                        },
                    });
                }
            }
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let cancelVideoKey= null;
        if (req.files && files['cancelVideo'] && files['cancelVideo'][0]) {
            cancelVideoKey = `cancelOrderVideos/${order.id}/${uuidv4()}.mp4`
            await uploadFile(files['cancelVideo'][0], cancelVideoKey)
        }
        const updatedOrder = await prisma.order.update({
            where: { id: data.orderId },
            data: { 
                orderStatus: OrderStatus.CANCELLED,
                cancelReason: data.cancelReason || "",
                cancelVideo: req.files ? cancelVideoKey : null,
                paymentStatus: order.paymentStatus === PaymentStatus.SUCCESS ? PaymentStatus.REFUND_REQUESTED : PaymentStatus.CANCELLED,
            },
        });
        res.status(200).json({ message: "Order cancelled successfully", updatedOrder });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: "Invalid request data",
                details: error.errors,
            });
            return;
        }
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};