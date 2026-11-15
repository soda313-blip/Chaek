import { AppLanguage } from '../types/textbook';

export interface TranslationStrings {
  brandTitle: string;
  skkuBadge: string;
  campusSeoul: string;
  campusSuwon: string;
  campusSeoulTooltip: string;
  campusSuwonTooltip: string;
  bookBagBtn: (count: number) => string;

  // Workspace Mode Tabs
  modeSearchTab: string;
  modeBudgetTab: string;

  // Hero & Search
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  searchingBtn: string;
  clearSearch: string;
  tryPrefix: string;
  tryItems: { label: string; query: string }[];
  searchingStatus: (query: string) => string;
  calculatingShipping: string;

  // Book Summary
  listPriceLabel: string;
  cheapestOverallLabel: string;
  lowestNewLabel: string;
  fastestDeliveryLabel: string;

  // SKKU Section
  skkuSectionTitle: string;
  skkuSectionSubtitle: string;
  skkuFreeBadge: string;
  skkuFreeSub: string;
  skkuSavingsNotice: (store: string, storePrice: string, savings: string) => string;
  skkuDirectCatalogBtn: string;
  skkuShelfHoldingsTitle: (campusName: string) => string;
  skkuStrictFilterNote: string;
  skkuNoShelfCopies: (campusName: string) => string;
  skkuTryAlternativesNote: string;
  skkuRepositoryLabel: string;
  skkuCallNumberLabel: string;
  skkuShelfLocationLabel: string;
  skkuCheckStatusBtn: string;
  skkuInterCampusBadge: string;
  skkuInterCampusTitle: (otherCampusName: string) => string;
  skkuInterCampusNote: string;
  skkuInterCampusAction: string;
  skkuEbookBadge: string;
  skkuEbookTitle: string;
  skkuEbookSub: string;
  skkuEbookAction: string;
  skkuLiveNoticeTitle: string;
  skkuLiveNoticeBody: string;

  // Filters & Sorting
  filters: {
    all: string;
    new: string;
    used: string;
    digital: string;
  };
  sortModes: {
    total_cost: string;
    effective_cost: string;
    speed: string;
  };
  filterCoupangWow: string;
  filterStorePickup: string;
  exportCsvBtn: string;

  // Table
  tableHeaders: {
    rank: string;
    store: string;
    condition: string;
    basePrice: string;
    shipping: string;
    totalPrice: string;
    netPrice: string;
    delivery: string;
    action: string;
  };
  freeShippingBadge: string;
  inBookBagBtn: string;
  addToBookBagBtn: string;
  visitStoreBtn: string;
  detailsBtn: string;
  tipLabel: string;
  rewardPointsLabel: string;
  noOffersFound: string;
  resetFiltersBtn: string;

  // Alternatives & Advisor
  alternativesTitle: string;
  alternativesFree: string;
  alternativesNote: string;
  advisorTitle: string;
  advisorSampleChips: string[];
  advisorPlaceholder: string;
  advisorAskBtn: string;

  // Book Bag Drawer
  bagDrawerTitle: (count: number) => string;
  bagCloseAria: string;
  bagEmptyTitle: string;
  bagEmptyDesc: string;
  bagDisclaimer: string;
  bagSubtotalBooks: string;
  bagShippingTotal: string;
  bagTotalEstimated: string;
  bagTotalSaved: string;
  bagRemoveAria: string;
  bagGoToStore: string;
  bagOptimizeBtn: string;

