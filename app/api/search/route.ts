import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';
import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';

/**
 * 네이버 쇼핑 API 검색 엔드포인트
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

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const query = normalizeQuery(searchParams.get('query'));
    const displayRaw = Number.parseInt(searchParams.get('display') || '20', 10);
    const startRaw = Number.parseInt(searchParams.get('start') || '1', 10);
    const sortRaw = searchParams.get('sort') || 'sim';
    const sort = ['sim', 'asc', 'dsc'].includes(sortRaw) ? sortRaw : 'sim';
    const display = Number.isFinite(displayRaw) ? Math.min(Math.max(displayRaw, 1), 100) : 20;
    const start = Number.isFinite(startRaw) ? Math.min(Math.max(startRaw, 1), 1000) : 1;

    // 검색어가 없으면 에러 반환
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
    const effectiveQuery = analysis.normalizedQuery || query;

    // 환경변수에서 API 키 가져오기
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '검색 서비스 연동에 실패했습니다.' },
        { status: 503 }
      );
    }

    // 네이버 쇼핑 API 호출
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(
      effectiveQuery
    )}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }

    const data = await response.json();

    // 성공 응답 반환
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return NextResponse.json(
        { error: '외부 쇼핑 API 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
        { status: 504 }
      );
    }
    console.error('검색 API 에러:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
