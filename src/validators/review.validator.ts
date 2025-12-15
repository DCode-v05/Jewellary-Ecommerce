import { z } from "zod";

export const createReviewSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, "Comment is required"),
    headline: z.string().min(1, "Headline is required"),
    media: z.array(z.object({
        mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
    })).optional(),
    expectationMet: z.enum(["DID_NOT_MEET", "ALMOST_MET", "MET", "EXCEEDED", "GREATLY_EXCEEDED"]).optional(),
    wouldRecommend: z.boolean().optional(),
    firstDiscover: z.string().optional(),
});

export const getReviewByProductIdSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
});

export const updateReviewSchema = z.object({
    reviewId: z.string().min(1, "Review ID is required"),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(1, "Comment is required").optional(),
    headline: z.string().min(1, "Headline is required").optional(),
    createMedia: z.array(z.object({
        mediaType: z.enum(["IMAGE", "VIDEO"]),
        fileName: z.string(),
    })).optional(),
    updateMedia: z.array(z.object({
        id: z.string(),
        mediaType: z.enum(["IMAGE", "VIDEO"]),
        fileName: z.string(),
    })).optional(),
    deleteMedia: z.array(z.object({
        id: z.string(),
    })).optional(),
    expectationMet: z.enum(["DID_NOT_MEET", "ALMOST_MET", "MET", "EXCEEDED", "GREATLY_EXCEEDED"]).optional(),
    wouldRecommend: z.boolean().optional(),
    firstDiscover: z.string().optional(),
});

export const deleteReviewSchema = z.object({
    id: z.string().min(1, "Review ID is required"),
});