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
} from 'lucide-react';
import {
  TextbookAnalysisResult,
  PlatformOffer,
  StudentPreferences,
  BookBagItem,
  AppLanguage,
  SkkuCampus,
  SkkuLibraryHolding,
} from './types/textbook';
import { PRESET_TEXTBOOKS } from './data/presetTextbooks';
import { TRANSLATIONS } from './data/translations';

type ConditionFilter = 'all' | 'new' | 'used' | 'digital';
type SortMode = 'total_cost' | 'effective_cost' | 'speed';

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

export default function App() {
  // Language State: 'ko' (한국어) or 'en' (English)
  const [lang, setLang] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('chaekscan_lang');
      if (saved === 'ko' || saved === 'en') return saved;
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
      `"${offer.platformNameKo}"`,
      `"${offer.condition}"`,
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
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-12 py-3">
        <div className="max-w-[1160px] mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
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

            {/* Language Switcher (Korean / English) */}
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
      <main className="flex-1 max-w-[1160px] w-full mx-auto px-6 lg:px-12 py-8">
        {/* Centered Search Bar Section */}
        <section
          className={`max-w-2xl mx-auto text-center transition-all ${
            !activeTextbook && !isSearching ? 'py-20 sm:py-28 space-y-6' : 'py-2 space-y-4 mb-8'
          }`}
        >
          {!activeTextbook && !isSearching && (
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                {t.heroTitle}
              </h1>
              <p className="text-sm text-slate-600">
                {t.heroSubtitle}
              </p>
            </div>
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

          {/* Subtle quick-try links ONLY when no book is searched yet */}
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

        {/* Search Results (Only visible after a book has been searched) */}
        {activeTextbook && !isSearching && (
          <div className="space-y-8">
            {/* Compact Book Summary & Key Price Benchmarks */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 sm:w-20 shrink-0 aspect-[3/4] rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
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
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {lang === 'en' && activeTextbook.titleEn
                        ? activeTextbook.titleEn
                        : activeTextbook.titleKo}
                    </h2>
                    {lang === 'en' && activeTextbook.titleEn && (
                      <p className="text-xs text-slate-600 font-medium">
                        {activeTextbook.titleKo}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      <span>{activeTextbook.authors}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{activeTextbook.publisherKo}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        ISBN {activeTextbook.isbn13}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums pt-0.5">
                      {t.listPriceLabel}: <span className="line-through">{formatKrw(activeTextbook.listPriceKrw)}</span>
                    </p>
                  </div>
                </div>

                {/* 3 Key Price Benchmarks */}
                {summaryBenchmarks && (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    {summaryBenchmarks.cheapestOverall && (
                      <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{t.cheapestOverallLabel}</div>
                        <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono tabular-nums">
                          {formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost)}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {summaryBenchmarks.cheapestOverall.offer.platformNameKo}
                        </div>
                      </div>
                    )}

                    {summaryBenchmarks.cheapestNew && (
                      <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{t.lowestNewLabel}</div>
                        <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums">
                          {formatKrw(summaryBenchmarks.cheapestNew.metrics.totalCost)}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {summaryBenchmarks.cheapestNew.offer.platformNameKo}
                        </div>
                      </div>
                    )}

                    {summaryBenchmarks.fastestOption && (
                      <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{t.fastestDeliveryLabel}</div>
                        <div className="text-lg sm:text-xl font-bold text-blue-900 font-mono tabular-nums">
                          {formatKrw(summaryBenchmarks.fastestOption.metrics.totalCost)}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {summaryBenchmarks.fastestOption.offer.platformNameKo}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Sungkyunkwan University (SKKU) Library Availability & Zero-Cost Alternative */}
            {skkuHoldingData && (
              <section className="bg-white border-2 border-emerald-600/30 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs relative overflow-hidden">
                {/* Decorative accent banner */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-900" />

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'SKKU Library' : '성균관대학교 학술정보관'}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (lib.skku.edu)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>{t.skkuSectionTitle}</span>
                      <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                        {t.skkuSectionSubtitle}
                      </span>
                    </h3>
                  </div>

                  {/* Campus Selector & Zero-Cost Badge */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleCampus('seoul')}
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          skkuCampus === 'seoul'
                            ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={t.campusSeoulTooltip}
                      >
                        {t.campusSeoul}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCampus('suwon')}
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          skkuCampus === 'suwon'
                            ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={t.campusSuwonTooltip}
                      >
                        {t.campusSuwon}
                      </button>
                    </div>

                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right">
                      <div className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">
                        {t.skkuFreeBadge}
                      </div>
                      <div className="text-sm font-bold text-emerald-800 font-mono tabular-nums">
                        {t.skkuFreeSub}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Contrast Callout */}
                {summaryBenchmarks?.cheapestOverall && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <span>
                        {t.skkuSavingsNotice(
                          summaryBenchmarks.cheapestOverall.offer.platformNameKo,
                          formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost),
                          formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost)
                        )}
                      </span>
                    </div>
                    <a
                      href={directSkkuCatalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
                    >
                      <span>{t.skkuDirectCatalogBtn}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Active Campus Holdings Cards */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>
                      {t.skkuShelfHoldingsTitle(skkuCampus === 'seoul' ? t.campusSeoul : t.campusSuwon)}
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      {t.skkuStrictFilterNote}
                    </span>
                  </div>

                  {skkuHoldingData.onMyCampus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {skkuHoldingData.onMyCampus.map((holding) => (
                        <div
                          key={holding.id}
                          className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-4 space-y-3 hover:border-emerald-600 transition-colors"
                        >
                          {/* Card Header: Badge & Campus/Repo */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {lang === 'en'
                                ? holding.status === 'ebook'
                                  ? '[💻 E-Book Available]'
                                  : holding.isAlternativeEdition
                                    ? '[🟢 Prior Edition On Shelf]'
                                    : '[🟢 Available Now / On Shelf]'
                                : holding.statusBadgeText}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 text-right">
                              {lang === 'en'
                                ? holding.campus === 'seoul'
                                  ? 'Seoul Campus'
                                  : 'Suwon Campus'
                                : holding.campusNameKo}
                            </span>
                          </div>

                          {/* Book Title & Edition */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {holding.title}
                            </h4>
                            <p className="text-xs text-slate-600 pt-0.5">
                              <span>{holding.edition}</span>
                              <span className="mx-1" aria-hidden="true">·</span>
                              <span>{holding.authors}</span>
                              <span className="mx-1" aria-hidden="true">·</span>
                              <span>{holding.publisher}</span>
                            </p>
                          </div>

                          {/* Edition discrepancy note if alternative edition */}
                          {holding.isAlternativeEdition && holding.editionNote && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 font-medium">
                              {holding.editionNote}
                            </div>
                          )}

                          {/* Repository, Call Number, Shelf Location */}
                          <div className="bg-white p-2.5 rounded border border-slate-200/80 text-xs space-y-1.5 font-mono">
                            <div className="flex items-start justify-between gap-2 font-sans">
                              <span className="text-slate-500 text-[11px]">{t.skkuRepositoryLabel}</span>
                              <span className="font-semibold text-slate-800 text-right">
                                {holding.repositoryName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-sans text-[11px]">
                                {t.skkuCallNumberLabel}
                              </span>
                              <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                                {holding.callNumber}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2 font-sans">
                              <span className="text-slate-500 text-[11px]">{t.skkuShelfLocationLabel}</span>
                              <span className="text-slate-700 text-right text-[11px]">
                                {holding.shelfLocationGuidance}
                              </span>
                            </div>
                          </div>

                          {/* Direct Catalog Action Button */}
                          <div className="pt-1">
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 text-center space-y-1.5">
                      <p className="font-medium text-slate-800">
                        {t.skkuNoShelfCopies(skkuCampus === 'seoul' ? t.campusSeoul : t.campusSuwon)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.skkuTryAlternativesNote}
                      </p>
                    </div>
                  )}

                  {/* Dual-Campus Awareness & Inter-Campus Loan Section */}
                  {skkuHoldingData.onOtherCampus.length > 0 && (
                    <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-200 text-blue-900">
                            {t.skkuInterCampusBadge}
                          </span>
                          <span className="text-xs font-bold text-blue-950">
                            {t.skkuInterCampusTitle(
                              skkuCampus === 'seoul' ? t.campusSuwon : t.campusSeoul
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700">
                          {t.skkuInterCampusNote}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skkuHoldingData.onOtherCampus.map((otherHolding) => (
                          <div
                            key={otherHolding.id}
                            className="bg-white p-3 rounded border border-blue-200 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {otherHolding.title}
                              </span>
                              <span className="text-[11px] text-blue-800 font-semibold">
                                {lang === 'en'
                                  ? otherHolding.campus === 'seoul'
                                    ? 'Seoul Campus'
                                    : 'Suwon Campus'
                                  : otherHolding.campusNameKo}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              <span>{otherHolding.repositoryName}</span> ·{' '}
                              <span className="font-mono font-bold text-blue-900">
                                {otherHolding.callNumber}
                              </span>
                            </div>
                            {otherHolding.editionNote && (
                              <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded">
                                {otherHolding.editionNote}
                              </p>
                            )}
                            <a
                              href={otherHolding.directCatalogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-700 hover:underline pt-1"
                            >
                              <span>{t.skkuInterCampusAction}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital E-Book (Kingo Portal Online Access) */}
                  {skkuHoldingData.digitalEbooks.length > 0 && (
                    <div className="mt-3 p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                            {t.skkuEbookBadge}
                          </span>
                          <span className="text-xs font-bold text-indigo-950">
                            {t.skkuEbookTitle}
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-700">
                          {t.skkuEbookSub}
                        </span>
                      </div>

                      {skkuHoldingData.digitalEbooks.map((ebook) => (
                        <div
                          key={ebook.id}
                          className="bg-white p-3 rounded border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900">{ebook.title}</div>
                            <div className="text-[11px] text-slate-600">
                              {ebook.repositoryName} · {ebook.shelfLocationGuidance}
                            </div>
                            {ebook.ebookAccessNote && (
                              <div className="text-[11px] text-indigo-800 font-medium pt-0.5">
                                🔑 {ebook.ebookAccessNote}
                              </div>
                            )}
                          </div>
                          <a
                            href={ebook.directCatalogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-800 rounded transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>{t.skkuEbookAction}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transparency & Real-time Live Status Notice */}
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>
                      <strong>{t.skkuLiveNoticeTitle}</strong> {t.skkuLiveNoticeBody}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Price Comparison Table Section */}
            <section className="space-y-3">
              {/* Compact Filter & Sort Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
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
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          conditionFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
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
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
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

                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{t.exportCsvBtn}</span>
                  </button>
                </div>
              </div>

              {/* Ranked Comparison Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {processedOffers.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm text-slate-600">
                      {t.noOffersFound}
                    </p>
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
                          <th className="py-3 pl-5 pr-2 w-12">{t.tableHeaders.rank}</th>
                          <th className="py-3 px-3">{t.tableHeaders.store}</th>
                          <th className="py-3 px-3">{t.tableHeaders.condition}</th>
                          <th className="py-3 px-3 text-right">{t.tableHeaders.basePrice}</th>
                          <th className="py-3 px-3 text-right">{t.tableHeaders.shipping}</th>
                          <th className="py-3 px-3 text-right">
                            {preferences.deductRewardPoints
                              ? t.tableHeaders.netPrice
                              : t.tableHeaders.totalPrice}
                          </th>
                          <th className="py-3 px-3">{t.tableHeaders.delivery}</th>
                          <th className="py-3 pl-3 pr-5 text-right">{t.tableHeaders.action}</th>
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
                                <td className="py-3.5 pl-5 pr-2 font-mono tabular-nums text-xs font-semibold text-slate-500 whitespace-nowrap">
                                  {index + 1}
                                </td>

                                <td className="py-3.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                  {lang === 'en' && offer.platformNameEn
                                    ? offer.platformNameEn
                                    : offer.platformNameKo}
                                </td>

                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <span className="text-xs font-medium text-slate-800">
                                    {offer.condition}
                                  </span>
                                  <span className="text-xs text-slate-400 mx-1.5">·</span>
                                  <span className="text-xs text-slate-500">
                                    {offer.stockStatus}
                                  </span>
                                </td>

                                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                                  {formatKrw(offer.basePriceKrw)}
                                </td>

                                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap">
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

                                <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                                  <span className="text-base font-bold text-slate-900">
                                    {formatKrw(
                                      preferences.deductRewardPoints
                                        ? metrics.effectiveCost
                                        : metrics.totalCost
                                    )}
                                  </span>
                                  {metrics.savingsVsList > 0 && (
                                    <span className="block text-[11px] font-semibold text-emerald-700">
                                      -{metrics.savingsPercent}% ({formatKrw(metrics.savingsVsList)} saved)
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-3 text-xs text-slate-700 whitespace-nowrap">
                                  <div>{offer.estimatedDelivery}</div>
                                  {offer.pickupAvailable && offer.pickupLabel && (
                                    <div className="text-[11px] text-blue-900">
                                      {offer.pickupLabel}
                                    </div>
                                  )}
                                </td>

                                <td
                                  className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAddToBookBag(offer)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                        isInBookBag
                                          ? 'bg-emerald-700 text-white'
                                          : 'bg-slate-900 text-white hover:bg-slate-800'
                                      }`}
                                      title={isInBookBag ? t.inBookBagBtn : t.addToBookBagBtn}
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

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedOfferId(isExpanded ? null : offer.id)
                                      }
                                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                      aria-label={t.detailsBtn}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-slate-50/70">
                                  <td colSpan={8} className="px-5 py-3 text-xs text-slate-600">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <p>
                                        <strong className="text-slate-900">{t.tipLabel}</strong>{' '}
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
            </section>

            {/* Compact Alternatives & Edition Q&A */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Digital / Older Edition Alternatives */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {t.alternativesTitle}
                </h3>
                <div className="divide-y divide-slate-100">
                  {activeTextbook.alternatives.map((alt) => (
                    <div key={alt.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {alt.title}
                        </span>
                        <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums shrink-0">
                          {alt.estimatedCostKrw === 0
                            ? t.alternativesFree
                            : formatKrw(alt.estimatedCostKrw)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{alt.pros}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.alternativesNote} {alt.cons}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Advisor Box */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {t.advisorTitle}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {t.advisorSampleChips.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleAskAdvisor(q)}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-slate-200 text-slate-700 hover:border-slate-400 cursor-pointer"
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
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={advisorQuestion}
                    onChange={(e) => setAdvisorQuestion(e.target.value)}
                    placeholder={t.advisorPlaceholder}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="submit"
                    disabled={isAdvisorLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isAdvisorLoading ? '...' : t.advisorAskBtn}
                  </button>
                </form>
                {advisorAnswer && (
                  <div className="p-3 rounded-lg bg-[#FAF9F6] border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {advisorAnswer}
                  </div>
                )}
              </div>
            </section>
          </div>
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
                        {lang === 'en' && item.offer.platformNameEn
                          ? item.offer.platformNameEn
                          : item.offer.platformNameKo}{' '}
                        · {item.offer.condition}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'en' && item.textbookTitleEn
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
