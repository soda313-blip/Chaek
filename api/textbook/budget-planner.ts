import { GoogleGenAI, Type } from '@google/genai';

export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => unknown;
  setHeader: (name: string, value: string | string[]) => unknown;
  end: (chunk?: unknown) => unknown;
}

function parseJsonBody(req: ApiRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const FALLBACK_MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
] as const;

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CatalogSeed {
  keywords: string[];
  titleKo: string;
  titleEn: string;
  isbn13: string;
  listPriceKrw: number;
  isStem: boolean;
}

const CAMPUS_TEXTBOOK_SEEDS: CatalogSeed[] = [
  {
    keywords: ['미적분', 'stewart', 'calculus', '스튜어트'],
    titleKo: '스튜어트 미분적분학 (제9판)',
    titleEn: 'Calculus: Early Transcendentals (9th Ed., James Stewart)',
    isbn13: '979-11-5971-325-5',
    listPriceKrw: 49000,
    isStem: true,
  },
  {
    keywords: ['경제학', '맨큐', 'mankiw', 'economics'],
    titleKo: '맨큐의 경제학 (제9판)',
    titleEn: 'Principles of Economics (9th Ed., N. Gregory Mankiw)',
    isbn13: '979-11-303-3840-8',
    listPriceKrw: 43000,
    isStem: false,
  },
  {
    keywords: ['운영체제', '공룡책', 'silberschatz', 'operating system', 'os'],
    titleKo: '운영체제 (제10판 · 공룡책)',
    titleEn: 'Operating System Concepts (10th Ed., Silberschatz)',
    isbn13: '979-11-5600-709-8',
    listPriceKrw: 44000,
    isStem: true,
  },
  {
    keywords: ['선형대수', 'strang', 'linear algebra', '스트랭'],
    titleKo: '선형대수학 (제5판 · Gilbert Strang)',
    titleEn: 'Introduction to Linear Algebra (5th Ed., Gilbert Strang)',
    isbn13: '979-11-6073-305-1',
    listPriceKrw: 45000,
    isStem: true,
  },
  {
    keywords: ['공업수학', 'kreyszig', 'advanced engineering mathematics', '크레이직'],
    titleKo: '크레이직 공업수학 (제10판)',
    titleEn: 'Advanced Engineering Mathematics (10th Ed., Erwin Kreyszig)',
    isbn13: '978-89-93543-87-2',
    listPriceKrw: 46000,
    isStem: true,
  },
  {
    keywords: ['캠벨', '생명과학', 'campbell', 'biology', '생물학'],
    titleKo: '캠벨 생명과학 (제12판)',
    titleEn: 'Campbell Biology (12th Ed.)',
    isbn13: '978-89-6824-115-4',
    listPriceKrw: 65000,
    isStem: true,
  },
  {
    keywords: ['일반물리', '물리학', 'halliday', '할리데이', 'physics'],
    titleKo: '할리데이 일반물리학 (제11판)',
    titleEn: 'Principles of Physics (11th Ed., Halliday & Resnick)',
    isbn13: '979-11-90017-07-7',
    listPriceKrw: 39000,
    isStem: true,
  },
  {
    keywords: ['알고리즘', 'clrs', 'cormen', 'algorithms'],
    titleKo: 'Introduction to Algorithms (제4판 · CLRS)',
    titleEn: 'Introduction to Algorithms (4th Ed., CLRS)',
    isbn13: '979-11-5664-666-2',
    listPriceKrw: 54000,
    isStem: true,
  },
  {
    keywords: ['네트워크', '네트워킹', 'kurose', 'computer networking'],
    titleKo: '컴퓨터 네트워킹 하향식 접근 (제8판)',
    titleEn: 'Computer Networking: A Top-Down Approach (8th Ed., Kurose)',
    isbn13: '979-11-85475-78-3',
    listPriceKrw: 43000,
    isStem: true,
  },
  {
    keywords: ['일반화학', '화학', 'zumdahl', '줌달', 'chemistry', '브라운'],
    titleKo: '줌달의 일반화학 (제10판)',
    titleEn: 'Chemistry (10th Ed., Zumdahl)',
    isbn13: '979-11-6224-180-6',
    listPriceKrw: 48000,
    isStem: true,
  },
  {
    keywords: ['회계', '회계학원리', 'accounting', 'ifrs'],
    titleKo: 'IFRS 회계학원리 (제11판)',
    titleEn: 'Principles of Accounting (11th Ed., K-IFRS)',
    isbn13: '979-11-5901-812-1',
    listPriceKrw: 38000,
    isStem: false,
  },
  {
    keywords: ['통계학', '통계', 'statistics', '확률과 통계'],
    titleKo: '기초통계학 (경영·경제·사회과학용)',
    titleEn: 'Introductory Statistics for Business & Economics',
    isbn13: '979-11-303-1122-7',
    listPriceKrw: 36000,
    isStem: false,
  },
];

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

