import { normalizeKeywordList } from './geminiJson.ts';

export const VISION_ITEM_CATEGORIES = [
    '상의',
    '하의',
    '아우터',
    '원피스',
    '신발',
    '가방',
    '모자',
    '액세서리',
    '기타',
] as const;

export type VisionItemCategory = typeof VISION_ITEM_CATEGORIES[number];

export interface VisionItemInput {
    category?: VisionItemCategory;
    label: string;
    description: string;
    searchKeywords?: unknown;
}

export interface VisionItem {
    category: VisionItemCategory;
    label: string;
    description: string;
    searchKeywords: string[];
}

export interface VisionAnalysisResult {
    summary: string;
    items: VisionItem[];
    description: string;
    searchKeywords: string[];
}

export function shapeVisionResponse(parsed: { summary: string; items: VisionItemInput[] }): VisionAnalysisResult {
    const items: VisionItem[] = parsed.items
        .slice(0, 4)
        .map((item) => ({
            category: item.category ?? '기타',
            label: item.label.trim(),
            description: item.description.trim(),
            searchKeywords: normalizeKeywordList(item.searchKeywords, 3),
        }))
        .filter((item) => item.searchKeywords.length > 0);

    return {
        summary: parsed.summary.trim(),
        items,
        description: parsed.summary.trim(),
        searchKeywords: items[0]?.searchKeywords ?? [],
    };
}
