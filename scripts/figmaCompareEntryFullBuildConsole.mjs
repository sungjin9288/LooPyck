/*
 * SUN-10 Compare Entry full-page build script for the Figma desktop development console.
 *
 * Usage:
 * 1. Open file Oj35jzmgbwnxzpTTqTcxLi in the Figma desktop app, open the dev console.
 * 2. Paste the (flattened) setupCode once. It only defines globalThis.__ceBuild; nothing runs yet.
 * 3. Run each entry of buildCommands one at a time and wait for its CE_RESULT log before the next.
 *
 * Policies encoded below:
 * - CompareEntry/Mobile/Brand-Musinsa is REUSED (gate evidence node ids). Its TopNav/Context is
 *   never touched; only the 'SUN-10 Remaining Sections Placeholder' child (and any previously
 *   appended rebuild sections, for idempotency) are removed before appending remaining sections.
 * - Every other frame is removed and recreated from scratch.
 * - Worksheet checkbox names win over the manifest where they diverge:
 *   CompareEntry/SummaryMetricCard (manifest: SearchSummaryMetricCard), CompareEntry/SectionHeader,
 *   CompareEntry/ShortlistSection, CompareEntry/ShortlistButton.
 * - Dynamic numbers stay as placeholder tokens per the content matrix Dynamic Content Rules.
 */

export const fileKey = 'Oj35jzmgbwnxzpTTqTcxLi';

export const description =
  'SUN-10 Compare Entry full build: setupCode defines globalThis.__ceBuild = { buildFrame, frames } covering all 6 desktop/mobile frames (Brand-Musinsa, Category-Sneakers, Search-Results-Hood); run setupCode once in the Figma desktop console, then run the 6 buildCommands one at a time. The existing CompareEntry/Mobile/Brand-Musinsa frame and its TopNav/Context section are preserved; only its placeholder child is replaced with the remaining sections.';

