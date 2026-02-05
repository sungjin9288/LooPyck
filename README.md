# LooPyck (루픽)

**LooPyck**은 "Look & Pick"의 합성어로, 사용자가 원하는 패션 아이템을 검색하고 다양한 쇼핑몰의 가격을 한눈에 비교하여 가장 합리적인 선택을 할 수 있도록 돕는 서비스입니다.

![LooPyck Preview](./public/preview.png)

## 🚀 주요 기능

### 1. 🔍 스마트 가격 비교
- 네이버 쇼핑 API를 활용하여 수만 개의 패션 상품을 실시간으로 검색합니다.
- **Price Insight**: 상품 가격이 전체 분포 중 어디에 위치하는지(상위 10%, 평균 이하 등) 백분위로 분석하여 시각적으로 제공합니다.

### 2. ❤️ 클라우드 찜하기 (Cloud Sync)
- **Firebase Firestore** 연동으로 기기 간 찜 목록이 실시간으로 동기화됩니다.
- **익명 로그인**: 복잡한 회원가입 없이 바로 서비스를 이용할 수 있으며, 추후 구글 계정 연동을 지원합니다.

### 3. 👀 소셜 프루프 (Social Proof)
- **실시간 관심도**: 현재 몇 명의 사용자가 이 상품을 보고 있는지, 몇 명이 찜했는지 실시간으로 확인할 수 있습니다.
- 동시성 제어 기술(Transaction)이 적용되어 정확한 카운팅을 보장합니다.

### 4. 🎨 프리미엄 UX
- **Skeleton Loading**: 데이터 로딩 중에도 자연스러운 화면을 제공합니다.
- **Micro-interactions**: 버튼 클릭 시의 "Pop" 효과, 리스트 등장 시의 순차적(Staggered) 애니메이션 등으로 사용하는 즐거움을 더했습니다.

---

## 🛠 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS (Design Tokens System)
- **Backend (Serverless)**: Firebase Authentication, Firestore
- **State Management**: React Context API, Custom Hooks
- **Deployment**: Vercel

---

## 📦 설치 및 실행 방법

1. **프로젝트 클론**
   ```bash
   git clone https://github.com/sungjin9288/LooPyck.git
   cd LooPyck
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   `.env.local` 파일을 생성하고 다음 키를 입력하세요.
   ```env
   NAVER_CLIENT_ID=your_naver_client_id
   NAVER_CLIENT_SECRET=your_naver_client_secret
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   ...
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

---

## 🔒 보안 및 아키텍처

- **Hybrid Migration**: 로컬 스토리지에 있던 데이터를 클라우드로 자동 이관하는 하이브리드 마이그레이션 전략을 사용합니다.
- **Security Rules**: 철저한 소유권(Ownership) 기반의 보안 규칙을 적용하여, 사용자는 본인의 데이터에만 접근할 수 있습니다.

---

## 📈 Future Roadmap

- [ ] 가격 변동 알림 (Cloud Functions)
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 인기 상품 랭킹 페이지

---
© 2024 LooPyck. All rights reserved.
