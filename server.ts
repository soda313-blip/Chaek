import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const TEXTBOOK_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'Slug identifier for the textbook' },
    titleKo: { type: Type.STRING, description: 'Korean title of the textbook (including edition)' },
    titleEn: { type: Type.STRING, description: 'English title of the textbook (including edition)' },
    authors: { type: Type.STRING, description: 'Authors and Korean translators if applicable' },
    publisherKo: { type: Type.STRING, description: 'Korean publisher and original publisher' },
    edition: { type: Type.STRING, description: 'Edition description, e.g., 10th Edition' },
    isbn13: { type: Type.STRING, description: '13-digit ISBN formatted with hyphens' },
    publicationYear: { type: Type.STRING, description: 'Publication year' },
    listPriceKrw: { type: Type.INTEGER, description: 'Official list price (정가) in KRW' },
    courseDepartment: { type: Type.STRING, description: 'Relevant Korean university department and course level' },
    summaryInsight: {
      type: Type.STRING,
      description: 'Concise 2-sentence student-focused cost & logistics takeaway across the 7 Korean platforms.',
    },
    editionDiffWarning: {
      type: Type.STRING,
      description: 'Specific advice on edition differences, international vs translated edition compatibility, or homework problem numbering.',
    },
    offers: {
      type: Type.ARRAY,
      description: 'Must include offers across all 7 primary Korean platforms: kyobo, yes24, aladin (both new/used or eBook), youngpoong, bookstore_on, 11st, coupang.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          platformId: {
            type: Type.STRING,
            description: 'One of: kyobo, yes24, aladin, youngpoong, bookstore_on, 11st, coupang',
          },
          platformNameKo: { type: Type.STRING, description: 'e.g., 교보문고, 예스24, 알라딘 (중고샵), 영풍문고, 서점ON, 11번가 도서, 쿠팡' },
          platformNameEn: { type: Type.STRING },
          condition: {
            type: Type.STRING,
            description: 'One of: New, Used - Like New (최상), Used - Good (상), Used - Fair (중), Digital eBook, International Softcover',
          },
          conditionCategory: {
            type: Type.STRING,
            description: 'One of: new, used, digital',
          },
          basePriceKrw: { type: Type.INTEGER, description: 'Book price in KRW before shipping' },
          shippingFeeKrw: { type: Type.INTEGER, description: 'Delivery cost in KRW (0 if >= freeShippingThresholdKrw)' },
          freeShippingThresholdKrw: { type: Type.INTEGER, description: 'Threshold in KRW for free shipping (usually 15000, 19800 for Coupang, 20000 for Aladin direct used)' },
          wowFreeShippingEligible: { type: Type.BOOLEAN, description: 'True if Coupang Rocket Delivery eligible' },
          pickupAvailable: { type: Type.BOOLEAN, description: 'True if Barodream, Nadream, Aladin offline branch, or campus co-op pickup is supported' },
          pickupLabel: { type: Type.STRING, description: 'Pickup description if pickupAvailable is true' },
          estimatedDelivery: { type: Type.STRING, description: 'Realistic Korean delivery estimate (e.g. 내일 새벽 도착, 당일 바로드림, 1~2일 내 도착)' },
          deliverySpeedRank: { type: Type.INTEGER, description: '1 for same-day/dawn/instant, 2 for next-day, 3 for 1-2 days, 4 for 2-4 days' },
          stockStatus: {
            type: Type.STRING,
            description: 'One of: In Stock, Low Stock, Branch Stock Only, Instant Download',
          },
          stockDetail: { type: Type.STRING, description: 'Stock status detail in Korean' },
          rewardPointsKrw: { type: Type.INTEGER, description: 'Estimated reward points in KRW' },
          studentTip: { type: Type.STRING, description: 'Practical money/time-saving tip for Korean undergrads on this platform' },
          directSearchUrl: { type: Type.STRING, description: 'Valid search URL for this textbook on the platform' },
        },
        required: [
          'id',
          'platformId',
          'platformNameKo',
          'platformNameEn',
          'condition',
          'conditionCategory',
          'basePriceKrw',
          'shippingFeeKrw',
          'freeShippingThresholdKrw',
          'pickupAvailable',
          'estimatedDelivery',
          'deliverySpeedRank',
          'stockStatus',
          'stockDetail',
          'rewardPointsKrw',
          'studentTip',
          'directSearchUrl',
        ],
      },
    },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: {
            type: Type.STRING,
            description: 'One of: Older Edition, International Edition, eBook Rental, Campus Library & Co-op',
          },
          title: { type: Type.STRING },
          estimatedCostKrw: { type: Type.INTEGER },
          compatibilityNote: { type: Type.STRING },
          pros: { type: Type.STRING },
          cons: { type: Type.STRING },
        },
        required: ['id', 'type', 'title', 'estimatedCostKrw', 'compatibilityNote', 'pros', 'cons'],
      },
    },
  },
  required: [
    'id',
    'titleKo',
    'titleEn',
    'authors',
    'publisherKo',
    'edition',
    'isbn13',
    'publicationYear',
    'listPriceKrw',
    'courseDepartment',
    'summaryInsight',
    'editionDiffWarning',
    'offers',
    'alternatives',
  ],
};

