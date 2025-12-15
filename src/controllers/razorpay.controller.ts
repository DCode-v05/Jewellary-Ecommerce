import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import Razorpay from "razorpay";
import { createRazorPayOrderSchema, generateInvoiceSchema, refundPaymentSchema, verifyRazorPayPaymentSchema } from "../validators/razorpay.validator";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { getUserId } from "../utils/getUserId";

/**
 * @swagger
 * tags:
 *   name: Razorpay
 *   description: Payment processing APIs using Razorpay integration for order payments, verification, invoicing, and refunds
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing what went wrong
 *         detail:
 *           type: string
 *           description: Additional error details
 *     RazorpayOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Razorpay order ID
 *           example: "order_9A33XWu170gUtm"
 *         entity:
 *           type: string
 *           example: "order"
 *         amount:
 *           type: integer
 *           description: Order amount in smallest currency unit (paise for INR)
 *           example: 50000
 *         amount_paid:
 *           type: integer
 *           example: 0
 *         amount_due:
 *           type: integer
 *           example: 50000
 *         currency:
 *           type: string
 *           example: "INR"
 *         receipt:
 *           type: string
 *           description: Order receipt ID (your internal order ID)
 *           example: "SUV-23010112000045"
 *         status:
 *           type: string
 *           example: "created"
 *         attempts:
 *           type: integer
 *           example: 0
 *         created_at:
 *           type: integer
 *           description: Unix timestamp
 *           example: 1698765432
 *     RazorpayInvoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Razorpay invoice ID
 *           example: "inv_9A33XWu170gUtm"
 *         entity:
 *           type: string
 *           example: "invoice"
 *         receipt:
 *           type: string
 *           nullable: true
 *         invoice_number:
 *           type: string
 *           example: "INV001"
 *         customer_id:
 *           type: string
 *           example: "cust_9A33XWu170gUtm"
 *         customer_details:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             contact:
 *               type: string
 *         order_id:
 *           type: string
 *           nullable: true
 *         line_items:
 *           type: array
 *           items:
 *             type: object
 *         payment_id:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           example: "issued"
 *         expire_by:
 *           type: integer
 *           nullable: true
 *         issued_at:
 *           type: integer
 *         paid_at:
 *           type: integer
 *           nullable: true
 *         cancelled_at:
 *           type: integer
 *           nullable: true
 *         expired_at:
 *           type: integer
 *           nullable: true
 *         sms_status:
 *           type: string
 *           example: "sent"
 *         email_status:
 *           type: string
 *           example: "sent"
 *         amount:
 *           type: integer
 *         amount_paid:
 *           type: integer
 *         amount_due:
 *           type: integer
 *         currency:
 *           type: string
 *         short_url:
 *           type: string
 *           description: Payment link URL
 *     RazorpayRefund:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Razorpay refund ID
 *           example: "rfnd_9A33XWu170gUtm"
 *         entity:
 *           type: string
 *           example: "refund"
 *         amount:
 *           type: integer
 *           description: Refund amount in smallest currency unit
 *           example: 50000
 *         currency:
 *           type: string
 *           example: "INR"
 *         payment_id:
 *           type: string
 *           example: "pay_9A33XWu170gUtm"
 *         receipt:
 *           type: string
 *           nullable: true
 *         acquirer_data:
 *           type: object
 *         created_at:
 *           type: integer
 *         batch_id:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           example: "processed"
 *         speed_processed:
 *           type: string
 *           example: "normal"
 */

export const getRazorPayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
}

export const createRazorPayOrderFromOrder = async (amount: number, currency: string, orderId: string) => {
    try {

        const razorpayInstance = getRazorPayInstance();

        const options = {
            amount: Math.round(amount * 100),
            currency: currency,
            receipt: orderId,
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PaymentStatus.FAILED,
                },
            });
            await prisma.orderItem.deleteMany({
                where: { orderId: orderId },
            });
            await prisma.order.delete({
                where: { id: orderId },
            });
            throw new Error("Failed to create order");
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { 
                paymentId: order.id,
                paymentStatus: PaymentStatus.PENDING,
            },
        });
        return order;
    } catch (error) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: PaymentStatus.FAILED,
            },
        });
        await prisma.orderItem.deleteMany({
            where: { orderId: orderId },
        });
        await prisma.order.delete({
            where: { id: orderId },
        });
        throw new Error(JSON.stringify(error, null, 2));
    }
};