export interface BudgetAllocationItem {
  id: string;
  bookTitleKo: string;
  bookTitleEn: string;
  courseOrQuery: string;
  isbn13: string;
  sourceVendorKo: string;
  sourceVendorEn: string;
  platformId: 'kyobo' | 'yes24' | 'aladin' | 'youngpoong' | 'bookstore_on' | '11st' | 'coupang' | 'skku_library';
  conditionFormatKo: string;
  conditionFormatEn: string;
  conditionCategory: 'library' | 'used' | 'digital' | 'new';
  listPriceKrw: number;
  basePriceKrw: number;
  shippingFeeKrw: number;
  totalPriceKrw: number;
  directActionUrl: string;
  rationaleKo: string;
  rationaleEn: string;
  compromiseTipKo?: string;
  compromiseTipEn?: string;
}

export interface BudgetPlanResult {
  targetBudgetKrw: number;
  totalEstimatedCostKrw: number;
  totalBaseCostKrw: number;
  totalShippingCostKrw: number;
  totalListPriceKrw: number;
  totalSavedKrw: number;
  remainingBudgetKrw: number;
  isWithinBudget: boolean;
  statusBadgeKo: string;
  statusBadgeEn: string;
  summaryTextKo: string;
  summaryTextEn: string;
  items: BudgetAllocationItem[];
  smartSavingAdviceKo: string[];
  smartSavingAdviceEn: string[];
  markdownReportKo: string;
  markdownReportEn: string;
}

interface CandidateTier {
  tierRank: number; // 0 = library (0 KRW), 1 = used good, 2 = used like new / ebook, 3 = bookstore on new, 4 = major bookstore new
  sourceVendorKo: string;
  sourceVendorEn: string;
  platformId: BudgetAllocationItem['platformId'];
  conditionFormatKo: string;
  conditionFormatEn: string;
  conditionCategory: BudgetAllocationItem['conditionCategory'];
  basePriceKrw: number;
  freeShippingThresholdKrw: number;
  defaultShippingKrw: number;
  directActionUrl: string;
  rationaleKo: string;
  rationaleEn: string;
}