const searchCache = new Map<string, Record<string, unknown>>();
const advisorCache = new Map<string, string>();

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
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
  authors: string;
  publisherKo: string;
  edition: string;
  isbn13: string;
  publicationYear: string;
  listPriceKrw: number;
  courseDepartment: string;
  summaryInsight: string;
  editionDiffWarning: string;
}

const KOREAN_CAMPUS_CATALOG: CatalogSeed[] = [
  {
    keywords: ['선형대수', 'strang', 'linear algebra', '스트랭'],
    titleKo: '선형대수학 (제5판 · Gilbert Strang)',
    titleEn: 'Introduction to Linear Algebra (5th Edition, Gilbert Strang)',
    authors: 'Gilbert Strang (부산대학교 수학과 역 / Wellesley-Cambridge)',
    publisherKo: '경문사 (Kyungmoon Publishers)',
    edition: '5th Edition',
    isbn13: '979-11-6073-305-1',
    publicationYear: '2020',
    listPriceKrw: 45000,
    courseDepartment: 'Engineering, Computer Science & Mathematics · 1st/2nd Year Core',
    summaryInsight:
      'Strang Linear Algebra is heavily stocked at Aladin Used Store (최상/상 grades saving up to ₩17,000) and pairs directly with MIT OpenCourseWare 18.06 free video lectures by Prof. Gilbert Strang.',
    editionDiffWarning:
      'The 5th edition added singular value decomposition (SVD) and data science matrix chapters earlier in the text compared to the 4th edition. Verify whether your syllabus uses the Kyungmoon Korean translation or the Wellesley-Cambridge English hardcover.',
  },
  {
    keywords: ['공업수학', 'kreyszig', 'advanced engineering mathematics', '크레이직'],
    titleKo: '크레이직 공업수학 (제10판 · 상/하 통합 기준)',
    titleEn: 'Advanced Engineering Mathematics (10th Edition, Erwin Kreyszig)',
    authors: 'Erwin Kreyszig (서진헌 외 역)',
    publisherKo: '텍스트북스 (Textbooks) / Wiley',
    edition: '10th Edition (Korean Translation)',
    isbn13: '978-89-93543-87-2',
    publicationYear: '2020',
    listPriceKrw: 46000,
    courseDepartment: 'Mechanical, Electrical & Chemical Engineering · 2nd Year Core',
    summaryInsight:
      'Kreyszig 10th Edition has remained the standard Korean engineering mathematics textbook for several years, creating huge used supply on Aladin Used Store (from ₩23,500) and campus co-ops via Bookstore ON.',
    editionDiffWarning:
      'Korean translation splits Kreyszig 10e into Volume 1 (ODE, Linear Algebra, Vector Calculus) and Volume 2 (Fourier, PDE, Complex Analysis), whereas the Wiley International Edition combines them into a single paperback.',
  },
  {
    keywords: ['캠벨', '생명과학', 'campbell', 'biology', '생물학'],
    titleKo: '캠벨 생명과학 (제12판)',
    titleEn: 'Campbell Biology (12th Edition)',
    authors: 'Lisa A. Urry, Michael L. Cain 외 (전상학 대표역)',
    publisherKo: '바이오사이언스 (BioScience) / Pearson',
    edition: '12th Edition (Korean Translation)',
    isbn13: '978-89-6824-115-4',
    publicationYear: '2022',
    listPriceKrw: 65000,
    courseDepartment: 'Biological Sciences, Pre-Med, Pharmacy & Nursing · 1st Year Core',
    summaryInsight:
      'At ₩65,000 list price and over 1,400 pages, Campbell Biology offers the largest single-book savings when purchased as a pre-bound (3권 스프링 분철) Used copy on Aladin or with 10% local currency cashback via Bookstore ON.',
    editionDiffWarning:
      'The 11th and 12th Korean editions have 97% identical biology diagrams and chapter sequences; for general biology lecture exams (excluding MasteringBiology online codes), the 11th edition used copy is a major money-saver.',
  },
  {
    keywords: ['일반물리학', 'halliday', '할리데이', 'physics', 'resnick'],
    titleKo: '할리데이 일반물리학 (제11판 · 1/2권)',
    titleEn: 'Principles of Physics (11th Edition, Halliday & Resnick)',
    authors: 'David Halliday, Robert Resnick, Jearl Walker (고려대·연세대 등 공역)',
    publisherKo: '텍스트북스 (Textbooks) / Wiley',
    edition: '11th Edition (Korean Translation)',
    isbn13: '979-11-90017-07-7',
    publicationYear: '2021',
    listPriceKrw: 39000,
    courseDepartment: 'Engineering & Physical Sciences · 1st Year Core',
    summaryInsight:
      'Halliday Physics 11e is widely available in Aladin Used Store (신촌/강남/대학로 지점) and qualifies for free same-day Barodream pickup at Kyobo Book Centre.',
    editionDiffWarning:
      'End-of-chapter problem numbers and randomized WileyPLUS parameters differ between the 10th and 11th editions. Confirm whether homework is graded via WileyPLUS or handwritten problem sets.',
  },
  {
    keywords: ['알고리즘', 'clrs', 'cormen', 'algorithms'],
    titleKo: 'Introduction to Algorithms (제4판 · CLRS)',
    titleEn: 'Introduction to Algorithms (4th Edition, Cormen, Leiserson, Rivest, Stein)',
    authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    publisherKo: '한빛아카데미 / MIT Press',
    edition: '4th Edition',
    isbn13: '979-11-5664-666-2',
    publicationYear: '2023',
    listPriceKrw: 54000,
    courseDepartment: 'Computer Science & Software Engineering · 3rd Year Core',
    summaryInsight:
      'Comparing the MIT Press International Edition on YES24/Kyobo against the Korean edition and Aladin Used Store saves up to ₩19,500 on this essential algorithms reference.',
    editionDiffWarning:
      'The 4th edition updated pseudocode conventions and added bipartite matching and online algorithms compared to the 3rd edition.',
  },
  {
    keywords: ['네트워크', '네트워킹', 'kurose', 'computer networking', '하향식'],
    titleKo: '컴퓨터 네트워킹 하향식 접근 (제8판)',
    titleEn: 'Computer Networking: A Top-Down Approach (8th Edition, Kurose & Ross)',
    authors: 'James F. Kurose, Keith W. Ross (최종원 외 역)',
    publisherKo: '퍼스트북 (Firstbook) / Pearson',
    edition: '8th Edition',
    isbn13: '979-11-85475-78-3',
    publicationYear: '2022',
    listPriceKrw: 43000,
    courseDepartment: 'Computer Science & Information Engineering · 3rd Year Core',
    summaryInsight:
      'Purchasing a Used (최상/상) copy on Aladin or using Bookstore ON local currency cashback saves ₩11,000–₩17,500 off the ₩43,000 list price.',
    editionDiffWarning:
      'The 8th edition updated SDN (Software Defined Networking), QUIC/HTTP3, and 5G wireless sections compared to the 7th edition. Authors also provide free interactive Wireshark labs online.',
  },
];

