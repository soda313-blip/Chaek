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
} from 'lucide-react';
import {
  TextbookAnalysisResult,
  PlatformOffer,
  StudentPreferences,
  CartItem,
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
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-8">
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
