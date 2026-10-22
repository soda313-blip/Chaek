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
}

export interface StudentPreferences {
  hasWowMembership: boolean;
  includeUsed: boolean;
  includeDigital: boolean;
  preferPickup: boolean;
  deductRewardPoints: boolean;
}

export interface CartItem {
  cartItemId: string;
  textbookId: string;
  textbookTitleKo: string;
  isbn13: string;
  listPriceKrw: number;
  offer: PlatformOffer;
}
