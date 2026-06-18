/**
 * Mood Engine (Aesthetic Query Expansion)
 * 추상적인 검색어("가을 데이트룩")를 구체적인 상품 키워드로 변환
 * - 20+ 무드 지원
 * - 계절 미언급 시 현재 계절 자동 주입
 */

const MOOD_MAP: Record<string, string[]> = {
    // ── 계절 ──────────────────────────────────────────────────────────────
    '봄':     ['트렌치코트', '린넨 자켓', '플로럴 원피스', '라이트 니트', '스니커즈'],
    '여름':   ['린넨 셔츠', '반바지', '샌들', '선글라스', '크롭탑'],
    '가을':   ['트렌치코트', '니트', '가디건', '브라운 자켓', '앵클부츠'],
    '겨울':   ['패딩', '울코트', '목도리', '장갑', '첼시부츠'],

    // ── 상황/콘셉트 ────────────────────────────────────────────────────────
    '데이트':       ['원피스', '블라우스', '롱스커트', '미니백', '하이힐'],
    '미니멀':       ['슬랙스', '무지 티셔츠', '블레이저', '로퍼', '토트백'],
    '스트릿':       ['와이드 팬츠', '후드티', '오버핏', '조거 팬츠', '비니'],
    '올드머니':     ['캐시미어 니트', '폴로 셔츠', '화이트 팬츠', '드라이빙 슈즈', '더플백'],
    'Y2K':          ['크롭티', '로우라이즈', '벨벳', '카고 팬츠', '플랫폼 슈즈'],
    '고프코어':     ['플리스 자켓', '테크웨어 팬츠', '하이킹 부츠', '나일론 베스트', '볼캡'],
    '아카데미아':   ['체크 블레이저', '니트 베스트', '옥스퍼드 슈즈', '와이드 슬랙스', '버킷햇'],
    '코티지코어':   ['플로럴 원피스', '레이스 블라우스', '바스켓백', '메리제인 슈즈', '헤어밴드'],
    '빈티지':       ['와이드 데님', '빈티지 티셔츠', '가죽 자켓', '어그부츠', '체인 목걸이'],
    '모노톤':       ['블랙 슬랙스', '화이트 셔츠', '그레이 니트', '블랙 스니커즈', '미니멀 백'],
    '파티':         ['시퀸 드레스', '새틴 탑', '스트랩 힐', '클러치백', '골드 주얼리'],
    '캐주얼':       ['청바지', '무지 티셔츠', '흰 운동화', '맨투맨', '숄더백'],
    '비즈니스캐주얼': ['슬랙스', '포멀 셔츠', '더비 슈즈', '블레이저', '사코슈'],
    '운동룩':       ['레깅스', '스포츠 브라', '러닝화', '집업 자켓', '스포츠 백팩'],
    '서핑룩':       ['보드 쇼츠', '래시가드', '슬리퍼', '비치백', '선글라스'],
    '컬러풀':       ['컬러 블로킹 자켓', '비비드 니트', '컬러 팬츠', '청키 스니커즈'],
    '모던보이':     ['오버사이즈 셔츠', '카고 팬츠', '청키 부츠', '크로스백'],
};

const SEASON_KEYWORDS = ['봄', '여름', '가을', '겨울'];

function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) return '봄';
    if (month >= 6 && month <= 8) return '여름';
    if (month >= 9 && month <= 11) return '가을';
    return '겨울';
}

const MAX_MOOD_KEYWORDS = 5;

export const MoodEngine = {
    /**
     * 무드 쿼리를 구체적인 상품 키워드로 확장한다.
     * - 무드가 하나도 매칭되지 않으면 빈 배열을 반환한다(리터럴 검색어를
     *   계절 키워드로 치환하던 과거 버그 방지).
     * - 매칭된 무드에 계절 언급이 없으면 현재(또는 주입된) 계절의 대표
     *   아이템 1개를 앞에 덧붙여 시즌성을 보강한다.
     *
     * @param options.season   테스트/결정성을 위해 계절을 주입(미지정 시 현재 계절)
     * @param options.injectSeason  false면 계절 보강을 끈다
     */
    expandMoods: (query: string, options?: { season?: string; injectSeason?: boolean }): string[] => {
        const matched: string[] = [];
        let hasMood = false;
        let hasSeason = false;

        for (const mood of Object.keys(MOOD_MAP)) {
            if (query.includes(mood)) {
                matched.push(...MOOD_MAP[mood]);
                hasMood = true;
                if (SEASON_KEYWORDS.includes(mood)) hasSeason = true;
            }
        }

        // 무드 미매칭 → 리터럴 검색어이므로 확장하지 않는다.
        if (!hasMood) {
            return [];
        }

        if (!hasSeason && options?.injectSeason !== false) {
            const season = options?.season ?? getCurrentSeason();
            const seasonKeywords = MOOD_MAP[season];
            if (seasonKeywords) {
                matched.unshift(seasonKeywords[0]);
            }
        }

        return Array.from(new Set(matched)).slice(0, MAX_MOOD_KEYWORDS);
    },

    /**
     * 추상적인 무드 쿼리를 구체적인 상품 키워드 문자열로 변환.
     * 무드가 없으면 원본 쿼리를 그대로 반환한다.
     */
    analyze: (query: string): string => {
        const expanded = MoodEngine.expandMoods(query);
        return expanded.length > 0 ? expanded.slice(0, 3).join(' ') : query;
    },

    /**
     * 현재 계절 반환 (UI 표시용)
     */
    getCurrentSeason,

    /**
     * 지원 무드 목록 반환
     */
    getMoods: (): string[] => Object.keys(MOOD_MAP),
};