export const setupCode = String.raw`globalThis.__ceBuild = (function () {
  var ACCENT = '#F4FF3A';
  var INK = '#0D1117';
  var CARD = '#111827';
  var LINE = '#243447';
  var DEEP = '#0B1220';
  var CHIPBG = '#182235';
  var CHIPLN = '#334155';
  var OKBG = '#1B2A1F';
  var OKLN = '#59D26F';
  var OKTX = '#86EFAC';
  var TEXT = '#F8FAFC';
  var SOFT = '#E2E8F0';
  var MUTED = '#94A3B8';
  var FAINT = '#64748B';
  var fontsPromise = null;
  function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = Promise.all(['Regular', 'Medium', 'Semi Bold', 'Bold'].map(function (style) { return figma.loadFontAsync({ family: 'Inter', style: style }); }));
    }
    return fontsPromise;
  }
  function P(hex) {
    var h = hex.replace('#', '');
    return { type: 'SOLID', color: { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 } };
  }
  function T(parent, name, txt, size, weight, color, fill) {
    var t = figma.createText();
    t.name = name;
    t.fontName = { family: 'Inter', style: weight };
    t.characters = txt;
    t.fontSize = size;
    t.lineHeight = { unit: 'PIXELS', value: Math.round(size * 1.4) };
    t.fills = [P(color)];
    parent.appendChild(t);
    if (fill) {
      t.textAutoResize = 'HEIGHT';
      t.layoutSizingHorizontal = 'FILL';
    }
    return t;
  }
  function B(parent, name, o) {
    o = o || {};
    var f = figma.createFrame();
    f.name = name;
    f.layoutMode = o.r ? 'HORIZONTAL' : 'VERTICAL';
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
    f.counterAxisAlignItems = o.c ? 'CENTER' : 'MIN';
    f.itemSpacing = o.g == null ? 8 : o.g;
    if (o.p) {
      f.paddingTop = o.p[0];
      f.paddingRight = o.p[1];
      f.paddingBottom = o.p[2];
      f.paddingLeft = o.p[3];
    }
    f.fills = o.bg ? [P(o.bg)] : [];
    if (o.st) {
      f.strokes = [P(o.st)];
      f.strokeWeight = 1;
    }
    if (o.rad != null) { f.cornerRadius = o.rad; }
    parent.appendChild(f);
    if (o.fill) { f.layoutSizingHorizontal = 'FILL'; }
    return f;
  }
  function wrapRow(parent, name, gap) {
    var g = B(parent, name, { r: 1, g: gap, fill: 1 });
    g.layoutWrap = 'WRAP';
    g.counterAxisSpacing = gap;
    return g;
  }
  function pill(parent, name, txt, mode) {
    var bg = mode === 1 ? ACCENT : mode === 2 ? OKBG : CHIPBG;
    var st = mode === 1 ? ACCENT : mode === 2 ? OKLN : CHIPLN;
    var col = mode === 1 ? INK : mode === 2 ? OKTX : SOFT;
    var c = B(parent, name, { r: 1, c: 1, rad: 999, p: [7, 12, 7, 12], g: 4, bg: bg, st: st });
    T(c, name + '/Label', txt, 11, 'Semi Bold', col);
    return c;
  }
  function header(parent, eyebrow, title) {
    var h = B(parent, 'CompareEntry/SectionHeader', { g: 4, fill: 1 });
    T(h, 'CompareEntry/SectionHeader/Eyebrow', eyebrow, 11, 'Semi Bold', ACCENT);
    T(h, 'CompareEntry/SectionHeader/Title', title, 18, 'Bold', TEXT, 1);
    return h;
  }
  function sec(frame, name) {
    return B(frame, name, { g: 14, fill: 1 });
  }
  function sizeCard(card, mob, w) {
    if (mob) {
      card.layoutSizingHorizontal = 'FILL';
    } else {
      card.counterAxisSizingMode = 'FIXED';
      card.resize(w, card.height);
    }
  }
  function cardRow(parent, name, mob) {
    return B(parent, name, { r: mob ? 0 : 1, g: mob ? 12 : 16, fill: 1 });
  }
  function growCard(g, name, mob) {
    var c = B(g, name, { bg: CARD, st: LINE, rad: 16, p: [18, 18, 18, 18], g: 8 });
    if (mob) {
      c.layoutSizingHorizontal = 'FILL';
    } else {
      c.layoutGrow = 1;
      c.layoutAlign = 'STRETCH';
    }
    return c;
  }
  function infoCards(parent, name, nameFn, items, mob) {
    var g = cardRow(parent, name, mob);
    for (var i = 0; i < items.length; i++) {
      var c = growCard(g, nameFn(i), mob);
      T(c, nameFn(i) + '/Label', items[i][0], 14, 'Semi Bold', TEXT, 1);
      T(c, nameFn(i) + '/Body', items[i][1], 13, 'Regular', MUTED, 1);
    }
    return g;
  }
  function topNav(frame, cfg, mob) {
    var nav = B(frame, 'TopNav/Context', { bg: CARD, st: LINE, rad: 24, p: [16, 18, 16, 18], g: 14, fill: 1 });
    var row = B(nav, 'TopNav/Context/RouteIdentity', { r: 1, c: 1, g: 11, fill: 1 });
    var logo = B(row, 'TopNav/Context/LogoMark', { r: 1, c: 1, bg: ACCENT, rad: 13, p: [8, 13, 8, 13], g: 0 });
    T(logo, 'TopNav/Context/LogoInitial', 'L', 19, 'Bold', INK);
    var copy = B(row, 'TopNav/Context/RouteCopy', { g: 3 });
    T(copy, 'TopNav/Context/Eyebrow', cfg.eyebrow, 12, 'Semi Bold', ACCENT);
    T(copy, 'TopNav/Context/Title', cfg.title, mob ? 18 : 24, 'Bold', TEXT);
    var rail = wrapRow(nav, 'TopNav/Context/StatusRail', 8);
    var chips = [[mob ? 'MOBILE' : 'DESKTOP', mob ? '393' : '1440'], ['ROUTE', cfg.route], ['SUN-10', 'Full Build']];
    for (var i = 0; i < chips.length; i++) {
      var ok = chips[i][0] === 'SUN-10';
      var chip = B(rail, 'TopNav/Context/Chip/' + chips[i][0], { g: 2, p: [7, 10, 7, 10], rad: 13, bg: ok ? OKBG : CHIPBG, st: ok ? OKLN : CHIPLN });
      T(chip, 'TopNav/Context/Chip/' + chips[i][0] + '/Label', chips[i][0], 9, 'Bold', ok ? OKTX : MUTED);
      T(chip, 'TopNav/Context/Chip/' + chips[i][0] + '/Value', chips[i][1], 10, 'Semi Bold', TEXT);
    }
  }
  function hero(frame, cfg, mob) {
    var s = sec(frame, 'Hero');
    var z = B(s, 'CompareEntry/Hero', { bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [28, 28, 28, 28], g: 12, fill: 1 });
    var bc = B(z, 'CompareEntry/Hero/Breadcrumb', { r: 1, c: 1, g: 6 });
    T(bc, 'CompareEntry/Hero/Breadcrumb/Home', '홈', 12, 'Medium', FAINT);
    T(bc, 'CompareEntry/Hero/Breadcrumb/Divider', '/', 12, 'Medium', CHIPLN);
    T(bc, 'CompareEntry/Hero/Breadcrumb/Current', cfg.crumb, 12, 'Semi Bold', SOFT);
    T(z, 'CompareEntry/Hero/Eyebrow', cfg.eyebrow, 12, 'Semi Bold', ACCENT);
    T(z, 'CompareEntry/Hero/Title', cfg.title, mob ? 28 : 40, 'Bold', TEXT, 1);
    T(z, 'CompareEntry/Hero/Description', cfg.desc, mob ? 14 : 16, 'Regular', MUTED, 1);
    var chips = wrapRow(z, 'CompareEntry/Hero/QuickRouteChips', 8);
    for (var i = 0; i < cfg.tags.length; i++) {
      pill(chips, 'CompareEntry/Hero/QuickRouteChips/Chip-' + (i + 1), cfg.tags[i], i === 0 ? 1 : 0);
    }
  }
  function lens(frame, cfg, mob) {
    var s = sec(frame, 'CompareLens');
    header(s, 'Compare Lens', '비교 렌즈');
    infoCards(s, 'CompareEntry/CompareLens', function (i) { return 'CompareEntry/CompareLens/Signal-' + (i + 1); }, cfg.lens, mob);
  }
  function searchEntry(frame, cfg, mob) {
    var s = sec(frame, 'SearchEntry');
    var z = B(s, 'CompareEntry/SearchEntry', { bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [28, 28, 28, 28], g: 14, fill: 1 });
    var hd = B(z, 'CompareEntry/SearchEntry/Heading', { g: 4, fill: 1 });
    T(hd, 'CompareEntry/SearchEntry/Heading/Eyebrow', 'Search Compare Entry', 11, 'Semi Bold', ACCENT);
    T(hd, 'CompareEntry/SearchEntry/Heading/Title', cfg.seHead, mob ? 20 : 26, 'Bold', TEXT, 1);
    T(hd, 'CompareEntry/SearchEntry/Heading/Description', cfg.seDesc, 13, 'Regular', MUTED, 1);
    var row = B(z, 'CompareEntry/SearchEntry/ActionRow', { r: mob ? 0 : 1, c: mob ? 0 : 1, g: 10, fill: 1 });
    var bar = B(row, 'CompareEntry/SearchEntry/SearchBar', { r: 1, c: 1, bg: DEEP, st: CHIPLN, rad: 14, p: [13, 16, 13, 16], g: 8 });
    T(bar, 'CompareEntry/SearchEntry/SearchBar/Icon', '🔍', 13, 'Regular', FAINT);
    T(bar, 'CompareEntry/SearchEntry/SearchBar/Placeholder', cfg.seQuery, 14, 'Medium', SOFT);
    if (mob) { bar.layoutSizingHorizontal = 'FILL'; } else { bar.layoutGrow = 1; }
    var cta = B(row, 'CompareEntry/SearchEntry/PrimaryCTA', { r: 1, c: 1, bg: ACCENT, rad: 14, p: [13, 22, 13, 22] });
    T(cta, 'CompareEntry/SearchEntry/PrimaryCTA/Label', '가격 비교 시작', 14, 'Bold', INK);
    if (mob) {
      cta.layoutSizingHorizontal = 'FILL';
      cta.primaryAxisAlignItems = 'CENTER';
    }
  }
  function quickRoutes(frame, cfg, mob) {
    var s = sec(frame, 'QuickRoutes');
    header(s, 'Quick Routes', '빠른 진입 경로');
    var g = mob ? B(s, 'CompareEntry/QuickRoutes', { g: 12, fill: 1 }) : wrapRow(s, 'CompareEntry/QuickRoutes', 16);
    for (var i = 0; i < cfg.tags.length; i++) {
      var c = B(g, 'CompareEntry/QuickRouteCard', { bg: CARD, st: LINE, rad: 16, p: [16, 16, 16, 16], g: 10 });
      sizeCard(c, mob, 437);
      pill(c, 'CompareEntry/QuickRouteCard/Tag', cfg.tags[i], 0);
      T(c, 'CompareEntry/QuickRouteCard/Note', cfg.notes[i], 13, 'Regular', MUTED, 1);
    }
  }
  function shortlistBlock(parent, name, mob) {
    var z = B(parent, name, { r: mob ? 0 : 1, c: mob ? 0 : 1, bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [24, 28, 24, 28], g: mob ? 14 : 24, fill: 1 });
    var copy = B(z, name + '/Copy', { g: 6 });
    if (mob) { copy.layoutSizingHorizontal = 'FILL'; } else { copy.layoutGrow = 1; }
    T(copy, name + '/Eyebrow', 'Guest Compare Shortlist', 11, 'Semi Bold', ACCENT);
    T(copy, name + '/Heading', '로그인 없이 저장한 비교 후보', mob ? 17 : 20, 'Bold', TEXT, 1);
    T(copy, name + '/Description', '나중에 다시 볼 상품만 먼저 담아두고, 준비가 되면 각 compare page로 바로 이어서 확인할 수 있습니다.', 13, 'Regular', MUTED, 1);
    pill(copy, name + '/StatusPill', '{shortlistCount}개 저장됨', 2);
    var act = B(z, name + '/Actions', { r: 1, c: 1, g: 8 });
    pill(act, name + '/PrimaryCTA', '비교 이어보기', 1);
    pill(act, name + '/SecondaryCTA', '전체 비우기', 0);
  }
  function shortlistReentry(frame, mob) {
    var s = sec(frame, 'ShortlistReentry');
    shortlistBlock(s, 'CompareEntry/ShortlistReentry', mob);
  }
  function compareProof(frame, cfg, mob) {
    var s = sec(frame, 'CompareProof');
    header(s, 'Compare Proof', cfg.proofHead);
    T(s, 'CompareProof/Description', cfg.proofDesc, 13, 'Regular', MUTED, 1);
    infoCards(s, 'CompareEntry/Proof', function () { return 'CompareEntry/ProofCard'; }, cfg.proof, mob);
  }
  function siblingNav(frame, cfg, mob) {
    var s = sec(frame, 'SiblingNavigation');
    header(s, 'Sibling Navigation', cfg.sibTitle);
    var z = wrapRow(s, 'CompareEntry/SiblingNavigation', 8);
    for (var i = 0; i < cfg.sibs.length; i++) {
      pill(z, 'CompareEntry/SiblingNavigation/Chip-' + (i + 1), cfg.sibs[i], 0);
    }
  }
  function summaryMetrics(frame, mob) {
    var s = sec(frame, 'SearchSummaryMetrics');
    header(s, 'Home Search Result', '남자 후드 검색 결과 요약');
    var items = [['최저 결제가', '{lowestCheckoutPrice}원', '배송비를 반영한 예상 결제가 기준입니다.'], ['비교 가능 상품', '{compareReadyCount}개', '같은 상품이 2개 이상 쇼핑몰에서 잡힌 경우만 카운트합니다.'], ['최대 결제가 차이', '{priceSpread}원', '현재 결과 내 최고 결제가 {highestVisiblePrice}원까지 비교됩니다.']];
    var g = cardRow(s, 'CompareEntry/SearchSummaryMetrics', mob);
    for (var i = 0; i < items.length; i++) {
      var c = growCard(g, 'CompareEntry/SummaryMetricCard', mob);
      T(c, 'CompareEntry/SummaryMetricCard/Label', items[i][0], 12, 'Semi Bold', ACCENT);
      T(c, 'CompareEntry/SummaryMetricCard/Value', items[i][1], mob ? 22 : 26, 'Bold', TEXT);
      T(c, 'CompareEntry/SummaryMetricCard/Helper', items[i][2], 12, 'Regular', MUTED, 1);
    }
  }
  function highlights(frame, mob) {
    var s = sec(frame, 'CompareHighlights');
    header(s, 'Compare Ready', '비교 하이라이트');
    T(s, 'CompareHighlights/Description', '여러 쇼핑몰에서 동시에 잡힌 상품만 모아 최저가와 가격 차이를 바로 확인하세요.', 13, 'Regular', MUTED, 1);
    var titles = mob ? ['남자 오버핏 후드 집업', '헤비웨이트 기모 후드티'] : ['남자 오버핏 후드 집업', '헤비웨이트 기모 후드티', '드라이 텍스처 후드 스웻'];
    var g = cardRow(s, 'CompareHighlights/Cards', mob);
    for (var i = 0; i < titles.length; i++) {
      var c = growCard(g, 'CompareEntry/HighlightCard', mob);
      var badges = wrapRow(c, 'CompareEntry/HighlightCard/Badges', 6);
      pill(badges, 'CompareEntry/HighlightCard/CompareReadyPill', 'Compare Ready', 1);
      pill(badges, 'CompareEntry/HighlightCard/MallCount', '{mallCount}개 쇼핑몰', 0);
      pill(badges, 'CompareEntry/HighlightCard/SpreadBadge', '최대 {priceSpread}원 차이', 0);
      pill(badges, 'CompareEntry/HighlightCard/PdpBadge', 'PDP 확인', 2);
      T(c, 'CompareEntry/HighlightCard/Title', titles[i], 15, 'Semi Bold', TEXT, 1);
      T(c, 'CompareEntry/HighlightCard/LowestPrice', '{lowestCheckoutPrice}원', 22, 'Bold', TEXT);
      T(c, 'CompareEntry/HighlightCard/BestCoupon', '혜택 적용 최저 {lowestCheckoutPrice}원', 12, 'Semi Bold', OKTX);
      var trust = wrapRow(c, 'CompareEntry/HighlightCard/TrustRow', 6);
      pill(trust, 'CompareEntry/HighlightCard/RetailerTrustPill', '공식몰 신뢰', 2);
      pill(trust, 'CompareEntry/HighlightCard/MatchStrategyPill', '모델명 매칭', 0);
      pill(trust, 'CompareEntry/HighlightCard/ConfidenceBadge', '매칭 신뢰 높음', 0);
      var ev = B(c, 'CompareEntry/HighlightCard/CheckoutEvidence', { bg: DEEP, rad: 10, p: [10, 12, 10, 12], g: 4, fill: 1 });
      T(ev, 'CompareEntry/HighlightCard/CheckoutEvidence/Line', '배송비 포함 예상 결제가 기준 · 옵션/사이즈 일치 확인', 12, 'Regular', MUTED, 1);
    }
  }
  function resultGrid(frame, mob) {
    var s = sec(frame, 'ResultGrid');
    header(s, 'Result Grid', '전체 검색 결과');
    var g = mob ? B(s, 'ResultGrid/Cards', { g: 12, fill: 1 }) : wrapRow(s, 'ResultGrid/Cards', 16);
    var rows = mob ? [['남자 후드 베이직 무지', '무신사'], ['세미오버 후드 스웻셔츠', '29CM']] : [['남자 후드 베이직 무지', '무신사'], ['세미오버 후드 스웻셔츠', '29CM'], ['헤비 코튼 후드 풀오버', 'W컨셉']];
    for (var i = 0; i < rows.length; i++) {
      var c = B(g, 'CompareEntry/ResultCard', { bg: CARD, st: LINE, rad: 16, p: [16, 16, 16, 16], g: 10 });
      sizeCard(c, mob, 437);
      var badges = wrapRow(c, 'CompareEntry/ResultCard/Badges', 6);
      pill(badges, 'CompareEntry/ResultCard/MallCompareBadge', '{mallCount}개 쇼핑몰 비교', 0);
      pill(badges, 'CompareEntry/ResultCard/TrustBadge', '신뢰 판매처', 2);
      pill(badges, 'CompareEntry/ResultCard/PdpBadge', 'PDP 확인', 2);
      T(c, 'CompareEntry/ResultCard/MallMeta', rows[i][1] + ' · 모델명 매칭', 11, 'Medium', FAINT);
      T(c, 'CompareEntry/ResultCard/Title', rows[i][0], 14, 'Semi Bold', TEXT, 1);
      var pr = B(c, 'CompareEntry/ResultCard/PriceRow', { r: 1, c: 1, g: 8 });
      T(pr, 'CompareEntry/ResultCard/LowestPrice', '{lowestCheckoutPrice}원', 18, 'Bold', TEXT);
      var strike = T(pr, 'CompareEntry/ResultCard/HighestPrice', '{highestVisiblePrice}원', 12, 'Regular', FAINT);
      strike.textDecoration = 'STRIKETHROUGH';
      var ev = B(c, 'CompareEntry/ResultCard/CheckoutEvidence', { bg: DEEP, rad: 10, p: [9, 11, 9, 11], g: 3, fill: 1 });
      T(ev, 'CompareEntry/ResultCard/CheckoutEvidence/Line', '배송비 포함 결제가 기준 · 쿠폰 적용 전', 11, 'Regular', MUTED, 1);
      T(ev, 'CompareEntry/ResultCard/CheckoutEvidence/Benefit', '혜택 적용 최저 {lowestCheckoutPrice}원', 11, 'Semi Bold', OKTX);
      pill(c, 'CompareEntry/ShortlistButton', '+ 비교 후보 담기', 1);
    }
  }
  function shortlistEntry(frame, mob) {
    var s = sec(frame, 'ShortlistEntry');
    shortlistBlock(s, 'CompareEntry/ShortlistSection', mob);
  }
  function detailHint(frame, mob) {
    var s = sec(frame, 'DetailEntryHint');
    var z = B(s, 'CompareEntry/DetailEntryHint', { bg: CARD, st: LINE, rad: 16, p: [16, 18, 16, 18], g: 6, fill: 1 });
    T(z, 'CompareEntry/DetailEntryHint/Label', 'Detail Entry', 11, 'Semi Bold', ACCENT);
    T(z, 'CompareEntry/DetailEntryHint/Body', '결과 카드에서 상세 페이지로 들어가면 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 바로 이어집니다.', 13, 'Regular', MUTED, 1);
  }
  var BRAND = {
    route: '/brand/musinsa',
    eyebrow: 'Brand Compare Entry',
    crumb: '무신사',
    title: '무신사 비교 시작',
    desc: '무신사의 트렌디한 패션 아이템들을 최저가로 비교해보세요.',
    tags: ['무신사스탠다드', '무신사 한정판', '무신사 세일'],
    notes: ['대표 라인부터 compare-ready 묶음 확인', '옵션과 재고가 갈리는 구간 먼저 체크', '세일/대체 상품까지 이어서 탐색'],
    lens: [['우선 보는 기준', '실구매가, 무료배송 조건, 회원가 적용 여부를 먼저 정리합니다.'], ['분리해서 봐야 하는 경우', '남녀 라인, 옵션 불일치, 모델명 차이가 보이면 같은 브랜드라도 다른 후보로 분리합니다.'], ['이 페이지의 역할', '무신사 검색을 바로 시작하고 shortlist에 담아 compare page까지 이어지는 입구로 씁니다.']],
    seHead: '무신사 안에서 바로 compare-ready 검색 시작',
    seDesc: '모델명, 라인명, 옵션 키워드를 바로 넣으면 홈 검색 결과에서 가격 spread와 옵션 일치 여부를 이어서 볼 수 있습니다.',
    seQuery: '무신사스탠다드',
    proofHead: '무신사 비교에서 먼저 드러나야 하는 신호',
    proofDesc: '브랜드 단위로 진입할 때는 판매처 수보다 공식몰 여부, 옵션 분리, 실구매가 근거가 먼저 보여야 합니다.',
    proof: [['브랜드 결과를 seller noise 없이 압축', '무신사 관련 검색어로 진입해도 generic seller보다 패션 전문몰과 공식 채널 결과를 먼저 끌어올리도록 정리했습니다.'], ['같은 라인은 묶고 다른 옵션은 분리', '브랜드/모델명뿐 아니라 옵션, 성별, 정규화 제목 신호까지 같이 봐서 compare-ready 그룹과 다른 상품을 분리합니다.'], ['결제 직전 판단 신호까지 바로 연결', '상세 페이지에서는 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 이어집니다.']],
    sibTitle: '다른 브랜드 비교 이동',
    sibs: ['나이키', '아디다스', '뉴발란스', '커버낫', '스투시', '마르디 메르크르디']
  };
  var CATEGORY = {
    route: '/category/sneakers',
    eyebrow: 'Category Compare Entry',
    crumb: '스니커즈',
    title: '👟 스니커즈 비교 시작',
    desc: '인기 스니커즈 브랜드들의 가격을 한눈에 비교해보세요.',
    tags: ['운동화', '에어포스', '스탠스미스', '뉴발란스', '반스'],
    notes: ['대표 키워드로 price spread 확인', '브랜드 간 옵션/핏 차이 비교', '실구매가와 재고 분기 빠르게 확인', '대체 후보까지 확장해서 탐색', '카테고리 롱테일 검색으로 바로 이동'],
    lens: [['카테고리 진입에서 중요한 것', '스니커즈는 같은 아이템군 안에서 브랜드별 가격 차이와 옵션 지원 폭을 먼저 보여줘야 합니다.'], ['바로 확인할 비교 축', '실구매가, 옵션/사이즈 일치, 재고 상태, 배송 정책을 한 화면에서 이어서 봅니다.'], ['이 페이지의 역할', '스니커즈 검색을 홈 결과로 넘기고 shortlist와 상세 decision block까지 연결하는 compare funnel entry입니다.']],
    seHead: '스니커즈 카테고리에서 바로 비교 시작',
    seDesc: '카테고리 키워드와 모델명을 바로 넣으면 홈 결과에서 compare-ready 비율, 가격 차이, 옵션 일치 여부를 이어서 확인할 수 있습니다.',
    seQuery: '운동화',
    proofHead: '스니커즈 비교에서 먼저 봐야 하는 판단 축',
    proofDesc: '카테고리에서는 개별 브랜드 소개보다 가격 spread, 옵션 지원, 재고와 배송 정책을 먼저 보는 쪽이 실제 구매 판단에 가깝습니다.',
    proof: [['카테고리 대표 모델을 빠르게 모읍니다', '스니커즈에서 반복해서 비교되는 핵심 키워드를 먼저 열어 compare-ready 그룹이 잡히는 구간부터 볼 수 있게 했습니다.'], ['브랜드별 price spread를 바로 확인합니다', '같은 카테고리 안에서도 공식몰, 패션몰, 마켓 셀러 구성이 다르기 때문에 가격 차이가 벌어지는 구간을 바로 찾게 했습니다.'], ['결제 직전 판단 신호로 이어집니다', '비교 결과에서 상세 페이지로 들어가면 옵션, 핏, 재고, 배송 정책까지 decision block으로 바로 이어집니다.']],
    sibTitle: '인접 카테고리 이동',
    sibs: ['👕 맨투맨', '🧥 자켓', '👖 데님', '🎒 가방', '🧢 모자', '⌚ 시계']
  };
  var FRAMES = {
    'CompareEntry/Desktop/Brand-Musinsa': { kind: 'entry', cfg: BRAND, mob: 0, x: 160, y: 120 },
    'CompareEntry/Desktop/Category-Sneakers': { kind: 'entry', cfg: CATEGORY, mob: 0, x: 1720, y: 120 },
    'CompareEntry/Desktop/Search-Results-Hood': { kind: 'search', cfg: null, mob: 0, x: 3280, y: 120 },
    'CompareEntry/Mobile/Brand-Musinsa': { kind: 'entry', cfg: BRAND, mob: 1, x: 160, y: 1120, reuse: 1 },
    'CompareEntry/Mobile/Category-Sneakers': { kind: 'entry', cfg: CATEGORY, mob: 1, x: 1720, y: 1120 },
    'CompareEntry/Mobile/Search-Results-Hood': { kind: 'search', cfg: null, mob: 1, x: 3280, y: 1120 }
  };
  var ENTRY_SECTIONS = ['Hero', 'CompareLens', 'SearchEntry', 'QuickRoutes', 'ShortlistReentry', 'CompareProof', 'SiblingNavigation'];
  async function buildFrame(name) {
    var spec = FRAMES[name];
    if (!spec) { throw new Error('Unknown frame name: ' + name); }
    await loadFonts();
    var page = figma.root.children.find(function (p) { return p.name === 'SUN-10 Compare Entry'; });
    if (!page) { throw new Error('Page SUN-10 Compare Entry not found'); }
    await figma.setCurrentPageAsync(page);
    var frame;
    if (spec.reuse) {
      frame = page.children.find(function (n) { return n.name === name; });
      if (!frame) { throw new Error('Protected frame ' + name + ' is missing; aborting so gate evidence node ids are not recreated'); }
      var ph = frame.children.find(function (n) { return n.name === 'SUN-10 Remaining Sections Placeholder'; });
      if (ph) { ph.remove(); }
      frame.children.slice().forEach(function (n) { if (ENTRY_SECTIONS.indexOf(n.name) >= 0) { n.remove(); } });
      frame.itemSpacing = 16;
      frame.primaryAxisSizingMode = 'AUTO';
    } else {
      var old = page.children.find(function (n) { return n.name === name; });
      if (old) { old.remove(); }
      frame = figma.createFrame();
      frame.name = name;
      page.appendChild(frame);
      frame.layoutMode = 'VERTICAL';
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'FIXED';
      frame.resize(spec.mob ? 393 : 1440, 200);
      frame.x = spec.x;
      frame.y = spec.y;
      frame.fills = [P(INK)];
      frame.itemSpacing = spec.mob ? 16 : 28;
      frame.paddingTop = spec.mob ? 20 : 40;
      frame.paddingRight = spec.mob ? 18 : 48;
      frame.paddingBottom = spec.mob ? 28 : 56;
      frame.paddingLeft = spec.mob ? 18 : 48;
    }
    if (spec.kind === 'entry') {
      if (!spec.reuse) { topNav(frame, spec.cfg, spec.mob); }
      hero(frame, spec.cfg, spec.mob);
      lens(frame, spec.cfg, spec.mob);
      searchEntry(frame, spec.cfg, spec.mob);
      quickRoutes(frame, spec.cfg, spec.mob);
      shortlistReentry(frame, spec.mob);
      compareProof(frame, spec.cfg, spec.mob);
      siblingNav(frame, spec.cfg, spec.mob);
    } else {
      summaryMetrics(frame, spec.mob);
      highlights(frame, spec.mob);
      resultGrid(frame, spec.mob);
      shortlistEntry(frame, spec.mob);
      detailHint(frame, spec.mob);
    }
    return {
      frame: { id: frame.id, name: frame.name, width: frame.width, height: frame.height, x: frame.x, y: frame.y },
      sections: frame.children.map(function (n) { return { id: n.id, name: n.name }; }),
      primitives: frame.findAll(function (n) { return n.name.indexOf('CompareEntry/') === 0; }).length
    };
  }
  return { buildFrame: buildFrame, frames: Object.keys(FRAMES) };
})();`;

