'use client';

import React from 'react';
import { useCompareShortlist } from '@/hooks/useCompareShortlist';
import { buildFavoriteDocId } from '@/lib/favorites/favoriteProduct';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import {
    CompareShortlistItemCard,
    CompareShortlistSectionHeader,
} from '@/components/product/compareWorkflowSections';

export default function CompareShortlistSection() {
    const { shortlist, clearShortlist, removeFromShortlist } = useCompareShortlist();

    if (shortlist.length === 0) {
        return null;
    }

    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-sm">
            <CompareShortlistSectionHeader
                count={shortlist.length}
                onClear={clearShortlist}
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {shortlist.map((item) => {
                    const internalHref = typeof item.deepLink === 'string' && item.deepLink.startsWith('/') ? item.deepLink : null;
                    const externalHref = sanitizeExternalUrl(item.link);
                    const href = internalHref || externalHref || '#';

                    return (
                        <CompareShortlistItemCard
                            key={buildFavoriteDocId(item)}
                            image={item.image}
                            title={item.title}
                            mallName={item.mallName}
                            source={item.source}
                            variantLabel={item.variantLabel}
                            priceLabel={`${(Number.parseInt(item.lprice, 10) || 0).toLocaleString()}원`}
                            href={href}
                            internalHref={Boolean(internalHref)}
                            externalHref={Boolean(externalHref)}
                            onRemove={() => removeFromShortlist(item)}
                        />
                    );
                })}
            </div>
        </section>
    );
}
