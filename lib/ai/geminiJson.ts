import { z } from 'zod';

interface GeminiPayload {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
}

function unwrapCodeFence(text: string): string {
    const trimmed = text.trim();
    const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (match?.[1]) {
        return match[1].trim();
    }
    return trimmed;
}

export function extractGeminiText(payload: unknown): string | null {
    const typed = payload as GeminiPayload;
    const text = typed?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
        return null;
    }
    const cleaned = unwrapCodeFence(text);
    return cleaned.length > 0 ? cleaned : null;
}

type ParseResult<T> =
    | { ok: true; data: T; rawText: string }
    | { ok: false; error: string; rawText?: string };

export function parseGeminiJson<T>(
    payload: unknown,
    schema: z.ZodType<T>
): ParseResult<T> {
    const rawText = extractGeminiText(payload);
    if (!rawText) {
        return { ok: false, error: 'Gemini response text is empty' };
    }

    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(rawText);
    } catch {
        return { ok: false, error: 'Gemini JSON parse failed', rawText };
    }

    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
        return { ok: false, error: 'Gemini JSON schema validation failed', rawText };
    }

    return { ok: true, data: validated.data, rawText };
}

export function normalizeKeywordList(keywords: unknown, max: number = 3): string[] {
    if (!Array.isArray(keywords)) {
        return [];
    }

    return Array.from(
        new Set(
            keywords
                .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
                .filter((keyword) => keyword.length > 0)
        )
    ).slice(0, max);
}
