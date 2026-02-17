export type TrendSeason = 'spring' | 'summer' | 'fall' | 'winter';

export interface MonthlyTrendStyle {
    id: string;
    title: string;
    subtitle: string;
    desc: string;
    image: string;
    keywords: string[];
    colSpan: 'md:col-span-1' | 'md:col-span-2';
}

export interface MonthlyTrendSnapshot {
    monthKey: string;
    editionLabel: string;
    season: TrendSeason;
    analysisNote: string;
    styles: MonthlyTrendStyle[];
    risingKeywords: string[];
}

interface TrendStyleTemplate extends MonthlyTrendStyle {
    seasons: TrendSeason[];
}

const STYLE_TEMPLATES: TrendStyleTemplate[] = [
    {
        id: 'gorpcore',
        title: 'Gorpcore',
        subtitle: 'The Great Outdoors',
        desc: 'Functional layers, trail sneakers, and technical shells for city-to-nature styling.',
        image: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=800&q=80',
        keywords: ['Arc\'teryx', 'Salomon XT-6', 'Shell Jacket', 'Trail Sneaker'],
        colSpan: 'md:col-span-2',
        seasons: ['spring', 'fall', 'winter'],
    },
    {
        id: 'y2k',
        title: 'Y2K Vintage',
        subtitle: 'Retro 2000s',
        desc: 'Baby tees, low-rise denim, and statement accessories with nostalgic energy.',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
        keywords: ['Diesel Belt', 'Baby Tee', 'Low-Rise Denim', 'Silver Bag'],
        colSpan: 'md:col-span-1',
        seasons: ['spring', 'summer'],
    },
    {
        id: 'oldmoney',
        title: 'Old Money',
        subtitle: 'Quiet Luxury',
        desc: 'Classic knitwear, tailored trousers, and understated silhouettes built for longevity.',
        image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800&q=80',
        keywords: ['Ralph Lauren Knit', 'Cashmere Cardigan', 'Loafer', 'Wool Slacks'],
        colSpan: 'md:col-span-1',
        seasons: ['fall', 'winter', 'spring'],
    },
    {
        id: 'minimalism',
        title: 'Minimalism',
        subtitle: 'Less Is More',
        desc: 'Clean lines, monochrome palettes, and premium basics for everyday rotation.',
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
        keywords: ['COS', 'Jil Sander', 'Wide Slacks', 'White Shirt'],
        colSpan: 'md:col-span-2',
        seasons: ['spring', 'fall'],
    },
    {
        id: 'blokecore',
        title: 'Blokecore',
        subtitle: 'Football Archive',
        desc: 'Retro football jerseys paired with denim and sneakers for relaxed streetwear.',
        image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&q=80',
        keywords: ['Football Jersey', 'Adidas Samba', 'Vintage Denim', 'Track Jacket'],
        colSpan: 'md:col-span-1',
        seasons: ['spring', 'summer', 'fall'],
    },
    {
        id: 'workwear',
        title: 'Modern Workwear',
        subtitle: 'Utility Core',
        desc: 'Structured outerwear and durable textures from workwear DNA.',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
        keywords: ['Carhartt Jacket', 'Painter Pants', 'Canvas Tote', 'Heavy Cotton'],
        colSpan: 'md:col-span-1',
        seasons: ['fall', 'winter', 'spring'],
    },
    {
        id: 'resort',
        title: 'Resort Ease',
        subtitle: 'Holiday Flow',
        desc: 'Linen sets, airy shirts, and relaxed tailoring with summer resort attitude.',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
        keywords: ['Linen Shirt', 'Resort Set-Up', 'Leather Sandal', 'Straw Tote'],
        colSpan: 'md:col-span-2',
        seasons: ['summer', 'spring'],
    },
    {
        id: 'athflow',
        title: 'Athflow',
        subtitle: 'Comfort Tech',
        desc: 'Comfort-focused active silhouettes blended with clean, elevated details.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
        keywords: ['On Running', 'Asics Gel-Kayano', 'Technical Zip-Up', 'Wide Jogger'],
        colSpan: 'md:col-span-1',
        seasons: ['winter', 'spring', 'fall'],
    },
];

const SEASONAL_SIGNALS: Record<TrendSeason, string[]> = {
    spring: ['Light Bomber', 'Stripe Knit', 'Denim Shirt', 'Windbreaker'],
    summer: ['Mesh Top', 'Nylon Shorts', 'Sling Bag', 'Linen Pants'],
    fall: ['Suede Jacket', 'Layered Hoodie', 'Corduroy Pants', 'Moc Toe'],
    winter: ['Puffer Jacket', 'Fleece Zip-Up', 'Wool Scarf', 'Thermal Tee'],
};

