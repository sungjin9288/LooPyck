export type SearchQualityDatasetEntry = {
    query: string;
    expectedNaver: string[];
    expectedGlobal?: string[];
};

export const SEARCH_QUALITY_DATASET: SearchQualityDatasetEntry[] = [
    { query: '운동용 후드', expectedNaver: ['후드집업', '트레이닝 후드집업'], expectedGlobal: ['zip hoodie', 'training hoodie'] },
    { query: '남자 후드', expectedNaver: ['후드집업', '남성'], expectedGlobal: ['zip hoodie', 'mens'] },
    { query: '여자 후드', expectedNaver: ['후드집업', '여성'], expectedGlobal: ['zip hoodie', 'womens'] },
    { query: '짐웨어 후디', expectedNaver: ['후드집업', '트레이닝 후드집업'], expectedGlobal: ['hoodie', 'training hoodie'] },
    { query: '트레이닝 팬츠', expectedNaver: ['트랙 팬츠', '조거 팬츠'], expectedGlobal: ['track pants', 'training pants'] },
    { query: '조거', expectedNaver: ['조거 팬츠', '트레이닝 팬츠'], expectedGlobal: ['jogger pants', 'training pants'] },
    { query: '와이드 팬츠', expectedNaver: ['와이드 팬츠', '와이드 슬랙스'], expectedGlobal: ['wide pants'] },
    { query: '와이드 슬랙스', expectedNaver: ['와이드 슬랙스', '플리츠 팬츠'], expectedGlobal: ['wide pants'] },
    { query: '청바지', expectedNaver: ['청바지', '데님 팬츠'], expectedGlobal: ['jeans', 'denim pants'] },
    { query: '러닝 자켓', expectedNaver: ['바람막이', '러닝 자켓'], expectedGlobal: ['running jacket', 'windbreaker'] },
    { query: '바람막이', expectedNaver: ['바람막이', '윈드브레이커'], expectedGlobal: ['windbreaker', 'shell jacket'] },
    { query: '플리스 자켓', expectedNaver: ['플리스 자켓', '집업 플리스'], expectedGlobal: ['fleece jacket', 'zip fleece'] },
    { query: '후리스 집업', expectedNaver: ['집업 플리스', '보아 플리스'], expectedGlobal: ['zip fleece', 'fleece jacket'] },
    { query: '러닝화', expectedNaver: ['러닝화', '러닝 슈즈'], expectedGlobal: ['running shoes', 'training sneakers'] },
    { query: '런닝화', expectedNaver: ['러닝화', '러닝 슈즈'], expectedGlobal: ['running shoes'] },
    { query: '고프코어 자켓', expectedNaver: ['바람막이', '고프코어'], expectedGlobal: ['windbreaker', 'gorpcore'] },
    { query: '등산 바지', expectedNaver: ['카고 팬츠', '고프코어'], expectedGlobal: ['cargo pants', 'hiking'] },
    { query: '미니 크로스백', expectedNaver: ['미니백', '크로스백'], expectedGlobal: ['crossbody bag'] },
    { query: '숄더백', expectedNaver: ['숄더백', '가방'], expectedGlobal: ['shoulder bag'] },
    { query: '볼캡', expectedNaver: ['볼캡', '모자'], expectedGlobal: ['cap'] },
    { query: '선글라스', expectedNaver: ['선글라스'], expectedGlobal: ['sunglasses'] },
    { query: '로퍼', expectedNaver: ['로퍼'], expectedGlobal: ['loafers'] },
    { query: '첼시부츠', expectedNaver: ['부츠'], expectedGlobal: ['boots'] },
    { query: '카드지갑', expectedNaver: ['카드지갑', '지갑'], expectedGlobal: ['card holder'] },
    { query: '니트 원피스', expectedNaver: ['원피스', '니트'], expectedGlobal: ['dress', 'knit dress'] },
    { query: '트랙 자켓', expectedNaver: ['자켓', '바람막이'], expectedGlobal: ['track jacket', 'windbreaker'] },
    { query: '나일론 쇼츠', expectedNaver: ['쇼츠', '반바지'], expectedGlobal: ['shorts', 'running shorts'] },
    { query: '러닝 쇼츠', expectedNaver: ['쇼츠', '트레이닝 쇼츠'], expectedGlobal: ['running shorts', 'shorts'] },
    { query: '스웨트 조거 팬츠', expectedNaver: ['조거 팬츠', '트레이닝 팬츠'], expectedGlobal: ['jogger pants'] },
    { query: '집업 플리스', expectedNaver: ['집업 플리스', '플리스 자켓'], expectedGlobal: ['zip fleece'] },
];
