import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UnifiedProductSchema } from '@/lib/types/schema';
import { enrichProductsWithPdpDetails } from '@/lib/server/pdpDetailService';

const EnrichmentRequestSchema = z.object({
    products: z.array(UnifiedProductSchema).min(1).max(8),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const parsed = EnrichmentRequestSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
                { status: 400 }
            );
        }

        const products = await enrichProductsWithPdpDetails(parsed.data.products);
        return NextResponse.json({ products });
    } catch (error) {
        console.error('[product-detail-enrichment] request failed:', error);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
