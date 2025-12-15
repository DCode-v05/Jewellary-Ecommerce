import { z } from "zod";

export const createRazorPayOrderSchema = z.object({
    orderId: z.string().min(1),
    amount: z.number().min(1),
    currency: z.string().min(1),
    receipt: z.string().min(1),
});

export const verifyRazorPayPaymentSchema = z.object({
    orderId: z.string().min(1),
    cartId: z.string().min(1).optional(),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    couponIds: z.array(z.object({
        id: z.string()
    })).optional()
});

export const generateInvoiceSchema = z.object({
    orderId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    amount: z.number().min(1),
    currency: z.string().min(1),
});

export const refundPaymentSchema = z.object({
    paymentId: z.string().min(1),
    amount: z.number().min(1),
});