  // Budget Book Planner & Optimizer
  budgetHeroTitle: string;
  budgetHeroSubtitle: string;
  budgetTargetLabel: string;
  budgetPresetLabel: string;
  budgetBooksLabel: string;
  budgetBookInputPlaceholder: string;
  budgetAddBookBtn: string;
  budgetPresetsTitle: string;
  budgetPresetBundles: {
    label: string;
    budget: number;
    books: string[];
  }[];
  budgetPrioritizeLibraryLabel: string;
  budgetPrioritizeLibraryDesc: string;
  budgetGenerateBtn: string;
  budgetGeneratingBtn: string;
  budgetSummaryHeading: string;
  budgetTargetCardLabel: string;
  budgetEstimatedCardLabel: string;
  budgetRemainingCardLabel: string;
  budgetTotalSavedCardLabel: string;
  budgetListHeading: string;
  budgetColBook: string;
  budgetColSource: string;
  budgetColCondition: string;
  budgetColPriceShipping: string;
  budgetColAction: string;
  budgetOpenLinkBtn: string;
  budgetSwitchToLibraryBtn: string;
  budgetAdviceHeading: string;
  budgetExportSectionTitle: string;
  budgetViewVisualTab: string;
  budgetViewMarkdownTab: string;
  budgetViewJsonTab: string;
  budgetCopyBtn: string;
  budgetCopiedBtn: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationStrings> = {
  ko: {
    brandTitle: 'ChaekScan',
    skkuBadge: '성균관대',
    campusSeoul: '인사캠 (서울)',
    campusSuwon: '자캠 (수원)',
    campusSeoulTooltip: '인문사회과학캠퍼스 (서울) 중앙도서관·법학도서관·존경각',
    campusSuwonTooltip: '자연과학캠퍼스 (수원) 삼성학술정보관·의학도서관',
    bookBagBtn: (count) => `책가방 (${count})`,

    modeSearchTab: '개별 교재 최저가 검색',
    modeBudgetTab: '예산 맞춤 북 플래너 (AI Optimizer)',

    heroTitle: '대학 교재 최저가 & 도서관 소장 비교기',
    heroSubtitle:
      '교보문고, 예스24, 알라딘, 영풍문고, 서점ON, 11번가, 쿠팡 배송비 포함 실구매가 및 성균관대 학술정보관 대출 현황을 한 번에 비교하세요.',
    searchPlaceholder:
      '교재명, 저자, 또는 13자리 ISBN을 입력하세요 (예: 미분적분학, 맨큐의 경제학, 9791160733877)',
    searchBtn: '검색',
    searchingBtn: '검색 중...',
    clearSearch: '검색어 지우기',
    tryPrefix: '추천 검색:',
    tryItems: [
      { label: '미분적분학', query: '미분적분학' },
      { label: '맨큐의 경제학', query: '맨큐의 경제학' },
      { label: '운영체제', query: '운영체제' },
      { label: '맥머리 유기화학', query: '맥머리 유기화학' },
    ],
    searchingStatus: (query) => `7개 국내 서점 및 성균관대 도서관에서 "${query}" 검색 및 비교 중...`,
    calculatingShipping: '배송비 및 실구매가 계산 중',

    listPriceLabel: '도서 정가',
    cheapestOverallLabel: '최저 실구매가',
    lowestNewLabel: '새책 최저가',
    fastestDeliveryLabel: '가장 빠른 배송',

    skkuSectionTitle: '도서관 소장 현황 및 무료 대출 비교',
    skkuSectionSubtitle: '· 엄격 대출가능(Shelf-Available) 기준 필터링',
    skkuFreeBadge: '도서관 이용 시',
    skkuFreeSub: '₩0 (무료 대출)',
    skkuSavingsNotice: (store, storePrice, savings) =>
      `💡 구매 비용 절약: 도서관 실물 대출 또는 전자도서관을 이용하면 온라인 최저가(${store} 기준 ${storePrice}) 대비 ${savings} 전액을 절약할 수 있습니다.`,
    skkuDirectCatalogBtn: 'SKKU 통합검색 바로가기',
    skkuShelfHoldingsTitle: (campusName) => `${campusName} 현장 소장 자료:`,
    skkuStrictFilterNote: '※ 대출 중인 자료는 자동 제외되어 현재 서가 비치본만 표시됩니다.',
    skkuNoShelfCopies: (campusName) =>
      `현재 ${campusName} 서가에는 대출 가능한 실물 책이 모두 대출 중이거나 비치되어 있지 않습니다.`,
    skkuTryAlternativesNote: '아래 전자책(E-Book) 또는 타 캠퍼스 상호대차 신청 도서를 확인해 보세요.',
    skkuRepositoryLabel: '소장처 / 건물:',
    skkuCallNumberLabel: '청구기호 (Call No.):',
    skkuShelfLocationLabel: '서가 위치 안내:',
    skkuCheckStatusBtn: '확인하기 (실시간 대출 현황 조회)',
    skkuInterCampusBadge: '상호대차 가능',
    skkuInterCampusTitle: (otherCampusName) => `${otherCampusName} 소장 중 (상호대차 신청 가능)`,
    skkuInterCampusNote: '신청 시 1~2일 내 소속 캠퍼스 도서관 수령',
    skkuInterCampusAction: '확인하기 (실시간 대출 현황 및 상호대차 신청)',
    skkuEbookBadge: '[💻 전자책 바로보기 / E-Book Available]',
    skkuEbookTitle: 'SKKU 기관구독 전자도서관 (Web / 모바일 앱)',
    skkuEbookSub: '대출 대기 없음 · 24시간 교외접속',
    skkuEbookAction: '확인하기 (실시간 전자책 열람)',
    skkuLiveNoticeTitle: '실시간 연동 투명성 안내:',
    skkuLiveNoticeBody:
      '도서관 현장 열람석 지정 및 분 단위 대출 예약 현황은 교외 보안 정책상 브라우저에서 직접 스크랩되지 않으므로, 각 카드의 [확인하기 (실시간 대출 현황 조회)] 버튼을 통해 SKKU 학술정보관 공식 페이지에서 최신 1분 대출/예약 상태를 확인하시기 바랍니다.',

    filters: {
      all: '전체',
      new: '새책',
      used: '중고',
      digital: '전자책',
    },
    sortModes: {
      total_cost: '최저가순',
      effective_cost: '적립금차감순',
      speed: '빠른배송순',
    },
    filterCoupangWow: '쿠팡 와우회원',
    filterStorePickup: '매장 방문수령만',
    exportCsvBtn: 'CSV 저장',

    tableHeaders: {
      rank: '#',
      store: '서점',
      condition: '상태',
      basePrice: '도서 가격',
      shipping: '배송비',
      totalPrice: '총 실구매가',
      netPrice: '체감가 (적립금 차감)',
      delivery: '배송/수령 예정일',
      action: '선택',
    },
    freeShippingBadge: '무료배송',
    inBookBagBtn: '담김',
    addToBookBagBtn: '책가방',
    visitStoreBtn: '서점 이동',
    detailsBtn: '상세 정보',
    tipLabel: '학생 팁:',
    rewardPointsLabel: '예상 적립금:',
    noOffersFound: '선택한 필터 조건에 맞는 서점 옵션이 없습니다.',
    resetFiltersBtn: '필터 초기화',

    alternativesTitle: '더 저렴한 대안 (전자책 대여 & 이전 판본 구판)',
    alternativesFree: '₩0 (무료)',
    alternativesNote: '주의사항:',
    advisorTitle: '판본 호환성 & 분철·바이백 질문하기',
    advisorSampleChips: [
      '구판으로 공부해도 되나요?',
      '분철 vs 학기말 알라딘 바이백?',
    ],
    advisorPlaceholder: '교재 관련 질문을 입력하세요...',
    advisorAskBtn: '질문하기',

    bagDrawerTitle: (count) => `학기 교재 책가방 (${count})`,
    bagCloseAria: '책가방 닫기',
    bagEmptyTitle: '책가방이 비어 있습니다.',
    bagEmptyDesc: '검색 결과에서 원하는 서점 옵션을 책가방에 담아 학기 총비용과 배송비를 편리하게 비교해 보세요.',
    bagDisclaimer:
      'ℹ️ ChaekScan은 교재 가격 비교 및 학기 예산 정리를 위한 플래너이며 실제 결제가 이루어지는 사이트가 아닙니다. 실제 구매는 각 서점의 "서점 이동" 링크를 통해 진행됩니다.',
    bagSubtotalBooks: '도서 정가/판매가 합계',
    bagShippingTotal: '예상 배송비',
    bagTotalEstimated: '학기 예상 총비용',
    bagTotalSaved: '정가 대비 절약 금액',
    bagRemoveAria: '책가방에서 삭제',
    bagGoToStore: '서점 이동',
    bagOptimizeBtn: '책가방 목록으로 예산 맞춤 최적화 실행',

    budgetHeroTitle: '학기 예산 맞춤 북 플래너 & AI 최적화',
    budgetHeroSubtitle:
      '목표 예산(원)과 이번 학기 수강 과목·필수 교재 목록을 입력하면 성균관대 도서관 무료 대출(₩0)과 7대 서점 새책·중고·전자책 조합을 계산해 예산 내 최적 구매 플랜을 설계합니다.',
    budgetTargetLabel: '목표 학기 교재 예산 (KRW)',
    budgetPresetLabel: '빠른 예산 설정:',
    budgetBooksLabel: '수강 과목 또는 필수 교재 목록',
    budgetBookInputPlaceholder: '교재명 또는 과목명 입력 후 Enter (쉼표로 여러 권 동시 입력 가능)',
    budgetAddBookBtn: '+ 목록 추가',
    budgetPresetsTitle: '학과별 추천 샘플 패키지 불러오기:',
    budgetPresetBundles: [
      {
        label: '컴퓨터·소프트웨어 4과목 (예산 ₩70,000)',
        budget: 70000,
        books: ['운영체제 (공룡책)', 'Introduction to Algorithms (CLRS)', '선형대수학 (Strang)', '컴퓨터 네트워킹 (Kurose)'],
      },
      {
        label: '이공계 1학년 기초 4과목 (예산 ₩80,000)',
        budget: 80000,
        books: ['스튜어트 미분적분학', '할리데이 일반물리학', '줌달의 일반화학', '캠벨 생명과학'],
      },
      {
        label: '경영·경제 핵심 3과목 (예산 ₩50,000)',
        budget: 50000,
        books: ['맨큐의 경제학', 'IFRS 회계학원리', '기초통계학'],
      },
    ],
    budgetPrioritizeLibraryLabel: '성균관대 도서관 무료 대출 & 전자책(₩0) 우선 배정 허용',
    budgetPrioritizeLibraryDesc:
      '예산 초과 방지 및 최대 절약을 위해 도서관 비치본/전자도서관 열람 가능 교재를 ₩0으로 우선 배정합니다.',
    budgetGenerateBtn: '예산 맞춤 최적 구매 플랜 생성',
    budgetGeneratingBtn: '7대 서점 시세·배송비 및 SKKU 도서관 최적 조합 계산 중...',
    budgetSummaryHeading: '📊 예산 요약 / Budget Summary',
    budgetTargetCardLabel: '목표 예산 (Target Budget)',
    budgetEstimatedCardLabel: '최적 조합 총비용 (Total Cost)',
    budgetRemainingCardLabel: '예산 잔액 / 상태 (Balance)',
    budgetTotalSavedCardLabel: '정가 대비 총 절약 (Total Saved)',
    budgetListHeading: '📚 최적 추천 구매 목록 / Optimized Procurement List',
    budgetColBook: '교재명 (Book Title)',
    budgetColSource: '구매처 또는 도서관 (Source / Vendor)',
    budgetColCondition: '상태 / 형태 (Condition / Format)',
    budgetColPriceShipping: '가격 및 배송비 (Price & Shipping)',
    budgetColAction: '이동 링크 (Direct Action)',
    budgetOpenLinkBtn: '바로가기',
    budgetSwitchToLibraryBtn: '도서관 ₩0 전환',
    budgetAdviceHeading: '💡 AI 절약 팁 / Smart Saving Advice',
    budgetExportSectionTitle: '출력 포맷 보기 (Structured Markdown & JSON Summary)',
    budgetViewVisualTab: '인터랙티브 표 보기',
    budgetViewMarkdownTab: 'Markdown 요약 리포트',
    budgetViewJsonTab: 'JSON 데이터 요약',
    budgetCopyBtn: '클립보드 복사',
    budgetCopiedBtn: '복사 완료!',
  },
  en: {
    brandTitle: 'ChaekScan',
    skkuBadge: 'SKKU',
    campusSeoul: 'Seoul Campus',
    campusSuwon: 'Suwon Campus',
    campusSeoulTooltip: 'Humanities & Social Sciences (Seoul): Central Library, Law Library, Jongyeonggak',
    campusSuwonTooltip: 'Natural Sciences (Suwon): Samsung Library, Medical Library',
    bookBagBtn: (count) => `Book Bag (${count})`,

    modeSearchTab: 'Single Textbook Search',
    modeBudgetTab: 'Budget Book Planner (AI Optimizer)',

    heroTitle: 'University Textbook Price & Library Finder',
    heroSubtitle:
      'Compare total prices with shipping across Kyobo, YES24, Aladin, Youngpoong, Bookstore ON, 11st, Coupang, and check SKKU library availability.',
    searchPlaceholder:
      'Search by textbook title, author, or 13-digit ISBN (e.g. Calculus, Mankiw Economics, 9791160733877)',
    searchBtn: 'Search',
    searchingBtn: 'Searching...',
    clearSearch: 'Clear search',
    tryPrefix: 'Try:',
    tryItems: [
      { label: 'Stewart Calculus', query: '미분적분학' },
      { label: 'Mankiw Economics', query: '맨큐의 경제학' },
      { label: 'Operating Systems', query: '운영체제' },
      { label: 'Organic Chemistry', query: '맥머리 유기화학' },
    ],
    searchingStatus: (query) => `Comparing 7 Korean bookstores and SKKU Library for "${query}"...`,
    calculatingShipping: 'Calculating shipping fees & net cost',

    listPriceLabel: 'List Price',
    cheapestOverallLabel: 'Cheapest Total',
    lowestNewLabel: 'Lowest New',
    fastestDeliveryLabel: 'Fastest Delivery',

    skkuSectionTitle: 'SKKU Library Availability & Free Loan',
    skkuSectionSubtitle: '· Strict Shelf-Available Filtering',
    skkuFreeBadge: 'Campus Library',
    skkuFreeSub: '₩0 (Free Loan)',
    skkuSavingsNotice: (store, storePrice, savings) =>
      `💡 Cost Savings: Borrowing from the library or using e-Books saves the full ${savings} compared to the lowest store price (${store}: ${storePrice}).`,
    skkuDirectCatalogBtn: 'Open SKKU Catalog Search',
    skkuShelfHoldingsTitle: (campusName) => `${campusName} On-Shelf Holdings:`,
    skkuStrictFilterNote: '※ Checked-out copies are excluded; only shelf-available copies are shown.',
    skkuNoShelfCopies: (campusName) =>
      `No physical copies are currently available on shelf at ${campusName}.`,
    skkuTryAlternativesNote: 'Check digital e-Books or apply for inter-campus loan from the other campus below.',
    skkuRepositoryLabel: 'Location / Building:',
    skkuCallNumberLabel: 'Call Number:',
    skkuShelfLocationLabel: 'Shelf Guidance:',
    skkuCheckStatusBtn: 'Check Live Status (SKKU Catalog)',
    skkuInterCampusBadge: 'Inter-Campus Loan',
    skkuInterCampusTitle: (otherCampusName) => `Held at ${otherCampusName} (Inter-Campus Loan Available)`,
    skkuInterCampusNote: 'Delivered to your campus library within 1–2 business days',
    skkuInterCampusAction: 'Check Live Status & Request Inter-Campus Loan',
    skkuEbookBadge: '[💻 E-Book Available / Instant Access]',
    skkuEbookTitle: 'SKKU Institutional E-Library (Web / App)',
    skkuEbookSub: 'No checkout wait · 24/7 off-campus access',
    skkuEbookAction: 'Check Live Status (Read E-Book)',
    skkuLiveNoticeTitle: 'Live Status Notice:',
    skkuLiveNoticeBody:
      'Per campus authentication policies, live 1-minute shelf reservation locks cannot be scraped directly in-browser. Please click [Check Live Status] on any card to confirm real-time availability in SKKU official catalog.',

    filters: {
      all: 'All',
      new: 'New',
      used: 'Used',
      digital: 'eBook',
    },
    sortModes: {
      total_cost: 'Lowest Price',
      effective_cost: 'After Points',
      speed: 'Fastest',
    },
    filterCoupangWow: 'Coupang WOW',
    filterStorePickup: 'Store Pickup Only',
    exportCsvBtn: 'CSV Export',

    tableHeaders: {
      rank: '#',
      store: 'Store',
      condition: 'Condition',
      basePrice: 'Book Price',
      shipping: 'Shipping',
      totalPrice: 'Total Price',
      netPrice: 'Net Price',
      delivery: 'Delivery',
      action: 'Action',
    },
    freeShippingBadge: 'Free',
    inBookBagBtn: 'In Bag',
    addToBookBagBtn: 'Book Bag',
    visitStoreBtn: 'Visit',
    detailsBtn: 'Details',
    tipLabel: 'Student Tip:',
    rewardPointsLabel: 'Reward Points:',
    noOffersFound: 'No offers match the selected filters.',
    resetFiltersBtn: 'Reset Filters',

    alternativesTitle: 'Cheaper Alternatives (eBook & Previous Editions)',
    alternativesFree: '₩0 (Free)',
    alternativesNote: 'Note:',
    advisorTitle: 'Ask About Edition or Binding (분철/바이백)',
    advisorSampleChips: [
      'Can I use a previous edition?',
      'Book binding vs selling back used?',
    ],
    advisorPlaceholder: 'Ask a question about this textbook...',
    advisorAskBtn: 'Ask',

    bagDrawerTitle: (count) => `Semester Book Bag (${count})`,
    bagCloseAria: 'Close book bag',
    bagEmptyTitle: 'Your book bag is empty.',
    bagEmptyDesc: 'Add textbooks from your search results to compare semester totals and shipping fees.',
    bagDisclaimer:
      'ℹ️ ChaekScan is a comparison and semester planning organizer, not an online checkout portal. Click "Go to store" to purchase directly on each platform.',
    bagSubtotalBooks: 'Books Subtotal',
    bagShippingTotal: 'Estimated Shipping',
    bagTotalEstimated: 'Estimated Semester Total',
    bagTotalSaved: 'Estimated Total Savings',
    bagRemoveAria: 'Remove from book bag',
    bagGoToStore: 'Go to store',
    bagOptimizeBtn: 'Optimize Book Bag in Budget Planner',

    budgetHeroTitle: 'Budget Book Planner & AI Optimizer',
    budgetHeroSubtitle:
      'Enter your target budget (in KRW) and required textbooks or courses. ChaekScan allocates SKKU Library free loans (₩0) and the cheapest New, Used, or eBook options across 7 Korean bookstores to stay within your budget.',
    budgetTargetLabel: 'Target Semester Budget (KRW)',
    budgetPresetLabel: 'Quick Budget:',
    budgetBooksLabel: 'Required Textbooks or Courses',
    budgetBookInputPlaceholder: 'Enter textbook or course title & press Enter (comma-separated supported)',
    budgetAddBookBtn: '+ Add Book',
    budgetPresetsTitle: 'Load Sample Course Bundles:',
    budgetPresetBundles: [
      {
        label: 'CS & Software 4-Course Bundle (₩70,000)',
        budget: 70000,
        books: ['Operating System Concepts', 'Introduction to Algorithms (CLRS)', 'Linear Algebra (Strang)', 'Computer Networking (Kurose)'],
      },
      {
        label: 'STEM Freshman 4-Course Bundle (₩80,000)',
        budget: 80000,
        books: ['Stewart Calculus', 'Halliday Physics', 'Zumdahl Chemistry', 'Campbell Biology'],
      },
      {
        label: 'Business & Econ 3-Course Bundle (₩50,000)',
        budget: 50000,
        books: ['Mankiw Principles of Economics', 'IFRS Principles of Accounting', 'Introductory Statistics'],
      },
    ],
    budgetPrioritizeLibraryLabel: 'Prioritize SKKU Library Free Loans & E-Books (₩0)',
    budgetPrioritizeLibraryDesc:
      'Automatically assigns campus library or institutional e-Book copies (₩0) where needed to keep your total cost within budget.',
    budgetGenerateBtn: 'Generate Optimized Budget Plan',
    budgetGeneratingBtn: 'Optimizing across 7 Korean bookstores & SKKU Library...',
    budgetSummaryHeading: '📊 예산 요약 / Budget Summary',
    budgetTargetCardLabel: 'Target Budget',
    budgetEstimatedCardLabel: 'Total Estimated Cost',
    budgetRemainingCardLabel: 'Remaining Balance / Status',
    budgetTotalSavedCardLabel: 'Total Saved vs. List Price',
    budgetListHeading: '📚 최적 추천 구매 목록 / Optimized Procurement List',
    budgetColBook: 'Book Title (교재명)',
    budgetColSource: 'Source / Vendor (구매처 또는 도서관)',
    budgetColCondition: 'Condition / Format (상태 / 형태)',
    budgetColPriceShipping: 'Price & Shipping (가격 및 배송비)',
    budgetColAction: 'Direct Action Link',
    budgetOpenLinkBtn: 'Open Link',
    budgetSwitchToLibraryBtn: 'Switch to Library ₩0',
    budgetAdviceHeading: '💡 AI 절약 팁 / Smart Saving Advice',
    budgetExportSectionTitle: 'Structured Markdown & JSON Summary',
    budgetViewVisualTab: 'Interactive Table',
    budgetViewMarkdownTab: 'Markdown Summary',
    budgetViewJsonTab: 'JSON Summary',
    budgetCopyBtn: 'Copy to Clipboard',
    budgetCopiedBtn: 'Copied!',
  },
  zh: {
    brandTitle: 'ChaekScan',
    skkuBadge: '成均馆大',
    campusSeoul: '人文校区 (首尔)',
    campusSuwon: '自然校区 (水原)',
    campusSeoulTooltip: '人文社会科学校区 (首尔)：中央图书馆 · 法学图书馆 · 尊经阁',
    campusSuwonTooltip: '自然科学校区 (水原)：三星学术信息馆 · 医学图书馆',
    bookBagBtn: (count) => `书包 (${count})`,

    modeSearchTab: '单本教材比价搜索',
    modeBudgetTab: '预算购书规划器 (AI Optimizer)',

    heroTitle: '大学教材全网比价 & 图书馆馆藏查询',
    heroSubtitle:
      '一站式对比教保文库、YES24、阿拉丁、永丰文库、书店ON、11街、酷澎含运费实付价，并实时核对成均馆大学图书馆馆藏状态。',
    searchPlaceholder:
      '输入教材名称、作者或13位ISBN（如：微积分、曼昆经济学、9791160733877）',
    searchBtn: '搜索',
    searchingBtn: '搜索中...',
    clearSearch: '清除搜索词',
    tryPrefix: '热门教材：',
    tryItems: [
      { label: '微积分 (Stewart)', query: '미분적분학' },
      { label: '曼昆经济学原理', query: '맨큐의 경제학' },
      { label: '操作系统概念', query: '운영체제' },
      { label: '有机化学 (McMurry)', query: '맥머리 유기화학' },
    ],
    searchingStatus: (query) => `正在对比7大韩国书店及成均馆大学图书馆馆藏：“${query}”...`,
    calculatingShipping: '正在计算运费及实付总价',

    listPriceLabel: '教材定价',
    cheapestOverallLabel: '最低实付价',
    lowestNewLabel: '新书最低价',
    fastestDeliveryLabel: '最快送达',

    skkuSectionTitle: '成均馆大学图书馆馆藏 & 免费借阅',
    skkuSectionSubtitle: '· 严格筛选在架可借 (Shelf-Available) 馆藏',
    skkuFreeBadge: '图书馆借阅',
    skkuFreeSub: '₩0 (免费借阅)',
    skkuSavingsNotice: (store, storePrice, savings) =>
      `💡 省钱提示：通过图书馆借阅实体书或使用电子书，相比全网最低价（${store}：${storePrice}）可全额节省 ${savings}。`,
    skkuDirectCatalogBtn: '馆藏目录检索',
    skkuShelfHoldingsTitle: (campusName) => `${campusName} 在架馆藏：`,
    skkuStrictFilterNote: '※ 已借出图书自动隐藏，仅显示当前在架可借阅或电子书资源。',
    skkuNoShelfCopies: (campusName) =>
      `当前 ${campusName} 书架上暂无可借阅的实体教材（已全部借出或未收录）。`,
    skkuTryAlternativesNote: '请查看下方机构订阅电子书 (E-Book) 或申请跨校区互借。',
    skkuRepositoryLabel: '馆藏地 / 楼层：',
    skkuCallNumberLabel: '索书号 (Call No.)：',
    skkuShelfLocationLabel: '书架位置指引：',
    skkuCheckStatusBtn: '查看详情 (实时借阅状态核对)',
    skkuInterCampusBadge: '跨校区互借',
    skkuInterCampusTitle: (otherCampusName) => `${otherCampusName} 有馆藏（可申请校区互借）`,
    skkuInterCampusNote: '申请后1~2个工作日内送达所属校区图书馆服务台',
    skkuInterCampusAction: '查看详情 (实时馆藏及跨校区互借申请)',
    skkuEbookBadge: '[💻 电子书 / E-Book Available]',
    skkuEbookTitle: 'SKKU 机构订阅电子图书馆 (网页 / 移动端)',
    skkuEbookSub: '无需排队等待 · 24小时校外访问',
    skkuEbookAction: '查看详情 (在线阅读电子书)',
    skkuLiveNoticeTitle: '实时馆藏同步说明：',
    skkuLiveNoticeBody:
      '受校园网安全策略限制，浏览器无法直接抓取分钟级预约锁定状态。请点击卡片上的【查看详情】按钮前往成均馆大学图书馆官网核对最新实时在架状态。',

    filters: {
      all: '全部',
      new: '新书',
      used: '二手',
      digital: '电子书',
    },
    sortModes: {
      total_cost: '最低总价',
      effective_cost: '抵扣积分后',
      speed: '最快送达',
    },
    filterCoupangWow: 'Coupang WOW会员',
    filterStorePickup: '仅看门店自提',
    exportCsvBtn: '导出 CSV',

    tableHeaders: {
      rank: '#',
      store: '书店平台',
      condition: '品相 / 书价',
      basePrice: '图书单价',
      shipping: '运费',
      totalPrice: '实付总价',
      netPrice: '折算价 (扣积分)',
      delivery: '预计送达',
      action: '操作',
    },
    freeShippingBadge: '免运费',
    inBookBagBtn: '已加',
    addToBookBagBtn: '书包',
    visitStoreBtn: '去书店',
    detailsBtn: '详情',
    tipLabel: '购书贴士：',
    rewardPointsLabel: '预计返积分：',
    noOffersFound: '没有符合当前筛选条件的书店报价。',
    resetFiltersBtn: '重置筛选',

    alternativesTitle: '更省钱的替代方案（电子书租赁 & 往期旧版）',
    alternativesFree: '₩0 (免费)',
    alternativesNote: '注意：',
    advisorTitle: '教材版本兼容性 & 拆书装订/二手回收咨询',
    advisorSampleChips: [
      '用上一版（旧版）教材上课可以吗？',
      '拆书螺旋装订 (분철) vs 期末二手卖回？',
    ],
    advisorPlaceholder: '输入关于本教材版本、习题或装订的问题...',
    advisorAskBtn: '提问',

    bagDrawerTitle: (count) => `学期教材书包 (${count})`,
    bagCloseAria: '关闭书包',
    bagEmptyTitle: '书包还是空的',
    bagEmptyDesc: '在比价结果中点击“+ 书包”，即可汇总对比本学期教材总费用与满额免运费优惠。',
    bagDisclaimer:
      'ℹ️ ChaekScan 是专为大学生设计的教材比价与学期预算规划工具，不直接进行在线收款。实际购买请点击各书店的“去书店”链接完成。',
    bagSubtotalBooks: '教材单价合计',
    bagShippingTotal: '预计总运费',
    bagTotalEstimated: '本学期预计总支出',
    bagTotalSaved: '相比定价共节省',
    bagRemoveAria: '从书包中移除',
    bagGoToStore: '去书店购买',
    bagOptimizeBtn: '将书包清单导入预算规划器进行 AI 优化',

    budgetHeroTitle: '学期教材预算规划器 & AI 智能优化',
    budgetHeroSubtitle:
      '输入您的目标预算（韩元 KRW）与本学期必修教材或课程名称，系统将优先分配成均馆大学图书馆免费馆藏（₩0）并组合7大韩国书店的新书、二手书（99新/95新）及电子书，确保总支出控制在预算内。',
    budgetTargetLabel: '本学期教材目标预算 (KRW)',
    budgetPresetLabel: '快捷预算：',
    budgetBooksLabel: '必修教材或课程清单',
    budgetBookInputPlaceholder: '输入教材名或课程名后按 Enter（支持逗号分隔批量添加）',
    budgetAddBookBtn: '+ 添加教材',
    budgetPresetsTitle: '一键加载专业推荐课程教材包：',
    budgetPresetBundles: [
      {
        label: '计算机与软件工程 4门核心课 (预算 ₩70,000)',
        budget: 70000,
        books: ['Operating System Concepts', 'Introduction to Algorithms (CLRS)', 'Linear Algebra (Strang)', 'Computer Networking (Kurose)'],
      },
      {
        label: '理工科大一基础 4门课 (预算 ₩80,000)',
        budget: 80000,
        books: ['Stewart Calculus', 'Halliday Physics', 'Zumdahl Chemistry', 'Campbell Biology'],
      },
      {
        label: '商科与经济学 3门核心课 (预算 ₩50,000)',
        budget: 50000,
        books: ['Mankiw Principles of Economics', 'IFRS Principles of Accounting', 'Introductory Statistics'],
      },
    ],
    budgetPrioritizeLibraryLabel: '优先分配成均馆大学图书馆免费借阅 & 电子书 (₩0)',
    budgetPrioritizeLibraryDesc:
      '为防止超出预算并最大化省钱，优先将图书馆在架实体书或机构电子书分配为 ₩0。',
    budgetGenerateBtn: '生成预算内最优购书方案',
    budgetGeneratingBtn: '正在核算7大书店实时价格、凑单运费及SKKU馆藏最优组合...',
    budgetSummaryHeading: '📊 预算总览 / Budget Summary',
    budgetTargetCardLabel: '目标预算 (Target Budget)',
    budgetEstimatedCardLabel: '最优方案总费用 (Total Cost)',
    budgetRemainingCardLabel: '预算结余 / 状态 (Balance)',
    budgetTotalSavedCardLabel: '相比定价总节省 (Total Saved)',
    budgetListHeading: '📚 最优推荐购书清单 / Optimized Procurement List',
    budgetColBook: '教材名称 (Book Title)',
    budgetColSource: '购买渠道 / 图书馆 (Source / Vendor)',
    budgetColCondition: '品相 / 类型 (Condition / Format)',
    budgetColPriceShipping: '价格与运费 (Price & Shipping)',
    budgetColAction: '直达链接 (Direct Action)',
    budgetOpenLinkBtn: '前往查看',
    budgetSwitchToLibraryBtn: '转为图书馆 ₩0',
    budgetAdviceHeading: '💡 AI 省钱建议 / Smart Saving Advice',
    budgetExportSectionTitle: '结构化报告导出 (Structured Markdown & JSON Summary)',
    budgetViewVisualTab: '交互式表格',
    budgetViewMarkdownTab: 'Markdown 汇总报告',
    budgetViewJsonTab: 'JSON 数据摘要',
    budgetCopyBtn: '复制到剪贴板',
    budgetCopiedBtn: '已复制！',
  },
};

export function localizeConditionTag(condition: string, lang: AppLanguage): string {
  if (lang === 'ko') {
    const koMap: Record<string, string> = {
      New: '새책 (New)',
      'Used - Like New (최상)': '중고 - 최상',
      'Used - Good (상)': '중고 - 상',
      'Used - Fair (중)': '중고 - 중',
      'Digital eBook': '전자책 (eBook)',
      'International Softcover': '해외원서 (페이퍼백)',
    };
    return koMap[condition] || condition;
  }
  if (lang === 'zh') {
    const zhMap: Record<string, string> = {
      New: '新书 (New)',
      'Used - Like New (최상)': '二手-99新 (极好)',
      'Used - Good (상)': '二手-95新 (良好)',
      'Used - Fair (중)': '二手-九成新 (合格)',
      'Digital eBook': '电子书 (eBook)',
      'International Softcover': '国际平装版',
    };
    return zhMap[condition] || condition;
  }
  const enMap: Record<string, string> = {
    New: 'New',
    'Used - Like New (최상)': 'Used - Like New',
    'Used - Good (상)': 'Used - Good',
    'Used - Fair (중)': 'Used - Fair',
    'Digital eBook': 'Digital eBook',
    'International Softcover': 'Intl. Softcover',
  };
  return enMap[condition] || condition;
}

export function localizePlatformDisplayName(
  platformId: string,
  nameKo: string,
  nameEn: string,
  lang: AppLanguage
): string {
  if (lang === 'ko') return nameKo;
  if (lang === 'en') return nameEn || nameKo;
  const zhStoreMap: Record<string, string> = {
    kyobo: '教保文库 (Kyobo)',
    yes24: 'YES24 书店',
    aladin: '阿拉丁二手/新书 (Aladin)',
    youngpoong: '永丰文库 (Youngpoong)',
    bookstore_on: '韩国书店ON (官方联盟)',
    '11st': '11街图书 (11st)',
    coupang: '酷澎火箭配送 (Coupang)',
    skku_library: '成均馆大学图书馆 (SKKU)',
  };
  return zhStoreMap[platformId] || nameEn || nameKo;
}

export function localizeSkkuStatusBadge(
  status: 'available' | 'ebook' | 'alternative_edition',
  isAlternativeEdition: boolean | undefined,
  defaultBadge: string,
  lang: AppLanguage
): string {
  if (lang === 'zh') {
    if (status === 'ebook') return '[💻 电子书 / E-Book Available]';
    if (isAlternativeEdition || status === 'alternative_edition') {
      return '[🟢 旧版在架 / Prior Edition On Shelf]';
    }
    return '[🟢 可借阅 / Available Now]';
  }
  if (lang === 'en') {
    if (status === 'ebook') return '[💻 E-Book Available]';
    if (isAlternativeEdition || status === 'alternative_edition') {
      return '[🟢 Prior Edition On Shelf]';
    }
    return '[🟢 Available Now]';
  }
  return defaultBadge;
}

export function localizeSkkuRepository(repoName: string, lang: AppLanguage): string {
  if (lang === 'ko') return repoName;
  if (lang === 'zh') {
    return repoName
      .replace('인사캠 중앙도서관', '人文校区 中央图书馆')
      .replace('중앙도서관', '中央图书馆')
      .replace('자캠 삼성학술정보관', '自然校区 三星学术信息馆')
      .replace('삼성학술정보관', '三星学术信息馆')
      .replace('법학도서관', '法学图书馆')
      .replace('존경각', '尊经阁')
      .replace('의학도서관', '医学图书馆')
      .replace('제1자료실', '第1资料室')
      .replace('제2자료실', '第2资料室')
      .replace('제3자료실', '第3资料室')
      .replace('과학기술자료실', '科学技术资料室')
      .replace('학술정보관 전자도서관', '学术信息馆 电子图书馆')
      .replace('SKKU 전자도서관', 'SKKU 电子图书馆')
      .replace(/(\d+)층/g, '$1层');
  }
  return repoName
    .replace('인사캠 중앙도서관', 'Seoul Central Library')
    .replace('중앙도서관', 'Central Library')
    .replace('자캠 삼성학술정보관', 'Suwon Samsung Library')
    .replace('삼성학술정보관', 'Samsung Library')
    .replace('법학도서관', 'Law Library')
    .replace('존경각', 'Jongyeonggak')
    .replace('의학도서관', 'Medical Library')
    .replace('제1자료실', 'Reading Room 1')
    .replace('제2자료실', 'Reading Room 2')
    .replace('제3자료실', 'Reading Room 3')
    .replace('과학기술자료실', 'Sci-Tech Reading Room')
    .replace('학술정보관 전자도서관', 'SKKU Digital E-Library')
    .replace('SKKU 전자도서관', 'SKKU E-Library')
    .replace(/(\d+)층/g, '$1F');
}

export function localizeSkkuShelfGuidance(guidance: string, lang: AppLanguage): string {
  if (lang === 'ko') return guidance;
  if (lang === 'zh') {
    return guidance
      .replace('자연과학', '自然科学')
      .replace('사회과학', '社会科学')
      .replace('응용과학', '应用科学')
      .replace('공학', '工学')
      .replace('전산학', '计算机科学')
      .replace('경제/경영', '经济/经营')
      .replace('화학/생명', '化学/生命科学')
      .replace('수학', '数学')
      .replace('서가', '书架')
      .replace('교외접속 및 모바일 열람 가능', '支持校外访问及移动端在线阅读')
      .replace('로그인 후 즉시 열람 가능', '登录校园账号后即可在线阅读')
      .replace(/(\d+)층/g, '$1层');
  }
  return guidance
    .replace('자연과학', 'Natural Sciences')
    .replace('사회과학', 'Social Sciences')
    .replace('응용과학', 'Applied Sciences')
    .replace('공학', 'Engineering')
    .replace('전산학', 'Computer Science')
    .replace('경제/경영', 'Econ/Business')
    .replace('화학/생명', 'Chem/Bio')
    .replace('수학', 'Mathematics')
    .replace('서가', 'Shelf')
    .replace('교외접속 및 모바일 열람 가능', '24/7 Off-campus & mobile access')
    .replace('로그인 후 즉시 열람 가능', 'Instant access after SKKU login')
    .replace(/(\d+)층/g, '$1F');
}

