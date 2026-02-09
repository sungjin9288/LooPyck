/**
 * Mood Engine (Aesthetic Query Expansion)
 * "가을 데이트룩" 같은 추상적인 검색어를 구체적인 상품 키워드로 변환
 */

const MOOD_MAP: Record<string, string[]> = {
    '가을': ['트렌치코트', '니트', '가디건', '브라운 자켓'],
    '데이트': ['원피스', '블라우스', '롱스커트', '미니백'],
    '미니멀': ['슬랙스', '무지 티셔츠', '블레이저', '로퍼'],
    '스트릿': ['와이드 팬츠', '후드티', '오버핏', '조거 팬츠', '비니'],
    '올드머니': ['캐시미어', '폴로 셔츠', '화이트 팬츠', '드라이빙 슈즈'],
    '여름': ['린넨 셔츠', '반바지', '샌들', '선글라스'],
    '겨울': ['패딩', '코트', '목도리', '장갑', '부츠'],
    'Y2K': ['크롭티', '로우라이즈', '벨벳', '카고 팬츠']
};

export const MoodEngine = {
    /**
     * 추상적인 무드 쿼리를 구체적인 상품 키워드로 확장
     */
    analyze: (query: string): string => {
        let expandedQuery = query;
        let matchedKeywords: string[] = [];

        Object.keys(MOOD_MAP).forEach(mood => {
            if (query.includes(mood)) {
                matchedKeywords = [...matchedKeywords, ...MOOD_MAP[mood]];
            }
        });

        // If mood detected, execute a random combination or append best matches
        if (matchedKeywords.length > 0) {
            // Pick top 2 relevant concrete keywords to avoid spamming search
            const uniqueKeywords = Array.from(new Set(matchedKeywords)).slice(0, 2);
            return uniqueKeywords.join(' ');
        }

        return query;
    }
};
