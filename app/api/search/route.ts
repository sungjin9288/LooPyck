import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';
import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';
import { Logger } from '@/lib/core/observability';
import { NAVER_SHOPPING_SEARCH_RETIREMENT } from '@/lib/api/naverShoppingSearchLifecycle';

/**
 * 2026-07-31 종료된 네이버 쇼핑 API의 legacy endpoint
 * GET /api/search?query=검색어&display=20&start=1&sort=sim
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'search'), 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSec),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = normalizeQuery(searchParams.get('query'));

    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      );
    }
    if (!isQueryLengthValid(query, 1, 60)) {
      return NextResponse.json(
        { error: '검색어는 1~60자 사이여야 합니다' },
        { status: 400 }
      );
    }

    const analysis = analyzeFashionQuery(query);
    if (!analysis.allowed) {
      return NextResponse.json(
        { error: analysis.reason, blocked: true, suggestedQueries: analysis.suggestedQueries },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: NAVER_SHOPPING_SEARCH_RETIREMENT.message,
        code: NAVER_SHOPPING_SEARCH_RETIREMENT.reason,
        retiredAt: NAVER_SHOPPING_SEARCH_RETIREMENT.retiredAt,
        successor: '/api/realtime-search?q={query}',
      },
      {
        status: 410,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    Logger.error('[Search API] request failed', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
