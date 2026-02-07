/**
 * Schema Definitions & Type Guards
 * Validation using Zod
 */

import { z } from 'zod';

// Product Schema Validation
export const UnifiedProductSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number().nonnegative(),
    image: z.string().url(),
    link: z.string().url(),
    mallName: z.string(),
    brand: z.string().optional(),
    source: z.enum(['NAVER', 'MUSINSA', '29CM', 'W_CONCEPT', 'ZIGZAG']).or(z.string()),
    category1: z.string().optional(),
    category2: z.string().optional(),
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