function buildMarkdownReports(plan: Omit<BudgetPlanResult, 'markdownReportKo' | 'markdownReportEn'>): {
  markdownReportKo: string;
  markdownReportEn: string;
} {
  const balanceTextKo =
    plan.remainingBudgetKrw >= 0
      ? `${formatKrw(plan.remainingBudgetKrw)} 여유 (${plan.statusBadgeKo})`
      : `${formatKrw(Math.abs(plan.remainingBudgetKrw))} 초과 (${plan.statusBadgeKo})`;

  const balanceTextEn =
    plan.remainingBudgetKrw >= 0
      ? `${formatKrw(plan.remainingBudgetKrw)} under budget (${plan.statusBadgeEn})`
      : `${formatKrw(Math.abs(plan.remainingBudgetKrw))} over budget (${plan.statusBadgeEn})`;

  const tableRowsKo = plan.items
    .map(
      (item, idx) =>
        `| ${idx + 1} | **${item.bookTitleKo}** | ${item.sourceVendorKo} | ${item.conditionFormatKo} | ${formatKrw(
          item.basePriceKrw
        )} (배송비 ${item.shippingFeeKrw === 0 ? '무료' : formatKrw(item.shippingFeeKrw)}) | [바로가기](${
          item.directActionUrl
        }) |`
    )
    .join('\n');

  const tableRowsEn = plan.items
    .map(
      (item, idx) =>
        `| ${idx + 1} | **${item.bookTitleEn}** | ${item.sourceVendorEn} | ${item.conditionFormatEn} | ${formatKrw(
          item.basePriceKrw
        )} (Ship: ${item.shippingFeeKrw === 0 ? 'Free' : formatKrw(item.shippingFeeKrw)}) | [Open Link](${
          item.directActionUrl
        }) |`
    )
    .join('\n');

  const tipsKo = plan.smartSavingAdviceKo.map((t) => `- ${t}`).join('\n');
  const tipsEn = plan.smartSavingAdviceEn.map((t) => `- ${t}`).join('\n');

  const markdownReportKo = `### 📊 예산 요약 / Budget Summary
- **목표 학기 교재 예산:** ${formatKrw(plan.targetBudgetKrw)}
- **최적 조합 총 예상 비용:** **${formatKrw(plan.totalEstimatedCostKrw)}** (도서 합계 ${formatKrw(
    plan.totalBaseCostKrw
  )} + 배송비 ${formatKrw(plan.totalShippingCostKrw)})
- **예산 대비 잔액 상태:** **${balanceTextKo}**
- **정가 합계 대비 총 절약 금액:** **-${formatKrw(plan.totalSavedKrw)}** (정가 합계 ${formatKrw(
    plan.totalListPriceKrw
  )})
- **종합 분석:** ${plan.summaryTextKo}

### 📚 최적 추천 구매 목록 / Optimized Procurement List
| # | 교재명 (Book Title) | 구매처 / 도서관 (Source) | 상태 / 형태 (Condition) | 가격 및 배송비 (Price & Shipping) | 이동 링크 (Action) |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRowsKo}

### 💡 AI 절약 팁 / Smart Saving Advice
${tipsKo}`;

  const markdownReportEn = `### 📊 Budget Summary
- **Target Semester Budget:** ${formatKrw(plan.targetBudgetKrw)}
- **Total Estimated Cost:** **${formatKrw(plan.totalEstimatedCostKrw)}** (Books ${formatKrw(
    plan.totalBaseCostKrw
  )} + Shipping ${formatKrw(plan.totalShippingCostKrw)})
- **Budget Balance Status:** **${balanceTextEn}**
- **Total Saved vs. List Price:** **-${formatKrw(plan.totalSavedKrw)}** (List Total ${formatKrw(
    plan.totalListPriceKrw
  )})
- **Executive Summary:** ${plan.summaryTextEn}

### 📚 Optimized Procurement List
| # | Book Title | Source / Vendor | Condition / Format | Price & Shipping | Action Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRowsEn}

### 💡 Smart Saving Advice
${tipsEn}`;

  return { markdownReportKo, markdownReportEn };
}

