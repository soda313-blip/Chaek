import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
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
} from 'lucide-react';
import {
  TextbookAnalysisResult,
  PlatformOffer,
  StudentPreferences,
  CartItem,
  SkkuCampus,
  SkkuLibraryHolding,
} from './types/textbook';
import { PRESET_TEXTBOOKS } from './data/presetTextbooks';

type ConditionFilter = 'all' | 'new' | 'used' | 'digital';
type SortMode = 'total_cost' | 'effective_cost' | 'speed';

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

export default function App() {
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

  // Semester Cart state (starts empty)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const handleAddToCart = (offer: PlatformOffer) => {
    if (!activeTextbook) return;
    const newItem: CartItem = {
      cartItemId: `${activeTextbook.id}-${offer.id}`,
      textbookId: activeTextbook.id,
      textbookTitleKo: activeTextbook.titleKo,
      isbn13: activeTextbook.isbn13,
      listPriceKrw: activeTextbook.listPriceKrw,
      offer,
    };

    setCart((prev) => {
      const filtered = prev.filter((item) => item.textbookId !== activeTextbook.id);
      return [...filtered, newItem];
    });
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleExportCsv = () => {
    if (!activeTextbook) return;
    const headers = [
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
    link.setAttribute('download', `chaekscan_${activeTextbook.isbn13}.csv`);
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

  const cartSummary = useMemo(() => {
    let totalListPrice = 0;
    let totalBasePrice = 0;
    let totalShipping = 0;
    let totalPoints = 0;

    const platformSubtotals: Record<string, number> = {};
    cart.forEach((item) => {
      platformSubtotals[item.offer.platformId] =
        (platformSubtotals[item.offer.platformId] || 0) + item.offer.basePriceKrw;
    });

    cart.forEach((item) => {
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
  }, [cart, preferences.hasWowMembership]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900">
      {/* Minimal Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-slate-200 px-6 lg:px-12 py-3.5">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => {
                setActiveTextbook(null);
                setSearchQuery('');
                setSearchError(null);
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display cursor-pointer"
            >
              ChaekScan
            </button>

            {/* SKKU Campus Switcher */}
            <div className="inline-flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 text-slate-700 font-semibold border-r border-slate-300 mr-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
                <span>성균관대</span>
              </span>
              <button
                type="button"
                onClick={() => handleToggleCampus('seoul')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  skkuCampus === 'seoul'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="인문사회과학캠퍼스 (서울) 중앙도서관·법학도서관·존경각"
              >
                인사캠 (서울)
              </button>
              <button
                type="button"
                onClick={() => handleToggleCampus('suwon')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  skkuCampus === 'suwon'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="자연과학캠퍼스 (수원) 삼성학술정보관·의학도서관"
              >
                자캠 (수원)
              </button>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                Cart ({cart.length})
                {cart.length > 0 ? ` · ${formatKrw(cartSummary.grandTotal)}` : ''}
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
                University Textbook Price Finder
              </h1>
              <p className="text-sm text-slate-600">
                Compare total prices with shipping across Kyobo, YES24, Aladin, Youngpoong,
                Bookstore ON, 11st, and Coupang.
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
                placeholder="Search by textbook title, author, or ISBN (e.g. 미분적분학, 맨큐의 경제학, 9791160733877)"
                className="w-full px-2 py-2 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Search'}
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
              <span>Try:</span>
              {['미분적분학', '맨큐의 경제학', '운영체제', '맥머리 유기화학'].map((sample, idx) => (
                <React.Fragment key={sample}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <button
                    type="button"
                    onClick={() => executeSearch(sample)}
                    className="text-slate-700 hover:text-blue-900 hover:underline cursor-pointer"
                  >
                    {sample}
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
                Comparing 7 Korean bookstores for &ldquo;{searchQuery}&rdquo;...
              </span>
              <span className="font-mono tabular-nums">Calculating shipping fees</span>
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
                      {activeTextbook.titleKo}
                    </h2>
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
                      List Price: <span className="line-through">{formatKrw(activeTextbook.listPriceKrw)}</span>
                    </p>
                  </div>
                </div>

                {/* 3 Key Price Benchmarks */}
                {summaryBenchmarks && (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    {summaryBenchmarks.cheapestOverall && (
                      <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">Cheapest Total</div>
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
                        <div className="text-[11px] text-slate-500">Lowest New</div>
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
                        <div className="text-[11px] text-slate-500">Fastest Delivery</div>
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
                        <span>성균관대학교 학술정보관</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (SKKU Library Official Catalog)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>도서관 소장 현황 및 무료 대출 비교</span>
                      <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                        · 엄격 대출가능(Shelf-Available) 기준 필터링
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
                      >
                        인사캠 (서울)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCampus('suwon')}
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          skkuCampus === 'suwon'
                            ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        자캠 (수원)
                      </button>
                    </div>

                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right">
                      <div className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">
                        도서관 이용 시
                      </div>
                      <div className="text-sm font-bold text-emerald-800 font-mono tabular-nums">
                        ₩0 (무료)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Contrast Callout */}
                {summaryBenchmarks?.cheapestOverall && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">💡 구매 비용 절약:</span>
                      <span>
                        도서관 대출/전자책을 이용하면 온라인 최저가(
                        <strong className="font-semibold text-emerald-950 font-mono">
                          {summaryBenchmarks.cheapestOverall.offer.platformNameKo} 기준{' '}
                          {formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost)}
                        </strong>
                        ) 대비{' '}
                        <strong className="underline decoration-emerald-500 underline-offset-2">
                          {formatKrw(summaryBenchmarks.cheapestOverall.metrics.totalCost)} 전액
                        </strong>
                        을 절약할 수 있습니다.
                      </span>
                    </div>
                    <a
                      href={directSkkuCatalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
                    >
                      <span>SKKU 통합검색 바로가기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Active Campus Holdings Cards */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>
                      {skkuCampus === 'seoul' ? '인사캠 (서울)' : '자캠 (수원)'} 현장 소장 자료:
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ※ 대출 중인 자료는 자동 제외되어 현재 서가 비치본만 표시됩니다.
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
                              {holding.statusBadgeText}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 text-right">
                              {holding.campusNameKo}
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
                              <span className="text-slate-500 text-[11px]">소장처 / 건물:</span>
                              <span className="font-semibold text-slate-800 text-right">
                                {holding.repositoryName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-sans text-[11px]">
                                청구기호 (Call No.):
                              </span>
                              <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                                {holding.callNumber}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2 font-sans">
                              <span className="text-slate-500 text-[11px]">서가 위치 안내:</span>
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
                              <span>확인하기 (실시간 대출 현황 조회)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 text-center space-y-1.5">
                      <p className="font-medium text-slate-800">
                        현재 {skkuCampus === 'seoul' ? '인사캠(서울) 도서관' : '자캠(수원) 삼성학술정보관'} 서가에는 대출 가능한 실물 책이 모두 대출 중이거나 비치되어 있지 않습니다.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        아래 전자책(E-Book) 또는 타 캠퍼스 상호대차 신청 도서를 확인해 보세요.
                      </p>
                    </div>
                  )}

                  {/* Dual-Campus Awareness & Inter-Campus Loan Section */}
                  {skkuHoldingData.onOtherCampus.length > 0 && (
                    <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-200 text-blue-900">
                            상호대차 가능
                          </span>
                          <span className="text-xs font-bold text-blue-950">
                            {skkuCampus === 'seoul'
                              ? '수원 삼성학술정보관 소장 중 (상호대차 신청 가능)'
                              : '서울 중앙도서관 소장 중 (상호대차 신청 가능)'}
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700">
                          신청 시 1~2일 내 소속 캠퍼스 도서관 수령
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
                                {otherHolding.campusNameKo}
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
                              <span>확인하기 (실시간 대출 현황 및 상호대차 신청)</span>
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
                            [💻 전자책 바로보기 / E-Book Available]
                          </span>
                          <span className="text-xs font-bold text-indigo-950">
                            SKKU 기관구독 전자도서관 (Web / 모바일 앱)
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-700">
                          대출 대기 없음 · 24시간 교외접속
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
                            <span>확인하기 (실시간 대출 현황 조회)</span>
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
                      <strong>실시간 연동 투명성 안내:</strong> 도서관 현장 열람석 지정 및 분 단위 대출 예약 현황은 교외 보안 정책상 브라우저에서 직접 스크랩되지 않으므로, 각 카드의 <em>[확인하기 (실시간 대출 현황 조회)]</em> 버튼을 통해 SKKU 학술정보관 공식 페이지에서 최신 1분 대출/예약 상태를 확인하시기 바랍니다.
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
                        { id: 'all', label: 'All' },
                        { id: 'new', label: 'New' },
                        { id: 'used', label: 'Used' },
                        { id: 'digital', label: 'eBook' },
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
                        { id: 'total_cost', label: 'Lowest Price' },
                        { id: 'effective_cost', label: 'After Points' },
                        { id: 'speed', label: 'Fastest' },
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
                    <span>Coupang WOW</span>
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
                    <span>Store Pickup Only</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Ranked Comparison Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {processedOffers.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm text-slate-600">
                      No offers match the selected filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setConditionFilter('all');
                        setPreferences((p) => ({ ...p, preferPickup: false }));
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                          <th className="py-3 pl-5 pr-2 w-12">#</th>
                          <th className="py-3 px-3">Store</th>
                          <th className="py-3 px-3">Condition</th>
                          <th className="py-3 px-3 text-right">Book Price</th>
                          <th className="py-3 px-3 text-right">Shipping</th>
                          <th className="py-3 px-3 text-right">
                            {preferences.deductRewardPoints ? 'Net Price' : 'Total Price'}
                          </th>
                          <th className="py-3 px-3">Delivery</th>
                          <th className="py-3 pl-3 pr-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {processedOffers.map(({ offer, metrics }, index) => {
                          const isExpanded = expandedOfferId === offer.id;
                          const isInCart = cart.some(
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
                                  {offer.platformNameKo}
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
                                      Free
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
                                      onClick={() => handleAddToCart(offer)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                        isInCart
                                          ? 'bg-emerald-700 text-white'
                                          : 'bg-slate-900 text-white hover:bg-slate-800'
                                      }`}
                                    >
                                      {isInCart ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Added</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3" />
                                          <span>Cart</span>
                                        </>
                                      )}
                                    </button>

                                    <a
                                      href={offer.directSearchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                                    >
                                      <span>Visit</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedOfferId(isExpanded ? null : offer.id)
                                      }
                                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                      aria-label="Details"
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
                                        <strong className="text-slate-900">Tip:</strong>{' '}
                                        {offer.studentTip}
                                      </p>
                                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                                        Reward Points: +{formatKrw(offer.rewardPointsKrw)}
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
                  Cheaper Alternatives (eBook & Previous Editions)
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
                            ? '₩0 (Free)'
                            : formatKrw(alt.estimatedCostKrw)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{alt.pros}</p>
                      <p className="text-[11px] text-slate-500">Note: {alt.cons}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Advisor Box */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Ask About Edition or Binding (분철/바이백)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '구판으로 공부해도 되나요?',
                    '분철 vs 학기말 알라딘 바이백?',
                  ].map((q) => (
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
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="submit"
                    disabled={isAdvisorLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isAdvisorLoading ? '...' : 'Ask'}
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

      {/* Slide-Over Semester Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Semester Cart ({cart.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ShoppingBag className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600">Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        {item.offer.platformNameKo} · {item.offer.condition}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.textbookTitleKo}
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
                        <span>Go to store</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.cartItemId)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-[#FAF9F6] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Books Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatKrw(cartSummary.totalBasePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-mono tabular-nums">
                    {cartSummary.totalShipping === 0
                      ? '₩0 (Free)'
                      : formatKrw(cartSummary.totalShipping)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="font-mono tabular-nums text-lg">
                    {formatKrw(cartSummary.grandTotal)}
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
