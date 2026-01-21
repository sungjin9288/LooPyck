# 패션 가격 비교 플랫폼

원하는 스타일의 옷을 여러 쇼핑몰에서 비교하여 가성비 있게 구매할 수 있도록 돕는 웹 애플리케이션입니다.

## 주요 기능

- 🔍 **키워드 기반 상품 검색**: 원하는 패션 아이템을 쉽게 검색
- 💰 **가격 비교**: 여러 쇼핑몰의 가격을 한눈에 비교
- 📊 **다양한 정렬 옵션**: 정확도순, 최신순, 가격순으로 정렬
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- ⚡ **빠른 성능**: Next.js 14의 최적화된 성능

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **API**: 네이버 쇼핑 API

## 시작하기

### 1. 사전 요구사항

- Node.js 18 이상 설치
- 네이버 개발자 계정 (API 키 발급용)

### 2. 네이버 쇼핑 API 키 발급

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속하여 로그인
2. **Application > 애플리케이션 등록** 메뉴 선택
3. 다음 정보 입력:
   - 애플리케이션 이름: `패션 가격 비교` (자유롭게 입력)
   - 사용 API: **검색** 선택
   - 비로그인 오픈 API 서비스 환경: **WEB 설정** 추가
   - 웹 서비스 URL: `http://localhost:3000` 입력
4. 등록 완료 후 **Client ID**와 **Client Secret** 복사

### 3. 프로젝트 설치

```bash
# 프로젝트 폴더로 이동
cd fashion-price-compare

# 패키지 설치
npm install
```

### 4. 환경 변수 설정

프로젝트 루트 폴더에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NAVER_CLIENT_ID=발급받은_클라이언트_ID
NAVER_CLIENT_SECRET=발급받은_클라이언트_시크릿
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
fashion-price-compare/
├── app/                      # Next.js 14 App Router
│   ├── api/
│   │   └── search/
│   │       └── route.ts      # 네이버 쇼핑 API 프록시
│   ├── globals.css           # 전역 스타일
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 메인 페이지
├── components/               # React 컴포넌트
│   ├── SearchBar.tsx         # 검색바 컴포넌트
│   ├── ProductCard.tsx       # 상품 카드 컴포넌트
│   └── ProductList.tsx       # 상품 리스트 컴포넌트
├── lib/
│   └── api.ts                # API 유틸리티 함수
├── types/
│   └── product.ts            # TypeScript 타입 정의
├── .env.local.example        # 환경 변수 예시
├── next.config.js            # Next.js 설정
├── tailwind.config.ts        # Tailwind CSS 설정
└── package.json              # 프로젝트 의존성
```

## 사용 방법

1. 검색창에 찾고 싶은 패션 아이템 입력 (예: "청바지", "맨투맨", "운동화")
2. 정렬 옵션 선택:
   - **정확도순**: 검색어와 가장 관련성 높은 순서
   - **최신순**: 최근 등록된 상품 순서
   - **낮은 가격순**: 가격이 낮은 순서
   - **높은 가격순**: 가격이 높은 순서
3. 상품 카드 클릭 시 해당 쇼핑몰 페이지로 이동

## 배포하기

### Vercel 배포 (추천)

1. GitHub에 프로젝트 업로드
2. [Vercel](https://vercel.com)에 접속하여 로그인
3. **Import Project** 클릭
4. GitHub 저장소 선택
5. 환경 변수 설정:
   - `NAVER_CLIENT_ID`: 네이버 클라이언트 ID
   - `NAVER_CLIENT_SECRET`: 네이버 클라이언트 시크릿
6. **Deploy** 클릭

배포 후 네이버 개발자 센터에서 웹 서비스 URL을 배포된 주소로 추가하세요.

## 문제 해결

### API 키 관련 오류

**증상**: "API 키가 설정되지 않았습니다" 오류 발생

**해결 방법**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 내용이 올바른지 확인 (띄어쓰기 없이 작성)
3. 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### 검색 결과가 나오지 않음

**해결 방법**:
1. 네이버 개발자 센터에서 검색 API가 활성화되어 있는지 확인
2. 웹 서비스 URL이 올바르게 설정되어 있는지 확인
3. API 사용량 제한(하루 25,000건)을 초과하지 않았는지 확인

### 이미지가 표시되지 않음

**해결 방법**:
1. [next.config.js](next.config.js)의 `remotePatterns` 설정 확인
2. 브라우저 콘솔에서 에러 메시지 확인

## 향후 개발 계획

- [ ] 사용자 찜 목록 기능
- [ ] 가격 하락 알림
- [ ] 가격 추이 그래프
- [ ] 리뷰 통합 분석
- [ ] AI 기반 스타일 추천
- [ ] PWA 변환 (모바일 앱화)
- [ ] 쿠팡 파트너스 API 연동
- [ ] 다크 모드 지원

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.
