import { z } from 'zod';

export const addressSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    address1: z.string().min(1, "Address line 1 is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip code is required"),
});

export const createOrderSchema = z.object({
    cartId: z.string().min(1, "Cart ID is required"),
    shippingAddress: addressSchema.optional(),
    billingAddress: addressSchema.optional(),
    isDefault: z.boolean(),
    items: z.array(z.object({
        productId: z.string().min(1, "Product ID is required"),
        variantId: z.string().optional(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
    })).nonempty("At least one item is required"),
    paymentMethod: z.enum(["COD", "CARD", "UPI", "NETBANKING"], {message: "Invalid payment method"}),
    totalAmount: z.number().min(0, "Total amount must be a positive number"),
    couponDiscount: z.number().min(0, "Total amount must be a positive number").optional(),
    deliveryCharge: z.number().min(0, "Total amount must be a positive number"),
    gstAmount: z.number().min(0, "Total amount must be a positive number"),
    additionalCharge: z.number().min(0, "Total amount must be a positive number").optional(),
    deliveryMethod: z.enum(["SHIPPING", "STORE"], {message: "Invalid delivery method"}),
    isGift: z.boolean().optional(),
    to: z.string().optional(),
    from: z.string().optional(),
    message: z.string().optional(),
    couponIds: z.array(z.object({
        id: z.string()
    })).optional(),
});

export const makePaymentFailedSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
});

export const getOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
});

export const updateAddressSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    shippingAddress: addressSchema,
});

export const cancelOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    cancelReason: z.string().min(1, "Cancel reason is required"),
});

export const updateOrderStatusSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    status: z.enum(["READY_FOR_PICKUP", "DELIVERED", "RETURNED"], {message: "Invalid status"}),
});