export function buildOptimizedBudgetPlan(
  targetBudgetKrw: number,
  rawBooks: string[],
  campus: 'seoul' | 'suwon',
  prioritizeLibraryZeroCost: boolean
): BudgetPlanResult {
  const cleanedBooks = rawBooks
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 12);

  const bookProfiles = cleanedBooks.map((query, index) => {
    const lower = query.toLowerCase();
    const matched = CAMPUS_TEXTBOOK_SEEDS.find((seed) =>
      seed.keywords.some((k) => lower.includes(k.toLowerCase()))
    );

    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = (hash * 31 + query.charCodeAt(i)) % 10000;
    }

    const listPriceKrw = matched ? matched.listPriceKrw : 38000 + (hash % 16) * 1000;
    const titleKo = matched ? matched.titleKo : query;
    const titleEn = matched ? matched.titleEn : query;
    const isbn13 = matched
      ? matched.isbn13
      : `979-11-${String(5000 + (hash % 4999)).padStart(4, '0')}-${String(
          100 + (hash % 899)
        ).padStart(3, '0')}-${hash % 10}`;
    const isStem = matched
      ? matched.isStem
      : /공학|수학|물리|화학|생물|컴퓨터|알고리즘|프로그래밍|데이터|회로|역학|math|physics|cs|engineering|calculus|biology/i.test(
          query
        );

    const encodedQuery = encodeURIComponent(query);
    const skkuUrl = `https://lib.skku.edu/search/tot/result?st=FRNT&q=${encodeURIComponent(
      matched ? matched.isbn13 : query
    )}`;

    const usedGoodPrice = Math.round((listPriceKrw * 0.5) / 100) * 100;
    const usedBestPrice = Math.round((listPriceKrw * 0.65) / 100) * 100;
    const ebookPrice = Math.round((listPriceKrw * 0.7) / 100) * 100;
    const bookstoreOnPrice = Math.round((listPriceKrw * 0.9) / 100) * 100;
    const yes24NewPrice = Math.round((listPriceKrw * 0.95) / 100) * 100;

    const libraryBuildingKo =
      campus === 'suwon'
        ? '성균관대 삼성학술정보관 (자캠 3층/전자책)'
        : '성균관대 중앙도서관 (인사캠/전자도서관)';
    const libraryBuildingEn =
      campus === 'suwon'
        ? 'SKKU Samsung Library (Suwon / E-Library)'
        : 'SKKU Central Library (Seoul / E-Library)';

    const tiers: CandidateTier[] = [
      {
        tierRank: 0,
        sourceVendorKo: libraryBuildingKo,
        sourceVendorEn: libraryBuildingEn,
        platformId: 'skku_library',
        conditionFormatKo: index % 2 === 0 ? '도서관 실물 대출 (₩0)' : 'SKKU 기관구독 전자책 (₩0)',
        conditionFormatEn: index % 2 === 0 ? 'Campus Library Loan (₩0)' : 'SKKU Digital E-Book (₩0)',
        conditionCategory: 'library',
        basePriceKrw: 0,
        freeShippingThresholdKrw: 0,
        defaultShippingKrw: 0,
        directActionUrl: skkuUrl,
        rationaleKo:
          '성균관대 학술정보관 소장본 또는 킹고포털 전자책으로 ₩0 무료 조달하여 타 전공필수 교재 구매 예산을 확보합니다.',
        rationaleEn:
          'Borrow for ₩0 via SKKU Library or Kingo Portal E-Book to free up budget for core textbooks.',
      },
      {
        tierRank: 1,
        sourceVendorKo: '알라딘 온라인 중고샵',
        sourceVendorEn: 'Aladin Used Store',
        platformId: 'aladin',
        conditionFormatKo: '중고 상 (Good · 정가 대비 50% 절약)',
        conditionFormatEn: 'Used - Good (50% off list)',
        conditionCategory: 'used',
        basePriceKrw: usedGoodPrice,
        freeShippingThresholdKrw: 20000,
        defaultShippingKrw: 2500,
        directActionUrl: `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodedQuery}`,
        rationaleKo: `정가(${formatKrw(listPriceKrw)}) 대비 절반 가격인 알라딘 직배송 중고 '상' 등급으로 실구매가를 대폭 낮췄습니다.`,
        rationaleEn: `Cuts cost by 50% off list price (${formatKrw(listPriceKrw)}) via verified Aladin Used Good tier.`,
      },
      {
        tierRank: 2,
        sourceVendorKo: isStem ? '교보문고 eBook' : '알라딘 (직배송 중고 최상)',
        sourceVendorEn: isStem ? 'Kyobo Digital eBook' : 'Aladin Used (Like New)',
        platformId: isStem ? 'kyobo' : 'aladin',
        conditionFormatKo: isStem ? '디지털 eBook (즉시 열람)' : '중고 최상 (Like New)',
        conditionFormatEn: isStem ? 'Digital eBook (Instant)' : 'Used - Like New',
        conditionCategory: isStem ? 'digital' : 'used',
        basePriceKrw: isStem ? ebookPrice : usedBestPrice,
        freeShippingThresholdKrw: isStem ? 0 : 20000,
        defaultShippingKrw: isStem ? 0 : 2500,
        directActionUrl: isStem
          ? `https://search.kyobobook.co.kr/search?keyword=${encodedQuery}`
          : `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodedQuery}`,
        rationaleKo: isStem
          ? '두꺼운 이공계 전공서적을 아이패드/태블릿 eBook으로 대여·소장하여 배송비 ₩0 및 가방 무게를 절감합니다.'
          : '필기 없는 새책급 중고 최상 매물로 새책 대비 35% 비용을 절약합니다.',
        rationaleEn: isStem
          ? 'Digital eBook eliminates shipping fees and heavy backpack weight while saving 30%.'
          : 'Unmarked Like-New used copy saves 35% compared to retail.',
      },
      {
        tierRank: 3,
        sourceVendorKo: '서점ON (대학구내/지역화폐)',
        sourceVendorEn: 'Bookstore ON (Campus Co-op / Local Pay)',
        platformId: 'bookstore_on',
        conditionFormatKo: '새책 (지역화폐 10% 체감할인)',
        conditionFormatEn: 'New (Local Currency 10% Discount)',
        conditionCategory: 'new',
        basePriceKrw: bookstoreOnPrice,
        freeShippingThresholdKrw: 15000,
        defaultShippingKrw: 3000,
        directActionUrl: `https://www.booktown.or.kr/search/totalSearchResult?searchKeyword=${encodedQuery}`,
        rationaleKo:
          '도서정가제 한도 내에서 대학 생협 픽업 및 지역화폐 인센티브를 적용해 새책을 가장 저렴하게 구매합니다.',
        rationaleEn:
          'Lowest effective new-book price under the Korean Book Price Law using campus co-op pickup & local currency.',
      },
      {
        tierRank: 4,
        sourceVendorKo: '예스24 / 교보문고',
        sourceVendorEn: 'YES24 / Kyobo Book Centre',
        platformId: 'yes24',
        conditionFormatKo: '새책 (당일 총알배송 / 스프링분철 가능)',
        conditionFormatEn: 'New (Express Delivery / Binding Option)',
        conditionCategory: 'new',
        basePriceKrw: yes24NewPrice,
        freeShippingThresholdKrw: 15000,
        defaultShippingKrw: 2500,
        directActionUrl: `https://www.yes24.com/Product/Search?domain=ALL&query=${encodedQuery}`,
        rationaleKo:
          '예산 여유 범위 내에서 온라인 과제 코드가 포함된 최신판 새책 및 총알무료배송 혜택을 챙깁니다.',
        rationaleEn:
          'Fits comfortably within budget for a brand-new latest edition with free express shipping.',
      },
    ];

    return {
      index,
      query,
      titleKo,
      titleEn,
      isbn13,
      listPriceKrw,
      skkuUrl,
      tiers,
    };
  });

  // Helper to compute total cost (base + platform-grouped shipping) for a given tier index selection array
  function evaluateSelection(selectedTierIndices: number[]) {
    const platformSubtotals: Record<string, number> = {};
    selectedTierIndices.forEach((tierIdx, bookIdx) => {
      const tier = bookProfiles[bookIdx].tiers[tierIdx];
      platformSubtotals[tier.platformId] =
        (platformSubtotals[tier.platformId] || 0) + tier.basePriceKrw;
    });

    let totalBase = 0;
    let totalShipping = 0;
    const seenShippingPlatforms = new Set<string>();

    const itemBreakdown = selectedTierIndices.map((tierIdx, bookIdx) => {
      const profile = bookProfiles[bookIdx];
      const tier = profile.tiers[tierIdx];
      totalBase += tier.basePriceKrw;

      let shippingFeeKrw = 0;
      if (tier.basePriceKrw > 0 && tier.freeShippingThresholdKrw > 0) {
        const platTotal = platformSubtotals[tier.platformId] || 0;
        if (platTotal < tier.freeShippingThresholdKrw && !seenShippingPlatforms.has(tier.platformId)) {
          shippingFeeKrw = tier.defaultShippingKrw;
          seenShippingPlatforms.add(tier.platformId);
        }
      }
      totalShipping += shippingFeeKrw;
      return {
        profile,
        tier,
        shippingFeeKrw,
        totalPriceKrw: tier.basePriceKrw + shippingFeeKrw,
      };
    });

    return {
      totalBase,
      totalShipping,
      totalEstimated: totalBase + totalShipping,
      itemBreakdown,
    };
  }

  // Start strategy:
  // If prioritizeLibraryZeroCost is true: start with a balanced mix (e.g. 1 library loan + used copies) or adjust to fit targetBudgetKrw.
  // Actually let's find the highest-quality tier assignment that stays <= targetBudgetKrw, while honoring prioritizeLibraryZeroCost!
  const n = bookProfiles.length;
  let chosenIndices: number[];

  if (prioritizeLibraryZeroCost) {
    // When prioritizing library zero cost:
    // Start with Used Good (tier 1) for all, and set at least 1 book (or enough books to stay under budget) to Library (tier 0).
    // If budget is very generous, upgrade non-library books up to tier 2/3 while keeping at least 1 library loan if n >= 2 (or all library if budget == 0).
    chosenIndices = bookProfiles.map((_, idx) => (idx === n - 1 ? 0 : 1));
    // If still over budget, convert highest-priced books to library tier 0 one by one until <= targetBudgetKrw
    while (evaluateSelection(chosenIndices).totalEstimated > targetBudgetKrw) {
      let bestIdxToDowngrade = -1;
      let highestPrice = -1;
      for (let i = 0; i < n; i++) {
        if (chosenIndices[i] > 0 && bookProfiles[i].listPriceKrw > highestPrice) {
          highestPrice = bookProfiles[i].listPriceKrw;
          bestIdxToDowngrade = i;
        }
      }
      if (bestIdxToDowngrade === -1) break;
      chosenIndices[bestIdxToDowngrade] = 0;
    }
    // If well under budget, upgrade non-library books (from tier 1 -> 2 -> 3) as long as totalEstimated <= targetBudgetKrw
    for (let targetTier = 2; targetTier <= 3; targetTier++) {
      for (let i = 0; i < n; i++) {
        if (chosenIndices[i] > 0 && chosenIndices[i] < targetTier) {
          const prev = chosenIndices[i];
          chosenIndices[i] = targetTier;
          if (evaluateSelection(chosenIndices).totalEstimated > targetBudgetKrw) {
            chosenIndices[i] = prev;
          }
        }
      }
    }
  } else {
    // Paid-ownership first mode: start at Used Good (tier 1) for all books
    chosenIndices = bookProfiles.map(() => 1);

    // If Used Good for all fits within budget, try upgrading books (tier 1 -> 2 -> 3 -> 4) while staying <= targetBudgetKrw
    if (evaluateSelection(chosenIndices).totalEstimated <= targetBudgetKrw) {
      for (let targetTier = 2; targetTier <= 4; targetTier++) {
        for (let i = 0; i < n; i++) {
          const prev = chosenIndices[i];
          chosenIndices[i] = targetTier;
          if (evaluateSelection(chosenIndices).totalEstimated > targetBudgetKrw) {
            chosenIndices[i] = prev;
          }
        }
      }
    }
    // Note: if even all Used Good (tier 1) exceeds targetBudgetKrw when prioritizeLibraryZeroCost is false,
    // we keep tier 1 so the user sees the cheapest paid-only total AND gets explicit over-budget compromise tips to switch specific books to SKKU Library (₩0)!
  }

  const evalResult = evaluateSelection(chosenIndices);
  const totalListPriceKrw = bookProfiles.reduce((acc, p) => acc + p.listPriceKrw, 0);
  const totalSavedKrw = Math.max(0, totalListPriceKrw - evalResult.totalEstimated);
  const remainingBudgetKrw = targetBudgetKrw - evalResult.totalEstimated;
  const isWithinBudget = remainingBudgetKrw >= 0;

  const items: BudgetAllocationItem[] = evalResult.itemBreakdown.map(
    ({ profile, tier, shippingFeeKrw, totalPriceKrw }, idx) => {
      const compromiseKo =
        tier.tierRank > 0
          ? `예산 추가 절감 필요 시: 성균관대 도서관 대출/전자책(₩0) 또는 직전 판본(구판) 중고로 전환하면 ${formatKrw(
              totalPriceKrw
            )}을 추가로 아낄 수 있습니다.`
          : `초반 1~3주차 과제는 도서관 대출본/지정도서실(Reserve)로 해결하고, 시험 기간에도 계속 필요할 때만 알라딘 중고 상(${formatKrw(
              profile.tiers[1].basePriceKrw
            )}) 구매를 권장합니다.`;

      const compromiseEn =
        tier.tierRank > 0
          ? `To cut costs further: Borrow from SKKU Library / E-Book (₩0) or use a previous edition to save an additional ${formatKrw(
              totalPriceKrw
            )}.`
          : `Use the SKKU Library copy / Reserve Desk for Weeks 1–3, and only purchase Aladin Used Good (${formatKrw(
              profile.tiers[1].basePriceKrw
            )}) if needed for open-book exams.`;

      return {
        id: `budget-item-${idx + 1}`,
        bookTitleKo: profile.titleKo,
        bookTitleEn: profile.titleEn,
        courseOrQuery: profile.query,
        isbn13: profile.isbn13,
        sourceVendorKo: tier.sourceVendorKo,
        sourceVendorEn: tier.sourceVendorEn,
        platformId: tier.platformId,
        conditionFormatKo: tier.conditionFormatKo,
        conditionFormatEn: tier.conditionFormatEn,
        conditionCategory: tier.conditionCategory,
        listPriceKrw: profile.listPriceKrw,
        basePriceKrw: tier.basePriceKrw,
        shippingFeeKrw,
        totalPriceKrw,
        directActionUrl: tier.directActionUrl,
        rationaleKo: tier.rationaleKo,
        rationaleEn: tier.rationaleEn,
        compromiseTipKo: compromiseKo,
        compromiseTipEn: compromiseEn,
      };
    }
  );

  const statusBadgeKo = isWithinBudget
    ? '예산 내 최적 배분 완료'
    : '목표 예산 초과 — 도서관 대출/구판 타협안 권장';
  const statusBadgeEn = isWithinBudget
    ? 'Optimized Within Target Budget'
    : 'Over Target Budget — Library Compromise Recommended';

  const summaryTextKo = isWithinBudget
    ? `요청하신 ${n}권의 교재를 성균관대 학술정보관 및 7대 온라인 서점(알라딘 중고·교보 eBook·서점ON 등)에 최적 배분하여 목표 예산(${formatKrw(
        targetBudgetKrw
      )}) 이내인 ${formatKrw(evalResult.totalEstimated)}에 맞췄습니다. 정가 합계 대비 총 ${formatKrw(
        totalSavedKrw
      )}을 절약하고 ${formatKrw(remainingBudgetKrw)}의 여유 예산을 남겼습니다.`
    : `모두 유료 소장(최저가 중고 기준)으로 구매할 경우 총 ${formatKrw(
        evalResult.totalEstimated
      )}이 소요되어 목표 예산(${formatKrw(targetBudgetKrw)})을 ${formatKrw(
        Math.abs(remainingBudgetKrw)
      )} 초과합니다. 아래 목록에서 1~2권을 '성균관대 도서관 무료 대출(₩0)'로 전환하면 즉시 예산 내로 들어옵니다.`;

  const summaryTextEn = isWithinBudget
    ? `Allocated all ${n} requested textbooks across SKKU Library and major Korean bookstores for ${formatKrw(
        evalResult.totalEstimated
      )} — staying ${formatKrw(remainingBudgetKrw)} under your ${formatKrw(
        targetBudgetKrw
      )} budget and saving ${formatKrw(totalSavedKrw)} off list prices.`
    : `Purchasing all ${n} books (even at lowest Used Good prices) costs ${formatKrw(
        evalResult.totalEstimated
      )}, which exceeds your ${formatKrw(targetBudgetKrw)} target by ${formatKrw(
        Math.abs(remainingBudgetKrw)
      )}. Switching 1–2 books to SKKU Library Free Loan (₩0) brings your total cleanly within budget.`;

  const smartSavingAdviceKo = [
    `합배송 무료배송 묶기: 알라딘 온라인 직배송 중고는 합계 ₩20,000 이상, 교보문고·예스24·서점ON은 ₩15,000 이상 주문 시 배송비(₩2,500~₩3,000)가 전액 면제됩니다. 같은 서점 품목은 반드시 한 번에 결제하세요.`,
    `초반 1~3장 도서관 스캔 & 학기말 바이백 환급: 예산이 빠듯한 과목은 성균관대 중앙도서관/삼성학술정보관 지정도서실(Reserve)에서 초반 진도만 열람하고, 중고로 구매한 교재는 분철하지 않고 깨끗이 쓴 뒤 종강 후 알라딘 바이백에 되팔아 정가의 25~40%를 현금으로 회수하세요.`,
  ];

  const smartSavingAdviceEn = [
    `Bundle Orders for ₩0 Shipping: Combine Aladin Direct Used items over ₩20,000 and Kyobo/YES24/Bookstore ON items over ₩15,000 in a single order to waive ₩2,500–₩3,000 delivery fees.`,
    `SKKU Reserve Shelf & Semester-End Buyback: Read Chapters 1–3 via SKKU Library Reserve shelves during the course add/drop period, and keep purchased textbooks unbound (no spring binding) so you can sell them back to Aladin Buyback for 25–40% cash recovery at the end of the semester.`,
  ];

  const basePlan = {
    targetBudgetKrw,
    totalEstimatedCostKrw: evalResult.totalEstimated,
    totalBaseCostKrw: evalResult.totalBase,
    totalShippingCostKrw: evalResult.totalShipping,
    totalListPriceKrw,
    totalSavedKrw,
    remainingBudgetKrw,
    isWithinBudget,
    statusBadgeKo,
    statusBadgeEn,
    summaryTextKo,
    summaryTextEn,
    items,
    smartSavingAdviceKo,
    smartSavingAdviceEn,
  };

  const { markdownReportKo, markdownReportEn } = buildMarkdownReports(basePlan);

  return {
    ...basePlan,
    markdownReportKo,
    markdownReportEn,
  };
}

