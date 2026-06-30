import type { Metadata } from 'next';
import Link from 'next/link';
import CompareEntryPage from '@/components/landing/CompareEntryPage';

const BRANDS: Record<string, { label: string; description: string; tags: string[]; color: string }> = {
    musinsa: {
        label: '무신사',
        description: '무신사의 트렌디한 패션 아이템들을 최저가로 비교해보세요.',
        tags: ['무신사스탠다드', '무신사 한정판', '무신사 세일'],
        color: '#0041ff',
    },
    ably: {
        label: '에이블리',
        description: '에이블리의 감성적인 여성 패션을 다양한 가격대로 비교하세요.',
        tags: ['에이블리 원피스', '에이블리 가디건', '에이블리 코디'],
        color: '#ff4b6a',
    },
    wconcept: {
        label: 'W컨셉',
        description: 'W컨셉의 럭셔리 감성 패션을 한눈에 비교해보세요.',
        tags: ['W컨셉 블라우스', 'W컨셉 드레스', 'W컨셉 자켓'],
        color: '#1a1a1a',
    },
    '29cm': {
        label: '29CM',
        description: '29CM의 큐레이션된 패션 아이템들을 가격 비교하세요.',
        tags: ['29cm 셔츠', '29cm 바지', '29cm 가방'],
        color: '#ff5c00',
    },
    zigzag: {
        label: '지그재그',
        description: '지그재그의 인기 아이템들을 다양한 쇼핑몰에서 비교하세요.',
        tags: ['지그재그 원피스', '지그재그 상의', '지그재그 패션'],
        color: '#ff0084',
    },
    ssf: {
        label: 'SSF샵',
        description: 'SSF샵의 프리미엄 패션 브랜드를 가격과 구성 기준으로 비교하세요.',
        tags: ['SSF샵 니트', 'SSF샵 셔츠', 'SSF샵 코트'],
        color: '#0f172a',
    },
    handsome: {
        label: '한섬',
        description: '한섬 계열 브랜드 상품을 다른 쇼핑몰과 함께 비교해보세요.',
        tags: ['한섬 니트', '타임 자켓', '시스템 옴므 셔츠'],
        color: '#5b4636',
    },
    coupang: {
        label: '쿠팡',
        description: '쿠팡 패션 상품을 빠르게 비교하고 최저가를 확인하세요.',
        tags: ['쿠팡 패션 운동화', '쿠팡 여성 원피스', '쿠팡 남성 아우터'],
        color: '#346aff',
    },
    farfetch: {
        label: 'Farfetch',
        description: 'Farfetch의 글로벌 디자이너 상품을 국내 소스와 함께 비교하세요.',
        tags: ['Farfetch 스니커즈', 'Farfetch 가방', 'Farfetch 자켓'],
        color: '#111111',
    },
    ssense: {
        label: 'SSENSE',
        description: 'SSENSE 편집숍 상품을 다른 패션 플랫폼 가격과 비교해보세요.',
        tags: ['SSENSE 후드', 'SSENSE 스니커즈', 'SSENSE 셔츠'],
        color: '#1e293b',
    },
    hago: {
        label: 'HAGO',
        description: 'HAGO 디자이너 편집숍 상품을 다양한 소스와 비교하세요.',
        tags: ['HAGO 블라우스', 'HAGO 원피스', 'HAGO 가방'],
        color: '#2f4858',
    },
    eql: {
        label: 'EQL',
        description: 'EQL에서 찾은 컨템포러리 패션 상품을 빠르게 비교하세요.',
        tags: ['EQL 셔츠', 'EQL 팬츠', 'EQL 스니커즈'],
        color: '#7c3aed',
    },
    lfmall: {
        label: 'LF몰',
        description: 'LF몰 주요 브랜드 상품을 가격 비교 중심으로 탐색하세요.',
        tags: ['LF몰 자켓', '헤지스 셔츠', '닥스 가방'],
        color: '#1d4ed8',
    },
    sivillage: {
        label: 'S.I.VILLAGE',
        description: 'S.I.VILLAGE의 프리미엄 브랜드 상품을 한 번에 비교하세요.',
        tags: ['SIVILLAGE 니트', 'SIVILLAGE 코트', 'SIVILLAGE 가방'],
        color: '#8b5e3c',
    },
};

interface BrandPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
    const { slug } = await params;
    const brand = BRANDS[slug];
    if (!brand) return { title: 'LooPyck - 브랜드' };
    return {
        title: `${brand.label} 가격 비교 | LooPyck`,
        description: brand.description,
    };
}

