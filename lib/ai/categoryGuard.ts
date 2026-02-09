/**
 * Category Guard (Identity Guardrail)
 * 패션 외 품목 검색을 차단하여 플랫폼 정체성을 유지.
 */

const BLOCKED_KEYWORDS = [
    'computer', 'cpu', 'gpu', 'ram', 'ssd', 'hdd', 'monitor', 'mouse', 'keyboard',
    'rtx', 'gtx', 'amd', 'intel', 'macbook', 'iphone', 'galaxy', 'phone', 'airpods',
    'soju', 'beer', 'wine', 'alcohol', 'vodka', 'whiskey', // More sul
    'car', 'bike', 'tire', 'engine', 'automotive',
    'game', 'nintendo', 'playstation', 'xbox', 'switch',
    'food', 'snack', 'beverage', 'water', 'coffee',
    'furniture', 'table', 'chair', 'sofa', 'bed', 'desk',
    'pet', 'dog', 'cat', 'feed', // Life but not fashion
    'ticket', 'voucher', 'coupon'
];

const ALLOWED_KEYWORDS = [
    'coat', 'jacket', 'shirt', 'pants', 'jeans', 'dress', 'skirt',
    'shoes', 'sneakers', 'boots', 'heels', 'sandals',
    'bag', 'purse', 'wallet', 'backpack',
    'hat', 'cap', 'beanie', 'scarf', 'gloves',
    'glasses', 'sunglasses', 'watch', 'jewelry', 'ring', 'necklace', 'earring',
    'fashion', 'style', 'look', 'outfit', 'brand',
    'perfume', 'cosmetic', 'makeup' // Beauty is often included in fashion platforms
];

const WITTY_REJECTIONS: Record<string, string> = {
    'computer': "컴퓨터는 핏이 안 예뻐요. 트렌치코트는 어떠세요?",
    'game': "게임보다는 스타일링이 더 재밌지 않나요? 😎",
    'food': "배고프신가요? 하지만 우리는 패션만 요리합니다.",
    'soju': "술보다는 분위기에 취해보세요. 🍷",
    'car': "차보다 멋진 아우터를 보여드릴게요.",
    default: "죄송해요, 우리는 오직 패션에만 집중합니다."
};

export const CategoryGuard = {
    /**
     * Check if the query is allowed with witty feedback
     * @param query User search query
     * @returns { isAllowed: boolean, reason?: string }
     */
    check: (query: string): { isAllowed: boolean; reason?: string } => {
        const lowerQuery = query.toLowerCase();

        // 1. Check Blocklist
        for (const blocked of BLOCKED_KEYWORDS) {
            if (lowerQuery.includes(blocked)) {
                // Find a matching witty rejection or return default
                let reason = WITTY_REJECTIONS.default;

                if (['computer', 'cpu', 'ram', 'ssd', 'gtx'].some(k => blocked.includes(k))) reason = WITTY_REJECTIONS['computer'];
                if (['game', 'nintendo', 'playstation'].some(k => blocked.includes(k))) reason = WITTY_REJECTIONS['game'];
                if (['food', 'snack', 'water'].some(k => blocked.includes(k))) reason = WITTY_REJECTIONS['food'];
                if (['soju', 'beer', 'wine'].some(k => blocked.includes(k))) reason = WITTY_REJECTIONS['soju'];
                if (['car', 'bike'].some(k => blocked.includes(k))) reason = WITTY_REJECTIONS['car'];

                return { isAllowed: false, reason: reason };
            }
        }

        return { isAllowed: true };
    }
};
