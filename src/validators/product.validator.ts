import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number(),
  stock: z.number().int().min(0),
  metalType: z.string().min(1, "Metal type is required"),
  discountPct: z.number().optional(),
  discountTime: z.string().optional(),
  applyDiscountToVariants: z.boolean().optional(),
  weight: z.number().optional(),
  size: z.number().optional(),
  isActive: z.boolean().optional(),
  categoryName: z.string().min(1, "Category name is required"),
  tag: z.string().optional(),
  bannerHeading: z.string().optional(),
  bannerBody: z.string().optional(),
  images: z.array(z.object({
    altText: z.string().optional(),
  })).min(1, "At least one image is required"),
  variants: z.array(z.object({
    variantName: z.string(),
    stock: z.number(),
    size: z.number(),
    price: z.number(),
    altText: z.string().optional(),
  })).optional(),
});

export const updateProductSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().int().min(0).optional(),
  metalType: z.string().optional(),
  discountPct: z.number().optional(),
  discountTime: z.string().optional(),
  applyDiscountToVariants: z.boolean().optional(),
  weight: z.number().optional(),
  size: z.number().optional(),
  newCategoryName: z.string().optional(),
  tag: z.string().optional(),
  isActive: z.boolean().optional(),
  bannerHeading: z.string().optional(),
  bannerBody: z.string().optional(),
  images: z.array(z.object({
    id: z.string().min(1, "Image ID is required"),
    altText: z.string().optional(),
  })).optional(),
  variants: z.array(z.object({
    id: z.string().min(1, "Variant ID is required"),
    variantName: z.string().optional(),
    stock: z.number().min(0).optional(),
    price: z.number().optional(),
    size: z.number().optional(),
    altText: z.string().optional(),
  })).optional(),
  productImages: z.array(z.object({
    id: z.string().min(1, "Image ID is required"),
    fileName: z.string().min(1, "File name is required"),
  })).optional(),
  variantImages: z.array(z.object({
    id: z.string().min(1, "Image ID is required"),
    fileName: z.string().min(1, "File name is required"),
  })).optional(),
  newProductImages: z.array(z.object({
    fileName: z.string().min(1, "File name is required"),
    altText: z.string().optional(),
  })).optional(),
  deleteProductImages: z.array(z.object({
    id: z.string().min(1, "Image ID is required"),
  })).optional(),
  newVariants: z.array(z.object({
    variantName: z.string(),
    stock: z.number().min(0),
    price: z.number(),
    size: z.number(),
    altText: z.string().optional(),
    fileName: z.string().optional()
  })).optional(),
  deleteVariants: z.array(z.object({
    id: z.string().min(1, "Variant ID is required"),
  })).optional(),
});

export const getProductBySlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const deleteProductByNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});