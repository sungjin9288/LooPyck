import type { Metadata } from 'next';
import Link from 'next/link';
import CompareEntryPage from '@/components/landing/CompareEntryPage';

const CATEGORIES: Record<string, { label: string; keywords: string[]; description: string; emoji: string }> = {
    outer: {
        label: '아우터',
        keywords: ['코트', '자켓', '점퍼', '패딩', '가디건'],
        description: '코트, 자켓, 패딩 등 다양한 아우터를 가격 비교하고 최저가로 구매하세요.',
        emoji: '🧥',
    },
    denim: {
        label: '데님',
        keywords: ['청바지', '데님 팬츠', '스트레이트 진', '슬림핏 청바지'],
        description: '다양한 핏의 데님 팬츠를 브랜드별, 쇼핑몰별 가격 비교하세요.',
        emoji: '👖',
    },
    sneakers: {
        label: '스니커즈',
        keywords: ['운동화', '에어포스', '스탠스미스', '뉴발란스', '반스'],
        description: '인기 스니커즈 브랜드들의 가격을 한눈에 비교해보세요.',
        emoji: '👟',
    },
    knitwear: {
        label: '니트',
        keywords: ['니트', '울니트', '가을니트', '오버핏니트'],
        description: '감성적인 니트웨어를 여러 쇼핑몰에서 가격 비교하고 최저가를 찾으세요.',
        emoji: '🧶',
    },
    bag: {
        label: '가방',
        keywords: ['숄더백', '크로스백', '토트백', '백팩', '클러치'],
        description: '트렌디한 가방을 다양한 쇼핑몰에서 최저가로 비교해보세요.',
        emoji: '👜',
    },
};

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const category = CATEGORIES[slug];
    if (!category) return { title: 'LooPyck - 카테고리' };
    return {
        title: `${category.label} 가격 비교 | LooPyck`,
        description: category.description,
        openGraph: {
            title: `${category.label} 최저가 비교 | LooPyck`,
            description: category.description,
        },
    };
}

export function generateStaticParams() {
    return Object.keys(CATEGORIES).map(slug => ({ slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const category = CATEGORIES[slug];

    if (!category) {
        return (
            <main className="min-h-screen mesh-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-serif text-3xl tracking-tight text-slate-900 mb-4">카테고리를 찾을 수 없습니다</h1>
                    <Link href="/" className="text-accent-dark hover:underline">홈으로 돌아가기</Link>
                </div>
            </main>
        );
    }

    const quickRoutes = category.keywords.map((keyword, index) => ({
        label: keyword,
        query: keyword,
        note: [
            '대표 키워드로 price spread 확인',
            '브랜드 간 옵션/핏 차이 비교',
            '실구매가와 재고 분기 빠르게 확인',
            '대체 후보까지 확장해서 탐색',
            '카테고리 롱테일 검색으로 바로 이동',
        ][index] || '카테고리 비교 검색으로 바로 이동',
    }));

    const decisionSignals = [
        {
            label: '카테고리 진입에서 중요한 것',
            value: `${category.label}는 같은 아이템군 안에서 브랜드별 가격 차이와 옵션 지원 폭을 먼저 보여줘야 합니다.`,
        },
        {
            label: '바로 확인할 비교 축',
            value: '실구매가, 옵션/사이즈 일치, 재고 상태, 배송 정책을 한 화면에서 이어서 봅니다.',
        },
        {
            label: '이 페이지의 역할',
            value: `${category.label} 검색을 홈 결과로 넘기고 shortlist와 상세 decision block까지 연결하는 compare funnel entry입니다.`,
        },
    ];

    const proofPoints = [
        {
            title: '카테고리 대표 모델을 빠르게 모읍니다',
            description: `${category.label}에서 반복해서 비교되는 핵심 키워드를 먼저 열어 compare-ready 그룹이 잡히는 구간부터 볼 수 있게 했습니다.`,
        },
        {
            title: '브랜드별 price spread를 바로 확인합니다',
            description: '같은 카테고리 안에서도 공식몰, 패션몰, 마켓 셀러 구성이 다르기 때문에 가격 차이가 벌어지는 구간을 바로 찾게 했습니다.',
        },
        {
            title: '결제 직전 판단 신호로 이어집니다',
            description: '비교 결과에서 상세 페이지로 들어가면 옵션, 핏, 재고, 배송 정책까지 decision block으로 바로 이어집니다.',
        },
    ];

    const siblingLinks = Object.entries(CATEGORIES)
        .filter(([entrySlug]) => entrySlug !== slug)
        .map(([entrySlug, entryCategory]) => ({
            href: `/category/${entrySlug}`,
            label: `${entryCategory.emoji} ${entryCategory.label}`,
            note: entryCategory.description,
        }));

    const compareEntrySections = {
        hero: {
            breadcrumbLabel: category.label,
            eyebrow: 'Category Compare Entry',
            title: `${category.emoji} ${category.label} 비교 시작`,
            description: category.description,
            accentColor: '#0f172a',
            routePath: `/category/${slug}`,
            decisionSignals,
            searchHeading: `${category.label} 카테고리에서 바로 비교 시작`,
            searchDescription:
                '카테고리 키워드와 모델명을 바로 넣으면 홈 결과에서 compare-ready 비율, 가격 차이, 옵션 일치 여부를 이어서 확인할 수 있습니다.',
            starterQuery: category.keywords[0],
        },
        routes: {
            routesHeading: `${category.label}에서 바로 열어볼 비교 루트`,
            routesDescription:
                '카테고리 랜딩도 단순 SEO 텍스트 대신, 반복적으로 비교되는 키워드와 브랜드 분기 지점을 바로 여는 검색 입구로 바꿨습니다.',
            quickRoutes,
            accentColor: '#0f172a',
        },
        proof: {
            accentColor: '#0f172a',
            proofHeading: `${category.label} 비교에서 먼저 봐야 하는 판단 축`,
            proofDescription:
                '카테고리에서는 개별 브랜드 소개보다 가격 spread, 옵션 지원, 재고와 배송 정책을 먼저 보는 쪽이 실제 구매 판단에 가깝습니다.',
            proofPoints,
        },
        siblings: {
            siblingHeading: '다른 카테고리 비교로 이어가기',
            siblingDescription:
                '현재 찾는 아이템이 애매하면 인접 카테고리로 바로 이동해서 비슷한 구매 대안까지 비교할 수 있습니다.',
            siblingLinks,
        },
    };

    return (
        <CompareEntryPage {...compareEntrySections} />
    );
}
