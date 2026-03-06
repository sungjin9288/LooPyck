/**
 * Schema Definitions & Type Guards
 * Validation using Zod
 */

import { z } from 'zod';
import { ALLOWED_PRODUCT_SOURCES, ALLOWED_PRODUCT_STOCK_STATUSES } from '@/lib/api/types';

// Product Schema Validation
export const UnifiedProductSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number().nonnegative(),
    image: z.string().url(),
    link: z.string().url(),
    mallName: z.string(),
    brand: z.string().optional(),
    source: z.enum(ALLOWED_PRODUCT_SOURCES),
    category1: z.string().optional(),
    category2: z.string().optional(),
    shippingFee: z.number().nonnegative().optional(),
    shippingFreeThreshold: z.number().nonnegative().optional(),
    shippingText: z.string().optional(),
    benefitPrice: z.number().nonnegative().optional(),
    benefitText: z.string().optional(),
    stockStatus: z.enum(ALLOWED_PRODUCT_STOCK_STATUSES).optional(),
    stockText: z.string().optional(),
    optionSummary: z.string().optional(),
    optionValues: z.array(z.string()).optional(),
    sizeOptions: z.array(z.string()).optional(),
    colorOptions: z.array(z.string()).optional(),
    detailCollectedAt: z.string().optional(),
});

export type UnifiedProductSchemaType = z.infer<typeof UnifiedProductSchema>;

// Type Guard
export function isUnifiedProduct(data: unknown): data is UnifiedProductSchemaType {
    const result = UnifiedProductSchema.safeParse(data);
    return result.success;
}

// Prediction Result Schema (for API response validation)
export const PredictionResultSchema = z.object({
    slope: z.number(),
    intercept: z.number(),
    nextValue: z.number(),
    confidence: z.number().min(0).max(1),
    trend: z.enum(['UP', 'DOWN', 'FLAT']),
});
