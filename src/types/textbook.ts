export type PlatformId =
  | 'kyobo'
  | 'yes24'
  | 'aladin'
  | 'youngpoong'
  | 'bookstore_on'
  | '11st'
  | 'coupang';

export type CopyCondition =
  | 'New'
  | 'Used - Like New (최상)'
  | 'Used - Good (상)'
  | 'Used - Fair (중)'
  | 'Digital eBook'
  | 'International Softcover';

export interface PlatformOffer {
  id: string;
  platformId: PlatformId;
  platformNameKo: string;
  platformNameEn: string;
  condition: CopyCondition;
  conditionCategory: 'new' | 'used' | 'digital';
  basePriceKrw: number;
  shippingFeeKrw: number;
  freeShippingThresholdKrw: number;
  wowFreeShippingEligible?: boolean;
  pickupAvailable: boolean;
  pickupLabel?: string;
  estimatedDelivery: string;
  deliverySpeedRank: number; // 1 = fastest (immediate/same day), 2 = next day, 3 = 1-2 days, 4 = 2-4 days
  stockStatus: 'In Stock' | 'Low Stock' | 'Branch Stock Only' | 'Instant Download';
  stockDetail: string;
  rewardPointsKrw: number;
  studentTip: string;
  directSearchUrl: string;
}

export interface AlternativeOption {
  id: string;
  type: 'Older Edition' | 'International Edition' | 'eBook Rental' | 'Campus Library & Co-op';
  title: string;
  estimatedCostKrw: number;
  compatibilityNote: string;
  pros: string;
  cons: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export type SkkuCampus = 'seoul' | 'suwon';

export interface SkkuLibraryHolding {
  id: string;
  status: 'available' | 'ebook' | 'alternative_edition';
  statusBadgeText: string; // e.g. '[🟢 대출 가능 / Available Now]' or '[💻 전자책 바로보기 / E-Book Available]'
  title: string;
  edition: string;
  authors: string;
  publisher: string;
  campus: SkkuCampus;
  campusNameKo: string; // '인사캠 (서울)' | '자캠 (수원)'
  repositoryName: string; // e.g. '중앙도서관 4층 제1자료실' | '삼성학술정보관 3층' | '법학도서관' | '존경각' | '의학도서관'
  callNumber: string; // e.g. '515 S849c9' or 'QA76.73.P98 L88 2022'
  shelfLocationGuidance: string; // e.g. '자연과학/공학 서가 B-12' or '사회과학 서가 4층'
  directCatalogUrl: string; // https://lib.skku.edu/search/tot/result?st=FRNT&q=...
  isAlternativeEdition?: boolean;
  editionNote?: string;
  isInterCampusLoanEligible?: boolean;
  interCampusLoanNote?: string; // e.g. '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
  isDigitalEbook?: boolean;
  ebookAccessNote?: string;
}

export interface TextbookAnalysisResult {
  id: string;
  titleKo: string;
  titleEn: string;
  authors: string;
  publisherKo: string;
  edition: string;
  isbn13: string;
  publicationYear: string;
  listPriceKrw: number;
  courseDepartment: string;
  coverImageUrl?: string;
  summaryInsight: string;
  editionDiffWarning: string;
  offers: PlatformOffer[];
  alternatives: AlternativeOption[];
  groundingSources?: GroundingSource[];
  skkuLibraryHoldings?: SkkuLibraryHolding[];
  skkuDirectSearchUrl?: string;
}

export interface StudentPreferences {
  hasWowMembership: boolean;
  includeUsed: boolean;
  includeDigital: boolean;
  preferPickup: boolean;
  deductRewardPoints: boolean;
}

export type AppLanguage = 'ko' | 'en';

export interface BookBagItem {
  bagItemId: string;
  textbookId: string;
  textbookTitleKo: string;
  textbookTitleEn?: string;
  isbn13: string;
  listPriceKrw: number;
  offer: PlatformOffer;
}

// Backward compatibility alias
export type CartItem = BookBagItem;
