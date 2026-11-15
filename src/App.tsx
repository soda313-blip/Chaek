import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Check,
  Plus,
  Trash2,
  Download,
  BookOpen,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  GraduationCap,
  Laptop,
  ArrowRight,
  BookMarked,
  Globe,
  Calculator,
} from 'lucide-react';
import {
  TextbookAnalysisResult,
  PlatformOffer,
  StudentPreferences,
  BookBagItem,
  AppLanguage,
  SkkuCampus,
  SkkuLibraryHolding,
  BudgetPlanResult,
} from './types/textbook';
import { PRESET_TEXTBOOKS } from './data/presetTextbooks';
import {
  TRANSLATIONS,
  localizeConditionTag,
  localizePlatformDisplayName,
  localizeSkkuStatusBadge,
  localizeSkkuRepository,
  localizeSkkuShelfGuidance,
} from './data/translations';
import BudgetPlannerView from './components/BudgetPlannerView';

type ConditionFilter = 'all' | 'new' | 'used' | 'digital';
type SortMode = 'total_cost' | 'effective_cost' | 'speed';
type WorkspaceMode = 'search' | 'budget';

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

export default function App() {
  // Language State: 'ko' (한국어), 'en' (English), or 'zh' (中文)
  const [lang, setLang] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('chaekscan_lang');
      if (saved === 'ko' || saved === 'en' || saved === 'zh') return saved;
    } catch {}
    return 'ko';
  });

  const handleToggleLanguage = (newLang: AppLanguage) => {
    setLang(newLang);
    try {
      localStorage.setItem('chaekscan_lang', newLang);
    } catch {}
  };

  const t = TRANSLATIONS[lang];

  // No textbook is displayed until the user searches for one
  const [activeTextbook, setActiveTextbook] = useState<TextbookAnalysisResult | null>(
    null
  );

  // SKKU Default Campus: 'seoul' (인사캠) or 'suwon' (자캠)
  const [skkuCampus, setSkkuCampus] = useState<SkkuCampus>(() => {
    try {
      const saved = localStorage.getItem('skku_campus_pref');
      if (saved === 'seoul' || saved === 'suwon') return saved;
    } catch {}
    return 'seoul';
  });

  const handleToggleCampus = (campus: SkkuCampus) => {
    setSkkuCampus(campus);
    try {
      localStorage.setItem('skku_campus_pref', campus);
    } catch {}
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Image fallback state
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Filter & sort preferences
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('total_cost');
  const [preferences, setPreferences] = useState<StudentPreferences>({
    hasWowMembership: true,
    includeUsed: true,
    includeDigital: true,
    preferPickup: false,
    deductRewardPoints: false,
  });

  // Expanded offer row
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Semester Book Bag state (starts empty)
  const [bookBag, setBookBag] = useState<BookBagItem[]>([]);
  const [isBookBagOpen, setIsBookBagOpen] = useState(false);

  // Advisor Q&A state
  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [advisorAnswer, setAdvisorAnswer] = useState<string | null>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // Workspace Mode & Budget Book Planner State
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('search');
  const [targetBudgetKrw, setTargetBudgetKrw] = useState<number>(80000);
  const [budgetBooksList, setBudgetBooksList] = useState<string[]>([]);
  const [prioritizeLibraryZeroCost, setPrioritizeLibraryZeroCost] = useState<boolean>(true);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlanResult | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [budgetPlanError, setBudgetPlanError] = useState<string | null>(null);

  const handleGenerateBudgetPlan = async (
    overrideBudget?: number,
    overrideBooks?: string[],
    overrideLib?: boolean
  ) => {
    const budgetToUse = typeof overrideBudget === 'number' ? overrideBudget : targetBudgetKrw;
    const booksToUse = overrideBooks || budgetBooksList;
    const libToUse = typeof overrideLib === 'boolean' ? overrideLib : prioritizeLibraryZeroCost;

    if (booksToUse.length === 0) {
      setBudgetPlanError(
        lang === 'en'
          ? 'Please add at least one textbook or course.'
          : lang === 'zh'
          ? '请至少添加一本教材或一门课程。'
          : '최소 1권 이상의 교재명 또는 과목명을 추가해 주세요.'
      );
      return;
    }

    setBudgetPlanError(null);
    setIsGeneratingPlan(true);

    try {
      const response = await fetch('/api/textbook/budget-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBudgetKrw: budgetToUse,
          books: booksToUse,
          campus: skkuCampus,
          prioritizeLibraryZeroCost: libToUse,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Failed to generate budget plan.');
      }

      setBudgetPlan(data.plan);
    } catch (err) {
      setBudgetPlanError(
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'An error occurred while generating the budget plan.'
          : lang === 'zh'
          ? '生成预算方案时发生错误，请重试。'
          : '예산 플랜을 생성하는 중 오류가 발생했습니다.'
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const computeOfferMetrics = (offer: PlatformOffer, listPrice: number) => {
    let shipping = offer.shippingFeeKrw;
    if (
      offer.platformId === 'coupang' &&
      preferences.hasWowMembership &&
      offer.wowFreeShippingEligible
    ) {
      shipping = 0;
    } else if (
      offer.freeShippingThresholdKrw > 0 &&
      offer.basePriceKrw >= offer.freeShippingThresholdKrw
    ) {
      shipping = 0;
    }

    if (preferences.preferPickup && offer.pickupAvailable) {
      shipping = 0;
    }

    const totalCost = offer.basePriceKrw + shipping;
    const effectiveCost = preferences.deductRewardPoints
      ? Math.max(0, totalCost - offer.rewardPointsKrw)
      : totalCost;
    const savingsVsList = Math.max(0, listPrice - totalCost);
    const savingsPercent =
      listPrice > 0 ? Math.round((savingsVsList / listPrice) * 100) : 0;

    return {
      shipping,
      totalCost,
      effectiveCost,
      savingsVsList,
      savingsPercent,
    };
  };

  const processedOffers = useMemo(() => {
    if (!activeTextbook) return [];

    const filtered = activeTextbook.offers.filter((offer) => {
      if (conditionFilter !== 'all' && offer.conditionCategory !== conditionFilter) {
        return false;
      }
      if (preferences.preferPickup && !offer.pickupAvailable) {
        return false;
      }
      return true;
    });

    return filtered
      .map((offer) => ({
        offer,
        metrics: computeOfferMetrics(offer, activeTextbook.listPriceKrw),
      }))
      .sort((a, b) => {
        if (sortMode === 'effective_cost') {
          return a.metrics.effectiveCost - b.metrics.effectiveCost;
        }
        if (sortMode === 'speed') {
          if (a.offer.deliverySpeedRank !== b.offer.deliverySpeedRank) {
            return a.offer.deliverySpeedRank - b.offer.deliverySpeedRank;
          }
          return a.metrics.totalCost - b.metrics.totalCost;
        }
        return a.metrics.totalCost - b.metrics.totalCost;
      });
  }, [activeTextbook, conditionFilter, sortMode, preferences]);

  const summaryBenchmarks = useMemo(() => {
    if (!activeTextbook) return null;

    const allWithMetrics = activeTextbook.offers.map((offer) => ({
      offer,
      metrics: computeOfferMetrics(offer, activeTextbook.listPriceKrw),
    }));

    const cheapestOverall = [...allWithMetrics].sort(
      (a, b) => a.metrics.totalCost - b.metrics.totalCost
    )[0];

    const cheapestNew = [...allWithMetrics]
      .filter((x) => x.offer.conditionCategory === 'new')
      .sort((a, b) => a.metrics.totalCost - b.metrics.totalCost)[0];

    const fastestOption = [...allWithMetrics].sort((a, b) => {
      if (a.offer.deliverySpeedRank !== b.offer.deliverySpeedRank) {
        return a.offer.deliverySpeedRank - b.offer.deliverySpeedRank;
      }
      return a.metrics.totalCost - b.metrics.totalCost;
    })[0];

    return { cheapestOverall, cheapestNew, fastestOption };
  }, [activeTextbook, preferences]);

  const directSkkuCatalogUrl = useMemo(() => {
    if (!activeTextbook) return 'https://lib.skku.edu/';
    if (activeTextbook.skkuDirectSearchUrl) return activeTextbook.skkuDirectSearchUrl;
    const query = encodeURIComponent(activeTextbook.isbn13 || activeTextbook.titleKo);
    return `https://lib.skku.edu/search/tot/result?st=FRNT&q=${query}`;
  }, [activeTextbook]);

  const skkuHoldingData = useMemo(() => {
    if (!activeTextbook) return null;
    const holdings = activeTextbook.skkuLibraryHoldings || [];

    // STRICT "Available Only" Rule:
    // Filter out checked-out items entirely.
    // Display ONLY items physically on the shelf (대출가능) or accessible digitally (전자책 / E-Book).
    const availableItems = holdings.filter(
      (h) => h.status === 'available' || h.status === 'ebook' || h.status === 'alternative_edition'
    );

    const onMyCampus = availableItems.filter(
      (h) => !h.isDigitalEbook && h.campus === skkuCampus
    );
    const onOtherCampus = availableItems.filter(
      (h) => !h.isDigitalEbook && h.campus !== skkuCampus
    );
    const digitalEbooks = availableItems.filter(
      (h) => h.isDigitalEbook || h.status === 'ebook'
    );
    const alternativeEditions = availableItems.filter((h) => h.isAlternativeEdition);

    return {
      allAvailable: availableItems,
      onMyCampus,
      onOtherCampus,
      digitalEbooks,
      alternativeEditions,
    };
  }, [activeTextbook, skkuCampus]);

  const executeSearch = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setSearchError(null);
    setAdvisorAnswer(null);
    setConditionFilter('all');

    // Match built-in verified presets first for instant response
    const normalized = trimmed.toLowerCase().replace(/[-\s]/g, '');
    const matchedPreset = PRESET_TEXTBOOKS.find((b) => {
      const isbnClean = b.isbn13.replace(/[-\s]/g, '');
      return (
        isbnClean === normalized ||
        b.titleKo.toLowerCase().replace(/\s/g, '').includes(normalized) ||
        b.titleEn.toLowerCase().replace(/\s/g, '').includes(normalized)
      );
    });

    if (matchedPreset && normalized.length >= 2) {
      setActiveTextbook(matchedPreset);
      setExpandedOfferId(matchedPreset.offers[0]?.id || null);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch('/api/textbook/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Failed to retrieve textbook price comparison.');
      }

      const result: TextbookAnalysisResult = data.result;
      setActiveTextbook(result);
      setExpandedOfferId(result.offers[0]?.id || null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : '일시적인 오류가 발생했습니다. 다시 시도해 주세요.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(searchQuery);
  };

  const handleAddToBookBag = (offer: PlatformOffer) => {
    if (!activeTextbook) return;
    const newItem: BookBagItem = {
      bagItemId: `${activeTextbook.id}-${offer.id}`,
      textbookId: activeTextbook.id,
      textbookTitleKo: activeTextbook.titleKo,
      textbookTitleEn: activeTextbook.titleEn,
      isbn13: activeTextbook.isbn13,
      listPriceKrw: activeTextbook.listPriceKrw,
      offer,
    };

    setBookBag((prev) => {
      const filtered = prev.filter((item) => item.textbookId !== activeTextbook.id);
      return [...filtered, newItem];
    });
  };

  const handleRemoveFromBookBag = (bagItemId: string) => {
    setBookBag((prev) => prev.filter((item) => item.bagItemId !== bagItemId));
  };

  const handleExportCsv = () => {
    if (!activeTextbook) return;
    const headers =
      lang === 'ko'
        ? [
            '순위',
            '서점',
            '상태',
            '도서 가격 (원)',
            '배송비 (원)',
            '총 실구매가 (원)',
            '예상 적립금 (원)',
            '배송 예정',
            '재고 상태',
            '서점 바로가기 URL',
          ]
        : lang === 'zh'
        ? [
            '排名',
            '书店平台',
            '品相状态',
            '图书单价 (KRW)',
            '运费 (KRW)',
            '实付总价 (KRW)',
            '预计返积分 (KRW)',
            '预计送达',
            '库存状态',
            '直达链接 URL',
          ]
        : [
            'Rank',
            'Platform',
            'Condition',
            'Base Price (KRW)',
            'Shipping Fee (KRW)',
            'Total Cost (KRW)',
            'Reward Points (KRW)',
            'Delivery Estimate',
            'Stock Status',
            'Direct URL',
          ];
    const rows = processedOffers.map(({ offer, metrics }, idx) => [
      idx + 1,
      `"${localizePlatformDisplayName(offer.platformId, offer.platformNameKo, offer.platformNameEn, lang)}"`,
      `"${localizeConditionTag(offer.condition, lang)}"`,
      offer.basePriceKrw,
      metrics.shipping,
      metrics.totalCost,
      offer.rewardPointsKrw,
      `"${offer.estimatedDelivery}"`,
      `"${offer.stockStatus}"`,
      `"${offer.directSearchUrl}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chaekscan_${activeTextbook.isbn13}_${lang}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAskAdvisor = async (questionText: string) => {
    if (!activeTextbook) return;
    const q = questionText.trim();
    if (!q) return;
    setAdvisorQuestion(q);
    setIsAdvisorLoading(true);
    try {
      const response = await fetch('/api/textbook/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textbookTitle: activeTextbook.titleKo,
          isbn: activeTextbook.isbn13,
          question: q,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Advisor request failed');
      }
      setAdvisorAnswer(data.answer);
    } catch (err) {
      setAdvisorAnswer(
        err instanceof Error
          ? `오류: ${err.message}`
          : '답변을 불러오는 중 문제가 발생했습니다.'
      );
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const bookBagSummary = useMemo(() => {
    let totalListPrice = 0;
    let totalBasePrice = 0;
    let totalShipping = 0;
    let totalPoints = 0;

    const platformSubtotals: Record<string, number> = {};
    bookBag.forEach((item) => {
      platformSubtotals[item.offer.platformId] =
        (platformSubtotals[item.offer.platformId] || 0) + item.offer.basePriceKrw;
    });

    bookBag.forEach((item) => {
      totalListPrice += item.listPriceKrw;
      totalBasePrice += item.offer.basePriceKrw;
      totalPoints += item.offer.rewardPointsKrw;

      const combinedPlatformSubtotal =
        platformSubtotals[item.offer.platformId] || item.offer.basePriceKrw;
      const threshold = item.offer.freeShippingThresholdKrw || 15000;

      if (
        combinedPlatformSubtotal >= threshold ||
        (item.offer.platformId === 'coupang' && preferences.hasWowMembership)
      ) {
        totalShipping += 0;
      } else {
        totalShipping += item.offer.shippingFeeKrw;
      }
    });

    const grandTotal = totalBasePrice + totalShipping;
    const totalSaved = Math.max(0, totalListPrice - grandTotal);

    return {
      totalListPrice,
      totalBasePrice,
      totalShipping,
      totalPoints,
      grandTotal,
      totalSaved,
    };
  }, [bookBag, preferences.hasWowMembership]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900">
      {/* Header with SKKU Campus, Language Toggle & Book Bag */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-10 py-3">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('search');
                setActiveTextbook(null);
                setSearchQuery('');
                setSearchError(null);
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display cursor-pointer hover:text-blue-900 transition-colors"
            >
              {t.brandTitle}
            </button>

            {/* SKKU Campus Switcher */}
            <div className="inline-flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <span className="hidden md:inline-flex items-center gap-1 px-2 text-slate-700 font-semibold border-r border-slate-300 mr-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
                <span>{t.skkuBadge}</span>
              </span>
              <button
                type="button"
                onClick={() => handleToggleCampus('seoul')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  skkuCampus === 'seoul'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={t.campusSeoulTooltip}
              >
                {t.campusSeoul}
              </button>
              <button
                type="button"
                onClick={() => handleToggleCampus('suwon')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  skkuCampus === 'suwon'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={t.campusSuwonTooltip}
              >
                {t.campusSuwon}
              </button>
            </div>

            {/* Language Switcher (Korean / English / Chinese) */}
            <div className="inline-flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <span className="hidden sm:inline-flex items-center px-1.5 text-slate-600">
                <Globe className="w-3.5 h-3.5" />
              </span>
              <button
                type="button"
                onClick={() => handleToggleLanguage('ko')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  lang === 'ko'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="한국어 검색 및 안내 페이지로 전환"
              >
                한국어
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English search & guide page"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('zh')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  lang === 'zh'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="切换至中文比价与图书馆查询界面"
              >
                中文
              </button>
            </div>
          </div>

          {/* Book Bag Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsBookBagOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              title={t.bookBagBtn(bookBag.length)}
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {t.bookBagBtn(bookBag.length)}
                {bookBag.length > 0 ? ` · ${formatKrw(bookBagSummary.grandTotal)}` : ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6">
        {/* Workspace Mode Switcher: Single Textbook Search vs Budget Book Planner */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center bg-slate-200/80 p-1 rounded-xl text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setWorkspaceMode('search')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                workspaceMode === 'search'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.modeSearchTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('budget')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                workspaceMode === 'budget'
                  ? 'bg-white text-blue-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t.modeBudgetTab}</span>
            </button>
          </div>
        </div>

        {workspaceMode === 'budget' ? (
          <BudgetPlannerView
            lang={lang}
            t={t}
            skkuCampus={skkuCampus}
            targetBudgetKrw={targetBudgetKrw}
            setTargetBudgetKrw={setTargetBudgetKrw}
            booksList={budgetBooksList}
            setBooksList={setBudgetBooksList}
            prioritizeLibraryZeroCost={prioritizeLibraryZeroCost}
            setPrioritizeLibraryZeroCost={setPrioritizeLibraryZeroCost}
            budgetPlan={budgetPlan}
            setBudgetPlan={setBudgetPlan}
            isGeneratingPlan={isGeneratingPlan}
            planError={budgetPlanError}
            onGeneratePlan={handleGenerateBudgetPlan}
            onInspectBookInSearch={(query) => {
              setWorkspaceMode('search');
              void executeSearch(query);
            }}
          />
        ) : (
          <>
            {/* Centered Search Bar Section */}
            <section
              className={`max-w-2xl mx-auto text-center transition-all ${
                !activeTextbook && !isSearching ? 'py-14 sm:py-20 space-y-5' : 'py-1 mb-5'
              }`}
            >
              {!activeTextbook && !isSearching && (
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {t.heroTitle}
                </h1>
              )}

              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-transparent">
                  <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0 pointer-events-none" />
                  <input
                    id="textbook-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full px-2 py-2 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={t.clearSearch}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isSearching ? t.searchingBtn : t.searchBtn}
                  </button>
                </div>

                {searchError && (
                  <div className="flex items-center justify-center gap-2 text-xs text-red-700 pt-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}
              </form>

              {!activeTextbook && !isSearching && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                  <span>{t.tryPrefix}</span>
                  {t.tryItems.map((item, idx) => (
                    <React.Fragment key={item.label}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <button
                        type="button"
                        onClick={() => executeSearch(item.query)}
                        className="text-slate-700 hover:text-blue-900 hover:underline cursor-pointer"
                      >
                        {item.label}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </section>

            {/* Loading State */}
            {isSearching && (
              <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {t.searchingStatus(searchQuery)}
                  </span>
                  <span className="font-mono tabular-nums">{t.calculatingShipping}</span>
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </section>
            )}

            {/* Search Results: Zero-Filler Header Bar + Two-Column Side-by-Side Split Layout */}
            {activeTextbook && !isSearching && (
              <div className="space-y-5">
                {/* Compact Book Identity & Benchmark Bar (Zero filler paragraphs) */}
                <section className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 sm:w-12 shrink-0 aspect-[3/4] rounded overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {activeTextbook.coverImageUrl && !failedImages[activeTextbook.id] ? (
                        <img
                          src={activeTextbook.coverImageUrl}
                          alt={activeTextbook.titleKo}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [activeTextbook.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {lang === 'en' && activeTextbook.titleEn
                          ? activeTextbook.titleEn
                          : activeTextbook.titleKo}
                      </h2>
                      <p className="text-xs text-slate-500 truncate">
                        <span>{activeTextbook.authors}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{activeTextbook.publisherKo}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">ISBN {activeTextbook.isbn13}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {t.listPriceLabel}{' '}
                          <span className="line-through">{formatKrw(activeTextbook.listPriceKrw)}</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Key Price Benchmarks */}
                  {summaryBenchmarks && (
                    <div className="grid grid-cols-3 gap-2.5 shrink-0">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                        <div className="text-[10px] text-emerald-800 font-semibold">
                          {t.skkuFreeBadge}
                        </div>
                        <div className="text-sm sm:text-base font-bold text-emerald-800 font-mono tabular-nums">
                          ₩0
                        </div>
                      </div>

                      {summaryBenchmarks.cheapestOverall && (
                        <div className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-slate-200">
                          <div className="text-[10px] text-slate-500">{t.cheapestOverallLabel}</div>
                          <div className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                            {formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost)}
                          </div>
                        </div>
                      )}

                      {summaryBenchmarks.cheapestNew && (
                        <div className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-slate-200">
                          <div className="text-[10px] text-slate-500">{t.lowestNewLabel}</div>
                          <div className="text-sm sm:text-base font-bold text-blue-900 font-mono tabular-nums">
                            {formatKrw(summaryBenchmarks.cheapestNew.metrics.totalCost)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Primary Two-Column Side-by-Side Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: University Library Intelligence (SKKU) */}
                  <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                    {/* Compact Column Header + Campus Switcher + Direct Catalog Link */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-800 shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {lang === 'en'
                            ? 'SKKU Library Holdings'
                            : lang === 'zh'
                            ? '成均馆大图书馆馆藏'
                            : '성균관대 도서관 소장 정보'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleCampus('seoul')}
                            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                              skkuCampus === 'seoul'
                                ? 'bg-emerald-800 text-white font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t.campusSeoul}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCampus('suwon')}
                            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                              skkuCampus === 'suwon'
                                ? 'bg-emerald-800 text-white font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t.campusSuwon}
                          </button>
                        </div>

                        <a
                          href={directSkkuCatalogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                        >
                          <span>
                            {lang === 'en' ? 'Catalog' : lang === 'zh' ? '馆藏目录' : '통합검색'}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {skkuHoldingData && (
                      <div className="space-y-3">
                        {/* Selected Campus On-Shelf Cards */}
                        {skkuHoldingData.onMyCampus.length > 0 ? (
                          <div className="space-y-3">
                            {skkuHoldingData.onMyCampus.map((holding) => (
                              <div
                                key={holding.id}
                                className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3.5 space-y-2.5 hover:border-emerald-600 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-emerald-800">
                                    {localizeSkkuStatusBadge(
                                      holding.status,
                                      holding.isAlternativeEdition,
                                      holding.statusBadgeText,
                                      lang
                                    )}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-600">
                                    {holding.campus === 'seoul'
                                      ? t.campusSeoul
                                      : t.campusSuwon}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                    {holding.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 pt-0.5">
                                    <span>{holding.edition}</span>
                                    <span className="mx-1" aria-hidden="true">·</span>
                                    <span>{holding.publisher}</span>
                                  </p>
                                </div>

                                {holding.isAlternativeEdition && holding.editionNote && (
                                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                                    {holding.editionNote}
                                  </div>
                                )}

                                <div className="bg-white p-2.5 rounded border border-slate-200/80 text-xs space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500 text-[11px]">
                                      {t.skkuRepositoryLabel}
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">
                                      {localizeSkkuRepository(holding.repositoryName, lang)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500 text-[11px]">
                                      {t.skkuCallNumberLabel}
                                    </span>
                                    <span className="font-mono font-bold text-blue-900">
                                      {holding.callNumber}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500 text-[11px]">
                                      {t.skkuShelfLocationLabel}
                                    </span>
                                    <span className="text-slate-700 text-right text-[11px]">
                                      {localizeSkkuShelfGuidance(holding.shelfLocationGuidance, lang)}
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={holding.directCatalogUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md transition-colors"
                                >
                                  <span>{t.skkuCheckStatusBtn}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 text-center">
                            {t.skkuNoShelfCopies(
                              skkuCampus === 'seoul' ? t.campusSeoul : t.campusSuwon
                            )}
                          </div>
                        )}

                        {/* Digital E-Books */}
                        {skkuHoldingData.digitalEbooks.map((ebook) => (
                          <div
                            key={ebook.id}
                            className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-indigo-900">
                                {t.skkuEbookBadge}
                              </span>
                              <span className="text-[11px] font-semibold text-indigo-700">
                                ₩0 · E-Book
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-900">{ebook.title}</div>
                            <div className="text-[11px] text-slate-600">
                              {localizeSkkuRepository(ebook.repositoryName, lang)} ·{' '}
                              {localizeSkkuShelfGuidance(ebook.shelfLocationGuidance, lang)}
                            </div>
                            <a
                              href={ebook.directCatalogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-800 rounded-md transition-colors"
                            >
                              <span>{t.skkuEbookAction}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}

                        {/* Other Campus Inter-Campus Loan */}
                        {skkuHoldingData.onOtherCampus.map((otherHolding) => (
                          <div
                            key={otherHolding.id}
                            className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-blue-950">
                                {t.skkuInterCampusTitle(
                                  skkuCampus === 'seoul' ? t.campusSuwon : t.campusSeoul
                                )}
                              </span>
                              <span className="font-mono font-bold text-blue-900">
                                {otherHolding.callNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {localizeSkkuRepository(otherHolding.repositoryName, lang)}
                            </div>
                            <a
                              href={otherHolding.directCatalogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline pt-0.5"
                            >
                              <span>{t.skkuInterCampusAction}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* RIGHT COLUMN: 7-Platform Store Price Comparison & Purchasing */}
                  <section className="lg:col-span-7 space-y-3">
                    {/* Compact Filter & Sort Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                          {(
                            [
                              { id: 'all', label: t.filters.all },
                              { id: 'new', label: t.filters.new },
                              { id: 'used', label: t.filters.used },
                              { id: 'digital', label: t.filters.digital },
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setConditionFilter(tab.id)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                conditionFilter === tab.id
                                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                          {(
                            [
                              { id: 'total_cost', label: t.sortModes.total_cost },
                              { id: 'effective_cost', label: t.sortModes.effective_cost },
                              { id: 'speed', label: t.sortModes.speed },
                            ] as const
                          ).map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => {
                                setSortMode(mode.id);
                                setPreferences((p) => ({
                                  ...p,
                                  deductRewardPoints: mode.id === 'effective_cost',
                                }));
                              }}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                sortMode === mode.id
                                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <label className="inline-flex items-center gap-1 cursor-pointer select-none text-slate-700">
                          <input
                            type="checkbox"
                            checked={preferences.hasWowMembership}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                hasWowMembership: e.target.checked,
                              }))
                            }
                            className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                          />
                          <span>{t.filterCoupangWow}</span>
                        </label>

                        <label className="inline-flex items-center gap-1 cursor-pointer select-none text-slate-700">
                          <input
                            type="checkbox"
                            checked={preferences.preferPickup}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                preferPickup: e.target.checked,
                              }))
                            }
                            className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                          />
                          <span>{t.filterStorePickup}</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-[#FAF9F6] border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>{t.exportCsvBtn}</span>
                        </button>
                      </div>
                    </div>

                    {/* Ranked 7-Platform Store Comparison Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {processedOffers.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <p className="text-sm text-slate-600">{t.noOffersFound}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setConditionFilter('all');
                              setPreferences((p) => ({ ...p, preferPickup: false }));
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                          >
                            {t.resetFiltersBtn}
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                                <th className="py-2.5 pl-4 pr-1.5 w-8">{t.tableHeaders.rank}</th>
                                <th className="py-2.5 px-2.5">{t.tableHeaders.store}</th>
                                <th className="py-2.5 px-2.5">{t.tableHeaders.condition}</th>
                                <th className="py-2.5 px-2.5 text-right">{t.tableHeaders.shipping}</th>
                                <th className="py-2.5 px-2.5 text-right">
                                  {preferences.deductRewardPoints
                                    ? t.tableHeaders.netPrice
                                    : t.tableHeaders.totalPrice}
                                </th>
                                <th className="py-2.5 pl-2.5 pr-4 text-right">{t.tableHeaders.action}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                              {processedOffers.map(({ offer, metrics }, index) => {
                                const isExpanded = expandedOfferId === offer.id;
                                const isInBookBag = bookBag.some(
                                  (c) =>
                                    c.textbookId === activeTextbook.id && c.offer.id === offer.id
                                );

                                return (
                                  <React.Fragment key={offer.id}>
                                    <tr
                                      onClick={() =>
                                        setExpandedOfferId(isExpanded ? null : offer.id)
                                      }
                                      className={`transition-colors cursor-pointer ${
                                        index === 0
                                          ? 'bg-emerald-50/35 hover:bg-emerald-50/60'
                                          : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <td className="py-3 pl-4 pr-1.5 font-mono tabular-nums text-xs font-semibold text-slate-500 whitespace-nowrap align-top">
                                        {index + 1}
                                      </td>

                                      <td className="py-3 px-2.5 align-top">
                                        <div className="font-semibold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                                          {localizePlatformDisplayName(
                                            offer.platformId,
                                            offer.platformNameKo,
                                            offer.platformNameEn,
                                            lang
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {offer.estimatedDelivery}
                                        </div>
                                      </td>

                                      <td className="py-3 px-2.5 align-top whitespace-nowrap">
                                        <div className="text-xs font-medium text-slate-800">
                                          {localizeConditionTag(offer.condition, lang)}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                                          {formatKrw(offer.basePriceKrw)}
                                        </div>
                                      </td>

                                      <td className="py-3 px-2.5 text-right font-mono tabular-nums text-xs whitespace-nowrap align-top">
                                        {metrics.shipping === 0 ? (
                                          <span className="text-emerald-700 font-semibold">
                                            {t.freeShippingBadge}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600">
                                            +{formatKrw(metrics.shipping)}
                                          </span>
                                        )}
                                      </td>

                                      <td className="py-3 px-2.5 text-right font-mono tabular-nums whitespace-nowrap align-top">
                                        <span className="text-sm sm:text-base font-bold text-slate-900">
                                          {formatKrw(
                                            preferences.deductRewardPoints
                                              ? metrics.effectiveCost
                                              : metrics.totalCost
                                          )}
                                        </span>
                                        {metrics.savingsVsList > 0 && (
                                          <span className="block text-[11px] font-semibold text-emerald-700">
                                            -{metrics.savingsPercent}%
                                          </span>
                                        )}
                                      </td>

                                      <td
                                        className="py-3 pl-2.5 pr-4 text-right whitespace-nowrap align-top"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleAddToBookBag(offer)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                              isInBookBag
                                                ? 'bg-emerald-700 text-white'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}
                                            title={
                                              isInBookBag ? t.inBookBagBtn : t.addToBookBagBtn
                                            }
                                          >
                                            {isInBookBag ? (
                                              <>
                                                <Check className="w-3 h-3" />
                                                <span>{t.inBookBagBtn}</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-3 h-3" />
                                                <span>{t.addToBookBagBtn}</span>
                                              </>
                                            )}
                                          </button>

                                          <a
                                            href={offer.directSearchUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                                          >
                                            <span>{t.visitStoreBtn}</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="bg-slate-50/70">
                                        <td colSpan={6} className="px-4 py-2.5 text-xs text-slate-600">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <p>
                                              <strong className="text-slate-900">
                                                {t.tipLabel}
                                              </strong>{' '}
                                              {offer.studentTip}
                                            </p>
                                            <span className="font-mono tabular-nums text-slate-500 shrink-0">
                                              {t.rewardPointsLabel} +{formatKrw(offer.rewardPointsKrw)}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Compact Secondary Row: Alternatives & Edition Q&A */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900">
                          {t.alternativesTitle}
                        </h3>
                        <div className="divide-y divide-slate-100">
                          {activeTextbook.alternatives.map((alt) => (
                            <div key={alt.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900">
                                  {alt.title}
                                </span>
                                <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums shrink-0">
                                  {alt.estimatedCostKrw === 0
                                    ? t.alternativesFree
                                    : formatKrw(alt.estimatedCostKrw)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">{alt.pros}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900">
                          {t.advisorTitle}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {t.advisorSampleChips.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => handleAskAdvisor(q)}
                              className="text-[11px] px-2 py-1 rounded bg-[#FAF9F6] border border-slate-200 text-slate-700 hover:border-slate-400 cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAskAdvisor(advisorQuestion);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={advisorQuestion}
                            onChange={(e) => setAdvisorQuestion(e.target.value)}
                            placeholder={t.advisorPlaceholder}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                          <button
                            type="submit"
                            disabled={isAdvisorLoading}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isAdvisorLoading ? '...' : t.advisorAskBtn}
                          </button>
                        </form>
                        {advisorAnswer && (
                          <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {advisorAnswer}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-Over Semester Book Bag Drawer */}
      {isBookBagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-emerald-800" />
                <h2 className="text-base font-bold text-slate-900">
                  {t.bagDrawerTitle(bookBag.length)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBookBagOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label={t.bagCloseAria}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {bookBag.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <BookMarked className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">{t.bagEmptyTitle}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{t.bagEmptyDesc}</p>
                </div>
              ) : (
                bookBag.map((item) => (
                  <div
                    key={item.bagItemId}
                    className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        {localizePlatformDisplayName(
                          item.offer.platformId,
                          item.offer.platformNameKo,
                          item.offer.platformNameEn,
                          lang
                        )}{' '}
                        · {localizeConditionTag(item.offer.condition, lang)}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang !== 'ko' && item.textbookTitleEn
                          ? item.textbookTitleEn
                          : item.textbookTitleKo}
                      </h3>
                      <div className="text-xs font-mono tabular-nums text-slate-900 font-semibold">
                        {formatKrw(item.offer.basePriceKrw)}
                      </div>
                      <a
                        href={item.offer.directSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-900 hover:underline pt-0.5"
                      >
                        <span>{t.bagGoToStore}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromBookBag(item.bagItemId)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label={t.bagRemoveAria}
                      title={t.bagRemoveAria}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-[#FAF9F6] space-y-3">
              {/* Comparison & Planning Notice (Never check out on site) */}
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                {t.bagDisclaimer}
              </div>

              {bookBag.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const bagTitles = bookBag.map((item) =>
                      lang === 'en' && item.textbookTitleEn
                        ? item.textbookTitleEn
                        : item.textbookTitleKo
                    );
                    const suggestedBudget = Math.max(
                      30000,
                      Math.round((bookBagSummary.grandTotal * 0.8) / 5000) * 5000
                    );
                    setBudgetBooksList(bagTitles);
                    setTargetBudgetKrw(suggestedBudget);
                    setIsBookBagOpen(false);
                    setWorkspaceMode('budget');
                    void handleGenerateBudgetPlan(suggestedBudget, bagTitles, prioritizeLibraryZeroCost);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t.bagOptimizeBtn}</span>
                </button>
              )}

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t.bagSubtotalBooks}</span>
                  <span className="font-mono tabular-nums">
                    {formatKrw(bookBagSummary.totalBasePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t.bagShippingTotal}</span>
                  <span className="font-mono tabular-nums">
                    {bookBagSummary.totalShipping === 0
                      ? t.freeShippingBadge
                      : formatKrw(bookBagSummary.totalShipping)}
                  </span>
                </div>
                {bookBagSummary.totalSaved > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{t.bagTotalSaved}</span>
                    <span className="font-mono tabular-nums">
                      -{formatKrw(bookBagSummary.totalSaved)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>{t.bagTotalEstimated}</span>
                  <span className="font-mono tabular-nums text-lg">
                    {formatKrw(bookBagSummary.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
