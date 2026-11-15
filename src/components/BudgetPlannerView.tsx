import React, { useState } from 'react';
import {
  Plus,
  X,
  ExternalLink,
  Check,
  Copy,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AppLanguage,
  BudgetAllocationItem,
  BudgetPlanResult,
  SkkuCampus,
} from '../types/textbook';
import { TranslationStrings } from '../data/translations';

interface BudgetPlannerViewProps {
  lang: AppLanguage;
  t: TranslationStrings;
  skkuCampus: SkkuCampus;
  targetBudgetKrw: number;
  setTargetBudgetKrw: (val: number) => void;
  booksList: string[];
  setBooksList: React.Dispatch<React.SetStateAction<string[]>>;
  prioritizeLibraryZeroCost: boolean;
  setPrioritizeLibraryZeroCost: (val: boolean) => void;
  budgetPlan: BudgetPlanResult | null;
  setBudgetPlan: React.Dispatch<React.SetStateAction<BudgetPlanResult | null>>;
  isGeneratingPlan: boolean;
  planError: string | null;
  onGeneratePlan: (overrideBudget?: number, overrideBooks?: string[], overrideLib?: boolean) => Promise<void>;
  onInspectBookInSearch: (query: string) => void;
}

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

const QUICK_BUDGET_PRESETS = [50000, 80000, 100000, 150000];

