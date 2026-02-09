/**
 * Fashion Domain Guard
 * 
 * Filters search queries to ensure they are related to fashion/lifestyle.
 * Prevents users from searching for extensive non-fashion items (e.g. electronics, food).
 */

const FASHION_KEYWORDS = [
    '옷', '의류', '패션', '신발', '가방', '모자', '액세서리', '쥬얼리', '시계',
    '상의', '하의', '아우터', '원피스', '스커트', '바지', '셔츠', '니트', '맨투맨', '후드',
    '코트', '패딩', '자켓', '블레이저', '가디건', '조끼',
    '청바지', '슬랙스', '트레이닝', '레깅스',
    '운동화', '구두', '부츠', '샌들', '슬리퍼', '스니커즈', '로퍼',
    '백팩', '숄더백', '토트백', '에코백', '지갑', '벨트', '양말', '스타킹',
    '선글라스', '안경', '목걸이', '귀걸이', '반지', '팔찌',
    'style', 'look', 'wear', 'fit', 'codi', 'ootd',
    'nike', 'adidas', 'new balance', 'stussy', 'supreme', // Major brands
    'coat', 'jacket', 'shirt', 'pants', 'shoes', 'bag', 'cap', 'hat'
];

const BLOCKED_KEYWORDS = [
    '노트북', '컴퓨터', '마우스', '키보드', '모니터', '핸드폰', '스마트폰', '갤럭시', '아이폰',
    '냉장고', '세탁기', '청소기', '에어컨', '선풍기',
    '자동차', '오토바이', '자전거',
    '음식', '식품', '과자', '음료', '커피', '라면', '국수', '빵', '치킨', '피자',
    '부동산', '아파트', '주식', '코인',
    'computer', 'laptop', 'phone', 'galaxy', 'iphone', 'macbook',
    'food', 'car', 'bike', 'ramen', 'noodle'
];

export function isFashionRelated(query: string): { allowed: boolean; reason?: string } {
    const lowerQuery = query.toLowerCase().trim();

    // 1. Check Blocked List (Hard Fail)
    for (const blocked of BLOCKED_KEYWORDS) {
        if (lowerQuery.includes(blocked)) {
            return {
                allowed: false,
                reason: `LooPyck는 패션 전문 플랫폼입니다.\n'${blocked}' 관련 상품은 검색할 수 없습니다.`
            };
        }
    }

    // 2. Check Positive List (Optimistic Pass)
    // If it contains any fashion keyword, allow it.
    for (const fashion of FASHION_KEYWORDS) {
        if (lowerQuery.includes(fashion)) {
            return { allowed: true };
        }
    }

    // 3. Heuristic / Lenient Fallback
    // If it's not explicitly blocked and not explicitly fashion,
    // we lean towards ALLOW for now to avoid blocking valid niche brands or specific item names
    // that aren't in our keyword list. 
    // BUT, if it's very short or suspicious, we might want to block via AI later.
    // For Phase 41, we allow unknown queries but block explicit non-fashion.

    return { allowed: true };
}
