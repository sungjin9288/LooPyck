export type AiChatLocale = 'ko' | 'en';
export type AiChatResponseSource = 'ai' | 'fallback';

export interface AiChatResult {
    text: string;
    searchKeywords: string[];
    responseSource: AiChatResponseSource;
}

type ChatFallbackIntent = 'old_money' | 'spring' | 'summer' | 'winter' | 'date' | 'work' | 'tall' | 'default';

type ChatFallbackCopy = Omit<AiChatResult, 'responseSource'>;

const FALLBACK_COPY: Record<AiChatLocale, Record<ChatFallbackIntent, ChatFallbackCopy>> = {
    ko: {
        old_money: {
            text: '올드머니 무드는 로고보다 소재와 핏을 정돈하는 것이 핵심입니다. 케이블 니트 또는 옥스퍼드 셔츠에 투턱 슬랙스를 매치하고 브라운 로퍼로 마무리해보세요. 아이보리, 네이비, 브라운처럼 채도가 낮은 색을 중심으로 고르면 안정적입니다.',
            searchKeywords: ['케이블 니트', '투턱 슬랙스', '브라운 로퍼'],
        },
        spring: {
            text: '봄에는 얇은 겉옷을 중심으로 온도 변화에 대응하는 구성이 실용적입니다. 라이트 재킷 안에 코튼 니트를 입고 스트레이트 데님을 더해보세요. 밝은 베이지나 소프트 블루를 한 가지 포인트 색으로 쓰면 계절감이 살아납니다.',
            searchKeywords: ['라이트 재킷', '코튼 니트', '스트레이트 데님'],
        },
        summer: {
            text: '여름 코디는 통기성과 여유 있는 핏을 먼저 보는 것이 좋습니다. 린넨 셔츠에 와이드 코튼 팬츠를 조합하고 가벼운 샌들이나 캔버스 스니커즈를 더해보세요. 상하의를 비슷한 밝기로 맞추면 단정하면서도 시원해 보입니다.',
            searchKeywords: ['린넨 셔츠', '와이드 코튼 팬츠', '캔버스 스니커즈'],
        },
        winter: {
            text: '겨울에는 아우터의 실루엣을 기준으로 안쪽 레이어를 간결하게 잡는 편이 좋습니다. 울 코트 안에 터틀넥 니트를 입고 세미 와이드 슬랙스를 매치해보세요. 블랙 한 색으로 채우기보다 차콜과 브라운을 섞으면 깊이감이 생깁니다.',
            searchKeywords: ['울 코트', '터틀넥 니트', '세미 와이드 슬랙스'],
        },
        date: {
            text: '데이트룩은 과하게 꾸미기보다 깔끔한 핏과 한 가지 포인트를 만드는 편이 자연스럽습니다. 옥스퍼드 셔츠에 세미 와이드 슬랙스를 매치하고 스웨이드 재킷이나 로퍼를 더해보세요. 향수나 액세서리는 하나만 선택하면 전체 인상이 정돈됩니다.',
            searchKeywords: ['옥스퍼드 셔츠', '세미 와이드 슬랙스', '스웨이드 재킷'],
        },
        work: {
            text: '캐주얼 출근룩은 셔츠와 팬츠의 선을 단정하게 유지하면서 소재로 편안함을 더하는 것이 핵심입니다. 니트 폴로에 원턱 슬랙스를 입고 미니멀한 레더 스니커즈를 매치해보세요. 네이비와 그레이를 기본으로 두면 여러 아우터와 돌려 입기 쉽습니다.',
            searchKeywords: ['니트 폴로', '원턱 슬랙스', '레더 스니커즈'],
        },
        tall: {
            text: '키가 큰 체형은 상하의 길이를 모두 길게 잡기보다 한쪽에만 볼륨을 주면 균형이 좋습니다. 적당한 기장의 재킷에 스트레이트 팬츠를 매치하고 상의를 살짝 넣어 허리선을 정리해보세요. 큰 패턴보다 소재 대비로 포인트를 주는 편이 안정적입니다.',
            searchKeywords: ['레귤러핏 재킷', '스트레이트 팬츠', '미니멀 스니커즈'],
        },
        default: {
            text: '원하는 분위기는 한 가지 포인트를 정하고 나머지를 기본색으로 맞추면 안정적입니다. 오버사이즈 셔츠에 스트레이트 데님을 조합하고 로우탑 스니커즈로 마무리해보세요. 네이비, 오프화이트, 그레이 안에서 두세 가지 색만 사용하면 활용도가 높습니다.',
            searchKeywords: ['오버사이즈 셔츠', '스트레이트 데님', '로우탑 스니커즈'],
        },
    },
    en: {
        old_money: {
            text: 'For an old-money look, prioritize fabric and fit over visible logos. Pair a cable-knit sweater or Oxford shirt with pleated trousers and brown loafers. Keep the palette muted with ivory, navy, and brown.',
            searchKeywords: ['cable knit sweater', 'pleated trousers', 'brown loafers'],
        },
        spring: {
            text: 'Build a spring outfit around a light layer that handles changing temperatures. Try a cotton knit under a lightweight jacket with straight-leg denim. One soft accent color such as beige or pale blue will keep it seasonal.',
            searchKeywords: ['lightweight jacket', 'cotton knit', 'straight leg jeans'],
        },
        summer: {
            text: 'For summer, start with breathable fabrics and a relaxed silhouette. Pair a linen shirt with wide cotton trousers and lightweight canvas sneakers. Keeping both pieces in a similar light tone makes the outfit feel clean and cool.',
            searchKeywords: ['linen shirt', 'wide cotton trousers', 'canvas sneakers'],
        },
        winter: {
            text: 'Let the outerwear define a winter outfit and keep the inner layers simple. Wear a wool coat over a turtleneck with semi-wide trousers. Mixing charcoal and brown creates more depth than relying on black alone.',
            searchKeywords: ['wool coat', 'turtleneck sweater', 'semi wide trousers'],
        },
        date: {
            text: 'A good date outfit should look considered without feeling overstyled. Pair an Oxford shirt with semi-wide trousers and add a suede jacket or loafers. Keep accessories to one deliberate accent for a cleaner impression.',
            searchKeywords: ['Oxford shirt', 'semi wide trousers', 'suede jacket'],
        },
        work: {
            text: 'For business casual, keep the shirt and trouser lines clean while using comfortable textures. Try a knit polo with pleated trousers and minimal leather sneakers. Navy and gray make the pieces easy to rotate with different jackets.',
            searchKeywords: ['knit polo', 'pleated trousers', 'leather sneakers'],
        },
        tall: {
            text: 'For a taller frame, balance proportions by adding volume to either the top or bottom rather than both. Pair a regular-length jacket with straight trousers and define the waist with a partial tuck. Use texture instead of oversized patterns for visual interest.',
            searchKeywords: ['regular fit jacket', 'straight trousers', 'minimal sneakers'],
        },
        default: {
            text: 'Choose one clear focal point and keep the rest of the outfit in versatile neutrals. Pair an oversized shirt with straight-leg denim and low-top sneakers. Limiting the palette to navy, off-white, and gray will make the pieces easier to reuse.',
            searchKeywords: ['oversized shirt', 'straight leg jeans', 'low top sneakers'],
        },
    },
};

const INTENT_PATTERNS: Array<[ChatFallbackIntent, RegExp]> = [
    ['old_money', /올드\s*머니|old[\s-]*money/i],
    ['spring', /봄|\bspring\b/i],
    ['summer', /여름|\bsummer\b/i],
    ['winter', /겨울|\bwinter\b/i],
    ['date', /데이트|\bdate\b/i],
    ['work', /출근|오피스|회사|\bbusiness\s*casual\b|\boffice\b|\bwork(?:wear)?\b/i],
    ['tall', /키\s*(?:큰|크)|장신|\btall\b/i],
];

export function detectChatFallbackIntent(message: string): ChatFallbackIntent {
    return INTENT_PATTERNS.find(([, pattern]) => pattern.test(message))?.[0] ?? 'default';
}

export function buildAiChatFallback(message: string, locale: AiChatLocale): AiChatResult {
    const intent = detectChatFallbackIntent(message);
    return {
        ...FALLBACK_COPY[locale][intent],
        responseSource: 'fallback',
    };
}