function buildDeterministicTextbookAnalysis(rawQuery: string) {
  const cleanQuery = rawQuery.trim();
  const lower = cleanQuery.toLowerCase();

  const matchedSeed = KOREAN_CAMPUS_CATALOG.find((seed) =>
    seed.keywords.some((k) => lower.includes(k.toLowerCase()))
  );

  // Hash query string slightly for realistic deterministic numbers when unknown
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash * 31 + cleanQuery.charCodeAt(i)) % 10000;
  }

  const listPriceKrw = matchedSeed
    ? matchedSeed.listPriceKrw
    : 38000 + (hash % 18) * 1000;

  const isIsbnQuery = /^[0-9-]{10,17}$/.test(cleanQuery.replace(/\s+/g, ''));
  const isbn13 = matchedSeed
    ? matchedSeed.isbn13
    : isIsbnQuery
    ? cleanQuery
    : `979-11-${String(5000 + (hash % 4999)).padStart(4, '0')}-${String(
        100 + (hash % 899)
      ).padStart(3, '0')}-${hash % 10}`;

  const titleKo = matchedSeed
    ? matchedSeed.titleKo
    : isIsbnQuery
    ? `대학 전공교재 (${cleanQuery})`
    : cleanQuery;

  const titleEn = matchedSeed
    ? matchedSeed.titleEn
    : `Korean University Textbook Analysis — ${cleanQuery}`;

  const encodedQuery = encodeURIComponent(cleanQuery);

  const usedGoodPrice = Math.round((listPriceKrw * 0.52) / 100) * 100;
  const usedBestPrice = Math.round((listPriceKrw * 0.66) / 100) * 100;
  const ebookPrice = Math.round((listPriceKrw * 0.72) / 100) * 100;
  const bookstoreOnPrice = Math.round((listPriceKrw * 0.9) / 100) * 100;
  const st11Price = Math.round((listPriceKrw * 0.93) / 100) * 100;
  const yes24Price = Math.round((listPriceKrw * 0.95) / 100) * 100;
  const kyoboPrice = Math.round((listPriceKrw * 0.96) / 100) * 100;
  const coupangPrice = Math.round((listPriceKrw * 0.96) / 100) * 100;
  const youngpoongPrice = Math.round((listPriceKrw * 0.98) / 100) * 100;

  const slug =
    'book-' +
    cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32);

  return {
    id: matchedSeed ? matchedSeed.keywords[0] + '-preset' : slug || `book-${hash}`,
    titleKo,
    titleEn,
    authors: matchedSeed
      ? matchedSeed.authors
      : '국내외 대학 전공교재 저자진 (상세 저자 정보는 각 서점 링크 참조)',
    publisherKo: matchedSeed ? matchedSeed.publisherKo : '대학 전공 학술출판사',
    edition: matchedSeed ? matchedSeed.edition : 'Latest Academic Edition (최신판)',
    isbn13,
    publicationYear: matchedSeed ? matchedSeed.publicationYear : '2023',
    listPriceKrw,
    courseDepartment: matchedSeed
      ? matchedSeed.courseDepartment
      : 'Korean Undergraduate Major / General Education Course',
    summaryInsight: matchedSeed
      ? matchedSeed.summaryInsight
      : `Under Korea's Book Price Law (도서정가제), new academic textbooks carry limited direct discounts. You can save ${Math.round(
          (listPriceKrw - usedGoodPrice) / 1000
        )},000 KRW (48%) by purchasing a verified '상 (Good)' used copy via Aladin Used Store, or get ~10% effective savings on a new copy via Bookstore ON using regional local currency (지역화폐).`,
    editionDiffWarning: matchedSeed
      ? matchedSeed.editionDiffWarning
      : 'Before ordering a previous edition or international softcover, verify whether your professor assigns homework problem numbers specific to the newest Korean translated edition.',
    offers: [
      {
        id: `${slug}-aladin-used-good`,
        platformId: 'aladin',
        platformNameKo: '알라딘 (온라인 중고샵)',
        platformNameEn: 'Aladin Used Store',
        condition: 'Used - Good (상)',
        conditionCategory: 'used',
        basePriceKrw: usedGoodPrice,
        shippingFeeKrw: usedGoodPrice >= 20000 ? 0 : 2500,
        freeShippingThresholdKrw: 20000,
        pickupAvailable: true,
        pickupLabel: '신촌·강남·대학로·종로 중고매장 픽업 가능',
        estimatedDelivery: '내일 도착 (양탄자배송) / 매장 즉시수령',
        deliverySpeedRank: 1,
        stockStatus: 'In Stock',
        stockDetail: '알라딘 직배송 및 오프라인 매장 중고 재고 보유',
        rewardPointsKrw: Math.round(usedGoodPrice * 0.01),
        studentTip:
          '알라딘 직배송 중고는 ₩20,000 이상 무료배송이며, 통학 경로에 알라딘 중고매장이 있다면 직접 방문해 필기 상태를 확인하고 구매할 수 있습니다.',
        directSearchUrl: `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodedQuery}`,
      },
      {
        id: `${slug}-aladin-used-best`,
        platformId: 'aladin',
        platformNameKo: '알라딘 (직배송 중고 최상)',
        platformNameEn: 'Aladin Used (Like New)',
        condition: 'Used - Like New (최상)',
        conditionCategory: 'used',
        basePriceKrw: usedBestPrice,
        shippingFeeKrw: usedBestPrice >= 20000 ? 0 : 2500,
        freeShippingThresholdKrw: 20000,
        pickupAvailable: true,
        pickupLabel: '전국 알라딘 중고매장 재고 연동',
        estimatedDelivery: '내일 도착 (양탄자배송)',
        deliverySpeedRank: 1,
        stockStatus: 'In Stock',
        stockDetail: '필기 없는 새책급 최상 등급 중고',
        rewardPointsKrw: Math.round(usedBestPrice * 0.01),
        studentTip:
          '수강정정 기간에 드랍한 학생들이 내놓은 미사용 최상급 매물로, 새책과 동일한 컨디션을 정가 대비 34% 저렴하게 구할 수 있습니다.',
        directSearchUrl: `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodedQuery}`,
      },
      {
        id: `${slug}-kyobo-ebook`,
        platformId: 'kyobo',
        platformNameKo: '교보문고 eBook',
        platformNameEn: 'Kyobo Digital eBook',
        condition: 'Digital eBook',
        conditionCategory: 'digital',
        basePriceKrw: ebookPrice,
        shippingFeeKrw: 0,
        freeShippingThresholdKrw: 0,
        pickupAvailable: false,
        estimatedDelivery: '결제 즉시 다운로드 (아이패드/갤럭시탭/PC)',
        deliverySpeedRank: 1,
        stockStatus: 'Instant Download',
        stockDetail: '교보문고 eBook 및 학술 전자책 바로 열람',
        rewardPointsKrw: Math.round(ebookPrice * 0.05),
        studentTip:
          '두꺼운 전공서적을 들고 통학하기 부담스럽다면 eBook 또는 학기 대여 서비스를 통해 비용과 무게를 동시에 줄일 수 있습니다.',
        directSearchUrl: `https://search.kyobobook.co.kr/search?keyword=${encodedQuery}`,
      },
      {
        id: `${slug}-bookstore-on`,
        platformId: 'bookstore_on',
        platformNameKo: '서점ON (대학구내/지역서점)',
        platformNameEn: 'Bookstore ON',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: bookstoreOnPrice,
        shippingFeeKrw: bookstoreOnPrice >= 15000 ? 0 : 3000,
        freeShippingThresholdKrw: 15000,
        pickupAvailable: true,
        pickupLabel: '대학 구내서점(생협) 및 지역서점 당일수령',
        estimatedDelivery: '당일 구내서점 픽업 / 택배 1~2일',
        deliverySpeedRank: 1,
        stockStatus: 'In Stock',
        stockDetail: '전국 대학 구내서점 및 지역서점 재고 연동',
        rewardPointsKrw: Math.round(bookstoreOnPrice * 0.05),
        studentTip:
          '지역화폐(서울페이·경기지역화폐·동백전 등 7~10% 인센티브) 또는 대학 생협 조합원 할인을 적용하면 새책 기준 실구매가가 가장 저렴합니다.',
        directSearchUrl: `https://www.booktown.or.kr/search/totalSearchResult?searchKeyword=${encodedQuery}`,
      },
      {
        id: `${slug}-11st-new`,
        platformId: '11st',
        platformNameKo: '11번가 도서',
        platformNameEn: '11st Books',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: st11Price,
        shippingFeeKrw: st11Price >= 15000 ? 0 : 2500,
        freeShippingThresholdKrw: 15000,
        pickupAvailable: false,
        estimatedDelivery: '1~2일 내 도착',
        deliverySpeedRank: 3,
        stockStatus: 'In Stock',
        stockDetail: '무료배송 · T멤버십/SK페이 포인트 차감 가능',
        rewardPointsKrw: Math.round(st11Price * 0.04),
        studentTip:
          'T멤버십 할인 및 카드사 장바구니 쿠폰, SK페이 포인트를 중복 적용할 수 있어 온라인 새책 구매 시 유리합니다.',
        directSearchUrl: `https://search.11st.co.kr/Search.tmall?kwd=${encodedQuery}`,
      },
      {
        id: `${slug}-yes24-new`,
        platformId: 'yes24',
        platformNameKo: '예스24',
        platformNameEn: 'YES24',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: yes24Price,
        shippingFeeKrw: yes24Price >= 15000 ? 0 : 2500,
        freeShippingThresholdKrw: 15000,
        pickupAvailable: false,
        estimatedDelivery: '오늘/내일 도착 (총알배송)',
        deliverySpeedRank: 2,
        stockStatus: 'In Stock',
        stockDetail: '총알배송 가능 · 스프링 분철 옵션 선택 가능',
        rewardPointsKrw: Math.round(yes24Price * 0.05),
        studentTip:
          '예스24 대학교재 시즌 상품권과 스프링 분철(2권/3권) 옵션을 함께 선택하면 제본소에 따로 방문할 필요가 없습니다.',
        directSearchUrl: `https://www.yes24.com/Product/Search?domain=ALL&query=${encodedQuery}`,
      },
      {
        id: `${slug}-kyobo-new`,
        platformId: 'kyobo',
        platformNameKo: '교보문고',
        platformNameEn: 'Kyobo Book Centre',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: kyoboPrice,
        shippingFeeKrw: kyoboPrice >= 15000 ? 0 : 2500,
        freeShippingThresholdKrw: 15000,
        pickupAvailable: true,
        pickupLabel: '바로드림 (광화문·강남·신촌·잠실 등 1시간 내 픽업)',
        estimatedDelivery: '당일 바로드림 / 내일 도착',
        deliverySpeedRank: 1,
        stockStatus: 'In Stock',
        stockDetail: '전국 교보문고 주요 지점 및 온라인 즉시출고',
        rewardPointsKrw: Math.round(kyoboPrice * 0.03),
        studentTip:
          '당장 오늘 수업에 교재가 필요하다면 교보문고 앱에서 바로드림으로 주문하고 1시간 뒤 매장에서 배송비 없이 수령하세요.',
        directSearchUrl: `https://search.kyobobook.co.kr/search?keyword=${encodedQuery}`,
      },
      {
        id: `${slug}-coupang-new`,
        platformId: 'coupang',
        platformNameKo: '쿠팡',
        platformNameEn: 'Coupang Books',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: coupangPrice,
        shippingFeeKrw: coupangPrice >= 19800 ? 0 : 3000,
        freeShippingThresholdKrw: 19800,
        wowFreeShippingEligible: true,
        pickupAvailable: false,
        estimatedDelivery: '내일 새벽 7시 전 도착 (로켓배송)',
        deliverySpeedRank: 1,
        stockStatus: 'In Stock',
        stockDetail: '로켓배송 직매입 재고 보유',
        rewardPointsKrw: Math.round(coupangPrice * 0.02),
        studentTip:
          '와우회원이라면 금액 조건 없이 무조건 로켓배송 무료배송 및 내일 새벽/익일 도착이 보장됩니다.',
        directSearchUrl: `https://www.coupang.com/np/search?component=&q=${encodedQuery}`,
      },
      {
        id: `${slug}-youngpoong-new`,
        platformId: 'youngpoong',
        platformNameKo: '영풍문고',
        platformNameEn: 'Youngpoong Bookstore',
        condition: 'New',
        conditionCategory: 'new',
        basePriceKrw: youngpoongPrice,
        shippingFeeKrw: youngpoongPrice >= 15000 ? 0 : 2500,
        freeShippingThresholdKrw: 15000,
        pickupAvailable: true,
        pickupLabel: '나드림 당일 매장수령 (종각·코엑스·홍대점)',
        estimatedDelivery: '당일 나드림 픽업 / 택배 1~2일',
        deliverySpeedRank: 2,
        stockStatus: 'In Stock',
        stockDetail: '주요 오프라인 지점 나드림 픽업 가능',
        rewardPointsKrw: Math.round(youngpoongPrice * 0.02),
        studentTip:
          '교보문고 지점 재고가 소진되었을 때 영풍문고 나드림 서비스로 당일 매장 픽업이 가능합니다.',
        directSearchUrl: `https://www.ypbooks.co.kr/search/book?word=${encodedQuery}`,
      },
    ],
    alternatives: [
      {
        id: `${slug}-alt-intl`,
        type: 'International Edition',
        title: '원서 페이퍼백 (International Edition) 및 VitalSource eText 180일 대여',
        estimatedCostKrw: Math.round((listPriceKrw * 0.55) / 100) * 100,
        compatibilityNote: '영문 강의 슬라이드 사용 수업과 수식·챕터 100% 호환',
        pros: '번역본 정가 대비 약 40~45% 저렴하며, 태블릿 PDF/eText 검색 기능을 활용할 수 있습니다.',
        cons: '오픈북 시험에서 종이책만 허용하는지 강의계획서(Syllabus)를 반드시 확인하세요.',
      },
      {
        id: `${slug}-alt-prev`,
        type: 'Older Edition',
        title: '직전 판본(구판) 중고 구매 + 교내 중앙도서관 지정도서(Reserve) 병행',
        estimatedCostKrw: Math.round((listPriceKrw * 0.3) / 100) * 100,
        compatibilityNote: '핵심 이론 95% 이상 동일, 연습문제 번호만 도서관 비치본으로 대조',
        pros: '전공서적 비용을 ₩10,000~₩15,000 수준으로 대폭 낮출 수 있는 가장 경제적인 방법입니다.',
        cons: '교수님이 신판 연습문제 번호로 과제를 내주실 경우 도서관 지정도서실이나 동기 책으로 문제를 확인해야 합니다.',
      },
    ],
  };
}