/**
 * @swagger
 * /api/razorpay/create-order:
 *   post:
 *     summary: Create a new Razorpay order for payment processing
 *     description: |
 *       Creates a new payment order in Razorpay and updates the order status in the database.
 *       This endpoint is used to initiate the payment process for an existing order.
 *       - Validates the request data including orderId, amount, and currency
 *       - Creates a Razorpay order with the specified parameters
 *       - Updates the order in the database with the Razorpay payment ID
 *       - Sets the order status to PENDING
 *     tags: [Razorpay]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 minLength: 1
 *                 description: The unique identifier of the order to create payment for
 *                 example: "SUV-23010112000045"
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: Order amount in rupees (will be converted to paise)
 *                 example: 500.00
 *               currency:
 *                 type: string
 *                 minLength: 1
 *                 description: Currency code for the payment
 *                 example: "INR"
 *             required:
 *               - orderId
 *               - amount
 *               - currency
 *           examples:
 *             createOrder:
 *               summary: Create payment order
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 amount: 500.00
 *                 currency: "INR"
 *     responses:
 *       201:
 *         description: Razorpay order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RazorpayOrder'
 *             example:
 *               id: "order_9A33XWu170gUtm"
 *               entity: "order"
 *               amount: 50000
 *               amount_paid: 0
 *               amount_due: 50000
 *               currency: "INR"
 *               receipt: "SUV-23010112000045"
 *               status: "created"
 *               attempts: 0
 *               created_at: 1698765432
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid request data"
 *       500:
 *         description: Internal server error or failed to create order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               createFailed:
 *                 summary: Order creation failed
 *                 value:
 *                   error: "Failed to create order"
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   error: "Internal server error"
 *                   detail: "Database connection failed"
 */
export const createRazorPayOrder = async (req: Request, res: Response) => {
    try {
        const data = createRazorPayOrderSchema.parse(req.body);
        if (!data) {
            res.status(400).json({ error: "Invalid request data" });
            return;
        }

        const razorpayInstance = getRazorPayInstance();

        const options = {
            amount: data.amount * 100,
            currency: data.currency,
            receipt: data.orderId,
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            await prisma.order.update({
            where: { id: data.orderId },
            data: {
                paymentStatus: PaymentStatus.FAILED
            },
        });
            res.status(500).json({ error: "Failed to create order" });
            return;
        }
        await prisma.order.update({
            where: { id: data.orderId },
            data: { 
                paymentStatus: PaymentStatus.PENDING
            },
        });
        res.status(201).json(order);
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        
        const orderId = req.body?.orderId;
        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PaymentStatus.FAILED
                },
            });
        }
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : JSON.stringify(error) });
    }
};

/**
 * @swagger
 * /api/razorpay/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment signature
 *     description: |
 *       Verifies the authenticity of a Razorpay payment using the provided signature.
 *       This endpoint ensures that the payment was actually processed by Razorpay and not tampered with.
 *       - Validates the payment signature using HMAC SHA256
 *       - Compares the generated signature with the provided signature
 *       - Returns success only if signatures match
 *     tags: [Razorpay]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 minLength: 1
 *                 description: Internal order ID
 *                 example: "SUV-23010112000045"
 *               cartId:
 *                 type: string
 *                 minLength: 1
 *                 description: Cart ID (optional, will be cleared after successful payment)
 *                 example: "cart_9A33XWu170gUtm"
 *               razorpayOrderId:
 *                 type: string
 *                 minLength: 1
 *                 description: Razorpay order ID
 *                 example: "order_9A33XWu170gUtm"
 *               razorpayPaymentId:
 *                 type: string
 *                 minLength: 1
 *                 description: Razorpay payment ID
 *                 example: "pay_9A33XWu170gUtm"
 *               razorpaySignature:
 *                 type: string
 *                 minLength: 1
 *                 description: Razorpay payment signature for verification
 *                 example: "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
 *             required:
 *               - orderId
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *           examples:
 *             verifyPayment:
 *               summary: Verify payment signature
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 cartId: "cart_9A33XWu170gUtm"
 *                 razorpayOrderId: "order_9A33XWu170gUtm"
 *                 razorpayPaymentId: "pay_9A33XWu170gUtm"
 *                 razorpaySignature: "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
 *     responses:
 *       200:
 *         description: Payment signature verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
 *       400:
 *         description: Invalid request data or invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidData:
 *                 summary: Invalid request data
 *                 value:
 *                   error: "Invalid request data"
 *               invalidSignature:
 *                 summary: Invalid signature
 *                 value:
 *                   error: "Invalid signature"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *               detail: "Signature verification failed"
 */
