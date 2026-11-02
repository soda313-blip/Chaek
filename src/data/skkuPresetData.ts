import { CampusId, SKKUQueryResult } from '../types/skkuLibrary';

export function makeSkkuUrl(queryOrIsbn: string): string {
  return `https://lib.skku.edu/search/tot/result?st=FRNT&q=${encodeURIComponent(queryOrIsbn)}`;
}

export const SKKU_CORE_TEXTBOOKS: Record<string, {
  keywords: string[];
  titleKo: string;
  titleEn: string;
  courseKo: string;
  isbn13: string;
  generateResult: (campus: CampusId) => SKKUQueryResult;
}> = {
  calculus: {
    keywords: ['미적분', '미분적분학', 'calculus', 'stewart', '스튜어트', '9791160733877'],
    titleKo: '스튜어트 미분적분학 (제9판)',
    titleEn: 'Stewart Calculus: Metric Version (9th Edition)',
    courseKo: '미적분학및연습 1, 2 (공통기초 / 자연계열)',
    isbn13: '9791160733877',
    generateResult: (campus: CampusId): SKKUQueryResult => {
      const isSeoul = campus === 'seoul';
      return {
        query: '스튜어트 미분적분학',
        selectedCampus: campus,
        textbookNameKo: '스튜어트 미분적분학 (제9판)',
        textbookNameEn: 'Stewart Calculus: Metric Version (9th Edition)',
        targetCourseKo: '성균관대 공과대학/자연과학대학 공통기초 [미적분학및연습]',
        quickSummaryNotice: isSeoul
          ? '인사캠 중앙도서관 4층에 9판 실물 2권 및 8판 대체본이 대출가능 상태로 비치되어 있습니다.'
          : '자캠 삼성학술정보관 3층에 9판 실물 4권 및 교보전자도서관 e-Book이 즉시 열람 가능합니다.',
        availableHoldings: [
          {
            id: 'calc-curr-1',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (On Shelf)',
            title: '스튜어트 미분적분학 (제9판)',
            authors: 'James Stewart, Daniel Clegg, Saleem Watson 지음 ; 수학교재편찬위원회 옮김',
            edition: '제9판 (9th Edition, 2021)',
            publisher: '경문사',
            pubYear: '2021',
            isbn13: '9791160733877',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '515 S849c9 2021',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 자연과학 단행본 서가 (515번대)'
              : '삼성학술정보관 3층 과학기술자료실 수리과학 서가 (515번대)',
            isEbook: false,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9791160733877'),
          },
        ],
        alternativeEditions: [
          {
            id: 'calc-alt-8e',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (이전 판본)',
            title: '미분적분학 (제8판)',
            authors: 'James Stewart 지음 ; 수학교재편찬위원회 옮김',
            edition: '제8판 (8th Edition, 2017)',
            publisher: '경문사',
            pubYear: '2017',
            isbn13: '9791160730241',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '515 S849c8 2017',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 (서가 보존본 3권 대출가능)'
              : '삼성학술정보관 3층 과학기술자료실 (서가 5권 대출가능)',
            isEbook: false,
            isAlternativeEdition: true,
            editionDiscrepancyNote:
              '교수님 과제 연습문제 번호가 9판과 약 15% 상이합니다. 개념/이론 학습은 100% 동일하며, 과제 제출 시에만 동기 책이나 도서관 지정도서(Reserve)로 문제 번호를 대조하세요.',
            skkuDirectSearchUrl: makeSkkuUrl('미분적분학 Stewart 경문사 8판'),
          },
        ],
        ebookHoldings: [
          {
            id: 'calc-ebook-1',
            statusBadge: 'EBOOK_AVAILABLE',
            statusTextKo: '전자책 바로보기 (E-Book)',
            title: 'Calculus: Early Transcendentals (9th Edition Metric)',
            authors: 'James Stewart, Daniel K. Clegg, Saleem Watson',
            edition: '9th Edition (Electronic Resource)',
            publisher: 'Cengage Learning',
            pubYear: '2021',
            isbn13: '9780357113516',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: 'SKKU 전자도서관 (통합)',
            buildingNameKo: '교보문고 전자도서관 / Wiley Online',
            callNumber: 'E-BOOK 515.15 S849c9',
            shelfLocationGuide: '성균관대 포털(Kingo) 로그인 후 모바일/PC 즉시 열람 (대출권수 제한 없음)',
            isEbook: true,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9780357113516'),
            ebookDirectAccessUrl: 'https://lib.skku.edu/#/service/ebook',
          },
        ],
        otherCampusHoldings: [
          {
            id: 'calc-cross-campus',
            statusBadge: 'INTER_CAMPUS_LOAN',
            statusTextKo: isSeoul
              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)',
            title: '스튜어트 미분적분학 (제9판 원서 & 번역본)',
            authors: 'James Stewart 외',
            edition: '제9판 (2021)',
            publisher: '경문사 / Cengage',
            pubYear: '2021',
            isbn13: '9791160733877',
            campusId: isSeoul ? 'suwon' : 'seoul',
            campusNameKo: isSeoul ? '자캠 (수원)' : '인사캠 (서울)',
            buildingNameKo: isSeoul ? '삼성학술정보관' : '중앙도서관',
            callNumber: '515 S849c9 2021',
            shelfLocationGuide: isSeoul
              ? '수원 삼성학술정보관 소장 → 도서관 홈페이지 상호대차 신청 시 서울 중앙도서관 대출대에서 1~2일 내 픽업'
              : '서울 중앙도서관 소장 → 상호대차 신청 시 수원 삼성학술정보관 1층 통합데스크에서 1~2일 내 픽업',
            isEbook: false,
            isAlternativeEdition: false,
            interCampusNote: '성균관대 캠퍼스 간 상호대차는 ₩0 무료이며, 평일 기준 신청 후 24~48시간 이내 수령처로 탁송됩니다.',
            skkuDirectSearchUrl: makeSkkuUrl('9791160733877'),
          },
        ],
      };
    },
  },
  economics: {
    keywords: ['맨큐', '경제학', 'mankiw', '맨큐의 경제학', '경제학원론', '9788962185096'],
    titleKo: '맨큐의 경제학 (제9판)',
    titleEn: 'Principles of Economics (9th Edition, N. Gregory Mankiw)',
    courseKo: '경제학원론, 경제학입문 (인사캠 상경계열 및 전교 교양선택)',
    isbn13: '9788962185096',
    generateResult: (campus: CampusId): SKKUQueryResult => {
      const isSeoul = campus === 'seoul';
      return {
        query: '맨큐의 경제학',
        selectedCampus: campus,
        textbookNameKo: '맨큐의 경제학 (제9판)',
        textbookNameEn: 'Principles of Economics (9th Edition, N. Gregory Mankiw)',
        targetCourseKo: '경제대학/경영대학 [경제학원론 1, 2] 및 다학제 전공기초',
        quickSummaryNotice: isSeoul
          ? '인사캠 중앙도서관 3층 사회과학자료실에 9판 실물 3권이 대출가능 상태로 비치되어 있습니다.'
          : '자캠 삼성학술정보관 4층 인문사회자료실 및 전자책 플랫폼에서 즉시 대출/열람 가능합니다.',
        availableHoldings: [
          {
            id: 'econ-curr-1',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (On Shelf)',
            title: '맨큐의 경제학 (제9판)',
            authors: 'N. Gregory Mankiw 저 ; 김경환, 김종석 역',
            edition: '제9판 (9th Edition, 2021)',
            publisher: 'Cengage Learning / 센게이지러닝코리아',
            pubYear: '2021',
            isbn13: '9788962185096',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '330 M278p9 2021',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 3층 제2자료실 경제학 서가 (330번대)'
              : '삼성학술정보관 4층 인문사회자료실 경제학 서가 (330번대)',
            isEbook: false,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9788962185096'),
          },
        ],
        alternativeEditions: [
          {
            id: 'econ-alt-8e',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (이전 판본)',
            title: '맨큐의 경제학 (제8판)',
            authors: 'N. Gregory Mankiw 저 ; 김경환, 김종석 역',
            edition: '제8판 (2018)',
            publisher: '센게이지러닝',
            pubYear: '2018',
            isbn13: '9788962184136',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '330 M278p8 2018',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 3층 제2자료실 (서가 4권 보유)'
              : '삼성학술정보관 4층 인문사회자료실 (서가 2권 보유)',
            isEbook: false,
            isAlternativeEdition: true,
            editionDiscrepancyNote:
              '8판과 9판은 거시경제 통계 사례와 2020년 팬데믹 이후 사례 연구 일부를 제외하고 수요·공급 곡선 이론 및 장별 핵심 구성이 95% 이상 일치합니다.',
            skkuDirectSearchUrl: makeSkkuUrl('맨큐의 경제학 8판'),
          },
        ],
        ebookHoldings: [
          {
            id: 'econ-ebook-1',
            statusBadge: 'EBOOK_AVAILABLE',
            statusTextKo: '전자책 바로보기 (E-Book)',
            title: 'Principles of Economics (9th Edition)',
            authors: 'N. Gregory Mankiw',
            edition: '9th Edition (Cengage MindTap Electronic Edition)',
            publisher: 'Cengage Learning',
            pubYear: '2021',
            isbn13: '9780357038314',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: 'SKKU 전자도서관 (통합)',
            buildingNameKo: '성균관대 전자정보원 / ProQuest Ebook Central',
            callNumber: 'E-BOOK 330 M278p9',
            shelfLocationGuide: 'SKKU 교외접속 인증 후 웹 브라우저/PDF로 전문 다운로드 및 키워드 검색 지원',
            isEbook: true,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9780357038314'),
            ebookDirectAccessUrl: 'https://lib.skku.edu/#/service/ebook',
          },
        ],
        otherCampusHoldings: [
          {
            id: 'econ-cross-campus',
            statusBadge: 'INTER_CAMPUS_LOAN',
            statusTextKo: isSeoul
              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)',
            title: '맨큐의 경제학 (제9판)',
            authors: 'N. Gregory Mankiw 저',
            edition: '제9판 (2021)',
            publisher: 'Cengage Learning',
            pubYear: '2021',
            isbn13: '9788962185096',
            campusId: isSeoul ? 'suwon' : 'seoul',
            campusNameKo: isSeoul ? '자캠 (수원)' : '인사캠 (서울)',
            buildingNameKo: isSeoul ? '삼성학술정보관' : '중앙도서관',
            callNumber: '330 M278p9 2021',
            shelfLocationGuide: isSeoul
              ? '수원 삼성학술정보관 4층 (상호대차 신청 시 서울 중앙도서관 1층 데스크 수령)'
              : '서울 중앙도서관 3층 (상호대차 신청 시 수원 삼성학술정보관 1층 통합데스크 수령)',
            isEbook: false,
            isAlternativeEdition: false,
            interCampusNote: '신청 당일 오후 4시 이전 접수 시 익일 셔틀버스로 타 캠퍼스 도서관에 도착합니다.',
            skkuDirectSearchUrl: makeSkkuUrl('9788962185096'),
          },
        ],
      };
    },
  },
  os: {
    keywords: ['운영체제', 'os', 'silberschatz', '공룡책', 'operating systems', '9791185475578'],
    titleKo: '운영체제 (제10판 · 공룡책)',
    titleEn: 'Operating System Concepts (10th Edition, Silberschatz)',
    courseKo: '소프트웨어학과/컴퓨터공학과 전공핵심 [운영체제]',
    isbn13: '9791185475578',
    generateResult: (campus: CampusId): SKKUQueryResult => {
      const isSeoul = campus === 'seoul';
      return {
        query: '운영체제 공룡책',
        selectedCampus: campus,
        textbookNameKo: '운영체제 (제10판 · 공룡책)',
        textbookNameEn: 'Operating System Concepts (10th Edition, Silberschatz)',
        targetCourseKo: '소프트웨어융합대학 [운영체제 / Operating Systems]',
        quickSummaryNotice: isSeoul
          ? '인사캠 중앙도서관 4층 제1자료실에 10판 1권, 9판 2권 및 영문 e-Book이 즉시 대출/열람 가능합니다.'
          : '자캠 삼성학술정보관 3층 과학기술자료실에 10판 한글본 3권과 Wiley 영문 e-Book이 비치되어 있습니다.',
        availableHoldings: [
          {
            id: 'os-curr-1',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (On Shelf)',
            title: '운영체제 (제10판)',
            authors: 'Abraham Silberschatz, Peter Baer Galvin, Greg Gagne ; 박민규 옮김',
            edition: '제10판 (10th Edition, 2020)',
            publisher: '퍼스트북 (Firstbook)',
            pubYear: '2020',
            isbn13: '9791185475578',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: 'QA76.76.O63 S5512 2020',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 전산학 서가 (QA76번대)'
              : '삼성학술정보관 3층 과학기술자료실 컴퓨터과학 서가 (QA76번대)',
            isEbook: false,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9791185475578'),
          },
        ],
        alternativeEditions: [
          {
            id: 'os-alt-9e',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (이전 판본)',
            title: 'Operating System Concepts (9th Edition, International Edition)',
            authors: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
            edition: '9th Edition (2013)',
            publisher: 'John Wiley & Sons',
            pubYear: '2013',
            isbn13: '9781118093757',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: 'QA76.76.O63 S55 2013',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 서가'
              : '삼성학술정보관 3층 과학기술자료실 원서 서가',
            isEbook: false,
            isAlternativeEdition: true,
            editionDiscrepancyNote:
              '10판에서는 리눅스 커널 모듈, 멀티스레드 POSIX 실습 및 가상 메모리 예제가 개편되었습니다. 시험 개념 공부는 9판으로도 90% 이상 커버됩니다.',
            skkuDirectSearchUrl: makeSkkuUrl('Operating System Concepts 9th'),
          },
        ],
        ebookHoldings: [
          {
            id: 'os-ebook-1',
            statusBadge: 'EBOOK_AVAILABLE',
            statusTextKo: '전자책 바로보기 (E-Book)',
            title: 'Operating System Concepts (10th Edition Enhanced E-Text)',
            authors: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
            edition: '10th Edition (Wiley E-Text)',
            publisher: 'Wiley',
            pubYear: '2020',
            isbn13: '9781119456339',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: 'SKKU 전자도서관 (통합)',
            buildingNameKo: 'Wiley Online Library / 성균관대 학술DB',
            callNumber: 'E-BOOK QA76.76.O63',
            shelfLocationGuide: 'SKKU 도서관 홈페이지 로그인 시 전 챕터 인터랙티브 다이어그램 열람 가능',
            isEbook: true,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9781119456339'),
            ebookDirectAccessUrl: 'https://lib.skku.edu/#/service/ebook',
          },
        ],
        otherCampusHoldings: [
          {
            id: 'os-cross-campus',
            statusBadge: 'INTER_CAMPUS_LOAN',
            statusTextKo: isSeoul
              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)',
            title: '운영체제 (제10판)',
            authors: 'Abraham Silberschatz 외',
            edition: '제10판 (2020)',
            publisher: '퍼스트북',
            pubYear: '2020',
            isbn13: '9791185475578',
            campusId: isSeoul ? 'suwon' : 'seoul',
            campusNameKo: isSeoul ? '자캠 (수원)' : '인사캠 (서울)',
            buildingNameKo: isSeoul ? '삼성학술정보관' : '중앙도서관',
            callNumber: 'QA76.76.O63 S5512 2020',
            shelfLocationGuide: isSeoul
              ? '수원 삼성학술정보관 소장 → 상호대차 신청 시 서울 중앙도서관 1층 데스크 수령'
              : '서울 중앙도서관 소장 → 상호대차 신청 시 수원 삼성학술정보관 1층 통합데스크 수령',
            isEbook: false,
            isAlternativeEdition: false,
            interCampusNote: '상호대차 신청 시 셔틀버스를 통해 1~2일 내 도착하며, 연체료 없이 14일간 대출 가능합니다.',
            skkuDirectSearchUrl: makeSkkuUrl('9791185475578'),
          },
        ],
      };
    },
  },
  organicChem: {
    keywords: ['유기화학', 'mcmurry', '맥머리', '맥머리의 유기화학', 'organic chemistry', '9788992603935'],
    titleKo: '맥머리의 유기화학 (제9판)',
    titleEn: 'Organic Chemistry (9th Edition, John E. McMurry)',
    courseKo: '유기화학 1, 2 (자캠 화학과, 화학공학부, 약학대학)',
    isbn13: '9788992603935',
    generateResult: (campus: CampusId): SKKUQueryResult => {
      const isSeoul = campus === 'seoul';
      return {
        query: '맥머리의 유기화학',
        selectedCampus: campus,
        textbookNameKo: '맥머리의 유기화학 (제9판)',
        textbookNameEn: 'Organic Chemistry (9th Edition, John E. McMurry)',
        targetCourseKo: '자연과학대학/약학대학 [유기화학 1, 2]',
        quickSummaryNotice: isSeoul
          ? '인사캠 중앙도서관 4층에 8판 및 영문 9판이 대출가능하며, 수원 삼성학술정보관 소장 9판 한글본을 상호대차로 신청할 수 있습니다.'
          : '자캠 삼성학술정보관 3층에 9판 실물 3권 및 OpenStax 10판 합법 무료 e-Book이 즉시 열람 가능합니다.',
        availableHoldings: [
          {
            id: 'chem-curr-1',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (On Shelf)',
            title: '맥머리의 유기화학 (제9판)',
            authors: 'John McMurry 저 ; 화학교재연구회 역',
            edition: '제9판 (2017)',
            publisher: '사이플러스 (SciPlus)',
            pubYear: '2017',
            isbn13: '9788992603935',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: 'QD251.3 M3812 2017',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 화학 서가 (QD251번대)'
              : '삼성학술정보관 3층 과학기술자료실 유기화학 서가 (QD251번대)',
            isEbook: false,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9788992603935'),
          },
        ],
        alternativeEditions: [
          {
            id: 'chem-alt-8e',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (이전 판본)',
            title: '유기화학 (제8판)',
            authors: 'John McMurry 저 ; 화학교재연구회 역',
            edition: '제8판 (2012)',
            publisher: '사이플러스',
            pubYear: '2012',
            isbn13: '9788992603522',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: 'QD251.3 M3812 2012',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 (서가 2권 비치)'
              : '삼성학술정보관 3층 과학기술자료실 (서가 4권 비치)',
            isEbook: false,
            isAlternativeEdition: true,
            editionDiscrepancyNote:
              '반응 메커니즘 곡선화살표 및 반응식 설명은 8판과 9판이 거의 동일합니다. 챕터 끝 연습문제 번호 일부만 상이하므로 과제 시 확인이 필요합니다.',
            skkuDirectSearchUrl: makeSkkuUrl('맥머리 유기화학 8판'),
          },
        ],
        ebookHoldings: [
          {
            id: 'chem-ebook-openstax',
            statusBadge: 'EBOOK_AVAILABLE',
            statusTextKo: '전자책 바로보기 (OpenStax 무료 원서)',
            title: 'Organic Chemistry (10th Edition - OpenStax Official)',
            authors: 'John E. McMurry',
            edition: '10th Edition (OpenStax Free Access)',
            publisher: 'OpenStax / Rice University',
            pubYear: '2023',
            isbn13: '9781711470559',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: '공식 오픈액세스 (100% 무료)',
            buildingNameKo: 'OpenStax / 성균관대 도서관 전자원',
            callNumber: 'OPEN-ACCESS QD251.3',
            shelfLocationGuide: '원저자 John McMurry 교수가 전세계 학생을 위해 전면 무료 공개한 공식 웹뷰어/PDF',
            isEbook: true,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9781711470559'),
            ebookDirectAccessUrl: 'https://openstax.org/details/books/organic-chemistry',
          },
        ],
        otherCampusHoldings: [
          {
            id: 'chem-cross-campus',
            statusBadge: 'INTER_CAMPUS_LOAN',
            statusTextKo: isSeoul
              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)',
            title: '맥머리의 유기화학 (제9판 번역본 3부)',
            authors: 'John McMurry 저',
            edition: '제9판 (2017)',
            publisher: '사이플러스',
            pubYear: '2017',
            isbn13: '9788992603935',
            campusId: isSeoul ? 'suwon' : 'seoul',
            campusNameKo: isSeoul ? '자캠 (수원)' : '인사캠 (서울)',
            buildingNameKo: isSeoul ? '삼성학술정보관' : '중앙도서관',
            callNumber: 'QD251.3 M3812 2017',
            shelfLocationGuide: isSeoul
              ? '자캠 삼성학술정보관 3층 서가 소장 → 상호대차 신청 시 서울 중앙도서관 대출대 수령'
              : '인사캠 중앙도서관 4층 서가 소장 → 상호대차 신청 시 수원 삼성학술정보관 통합데스크 수령',
            isEbook: false,
            isAlternativeEdition: false,
            interCampusNote: '상호대차 신청 후 1~2일 이내 도착 문자(SMS) 알림이 발송됩니다.',
            skkuDirectSearchUrl: makeSkkuUrl('9788992603935'),
          },
        ],
      };
    },
  },
  physics: {
    keywords: ['물리학', '할리데이', 'halliday', '일반물리학', 'physics', '9791190017077'],
    titleKo: '일반물리학 (제11판 · Halliday & Resnick)',
    titleEn: 'Principles of Physics (11th Edition, Halliday & Resnick)',
    courseKo: '일반물리학및실험 1, 2 (자캠 이공계열 공통기초)',
    isbn13: '9791190017077',
    generateResult: (campus: CampusId): SKKUQueryResult => {
      const isSeoul = campus === 'seoul';
      return {
        query: '할리데이 일반물리학',
        selectedCampus: campus,
        textbookNameKo: '일반물리학 (제11판 · Halliday & Resnick)',
        textbookNameEn: 'Principles of Physics (11th Edition, Halliday & Resnick)',
        targetCourseKo: '공과대학/자연과학대학/정보통신대학 공통기초 [일반물리학]',
        quickSummaryNotice: isSeoul
          ? '인사캠 중앙도서관 4층에 11판 1권 및 10판 3권이 대출가능 상태로 비치되어 있습니다.'
          : '자캠 삼성학술정보관 3층에 11판 1권/2권 실물 5부와 Wiley e-Book이 즉시 대출가능합니다.',
        availableHoldings: [
          {
            id: 'phys-curr-1',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (On Shelf)',
            title: '일반물리학 (제11판 · 1/2권)',
            authors: 'David Halliday, Robert Resnick, Jearl Walker ; 고려대·연세대 등 물리학과 교수 공역',
            edition: '제11판 (11th Edition, 2021)',
            publisher: '텍스트북스',
            pubYear: '2021',
            isbn13: '9791190017077',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '530 H188f11 2021',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 물리학 서가 (530번대)'
              : '삼성학술정보관 3층 과학기술자료실 물리학 단행본 서가 (530번대)',
            isEbook: false,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9791190017077'),
          },
        ],
        alternativeEditions: [
          {
            id: 'phys-alt-10e',
            statusBadge: 'AVAILABLE_NOW',
            statusTextKo: '대출 가능 (이전 판본)',
            title: '일반물리학 (제10판)',
            authors: 'David Halliday 외 저',
            edition: '제10판 (2015)',
            publisher: '범한서적',
            pubYear: '2015',
            isbn13: '9788971292723',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: isSeoul ? '인사캠 (서울)' : '자캠 (수원)',
            buildingNameKo: isSeoul ? '중앙도서관' : '삼성학술정보관',
            callNumber: '530 H188f10 2015',
            shelfLocationGuide: isSeoul
              ? '중앙도서관 4층 제1자료실 서가 3권 대출가능'
              : '삼성학술정보관 3층 과학기술자료실 서가 6권 대출가능',
            isEbook: false,
            isAlternativeEdition: true,
            editionDiscrepancyNote:
              '10판과 11판은 예제 및 물리 법칙 설명이 거의 동일하며, 연습문제 순서와 숫자 데이터만 약간 다릅니다.',
            skkuDirectSearchUrl: makeSkkuUrl('일반물리학 Halliday 10판'),
          },
        ],
        ebookHoldings: [
          {
            id: 'phys-ebook-1',
            statusBadge: 'EBOOK_AVAILABLE',
            statusTextKo: '전자책 바로보기 (E-Book)',
            title: 'Halliday & Resnick Fundamentals of Physics (11th Edition)',
            authors: 'David Halliday, Robert Resnick, Jearl Walker',
            edition: '11th Edition (Wiley E-Text)',
            publisher: 'Wiley',
            pubYear: '2021',
            isbn13: '9781119460138',
            campusId: isSeoul ? 'seoul' : 'suwon',
            campusNameKo: 'SKKU 전자도서관 (통합)',
            buildingNameKo: 'Wiley Online / 교보문고 전자도서관',
            callNumber: 'E-BOOK 530 H188f11',
            shelfLocationGuide: 'SKKU 킹고(Kingo) 계정 인증 시 180일 학기 대여 및 실시간 검색 지원',
            isEbook: true,
            isAlternativeEdition: false,
            skkuDirectSearchUrl: makeSkkuUrl('9781119460138'),
            ebookDirectAccessUrl: 'https://lib.skku.edu/#/service/ebook',
          },
        ],
        otherCampusHoldings: [
          {
            id: 'phys-cross-campus',
            statusBadge: 'INTER_CAMPUS_LOAN',
            statusTextKo: isSeoul
              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)',
            title: '일반물리학 (제11판 · 1권/2권)',
            authors: 'David Halliday 외 저',
            edition: '제11판 (2021)',
            publisher: '텍스트북스',
            pubYear: '2021',
            isbn13: '9791190017077',
            campusId: isSeoul ? 'suwon' : 'seoul',
            campusNameKo: isSeoul ? '자캠 (수원)' : '인사캠 (서울)',
            buildingNameKo: isSeoul ? '삼성학술정보관' : '중앙도서관',
            callNumber: '530 H188f11 2021',
            shelfLocationGuide: isSeoul
              ? '수원 삼성학술정보관 3층 소장 → 상호대차 신청 시 서울 중앙도서관 수령'
              : '서울 중앙도서관 4층 소장 → 상호대차 신청 시 수원 삼성학술정보관 수령',
            isEbook: false,
            isAlternativeEdition: false,
            interCampusNote: '상호대차 비용은 무료이며 수령지 도서관 1층 통합데스크에서 학생증 태그 후 수령합니다.',
            skkuDirectSearchUrl: makeSkkuUrl('9791190017077'),
          },
        ],
      };
    },
  },
};