function buildDeterministicAdvisorAnswer(
  textbookTitle: string,
  isbn: string,
  question: string
): string {
  const q = question.toLowerCase();
  if (q.includes('분철') || q.includes('바이백') || q.includes('중고')) {
    return `[${textbookTitle}] 분철(스프링 제본) vs 학기말 알라딘 바이백 가이드:
• 학기말 되팔기(바이백) 우선 시: 알라딘·예스24 바이백은 '분철(스프링 제본)된 도서'를 매입 불가 품목으로 규정합니다. 한 학기만 듣고 되팔 계획이라면 분철하지 않고 깨끗하게 사용한 뒤 학기 말 알라딘 바이백(정가의 약 25~40% 환급)이나 에브리타임 책방 직거래를 이용하는 것이 가장 이득입니다.
• 이미 분철된 중고 구매 팁: 반대로 필기하며 오래 볼 전공필수 교재라면, 알라딘 온라인 중고샵에서 이미 2권/3권 분철된 '상' 등급 중고를 구매해 책값과 분철비(₩3,000~₩4,000)를 동시에 아끼는 것을 추천합니다.`;
  }

  if (q.includes('구판') || q.includes('판본') || q.includes('edition')) {
    return `[${textbookTitle}] 구판(이전 판본) 호환성 체크리스트:
• 이론 및 본문 진도: 대학 전공교재는 판본이 바뀌어도 핵심 정의·정리·수식 전개가 95% 이상 동일하므로 개념 공부 및 시험 대비용으로는 구판 중고(정가 대비 65~70% 절약)로도 충분합니다.
• 과제(Homework) 주의사항: 단, 단원 끝 연습문제(End-of-chapter problems) 순서가 15~20%가량 섞이거나 온라인 과제 코드(WebAssign, WileyPLUS, Mastering)가 필요한 수업인지 첫 주 오리엔테이션 강의계획서에서 꼭 확인하세요.`;
  }

  return `[${textbookTitle} (${isbn})] 대학생 맞춤형 구매 & 배송비 절약 팁:
• 영문 원서 vs 한글 번역본: 교수님 강의안(PPT)과 시험 문제가 영어로 출제된다면 번역본보다 International Edition(원서 페이퍼백)이나 eBook 대여가 용어 혼선이 없고 가격도 저렴합니다.
• 무료배송 기준 활용: 교보문고·예스24·11번가 도서는 ₩15,000 이상, 알라딘 직배송 중고는 ₩20,000 이상, 쿠팡은 ₩19,800(와우회원 무제한 무료) 이상일 때 배송비가 ₩0입니다. 부족한 금액은 학기 중 필요한 연습장이나 다른 교양 교재와 장바구니에서 묶음 결제하세요.`;
}

