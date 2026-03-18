/**
 * Firestore Cache Layer for AI Extraction Results
 * 동일 상품에 대한 AI 호출을 0으로 만드는 캐싱 시스템
 */

import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    increment
} from 'firebase/firestore';
import { CACHE_CONFIG } from './config';
import type { CachedProductData, ConsensusResult } from '@/types/aiExtraction';

/**
 * URL을 해시로 변환 (Document ID용)
 */
function hashUrl(url: string): string {
    // 간단한 해시 함수 (프로덕션에서는 crypto.subtle 사용 권장)
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수 변환
    }
    return Math.abs(hash).toString(36);
}

/**
 * 쇼핑몰 식별
 */
function identifySource(url: string): CachedProductData['source'] {
    const hostname = url.toLowerCase();
    if (hostname.includes('musinsa')) return 'musinsa';
    if (hostname.includes('naver')) return 'naver';
    if (hostname.includes('29cm')) return '29cm';
    return 'other';
}

/**
 * 캐시에서 상품 데이터 조회
 */
export async function getCachedProduct(url: string): Promise<ConsensusResult | null> {
    try {
        const urlHash = hashUrl(url);
        const docRef = doc(db, CACHE_CONFIG.COLLECTION_PATH, urlHash);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const cached = docSnap.data() as CachedProductData;

        // 만료 체크
        const now = new Date();
        const expiresAt = cached.expiresAt instanceof Timestamp
            ? cached.expiresAt.toDate()
            : new Date(cached.expiresAt);

        if (now > expiresAt) {
            return null;
        }

        // 히트 카운트 증가 (비동기)
        updateDoc(docRef, { hitCount: increment(1) }).catch(console.error);

        return cached.extractedData;

    } catch (error) {
        console.error('[CacheLayer] Get error:', error);
        return null;
    }
}

/**
 * 캐시에 상품 데이터 저장
 */
export async function setCachedProduct(
    url: string,
    data: ConsensusResult
): Promise<boolean> {
    try {
        const urlHash = hashUrl(url);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CACHE_CONFIG.TTL_HOURS * 60 * 60 * 1000);

        const cacheEntry: CachedProductData = {
            urlHash,
            originalUrl: url,
            extractedData: data,
            extractedAt: now,
            expiresAt,
            source: identifySource(url),
            hitCount: 0,
        };

        const docRef = doc(db, CACHE_CONFIG.COLLECTION_PATH, urlHash);
        await setDoc(docRef, {
            ...cacheEntry,
            extractedAt: Timestamp.fromDate(now),
            expiresAt: Timestamp.fromDate(expiresAt),
        });

        return true;

    } catch (error) {
        console.error('[CacheLayer] Set error:', error);
        return false;
    }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStats(): Promise<{
    totalEntries: number;
    hitsBySource: Record<string, number>;
    avgHitCount: number;
}> {
    try {
        const cacheRef = collection(db, CACHE_CONFIG.COLLECTION_PATH);
        const snapshot = await getDocs(cacheRef);

        let totalHits = 0;
        const hitsBySource: Record<string, number> = {
            musinsa: 0,
            naver: 0,
            '29cm': 0,
            other: 0,
        };

        snapshot.forEach((doc) => {
            const data = doc.data() as CachedProductData;
            totalHits += data.hitCount || 0;
            hitsBySource[data.source] = (hitsBySource[data.source] || 0) + (data.hitCount || 0);
        });

        return {
            totalEntries: snapshot.size,
            hitsBySource,
            avgHitCount: snapshot.size > 0 ? totalHits / snapshot.size : 0,
        };

    } catch (error) {
        console.error('[CacheLayer] Stats error:', error);
        return {
            totalEntries: 0,
            hitsBySource: {},
            avgHitCount: 0,
        };
    }
}

/**
 * 만료된 캐시 정리 (관리자용)
 */
export async function cleanExpiredCache(): Promise<number> {
    try {
        const cacheRef = collection(db, CACHE_CONFIG.COLLECTION_PATH);
        const now = Timestamp.now();
        const expiredQuery = query(cacheRef, where('expiresAt', '<', now));
        const snapshot = await getDocs(expiredQuery);

        let deletedCount = 0;
        // Note: Batch delete는 500개 제한이 있으므로 대량 삭제 시 분할 필요
        // 현재는 로깅만
        snapshot.forEach((doc) => {
            console.log('[CacheLayer] Would delete expired:', doc.id);
            deletedCount++;
        });

        console.log(`[CacheLayer] Found ${deletedCount} expired entries`);
        return deletedCount;

    } catch (error) {
        console.error('[CacheLayer] Clean error:', error);
        return 0;
    }
}

/**
 * 캐시 우선 추출 래퍼
 * AI 호출 전 캐시 확인, 캐시 미스 시 콜백 실행 후 캐시 저장
 */
export async function getOrExtract(
    url: string,
    extractFn: () => Promise<ConsensusResult | null>
): Promise<{ result: ConsensusResult | null; fromCache: boolean }> {
    // 1. 캐시 확인
    const cached = await getCachedProduct(url);
    if (cached) {
        return { result: cached, fromCache: true };
    }

    // 2. 캐시 미스 - 실제 추출 실행
    const extracted = await extractFn();

    // 3. 성공 시 캐시 저장
    if (extracted && extracted.finalPrice > 0) {
        await setCachedProduct(url, extracted);
    }

    return { result: extracted, fromCache: false };
}
