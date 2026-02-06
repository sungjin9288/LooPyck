/**
 * Generic Agent - 범용 웹 추출 및 분석 인터페이스
 * 산업 독립적 AI 에이전트 프레임워크
 */

// ============================================
// INTERFACES (도메인 독립)
// ============================================

/**
 * 데이터 소스 인터페이스
 */
export interface IDataSource {
    name: string;
    baseUrl: string;
    type: 'web' | 'api' | 'rss';
    selectors?: Record<string, string>;
    headers?: Record<string, string>;
}

/**
 * 추출 결과 인터페이스
 */
export interface IExtractionResult<T = Record<string, unknown>> {
    success: boolean;
    data: T | null;
    confidence: number;
    source: 'vision' | 'dom' | 'api' | 'hybrid';
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

/**
 * 추출기 인터페이스
 */
export interface IExtractor<T> {
    extract(url: string, source: IDataSource): Promise<IExtractionResult<T>>;
    validate(result: IExtractionResult<T>): boolean;
}

/**
 * 검증기 인터페이스
 */
export interface IValidator<T> {
    validate(data: T): { valid: boolean; errors: string[] };
    sanitize(data: T): T;
}

/**
 * Healer 인터페이스 (자가 복구)
 */
export interface IHealer {
    heal(error: Error, context: HealingContext): Promise<boolean>;
    getStrategy(errorType: string): HealingStrategy;
}

interface HealingContext {
    url: string;
    source: IDataSource;
    attemptCount: number;
    lastError: Error;
}

type HealingStrategy = 'retry' | 'fallback' | 'skip' | 'escalate';

// ============================================
// GENERIC AGENT CLASS
// ============================================

export interface AgentConfig {
    maxRetries: number;
    timeoutMs: number;
    enableVision: boolean;
    enableDom: boolean;
    cacheEnabled: boolean;
    cacheTtlMs: number;
}

const DEFAULT_CONFIG: AgentConfig = {
    maxRetries: 3,
    timeoutMs: 30000,
    enableVision: true,
    enableDom: true,
    cacheEnabled: true,
    cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * 범용 AI 에이전트
 * 어떤 웹 데이터에도 대응 가능한 Core Framework
 */
export class GenericAgent<T> {
    private config: AgentConfig;
    private extractor: IExtractor<T>;
    private validator: IValidator<T>;
    private healer?: IHealer;
    private cache: Map<string, { data: T; expiry: number }> = new Map();

    constructor(
        extractor: IExtractor<T>,
        validator: IValidator<T>,
        config: Partial<AgentConfig> = {},
        healer?: IHealer
    ) {
        this.extractor = extractor;
        this.validator = validator;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.healer = healer;
    }

    /**
     * 데이터 추출 실행
     */
    async execute(url: string, source: IDataSource): Promise<IExtractionResult<T>> {
        // 캐시 확인
        if (this.config.cacheEnabled) {
            const cached = this.getFromCache(url);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    confidence: 1.0,
                    source: 'hybrid',
                    timestamp: new Date(),
                    metadata: { fromCache: true },
                };
            }
        }

        let lastError: Error | null = null;
        let attemptCount = 0;

        // 재시도 루프
        while (attemptCount < this.config.maxRetries) {
            attemptCount++;

            try {
                const result = await this.extractor.extract(url, source);

                if (result.success && result.data) {
                    // 검증
                    const validation = this.validator.validate(result.data);
                    if (validation.valid) {
                        // 캐시 저장
                        if (this.config.cacheEnabled) {
                            this.saveToCache(url, result.data);
                        }
                        return result;
                    } else {
                        lastError = new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }
                } else {
                    lastError = new Error('Extraction failed');
                }
            } catch (error) {
                lastError = error as Error;

                // Healing 시도
                if (this.healer) {
                    const healed = await this.healer.heal(lastError, {
                        url,
                        source,
                        attemptCount,
                        lastError,
                    });
                    if (healed) continue;
                }
            }
        }

        // 실패 반환
        return {
            success: false,
            data: null,
            confidence: 0,
            source: 'hybrid',
            timestamp: new Date(),
            metadata: { error: lastError?.message, attempts: attemptCount },
        };
    }

    /**
     * 배치 추출
     */
    async executeBatch(
        urls: string[],
        source: IDataSource,
        concurrency: number = 3
    ): Promise<IExtractionResult<T>[]> {
        const results: IExtractionResult<T>[] = [];

        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map(url => this.execute(url, source))
            );
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * 캐시에서 조회
     */
    private getFromCache(url: string): T | null {
        const cached = this.cache.get(url);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        this.cache.delete(url);
        return null;
    }

    /**
     * 캐시에 저장
     */
    private saveToCache(url: string, data: T): void {
        this.cache.set(url, {
            data,
            expiry: Date.now() + this.config.cacheTtlMs,
        });
    }

    /**
     * 캐시 클리어
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * 통계 조회
     */
    getStats(): { cacheSize: number; config: AgentConfig } {
        return {
            cacheSize: this.cache.size,
            config: this.config,
        };
    }
}

// ============================================
// DOMAIN-SPECIFIC IMPLEMENTATIONS (Examples)
// ============================================

/**
 * 부동산 데이터 인터페이스
 */
export interface RealEstateData {
    address: string;
    price: number;
    area: number; // 평방미터
    rooms: number;
    type: 'apartment' | 'villa' | 'officetel';
}

/**
 * 뉴스 데이터 인터페이스
 */
export interface NewsData {
    title: string;
    summary: string;
    keywords: string[];
    publishedAt: Date;
    source: string;
}

/**
 * 공공 공고 인터페이스
 */
export interface GovernmentNoticeData {
    title: string;
    agency: string;
    deadline: Date;
    budget: number;
    category: string;
}

/**
 * 패션 데이터 인터페이스 (LooPyck 원본)
 */
export interface FashionData {
    name: string;
    price: number;
    originalPrice?: number;
    material?: string;
    color?: string;
    brand?: string;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * 산업별 에이전트 생성 팩토리
 */
export function createAgentForIndustry<T>(
    industry: 'fashion' | 'realestate' | 'news' | 'government',
    extractor: IExtractor<T>,
    validator: IValidator<T>
): GenericAgent<T> {
    const industryConfigs: Record<string, Partial<AgentConfig>> = {
        fashion: { maxRetries: 3, timeoutMs: 30000, enableVision: true },
        realestate: { maxRetries: 2, timeoutMs: 20000, enableVision: true },
        news: { maxRetries: 2, timeoutMs: 15000, enableVision: false },
        government: { maxRetries: 3, timeoutMs: 25000, enableVision: false },
    };

    return new GenericAgent<T>(
        extractor,
        validator,
        industryConfigs[industry] || DEFAULT_CONFIG
    );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Vision 프롬프트 생성기 (범용)
 */
export function generateVisionPrompt(
    targetFields: string[],
    industry: string
): string {
    return `
당신은 ${industry} 데이터 추출 전문 AI입니다.
스크린샷에서 다음 정보를 추출하세요:

${targetFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}

JSON 형식으로 응답하세요.
각 필드에 대해 confidence (0-1)를 함께 제공하세요.
`.trim();
}

/**
 * 데이터 소스 빌더
 */
export function createDataSource(
    name: string,
    baseUrl: string,
    selectors?: Record<string, string>
): IDataSource {
    return {
        name,
        baseUrl,
        type: 'web',
        selectors: selectors || {},
    };
}

// Export
export const genericAgent = {
    GenericAgent,
    createAgentForIndustry,
    generateVisionPrompt,
    createDataSource,
};