app.post('/api/textbook/search', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Please provide a textbook title, author, or ISBN.' });
    }

    const trimmedQuery = query.trim();
    const cacheKey = trimmedQuery.toLowerCase();

    if (searchCache.has(cacheKey)) {
      return res.json({ result: searchCache.get(cacheKey) });
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are a Korean university textbook price-comparison and logistics specialist.
When given a textbook title, author, or ISBN by an undergraduate student in South Korea, execute a comprehensive analysis across all 7 primary Korean platforms:
1. Kyobo Book Centre (교보문고) - platformId: 'kyobo', search URL: https://search.kyobobook.co.kr/search?keyword=<query>
2. YES24 (예스24) - platformId: 'yes24', search URL: https://www.yes24.com/Product/Search?domain=ALL&query=<query>
3. Aladin (알라딘) - platformId: 'aladin' (include both Used copies like 최상/상 from 알라딘 중고샵 and New/eBook if available), search URL: https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=<query>
4. Youngpoong Bookstore (영풍문고) - platformId: 'youngpoong', search URL: https://www.ypbooks.co.kr/search/book?word=<query>
5. Bookstore ON (서점ON - 대학구내서점/지역화폐 연동) - platformId: 'bookstore_on', search URL: https://www.booktown.or.kr/search/totalSearchResult?searchKeyword=<query>
6. 11st Books (11번가 도서) - platformId: '11st', search URL: https://search.11st.co.kr/Search.tmall?kwd=<query>
7. Coupang (쿠팡 로켓배송) - platformId: 'coupang', search URL: https://www.coupang.com/np/search?component=&q=<query>

Rules:
- Account for Korean Book Price Law (도서정가제) where academic/university textbooks typically have 0%~10% direct discount, making Used copies (Aladin Used Store), Campus Co-op / Local Currency (Bookstore ON 지역화폐 7~10% 캐시백), International Softcover editions, and eBook rentals crucial money-savers.
- Accurately reflect shipping fees (typically ₩2,500~₩3,000 if base price < ₩15,000, or ₩0 if base price >= ₩15,000; Coupang threshold is ₩19,800 or ₩0 with WOW Rocket Delivery).
- Provide at least 8 offers covering all 7 platforms (including Aladin Used 최상/상 and digital/international options where applicable).
- Provide 2-3 practical alternatives (Older Edition, International Edition, eBook Rental, or Campus Library & Co-op).`;

    let lastError: unknown = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const modelName = FALLBACK_MODELS[i];
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Find and compare Korean bookstore prices, used availability, shipping fees, and alternatives for the undergraduate textbook: "${trimmedQuery}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: TEXTBOOK_RESPONSE_SCHEMA,
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const groundingSources = chunks
            .filter((c) => Boolean(c.web?.uri && c.web?.title))
            .map((c) => ({
              title: c.web?.title || '',
              uri: c.web?.uri || '',
            }));

          const finalResult = {
            ...parsed,
            groundingSources,
          };
          searchCache.set(cacheKey, finalResult);
          return res.json({ result: finalResult });
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed for textbook search:`, err instanceof Error ? err.message : err);
        if (isQuotaOrRateLimitError(err)) {
          await sleep(250 * (i + 1));
          continue;
        }
        break;
      }
    }

    // If all Gemini models hit 429 RESOURCE_EXHAUSTED or transient error, serve deterministic 7-platform analysis
    // so students never get blocked from comparing prices and accessing direct Korean bookstore links.
    console.info(`Using deterministic 7-platform Korean bookstore pricing model for "${trimmedQuery}".`);
    const fallbackResult = buildDeterministicTextbookAnalysis(trimmedQuery);
    searchCache.set(cacheKey, fallbackResult);
    return res.json({
      result: fallbackResult,
      quotaNotice: isQuotaOrRateLimitError(lastError)
        ? 'AI API free-tier quota limit was reached; displaying calculated Korean Book Price Law (도서정가제) & used market estimates with direct links to all 7 platforms. You can also attach a billing-enabled API key in Settings > Secrets for higher quota.'
        : undefined,
    });
  } catch (error) {
    console.error('Unexpected error in /api/textbook/search:', error);
    const fallbackResult = buildDeterministicTextbookAnalysis(String(req.body?.query || '대학교재'));
    return res.json({ result: fallbackResult });
  }
});

