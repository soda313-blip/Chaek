export type CampusId = 'seoul' | 'suwon';

export interface SKKULibraryHolding {
  id: string;
  statusBadge: 'AVAILABLE_NOW' | 'EBOOK_AVAILABLE' | 'INTER_CAMPUS_LOAN';
  statusTextKo: string;
  title: string;
  authors: string;
  edition: string;
  publisher: string;
  pubYear: string;
  isbn13: string;
  campusId: CampusId;
  campusNameKo: string; // '인사캠 (서울)' | '자캠 (수원)'
  buildingNameKo: string; // '중앙도서관', '삼성학술정보관', '법학도서관', '의학도서관', '존경각'
  callNumber: string; // 청구기호 e.g. '515.15 S849c9 2021'
  shelfLocationGuide: string; // '4층 제1자료실 자연과학 단행본 서가', '3층 과학기술자료실'
  isEbook: boolean;
  isAlternativeEdition: boolean;
  editionDiscrepancyNote?: string;
  interCampusNote?: string;
  skkuDirectSearchUrl: string; // https://lib.skku.edu/search/tot/result?st=FRNT&q=...
  ebookDirectAccessUrl?: string;
}

export interface SKKUQueryResult {
  query: string;
  selectedCampus: CampusId;
  textbookNameKo: string;
  textbookNameEn: string;
  targetCourseKo?: string;
  availableHoldings: SKKULibraryHolding[];
  alternativeEditions: SKKULibraryHolding[];
  ebookHoldings: SKKULibraryHolding[];
  otherCampusHoldings: SKKULibraryHolding[];
  quickSummaryNotice: string;
}
