# 패션 가격 비교 플랫폼 - 프로젝트 가이드

## 프로젝트 개요
원하는 스타일의 옷을 여러 쇼핑몰에서 비교하여 가성비 있게 구매할 수 있도록 돕는 웹 애플리케이션입니다.

## 기술 스택

### 프론트엔드
- **Next.js 14**: React 기반 풀스택 프레임워크 (웹 + 추후 모바일 변환 가능)
- **TypeScript**: 코드 안정성 및 자동완성 지원
- **Tailwind CSS**: 빠른 반응형 UI 개발
- **shadcn/ui**: 고품질 UI 컴포넌트 라이브러리

### 백엔드
- **Next.js API Routes**: 서버리스 API 엔드포인트
- **네이버 쇼핑 API**: 실시간 상품 정보 및 가격 비교
- **쿠팡 파트너스 API** (선택): 추가 상품 정보

### 데이터베이스 (추후 확장)
- **Vercel Postgres** 또는 **Supabase**: 사용자 찜 목록, 가격 알림 저장

## 주요 기능

### 1단계: 기본 기능 (현재 구현)
- ✅ 상품 키워드 검색
- ✅ 여러 쇼핑몰 가격 비교
- ✅ 상품 정렬 (가격순, 인기순)
- ✅ 반응형 디자인 (모바일/데스크톱)

### 2단계: 고급 기능 (확장 가능)
- 📋 사용자 찜 목록
- 🔔 가격 하락 알림
- 📊 가격 추이 그래프
- ⭐ 리뷰 통합 분석
- 🤖 AI 스타일 추천

## 프로젝트 구조

```
fashion-price-compare/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API 엔드포인트
│   │   └── search/          # 상품 검색 API
│   ├── page.tsx             # 메인 페이지
│   └── layout.tsx           # 전체 레이아웃
├── components/              # React 컴포넌트
│   ├── SearchBar.tsx        # 검색창
│   ├── ProductCard.tsx      # 상품 카드
│   └── ProductList.tsx      # 상품 리스트
├── lib/                     # 유틸리티 함수
│   └── api.ts              # API 호출 함수
├── types/                   # TypeScript 타입 정의
│   └── product.ts          # 상품 타입
└── public/                  # 정적 파일
```

## API 사용 안내

### 네이버 쇼핑 API
1. [네이버 개발자 센터](https://developers.naver.com/) 회원가입
2. 애플리케이션 등록 (검색 API 선택)
3. Client ID와 Client Secret 발급
4. `.env.local` 파일에 키 저장

```env
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### API 사용량 제한
- 네이버 쇼핑 API: 하루 25,000건 (무료)
- 초과 시 유료 플랜 필요

## 배포 방법

### Vercel (추천)
1. GitHub에 코드 업로드
2. [Vercel](https://vercel.com)에서 Import
3. 환경변수 설정
4. 자동 배포

### 로컬 실행
```bash
npm install          # 패키지 설치
npm run dev         # 개발 서버 실행 (http://localhost:3000)
npm run build       # 프로덕션 빌드
npm start           # 프로덕션 서버 실행
```

## 학습 자료

### 초보자를 위한 가이드
1. **HTML/CSS 기초**: [MDN Web Docs](https://developer.mozilla.org/ko/)
2. **JavaScript**: [모던 JavaScript 튜토리얼](https://ko.javascript.info/)
3. **React**: [React 공식 문서](https://react.dev/learn)
4. **Next.js**: [Next.js 튜토리얼](https://nextjs.org/learn)

### 추천 개발 도구
- **에디터**: Visual Studio Code
- **브라우저**: Chrome + React Developer Tools
- **버전관리**: Git + GitHub Desktop

## 다음 단계

1. ✅ 기본 프로젝트 설정
2. ✅ 네이버 쇼핑 API 연동
3. ✅ 상품 검색 및 비교 기능
4. 사용자 인증 (구글/카카오 로그인)
5. 찜 목록 및 가격 알림 기능
6. PWA로 변환 (모바일 앱처럼 사용)

## 문제 해결

### API 에러
- API 키 확인: `.env.local` 파일 존재 여부
- 네이버 개발자 센터에서 API 활성화 상태 확인

### 설치 에러
- Node.js 버전 확인 (18 이상 권장)
- `node_modules` 삭제 후 재설치

## 라이선스
MIT License - 자유롭게 사용 및 수정 가능
