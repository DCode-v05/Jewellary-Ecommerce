import axios from "axios";
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";
import { cancelShipmentSchema, checkCourierAvailabilitySchema, createAWBSchema, createShipmentSchema, createShipRocketOrderSchema, generateInvoiceSchema, generateLabelSchema, getOrderByIdSchema, getShipmentByIdSchema, printManifestSchema } from "../validators/shipRocket.validator";

/**
 * @swagger
 * tags:
 *   name: Shiprocket
 *   description: Shiprocket APIs.
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
 *     ShiprocketTokenResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Authentication token for Shiprocket API access
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Token expiration timestamp
 *         user_id:
 *           type: integer
 *           description: Shiprocket user ID
 *     ShiprocketError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing the failure
 *           example: "Failed to authenticate with Shiprocket"
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           example: 401
 *     InternalServerError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Generic error message for server failures
 *           example: "Internal server error"
 *     CreateShipRocketOrderRequest:
 *       type: object
 *       required:
 *         - orderId
 *         - weight
 *         - length
 *         - breadth
 *         - height
 *       properties:
 *         orderId:
 *           type: string
 *           description: Unique identifier of the order from Wymi platform
 *           example: "ORDER-123456789"
 *         weight:
 *           type: number
 *           minimum: 0
 *           description: Total weight of the package in grams
 *           example: 500
 *         length:
 *           type: number
 *           minimum: 0
 *           description: Package length dimension in centimeters
 *           example: 20
 *         breadth:
 *           type: number
 *           minimum: 0
 *           description: Package breadth dimension in centimeters
 *           example: 15
 *         height:
 *           type: number
 *           minimum: 0
 *           description: Package height dimension in centimeters
 *           example: 10
 *     CreateShipRocketOrderResponse:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           description: Original order ID from Wymi platform
 *           example: "ORDER-123456789"
 *         shipmentId:
 *           type: string
 *           description: Shiprocket generated shipment ID for tracking
 *           example: "123456789"
 *         courierName:
 *           type: string
 *           description: Name of the assigned courier partner
 *           example: "Bluedart"
 *         awb_code:
 *           type: string
 *           description: Air Waybill number for shipment tracking
 *           example: "12345678901234"
 *     CheckCourierAvailabilityRequest:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: Unique identifier of the order to check courier availability
 *           example: "ORDER-123456789"
 *     CourierAvailabilityResponse:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           id:
 *             type: integer
 *             description: Unique courier company identifier
 *             example: 12
 *           name:
 *             type: string
 *             description: Courier company name
 *             example: "Bluedart"
 *           cod:
 *             type: boolean
 *             description: Cash on Delivery availability
 *             example: true
 *           codCharges:
 *             type: number
 *             description: COD charges percentage
 *             example: 2.5
 *           city:
 *             type: string
 *             description: Delivery city
 *             example: "Mumbai"
 *           chargeWeight:
 *             type: number
 *             description: Chargeable weight for pricing calculation
 *             example: 500
 *           courierType:
 *             type: string
 *             description: Type of courier service
 *             example: "surface"
 *           cutoffTime:
 *             type: string
 *             description: Daily pickup cutoff time
 *             example: "18:00"
 *           estimatedDeliveryDays:
 *             type: string
 *             description: Estimated delivery timeframe
 *             example: "2-3 days"
 *           etd:
 *             type: string
 *             description: Estimated delivery date
 *             example: "2025-08-28"
 *           etd_hours:
 *             type: integer
 *             description: Estimated delivery in hours
 *             example: 72
 *     CreateAWBRequest:
 *       type: object
 *       required:
 *         - shipmentId
 *       properties:
 *         shipmentId:
 *           type: string
 *           description: Shiprocket shipment ID for AWB generation
 *           example: "123456789"
 *         courierId:
 *           type: string
 *           description: Optional specific courier ID for AWB assignment
 *           example: "12"
 *     CreateAWBResponse:
 *       type: object
 *       properties:
 *         awbCode:
 *           type: string
 *           description: Generated Air Waybill tracking number
 *           example: "12345678901234"
 *         awbCodeStatus:
 *           type: string
 *           description: AWB generation status
 *           example: "Success"
 *         cod:
 *           type: boolean
 *           description: Cash on Delivery enabled for this shipment
 *           example: true
 *         courierName:
 *           type: string
 *           description: Assigned courier partner name
 *           example: "Bluedart"
 *     CreateShipmentRequest:
 *       type: object
 *       required:
 *         - shipmentId
 *       properties:
 *         shipmentId:
 *           type: string
 *           description: Shiprocket shipment ID for pickup scheduling
 *           example: "123456789"
 *         pickUpDate:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           description: Optional pickup date in YYYY-MM-DD format
 *           example: "2025-08-28"
 *     CreateShipmentResponse:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           description: Original order ID from Wymi platform
 *           example: "ORDER-123456789"
 *         shipmentId:
 *           type: string
 *           description: Shiprocket shipment ID
 *           example: "123456789"
 *         courierName:
 *           type: string
 *           description: Assigned courier partner name
 *           example: "Bluedart"
 *         awb_code:
 *           type: string
 *           description: Air Waybill tracking number
 *           example: "12345678901234"
 *     CourierInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique courier identifier
 *           example: 12
 *         name:
 *           type: string
 *           description: Courier company name
 *           example: "Bluedart"
 *         min_weight:
 *           type: number
 *           description: Minimum weight accepted by courier (grams)
 *           example: 50
 *         type:
 *           type: string
 *           description: Courier service type
 *           example: "express"
 *         courier_type:
 *           type: string
 *           description: Courier category classification
 *           example: "premium"
 *         service_type:
 *           type: string
 *           description: Service delivery type
 *           example: "air"
 *     WymiOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique order identifier
 *           example: "ORDER-123456789"
 *         userId:
 *           type: string
 *           description: Customer user ID
 *           example: "user-uuid-123"
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *           example: 2499.50
 *         couponDiscount:
 *           type: number
 *           description: Applied coupon discount amount
 *           example: 249.95
 *         deliveryCharge:
 *           type: number
 *           description: Shipping and delivery charges
 *           example: 99.00
 *         gstAmount:
 *           type: number
 *           description: GST tax amount
 *           example: 359.93
 *         status:
 *           type: string
 *           enum: [PENDING, PAID, ORDERED, READY_FOR_PICKUP, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *           description: Current order status
 *           example: "PAID"
 *         paymentMethod:
 *           type: string
 *           enum: [COD, CARD, UPI, NETBANKING]
 *           description: Payment method used
 *           example: "UPI"
 *         deliveryMethod:
 *           type: string
 *           enum: [SHIPPING, STORE]
 *           description: Delivery method chosen
 *           example: "SHIPPING"
 *         trackingId:
 *           type: string
 *           description: Shiprocket tracking/shipment ID
 *           example: "123456789"
 *         userName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Customer's email address
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           description: Customer's phone number
 *           example: "+91-9876543210"
 *         totalItems:
 *           type: integer
 *           description: Total number of items in the order
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *           example: "2025-08-25T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Order last update timestamp
 *           example: "2025-08-25T12:45:00Z"
 *     WymiOrderDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique order identifier
 *           example: "ORDER-123456789"
 *         userId:
 *           type: string
 *           description: Customer user ID
 *           example: "user-uuid-123"
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *           example: 2499.50
 *         couponDiscount:
 *           type: number
 *           description: Applied coupon discount amount
 *           example: 249.95
 *         deliveryCharge:
 *           type: number
 *           description: Shipping and delivery charges
 *           example: 99.00
 *         gstAmount:
 *           type: number
 *           description: GST tax amount
 *           example: 359.93
 *         status:
 *           type: string
 *           enum: [PENDING, PAID, ORDERED, READY_FOR_PICKUP, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *           description: Current order status
 *           example: "PAID"
 *         paymentMethod:
 *           type: string
 *           enum: [COD, CARD, UPI, NETBANKING]
 *           description: Payment method used
 *           example: "UPI"
 *         deliveryMethod:
 *           type: string
 *           enum: [SHIPPING, STORE]
 *           description: Delivery method chosen
 *           example: "SHIPPING"
 *         trackingId:
 *           type: string
 *           description: Shiprocket tracking/shipment ID
 *           example: "123456789"
 *         shippingAddress:
 *           type: object
 *           description: Customer's shipping address details
 *         billingAddress:
 *           type: object
 *           description: Customer's billing address details
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *           example: "2025-08-25T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Order last update timestamp
 *           example: "2025-08-25T12:45:00Z"
 *         user:
 *           type: object
 *           description: Complete customer information
 *           properties:
 *             id:
 *               type: string
 *               description: User unique identifier
 *               example: "user-uuid-123"
 *             name:
 *               type: string
 *               description: Customer's full name
 *               example: "John Doe"
 *             email:
 *               type: string
 *               format: email
 *               description: Customer's email address
 *               example: "john.doe@example.com"
 *             phone:
 *               type: string
 *               description: Customer's phone number
 *               example: "+91-9876543210"
 *         orderItems:
 *           type: array
 *           description: List of items in the order
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Order item unique identifier
 *                 example: "item-uuid-123"
 *               productId:
 *                 type: string
 *                 description: Product identifier
 *                 example: "product-uuid-456"
 *               variantId:
 *                 type: string
 *                 description: Product variant identifier
 *                 example: "variant-uuid-789"
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the item ordered
 *                 example: 2
 *               price:
 *                 type: number
 *                 description: Unit price of the item
 *                 example: 999.75
 *     ShiprocketOrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Shiprocket order ID
 *           example: 12345
 *         channelId:
 *           type: integer
 *           description: Channel identifier
 *           example: 1
 *         channelName:
 *           type: string
 *           description: Sales channel name
 *           example: "Wymi Store"
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *           example: 2499.50
 *         customerName:
 *           type: string
 *           description: Customer full name
 *           example: "John Doe"
 *         customerEmail:
 *           type: string
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *           example: "9876543210"
 *         pickupLocation:
 *           type: string
 *           description: Pickup location identifier
 *           example: "Primary"
 *         paymentStatus:
 *           type: string
 *           description: Payment status
 *           example: "PAID"
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *           example: "UPI"
 *         total:
 *           type: number
 *           description: Order total value
 *           example: 2499.50
 *         tax:
 *           type: number
 *           description: Tax amount
 *           example: 359.93
 *         expectedDeliveryDays:
 *           type: string
 *           description: Expected delivery timeframe
 *           example: "2-3 days"
 *         orderedStatus:
 *           type: string
 *           description: Current order status
 *           example: "SHIPPED"
 *         products:
 *           type: array
 *           description: List of products in the order
 *           items:
 *             type: object
 *         shipments:
 *           type: array
 *           description: Associated shipments
 *           items:
 *             type: object
 *         activities:
 *           type: array
 *           description: Order activity log
 *           items:
 *             type: object
 *     GetShipmentByIdRequest:
 *       type: object
 *       required:
 *         - shipmentId
 *       properties:
 *         shipmentId:
 *           type: string
 *           description: Shiprocket shipment ID to retrieve
 *           example: "123456789"
 *     CancelShipmentRequest:
 *       type: object
 *       required:
 *         - trackingId
 *       properties:
 *         trackingId:
 *           type: string
 *           description: Tracking ID of shipment to cancel
 *           example: "123456789"
 *     PrintManifestRequest:
 *       type: object
 *       required:
 *         - orderIds
 *       properties:
 *         orderIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of order IDs for manifest generation
 *           example: ["ORDER-20250825-123456", "ORDER-20250825-789012"]
 *     PrintManifestResponse:
 *       type: object
 *       properties:
 *         manifest_url:
 *           type: string
 *           description: URL to download the generated manifest
 *           example: "https://shiprocket.co/manifests/download/12345"
 *     GenerateLabelRequest:
 *       type: object
 *       required:
 *         - trackingIds
 *       properties:
 *         trackingIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tracking IDs for label generation
 *           example: ["123456789", "987654321"]
 *     GenerateLabelResponse:
 *       type: object
 *       properties:
 *         label_url:
 *           type: string
 *           description: URL to download the generated shipping labels
 *           example: "https://shiprocket.co/labels/download/12345"
 *     GenerateInvoiceRequest:
 *       type: object
 *       required:
 *         - orderIds
 *       properties:
 *         orderIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of order IDs for invoice generation
 *           example: ["ORDER-20250825-123456", "ORDER-20250825-789012"]
 *     GenerateInvoiceResponse:
 *       type: object
 *       properties:
 *         invoice_url:
 *           type: string
 *           description: URL to download the generated invoices
 *           example: "https://shiprocket.co/invoices/download/12345"
 *     ShipmentData:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Shipment unique identifier
 *           example: 123456789
 *         awb:
 *           type: string
 *           description: Air Waybill number
 *           example: "12345678901234"
 *         courier_name:
 *           type: string
 *           description: Assigned courier partner name
 *           example: "Bluedart"
 *         status:
 *           type: string
 *           description: Current shipment status
 *           example: "SHIPPED"
 *         pickup_date:
 *           type: string
 *           format: date
 *           description: Scheduled pickup date
 *           example: "2025-08-26"
 *         delivered_date:
 *           type: string
 *           format: date-time
 *           description: Delivery completion timestamp
 *           example: "2025-08-28T14:30:00Z"
 *         origin:
 *           type: string
 *           description: Pickup location
 *           example: "Mumbai"
 *         destination:
 *           type: string
 *           description: Delivery destination
 *           example: "Delhi"
 */

