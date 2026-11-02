import { AppLanguage } from '../types/textbook';

export interface TranslationStrings {
  brandTitle: string;
  skkuBadge: string;
  campusSeoul: string;
  campusSuwon: string;
  campusSeoulTooltip: string;
  campusSuwonTooltip: string;
  bookBagBtn: (count: number) => string;

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
  },
  en: {
    brandTitle: 'ChaekScan',
    skkuBadge: 'SKKU',
    campusSeoul: 'Seoul Campus',
    campusSuwon: 'Suwon Campus',
    campusSeoulTooltip: 'Humanities & Social Sciences (Seoul): Central Library, Law Library, Jongyeonggak',
    campusSuwonTooltip: 'Natural Sciences (Suwon): Samsung Library, Medical Library',
    bookBagBtn: (count) => `Book Bag (${count})`,

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
  },
};
