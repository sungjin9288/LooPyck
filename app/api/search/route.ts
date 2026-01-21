import { NextRequest, NextResponse } from 'next/server';

/**
 * 네이버 쇼핑 API 검색 엔드포인트
 * GET /api/search?query=검색어&display=20&start=1&sort=sim
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const display = searchParams.get('display') || '20';
    const start = searchParams.get('start') || '1';
    const sort = searchParams.get('sort') || 'sim';

    // 검색어가 없으면 에러 반환
    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      );
    }

    // 환경변수에서 API 키 가져오기
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요' },
        { status: 500 }
      );
    }

    // 네이버 쇼핑 API 호출
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(
      query
    )}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }

    const data = await response.json();

    // 성공 응답 반환
    return NextResponse.json(data);
  } catch (error) {
    console.error('검색 API 에러:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
