import type { Metadata } from 'next';
import Link from 'next/link';

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
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">브랜드를 찾을 수 없습니다</h1>
                    <Link href="/" className="text-accent-dark hover:underline">홈으로 돌아가기</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen mesh-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                    <Link href="/" className="hover:text-slate-700 transition-colors">홈</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">{brand.label}</span>
                </nav>

                {/* Hero */}
                <div className="glass-panel rounded-3xl p-8 mb-10 relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
                        style={{ backgroundColor: brand.color }}
                    />
                    <h1 className="text-4xl font-black text-slate-900 mb-2 relative">
                        {brand.label}
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl relative">{brand.description}</p>
                </div>

                {/* Quick Search Keywords */}
                <div className="mb-10">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">추천 검색어</h2>
                    <div className="flex flex-wrap gap-3">
                        {brand.tags.map(tag => (
                            <Link
                                key={tag}
                                href={`/?q=${encodeURIComponent(tag)}`}
                                className="px-5 py-2.5 glass-panel rounded-2xl text-sm font-medium text-slate-700 hover:shadow-md transition-all hover:text-accent-dark"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Other Brands */}
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">다른 브랜드</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(BRANDS)
                            .filter(([s]) => s !== slug)
                            .map(([s, b]) => (
                                <Link
                                    key={s}
                                    href={`/brand/${s}`}
                                    className="glass-panel rounded-2xl p-4 text-center hover:shadow-md transition-all group"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full mx-auto mb-2"
                                        style={{ backgroundColor: b.color }}
                                    />
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-accent-dark transition-colors">{b.label}</p>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
