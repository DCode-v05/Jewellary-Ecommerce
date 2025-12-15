import { z } from 'zod';

export const createUserActivityLogSchema = z.object({
    productId: z.string().uuid(),
    activityType: z.enum(['VIEW', 'CLICK', 'ADD_TO_CART', 'PURCHASE']),
});