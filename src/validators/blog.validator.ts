import { z } from "zod";

export const createBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
});

export const updateBlogPostSchema = z.object({
    id: z.string().uuid("Invalid blog post ID"),
    title: z.string().min(1, "Title is required").optional(),
    content: z.string().min(1, "Content is required").optional(),
});

export const deleteBlogPostSchema = z.object({
    id: z.string().uuid("Invalid blog post ID"),
});