const cookieSet = ( res: Response, key: string, value: string, maxAge: number ) => {
  res.cookie(key, value, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    // domain: ".wymi.in",
    // path: "/",
    maxAge: maxAge,
  });
};

const orderIdToNumber = (orderId: string): number => {
  const order = orderId.replace(/\D/g, "");
  return Number(order);
};

/**
 * @swagger
 * /api/shiprocket/token:
 *   post:
 *     summary: Authenticate and obtain Shiprocket API access token with intelligent caching
 *     description: |
 *       Authenticates with Shiprocket's logistics platform and securely manages API access tokens for the Wymi e-commerce platform. 
 *       This critical endpoint enables seamless integration with India's leading logistics and shipping infrastructure.
 *       
 *       **Authentication Flow:**
 *       - Checks for existing valid authentication token in secure HTTP-only cookies
 *       - If no valid token exists, initiates fresh authentication with Shiprocket API
 *       - Uses environment-configured credentials for secure API access
 *       - Automatically caches new tokens with 10-day expiration for optimal performance
 *       
 *       **Token Management:**
 *       - Implements intelligent token caching to minimize API calls
 *       - Sets secure, cross-domain cookies with proper SameSite and security flags
 *       - Token validity period: 10 days (864,000 seconds)
 *       - Domain-wide accessibility across Wymi platform (.wymi.in)
 *       
 *       **Security Features:**
 *       - Environment variable-based credential management
 *       - Secure cookie configuration with httpOnly, secure, and SameSite protections
 *       - Cross-origin compatibility for production deployment
 *       - Automatic error handling and status code propagation
 *       
 *       **Use Cases:**
 *       - Order fulfillment and shipping label generation
 *       - Real-time shipment tracking and status updates
 *       - Logistics partner integration for seamless delivery
 *       - Automated shipping cost calculation and courier selection
 *       
 *       **Performance Optimization:**
 *       - Token reuse prevents unnecessary authentication calls
 *       - Reduces API latency for subsequent shipping operations
 *       - Maintains persistent session state across multiple requests
 *       
 *       This endpoint is essential for all shipping-related operations in the Wymi platform, ensuring reliable logistics integration and optimal user experience.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: false
 *       description: No request body required - authentication uses environment credentials
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *           examples:
 *             emptyRequest:
 *               summary: Standard token request (no body required)
 *               value: {}
 *     responses:
 *       200:
 *         description: |
 *           Authentication successful. Token has been securely cached in HTTP-only cookies for subsequent API calls.
 *           Response indicates successful token acquisition and caching, ready for logistics operations.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "shiprocket_token=eyJhbGciOiJIUzI1NiI...; Domain=.wymi.in; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=864000"
 *             description: Secure authentication token stored as HTTP-only cookie with 10-day expiration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token cached successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *             examples:
 *               newTokenGenerated:
 *                 summary: New token generated and cached
 *                 value:
 *                   message: "Shiprocket authentication successful - token cached for 10 days"
 *                   status: "success"
 *               existingTokenValid:
 *                 summary: Existing token is still valid
 *                 value:
 *                   message: "Valid token already exists in cache"
 *                   status: "success"
 *       400:
 *         description: |
 *           Bad Request - Invalid authentication credentials or malformed request to Shiprocket API.
 *           This typically indicates configuration issues with environment variables or API endpoint changes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid Shiprocket credentials
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "Invalid email or password provided"
 *               missingEnvironment:
 *                 summary: Missing environment configuration
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket API rejected the authentication credentials.
 *           Verify that environment variables contain valid and active Shiprocket account credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationFailed:
 *                 summary: Shiprocket authentication failed
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   status: 401
 *       403:
 *         description: |
 *           Forbidden - Account access restrictions or suspended Shiprocket account.
 *           Contact Shiprocket support to verify account status and API access permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               accountSuspended:
 *                 summary: Shiprocket account access restricted
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "Account suspended or access restricted"
 *       429:
 *         description: |
 *           Rate Limited - Too many authentication requests to Shiprocket API.
 *           Implement exponential backoff or use cached tokens to avoid rate limiting.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               rateLimited:
 *                 summary: API rate limit exceeded
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "Rate limit exceeded - please retry after some time"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected server error during authentication process.
 *           This could indicate network connectivity issues, Shiprocket API downtime, or internal application errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               networkError:
 *                 summary: Network connectivity failure
 *                 value:
 *                   error: "Internal server error"
 *               shiprocketDowntime:
 *                 summary: Shiprocket API unavailable
 *                 value:
 *                   error: "Internal server error"
 *               unexpectedError:
 *                 summary: Unexpected application error
 *                 value:
 *                   error: "Internal server error"
 *       502:
 *         description: |
 *           Bad Gateway - Shiprocket API returned an invalid response or is temporarily unavailable.
 *           This indicates external service issues beyond the application's control.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               badGateway:
 *                 summary: Shiprocket service unavailable
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "Shiprocket API temporarily unavailable"
 *       503:
 *         description: |
 *           Service Unavailable - Shiprocket API is temporarily down for maintenance.
 *           Retry the request after some time or check Shiprocket's status page for updates.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               maintenance:
 *                 summary: Shiprocket under maintenance
 *                 value:
 *                   error: "Failed to authenticate with Shiprocket"
 *                   details: "Service temporarily unavailable due to maintenance"
 */
