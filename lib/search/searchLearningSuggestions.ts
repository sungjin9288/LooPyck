import { z } from 'zod';
import { parseGeminiJson, normalizeKeywordList } from '../ai/geminiJson.ts';
import { analyzeFashionQuery, buildSourceAwareSearchPlan } from './fashionQueryAssistant.ts';
import type { SearchLearningEntry, SearchLearningSuggestion } from './queryLearningTypes.ts';
import {
    loadSearchLearningEntry,
} from './searchLearningEntryQueryStore.ts';
import { saveSearchLearningSuggestion } from './searchLearningEntryMutationStore.ts';
import { recordSearchLearningActivity } from './searchLearningActivityStore.ts';
import { uniqueOrdered } from './searchLearningEntryCodec.ts';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SearchLearningSuggestionSchema = z.object({
    normalizedQuery: z.string().trim().min(1).max(80),
    categoryHint: z.string().trim().max(60).nullable().optional().default(null),
    suggestedQueries: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
    rationale: z.string().trim().min(1).max(240),
});

export function buildFallbackSearchLearningSuggestion(
    entry: Pick<SearchLearningEntry, 'query' | 'suggestedQueries'>
): SearchLearningSuggestion {
    const analysis = analyzeFashionQuery(entry.query);
    const plan = buildSourceAwareSearchPlan(analysis);
    const suggestedQueries = uniqueOrdered([
        analysis.normalizedQuery,
        ...(plan.NAVER || []),
        ...analysis.suggestedQueries,
        ...entry.suggestedQueries,
    ]).slice(0, 12);

    return {
        normalizedQuery: analysis.normalizedQuery || entry.query,
        categoryHint: analysis.categorySignals[0] || null,
        suggestedQueries,
        rationale: analysis.categorySignals[0]
            ? `${analysis.categorySignals[0]} 카테고리를 기준으로 기본 키워드와 연관 검색어를 넓혔습니다.`
            : '원본 검색어를 유지하면서 결과 확보용 broad query를 추천합니다.',
        model: 'heuristic',
        generatedAt: new Date().toISOString(),
    };
}

export async function generateSearchLearningSuggestion(entry: SearchLearningEntry): Promise<SearchLearningSuggestion> {
    const fallback = buildFallbackSearchLearningSuggestion(entry);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return fallback;
    }

    const prompt = `
당신은 한국 패션 가격비교 서비스의 검색어 튜닝 어시스턴트입니다.
검색 결과가 약하거나 0건인 패션 검색어를 더 잘 검색되게 보정해야 합니다.

[원본 검색어]
${entry.query}

[현재 시스템 제안]
${entry.suggestedQueries.join(', ') || '없음'}

[출력 규칙]
- JSON만 반환
- suggestedQueries는 실제 패션 쇼핑몰에서 검색 가능한 구체적인 검색어만 포함
- 원본 검색어와 완전히 무관한 카테고리는 금지

{
  "normalizedQuery": "보정 검색어",
  "categoryHint": "대표 카테고리",
  "suggestedQueries": ["검색어1", "검색어2", "검색어3"],
  "rationale": "왜 이런 확장을 추천하는지 1문장"
}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                    maxOutputTokens: 400,
                },
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return fallback;
        }

        const data = await response.json() as unknown;
        const parsed = parseGeminiJson(data, SearchLearningSuggestionSchema);
        if (!parsed.ok) {
            return fallback;
        }

        return {
            normalizedQuery: parsed.data.normalizedQuery,
            categoryHint: parsed.data.categoryHint,
            suggestedQueries: uniqueOrdered(normalizeKeywordList(parsed.data.suggestedQueries, 8)),
            rationale: parsed.data.rationale,
            model: 'gemini',
            generatedAt: new Date().toISOString(),
        };
    } catch {
        return fallback;
    }
}

export async function generateSearchLearningSuggestions(
    entryIds: string[],
    options: { context?: string | null; actorUid?: string | null } = {}
): Promise<SearchLearningEntry[]> {
    const normalizedIds = uniqueOrdered(entryIds.map((entryId) => entryId.trim()).filter(Boolean)).slice(0, 12);
    if (normalizedIds.length === 0) {
        return [];
    }

    const updatedEntries = await Promise.all(
        normalizedIds.map(async (entryId) => {
            const entry = await loadSearchLearningEntry(entryId);
            if (!entry) {
                return null;
            }

            const suggestion = await generateSearchLearningSuggestion(entry);
            return await saveSearchLearningSuggestion(entryId, suggestion);
        })
    );

    const entries = updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
    if (entries.length > 0) {
        await recordSearchLearningActivity({
            type: 'generate_suggestions',
            context: options.context,
            actorUid: options.actorUid,
            entryIds: entries.map((entry) => entry.id),
            queries: entries.map((entry) => entry.query),
        });
    }

    return entries;
}
