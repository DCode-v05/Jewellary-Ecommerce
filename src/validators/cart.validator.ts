import { z } from "zod";

export const createCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().min(1).optional(),
});

export const updateCartSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().min(1).optional(),
});

export const deleteCartSchema = z.object({
  cartItemId: z.string().min(1),
});