export default function BudgetPlannerView({
  lang,
  t,
  skkuCampus,
  targetBudgetKrw,
  setTargetBudgetKrw,
  booksList,
  setBooksList,
  prioritizeLibraryZeroCost,
  setPrioritizeLibraryZeroCost,
  budgetPlan,
  setBudgetPlan,
  isGeneratingPlan,
  planError,
  onGeneratePlan,
  onInspectBookInSearch,
}: BudgetPlannerViewProps) {
  const [bookInput, setBookInput] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [outputFormatTab, setOutputFormatTab] = useState<'visual' | 'markdown' | 'json'>('visual');
  const [copiedState, setCopiedState] = useState(false);

  const handleAddBookInput = () => {
    const trimmed = bookInput.trim();
    if (!trimmed) return;
    const parts = trimmed
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setBooksList((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.includes(p)) {
          next.push(p);
        }
      });
      return next;
    });
    setBookInput('');
  };

  const handleRemoveBook = (bookToRemove: string) => {
    setBooksList((prev) => prev.filter((b) => b !== bookToRemove));
  };

  const handleApplyPresetBundle = async (bundle: {
    label: string;
    budget: number;
    books: string[];
  }) => {
    setTargetBudgetKrw(bundle.budget);
    setBooksList(bundle.books);
    setShowMoreOptions(false);
    await onGeneratePlan(bundle.budget, bundle.books, prioritizeLibraryZeroCost);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const extra = bookInput
      .trim()
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...booksList, ...extra]));
    if (extra.length > 0) {
      setBooksList(merged);
      setBookInput('');
    }
    void onGeneratePlan(targetBudgetKrw, merged, prioritizeLibraryZeroCost);
  };

  const handleSwitchItemToLibrary = (itemId: string) => {
    if (!budgetPlan) return;

    const updatedItems: BudgetAllocationItem[] = budgetPlan.items.map((item) => {
      if (item.id !== itemId || item.conditionCategory === 'library') return item;
      const skkuUrl = `https://lib.skku.edu/search/tot/result?st=FRNT&q=${encodeURIComponent(
        item.isbn13 || item.bookTitleKo
      )}`;
      return {
        ...item,
        sourceVendorKo:
          skkuCampus === 'suwon'
            ? '성균관대 삼성학술정보관 (자캠/전자책)'
            : '성균관대 중앙도서관 (인사캠/전자도서관)',
        sourceVendorEn:
          skkuCampus === 'suwon'
            ? 'SKKU Samsung Library (Suwon / E-Library)'
            : 'SKKU Central Library (Seoul / E-Library)',
        platformId: 'skku_library',
        conditionFormatKo: '도서관 무료 대출 / 전자책 전환 (₩0)',
        conditionFormatEn: 'Campus Library Loan / E-Book (₩0)',
        conditionCategory: 'library',
        basePriceKrw: 0,
        shippingFeeKrw: 0,
        totalPriceKrw: 0,
        directActionUrl: skkuUrl,
        rationaleKo:
          '성균관대 도서관 실물 대출/전자책(₩0)으로 전환하여 학기 예산을 절감했습니다.',
        rationaleEn:
          'Switched to SKKU Library Free Loan / E-Book (₩0) to bring total cost down.',
      };
    });

    const totalBaseCostKrw = updatedItems.reduce((sum, i) => sum + i.basePriceKrw, 0);
    const totalShippingCostKrw = updatedItems.reduce((sum, i) => sum + i.shippingFeeKrw, 0);
    const totalEstimatedCostKrw = totalBaseCostKrw + totalShippingCostKrw;
    const totalSavedKrw = Math.max(0, budgetPlan.totalListPriceKrw - totalEstimatedCostKrw);
    const remainingBudgetKrw = budgetPlan.targetBudgetKrw - totalEstimatedCostKrw;
    const isWithinBudget = remainingBudgetKrw >= 0;

    const statusBadgeKo = isWithinBudget
      ? '예산 내 최적 배분 완료'
      : '목표 예산 초과 — 도서관 대출/구판 타협안 권장';
    const statusBadgeEn = isWithinBudget
      ? 'Optimized Within Target Budget'
      : 'Over Target Budget — Library Compromise Recommended';

    setBudgetPlan({
      ...budgetPlan,
      items: updatedItems,
      totalBaseCostKrw,
      totalShippingCostKrw,
      totalEstimatedCostKrw,
      totalSavedKrw,
      remainingBudgetKrw,
      isWithinBudget,
      statusBadgeKo,
      statusBadgeEn,
    });
  };

  const handleCopyReport = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch {}
  };

  const jsonSummaryObject = budgetPlan
    ? {
        budgetSummary: {
          targetBudgetKrw: budgetPlan.targetBudgetKrw,
          totalEstimatedCostKrw: budgetPlan.totalEstimatedCostKrw,
          totalBaseCostKrw: budgetPlan.totalBaseCostKrw,
          totalShippingCostKrw: budgetPlan.totalShippingCostKrw,
          totalListPriceKrw: budgetPlan.totalListPriceKrw,
          totalSavedKrw: budgetPlan.totalSavedKrw,
          remainingBudgetKrw: budgetPlan.remainingBudgetKrw,
          isWithinBudget: budgetPlan.isWithinBudget,
          status: lang === 'en' ? budgetPlan.statusBadgeEn : budgetPlan.statusBadgeKo,
        },
        optimizedProcurementList: budgetPlan.items.map((item) => ({
          bookTitle: lang === 'en' ? item.bookTitleEn : item.bookTitleKo,
          sourceVendor: lang === 'en' ? item.sourceVendorEn : item.sourceVendorKo,
          conditionFormat: lang === 'en' ? item.conditionFormatEn : item.conditionFormatKo,
          basePriceKrw: item.basePriceKrw,
          shippingFeeKrw: item.shippingFeeKrw,
          totalPriceKrw: item.totalPriceKrw,
          directActionUrl: item.directActionUrl,
        })),
        smartSavingAdvice:
          lang === 'en' ? budgetPlan.smartSavingAdviceEn : budgetPlan.smartSavingAdviceKo,
      }
    : null;

  const canSubmit = !isGeneratingPlan && (booksList.length > 0 || bookInput.trim().length > 0);

  return (
    <div className="space-y-8">
      {/* Streamlined Minimalist Pre-Search / Input Box */}
      <section
        className={`max-w-2xl mx-auto transition-all ${
          !budgetPlan && !isGeneratingPlan ? 'py-8 sm:py-12' : 'py-1'
        }`}
      >
        <form
          onSubmit={handleSubmitForm}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5"
        >
          {/* 1. Target Budget Input Field with quick-select KRW chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="target-budget-input"
                className="text-xs font-bold text-slate-800"
              >
                {t.budgetTargetLabel}
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {QUICK_BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetBudgetKrw(preset)}
                    className={`px-2 py-0.5 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer ${
                      targetBudgetKrw === preset
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-[#FAF9F6] text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {formatKrw(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-mono font-bold text-slate-500">
                ₩
              </span>
              <input
                id="target-budget-input"
                type="number"
                min={0}
                step={5000}
                value={targetBudgetKrw}
                onChange={(e) => setTargetBudgetKrw(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-2 text-base font-mono tabular-nums font-bold bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* 2. Required Books List Input */}
          <div className="space-y-2">
            <label
              htmlFor="budget-book-adder"
              className="block text-xs font-bold text-slate-800"
            >
              {t.budgetBooksLabel}
              {booksList.length > 0 ? ` (${booksList.length})` : ''}
            </label>

            <div className="flex items-center gap-2">
              <input
                id="budget-book-adder"
                type="text"
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && bookInput.trim()) {
                    e.preventDefault();
                    handleAddBookInput();
                  }
                }}
                placeholder={t.budgetBookInputPlaceholder}
                className="flex-1 px-3.5 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={handleAddBookInput}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.budgetAddBookBtn}</span>
              </button>
            </div>

            {booksList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {booksList.map((book, idx) => (
                  <span
                    key={`${book}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F6] border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  >
                    <BookOpen className="w-3 h-3 text-blue-900 shrink-0" />
                    <span>{book}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(book)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label={`Remove ${book}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {planError && (
            <div className="flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{planError}</span>
            </div>
          )}

          {/* 3. Primary Action Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 px-5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isGeneratingPlan ? t.budgetGeneratingBtn : t.budgetGenerateBtn}
          </button>

          {/* Progressive Disclosure: Collapsed secondary options & sample bundles */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <span>
                {lang === 'en'
                  ? 'Sample course bundles & library options'
                  : lang === 'zh'
                  ? '推荐专业课程包与图书馆设置'
                  : '추천 과목 패키지 및 도서관 옵션 더보기'}
              </span>
              {showMoreOptions ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showMoreOptions && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {t.budgetPresetsTitle}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.budgetPresetBundles.map((bundle) => (
                      <button
                        key={bundle.label}
                        type="button"
                        onClick={() => handleApplyPresetBundle(bundle)}
                        className="px-2.5 py-1 text-xs bg-[#FAF9F6] border border-slate-200 rounded-md text-slate-700 hover:border-blue-900 hover:text-blue-900 transition-colors cursor-pointer"
                      >
                        {bundle.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prioritizeLibraryZeroCost}
                    onChange={(e) => setPrioritizeLibraryZeroCost(e.target.checked)}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>{t.budgetPrioritizeLibraryLabel}</span>
                </label>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Loading Skeleton */}
      {isGeneratingPlan && (
        <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{t.budgetGeneratingBtn}</span>
            <span className="font-mono tabular-nums">SKKU · Aladin · Kyobo · YES24</span>
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </section>
      )}

      {/* Generated Budget Plan Output (Only visible after generating a plan) */}
      {budgetPlan && !isGeneratingPlan && (
        <div className="space-y-6">
          {/* 1. 📊 예산 요약 / Budget Summary */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t.budgetSummaryHeading}
              </h2>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-md ${
                  budgetPlan.isWithinBudget
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-300'
                }`}
              >
                {lang === 'en'
                  ? budgetPlan.statusBadgeEn
                  : lang === 'zh'
                  ? budgetPlan.isWithinBudget
                    ? '已优化至目标预算内'
                    : '超出目标预算 — 建议借阅图书馆或选用旧版'
                  : budgetPlan.statusBadgeKo}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                <div className="text-xs text-slate-500">{t.budgetTargetCardLabel}</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {formatKrw(budgetPlan.targetBudgetKrw)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'en'
                    ? `${budgetPlan.items.length} courses/books`
                    : lang === 'zh'
                    ? `共 ${budgetPlan.items.length} 门课程/教材`
                    : `총 ${budgetPlan.items.length}권 대상`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950 text-white">
                <div className="text-xs text-blue-200">{t.budgetEstimatedCardLabel}</div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums mt-1">
                  {formatKrw(budgetPlan.totalEstimatedCostKrw)}
                </div>
                <div className="text-[11px] text-blue-200 font-mono tabular-nums mt-0.5">
                  {lang === 'en'
                    ? `Books ${formatKrw(budgetPlan.totalBaseCostKrw)} + Ship ${formatKrw(
                        budgetPlan.totalShippingCostKrw
                      )}`
                    : lang === 'zh'
                    ? `书费 ${formatKrw(budgetPlan.totalBaseCostKrw)} + 运费 ${formatKrw(
                        budgetPlan.totalShippingCostKrw
                      )}`
                    : `도서 ${formatKrw(budgetPlan.totalBaseCostKrw)} + 배송 ${formatKrw(
                        budgetPlan.totalShippingCostKrw
                      )}`}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  budgetPlan.isWithinBudget
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-red-50/70 border-red-200'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    budgetPlan.isWithinBudget ? 'text-emerald-800' : 'text-red-800'
                  }`}
                >
                  {t.budgetRemainingCardLabel}
                </div>
                <div
                  className={`text-lg sm:text-xl font-bold font-mono tabular-nums mt-1 ${
                    budgetPlan.isWithinBudget ? 'text-emerald-900' : 'text-red-900'
                  }`}
                >
                  {budgetPlan.remainingBudgetKrw >= 0
                    ? `+${formatKrw(budgetPlan.remainingBudgetKrw)}`
                    : `-${formatKrw(Math.abs(budgetPlan.remainingBudgetKrw))}`}
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    budgetPlan.isWithinBudget ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {budgetPlan.isWithinBudget
                    ? lang === 'en'
                      ? 'Remaining budget saved'
                      : lang === 'zh'
                      ? '目标预算内结余'
                      : '목표 예산 내 여유 잔액'
                    : lang === 'en'
                    ? 'Exceeds target — see library switch below'
                    : lang === 'zh'
                    ? '超出预算 — 建议下方切换图书馆 ₩0 借阅'
                    : '목표 예산 초과 — 아래 도서관 ₩0 전환 권장'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                <div className="text-xs text-slate-500">{t.budgetTotalSavedCardLabel}</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                  -{formatKrw(budgetPlan.totalSavedKrw)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                  {lang === 'en'
                    ? `List Total: ${formatKrw(budgetPlan.totalListPriceKrw)}`
                    : lang === 'zh'
                    ? `定价合计: ${formatKrw(budgetPlan.totalListPriceKrw)}`
                    : `정가 합계: ${formatKrw(budgetPlan.totalListPriceKrw)}`}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 bg-[#FAF9F6] border border-slate-200 rounded-lg p-3.5 leading-relaxed">
              {lang === 'en' ? budgetPlan.summaryTextEn : budgetPlan.summaryTextKo}
            </p>
          </section>

          {/* 2. 📚 최적 추천 구매 목록 / Optimized Procurement List & Format Inspector */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t.budgetListHeading}
              </h2>

              {/* View Switcher: Visual Table | Structured Markdown | JSON Summary */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setOutputFormatTab('visual')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    outputFormatTab === 'visual'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.budgetViewVisualTab}
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormatTab('markdown')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    outputFormatTab === 'markdown'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.budgetViewMarkdownTab}
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormatTab('json')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    outputFormatTab === 'json'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.budgetViewJsonTab}
                </button>
              </div>
            </div>

            {outputFormatTab === 'visual' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 pl-6 pr-2 w-10">#</th>
                      <th className="py-3 px-3">{t.budgetColBook}</th>
                      <th className="py-3 px-3">{t.budgetColSource}</th>
                      <th className="py-3 px-3">{t.budgetColCondition}</th>
                      <th className="py-3 px-3 text-right">{t.budgetColPriceShipping}</th>
                      <th className="py-3 pl-3 pr-6 text-right">{t.budgetColAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {budgetPlan.items.map((item, idx) => {
                      const isLibrary = item.conditionCategory === 'library';
                      return (
                        <tr
                          key={item.id}
                          className={
                            isLibrary ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-4 pl-6 pr-2 font-mono tabular-nums text-xs text-slate-500 align-top">
                            {idx + 1}
                          </td>
                          <td className="py-4 px-3 align-top space-y-1">
                            <div className="font-bold text-slate-900">
                              {lang !== 'ko' ? item.bookTitleEn : item.bookTitleKo}
                            </div>
                            <div className="text-xs text-slate-500 font-mono tabular-nums">
                              {lang === 'en' ? 'List Price:' : lang === 'zh' ? '定价:' : '정가:'}{' '}
                              <span className="line-through">{formatKrw(item.listPriceKrw)}</span>
                              {' · '}ISBN {item.isbn13}
                            </div>
                            <p className="text-xs text-slate-600 pt-0.5">
                              {lang !== 'ko' ? item.rationaleEn : item.rationaleKo}
                            </p>
                            {(item.compromiseTipKo || item.compromiseTipEn) && (
                              <p className="text-[11px] text-slate-500">
                                💡 {lang !== 'ko' ? item.compromiseTipEn : item.compromiseTipKo}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-3 align-top">
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              {isLibrary && (
                                <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                              <span>
                                {lang !== 'ko' ? item.sourceVendorEn : item.sourceVendorKo}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 align-top">
                            <span
                              className={`text-xs font-semibold ${
                                isLibrary
                                  ? 'text-emerald-800'
                                  : item.conditionCategory === 'used'
                                  ? 'text-blue-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {lang !== 'ko' ? item.conditionFormatEn : item.conditionFormatKo}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right font-mono tabular-nums align-top">
                            <div
                              className={`font-bold text-sm ${
                                isLibrary ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {formatKrw(item.totalPriceKrw)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {isLibrary
                                ? lang === 'en'
                                  ? 'Free Campus Loan'
                                  : lang === 'zh'
                                  ? '图书馆免费借阅'
                                  : '무료 대출'
                                : item.shippingFeeKrw === 0
                                ? lang === 'en'
                                  ? 'Free Shipping'
                                  : lang === 'zh'
                                  ? '免运费'
                                  : '배송비 무료'
                                : `${formatKrw(item.basePriceKrw)} + ${formatKrw(
                                    item.shippingFeeKrw
                                  )}`}
                            </div>
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right align-top">
                            <div className="flex flex-col items-end gap-1.5">
                              <a
                                href={item.directActionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                              >
                                <span>{t.budgetOpenLinkBtn}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <div className="flex items-center gap-2 pt-0.5">
                                {!isLibrary && (
                                  <button
                                    type="button"
                                    onClick={() => handleSwitchItemToLibrary(item.id)}
                                    className="text-[11px] font-medium text-emerald-800 hover:underline cursor-pointer whitespace-nowrap"
                                  >
                                    {t.budgetSwitchToLibraryBtn}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onInspectBookInSearch(item.courseOrQuery)}
                                  className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-blue-900 hover:underline cursor-pointer whitespace-nowrap"
                                >
                                  <Search className="w-3 h-3" />
                                  <span>
                                    {lang === 'en'
                                      ? '7-Store Compare'
                                      : lang === 'zh'
                                      ? '7大书店比价'
                                      : '7대 서점 상세비교'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {outputFormatTab === 'markdown' && (
              <div className="p-6 space-y-3 bg-[#FAF9F6]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {t.budgetExportSectionTitle} (Markdown)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyReport(
                        lang !== 'ko' ? budgetPlan.markdownReportEn : budgetPlan.markdownReportKo
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedState ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t.budgetCopiedBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.budgetCopyBtn}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {lang !== 'ko' ? budgetPlan.markdownReportEn : budgetPlan.markdownReportKo}
                </pre>
              </div>
            )}

            {outputFormatTab === 'json' && (
              <div className="p-6 space-y-3 bg-[#FAF9F6]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {t.budgetExportSectionTitle} (JSON)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyReport(JSON.stringify(jsonSummaryObject, null, 2))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedState ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t.budgetCopiedBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.budgetCopyBtn}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {JSON.stringify(jsonSummaryObject, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {/* 3. 💡 AI 절약 팁 / Smart Saving Advice */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              {t.budgetAdviceHeading}
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc pl-5">
              {(lang !== 'ko'
                ? budgetPlan.smartSavingAdviceEn
                : budgetPlan.smartSavingAdviceKo
              ).map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