export const verifyRazorPayPayment = async (req: Request, res: Response) => {
    try {
        const data = verifyRazorPayPaymentSchema.parse(req.body);
        if(!data) {
            res.status(400).json({ error: "Invalid request data" });
            return;
        }
        let userId = null;
        if (req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const orders = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
                orderItems: true,
            }
        });
        if (!orders) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        const sign = data.razorpayOrderId + "|" + data.razorpayPaymentId;
        const expectedSign = crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET!).update(sign.toString()).digest('hex');
        if (expectedSign !== data.razorpaySignature) {
            await prisma.order.update({
                where: { id: orders.id },
                data: {
                    paymentId: null,
                    paymentStatus: PaymentStatus.FAILED
                }
            })
            res.status(400).json({ error: "Invalid signature" });
            return;
        }
        
        if (orders.orderItems.length > 0) {
            for (const item of orders.orderItems) {
                if (item.variantId){
                const variant = await prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                });
                if (!variant) {
                    res.status(404).json({ error: "Variant not found" });
                    return;
                }
                await prisma.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: variant.stock - item.quantity,
                    },
                });
            } 
            else {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    res.status(404).json({ error: "Product not found" });
                    return;
                }
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: product.stock - item.quantity,
                        },
                    });
                }
            }
        }
        if (data.couponIds && data.couponIds.length > 0) {
            for(const coupon of data.couponIds) {
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
        if (data.cartId) {
            const carts = await prisma.cart.findUnique({
                where: { id: data.cartId },
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
        }
        await prisma.order.update({
            where: { id: data.orderId },
            data: { 
                paymentId: data.razorpayPaymentId,
                paymentStatus: PaymentStatus.SUCCESS
            },
        });
        res.status(200).json({ message: "Payment verified successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @swagger
 * /api/razorpay/generate-invoice:
 *   post:
 *     summary: Generate a payment invoice link
 *     description: |
 *       Creates a payment invoice with Razorpay that can be sent to customers via email or SMS.
 *       This endpoint generates a payment link that customers can use to complete payment.
 *       - Creates an invoice with customer details and order information
 *       - Automatically sends notifications via email and SMS
 *       - Returns a payment link URL for the customer
 *     tags: [Razorpay]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 minLength: 1
 *                 description: The unique identifier of the order
 *                 example: "SUV-23010112000045"
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Customer's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 minLength: 1
 *                 description: Customer's phone number
 *                 example: "9876543210"
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: Invoice amount in rupees
 *                 example: 500.00
 *               currency:
 *                 type: string
 *                 minLength: 1
 *                 description: Currency code
 *                 example: "INR"
 *             required:
 *               - orderId
 *               - name
 *               - email
 *               - phone
 *               - amount
 *               - currency
 *           examples:
 *             generateInvoice:
 *               summary: Generate payment invoice
 *               value:
 *                 orderId: "SUV-23010112000045"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 phone: "9876543210"
 *                 amount: 500.00
 *                 currency: "INR"
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RazorpayInvoice'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid request data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *               detail: "Failed to create invoice"
 */
export const generateInvoice = async (req: Request, res: Response) => {
    try {
        const data = generateInvoiceSchema.parse(req.body);
        if (!data) {
            res.status(400).json({ error: "Invalid request data" });
            return;
        }
        
        const razorpayInstance = getRazorPayInstance();
        const invoice = await razorpayInstance.invoices.create({
            type: "link",
            customer: {
                name: data.name,
                contact: data.phone,
                email: data.email,
            },
            line_items: [
                {
                    name: "Order " + data.orderId,
                    amount: data.amount * 100,
                    currency: data.currency,
                    quantity: 1,
                },
            ],
            email_notify: true,
            sms_notify: true,
        });
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({
        error: "Internal server error",
        detail: (error && typeof error === "object" && "error" in error && typeof (error as unknown) === "object" && (error as { error?: { description?: string } }).error?.description)
        || (error instanceof Error ? error.message : "")
        || JSON.stringify(error, null, 2),
    });
    }
};

/**
 * @swagger
 * /api/razorpay/transactions:
 *   get:
 *     summary: Get all payment transactions
 *     description: |
 *       Retrieves all payment transactions from Razorpay. This endpoint is typically used
 *       for administrative purposes to view transaction history and payment details.
 *       - Fetches all payment records from Razorpay
 *       - Returns comprehensive transaction data
 *       - Useful for reconciliation and reporting
 *     tags: [Razorpay]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entity:
 *                   type: string
 *                   example: "collection"
 *                 count:
 *                   type: integer
 *                   description: Number of transactions returned
 *                   example: 10
 *                 items:
 *                   type: array
 *                   description: Array of payment transactions
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "pay_9A33XWu170gUtm"
 *                       entity:
 *                         type: string
 *                         example: "payment"
 *                       amount:
 *                         type: integer
 *                         example: 50000
 *                       currency:
 *                         type: string
 *                         example: "INR"
 *                       status:
 *                         type: string
 *                         example: "captured"
 *                       order_id:
 *                         type: string
 *                         example: "order_9A33XWu170gUtm"
 *                       invoice_id:
 *                         type: string
 *                         nullable: true
 *                       international:
 *                         type: boolean
 *                         example: false
 *                       method:
 *                         type: string
 *                         example: "card"
 *                       amount_refunded:
 *                         type: integer
 *                         example: 0
 *                       refund_status:
 *                         type: string
 *                         nullable: true
 *                       captured:
 *                         type: boolean
 *                         example: true
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       card_id:
 *                         type: string
 *                         nullable: true
 *                       bank:
 *                         type: string
 *                         nullable: true
 *                       wallet:
 *                         type: string
 *                         nullable: true
 *                       vpa:
 *                         type: string
 *                         nullable: true
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       contact:
 *                         type: string
 *                         example: "+919876543210"
 *                       notes:
 *                         type: object
 *                       fee:
 *                         type: integer
 *                         example: 1180
 *                       tax:
 *                         type: integer
 *                         example: 180
 *                       error_code:
 *                         type: string
 *                         nullable: true
 *                       error_description:
 *                         type: string
 *                         nullable: true
 *                       error_source:
 *                         type: string
 *                         nullable: true
 *                       error_step:
 *                         type: string
 *                         nullable: true
 *                       error_reason:
 *                         type: string
 *                         nullable: true
 *                       acquirer_data:
 *                         type: object
 *                       created_at:
 *                         type: integer
 *                         example: 1698765432
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *               detail: "Failed to fetch transactions"
 */
export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const razorpayInstance = getRazorPayInstance();
        const payments = await razorpayInstance.payments.all();
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @swagger
 * /api/razorpay/refund:
 *   post:
 *     summary: Process payment refund
 *     description: |
 *       Initiates a refund for a specific payment through Razorpay. This endpoint can be used
 *       for full or partial refunds of captured payments.
 *       - Validates the payment ID and refund amount
 *       - Processes the refund through Razorpay
 *       - Returns refund details and status
 *     tags: [Razorpay]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *                 minLength: 1
 *                 description: Razorpay payment ID to refund
 *                 example: "pay_9A33XWu170gUtm"
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: Refund amount in rupees (partial refund) or omit for full refund
 *                 example: 250.00
 *             required:
 *               - paymentId
 *               - amount
 *           examples:
 *             fullRefund:
 *               summary: Full refund
 *               value:
 *                 paymentId: "pay_9A33XWu170gUtm"
 *                 amount: 500.00
 *             partialRefund:
 *               summary: Partial refund
 *               value:
 *                 paymentId: "pay_9A33XWu170gUtm"
 *                 amount: 250.00
 *     responses:
 *       201:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RazorpayRefund'
 *             example:
 *               id: "rfnd_9A33XWu170gUtm"
 *               entity: "refund"
 *               amount: 25000
 *               currency: "INR"
 *               payment_id: "pay_9A33XWu170gUtm"
 *               receipt: null
 *               acquirer_data:
 *                 arn: "10000000000000"
 *               created_at: 1698765432
 *               batch_id: null
 *               status: "processed"
 *               speed_processed: "normal"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid request data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *               detail: "Refund processing failed"
 */
export const refundPayment = async (req: Request, res: Response) => {
    try {
        const data = refundPaymentSchema.parse(req.body);
        if (!data) {
            res.status(400).json({ error: "Invalid request data" });
            return;
        }
        const razorpayInstance = getRazorPayInstance();
        const refund = await razorpayInstance.payments.refund(data.paymentId, {
            amount: data.amount,
        });
        await prisma.order.updateMany({
            where: { paymentId: data.paymentId },
            data: { 
                paymentStatus: PaymentStatus.REFUNDED ,
                amountRefunded: data.amount,
            },
        });
        res.status(201).json(refund);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : String(error) });
    }
};