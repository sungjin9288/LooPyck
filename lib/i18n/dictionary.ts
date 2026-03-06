export type Locale = 'ko' | 'en';

export const dictionary = {
    ko: {
        nav: {
            search: '검색',
            recommend: '추천',
            favorites: '즐겨찾기',
            login: '로그인',
            logout: '로그아웃'
        },
        search: {
            placeholder: '찾고 싶은 옷을 검색하세요 (예: 청바지, 맨투맨)',
            button: '검색',
            scanning: '전 세계 쇼핑몰 스캔 중...',
            visualSearch: '사진으로 찾기'
        },
        product: {
            newArrivals: '신상품',
            sort: {
                rel: '정확도순',
                asc: '낮은가격순',
                desc: '높은가격순',
                new: '최신순'
            },
            buyNow: '구매하기',
            analysis: 'AI 구매 분석'
        },
        pwa: {
            installTitle: '앱으로 더 편하게 보세요',
            installDesc: '홈 화면에 추가하고 알림을 받아보세요.',
            iosGuide: 'Safari 공유 버튼 → 홈 화면에 추가를 선택하세요.',
            installBtn: '앱 설치하기',
            later: '나중에'
        }
    },
    en: {
        nav: {
            search: 'Search',
            recommend: 'Recommend',
            favorites: 'Favorites',
            login: 'Login',
            logout: 'Logout'
        },
        search: {
            placeholder: 'Search for fashion items (e.g., Denim, Hoodie)',
            button: 'Search',
            scanning: 'Scanning global malls...',
            visualSearch: 'Visual Search'
        },
        product: {
            newArrivals: 'New Arrivals',
            sort: {
                rel: 'Relevance',
                asc: 'Price: Low to High',
                desc: 'Price: High to Low',
                new: 'Newest'
            },
            buyNow: 'Buy Now',
            analysis: 'AI Shopping Insight'
        },
        pwa: {
            installTitle: 'Install App',
            installDesc: 'Add to home screen for better experience.',
            iosGuide: 'Tap Share in Safari, then choose Add to Home Screen.',
            installBtn: 'Install',
            later: 'Later'
        }
    }
};
