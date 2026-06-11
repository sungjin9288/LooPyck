# Compare Entry Funnel Content Matrix

## Purpose

이 문서는 `Compare Entry Funnel` 첫 redesign pass에서 Figma frame에 들어갈 실제 copy source와 dynamic field를 정리한다.

이 문서는 layout manifest와 다르다.

- `docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md`: frame 구조, section hierarchy, node naming
- `docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md`: frame 안에 들어갈 텍스트/숫자/상태 source

## Frame Set

초기 redesign frame은 아래 3개 route를 기준으로 잡는다.

1. brand compare entry: `/brand/musinsa`
2. category compare entry: `/category/sneakers`
3. home search result: `/?q=남자%20후드&sort=sim`

## Frame 1: Brand Compare Entry

### Source

- route: `/brand/musinsa`
- source file: `app/brand/[slug]/page.tsx`
- wrapper component: `components/landing/CompareEntryPage.tsx`

### Hero Copy

- breadcrumb label: `무신사`
- eyebrow: `Brand Compare Entry`
- title: `무신사 비교 시작`
- description: `무신사의 트렌디한 패션 아이템들을 최저가로 비교해보세요.`

### Quick Route Chips / Cards

starter tags:

- `무신사스탠다드`
- `무신사 한정판`
- `무신사 세일`

card notes:

- `대표 라인부터 compare-ready 묶음 확인`
- `옵션과 재고가 갈리는 구간 먼저 체크`
- `세일/대체 상품까지 이어서 탐색`

### Compare Lens Signals

- label: `우선 보는 기준`
  - value: `실구매가, 무료배송 조건, 회원가 적용 여부를 먼저 정리합니다.`
- label: `분리해서 봐야 하는 경우`
  - value: `남녀 라인, 옵션 불일치, 모델명 차이가 보이면 같은 브랜드라도 다른 후보로 분리합니다.`
- label: `이 페이지의 역할`
  - value: `무신사 검색을 바로 시작하고 shortlist에 담아 compare page까지 이어지는 입구로 씁니다.`

### Search Entry Copy

- section eyebrow: `Search Compare Entry`
- heading: `무신사 안에서 바로 compare-ready 검색 시작`
- description: `모델명, 라인명, 옵션 키워드를 바로 넣으면 홈 검색 결과에서 가격 spread와 옵션 일치 여부를 이어서 볼 수 있습니다.`
- initial query: `무신사스탠다드`

### Compare Proof

- heading: `무신사 비교에서 먼저 드러나야 하는 신호`
- description: `브랜드 단위로 진입할 때는 판매처 수보다 공식몰 여부, 옵션 분리, 실구매가 근거가 먼저 보여야 합니다.`

proof cards:

- `브랜드 결과를 seller noise 없이 압축`
  - `무신사 관련 검색어로 진입해도 generic seller보다 패션 전문몰과 공식 채널 결과를 먼저 끌어올리도록 정리했습니다.`
- `같은 라인은 묶고 다른 옵션은 분리`
  - `브랜드/모델명뿐 아니라 옵션, 성별, 정규화 제목 신호까지 같이 봐서 compare-ready 그룹과 다른 상품을 분리합니다.`
- `결제 직전 판단 신호까지 바로 연결`
  - `상세 페이지에서는 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 이어집니다.`

### Sibling Navigation Rule

- sibling link count: 최대 `6`
- sibling content: 다른 브랜드 비교 이동
- visual role: compare funnel exit가 아니라 lateral exploration

## Frame 2: Category Compare Entry

### Source

- route: `/category/sneakers`
- source file: `app/category/[slug]/page.tsx`
- wrapper component: `components/landing/CompareEntryPage.tsx`

### Hero Copy

- breadcrumb label: `스니커즈`
- eyebrow: `Category Compare Entry`
- title: `👟 스니커즈 비교 시작`
- description: `인기 스니커즈 브랜드들의 가격을 한눈에 비교해보세요.`

### Quick Route Chips / Cards

starter keywords:

- `운동화`
- `에어포스`
- `스탠스미스`
- `뉴발란스`
- `반스`

card notes:

- `대표 키워드로 price spread 확인`
- `브랜드 간 옵션/핏 차이 비교`
- `실구매가와 재고 분기 빠르게 확인`
- `대체 후보까지 확장해서 탐색`
- `카테고리 롱테일 검색으로 바로 이동`

### Compare Lens Signals

- label: `카테고리 진입에서 중요한 것`
  - value: `스니커즈는 같은 아이템군 안에서 브랜드별 가격 차이와 옵션 지원 폭을 먼저 보여줘야 합니다.`
- label: `바로 확인할 비교 축`
  - value: `실구매가, 옵션/사이즈 일치, 재고 상태, 배송 정책을 한 화면에서 이어서 봅니다.`
- label: `이 페이지의 역할`
  - value: `스니커즈 검색을 홈 결과로 넘기고 shortlist와 상세 decision block까지 연결하는 compare funnel entry입니다.`

### Search Entry Copy