/*
 * setupChunks: the same setup logic as setupCode, split into sequential chunks so each
 * flattened chunk (split('\n').map(trim).join(' ')) stays <= 6,800 characters — the
 * empirical safe size for the Figma DevTools console input. Paste and run each chunk in
 * order; state passes between chunks only via globalThis.__ceEnv, and the final chunk
 * defines globalThis.__ceBuild with the exact same public API and build behavior as
 * setupCode. The 6 buildCommands below work unchanged afterwards.
 */
export const setupChunks = [
  String.raw`globalThis.__ceEnv = (function () {
  var ACCENT = '#F4FF3A';
  var INK = '#0D1117';
  var CARD = '#111827';
  var LINE = '#243447';
  var DEEP = '#0B1220';
  var CHIPBG = '#182235';
  var CHIPLN = '#334155';
  var OKBG = '#1B2A1F';
  var OKLN = '#59D26F';
  var OKTX = '#86EFAC';
  var TEXT = '#F8FAFC';
  var SOFT = '#E2E8F0';
  var MUTED = '#94A3B8';
  var FAINT = '#64748B';
  var fontsPromise = null;
  function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = Promise.all(['Regular', 'Medium', 'Semi Bold', 'Bold'].map(function (style) { return figma.loadFontAsync({ family: 'Inter', style: style }); }));
    }
    return fontsPromise;
  }
  function P(hex) {
    var h = hex.replace('#', '');
    return { type: 'SOLID', color: { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 } };
  }
  function T(parent, name, txt, size, weight, color, fill) {
    var t = figma.createText();
    t.name = name;
    t.fontName = { family: 'Inter', style: weight };
    t.characters = txt;
    t.fontSize = size;
    t.lineHeight = { unit: 'PIXELS', value: Math.round(size * 1.4) };
    t.fills = [P(color)];
    parent.appendChild(t);
    if (fill) {
      t.textAutoResize = 'HEIGHT';
      t.layoutSizingHorizontal = 'FILL';
    }
    return t;
  }
  function B(parent, name, o) {
    o = o || {};
    var f = figma.createFrame();
    f.name = name;
    f.layoutMode = o.r ? 'HORIZONTAL' : 'VERTICAL';
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
    f.counterAxisAlignItems = o.c ? 'CENTER' : 'MIN';
    f.itemSpacing = o.g == null ? 8 : o.g;
    if (o.p) {
      f.paddingTop = o.p[0];
      f.paddingRight = o.p[1];
      f.paddingBottom = o.p[2];
      f.paddingLeft = o.p[3];
    }
    f.fills = o.bg ? [P(o.bg)] : [];
    if (o.st) {
      f.strokes = [P(o.st)];
      f.strokeWeight = 1;
    }
    if (o.rad != null) { f.cornerRadius = o.rad; }
    parent.appendChild(f);
    if (o.fill) { f.layoutSizingHorizontal = 'FILL'; }
    return f;
  }
  function wrapRow(parent, name, gap) {
    var g = B(parent, name, { r: 1, g: gap, fill: 1 });
    g.layoutWrap = 'WRAP';
    g.counterAxisSpacing = gap;
    return g;
  }
  function pill(parent, name, txt, mode) {
    var bg = mode === 1 ? ACCENT : mode === 2 ? OKBG : CHIPBG;
    var st = mode === 1 ? ACCENT : mode === 2 ? OKLN : CHIPLN;
    var col = mode === 1 ? INK : mode === 2 ? OKTX : SOFT;
    var c = B(parent, name, { r: 1, c: 1, rad: 999, p: [7, 12, 7, 12], g: 4, bg: bg, st: st });
    T(c, name + '/Label', txt, 11, 'Semi Bold', col);
    return c;
  }
  function header(parent, eyebrow, title) {
    var h = B(parent, 'CompareEntry/SectionHeader', { g: 4, fill: 1 });
    T(h, 'CompareEntry/SectionHeader/Eyebrow', eyebrow, 11, 'Semi Bold', ACCENT);
    T(h, 'CompareEntry/SectionHeader/Title', title, 18, 'Bold', TEXT, 1);
    return h;
  }
  function sec(frame, name) {
    return B(frame, name, { g: 14, fill: 1 });
  }
  function sizeCard(card, mob, w) {
    if (mob) {
      card.layoutSizingHorizontal = 'FILL';
    } else {
      card.counterAxisSizingMode = 'FIXED';
      card.resize(w, card.height);
    }
  }
  function cardRow(parent, name, mob) {
    return B(parent, name, { r: mob ? 0 : 1, g: mob ? 12 : 16, fill: 1 });
  }
  function growCard(g, name, mob) {
    var c = B(g, name, { bg: CARD, st: LINE, rad: 16, p: [18, 18, 18, 18], g: 8 });
    if (mob) {
      c.layoutSizingHorizontal = 'FILL';
    } else {
      c.layoutGrow = 1;
      c.layoutAlign = 'STRETCH';
    }
    return c;
  }
  function infoCards(parent, name, nameFn, items, mob) {
    var g = cardRow(parent, name, mob);
    for (var i = 0; i < items.length; i++) {
      var c = growCard(g, nameFn(i), mob);
      T(c, nameFn(i) + '/Label', items[i][0], 14, 'Semi Bold', TEXT, 1);
      T(c, nameFn(i) + '/Body', items[i][1], 13, 'Regular', MUTED, 1);
    }
    return g;
  }
  return { ACCENT: ACCENT, INK: INK, CARD: CARD, LINE: LINE, DEEP: DEEP, CHIPBG: CHIPBG, CHIPLN: CHIPLN, OKBG: OKBG, OKLN: OKLN, OKTX: OKTX, TEXT: TEXT, SOFT: SOFT, MUTED: MUTED, FAINT: FAINT, loadFonts: loadFonts, P: P, T: T, B: B, wrapRow: wrapRow, pill: pill, header: header, sec: sec, sizeCard: sizeCard, cardRow: cardRow, growCard: growCard, infoCards: infoCards };
})();`,
  String.raw`(function () {
  var E = globalThis.__ceEnv;
  var P = E.P; var T = E.T; var B = E.B; var wrapRow = E.wrapRow; var pill = E.pill; var header = E.header; var sec = E.sec; var sizeCard = E.sizeCard; var cardRow = E.cardRow; var growCard = E.growCard; var infoCards = E.infoCards;
  var ACCENT = E.ACCENT; var INK = E.INK; var CARD = E.CARD; var LINE = E.LINE; var DEEP = E.DEEP; var CHIPBG = E.CHIPBG; var CHIPLN = E.CHIPLN; var OKBG = E.OKBG; var OKLN = E.OKLN; var OKTX = E.OKTX; var TEXT = E.TEXT; var SOFT = E.SOFT; var MUTED = E.MUTED; var FAINT = E.FAINT;
  function topNav(frame, cfg, mob) {
    var nav = B(frame, 'TopNav/Context', { bg: CARD, st: LINE, rad: 24, p: [16, 18, 16, 18], g: 14, fill: 1 });
    var row = B(nav, 'TopNav/Context/RouteIdentity', { r: 1, c: 1, g: 11, fill: 1 });
    var logo = B(row, 'TopNav/Context/LogoMark', { r: 1, c: 1, bg: ACCENT, rad: 13, p: [8, 13, 8, 13], g: 0 });
    T(logo, 'TopNav/Context/LogoInitial', 'L', 19, 'Bold', INK);
    var copy = B(row, 'TopNav/Context/RouteCopy', { g: 3 });
    T(copy, 'TopNav/Context/Eyebrow', cfg.eyebrow, 12, 'Semi Bold', ACCENT);
    T(copy, 'TopNav/Context/Title', cfg.title, mob ? 18 : 24, 'Bold', TEXT);
    var rail = wrapRow(nav, 'TopNav/Context/StatusRail', 8);
    var chips = [[mob ? 'MOBILE' : 'DESKTOP', mob ? '393' : '1440'], ['ROUTE', cfg.route], ['SUN-10', 'Full Build']];
    for (var i = 0; i < chips.length; i++) {
      var ok = chips[i][0] === 'SUN-10';
      var chip = B(rail, 'TopNav/Context/Chip/' + chips[i][0], { g: 2, p: [7, 10, 7, 10], rad: 13, bg: ok ? OKBG : CHIPBG, st: ok ? OKLN : CHIPLN });
      T(chip, 'TopNav/Context/Chip/' + chips[i][0] + '/Label', chips[i][0], 9, 'Bold', ok ? OKTX : MUTED);
      T(chip, 'TopNav/Context/Chip/' + chips[i][0] + '/Value', chips[i][1], 10, 'Semi Bold', TEXT);
    }
  }
  function hero(frame, cfg, mob) {
    var s = sec(frame, 'Hero');
    var z = B(s, 'CompareEntry/Hero', { bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [28, 28, 28, 28], g: 12, fill: 1 });
    var bc = B(z, 'CompareEntry/Hero/Breadcrumb', { r: 1, c: 1, g: 6 });
    T(bc, 'CompareEntry/Hero/Breadcrumb/Home', '홈', 12, 'Medium', FAINT);
    T(bc, 'CompareEntry/Hero/Breadcrumb/Divider', '/', 12, 'Medium', CHIPLN);
    T(bc, 'CompareEntry/Hero/Breadcrumb/Current', cfg.crumb, 12, 'Semi Bold', SOFT);
    T(z, 'CompareEntry/Hero/Eyebrow', cfg.eyebrow, 12, 'Semi Bold', ACCENT);
    T(z, 'CompareEntry/Hero/Title', cfg.title, mob ? 28 : 40, 'Bold', TEXT, 1);
    T(z, 'CompareEntry/Hero/Description', cfg.desc, mob ? 14 : 16, 'Regular', MUTED, 1);
    var chips = wrapRow(z, 'CompareEntry/Hero/QuickRouteChips', 8);
    for (var i = 0; i < cfg.tags.length; i++) {
      pill(chips, 'CompareEntry/Hero/QuickRouteChips/Chip-' + (i + 1), cfg.tags[i], i === 0 ? 1 : 0);
    }
  }
  function lens(frame, cfg, mob) {
    var s = sec(frame, 'CompareLens');
    header(s, 'Compare Lens', '비교 렌즈');
    infoCards(s, 'CompareEntry/CompareLens', function (i) { return 'CompareEntry/CompareLens/Signal-' + (i + 1); }, cfg.lens, mob);
  }
  function searchEntry(frame, cfg, mob) {
    var s = sec(frame, 'SearchEntry');
    var z = B(s, 'CompareEntry/SearchEntry', { bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [28, 28, 28, 28], g: 14, fill: 1 });
    var hd = B(z, 'CompareEntry/SearchEntry/Heading', { g: 4, fill: 1 });
    T(hd, 'CompareEntry/SearchEntry/Heading/Eyebrow', 'Search Compare Entry', 11, 'Semi Bold', ACCENT);
    T(hd, 'CompareEntry/SearchEntry/Heading/Title', cfg.seHead, mob ? 20 : 26, 'Bold', TEXT, 1);
    T(hd, 'CompareEntry/SearchEntry/Heading/Description', cfg.seDesc, 13, 'Regular', MUTED, 1);
    var row = B(z, 'CompareEntry/SearchEntry/ActionRow', { r: mob ? 0 : 1, c: mob ? 0 : 1, g: 10, fill: 1 });
    var bar = B(row, 'CompareEntry/SearchEntry/SearchBar', { r: 1, c: 1, bg: DEEP, st: CHIPLN, rad: 14, p: [13, 16, 13, 16], g: 8 });
    T(bar, 'CompareEntry/SearchEntry/SearchBar/Icon', '🔍', 13, 'Regular', FAINT);
    T(bar, 'CompareEntry/SearchEntry/SearchBar/Placeholder', cfg.seQuery, 14, 'Medium', SOFT);
    if (mob) { bar.layoutSizingHorizontal = 'FILL'; } else { bar.layoutGrow = 1; }
    var cta = B(row, 'CompareEntry/SearchEntry/PrimaryCTA', { r: 1, c: 1, bg: ACCENT, rad: 14, p: [13, 22, 13, 22] });
    T(cta, 'CompareEntry/SearchEntry/PrimaryCTA/Label', '가격 비교 시작', 14, 'Bold', INK);
    if (mob) {
      cta.layoutSizingHorizontal = 'FILL';
      cta.primaryAxisAlignItems = 'CENTER';
    }
  }
  function quickRoutes(frame, cfg, mob) {
    var s = sec(frame, 'QuickRoutes');
    header(s, 'Quick Routes', '빠른 진입 경로');
    var g = mob ? B(s, 'CompareEntry/QuickRoutes', { g: 12, fill: 1 }) : wrapRow(s, 'CompareEntry/QuickRoutes', 16);
    for (var i = 0; i < cfg.tags.length; i++) {
      var c = B(g, 'CompareEntry/QuickRouteCard', { bg: CARD, st: LINE, rad: 16, p: [16, 16, 16, 16], g: 10 });
      sizeCard(c, mob, 437);
      pill(c, 'CompareEntry/QuickRouteCard/Tag', cfg.tags[i], 0);
      T(c, 'CompareEntry/QuickRouteCard/Note', cfg.notes[i], 13, 'Regular', MUTED, 1);
    }
  }
  E.topNav = topNav; E.hero = hero; E.lens = lens; E.searchEntry = searchEntry; E.quickRoutes = quickRoutes;
})();`,
  String.raw`(function () {
  var E = globalThis.__ceEnv;
  var P = E.P; var T = E.T; var B = E.B; var wrapRow = E.wrapRow; var pill = E.pill; var header = E.header; var sec = E.sec; var sizeCard = E.sizeCard; var cardRow = E.cardRow; var growCard = E.growCard; var infoCards = E.infoCards;
  var ACCENT = E.ACCENT; var INK = E.INK; var CARD = E.CARD; var LINE = E.LINE; var DEEP = E.DEEP; var CHIPBG = E.CHIPBG; var CHIPLN = E.CHIPLN; var OKBG = E.OKBG; var OKLN = E.OKLN; var OKTX = E.OKTX; var TEXT = E.TEXT; var SOFT = E.SOFT; var MUTED = E.MUTED; var FAINT = E.FAINT;
  function shortlistBlock(parent, name, mob) {
    var z = B(parent, name, { r: mob ? 0 : 1, c: mob ? 0 : 1, bg: CARD, st: LINE, rad: 20, p: mob ? [20, 18, 20, 18] : [24, 28, 24, 28], g: mob ? 14 : 24, fill: 1 });
    var copy = B(z, name + '/Copy', { g: 6 });
    if (mob) { copy.layoutSizingHorizontal = 'FILL'; } else { copy.layoutGrow = 1; }
    T(copy, name + '/Eyebrow', 'Guest Compare Shortlist', 11, 'Semi Bold', ACCENT);
    T(copy, name + '/Heading', '로그인 없이 저장한 비교 후보', mob ? 17 : 20, 'Bold', TEXT, 1);
    T(copy, name + '/Description', '나중에 다시 볼 상품만 먼저 담아두고, 준비가 되면 각 compare page로 바로 이어서 확인할 수 있습니다.', 13, 'Regular', MUTED, 1);
    pill(copy, name + '/StatusPill', '{shortlistCount}개 저장됨', 2);
    var act = B(z, name + '/Actions', { r: 1, c: 1, g: 8 });
    pill(act, name + '/PrimaryCTA', '비교 이어보기', 1);
    pill(act, name + '/SecondaryCTA', '전체 비우기', 0);
  }
  function shortlistReentry(frame, mob) {
    var s = sec(frame, 'ShortlistReentry');
    shortlistBlock(s, 'CompareEntry/ShortlistReentry', mob);
  }
  function compareProof(frame, cfg, mob) {
    var s = sec(frame, 'CompareProof');
    header(s, 'Compare Proof', cfg.proofHead);
    T(s, 'CompareProof/Description', cfg.proofDesc, 13, 'Regular', MUTED, 1);
    infoCards(s, 'CompareEntry/Proof', function () { return 'CompareEntry/ProofCard'; }, cfg.proof, mob);
  }
  function siblingNav(frame, cfg, mob) {
    var s = sec(frame, 'SiblingNavigation');
    header(s, 'Sibling Navigation', cfg.sibTitle);
    var z = wrapRow(s, 'CompareEntry/SiblingNavigation', 8);
    for (var i = 0; i < cfg.sibs.length; i++) {
      pill(z, 'CompareEntry/SiblingNavigation/Chip-' + (i + 1), cfg.sibs[i], 0);
    }
  }
  function summaryMetrics(frame, mob) {
    var s = sec(frame, 'SearchSummaryMetrics');
    header(s, 'Home Search Result', '남자 후드 검색 결과 요약');
    var items = [['최저 결제가', '{lowestCheckoutPrice}원', '배송비를 반영한 예상 결제가 기준입니다.'], ['비교 가능 상품', '{compareReadyCount}개', '같은 상품이 2개 이상 쇼핑몰에서 잡힌 경우만 카운트합니다.'], ['최대 결제가 차이', '{priceSpread}원', '현재 결과 내 최고 결제가 {highestVisiblePrice}원까지 비교됩니다.']];
    var g = cardRow(s, 'CompareEntry/SearchSummaryMetrics', mob);
    for (var i = 0; i < items.length; i++) {
      var c = growCard(g, 'CompareEntry/SummaryMetricCard', mob);
      T(c, 'CompareEntry/SummaryMetricCard/Label', items[i][0], 12, 'Semi Bold', ACCENT);
      T(c, 'CompareEntry/SummaryMetricCard/Value', items[i][1], mob ? 22 : 26, 'Bold', TEXT);
      T(c, 'CompareEntry/SummaryMetricCard/Helper', items[i][2], 12, 'Regular', MUTED, 1);
    }
  }
  E.shortlistBlock = shortlistBlock; E.shortlistReentry = shortlistReentry; E.compareProof = compareProof; E.siblingNav = siblingNav; E.summaryMetrics = summaryMetrics;
})();`,
  String.raw`(function () {
  var E = globalThis.__ceEnv;
  var P = E.P; var T = E.T; var B = E.B; var wrapRow = E.wrapRow; var pill = E.pill; var header = E.header; var sec = E.sec; var sizeCard = E.sizeCard; var cardRow = E.cardRow; var growCard = E.growCard; var infoCards = E.infoCards; var shortlistBlock = E.shortlistBlock;
  var ACCENT = E.ACCENT; var INK = E.INK; var CARD = E.CARD; var LINE = E.LINE; var DEEP = E.DEEP; var CHIPBG = E.CHIPBG; var CHIPLN = E.CHIPLN; var OKBG = E.OKBG; var OKLN = E.OKLN; var OKTX = E.OKTX; var TEXT = E.TEXT; var SOFT = E.SOFT; var MUTED = E.MUTED; var FAINT = E.FAINT;
  function highlights(frame, mob) {
    var s = sec(frame, 'CompareHighlights');
    header(s, 'Compare Ready', '비교 하이라이트');
    T(s, 'CompareHighlights/Description', '여러 쇼핑몰에서 동시에 잡힌 상품만 모아 최저가와 가격 차이를 바로 확인하세요.', 13, 'Regular', MUTED, 1);
    var titles = mob ? ['남자 오버핏 후드 집업', '헤비웨이트 기모 후드티'] : ['남자 오버핏 후드 집업', '헤비웨이트 기모 후드티', '드라이 텍스처 후드 스웻'];
    var g = cardRow(s, 'CompareHighlights/Cards', mob);
    for (var i = 0; i < titles.length; i++) {
      var c = growCard(g, 'CompareEntry/HighlightCard', mob);
      var badges = wrapRow(c, 'CompareEntry/HighlightCard/Badges', 6);
      pill(badges, 'CompareEntry/HighlightCard/CompareReadyPill', 'Compare Ready', 1);
      pill(badges, 'CompareEntry/HighlightCard/MallCount', '{mallCount}개 쇼핑몰', 0);
      pill(badges, 'CompareEntry/HighlightCard/SpreadBadge', '최대 {priceSpread}원 차이', 0);
      pill(badges, 'CompareEntry/HighlightCard/PdpBadge', 'PDP 확인', 2);
      T(c, 'CompareEntry/HighlightCard/Title', titles[i], 15, 'Semi Bold', TEXT, 1);
      T(c, 'CompareEntry/HighlightCard/LowestPrice', '{lowestCheckoutPrice}원', 22, 'Bold', TEXT);
      T(c, 'CompareEntry/HighlightCard/BestCoupon', '혜택 적용 최저 {lowestCheckoutPrice}원', 12, 'Semi Bold', OKTX);
      var trust = wrapRow(c, 'CompareEntry/HighlightCard/TrustRow', 6);
      pill(trust, 'CompareEntry/HighlightCard/RetailerTrustPill', '공식몰 신뢰', 2);
      pill(trust, 'CompareEntry/HighlightCard/MatchStrategyPill', '모델명 매칭', 0);
      pill(trust, 'CompareEntry/HighlightCard/ConfidenceBadge', '매칭 신뢰 높음', 0);
      var ev = B(c, 'CompareEntry/HighlightCard/CheckoutEvidence', { bg: DEEP, rad: 10, p: [10, 12, 10, 12], g: 4, fill: 1 });
      T(ev, 'CompareEntry/HighlightCard/CheckoutEvidence/Line', '배송비 포함 예상 결제가 기준 · 옵션/사이즈 일치 확인', 12, 'Regular', MUTED, 1);
    }
  }
  function resultGrid(frame, mob) {
    var s = sec(frame, 'ResultGrid');
    header(s, 'Result Grid', '전체 검색 결과');
    var g = mob ? B(s, 'ResultGrid/Cards', { g: 12, fill: 1 }) : wrapRow(s, 'ResultGrid/Cards', 16);
    var rows = mob ? [['남자 후드 베이직 무지', '무신사'], ['세미오버 후드 스웻셔츠', '29CM']] : [['남자 후드 베이직 무지', '무신사'], ['세미오버 후드 스웻셔츠', '29CM'], ['헤비 코튼 후드 풀오버', 'W컨셉']];
    for (var i = 0; i < rows.length; i++) {
      var c = B(g, 'CompareEntry/ResultCard', { bg: CARD, st: LINE, rad: 16, p: [16, 16, 16, 16], g: 10 });
      sizeCard(c, mob, 437);
      var badges = wrapRow(c, 'CompareEntry/ResultCard/Badges', 6);
      pill(badges, 'CompareEntry/ResultCard/MallCompareBadge', '{mallCount}개 쇼핑몰 비교', 0);
      pill(badges, 'CompareEntry/ResultCard/TrustBadge', '신뢰 판매처', 2);
      pill(badges, 'CompareEntry/ResultCard/PdpBadge', 'PDP 확인', 2);
      T(c, 'CompareEntry/ResultCard/MallMeta', rows[i][1] + ' · 모델명 매칭', 11, 'Medium', FAINT);
      T(c, 'CompareEntry/ResultCard/Title', rows[i][0], 14, 'Semi Bold', TEXT, 1);
      var pr = B(c, 'CompareEntry/ResultCard/PriceRow', { r: 1, c: 1, g: 8 });
      T(pr, 'CompareEntry/ResultCard/LowestPrice', '{lowestCheckoutPrice}원', 18, 'Bold', TEXT);
      var strike = T(pr, 'CompareEntry/ResultCard/HighestPrice', '{highestVisiblePrice}원', 12, 'Regular', FAINT);
      strike.textDecoration = 'STRIKETHROUGH';
      var ev = B(c, 'CompareEntry/ResultCard/CheckoutEvidence', { bg: DEEP, rad: 10, p: [9, 11, 9, 11], g: 3, fill: 1 });
      T(ev, 'CompareEntry/ResultCard/CheckoutEvidence/Line', '배송비 포함 결제가 기준 · 쿠폰 적용 전', 11, 'Regular', MUTED, 1);
      T(ev, 'CompareEntry/ResultCard/CheckoutEvidence/Benefit', '혜택 적용 최저 {lowestCheckoutPrice}원', 11, 'Semi Bold', OKTX);
      pill(c, 'CompareEntry/ShortlistButton', '+ 비교 후보 담기', 1);
    }
  }
  function shortlistEntry(frame, mob) {
    var s = sec(frame, 'ShortlistEntry');
    shortlistBlock(s, 'CompareEntry/ShortlistSection', mob);
  }
  function detailHint(frame, mob) {
    var s = sec(frame, 'DetailEntryHint');
    var z = B(s, 'CompareEntry/DetailEntryHint', { bg: CARD, st: LINE, rad: 16, p: [16, 18, 16, 18], g: 6, fill: 1 });
    T(z, 'CompareEntry/DetailEntryHint/Label', 'Detail Entry', 11, 'Semi Bold', ACCENT);
    T(z, 'CompareEntry/DetailEntryHint/Body', '결과 카드에서 상세 페이지로 들어가면 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 바로 이어집니다.', 13, 'Regular', MUTED, 1);
  }
  E.highlights = highlights; E.resultGrid = resultGrid; E.shortlistEntry = shortlistEntry; E.detailHint = detailHint;
})();`,
  String.raw`(function () {
  var E = globalThis.__ceEnv;
  E.BRAND = {
    route: '/brand/musinsa',
    eyebrow: 'Brand Compare Entry',
    crumb: '무신사',
    title: '무신사 비교 시작',
    desc: '무신사의 트렌디한 패션 아이템들을 최저가로 비교해보세요.',
    tags: ['무신사스탠다드', '무신사 한정판', '무신사 세일'],
    notes: ['대표 라인부터 compare-ready 묶음 확인', '옵션과 재고가 갈리는 구간 먼저 체크', '세일/대체 상품까지 이어서 탐색'],
    lens: [['우선 보는 기준', '실구매가, 무료배송 조건, 회원가 적용 여부를 먼저 정리합니다.'], ['분리해서 봐야 하는 경우', '남녀 라인, 옵션 불일치, 모델명 차이가 보이면 같은 브랜드라도 다른 후보로 분리합니다.'], ['이 페이지의 역할', '무신사 검색을 바로 시작하고 shortlist에 담아 compare page까지 이어지는 입구로 씁니다.']],
    seHead: '무신사 안에서 바로 compare-ready 검색 시작',
    seDesc: '모델명, 라인명, 옵션 키워드를 바로 넣으면 홈 검색 결과에서 가격 spread와 옵션 일치 여부를 이어서 볼 수 있습니다.',
    seQuery: '무신사스탠다드',
    proofHead: '무신사 비교에서 먼저 드러나야 하는 신호',
    proofDesc: '브랜드 단위로 진입할 때는 판매처 수보다 공식몰 여부, 옵션 분리, 실구매가 근거가 먼저 보여야 합니다.',
    proof: [['브랜드 결과를 seller noise 없이 압축', '무신사 관련 검색어로 진입해도 generic seller보다 패션 전문몰과 공식 채널 결과를 먼저 끌어올리도록 정리했습니다.'], ['같은 라인은 묶고 다른 옵션은 분리', '브랜드/모델명뿐 아니라 옵션, 성별, 정규화 제목 신호까지 같이 봐서 compare-ready 그룹과 다른 상품을 분리합니다.'], ['결제 직전 판단 신호까지 바로 연결', '상세 페이지에서는 실구매가 근거, 재고, 사이즈/핏, 배송 정책까지 decision block으로 이어집니다.']],
    sibTitle: '다른 브랜드 비교 이동',
    sibs: ['나이키', '아디다스', '뉴발란스', '커버낫', '스투시', '마르디 메르크르디']
  };
  E.CATEGORY = {
    route: '/category/sneakers',
    eyebrow: 'Category Compare Entry',
    crumb: '스니커즈',
    title: '👟 스니커즈 비교 시작',
    desc: '인기 스니커즈 브랜드들의 가격을 한눈에 비교해보세요.',
    tags: ['운동화', '에어포스', '스탠스미스', '뉴발란스', '반스'],
    notes: ['대표 키워드로 price spread 확인', '브랜드 간 옵션/핏 차이 비교', '실구매가와 재고 분기 빠르게 확인', '대체 후보까지 확장해서 탐색', '카테고리 롱테일 검색으로 바로 이동'],
    lens: [['카테고리 진입에서 중요한 것', '스니커즈는 같은 아이템군 안에서 브랜드별 가격 차이와 옵션 지원 폭을 먼저 보여줘야 합니다.'], ['바로 확인할 비교 축', '실구매가, 옵션/사이즈 일치, 재고 상태, 배송 정책을 한 화면에서 이어서 봅니다.'], ['이 페이지의 역할', '스니커즈 검색을 홈 결과로 넘기고 shortlist와 상세 decision block까지 연결하는 compare funnel entry입니다.']],
    seHead: '스니커즈 카테고리에서 바로 비교 시작',
    seDesc: '카테고리 키워드와 모델명을 바로 넣으면 홈 결과에서 compare-ready 비율, 가격 차이, 옵션 일치 여부를 이어서 확인할 수 있습니다.',
    seQuery: '운동화',
    proofHead: '스니커즈 비교에서 먼저 봐야 하는 판단 축',
    proofDesc: '카테고리에서는 개별 브랜드 소개보다 가격 spread, 옵션 지원, 재고와 배송 정책을 먼저 보는 쪽이 실제 구매 판단에 가깝습니다.',
    proof: [['카테고리 대표 모델을 빠르게 모읍니다', '스니커즈에서 반복해서 비교되는 핵심 키워드를 먼저 열어 compare-ready 그룹이 잡히는 구간부터 볼 수 있게 했습니다.'], ['브랜드별 price spread를 바로 확인합니다', '같은 카테고리 안에서도 공식몰, 패션몰, 마켓 셀러 구성이 다르기 때문에 가격 차이가 벌어지는 구간을 바로 찾게 했습니다.'], ['결제 직전 판단 신호로 이어집니다', '비교 결과에서 상세 페이지로 들어가면 옵션, 핏, 재고, 배송 정책까지 decision block으로 바로 이어집니다.']],
    sibTitle: '인접 카테고리 이동',
    sibs: ['👕 맨투맨', '🧥 자켓', '👖 데님', '🎒 가방', '🧢 모자', '⌚ 시계']
  };
})();`,
  String.raw`globalThis.__ceBuild = (function () {
  var E = globalThis.__ceEnv;
  var P = E.P; var INK = E.INK; var loadFonts = E.loadFonts;
  var topNav = E.topNav; var hero = E.hero; var lens = E.lens; var searchEntry = E.searchEntry; var quickRoutes = E.quickRoutes; var shortlistReentry = E.shortlistReentry; var compareProof = E.compareProof; var siblingNav = E.siblingNav;
  var summaryMetrics = E.summaryMetrics; var highlights = E.highlights; var resultGrid = E.resultGrid; var shortlistEntry = E.shortlistEntry; var detailHint = E.detailHint;
  var BRAND = E.BRAND; var CATEGORY = E.CATEGORY;
  var FRAMES = {
    'CompareEntry/Desktop/Brand-Musinsa': { kind: 'entry', cfg: BRAND, mob: 0, x: 160, y: 120 },
    'CompareEntry/Desktop/Category-Sneakers': { kind: 'entry', cfg: CATEGORY, mob: 0, x: 1720, y: 120 },
    'CompareEntry/Desktop/Search-Results-Hood': { kind: 'search', cfg: null, mob: 0, x: 3280, y: 120 },
    'CompareEntry/Mobile/Brand-Musinsa': { kind: 'entry', cfg: BRAND, mob: 1, x: 160, y: 1120, reuse: 1 },
    'CompareEntry/Mobile/Category-Sneakers': { kind: 'entry', cfg: CATEGORY, mob: 1, x: 1720, y: 1120 },
    'CompareEntry/Mobile/Search-Results-Hood': { kind: 'search', cfg: null, mob: 1, x: 3280, y: 1120 }
  };
  var ENTRY_SECTIONS = ['Hero', 'CompareLens', 'SearchEntry', 'QuickRoutes', 'ShortlistReentry', 'CompareProof', 'SiblingNavigation'];
  async function buildFrame(name) {
    var spec = FRAMES[name];
    if (!spec) { throw new Error('Unknown frame name: ' + name); }
    await loadFonts();
    var page = figma.root.children.find(function (p) { return p.name === 'SUN-10 Compare Entry'; });
    if (!page) { throw new Error('Page SUN-10 Compare Entry not found'); }
    await figma.setCurrentPageAsync(page);
    var frame;
    if (spec.reuse) {
      frame = page.children.find(function (n) { return n.name === name; });
      if (!frame) { throw new Error('Protected frame ' + name + ' is missing; aborting so gate evidence node ids are not recreated'); }
      var ph = frame.children.find(function (n) { return n.name === 'SUN-10 Remaining Sections Placeholder'; });
      if (ph) { ph.remove(); }
      frame.children.slice().forEach(function (n) { if (ENTRY_SECTIONS.indexOf(n.name) >= 0) { n.remove(); } });
      frame.itemSpacing = 16;
      frame.primaryAxisSizingMode = 'AUTO';
    } else {
      var old = page.children.find(function (n) { return n.name === name; });
      if (old) { old.remove(); }
      frame = figma.createFrame();
      frame.name = name;
      page.appendChild(frame);
      frame.layoutMode = 'VERTICAL';
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'FIXED';
      frame.resize(spec.mob ? 393 : 1440, 200);
      frame.x = spec.x;
      frame.y = spec.y;
      frame.fills = [P(INK)];
      frame.itemSpacing = spec.mob ? 16 : 28;
      frame.paddingTop = spec.mob ? 20 : 40;
      frame.paddingRight = spec.mob ? 18 : 48;
      frame.paddingBottom = spec.mob ? 28 : 56;
      frame.paddingLeft = spec.mob ? 18 : 48;
    }
    if (spec.kind === 'entry') {
      if (!spec.reuse) { topNav(frame, spec.cfg, spec.mob); }
      hero(frame, spec.cfg, spec.mob);
      lens(frame, spec.cfg, spec.mob);
      searchEntry(frame, spec.cfg, spec.mob);
      quickRoutes(frame, spec.cfg, spec.mob);
      shortlistReentry(frame, spec.mob);
      compareProof(frame, spec.cfg, spec.mob);
      siblingNav(frame, spec.cfg, spec.mob);
    } else {
      summaryMetrics(frame, spec.mob);
      highlights(frame, spec.mob);
      resultGrid(frame, spec.mob);
      shortlistEntry(frame, spec.mob);
      detailHint(frame, spec.mob);
    }
    return {
      frame: { id: frame.id, name: frame.name, width: frame.width, height: frame.height, x: frame.x, y: frame.y },
      sections: frame.children.map(function (n) { return { id: n.id, name: n.name }; }),
      primitives: frame.findAll(function (n) { return n.name.indexOf('CompareEntry/') === 0; }).length
    };
  }
  return { buildFrame: buildFrame, frames: Object.keys(FRAMES) };
})();`,
];

export const buildCommands = [
  `__ceBuild.buildFrame('CompareEntry/Desktop/Brand-Musinsa').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
  `__ceBuild.buildFrame('CompareEntry/Desktop/Category-Sneakers').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
  `__ceBuild.buildFrame('CompareEntry/Desktop/Search-Results-Hood').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
  `__ceBuild.buildFrame('CompareEntry/Mobile/Brand-Musinsa').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
  `__ceBuild.buildFrame('CompareEntry/Mobile/Category-Sneakers').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
  `__ceBuild.buildFrame('CompareEntry/Mobile/Search-Results-Hood').then(r => console.log('CE_RESULT ' + JSON.stringify(r))).catch(e => console.error('CE_ERROR ' + e.message))`,
];
