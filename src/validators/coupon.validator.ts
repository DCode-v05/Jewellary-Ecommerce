import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountPct: z.number().min(0, "Discount percentage must be positive").max(100, "Discount percentage must not exceed 100"),
  isActive: z.boolean(),
  minPurchaseAmount: z.number().min(0, "Minimum purchase amount must be positive").optional(),
  maxUsage: z.number().min(1, "Maximum usage must be at least 1").optional(),
  appliesToAllProducts: z.boolean().optional(),
  isFirstTimeUserOnly: z.boolean().optional(),
  maxUsagePerUser: z.number().min(1, "Maximum usage per user must be at least 1").optional(),
  startDate: z.string(),
  endDate: z.string(),
  userIds: z.array(z.string().uuid()).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional()
});

export const updateCouponSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, "Code is required").optional(),
  discountPct: z.number().min(0, "Discount percentage must be positive").max(100, "Discount percentage must not exceed 100").optional(),
  isActive: z.boolean().optional(),
  minPurchaseAmount: z.number().min(0, "Minimum purchase amount must be positive").optional(),
  maxUsage: z.number().min(1, "Maximum usage must be at least 1").optional(),
  appliesToAllProducts: z.boolean().optional(),
  isFirstTimeUserOnly: z.boolean().optional(),
  maxUsagePerUser: z.number().min(1, "Maximum usage per user must be at least 1").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userIds: z.array(z.string().uuid()).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional()
});

export const deleteCouponSchema = z.object({
  id: z.string().uuid(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  productIds: z.array(z.string().uuid())
});