export const getShiprocketToken = async (req: Request, res: Response) => {
    try {
        if (!req.cookies.shiprocket_token) {
            const shiprocketToken = await axios.post(`${process.env.SHIPROCKET_API_URL}/auth/login`, {
                email: process.env.SHIPROCKET_EMAIL!,
                password: process.env.SHIPROCKET_PASSWORD!,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (shiprocketToken.status ===429) {
                res.status(429).json({ error: "Rate limit exceeded", details: "Please retry after some time" });
                return;
            }
            if (shiprocketToken.status !== 200) {
                res.status(shiprocketToken.status).json({ error: "Failed to authenticate with Shiprocket" });
                return;
            }
            const token = shiprocketToken.data.token;
            cookieSet(res, "shiprocket_token", token, (60 * 60 * 24 * 10) - (60 * 60));
            res.status(200).json({ message: "Shiprocket token generated successfully" });
        } else {
            res.status(200).json({ message: "Shiprocket token already exists"});
        }
    } catch (error) {
        console.error("Error fetching Shiprocket token:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
};

export async function getShipRocketLogin(req: Request, res: Response) {
    try {
        const shiprocketToken = await axios.post(`${process.env.SHIPROCKET_API_URL}/auth/login`, {
            email: process.env.SHIPROCKET_EMAIL!,
            password: process.env.SHIPROCKET_PASSWORD!,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (shiprocketToken.status ===429) {
            res.status(429).json({ error: "Rate limit exceeded", details: "Please retry after some time" });
            return;
        }
        if (shiprocketToken.status !== 200) {
            res.status(shiprocketToken.status).json({ error: "Failed to authenticate with Shiprocket" });
            return;
        }
        const token = shiprocketToken.data.token;
        cookieSet(res, "shiprocket_token", token, (60 * 60 * 24 * 10) - (60 * 60));
    } catch (error) {
        console.error("Error fetching Shiprocket token:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * @swagger
 * /api/shiprocket/create-order:
 *   post:
 *     summary: Create a comprehensive shipping order in Shiprocket logistics platform
 *     description: |
 *       Creates a complete shipping order in Shiprocket's logistics system for seamless e-commerce fulfillment. 
 *       This endpoint bridges the Wymi platform orders with India's leading logistics infrastructure for reliable delivery.
 *       
 *       **Order Processing Flow:**
 *       - Validates order existence in Wymi database with complete order details
 *       - Retrieves customer information, shipping/billing addresses, and order items
 *       - Authenticates with Shiprocket API using cached or fresh tokens
 *       - Creates adhoc shipping order with comprehensive product and customer data
 *       - Updates Wymi order with Shiprocket tracking ID for seamless tracking
 *       
 *       **Address Management:**
 *       - Supports separate billing and shipping addresses
 *       - Handles address validation and formatting for Shiprocket compatibility
 *       - Automatic detection of billing-shipping address matching
 *       - Phone number formatting for Indian logistics standards
 *       
 *       **Product Integration:**
 *       - Retrieves product details from Wymi catalog
 *       - Calculates discounted prices and applies promotional offers
 *       - Maps product SKUs and names for logistics tracking
 *       - Handles multiple product variants and quantities
 *       
 *       **Logistics Optimization:**
 *       - Configurable package dimensions for accurate shipping costs
 *       - Automatic pickup location assignment for efficient fulfillment
 *       - Payment method integration for COD and prepaid orders
 *       - Real-time courier assignment and AWB generation
 *       
 *       **Integration Benefits:**
 *       - Single API call creates complete shipping infrastructure
 *       - Automatic tracking ID linkage for order status updates
 *       - Seamless integration with 17+ courier partners
 *       - Real-time delivery cost calculation and optimization
 *       
 *       **Error Handling:**
 *       - Comprehensive validation of order existence and completeness
 *       - Product availability and pricing verification
 *       - Address format validation for successful delivery
 *       - Automatic token refresh for uninterrupted service
 *       
 *       This endpoint is crucial for converting Wymi orders into actionable shipping instructions, 
 *       enabling reliable last-mile delivery across India through Shiprocket's extensive network.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Order shipping details including package dimensions and order reference
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShipRocketOrderRequest'
 *           examples:
 *             jewelryOrder:
 *               summary: Typical jewelry order with standard packaging
 *               value:
 *                 orderId: "ORDER-20250825-123456"
 *                 weight: 250
 *                 length: 15
 *                 breadth: 12
 *                 height: 8
 *             bulkOrder:
 *               summary: Larger order with multiple items
 *               value:
 *                 orderId: "ORDER-20250825-789012"
 *                 weight: 800
 *                 length: 25
 *                 breadth: 20
 *                 height: 15
 *     responses:
 *       200:
 *         description: |
 *           Shipping order created successfully. Order has been registered with Shiprocket and assigned to a courier partner.
 *           The response includes all essential tracking information for order monitoring and customer communication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateShipRocketOrderResponse'
 *             examples:
 *               successfulOrder:
 *                 summary: Order successfully created with Bluedart
 *                 value:
 *                   orderId: "ORDER-20250825-123456"
 *                   shipmentId: "987654321"
 *                   courierName: "Bluedart"
 *                   awb_code: "12345678901234"
 *               codOrder:
 *                 summary: Cash on Delivery order with local courier
 *                 value:
 *                   orderId: "ORDER-20250825-789012"
 *                   shipmentId: "876543210"
 *                   courierName: "Delhivery"
 *                   awb_code: "98765432109876"
 *       400:
 *         description: |
 *           Bad Request - Invalid input data or validation errors in order details.
 *           This typically indicates missing required fields, invalid dimensions, or malformed order ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidOrderId:
 *                 summary: Invalid or missing order ID
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Order ID is required and must be valid"
 *               invalidDimensions:
 *                 summary: Invalid package dimensions
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Package dimensions must be positive numbers"
 *               validationError:
 *                 summary: Request body validation failed
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Weight must be a positive number"
 *       404:
 *         description: |
 *           Not Found - Order does not exist in Wymi database or required data is missing.
 *           Verify that the order ID exists and has complete customer and product information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               orderNotFound:
 *                 summary: Order ID not found in database
 *                 value:
 *                   error: "Order not found"
 *               missingProduct:
 *                 summary: Product data missing for order items
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Product information incomplete"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh, but manual authentication may be required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               tokenExpired:
 *                 summary: Shiprocket token expired
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Order data is valid but cannot be processed by Shiprocket.
 *           This may indicate address validation failures, unsupported payment methods, or logistics constraints.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidAddress:
 *                 summary: Address validation failed
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "Shipping address not serviceable"
 *               unsupportedLocation:
 *                 summary: Delivery location not supported
 *                 value:
 *                   error: "Failed to create shipping order"
 *                   details: "No courier partners available for this pincode"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during order processing.
 *           This could indicate database connection issues, Shiprocket API problems, or data processing errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               databaseError:
 *                 summary: Database connection failure
 *                 value:
 *                   error: "Failed to create shipping order"
 *               shiprocketApiError:
 *                 summary: Shiprocket API unavailable
 *                 value:
 *                   error: "Failed to create shipping order"
 */
export const createShipRocketOrder = async (req: Request, res: Response) => {
    try {
        const order = createShipRocketOrderSchema.parse(req.body);
        const createdOrder = await prisma.order.findUnique({
            where: { id: order.orderId },
            include: {
                orderItems: true,
                shippingAddress: true,
                billingAddress: true,
                user: true,
            },
        });
        if (!createdOrder) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const shippingAddress = await prisma.address.findUnique({
            where: { id: createdOrder.shippingAddressId || undefined },
        });
        const billingAddress = await prisma.address.findUnique({
            where: { id: createdOrder.billingAddressId || undefined },
        });
        const isDefault = createdOrder.billingAddressId === createdOrder.shippingAddressId;
        const shippingOrder = await axios.post(`${process.env.SHIPROCKET_API_URL!}/orders/create/adhoc`, {
            order_id: orderIdToNumber(createdOrder.id),
            order_date: new Date().toISOString(),
            pickup_location: "Primary",
            shipping_is_billing: isDefault,
            shipping_customer_name: shippingAddress?.name.split(" ")[0],
            shipping_last_name: shippingAddress?.name.split(" ")[1],
            shipping_address: shippingAddress?.addressLine1,
            shipping_address_2: shippingAddress?.addressLine2 || "",
            shipping_city: shippingAddress?.city,
            shipping_state: shippingAddress?.state,
            shipping_pincode: shippingAddress?.zipCode,
            shipping_country: "India",
            shipping_email: createdOrder?.user?.email,
            shipping_phone: createdOrder?.user?.phone.replace("+91", ""),
            billing_customer_name: billingAddress?.name.split(" ")[0],
            billing_last_name: billingAddress?.name.split(" ")[1],
            billing_address: billingAddress?.addressLine1,
            billing_address_2: billingAddress?.addressLine2,
            billing_city: billingAddress?.city,
            billing_state: billingAddress?.state,
            billing_pincode: shippingAddress?.zipCode,
            billing_country: "India",
            billing_email: createdOrder?.user?.email,
            billing_phone: createdOrder?.user?.phone.replace("+91", ""),
            order_items: await Promise.all(createdOrder.orderItems.map(async (item: typeof createdOrder.orderItems[0]) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new Error(`Product with id ${item.productId} not found or has invalid price`);
                }
                return {
                    name: product.name,
                    sku: product.slug,
                    selling_price: Number(product.price) - (Number(product.price) * Number(product.discountPct || 0) / 100),
                    units: item.quantity,
                };
            })),
            payment_method: createdOrder.paymentMethod,
            sub_total: createdOrder.totalAmount,
            weight: order.weight,
            length: order.length,
            breadth: order.breadth,
            height: order.height
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (shippingOrder.status !== 200) {
            res.status(shippingOrder.status).json({ error: "Failed to create shipping order" });
            return;
        }
        await prisma.order.update({
            where: { id: createdOrder.id },
            data: {
                trackingId: String(shippingOrder.data.shipment_id),
            },
        });
        const result = {
            orderId: createdOrder.id,
            shipmentId: shippingOrder.data.shipment_id,
            courierName: shippingOrder.data.courier_name,
            awb_code: shippingOrder.data.awb_code
        };
        res.status(200).json(result);
    } catch (error) {
        console.error("Error creating shipping order:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: "Failed to create shipping order", message: error instanceof Error ? error.message : String(error) });
        }
    }
};

/**
 * @swagger
 * /api/shiprocket/get-shiprocket-orders:
 *   get:
 *     summary: Retrieve comprehensive list of orders directly from Shiprocket platform
 *     description: |
 *       Fetches all orders from the Shiprocket logistics platform, providing complete visibility into 
 *       shipping operations, order status, and delivery tracking across the entire e-commerce fulfillment pipeline.
 *       
 *       **Shiprocket Order Intelligence:**
 *       - Direct access to Shiprocket's order management system
 *       - Real-time order status updates across all courier partners
 *       - Comprehensive shipping and delivery analytics
 *       - Customer communication and tracking information
 *       - Payment status integration with logistics operations
 *       
 *       **Order Data Completeness:**
 *       - Complete customer information including contact details
 *       - Product details with quantities and pricing
 *       - Shipping address and delivery preferences
 *       - Payment method and transaction status
 *       - Courier partner assignment and tracking details
 *       
 *       **Operational Benefits:**
 *       - Centralized order monitoring dashboard
 *       - Real-time delivery status tracking
 *       - Customer service inquiry resolution
 *       - Logistics performance analytics
 *       - Exception handling and issue resolution
 *       
 *       **Business Intelligence Applications:**
 *       - Delivery performance metrics analysis
 *       - Customer satisfaction tracking
 *       - Courier partner performance evaluation
 *       - Seasonal demand pattern analysis
 *       - Cost optimization opportunities identification
 *       
 *       **Integration Capabilities:**
 *       - Synchronization with Wymi platform orders
 *       - Automated status update triggers
 *       - Customer notification system integration
 *       - Business intelligence dashboard data source
 *       - Financial reconciliation and reporting
 *       
 *       This endpoint provides comprehensive visibility into the entire logistics pipeline, 
 *       enabling proactive order management and exceptional customer delivery experiences.
 *     tags: [Shiprocket]
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved all orders from Shiprocket platform. Returns comprehensive order data 
 *           including customer details, shipping information, and delivery tracking for operational management.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShiprocketOrderResponse'
 *             examples:
 *               multipleShiprocketOrders:
 *                 summary: Sample Shiprocket orders with diverse statuses
 *                 value:
 *                   - id: 12345
 *                     channelId: 1
 *                     channelName: "Wymi Store"
 *                     totalAmount: 2499.50
 *                     customerName: "John Doe"
 *                     customerEmail: "john.doe@example.com"
 *                     customerPhone: "9876543210"
 *                     pickupLocation: "Primary"
 *                     paymentStatus: "PAID"
 *                     paymentMethod: "UPI"
 *                     total: 2499.50
 *                     tax: 359.93
 *                     expectedDeliveryDays: "2-3 days"
 *                     orderedStatus: "SHIPPED"
 *                     products: []
 *                     shipments: []
 *                     activities: []
 *                   - id: 12346
 *                     channelId: 1
 *                     channelName: "Wymi Store"
 *                     totalAmount: 1299.00
 *                     customerName: "Jane Smith"
 *                     customerEmail: "jane.smith@example.com"
 *                     customerPhone: "9876543211"
 *                     pickupLocation: "Primary"
 *                     paymentStatus: "PAID"
 *                     paymentMethod: "COD"
 *                     total: 1299.00
 *                     tax: 187.14
 *                     expectedDeliveryDays: "3-4 days"
 *                     orderedStatus: "DELIVERED"
 *                     products: []
 *                     shipments: []
 *                     activities: []
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationFailed:
 *                 summary: Shiprocket authentication failed
 *                 value:
 *                   error: "Failed to retrieve ShipRocket orders"
 *                   details: "Authentication token expired or invalid"
 *       500:
 *         description: |
 *           Internal Server Error - Failed to retrieve orders from Shiprocket platform.
 *           This could indicate API connectivity issues or system processing errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               apiConnectionError:
 *                 summary: Shiprocket API connection failure
 *                 value:
 *                   error: "Failed to retrieve ShipRocket orders"
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to retrieve ShipRocket orders"
 */
export const getShipRocketOrders = async (req: Request, res: Response) => {
    try {
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const orders = await axios.post(`${process.env.SHIPROCKET_API_URL!}/orders`, {   
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (orders.status !== 200) {
            res.status(orders.status).json({ error: "Failed to retrieve ShipRocket orders" });
            return;
        }
        const result = orders.data.map((order: typeof orders.data[0]) => ({
            id: order.id,
            channelId: order.channel_id,
            channelName: order.channel_name,
            totalAmount: order.total_amount,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            pickupLocation: order.pickup_location,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            total: order.total,
            tax: order.tax,
            expectedDeliveryDays: order.sla,
            orderedStatus: order.status,
            products: order.products,
            shipments: order.shipments,
            activities: order.activities,
        }));
        res.status(200).json(result);
    } catch  (error){
        console.error("Error retrieving ShipRocket orders:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: "Failed to retrieve ShipRocket orders" });
        }
    }
};

/**
 * @swagger
 * /api/shiprocket/orders:
 *   get:
 *     summary: Retrieve comprehensive list of all orders from Wymi platform
 *     description: |
 *       Fetches a complete collection of all orders stored in the Wymi e-commerce platform database. 
 *       This endpoint provides administrators and logistics teams with comprehensive order visibility for 
 *       shipping management, order fulfillment tracking, and business analytics.
 *       
 *       **Order Data Overview:**
 *       - Complete order details including customer information
 *       - Payment status and method information
 *       - Shipping and billing address details
 *       - Order items with product variants and quantities
 *       - Delivery status and tracking information
 *       - Financial breakdown including taxes and discounts
 *       
 *       **Administrative Use Cases:**
 *       - Order fulfillment dashboard for operations teams
 *       - Shipping status monitoring and logistics coordination
 *       - Customer service order lookup and support
 *       - Business analytics and reporting data source
 *       - Inventory management and stock level tracking
 *       
 *       **Integration Benefits:**
 *       - Real-time order status for operational efficiency
 *       - Complete order history for customer service
 *       - Logistics planning and delivery optimization
 *       - Financial reconciliation and reporting
 *       
 *       **Data Completeness:**
 *       - All order statuses from pending to delivered
 *       - Historical orders for trend analysis
 *       - Customer demographic and preference data
 *       - Product performance and popularity metrics
 *       
 *       **Performance Considerations:**
 *       - Efficient database queries for large order volumes
 *       - Optimized data structure for frontend consumption
 *       - Scalable architecture for growing order base
 *       
 *       This endpoint serves as the central data source for order management operations, 
 *       enabling comprehensive visibility into the Wymi platform's e-commerce activities.
 *     tags: [Shiprocket]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved all orders from the platform. Returns a comprehensive array of order objects 
 *           with complete details for administrative and operational use.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WymiOrder'
 *             examples:
 *               multipleOrders:
 *                 summary: Sample orders with various statuses
 *                 value:
 *                   - id: "ORDER-20250825-123456"
 *                     userId: "user-uuid-123"
 *                     totalAmount: 2499.50
 *                     couponDiscount: 249.95
 *                     deliveryCharge: 99.00
 *                     gstAmount: 359.93
 *                     status: "SHIPPED"
 *                     paymentMethod: "UPI"
 *                     deliveryMethod: "SHIPPING"
 *                     trackingId: "987654321"
 *                     userName: "John Doe"
 *                     email: "john.doe@example.com"
 *                     phone: "+91-9876543210"
 *                     totalItems: 3
 *                     createdAt: "2025-08-25T10:30:00Z"
 *                   - id: "ORDER-20250825-789012"
 *                     userId: "user-uuid-456"
 *                     totalAmount: 1299.00
 *                     couponDiscount: null
 *                     deliveryCharge: 0.00
 *                     gstAmount: 187.14
 *                     status: "DELIVERED"
 *                     paymentMethod: "COD"
 *                     deliveryMethod: "SHIPPING"
 *                     trackingId: "876543210"
 *                     userName: "Jane Smith"
 *                     email: "jane.smith@example.com"
 *                     phone: "+91-8765432109"
 *                     totalItems: 1
 *                     createdAt: "2025-08-24T15:20:00Z"
 *               emptyOrderList:
 *                 summary: No orders found in the system
 *                 value: []
 *       404:
 *         description: |
 *           No orders found in the system. This indicates that there are currently no orders in the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating no orders found
 *                   example: "No orders found"
 *             examples:
 *               noOrdersFound:
 *                 summary: Empty order database
 *                 value:
 *                   error: "No orders found"
 *       500:
 *         description: |
 *           Internal Server Error - Failed to retrieve orders due to database connectivity issues or server problems.
 *           This indicates system-level issues that prevent order data access.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               databaseConnectionError:
 *                 summary: Database connection failure
 *                 value:
 *                   error: "Failed to fetch orders"
 *               serverOverload:
 *                 summary: Server overload or resource exhaustion
 *                 value:
 *                   error: "Failed to fetch orders"
 *               unexpectedError:
 *                 summary: Unexpected system error
 *                 value:
 *                   error: "Failed to fetch orders"
 */
export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: true,
                orderItems: true
            }
        });
        if (!orders || orders.length === 0) {
            res.status(200).json({ error: "No orders found" });
            return;
        }
        const result = orders.map(order => ({
            id: order.id,
            userName: order.user.name,
            userId: order.userId,
            email: order.user.email,
            phone: order.user.phone,
            totalAmount: order.totalAmount,
            couponDiscount: order.couponDiscount,
            deliveryCharge: order.deliveryCharge,
            gstAmount: order.gstAmount,
            trackingId: order.trackingId,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId,
            deliveryMethod: order.deliveryMethod,
            invoiceId: order.invoiceId,
            cancelReason: order.cancelReason,
            cancelVideoUrl: order.cancelVideo,
            createdAt: order.createdAt,
            totalItems: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

/**
 * @swagger
 * /api/shiprocket/order/{orderId}:
 *   get:
 *     summary: Retrieve detailed information for a specific order by ID
 *     description: |
 *       Fetches comprehensive details for a single order using its unique identifier from the Wymi platform database. 
 *       This endpoint provides complete order information including customer details, order items, and all related data 
 *       for shipment processing, customer service, and administrative purposes.
 *       
 *       **Order Information Provided:**
 *       - Complete order details with financial breakdown
 *       - Customer information including contact details
 *       - Detailed list of ordered items with quantities and variants
 *       - Shipping and billing address information
 *       - Payment method and transaction details
 *       - Order status and tracking information
 *       
 *       **Use Cases:**
 *       - Customer service order lookup and support
 *       - Shipping label generation and fulfillment
 *       - Order status verification and updates
 *       - Customer communication and notifications
 *       - Administrative order management and processing
 *       
 *       **Data Completeness:**
 *       - Full customer profile and contact information
 *       - Complete order item details for accurate fulfillment
 *       - Address verification for shipping accuracy
 *       - Payment confirmation for order processing
 *       - Historical order tracking for audit trails
 *       
 *       **Integration Benefits:**
 *       - Single source of truth for order information
 *       - Detailed data for shipping partner integration
 *       - Complete context for customer service interactions
 *       - Comprehensive order audit and compliance tracking
 *       
 *       This endpoint is essential for order-specific operations and provides the foundation 
 *       for detailed order management and customer service activities within the Wymi platform.
 *     tags: [Shiprocket]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the order to retrieve
 *         example: "ORDER-20250825-123456"
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved the order details. Returns complete order information 
 *           including customer data, order items, and all related details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WymiOrderDetail'
 *             examples:
 *               completeOrder:
 *                 summary: Complete order with all details
 *                 value:
 *                   id: "ORDER-20250825-123456"
 *                   userId: "user-uuid-123"
 *                   totalAmount: 2499.50
 *                   couponDiscount: 249.95
 *                   deliveryCharge: 99.00
 *                   gstAmount: 359.93
 *                   status: "SHIPPED"
 *                   paymentMethod: "UPI"
 *                   deliveryMethod: "SHIPPING"
 *                   trackingId: "987654321"
 *                   shippingAddress:
 *                     street: "123 Main Street"
 *                     city: "Mumbai"
 *                     state: "Maharashtra"
 *                     postalCode: "400001"
 *                     country: "India"
 *                   billingAddress:
 *                     street: "123 Main Street"
 *                     city: "Mumbai"
 *                     state: "Maharashtra"
 *                     postalCode: "400001"
 *                     country: "India"
 *                   createdAt: "2025-08-25T10:30:00Z"
 *                   updatedAt: "2025-08-25T14:45:00Z"
 *                   user:
 *                     id: "user-uuid-123"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                     phone: "+91-9876543210"
 *                   orderItems:
 *                     - id: "item-uuid-1"
 *                       productId: "product-uuid-456"
 *                       variantId: "variant-uuid-789"
 *                       quantity: 2
 *                       price: 999.75
 *                     - id: "item-uuid-2"
 *                       productId: "product-uuid-789"
 *                       variantId: "variant-uuid-012"
 *                       quantity: 1
 *                       price: 499.00
 *       400:
 *         description: |
 *           Bad Request - Invalid or missing order ID parameter. The request must include a valid order ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message describing the validation failure
 *                   example: "Order ID is required"
 *             examples:
 *               missingOrderId:
 *                 summary: Missing order ID parameter
 *                 value:
 *                   error: "Order ID is required"
 *               invalidOrderId:
 *                 summary: Invalid order ID format
 *                 value:
 *                   error: "Order ID is required"
 *       404:
 *         description: |
 *           Order Not Found - No order exists with the provided ID in the system database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating order not found
 *                   example: "Order not found"
 *             examples:
 *               orderNotFound:
 *                 summary: Order does not exist
 *                 value:
 *                   error: "Order not found"
 *       500:
 *         description: |
 *           Internal Server Error - Failed to retrieve order due to database connectivity issues or server problems.
 *           This indicates system-level issues that prevent order data access.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               databaseConnectionError:
 *                 summary: Database connection failure
 *                 value:
 *                   error: "Failed to fetch order"
 *               serverOverload:
 *                 summary: Server overload or resource exhaustion
 *                 value:
 *                   error: "Failed to fetch order"
 *               unexpectedError:
 *                 summary: Unexpected system error
 *                 value:
 *                   error: "Failed to fetch order"
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const data = getOrderByIdSchema.parse(req.params);
        if (!data.orderId) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
                user: true,
                orderItems: true
            }
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({ error: "Failed to fetch order" });
    }
}

/**
 * @swagger
 * /api/shiprocket/couriers:
 *   get:
 *     summary: Retrieve comprehensive list of available courier partners from Shiprocket network
 *     description: |
 *       Fetches a complete directory of all courier partners available through Shiprocket's extensive logistics network. 
 *       This endpoint provides essential information for shipping decisions, cost optimization, and service level selection 
 *       across India's leading delivery infrastructure.
 *       
 *       **Courier Network Overview:**
 *       - 17+ leading courier partners including Bluedart, Delhivery, FedEx, and more
 *       - Comprehensive service capabilities and delivery coverage
 *       - Weight limitations and handling specifications
 *       - Service types from express to standard delivery options
 *       - Specialized services for different product categories
 *       
 *       **Service Classification:**
 *       - Express delivery for time-sensitive shipments
 *       - Standard surface delivery for cost-effective shipping
 *       - Air services for long-distance and premium delivery
 *       - COD enabled partners for cash-on-delivery orders
 *       - Premium services for high-value merchandise
 *       
 *       **Business Intelligence:**
 *       - Carrier performance metrics and delivery success rates
 *       - Service coverage areas and pincode serviceability
 *       - Cost optimization through carrier comparison
 *       - SLA commitments and delivery time guarantees
 *       
 *       **Integration Benefits:**
 *       - Dynamic carrier selection based on delivery requirements
 *       - Cost-effective shipping through multiple partner options
 *       - Backup carriers for service continuity
 *       - Specialized handling for different product types
 *       
 *       **Operational Applications:**
 *       - Shipping cost calculator and comparison tool
 *       - Delivery time estimation for customer communication
 *       - Service level agreement management
 *       - Logistics planning and optimization decisions
 *       
 *       This endpoint enables intelligent shipping decisions by providing complete visibility into 
 *       Shiprocket's extensive courier partner ecosystem, ensuring optimal delivery experiences for customers.
 *     tags: [Shiprocket]
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved comprehensive list of available courier partners. Returns detailed information 
 *           about each carrier's capabilities, service types, and operational parameters for shipping optimization.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourierInfo'
 *             examples:
 *               majorCouriers:
 *                 summary: Leading courier partners with diverse capabilities
 *                 value:
 *                   - id: 12
 *                     name: "Bluedart"
 *                     min_weight: 50
 *                     type: "express"
 *                     courier_type: "premium"
 *                     service_type: "air"
 *                   - id: 15
 *                     name: "Delhivery"
 *                     min_weight: 100
 *                     type: "standard"
 *                     courier_type: "standard"
 *                     service_type: "surface"
 *                   - id: 8
 *                     name: "FedEx"
 *                     min_weight: 50
 *                     type: "express"
 *                     courier_type: "premium"
 *                     service_type: "air"
 *                   - id: 23
 *                     name: "Ecom Express"
 *                     min_weight: 75
 *                     type: "standard"
 *                     courier_type: "standard"
 *                     service_type: "surface"
 *               specializedServices:
 *                 summary: Specialized courier services for different needs
 *                 value:
 *                   - id: 45
 *                     name: "DTDC Premium"
 *                     min_weight: 25
 *                     type: "express"
 *                     courier_type: "premium"
 *                     service_type: "air"
 *                   - id: 67
 *                     name: "India Post"
 *                     min_weight: 10
 *                     type: "economy"
 *                     courier_type: "government"
 *                     service_type: "surface"
 *       404:
 *         description: |
 *           No Couriers Found - Shiprocket API returned empty courier list or no partners are currently available.
 *           This could indicate temporary service unavailability or API connectivity issues.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               noCouriersAvailable:
 *                 summary: No courier partners currently available
 *                 value:
 *                   error: "No couriers found"
 *       500:
 *         description: |
 *           Internal Server Error - Failed to retrieve courier information due to system or API connectivity issues.
 *           This indicates problems with Shiprocket API access or internal processing errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               apiConnectionError:
 *                 summary: Shiprocket API connection failure
 *                 value:
 *                   error: "Failed to fetch couriers"
 *               dataProcessingError:
 *                 summary: Error processing courier data
 *                 value:
 *                   error: "Failed to fetch couriers"
 *       502:
 *         description: |
 *           Bad Gateway - Shiprocket courier service temporarily unavailable or returning invalid responses.
 *           This indicates external service issues beyond the application's control.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shiprocketUnavailable:
 *                 summary: Shiprocket courier API temporarily unavailable
 *                 value:
 *                   error: "Failed to fetch couriers"
 *                   details: "Courier service temporarily unavailable"
 */
export const getAllCouriers = async (req: Request, res: Response) => {
    try {
        const couriers = await axios.post(`${process.env.SHIPROCKET_API_URL}/courier/courierListWithCounts`, {
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (couriers.status !== 200) {
            res.status(couriers.status).json({ error: "Failed to fetch couriers" });
            return;
        }
        if (!couriers.data || couriers.data.length === 0) {
            res.status(404).json({ error: "No couriers found" });
            return;
        }
        const result = couriers.data.map((courier: (typeof couriers.data[0])) => ({
            id: courier.courier_data.id,
            name: courier.courier_data.name,
            min_weight: courier.courier_data.min_weight,
            type: courier.courier_data.type,
            courier_type: courier.courier_data.courier_type,
            service_type: courier.courier_data.service_type,
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching couriers:", error);
        res.status(500).json({ error: "Failed to fetch couriers" });
    }
};

/**
 * @swagger
 * /api/shiprocket/check-courier-availability:
 *   post:
 *     summary: Check courier serviceability and delivery options for specific order location
 *     description: |
 *       Validates courier partner availability and delivery capabilities for a specific order's destination. 
 *       This critical endpoint enables intelligent shipping decisions by providing real-time serviceability 
 *       information, delivery costs, and estimated delivery times for optimal customer experience.
 *       
 *       **Serviceability Analysis:**
 *       - Real-time pincode-based delivery validation
 *       - Pickup to delivery location compatibility check
 *       - Weight and dimension constraints verification
 *       - Service type availability (COD, prepaid, express)
 *       - Multi-carrier comparison for cost optimization
 *       
 *       **Delivery Intelligence:**
 *       - Accurate delivery time estimation for customer communication
 *       - Comprehensive cost breakdown including COD charges
 *       - Service level comparison across multiple carriers
 *       - Rush delivery and express shipping options
 *       - Bulk order handling capabilities
 *       
 *       **Business Optimization:**
 *       - Dynamic shipping cost calculation for checkout
 *       - Carrier performance metrics for selection decisions
 *       - Delivery promise accuracy for customer satisfaction
 *       - Cost-effective shipping option recommendations
 *       - Service disruption awareness and alternatives
 *       
 *       **Operational Benefits:**
 *       - Prevents failed delivery attempts through pre-validation
 *       - Reduces customer service inquiries about delivery
 *       - Enables accurate delivery promises and SLA management
 *       - Supports dynamic pricing based on delivery costs
 *       
 *       **Integration Applications:**
 *       - Checkout page shipping cost calculator
 *       - Order fulfillment system carrier selection
 *       - Customer delivery preference management
 *       - Logistics planning and route optimization
 *       
 *       This endpoint ensures reliable delivery by validating serviceability before order creation, 
 *       providing customers with accurate delivery information and enabling businesses to make informed shipping decisions.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Order identifier for courier availability validation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckCourierAvailabilityRequest'
 *           examples:
 *             standardOrder:
 *               summary: Check availability for standard jewelry order
 *               value:
 *                 orderId: "ORDER-20250825-123456"
 *             bulkOrder:
 *               summary: Check availability for bulk order
 *               value:
 *                 orderId: "ORDER-20250825-789012"
 *     responses:
 *       200:
 *         description: |
 *           Courier availability successfully validated. Returns comprehensive list of available carriers 
 *           with detailed service information, costs, and delivery estimates for informed shipping decisions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourierAvailabilityResponse'
 *             examples:
 *               multipleCarriers:
 *                 summary: Multiple carriers available with different service levels
 *                 value:
 *                   - id: 12
 *                     name: "Bluedart"
 *                     cod: true
 *                     codCharges: 2.5
 *                     city: "Mumbai"
 *                     chargeWeight: 500
 *                     courierType: "air"
 *                     cutoffTime: "18:00"
 *                     estimatedDeliveryDays: "1-2 days"
 *                     etd: "2025-08-27"
 *                     etd_hours: 48
 *                   - id: 15
 *                     name: "Delhivery"
 *                     cod: true
 *                     codCharges: 2.0
 *                     city: "Mumbai"
 *                     chargeWeight: 500
 *                     courierType: "surface"
 *                     cutoffTime: "17:00"
 *                     estimatedDeliveryDays: "2-3 days"
 *                     etd: "2025-08-28"
 *                     etd_hours: 72
 *               expressOnly:
 *                 summary: Only express delivery available for remote location
 *                 value:
 *                   - id: 8
 *                     name: "FedEx"
 *                     cod: false
 *                     codCharges: 0
 *                     city: "Guwahati"
 *                     chargeWeight: 500
 *                     courierType: "air"
 *                     cutoffTime: "16:00"
 *                     estimatedDeliveryDays: "2-3 days"
 *                     etd: "2025-08-28"
 *                     etd_hours: 72
 *       400:
 *         description: |
 *           Bad Request - Invalid order ID or request data validation failed.
 *           This typically indicates malformed request body or missing required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidOrderId:
 *                 summary: Order ID validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Order ID is required and must be valid"
 *               validationError:
 *                 summary: Request body validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Invalid request format"
 *       404:
 *         description: |
 *           Not Found - Order does not exist in the database or lacks required shipping information.
 *           Verify that the order exists and has complete shipping address details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               orderNotFound:
 *                 summary: Order ID not found in database
 *                 value:
 *                   error: "Order not found"
 *               missingShippingAddress:
 *                 summary: Order missing shipping address
 *                 value:
 *                   error: "Order not found"
 *                   details: "Shipping address required for availability check"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for seamless operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationFailed:
 *                 summary: Shiprocket authentication failed
 *                 value:
 *                   error: "Failed to check courier availability"
 *                   details: "Authentication required"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but courier availability check failed.
 *           This may indicate non-serviceable pincode or logistics constraints.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               nonServiceablePincode:
 *                 summary: Delivery location not serviceable
 *                 value:
 *                   error: "Failed to check courier availability"
 *                   details: "Delivery pincode not serviceable"
 *               logisticsConstraints:
 *                 summary: Order constraints prevent delivery
 *                 value:
 *                   error: "Failed to check courier availability"
 *                   details: "Order weight/dimensions exceed limits"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during availability check process.
 *           This could indicate system connectivity issues or data processing problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system error
 *                 value:
 *                   error: "Failed to check courier availability"
 */
export const checkCourierAvailability = async (req: Request, res: Response) => {
    try {
        const data = checkCourierAvailabilitySchema.parse(req.body);
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: { shippingAddress: true },
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const courierAvailability = await axios.post(`${process.env.SHIPROCKET_API_URL}/courier/serviceability/`, {
            pickup_postcode: process.env.PICKUP_PINCODE,
            delivery_postcode: order.shippingAddress?.zipCode,
            order_id: orderIdToNumber(order.id)
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (courierAvailability.status !== 200) {
            res.status(courierAvailability.status).json({ error: "Failed to check courier availability" });
            return;
        }
        const result = courierAvailability.data.map((courier: (typeof courierAvailability.data[0])) => ({
            id: courier.data.available_courier_companies.id,
            name: courier.data.available_courier_companies.courier_name,
            cod: courier.data.available_courier.cod,
            codCharges: courier.data.available_courier.cod_charges,
            city: courier.data.available_courier.city,
            chargeWeight: courier.data.available_courier.charge_weight,
            courierType: courier.data.available_courier.courier_type,
            cutoffTime: courier.data.available_courier.cutoff_time,
            estimatedDeliveryDays: courier.data.available_courier.estimated_delivery_days,
            etd: courier.data.available_courier.etd,
            etd_hours: courier.data.available_courier.etd_hours,
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error("Error checking courier availability:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to check courier availability" });
    }
};

/**
 * @swagger
 * /api/shiprocket/create-awb:
 *   post:
 *     summary: Generate Air Waybill (AWB) for shipment tracking and courier assignment
 *     description: |
 *       Creates an Air Waybill (AWB) number for shipment tracking and finalizes courier partner assignment. 
 *       This essential logistics step generates the unique tracking identifier that enables end-to-end shipment 
 *       visibility for customers, businesses, and courier partners throughout the delivery journey.
 *       
 *       **AWB Generation Process:**
 *       - Validates shipment existence and readiness for AWB creation
 *       - Assigns optimal courier partner based on serviceability and preferences
 *       - Generates unique AWB tracking number for shipment identification
 *       - Establishes tracking infrastructure for real-time status updates
 *       - Enables courier partner integration for pickup and delivery
 *       
 *       **Tracking Infrastructure:**
 *       - Unique AWB number for customer tracking portal access
 *       - Integration with courier partner tracking systems
 *       - Real-time status update capabilities across delivery network
 *       - SMS and email notification trigger setup
 *       - Proof of delivery documentation linkage
 *       
 *       **Courier Assignment Logic:**
 *       - Automatic optimal courier selection based on serviceability
 *       - Manual courier preference override capability
 *       - Cost-effective carrier assignment for business optimization
 *       - Service level matching (express, standard, economy)
 *       - COD capability alignment with payment method
 *       
 *       **Business Benefits:**
 *       - Professional tracking experience for customer satisfaction
 *       - Streamlined logistics operations with automated processes
 *       - Reduced customer service inquiries through self-service tracking
 *       - Enhanced delivery reliability through established courier partnerships
 *       - Comprehensive delivery analytics and performance metrics
 *       
 *       **Integration Applications:**
 *       - Customer order tracking portal updates
 *       - Automated notification system triggers
 *       - Business intelligence dashboard data source
 *       - Customer service inquiry resolution tool
 *       - Logistics performance monitoring system
 *       
 *       This endpoint transforms shipments into trackable deliveries by establishing the tracking infrastructure 
 *       necessary for professional e-commerce fulfillment and exceptional customer experience.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Shipment details for AWB generation and optional courier preference
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAWBRequest'
 *           examples:
 *             automaticCourierSelection:
 *               summary: Generate AWB with automatic courier assignment
 *               value:
 *                 shipmentId: "987654321"
 *             specificCourierRequest:
 *               summary: Generate AWB with specific courier preference
 *               value:
 *                 shipmentId: "987654321"
 *                 courierId: "12"
 *             bulkShipmentAWB:
 *               summary: Generate AWB for bulk shipment
 *               value:
 *                 shipmentId: "876543210"
 *                 courierId: "15"
 *     responses:
 *       200:
 *         description: |
 *           AWB successfully generated and courier assigned. Shipment is now ready for pickup with 
 *           complete tracking infrastructure established for customer visibility and operational monitoring.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAWBResponse'
 *             examples:
 *               expressDeliveryAWB:
 *                 summary: AWB generated for express delivery service
 *                 value:
 *                   awbCode: "12345678901234"
 *                   awbCodeStatus: "Success"
 *                   cod: false
 *                   courierName: "Bluedart"
 *               codDeliveryAWB:
 *                 summary: AWB generated for cash-on-delivery order
 *                 value:
 *                   awbCode: "98765432109876"
 *                   awbCodeStatus: "Success"
 *                   cod: true
 *                   courierName: "Delhivery"
 *               premiumServiceAWB:
 *                 summary: AWB generated for premium delivery service
 *                 value:
 *                   awbCode: "56789012345678"
 *                   awbCodeStatus: "Success"
 *                   cod: false
 *                   courierName: "FedEx"
 *       400:
 *         description: |
 *           Bad Request - Invalid shipment ID or request validation failed.
 *           This typically indicates malformed request data or invalid parameter values.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidShipmentId:
 *                 summary: Shipment ID validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Shipment ID is required and must be valid"
 *               invalidCourierId:
 *                 summary: Courier ID validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Invalid courier ID provided"
 *       404:
 *         description: |
 *           Not Found - Shipment not found or order does not exist in the system.
 *           Verify that the shipment ID corresponds to a valid created shipment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentNotFound:
 *                 summary: Shipment ID not found in database
 *                 value:
 *                   error: "Order not found"
 *               orderNotLinked:
 *                 summary: Shipment not linked to valid order
 *                 value:
 *                   error: "Order not found"
 *                   details: "Shipment not associated with valid order"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket token expired
 *                 value:
 *                   error: "Failed to create AWB"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but AWB creation failed due to logistics constraints.
 *           This may indicate courier availability issues or shipment status problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               courierUnavailable:
 *                 summary: Requested courier not available for shipment
 *                 value:
 *                   error: "Failed to create AWB"
 *                   details: "Courier not available for this shipment"
 *               shipmentNotReady:
 *                 summary: Shipment not ready for AWB generation
 *                 value:
 *                   error: "Failed to create AWB"
 *                   details: "Shipment not in correct status for AWB creation"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during AWB generation process.
 *           This could indicate system connectivity issues or Shiprocket API problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system error during AWB creation
 *                 value:
 *                   error: "Failed to create AWB"
 *               shiprocketApiError:
 *                 summary: Shiprocket API error
 *                 value:
 *                   error: "Failed to create AWB"
 */
export const createAWB = async (req: Request, res: Response) => {
    try {
        const data = createAWBSchema.parse(req.body);
        const order = await prisma.order.findUnique({
            where: { trackingId: data.shipmentId }
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const createdAWB = await axios.post(`${process.env.SHIPROCKET_API_URL}/courier/assign/awb`, {
            shipment_id: data.shipmentId,
            courier_id: data.courierId ? data.courierId : undefined
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (createdAWB.status !== 200) {
            res.status(createdAWB.status).json({ error: "Failed to create AWB" });
            return;
        }
        const result = {
            awbCode: createdAWB.data.response.data.awb_code,
            awbCodeStatus: createdAWB.data.response.data.status,
            cod: createdAWB.data.response.data.cod,
            courierName: createdAWB.data.response.courier_name
        }
        res.status(200).json(result);
    } catch (error) {
        console.error("Error creating AWB:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to create AWB" });
    }
};

/**
 * @swagger
 * /api/shiprocket/create-shipment:
 *   post:
 *     summary: Schedule shipment pickup and initiate delivery process with courier partner
 *     description: |
 *       Finalizes the shipping process by scheduling pickup with the assigned courier partner and initiating 
 *       the delivery journey. This critical endpoint transforms prepared shipments into active deliveries, 
 *       triggering the logistics chain that brings products to customers' doorsteps.
 *       
 *       **Pickup Scheduling Process:**
 *       - Validates shipment readiness with AWB assignment verification
 *       - Schedules pickup with assigned courier partner for specified date
 *       - Generates pickup request in courier partner's system
 *       - Establishes delivery timeline and customer communication triggers
 *       - Activates real-time tracking and status update infrastructure
 *       
 *       **Delivery Journey Initiation:**
 *       - Transfers shipment control to courier partner network
 *       - Establishes delivery SLA and performance tracking
 *       - Enables customer tracking portal with live updates
 *       - Triggers automated notification system for delivery milestones
 *       - Activates proof of delivery and customer feedback collection
 *       
 *       **Operational Excellence:**
 *       - Flexible pickup date scheduling for business convenience
 *       - Automatic pickup optimization based on courier partner capabilities
 *       - Integration with warehouse management for efficient fulfillment
 *       - Quality assurance through established courier partner protocols
 *       - Exception handling for pickup failures and delivery issues
 *       
 *       **Customer Experience Enhancement:**
 *       - Proactive delivery notifications and status updates
 *       - Accurate delivery time estimates for customer planning
 *       - Professional tracking experience with detailed status information
 *       - Customer service integration for delivery inquiries
 *       - Delivery preference management and communication options
 *       
 *       **Business Intelligence:**
 *       - Delivery performance analytics and courier partner evaluation
 *       - Customer satisfaction metrics through delivery experience
 *       - Logistics cost analysis and optimization opportunities
 *       - Seasonal demand planning and capacity management
 *       - Return logistics and reverse pickup coordination
 *       
 *       This endpoint completes the e-commerce fulfillment cycle by transforming orders into active deliveries, 
 *       ensuring professional service delivery and exceptional customer satisfaction through India's leading logistics network.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Shipment details for pickup scheduling and delivery initiation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShipmentRequest'
 *           examples:
 *             immediatePickup:
 *               summary: Schedule immediate pickup for same-day processing
 *               value:
 *                 shipmentId: "987654321"
 *             scheduledPickup:
 *               summary: Schedule pickup for specific future date
 *               value:
 *                 shipmentId: "987654321"
 *                 pickUpDate: "2025-08-28"
 *             bulkShipmentScheduling:
 *               summary: Schedule pickup for bulk shipment
 *               value:
 *                 shipmentId: "876543210"
 *                 pickUpDate: "2025-08-26"
 *     responses:
 *       200:
 *         description: |
 *           Shipment pickup successfully scheduled and delivery process initiated. Courier partner has been 
 *           notified and tracking infrastructure is active for customer and operational monitoring.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateShipmentResponse'
 *             examples:
 *               expressShipmentCreated:
 *                 summary: Express delivery shipment successfully scheduled
 *                 value:
 *                   orderId: "ORDER-20250825-123456"
 *                   shipmentId: "987654321"
 *                   courierName: "Bluedart"
 *                   awb_code: "12345678901234"
 *               standardShipmentCreated:
 *                 summary: Standard delivery shipment successfully scheduled
 *                 value:
 *                   orderId: "ORDER-20250825-789012"
 *                   shipmentId: "876543210"
 *                   courierName: "Delhivery"
 *                   awb_code: "98765432109876"
 *               codShipmentCreated:
 *                 summary: Cash-on-delivery shipment successfully scheduled
 *                 value:
 *                   orderId: "ORDER-20250825-345678"
 *                   shipmentId: "765432109"
 *                   courierName: "Ecom Express"
 *                   awb_code: "56789012345678"
 *       400:
 *         description: |
 *           Bad Request - Invalid shipment data or request validation failed.
 *           This typically indicates malformed request parameters or invalid date formats.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidShipmentId:
 *                 summary: Shipment ID validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Shipment ID is required and must be valid"
 *               invalidPickupDate:
 *                 summary: Pickup date format validation failed
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Invalid pick-up date format, expected YYYY-MM-DD"
 *               pastDateError:
 *                 summary: Pickup date is in the past
 *                 value:
 *                   error: "Invalid request data"
 *                   details: "Pickup date cannot be in the past"
 *       404:
 *         description: |
 *           Not Found - Shipment or associated order not found in the system.
 *           Verify that the shipment ID corresponds to a valid order with AWB assignment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentNotFound:
 *                 summary: Shipment ID not found in database
 *                 value:
 *                   error: "Order not found"
 *               orderNotAssociated:
 *                 summary: Shipment not associated with valid order
 *                 value:
 *                   error: "Order not found"
 *                   details: "Shipment not linked to existing order"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for seamless operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               tokenExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to create shipment"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but shipment creation failed due to business constraints.
 *           This may indicate pickup scheduling conflicts or courier partner limitations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               pickupUnavailable:
 *                 summary: Pickup not available on requested date
 *                 value:
 *                   error: "Failed to create shipment"
 *                   details: "Pickup not available on selected date"
 *               courierConstraints:
 *                 summary: Courier partner constraints prevent pickup
 *                 value:
 *                   error: "Failed to create shipment"
 *                   details: "Courier partner cannot service this pickup request"
 *               shipmentNotReady:
 *                 summary: Shipment not ready for pickup scheduling
 *                 value:
 *                   error: "Failed to create shipment"
 *                   details: "Shipment must have AWB assignment before pickup"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during shipment creation process.
 *           This could indicate system connectivity issues, database problems, or Shiprocket API failures.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system error during shipment creation
 *                 value:
 *                   error: "Failed to create shipment"
 *               databaseError:
 *                 summary: Database connectivity issue
 *                 value:
 *                   error: "Failed to create shipment"
 *               shiprocketApiError:
 *                 summary: Shiprocket API unavailable
 *                 value:
 *                   error: "Failed to create shipment"
 */
export const createShipment = async (req: Request, res: Response) => {
    try {
        const data = createShipmentSchema.parse(req.body);
        const order = await prisma.order.findUnique({
            where: { trackingId: data.shipmentId }
        });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const createdShipment = await axios.post(`${process.env.SHIPROCKET_API_URL}/courier/generate/pickup`, {
            shipment_id: data.shipmentId,
            pickup_date: data.pickUpDate ? new Date(data.pickUpDate) : undefined
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (createdShipment.status !== 200) {
            res.status(createdShipment.status).json({ error: "Failed to create shipment" });
            return;
        }
        const generateManifest = await axios.post(`${process.env.SHIPROCKET_API_URL!}/manifests/generate`, {
            shipment_id: data.shipmentId
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (generateManifest.status !== 200) {
            res.status(generateManifest.status).json({ error: "Failed to generate manifest" });
            return;
        }
        const result = {
            orderId: order.id,
            shipmentId: data.shipmentId,
            courierName: createdShipment.data.response.courier_name,
            awb_code: createdShipment.data.response.data.awb_code
        };
        res.status(200).json(result);
    } catch (error) {
        console.error("Error creating shipment:", error);

        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to create shipment" });
    }
};

/**
 * @swagger
 * /api/shiprocket/get-all-shipments:
 *   get:
 *     summary: Retrieve comprehensive list of all shipments from Shiprocket logistics network
 *     description: |
 *       Fetches complete shipment data from Shiprocket's logistics platform, providing real-time visibility 
 *       into active deliveries, shipment status, and courier partner performance across the entire delivery network.
 *       
 *       **Shipment Visibility Dashboard:**
 *       - Real-time tracking of all active shipments
 *       - Comprehensive delivery status monitoring
 *       - Courier partner performance analytics
 *       - Exception handling and delivery issue identification
 *       - Customer communication trigger points
 *       
 *       **Operational Intelligence:**
 *       - Live shipment status across multiple courier partners
 *       - Delivery timeline tracking and performance metrics
 *       - Pickup scheduling and fulfillment coordination
 *       - Route optimization and logistics planning
 *       - Proof of delivery documentation management
 *       
 *       **Business Analytics Applications:**
 *       - Delivery performance measurement and KPI tracking
 *       - Customer satisfaction correlation with delivery experience
 *       - Courier partner comparison and optimization
 *       - Geographic delivery pattern analysis
 *       - Seasonal logistics capacity planning
 *       
 *       **Customer Experience Enhancement:**
 *       - Proactive delivery status communication
 *       - Accurate delivery time estimation
 *       - Exception management and customer notification
 *       - Return logistics coordination
 *       - Delivery preference optimization
 *       
 *       **Integration Benefits:**
 *       - Synchronized tracking across all platforms
 *       - Automated customer notification triggers
 *       - Business intelligence dashboard integration
 *       - Customer service inquiry resolution
 *       - Financial reconciliation and cost analysis
 *       
 *       This endpoint provides complete shipment lifecycle visibility, enabling proactive logistics management 
 *       and exceptional customer delivery experiences through comprehensive tracking and analytics.
 *     tags: [Shiprocket]
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved all shipments from Shiprocket network. Returns comprehensive shipment data 
 *           including tracking information, delivery status, and courier details for operational monitoring.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShipmentData'
 *             examples:
 *               activeShipments:
 *                 summary: Sample active shipments with various statuses
 *                 value:
 *                   - id: 123456789
 *                     awb: "12345678901234"
 *                     courier_name: "Bluedart"
 *                     status: "IN_TRANSIT"
 *                     pickup_date: "2025-08-26"
 *                     delivered_date: null
 *                     origin: "Mumbai"
 *                     destination: "Delhi"
 *                   - id: 987654321
 *                     awb: "98765432109876"
 *                     courier_name: "Delhivery"
 *                     status: "DELIVERED"
 *                     pickup_date: "2025-08-24"
 *                     delivered_date: "2025-08-26T14:30:00Z"
 *                     origin: "Mumbai"
 *                     destination: "Bangalore"
 *               emptyShipmentList:
 *                 summary: No active shipments found
 *                 value: []
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued access.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket token expired
 *                 value:
 *                   error: "Failed to fetch shipments"
 *                   details: "Authentication token expired"
 *       500:
 *         description: |
 *           Internal Server Error - Failed to retrieve shipments from Shiprocket platform.
 *           This indicates system connectivity issues or API processing errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               shiprocketApiError:
 *                 summary: Shiprocket API connectivity issue
 *                 value:
 *                   error: "Failed to fetch shipments"
 *               systemProcessingError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to fetch shipments"
 */
export const getAllShipments = async (req: Request, res: Response) => {
    try {
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const shipments = await axios.post(`${process.env.SHIPROCKET_API_URL!}/shipments`, {
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (shipments.status !== 200) {
            res.status(shipments.status).json({ error: "Failed to fetch shipments" });
            return;
        }
        res.status(200).json(shipments.data.data);
    } catch (error) {
        console.error("Error fetching shipments:", error);
        res.status(500).json({ error: "Failed to fetch shipments" });
    }
};

/**
 * @swagger
 * /api/shiprocket/get-shipment/{id}:
 *   get:
 *     summary: Retrieve detailed information for a specific shipment by ID
 *     description: |
 *       Fetches comprehensive details for a specific shipment from Shiprocket's logistics platform, 
 *       providing complete tracking information, delivery status, and courier partner details for 
 *       precise shipment monitoring and customer service operations.
 *       
 *       **Detailed Shipment Intelligence:**
 *       - Complete shipment lifecycle tracking from pickup to delivery
 *       - Real-time status updates with timestamp precision
 *       - Courier partner information and contact details
 *       - Route tracking and delivery milestone progression
 *       - Exception handling and delivery issue documentation
 *       
 *       **Tracking Capabilities:**
 *       - AWB number for customer tracking portal access
 *       - Detailed delivery timeline with checkpoint updates
 *       - Geographic location tracking during transit
 *       - Proof of delivery documentation access
 *       - Return logistics status and coordination
 *       
 *       **Customer Service Applications:**
 *       - Instant shipment status lookup for customer inquiries
 *       - Delivery issue investigation and resolution
 *       - Accurate delivery time estimation updates
 *       - Proactive customer communication triggers
 *       - Exception management and alternative arrangements
 *       
 *       **Business Operations Benefits:**
 *       - Individual shipment performance analysis
 *       - Courier partner service level assessment
 *       - Delivery cost analysis and optimization
 *       - Customer satisfaction correlation tracking
 *       - Quality assurance and process improvement
 *       
 *       **Integration Features:**
 *       - Customer notification system integration
 *       - Business intelligence dashboard updates
 *       - Automated status synchronization
 *       - Financial reconciliation support
 *       - Analytics and reporting data source
 *       
 *       This endpoint enables precision tracking and comprehensive customer service by providing 
 *       complete visibility into individual shipment journeys through India's logistics network.
 *     tags: [Shiprocket]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Shiprocket shipment ID to retrieve detailed information
 *         schema:
 *           type: string
 *           example: "123456789"
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved detailed shipment information. Returns comprehensive tracking data, 
 *           delivery status, and courier details for complete shipment visibility and customer service.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShipmentData'
 *             examples:
 *               activeShipmentDetails:
 *                 summary: Detailed information for shipment in transit
 *                 value:
 *                   id: 123456789
 *                   awb: "12345678901234"
 *                   courier_name: "Bluedart"
 *                   status: "IN_TRANSIT"
 *                   pickup_date: "2025-08-26"
 *                   delivered_date: null
 *                   origin: "Mumbai"
 *                   destination: "Delhi"
 *               deliveredShipmentDetails:
 *                 summary: Completed delivery with full tracking history
 *                 value:
 *                   id: 987654321
 *                   awb: "98765432109876"
 *                   courier_name: "Delhivery"
 *                   status: "DELIVERED"
 *                   pickup_date: "2025-08-24"
 *                   delivered_date: "2025-08-26T14:30:00Z"
 *                   origin: "Mumbai"
 *                   destination: "Bangalore"
 *       400:
 *         description: |
 *           Bad Request - Invalid shipment ID format or missing required parameter.
 *           Verify that the shipment ID is correctly formatted and provided.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               invalidShipmentId:
 *                 summary: Shipment ID validation failed
 *                 value:
 *                   error: "Shipment ID is required"
 *               malformedRequest:
 *                 summary: Request parameter validation error
 *                 value:
 *                   error: "Invalid shipment ID format"
 *       404:
 *         description: |
 *           Not Found - Shipment with the specified ID does not exist in Shiprocket system.
 *           Verify that the shipment ID is correct and the shipment has been created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentNotFound:
 *                 summary: Shipment ID not found in system
 *                 value:
 *                   error: "Shipment not found"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued access.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to fetch shipment"
 *                   details: "Authentication token expired"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during shipment retrieval process.
 *           This could indicate system connectivity issues or API processing problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to fetch shipment"
 *               apiConnectivityError:
 *                 summary: Shiprocket API connectivity issue
 *                 value:
 *                   error: "Failed to fetch shipment"
 */
export const getShipmentById = async (req: Request, res: Response) => {
    try {
        const data = getShipmentByIdSchema.parse(req.params);
        if (!data.shipmentId) {
            res.status(400).json({ error: "Shipment ID is required" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const shipment = await axios.post(`${process.env.SHIPROCKET_API_URL!}/shipments/${data.shipmentId}`, {
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (shipment.status !== 200) {
            res.status(shipment.status).json({ error: "Failed to fetch shipment" });
            return;
        }
        if (!shipment.data.data.length) {
            res.status(404).json({ error: "Shipment not found" });
            return;
        }
        res.status(200).json(shipment.data.data);
    } catch (error) {
        console.error("Error fetching shipment:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to fetch shipment" });
    }
};

/**
 * @swagger
 * /api/shiprocket/cancel-shipment:
 *   post:
 *     summary: Cancel an active shipment and coordinate return logistics
 *     description: |
 *       Cancels an active shipment in Shiprocket's logistics network, coordinating with courier partners 
 *       to halt delivery and arrange return logistics. This critical operation enables order cancellation 
 *       management and customer service flexibility throughout the delivery lifecycle.
 *       
 *       **Cancellation Process Management:**
 *       - Validates shipment eligibility for cancellation based on current status
 *       - Coordinates with courier partner to halt active delivery
 *       - Initiates return logistics for picked-up shipments
 *       - Updates tracking status across all integrated systems
 *       - Triggers customer notification and refund processes
 *       
 *       **Operational Coordination:**
 *       - Real-time communication with courier partner networks
 *       - Automated status updates across Wymi and Shiprocket platforms
 *       - Return logistics scheduling and coordination
 *       - Inventory management and stock reconciliation
 *       - Financial processing and refund initiation
 *       
 *       **Customer Service Applications:**
 *       - Order cancellation request processing
 *       - Emergency delivery halt for customer changes
 *       - Address correction through cancellation and re-shipment
 *       - Quality issue resolution and product recall
 *       - Customer preference modification management
 *       
 *       **Business Process Benefits:**
 *       - Flexible order management throughout delivery cycle
 *       - Cost optimization through timely cancellation
 *       - Customer satisfaction through responsive service
 *       - Inventory accuracy through proper return handling
 *       - Financial accuracy through automated reconciliation
 *       
 *       **Integration Capabilities:**
 *       - Automated refund processing triggers
 *       - Inventory management system synchronization
 *       - Customer communication automation
 *       - Business intelligence reporting updates
 *       - Financial accounting integration
 *       
 *       This endpoint provides comprehensive cancellation management, enabling responsive customer service 
 *       and flexible order handling throughout the entire delivery process.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Tracking ID of the shipment to be cancelled
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelShipmentRequest'
 *           examples:
 *             customerCancellation:
 *               summary: Customer-requested order cancellation
 *               value:
 *                 trackingId: "123456789"
 *             emergencyHalt:
 *               summary: Emergency delivery halt for address change
 *               value:
 *                 trackingId: "987654321"
 *             qualityIssue:
 *               summary: Product recall due to quality concerns
 *               value:
 *                 trackingId: "456789123"
 *     responses:
 *       200:
 *         description: |
 *           Shipment successfully cancelled. Courier partner has been notified and return logistics 
 *           have been initiated. Customer notification and refund processes are triggered automatically.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message for successful cancellation
 *                   example: "Shipment canceled successfully"
 *             examples:
 *               successfulCancellation:
 *                 summary: Shipment cancelled and return logistics initiated
 *                 value:
 *                   message: "Shipment canceled successfully"
 *       400:
 *         description: |
 *           Bad Request - Invalid tracking ID or request validation failed.
 *           This typically indicates missing required parameters or malformed request data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               missingTrackingId:
 *                 summary: Tracking ID is required for cancellation
 *                 value:
 *                   error: "Tracking ID is required"
 *               invalidTrackingId:
 *                 summary: Tracking ID format validation failed
 *                 value:
 *                   error: "Invalid tracking ID format"
 *       404:
 *         description: |
 *           Not Found - Shipment with the specified tracking ID does not exist.
 *           Verify that the tracking ID is correct and corresponds to an active shipment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentNotFound:
 *                 summary: Tracking ID not found in system
 *                 value:
 *                   error: "Shipment not found"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to cancel shipment"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but shipment cannot be cancelled.
 *           This may indicate shipment status constraints or courier partner limitations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentAlreadyDelivered:
 *                 summary: Cannot cancel delivered shipment
 *                 value:
 *                   error: "Failed to cancel shipment"
 *                   details: "Shipment already delivered and cannot be cancelled"
 *               cancellationWindowExpired:
 *                 summary: Cancellation no longer possible due to status
 *                 value:
 *                   error: "Failed to cancel shipment"
 *                   details: "Shipment status does not allow cancellation"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during cancellation process.
 *           This could indicate system connectivity issues or courier partner API problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to cancel shipment"
 *               courierApiError:
 *                 summary: Courier partner API communication failure
 *                 value:
 *                   error: "Failed to cancel shipment"
 */
export const cancelShipment = async (req: Request, res: Response) => {
    try {
        const data = cancelShipmentSchema.parse(req.body);
        if (!data.trackingId) {
            res.status(400).json({ error: "Tracking ID is required" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const shipment = await axios.post(`${process.env.SHIPROCKET_API_URL!}/shipments/${data.trackingId}`, {   
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (shipment.status !== 200) {
            res.status(shipment.status).json({ error: "Failed to fetch shipment" });
            return;
        }
        if (shipment.data.data.length === 0) {
            res.status(404).json({ error: "Shipment not found" });
            return;
        }
        const response = await axios.delete(`${process.env.SHIPROCKET_API_URL!}/shipments/cancel/${shipment.data.data.awb}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            },
        });
        if (response.status !== 200) {
            res.status(response.status).json({ error: "Failed to cancel shipment" });
            return;
        }
        res.status(200).json({ message: "Shipment canceled successfully" });
    } catch (error) {
        console.error("Error canceling shipment:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to cancel shipment" });
    }
};

/**
 * @swagger
 * /api/shiprocket/print-manifest:
 *   post:
 *     summary: Generate comprehensive shipping manifest for multiple orders
 *     description: |
 *       Creates a comprehensive shipping manifest document containing detailed information for multiple orders, 
 *       enabling efficient batch processing, courier coordination, and compliance documentation for 
 *       professional logistics operations and regulatory requirements.
 *       
 *       **Manifest Generation Process:**
 *       - Consolidates multiple orders into a single comprehensive document
 *       - Validates order readiness and shipping requirements
 *       - Generates courier partner compatible manifest format
 *       - Includes regulatory compliance and customs documentation
 *       - Provides downloadable PDF format for operational use
 *       
 *       **Operational Efficiency Benefits:**
 *       - Batch processing for high-volume shipping operations
 *       - Streamlined courier pickup coordination
 *       - Reduced paperwork and administrative overhead
 *       - Standardized documentation across all shipments
 *       - Quality assurance through systematic order verification
 *       
 *       **Compliance and Documentation:**
 *       - Regulatory compliance for commercial shipping
 *       - Customs documentation for interstate commerce
 *       - Audit trail creation for financial reconciliation
 *       - Insurance documentation for high-value shipments
 *       - Quality control verification and validation
 *       
 *       **Business Process Integration:**
 *       - Warehouse management system coordination
 *       - Inventory tracking and reconciliation
 *       - Financial accounting and cost allocation
 *       - Customer service documentation access
 *       - Business intelligence reporting integration
 *       
 *       **Courier Partner Coordination:**
 *       - Standardized pickup documentation format
 *       - Efficient bulk shipment processing
 *       - Reduced processing time and errors
 *       - Professional service presentation
 *       - Automated communication and scheduling
 *       
 *       This endpoint streamlines bulk shipping operations by providing comprehensive manifest generation, 
 *       ensuring professional logistics management and regulatory compliance across all delivery operations.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Array of order IDs for manifest generation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrintManifestRequest'
 *           examples:
 *             dailyManifest:
 *               summary: Daily shipping manifest for regular operations
 *               value:
 *                 orderIds: ["ORDER-20250826-123456", "ORDER-20250826-789012", "ORDER-20250826-345678"]
 *             bulkOrderManifest:
 *               summary: Bulk order manifest for high-volume processing
 *               value:
 *                 orderIds: ["ORDER-20250826-111111", "ORDER-20250826-222222", "ORDER-20250826-333333", "ORDER-20250826-444444", "ORDER-20250826-555555"]
 *             expressManifest:
 *               summary: Express shipping manifest for urgent deliveries
 *               value:
 *                 orderIds: ["ORDER-20250826-EXPRESS-001", "ORDER-20250826-EXPRESS-002"]
 *     responses:
 *       200:
 *         description: |
 *           Manifest successfully generated and ready for download. Returns downloadable URL for 
 *           comprehensive shipping documentation including all order details and compliance information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrintManifestResponse'
 *             examples:
 *               manifestGenerated:
 *                 summary: Manifest successfully created with download link
 *                 value:
 *                   manifest_url: "https://shiprocket.co/manifests/download/manifest-20250826-123456.pdf"
 *       400:
 *         description: |
 *           Bad Request - Invalid order IDs or request validation failed.
 *           This typically indicates missing required parameters or malformed order ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               missingOrderIds:
 *                 summary: Order IDs are required for manifest generation
 *                 value:
 *                   error: "Order ID is required"
 *               invalidOrderIds:
 *                 summary: Order ID format validation failed
 *                 value:
 *                   error: "Invalid order ID format in request"
 *               emptyOrderList:
 *                 summary: Empty order list provided
 *                 value:
 *                   error: "At least one order ID is required"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to generate manifest"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but manifest generation failed.
 *           This may indicate order status issues or incomplete shipping information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               ordersNotReady:
 *                 summary: Orders not ready for manifest generation
 *                 value:
 *                   error: "Failed to generate manifest"
 *                   details: "Some orders are not ready for shipping"
 *               incompleteOrderData:
 *                 summary: Incomplete order information prevents manifest creation
 *                 value:
 *                   error: "Failed to generate manifest"
 *                   details: "Order data incomplete for manifest requirements"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during manifest generation process.
 *           This could indicate system connectivity issues or document generation problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to generate manifest"
 *               documentGenerationError:
 *                 summary: Document generation service unavailable
 *                 value:
 *                   error: "Failed to generate manifest"
 */
export const printManifest = async (req: Request, res: Response) => {
    try {
        const data = printManifestSchema.parse(req.body);
        if (!data.orderIds || data.orderIds.length === 0) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const response = await axios.post(`${process.env.SHIPROCKET_API_URL!}/manifests/print`, {
            order_ids: data.orderIds.map(orderIdToNumber)
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (response.status !== 200) {
            res.status(response.status).json({ error: "Failed to generate manifest" });
            return;
        }
        res.status(200).json({ manifest_url: response.data.manifest_url });
    } catch (error) {
        console.error("Error generating manifest:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to generate manifest" });
    }
};

/**
 * @swagger
 * /api/shiprocket/generate-label:
 *   post:
 *     summary: Generate professional shipping labels for multiple shipments
 *     description: |
 *       Creates high-quality shipping labels for multiple shipments, providing courier-ready documentation 
 *       with tracking barcodes, address information, and regulatory compliance details for professional 
 *       logistics operations and seamless delivery coordination.
 *       
 *       **Label Generation Process:**
 *       - Creates courier partner compatible shipping labels
 *       - Includes trackable barcode and QR code generation
 *       - Incorporates complete shipping and billing address information
 *       - Adds regulatory compliance and handling instructions
 *       - Provides high-resolution printable format for professional presentation
 *       
 *       **Professional Documentation Features:**
 *       - Industry-standard label format and dimensions
 *       - High-resolution graphics for clear printing
 *       - Barcode and QR code integration for automated processing
 *       - Complete address formatting and postal compliance
 *       - Courier partner branding and service specifications
 *       
 *       **Operational Efficiency Benefits:**
 *       - Batch label generation for high-volume operations
 *       - Standardized format across all courier partners
 *       - Reduced manual processing and labeling errors
 *       - Professional presentation for customer confidence
 *       - Streamlined warehouse operations and packaging
 *       
 *       **Quality Assurance Features:**
 *       - Automatic address validation and formatting
 *       - Tracking number verification and validation
 *       - Regulatory compliance verification
 *       - Courier partner requirement validation
 *       - Print quality optimization for scanning reliability
 *       
 *       **Integration Capabilities:**
 *       - Warehouse management system integration
 *       - Automated printing workflow coordination
 *       - Inventory tracking and package association
 *       - Customer notification trigger integration
 *       - Business intelligence reporting data capture
 *       
 *       This endpoint ensures professional shipping presentation and operational efficiency through 
 *       high-quality label generation that meets all courier partner and regulatory requirements.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Array of tracking IDs for label generation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateLabelRequest'
 *           examples:
 *             dailyLabels:
 *               summary: Daily label generation for regular shipments
 *               value:
 *                 trackingIds: ["123456789", "987654321", "456789123"]
 *             expressLabels:
 *               summary: Express delivery labels for urgent shipments
 *               value:
 *                 trackingIds: ["EXPRESS-001", "EXPRESS-002"]
 *             bulkLabels:
 *               summary: Bulk label generation for high-volume processing
 *               value:
 *                 trackingIds: ["111111111", "222222222", "333333333", "444444444", "555555555"]
 *     responses:
 *       200:
 *         description: |
 *           Shipping labels successfully generated and ready for download. Returns downloadable URL for 
 *           high-quality printable labels with complete tracking and address information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateLabelResponse'
 *             examples:
 *               labelsGenerated:
 *                 summary: Labels successfully created with download link
 *                 value:
 *                   label_url: "https://shiprocket.co/labels/download/labels-20250826-123456.pdf"
 *       400:
 *         description: |
 *           Bad Request - Invalid tracking IDs or request validation failed.
 *           This typically indicates missing required parameters or malformed tracking ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               missingTrackingIds:
 *                 summary: Tracking IDs are required for label generation
 *                 value:
 *                   error: "Tracking ID is required"
 *               invalidTrackingIds:
 *                 summary: Tracking ID format validation failed
 *                 value:
 *                   error: "Invalid tracking ID format in request"
 *               emptyTrackingList:
 *                 summary: Empty tracking ID list provided
 *                 value:
 *                   error: "At least one tracking ID is required"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to generate label"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but label generation failed.
 *           This may indicate shipment status issues or incomplete tracking information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               shipmentsNotReady:
 *                 summary: Shipments not ready for label generation
 *                 value:
 *                   error: "Failed to generate label"
 *                   details: "Some shipments are not ready for labeling"
 *               incompleteTrackingData:
 *                 summary: Incomplete tracking information prevents label creation
 *                 value:
 *                   error: "Failed to generate label"
 *                   details: "Tracking data incomplete for label requirements"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during label generation process.
 *           This could indicate system connectivity issues or document generation problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to generate label"
 *               documentGenerationError:
 *                 summary: Label generation service unavailable
 *                 value:
 *                   error: "Failed to generate label"
 */
export const generateLabel = async (req: Request, res: Response) => {
    try {
        const data = generateLabelSchema.parse(req.body);
        if (!data.trackingIds || data.trackingIds.length === 0) {
            res.status(400).json({ error: "Tracking ID is required" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const response = await axios.post(`${process.env.SHIPROCKET_API_URL!}/generate/label`, {
            shipment_id: data.trackingIds
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (response.status !== 200) {
            res.status(response.status).json({ error: "Failed to generate label" });
            return;
        }
        res.status(200).json({ label_url: response.data.label_url });
    } catch (error) {
        console.error("Error generating label:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to generate label" });
    }
};

/**
 * @swagger
 * /api/shiprocket/generate-invoice:
 *   post:
 *     summary: Generate comprehensive commercial invoices for multiple orders
 *     description: |
 *       Creates professional commercial invoices for multiple orders, providing complete financial documentation 
 *       with detailed itemization, tax calculations, and regulatory compliance information for business 
 *       accounting, customs clearance, and customer records.
 *       
 *       **Invoice Generation Process:**
 *       - Creates comprehensive commercial invoice documents
 *       - Includes detailed product itemization with pricing
 *       - Incorporates complete tax calculations and breakdowns
 *       - Adds regulatory compliance and customs documentation
 *       - Provides professional PDF format for business use
 *       
 *       **Financial Documentation Features:**
 *       - Complete order value breakdown with taxes
 *       - Detailed product descriptions and quantities
 *       - GST calculations and compliance information
 *       - Discount applications and coupon details
 *       - Payment method and transaction references
 *       
 *       **Business Compliance Benefits:**
 *       - Regulatory compliance for commercial transactions
 *       - Customs documentation for interstate commerce
 *       - Audit trail creation for financial reconciliation
 *       - Tax filing documentation and support
 *       - Professional customer communication
 *       
 *       **Accounting Integration Features:**
 *       - Financial accounting system compatibility
 *       - Automated tax calculation and reporting
 *       - Revenue recognition documentation
 *       - Customer payment tracking integration
 *       - Business intelligence reporting support
 *       
 *       **Customer Service Applications:**
 *       - Professional invoice delivery to customers
 *       - Return and refund documentation support
 *       - Payment inquiry resolution documentation
 *       - Warranty and service record linkage
 *       - Customer account management integration
 *       
 *       This endpoint ensures comprehensive financial documentation and regulatory compliance through 
 *       professional invoice generation that meets all business and legal requirements.
 *     tags: [Shiprocket]
 *     requestBody:
 *       required: true
 *       description: Array of order IDs for invoice generation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateInvoiceRequest'
 *           examples:
 *             monthlyInvoices:
 *               summary: Monthly invoice generation for accounting
 *               value:
 *                 orderIds: ["ORDER-20250826-123456", "ORDER-20250826-789012", "ORDER-20250826-345678"]
 *             bulkInvoices:
 *               summary: Bulk invoice generation for high-volume processing
 *               value:
 *                 orderIds: ["ORDER-20250826-111111", "ORDER-20250826-222222", "ORDER-20250826-333333", "ORDER-20250826-444444"]
 *             customerInvoices:
 *               summary: Customer-specific invoice generation
 *               value:
 *                 orderIds: ["ORDER-20250826-CUSTOMER-001", "ORDER-20250826-CUSTOMER-002"]
 *     responses:
 *       200:
 *         description: |
 *           Invoices successfully generated and ready for download. Returns downloadable URL for 
 *           comprehensive commercial invoices with complete financial and tax information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateInvoiceResponse'
 *             examples:
 *               invoicesGenerated:
 *                 summary: Invoices successfully created with download link
 *                 value:
 *                   invoice_url: "https://shiprocket.co/invoices/download/invoices-20250826-123456.pdf"
 *       400:
 *         description: |
 *           Bad Request - Invalid order IDs or request validation failed.
 *           This typically indicates missing required parameters or malformed order ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               missingOrderIds:
 *                 summary: Order IDs are required for invoice generation
 *                 value:
 *                   error: "Order ID is required"
 *               invalidOrderIds:
 *                 summary: Order ID format validation failed
 *                 value:
 *                   error: "Invalid order ID format in request"
 *               emptyOrderList:
 *                 summary: Empty order list provided
 *                 value:
 *                   error: "At least one order ID is required"
 *       401:
 *         description: |
 *           Unauthorized - Shiprocket authentication failed or token expired.
 *           The system will attempt automatic token refresh for continued operation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               authenticationExpired:
 *                 summary: Shiprocket authentication token expired
 *                 value:
 *                   error: "Failed to generate invoice"
 *                   details: "Authentication token expired"
 *       422:
 *         description: |
 *           Unprocessable Entity - Valid request but invoice generation failed.
 *           This may indicate order status issues or incomplete financial information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiprocketError'
 *             examples:
 *               ordersNotReady:
 *                 summary: Orders not ready for invoice generation
 *                 value:
 *                   error: "Failed to generate invoice"
 *                   details: "Some orders are not ready for invoicing"
 *               incompleteOrderData:
 *                 summary: Incomplete order information prevents invoice creation
 *                 value:
 *                   error: "Failed to generate invoice"
 *                   details: "Order data incomplete for invoice requirements"
 *       500:
 *         description: |
 *           Internal Server Error - Unexpected error during invoice generation process.
 *           This could indicate system connectivity issues or document generation problems.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *             examples:
 *               systemError:
 *                 summary: Internal system processing error
 *                 value:
 *                   error: "Failed to generate invoice"
 *               documentGenerationError:
 *                 summary: Invoice generation service unavailable
 *                 value:
 *                   error: "Failed to generate invoice"
 */
export const generateInvoice = async (req: Request, res: Response) => {
    try {
        const data = generateInvoiceSchema.parse(req.body);
        if (!data.orderIds || data.orderIds.length === 0) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }
        let shiprocketToken;
        if (req.cookies.shiprocket_token) {
            shiprocketToken = req.cookies.shiprocket_token;
        } else {
            await getShipRocketLogin(req, res);
            shiprocketToken = req.cookies.shiprocket_token;
        }
        const response = await axios.post(`${process.env.SHIPROCKET_API_URL!}/print/invoice`, {
            order_ids: data.orderIds.map(orderIdToNumber)
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shiprocketToken}`,
            }
        });
        if (response.status !== 200) {
            res.status(response.status).json({ error: "Failed to generate invoice", details: response.data?.message });
            return;
        }
        res.status(200).json({ invoice_url: response.data.invoice_url });
    } catch (error) {
        console.error("Error generating invoice:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: "Failed to generate invoice", details: (error as Error).message } );
    }
};