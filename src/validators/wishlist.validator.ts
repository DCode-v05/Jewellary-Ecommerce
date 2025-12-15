import { z } from "zod";

export const createWishlistSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
});

export const deleteWishlistSchema = z.object({
  wishlistItemId: z.string().min(1)
});