export function generateStaticParams() {
    return Object.keys(BRANDS).map(slug => ({ slug }));
}

export default async function BrandPage({ params }: BrandPageProps) {
    const { slug } = await params;
    const brand = BRANDS[slug];

    if (!brand) {
        return (
            <main className="min-h-screen mesh-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-serif text-3xl tracking-tight text-slate-900 mb-4">브랜드를 찾을 수 없습니다</h1>
                    <Link href="/" className="text-accent-dark hover:underline">홈으로 돌아가기</Link>
                </div>
            </main>
        );
    }

    const quickRoutes = brand.tags.map((tag, index) => ({
        label: tag,
        query: tag,
        note: [
            '대표 라인부터 compare-ready 묶음 확인',
            '옵션과 재고가 갈리는 구간 먼저 체크',
            '세일/대체 상품까지 이어서 탐색',
        ][index] || '브랜드 비교 검색으로 바로 이동',
    }));

    const decisionSignals = [
        {
            label: '우선 보는 기준',
            value: '실구매가, 무료배송 조건, 회원가 적용 여부를 먼저 정리합니다.',
        },
        {
            label: '분리해서 봐야 하는 경우',
            value: '남녀 라인, 옵션 불일치, 모델명 차이가 보이면 같은 브랜드라도 다른 후보로 분리합니다.',
        },
        {
            label: '이 페이지의 역할',
            value: `${brand.label} 검색을 바로 시작하고 shortlist에 담아 compare page까지 이어지는 입구로 씁니다.`,
        },
    ];

    const proofPoints = [
        {
            title: '브랜드 결과를 seller noise 없이 압축',
            description: `${brand.label} 관련 검색어로 진입해도 generic seller보다 패션 전문몰과 공식 채널 결과를 먼저 끌어올리도록 정리했습니다.`,
        },
        {
            title: '같은 라인은 묶고 다른 옵션은 분리',
            description: '브랜드/모델명뿐 아니라 옵션, 성별, 정규화 제목 신호까지 같이 봐서 compare-ready 그룹과 다른 상품을 분리합니다.',
        },
        {
            title: '결제 직전 판단 신호까지 바로 연결',
            description: '상세 페이지에서는 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 이어집니다.',
        },
    ];

    const siblingLinks = Object.entries(BRANDS)
        .filter(([entrySlug]) => entrySlug !== slug)
        .slice(0, 6)
        .map(([entrySlug, entryBrand]) => ({
            href: `/brand/${entrySlug}`,
            label: entryBrand.label,
            note: entryBrand.description,
        }));

    const compareEntrySections = {
        hero: {
            breadcrumbLabel: brand.label,
            eyebrow: 'Brand Compare Entry',
            title: `${brand.label} 비교 시작`,
            description: brand.description,
            accentColor: brand.color,
            routePath: `/brand/${slug}`,
            decisionSignals,
            searchHeading: `${brand.label} 안에서 바로 compare-ready 검색 시작`,
            searchDescription:
                '모델명, 라인명, 옵션 키워드를 바로 넣으면 홈 검색 결과에서 가격 spread와 옵션 일치 여부를 이어서 볼 수 있습니다.',
            starterQuery: brand.tags[0],
        },
        routes: {
            routesHeading: `${brand.label}에서 자주 시작하는 비교 루트`,
            routesDescription:
                '브랜드 페이지는 소개용 SEO 랜딩이 아니라, 자주 비교되는 라인과 옵션 분기 지점을 바로 여는 진입 화면으로 재구성했습니다.',
            quickRoutes,
            accentColor: brand.color,
        },
        proof: {
            accentColor: brand.color,
            proofHeading: `${brand.label} 비교에서 먼저 드러나야 하는 신호`,
            proofDescription:
                '브랜드 단위로 진입할 때는 판매처 수보다 공식몰 여부, 옵션 분리, 실구매가 근거가 먼저 보여야 합니다.',
            proofPoints,
        },
        siblings: {
            siblingHeading: '다른 브랜드 비교로 이어가기',
            siblingDescription:
                '같은 카테고리 안에서 브랜드별 price spread와 재고 차이를 빠르게 옮겨가며 확인할 수 있습니다.',
            siblingLinks,
        },
    };

    return (
        <CompareEntryPage {...compareEntrySections} />
    );
}