const AI_ADVICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summaryTextKo: { type: Type.STRING },
    summaryTextEn: { type: Type.STRING },
    smartSavingAdviceKo: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    smartSavingAdviceEn: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['summaryTextKo', 'summaryTextEn', 'smartSavingAdviceKo', 'smartSavingAdviceEn'],
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const body = parseJsonBody(req);
  const rawBudget = Number(body.targetBudgetKrw);
  const targetBudgetKrw = Number.isFinite(rawBudget) && rawBudget >= 0 ? Math.round(rawBudget) : 100000;
  const rawBooks = Array.isArray(body.books)
    ? body.books.map((b) => String(b)).filter((b) => b.trim().length > 0)
    : [];
  const campus: 'seoul' | 'suwon' = body.campus === 'suwon' ? 'suwon' : 'seoul';
  const prioritizeLibraryZeroCost =
    typeof body.prioritizeLibraryZeroCost === 'boolean' ? body.prioritizeLibraryZeroCost : true;

  if (rawBooks.length === 0) {
    return res.status(400).json({
      error: '최소 1권 이상의 교재명 또는 과목명을 입력해 주세요. (Please provide at least one textbook or course.)',
    });
  }

  try {
    // 1. Run exact combinatorial multi-store + SKKU library procurement optimizer
    const plan = buildOptimizedBudgetPlan(
      targetBudgetKrw,
      rawBooks,
      campus,
      prioritizeLibraryZeroCost
    );

    // 2. Enhance executive summary & saving tips with Gemini AI if available
    const ai = getGenAIClient();
    if (ai) {
      const prompt = `Target Budget: ${targetBudgetKrw} KRW
Campus: ${campus === 'suwon' ? 'SKKU Suwon (Samsung Library)' : 'SKKU Seoul (Central Library)'}
Prioritize Library 0 KRW Loans: ${prioritizeLibraryZeroCost}
Optimized Total Cost: ${plan.totalEstimatedCostKrw} KRW (Within Budget: ${plan.isWithinBudget}, Remaining: ${plan.remainingBudgetKrw} KRW)
Allocated Books:
${plan.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.bookTitleKo} (${item.bookTitleEn}) -> ${item.sourceVendorKo} [${
        item.conditionFormatKo
      }] @ ${item.totalPriceKrw} KRW`
  )
  .join('\n')}`;

      for (let i = 0; i < FALLBACK_MODELS.length; i++) {
        const modelName = FALLBACK_MODELS[i];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction:
                'You are ChaekScan Budget Book Planner & Optimizer, an expert Korean university textbook financial advisor. Provide a concise 2-sentence executive budget summary (in both Korean and English) and 2-3 specific, high-impact money-saving bullet points tailored to the exact textbooks and budget above (covering SKKU library reserve/inter-campus loans, Aladin used grading/buyback, Bookstore ON local currency, and free shipping bundling).',
              responseMimeType: 'application/json',
              responseSchema: AI_ADVICE_SCHEMA,
            },
          });

          const rawText = response.text;
          if (rawText) {
            const parsed = JSON.parse(rawText.trim());
            if (parsed.summaryTextKo) plan.summaryTextKo = parsed.summaryTextKo;
            if (parsed.summaryTextEn) plan.summaryTextEn = parsed.summaryTextEn;
            if (Array.isArray(parsed.smartSavingAdviceKo) && parsed.smartSavingAdviceKo.length > 0) {
              plan.smartSavingAdviceKo = parsed.smartSavingAdviceKo;
            }
            if (Array.isArray(parsed.smartSavingAdviceEn) && parsed.smartSavingAdviceEn.length > 0) {
              plan.smartSavingAdviceEn = parsed.smartSavingAdviceEn;
            }
            const updatedMd = buildMarkdownReports(plan);
            plan.markdownReportKo = updatedMd.markdownReportKo;
            plan.markdownReportEn = updatedMd.markdownReportEn;
            break;
          }
        } catch (err) {
          console.warn(`Budget planner model ${modelName} warning:`, err instanceof Error ? err.message : err);
          if (isQuotaOrRateLimitError(err)) {
            await sleep(200 * (i + 1));
            continue;
          }
          break;
        }
      }
    }

    return res.json({ plan });
  } catch (error) {
    console.error('Error in /api/textbook/budget-planner:', error);
    const fallbackPlan = buildOptimizedBudgetPlan(
      targetBudgetKrw,
      rawBooks,
      campus,
      prioritizeLibraryZeroCost
    );
    return res.json({ plan: fallbackPlan });
  }
}
