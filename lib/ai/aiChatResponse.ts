import { z } from 'zod';

import { normalizeKeywordList, parseGeminiJson } from './geminiJson.ts';
import type { AiChatResult } from './aiChatFallback.ts';

const ChatResponseSchema = z.object({
    text: z.string().trim().min(1).max(800),
    searchKeywords: z.array(z.string().trim().min(1).max(40)).max(5).optional().default([]),
});

export type AiChatGeminiResponseResult =
    | { ok: true; data: AiChatResult }
    | { ok: false; error: string };

export function parseAiChatGeminiResponse(payload: unknown): AiChatGeminiResponseResult {
    const parsed = parseGeminiJson(payload, ChatResponseSchema);
    if (parsed.ok === false) {
        return { ok: false, error: parsed.error };
    }

    return {
        ok: true,
        data: {
            text: parsed.data.text,
            searchKeywords: normalizeKeywordList(parsed.data.searchKeywords, 3),
            responseSource: 'ai',
        },
    };
}