- heading: `스니커즈 카테고리에서 바로 비교 시작`
- description: `카테고리 키워드와 모델명을 바로 넣으면 홈 결과에서 compare-ready 비율, 가격 차이, 옵션 일치 여부를 이어서 확인할 수 있습니다.`
- initial query: `운동화`

### Compare Proof

- heading: `스니커즈 비교에서 먼저 봐야 하는 판단 축`
- description: `카테고리에서는 개별 브랜드 소개보다 가격 spread, 옵션 지원, 재고와 배송 정책을 먼저 보는 쪽이 실제 구매 판단에 가깝습니다.`

proof cards:

- `카테고리 대표 모델을 빠르게 모읍니다`
  - `스니커즈에서 반복해서 비교되는 핵심 키워드를 먼저 열어 compare-ready 그룹이 잡히는 구간부터 볼 수 있게 했습니다.`
- `브랜드별 price spread를 바로 확인합니다`
  - `같은 카테고리 안에서도 공식몰, 패션몰, 마켓 셀러 구성이 다르기 때문에 가격 차이가 벌어지는 구간을 바로 찾게 했습니다.`
- `결제 직전 판단 신호로 이어집니다`
  - `비교 결과에서 상세 페이지로 들어가면 옵션, 핏, 재고, 배송 정책까지 decision block으로 바로 이어집니다.`

### Sibling Navigation Rule

- sibling content: 인접 category 이동
- label format: `emoji + category label`

## Frame 3: Home Search Result

### Source

- route: `/?q=남자%20후드&sort=sim`
- page source: `app/page.tsx`
- grid source: `components/product/InfiniteProductGrid.tsx`
- highlight source: `components/product/ComparisonHighlights.tsx`

### Search Bar Copy

- input placeholder: `찾고 싶은 옷을 검색하세요 (예: 청바지, 맨투맨)`
- submit CTA: `가격 비교 시작`
- sort group label: `정렬:`
- sort options:
  - `정확도순`
  - `낮은 가격순`
  - `높은 가격순`

### Summary Metric Cards

card 1:

- label: `최저 결제가`
- helper: `배송비를 반영한 예상 결제가 기준입니다.`
- value: dynamic number

card 2:

- label: `비교 가능 상품`
- helper: `같은 상품이 2개 이상 쇼핑몰에서 잡힌 경우만 카운트합니다.`
- value: dynamic number

card 3:

- label: `최대 결제가 차이`
- helper: `현재 결과 내 최고 결제가 {highestVisiblePrice}원까지 비교됩니다.`
- value: dynamic spread

### Compare Highlights Section

- section title: `비교 하이라이트`
- section description: `여러 쇼핑몰에서 동시에 잡힌 상품만 모아 최저가와 가격 차이를 바로 확인하세요.`
- pill label: `Compare Ready`

highlight card content:

- compare mall count
- match confidence badge
- 최대 spread badge
- PDP verification badge
- retailer trust pill
- match strategy pill
- lowest checkout price
- optional best-case coupon price
- checkout evidence block

### Result Grid Card Content

result card must preserve:

- mall compare badge: `{n}개 쇼핑몰 비교`
- trust badge
- optional `PDP 확인` badge
- shortlist button
- mall name / match strategy
- product title
- lowest checkout price
- optional highest checkout strike price
- checkout evidence line
- optional `혜택 적용 최저`

### Shortlist Re-entry

source component: `components/product/CompareShortlistSection.tsx`

copy:

- eyebrow: `Guest Compare Shortlist`
- heading: `로그인 없이 저장한 비교 후보`
- description: `나중에 다시 볼 상품만 먼저 담아두고, 준비가 되면 각 compare page로 바로 이어서 확인할 수 있습니다.`
- status pill: `{n}개 저장됨`
- primary CTA: `비교 이어보기`
- secondary CTA: `전체 비우기`

## Dynamic Content Rules

Figma frame에는 아래 값을 hardcode하지 않고 placeholder token으로 둔다.

- price values
- compare-ready count
- spread amount
- mall count
- shortlist count
- PDP verification ratio

권장 placeholder 형식:

- `{lowestCheckoutPrice}`
- `{compareReadyCount}`
- `{priceSpread}`
- `{mallCount}`
- `{shortlistCount}`
- `{verifiedCount}`

## Copy Tone Rules

- tone은 `결정 지원형`으로 유지한다.
- SEO 설명보다 compare action을 먼저 둔다.
- “최저가” 단독 강조보다 `실구매가`, `배송`, `공식몰`, `옵션`, `재고` 축을 같이 보이게 한다.
- guest user도 compare workflow 안에 있다고 느끼게 해야 한다.

## Design Review Questions

각 frame 리뷰 시 아래 질문으로 확인한다.

- first fold에서 primary action이 하나로 읽히는가
- compare-ready signal이 generic browsing보다 앞에 보이는가
- trust / PDP / checkout evidence가 카드에서 scan 가능한가
- shortlist re-entry가 보조 기능이 아니라 workflow continuity로 읽히는가
