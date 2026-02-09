/**
 * Category Guard (Identity Guardrail)
 * 패션 외 품목 검색을 차단하여 플랫폼 정체성을 유지.
 */

const BLOCKED_KEYWORDS = [
    'computer', 'cpu', 'gpu', 'ram', 'ssd', 'hdd', 'monitor', 'mouse', 'keyboard',
    'rtx', 'gtx', 'amd', 'intel', 'macbook', 'iphone', 'galaxy', 'phone',
    'soju', 'beer', 'wine', 'alcohol', // Sul
    'car', 'bike', 'tire', 'engine',
    'game', 'nintendo', 'playstation', 'xbox',
    'food', 'snack', 'beverage', 'water',
    'furniture', 'table', 'chair', 'sofa', 'bed' // Furniture is borderline, but let's block for now if strict
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

export const CategoryGuard = {
    /**
     * Check if the query is allowed
     * @param query User search query
     * @returns { isAllowed: boolean, reason?: string }
     */
    check: (query: string): { isAllowed: boolean; reason?: string } => {
        const lowerQuery = query.toLowerCase();

        // 1. Check Blocklist
        for (const blocked of BLOCKED_KEYWORDS) {
            if (lowerQuery.includes(blocked)) {
                return { isAllowed: false, reason: `We focus on Fashion. '${blocked}' is not supported.` };
            }
        }

        // 2. Heuristic Check (Optional)
        // If query is too generic like "best", "top", block it?
        // For now, allow everything else to ensure we don't block niche fashion items.

        return { isAllowed: true };
    }
};
