import type { Metadata } from 'next';
import Link from 'next/link';

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
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">카테고리를 찾을 수 없습니다</h1>
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
                    <span className="text-slate-900 font-medium">{category.label}</span>
                </nav>

                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">{category.emoji}</div>
                    <h1 className="text-4xl font-black text-slate-900 mb-3">
                        {category.label} 가격 비교
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">{category.description}</p>
                </div>

                {/* Quick Search Keywords */}
                <div className="mb-10">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        인기 검색어
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {category.keywords.map(keyword => (
                            <Link
                                key={keyword}
                                href={`/?q=${encodeURIComponent(keyword)}`}
                                className="px-5 py-2.5 glass-panel rounded-2xl text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md transition-all hover:text-accent-dark"
                            >
                                {keyword}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Other Categories */}
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        다른 카테고리
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(CATEGORIES)
                            .filter(([s]) => s !== slug)
                            .map(([s, cat]) => (
                                <Link
                                    key={s}
                                    href={`/category/${s}`}
                                    className="glass-panel rounded-2xl p-4 text-center hover:shadow-md transition-all group"
                                >
                                    <div className="text-3xl mb-2">{cat.emoji}</div>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-accent-dark transition-colors">
                                        {cat.label}
                                    </p>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
