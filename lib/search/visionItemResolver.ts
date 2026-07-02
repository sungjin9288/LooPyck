import { analyzeFashionQuery } from './fashionQueryAssistant.ts';
import type { VisionItem, VisionItemCategory } from '../ai/visionItemNormalizer.ts';

export interface ResolvedVisionItem {
    category: VisionItemCategory;
    label: string;
    query: string;
}

export interface ResolvedVisionItemGroup {
    category: VisionItemCategory;
    items: ResolvedVisionItem[];
}

function resolveSingleItem(item: VisionItem): ResolvedVisionItem | null {
    for (const keyword of item.searchKeywords) {
        const analysis = analyzeFashionQuery(keyword);
        if (analysis.allowed) {
            return { category: item.category, label: item.label, query: analysis.normalizedQuery };
        }
    }

    const labelAnalysis = analyzeFashionQuery(item.label);
    if (labelAnalysis.allowed) {
        return { category: item.category, label: item.label, query: labelAnalysis.normalizedQuery };
    }

    return null;
}

export function resolveItemQueries(items: VisionItem[]): ResolvedVisionItem[] {
    const seenQueries = new Set<string>();
    const resolved: ResolvedVisionItem[] = [];

    for (const item of items) {
        const candidate = resolveSingleItem(item);
        if (!candidate || seenQueries.has(candidate.query)) {
            continue;
        }

        seenQueries.add(candidate.query);
        resolved.push(candidate);
    }

    return resolved;
}

export function groupResolvedItems(resolved: ResolvedVisionItem[]): ResolvedVisionItemGroup[] {
    const order: VisionItemCategory[] = [];
    const groups = new Map<VisionItemCategory, ResolvedVisionItem[]>();

    for (const item of resolved) {
        if (!groups.has(item.category)) {
            groups.set(item.category, []);
            order.push(item.category);
        }
        groups.get(item.category)?.push(item);
    }

    return order.map((category) => ({ category, items: groups.get(category) ?? [] }));
}
