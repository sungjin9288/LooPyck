import { z } from 'zod';
import { normalizeKeywordList } from './geminiJson.ts';

export interface StyleRecommendInput {
    gender: 'M' | 'F' | 'N';
    height: number;
    weight: number;
    preferredStyles: string[];
    budget: 'low' | 'mid' | 'high';
}

export interface StyleRecommendLook {
    lookName: string;
    description: string;
    keyItems: string[];
    reason: string;
}

export interface StyleRecommendResult {
    bodyNote: string;
    looks: StyleRecommendLook[];
}

const StyleRecommendLooseLookSchema = z.object({
    lookName: z.string().transform((value) => value.trim()).refine((value) => value.length > 0),
    description: z.string().transform((value) => value.trim()).refine((value) => value.length > 0),
    keyItems: z.array(z.string()).optional().default([]),
    reason: z.string().transform((value) => value.trim()).refine((value) => value.length > 0),
});

export const StyleRecommendLooseResponseSchema = z.object({
    looks: z.array(StyleRecommendLooseLookSchema).min(1).max(6),
    bodyNote: z.string().transform((value) => value.trim()).refine((value) => value.length > 0),
});

interface StyleTemplate {
    lookName: string;
    keyItems: string[];
    description: string;
    reason: string;
}

const STYLE_TEMPLATES: Record<string, StyleTemplate> = {
    캐주얼: {
        lookName: '데일리 캐주얼 룩',
        keyItems: ['오버핏 후드 집업', '스트레이트 데님 팬츠', '로우탑 스니커즈'],
        description: '기본 실루엣 중심으로 편하게 입기 좋고, 검색 결과에서도 대체 상품을 고르기 쉬운 조합입니다.',
        reason: '과한 포인트 없이 비율을 안정적으로 보여줘 데일리 활용도가 높습니다.',
    },
    미니멀: {
        lookName: '모던 미니멀 룩',
        keyItems: ['미니멀 블레이저', '세미와이드 슬랙스', '레더 로퍼'],
        description: '톤과 실루엣을 정리해서 깔끔하게 보이게 하고, 소재 차이로 완성도를 주는 구성입니다.',
        reason: '세로 실루엣을 살리기 좋아 체형이 정돈돼 보이는 인상을 만듭니다.',
    },
    스포티: {
        lookName: '시티 스포티 룩',
        keyItems: ['바람막이 자켓', '나일론 조거 팬츠', '러닝 스니커즈'],
        description: '기능성 아이템을 일상복처럼 섞어 입기 쉬운 구성으로, 활동성과 가벼운 레이어드가 장점입니다.',
        reason: '상하 비율을 유연하게 조절하기 좋아 활동적인 체형 보정에 잘 맞습니다.',
    },
    포멀: {
        lookName: '소프트 포멀 룩',
        keyItems: ['테일러드 자켓', '세미와이드 슬랙스', '미니멀 셔츠'],
        description: '딱딱하지 않은 포멀 톤으로 정리해 출근이나 약속 자리 모두 소화할 수 있는 방향입니다.',
        reason: '어깨선과 허리선이 정리돼 전체 균형을 안정적으로 보이게 합니다.',
    },
    빈티지: {
        lookName: '빈티지 믹스 룩',
        keyItems: ['워시드 데님 자켓', '프린트 티셔츠', '레트로 스니커즈'],
        description: '텍스처와 색감 차이로 분위기를 주면서도 실제 검색 가능한 아이템 위주로 맞춘 조합입니다.',
        reason: '레이어 차이를 활용해 체형 포인트를 자연스럽게 분산시킬 수 있습니다.',
    },
    스트리트: {
        lookName: '스트리트 레이어드 룩',
        keyItems: ['그래픽 후드', '와이드 카고 팬츠', '볼륨 스니커즈'],
        description: '실루엣 대비가 분명해 스타일 포인트가 살아나고, 검색 결과에서 대체 상품을 넓게 찾기 좋습니다.',
        reason: '볼륨감 있는 상하 조합이 비율을 보완하면서도 캐주얼한 존재감을 만듭니다.',
    },
    로맨틱: {
        lookName: '소프트 로맨틱 룩',
        keyItems: ['니트 가디건', '플리츠 스커트', '메리제인 슈즈'],
        description: '부드러운 소재와 곡선 실루엣을 중심으로 가볍게 포인트를 주는 구성입니다.',
        reason: '질감과 레이어 변화가 자연스러운 곡선을 만들어 체형을 부드럽게 보이게 합니다.',
    },
};

const DEFAULT_STYLE_ORDER = ['캐주얼', '미니멀', '스포티', '포멀', '스트리트', '빈티지', '로맨틱'];

function cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function clampText(value: string, max: number): string {
    const cleaned = cleanText(value);
    if (cleaned.length <= max) {
        return cleaned;
    }
    return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function buildBudgetNote(budget: StyleRecommendInput['budget']): string {
    if (budget === 'low') {
        return '예산 안에서 기본 아이템 위주로 맞추기 쉽습니다.';
    }
    if (budget === 'high') {
        return '아우터나 슈즈에서 소재 포인트를 주기 좋습니다.';
    }
    return '실루엣과 소재 균형을 맞춘 구성이 안정적입니다.';
}

function buildBodyNote({ height, weight }: StyleRecommendInput): string {
    const bmi = weight / (height / 100) ** 2;
    if (bmi < 19) {
        return '레이어와 볼륨감 있는 하의를 함께 쓰면 비율이 안정적으로 보입니다.';
    }
    if (bmi > 25) {
        return '세로 실루엣과 적당한 여유가 있는 핏을 쓰면 전체 비율이 더 정돈돼 보입니다.';
    }
    return '기본 실루엣을 유지하면서 길이와 허리선만 정리해도 체형 균형이 자연스럽게 살아납니다.';
}

function getTemplate(style: string): StyleTemplate {
    return STYLE_TEMPLATES[style] || STYLE_TEMPLATES.캐주얼;
}

export function buildStyleRecommendFallback(input: StyleRecommendInput): StyleRecommendResult {
    const selectedStyles = Array.from(
        new Set(
            [...input.preferredStyles, ...DEFAULT_STYLE_ORDER]
                .map((style) => cleanText(style))
                .filter((style) => style.length > 0)
        )
    ).slice(0, 3);

    const looks = selectedStyles.map((style) => {
        const template = getTemplate(style);
        return {
            lookName: clampText(template.lookName, 40),
            description: clampText(`${template.description} ${buildBudgetNote(input.budget)}`, 220),
            keyItems: normalizeKeywordList(template.keyItems, 3),
            reason: clampText(template.reason, 160),
        };
    });

    return {
        bodyNote: clampText(buildBodyNote(input), 140),
        looks,
    };
}

export function normalizeStyleRecommendResponse(
    payload: z.infer<typeof StyleRecommendLooseResponseSchema>
): StyleRecommendResult | null {
    const looks = payload.looks
        .map((look) => ({
            lookName: clampText(look.lookName, 40),
            description: clampText(look.description, 220),
            keyItems: normalizeKeywordList(look.keyItems, 3),
            reason: clampText(look.reason, 160),
        }))
        .filter((look) =>
            look.lookName.length > 0
            && look.description.length > 0
            && look.reason.length > 0
            && look.keyItems.length > 0
        )
        .slice(0, 3);

    if (looks.length < 2) {
        return null;
    }

    return {
        bodyNote: clampText(payload.bodyNote, 140),
        looks,
    };
}
