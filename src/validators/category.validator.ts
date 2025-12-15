import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  altText: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1),
  newName: z.string().optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
});

export const getCategoryNameSchema = z.object({
  name: z.string().min(1),
});

export const deleteCategorySchema = z.object({
  name: z.string().min(1),
});