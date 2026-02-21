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
