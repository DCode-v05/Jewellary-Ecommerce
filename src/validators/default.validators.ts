import { z } from "zod";

export const createHeroBannerSchema = z.object({
    altText: z.string().max(100).optional(),
    bannerHeading: z.string().max(100).optional(),
    bannerBody: z.string().max(500).optional()
});

export const updateHeroBannerSchema = z.object({
    id: z.string().uuid(),
    altText: z.string().max(100).optional(),
    bannerHeading: z.string().max(100).optional(),
    bannerBody: z.string().max(500).optional()
});

export const deleteHeroBannerSchema = z.object({
    id: z.string().uuid()
});

export const createFlashSaleSchema = z.object({
    altText1: z.string().max(100).optional(),
    altText2: z.string().max(100).optional(),
    altText3: z.string().max(100).optional(),
    altText4: z.string().max(100).optional(),
    body: z.string().max(500),
    discountPct: z.string().min(1, "Discount percentage is required")
});

export const updateFlashSaleSchema = z.object({
    id: z.string().uuid(),
    altText1: z.string().max(100).optional(),
    altText2: z.string().max(100).optional(),
    altText3: z.string().max(100).optional(),
    altText4: z.string().max(100).optional(),
    body: z.string().max(500).optional(),
    discountPct: z.string().min(1).optional()
});

export const deleteFlashSaleSchema = z.object({
    id: z.string().uuid()
});

export const createBannerSchema = z.object({
    altText: z.string().max(100).optional(),
    body: z.string().max(500)
});

export const updateBannerSchema = z.object({
    id: z.string().uuid(),
    altText: z.string().max(100).optional(),
    body: z.string().max(500).optional()
});

export const deleteBannerSchema = z.object({
    id: z.string().uuid()
});

export const createTrendingNowSchema = z.object({
    altText: z.string().max(100).optional(),
});

export const updateTrendingNowSchema = z.object({
    id: z.string().uuid(),
    altText: z.string().max(100).optional(),
});

export const deleteTrendingNowSchema = z.object({
    id: z.string().uuid()
});

export const createShopImageSchema = z.object({
    altText: z.string().max(100).optional(),
    heading: z.string().max(100).optional(),
    body: z.string().max(500).optional()
});

export const updateShopImageSchema = z.object({
    id: z.string().uuid(),
    altText: z.string().max(100).optional(),
    heading: z.string().max(100).optional(),
    body: z.string().max(500).optional()
});

export const deleteShopImageSchema = z.object({
    id: z.string().uuid()
});