const MONTHLY_SIGNALS: Record<number, string[]> = {
    1: ['New Balance 993', 'Wool Coat', 'Fleece Vest'],
    2: ['Asics Gel-Kayano', 'Stussy Hoodie', 'Wide Denim'],
    3: ['Track Jacket', 'Adidas Samba', 'Striped Long Sleeve'],
    4: ['Windbreaker', 'Nylon Cargo', 'Silver Sneaker'],
    5: ['Linen Shirt', 'Half Zip Knit', 'Light Cardigan'],
    6: ['Tank Layering', 'Tech Shorts', 'Sport Sandal'],
    7: ['Mesh Jersey', 'Sling Pack', 'Wide Shorts'],
    8: ['Resort Set-Up', 'Vacation Tote', 'Open Collar Shirt'],
    9: ['Suede Loafer', 'Denim Trucker', 'Vintage Belt'],
    10: ['Barn Jacket', 'Rugby Shirt', 'Dark Wash Denim'],
    11: ['Wool Blazer', 'Heavy Knit', 'Chelsea Boots'],
    12: ['Puffer Vest', 'Knit Beanie', 'Glove Styling'],
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function hashString(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getSeoulDateParts(date: Date): { year: number; month: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find(p => p.type === 'year')?.value || '1970');
    const month = Number(parts.find(p => p.type === 'month')?.value || '1');
    return { year, month };
}

export function getSeoulMonthKey(date: Date = new Date()): string {
    const { year, month } = getSeoulDateParts(date);
    return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMsUntilNextMonthStartKST(date: Date = new Date()): number {
    const { year, month } = getSeoulDateParts(date);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const nextMonthStartUtcMs = Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0) - KST_OFFSET_MS;
    const diffMs = nextMonthStartUtcMs - date.getTime();

    return Math.max(diffMs, 1000);
}

function monthToSeason(month: number): TrendSeason {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
}

function normalizeKeyword(keyword: string): string {
    return keyword.replace(/^#/, '').trim();
}

function dedupeKeywords(keywords: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const keyword of keywords) {
        const clean = normalizeKeyword(keyword);
        const key = clean.toLowerCase();
        if (!clean || seen.has(key)) continue;
        seen.add(key);
        unique.push(clean);
    }

    return unique;
}

function selectMonthlyStyles(monthKey: string, season: TrendSeason): MonthlyTrendStyle[] {
    const scored = STYLE_TEMPLATES.map((style) => {
        const seasonalBoost = style.seasons.includes(season) ? 100 : 0;
        const jitter = hashString(`${monthKey}:${style.id}`) % 100;
        return {
            style,
            score: seasonalBoost + jitter,
        };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ style }) => ({
            id: style.id,
            title: style.title,
            subtitle: style.subtitle,
            desc: style.desc,
            image: style.image,
            keywords: dedupeKeywords(style.keywords),
            colSpan: style.colSpan,
        }));
}

function buildRisingKeywords(
    styles: MonthlyTrendStyle[],
    monthKey: string,
    season: TrendSeason,
    month: number
): string[] {
    const scoreMap = new Map<string, { label: string; score: number }>();

    const addKeyword = (label: string, score: number) => {
        const clean = normalizeKeyword(label);
        if (!clean) return;
        const key = clean.toLowerCase();
        const current = scoreMap.get(key);
        if (!current) {
            scoreMap.set(key, { label: clean, score });
            return;
        }
        current.score += score;
        scoreMap.set(key, current);
    };

    styles.forEach((style, styleIndex) => {
        style.keywords.forEach((keyword, keywordIndex) => {
            addKeyword(keyword, 5 - styleIndex * 0.5 - keywordIndex * 0.2);
        });
    });

    SEASONAL_SIGNALS[season].forEach((keyword, i) => addKeyword(keyword, 3 - i * 0.1));
    MONTHLY_SIGNALS[month].forEach((keyword, i) => addKeyword(keyword, 3.5 - i * 0.1));

    return Array.from(scoreMap.values())
        .sort((a, b) => {
            const scoreDiff = b.score - a.score;
            if (scoreDiff !== 0) return scoreDiff;
            const aHash = hashString(`${monthKey}:${a.label}`);
            const bHash = hashString(`${monthKey}:${b.label}`);
            return bHash - aHash;
        })
        .slice(0, 12)
        .map(entry => entry.label);
}

export function analyzeMonthlyFashionTrends(date: Date = new Date()): MonthlyTrendSnapshot {
    const { year, month } = getSeoulDateParts(date);
    const monthKey = getSeoulMonthKey(date);
    const season = monthToSeason(month);
    const styles = selectMonthlyStyles(monthKey, season);
    const risingKeywords = dedupeKeywords(buildRisingKeywords(styles, monthKey, season, month));

    return {
        monthKey,
        editionLabel: `${year}.${String(month).padStart(2, '0')} Edition`,
        season,
        analysisNote: 'Monthly fashion trend set auto-updates at the beginning of each month.',
        styles,
        risingKeywords,
    };
}