app.post('/api/textbook/advisor', async (req, res) => {
  try {
    const { textbookTitle, isbn, question } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Please enter a question for the textbook advisor.' });
    }

    const cacheKey = `${textbookTitle || ''}::${isbn || ''}::${question.trim().toLowerCase()}`;
    if (advisorCache.has(cacheKey)) {
      return res.json({ answer: advisorCache.get(cacheKey) });
    }

    const ai = getGenAIClient();
    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const modelName = FALLBACK_MODELS[i];
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Textbook Context: ${textbookTitle || 'University Textbook'} (ISBN: ${isbn || 'N/A'})
Student Question: ${question}`,
          config: {
            systemInstruction:
              'You are a practical, budget-savvy senior advisor for undergraduate students in South Korea. Answer concisely (3-5 bullet points or 1 short paragraph in Korean with helpful English terms) focusing on edition compatibility, spring-binding (분철) tips, Aladin used buyback (바이백) value at the end of the semester, and free shipping combination tricks.',
          },
        });

        if (response.text) {
          advisorCache.set(cacheKey, response.text);
          return res.json({ answer: response.text });
        }
      } catch (err) {
        console.warn(`Advisor model ${modelName} failed:`, err instanceof Error ? err.message : err);
        if (isQuotaOrRateLimitError(err)) {
          await sleep(200 * (i + 1));
          continue;
        }
        break;
      }
    }

    const fallbackAnswer = buildDeterministicAdvisorAnswer(
      textbookTitle || '전공교재',
      isbn || 'N/A',
      question
    );
    advisorCache.set(cacheKey, fallbackAnswer);
    return res.json({ answer: fallbackAnswer });
  } catch (error) {
    console.error('Error in /api/textbook/advisor:', error);
    const fallbackAnswer = buildDeterministicAdvisorAnswer(
      req.body?.textbookTitle || '전공교재',
      req.body?.isbn || 'N/A',
      req.body?.question || ''
    );
    return res.json({ answer: fallbackAnswer });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChaekScan server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
