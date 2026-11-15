import {
  ApiRequest,
  ApiResponse,
  buildDeterministicTextbookAnalysis,
  FALLBACK_MODELS,
  generateSkkuHoldings,
  getGenAIClient,
  isQuotaOrRateLimitError,
  parseJsonBody,
  searchCache,
  sleep,
  TEXTBOOK_RESPONSE_SCHEMA,
} from '../_lib/textbookEngine';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const body = parseJsonBody(req);

  try {
    const query = body.query;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Please provide a textbook title, author, or ISBN.' });
    }

    const trimmedQuery = query.trim();
    const cacheKey = trimmedQuery.toLowerCase();

    if (searchCache.has(cacheKey)) {
      return res.json({ result: searchCache.get(cacheKey) });
    }

    const ai = getGenAIClient();
    let lastError: unknown = null;

    if (ai) {
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

            const skkuData = generateSkkuHoldings(
              parsed.titleKo || trimmedQuery,
              parsed.isbn13 || '',
              trimmedQuery,
              parsed.courseDepartment || ''
            );

            const finalResult = {
              ...parsed,
              groundingSources,
              skkuDirectSearchUrl: parsed.skkuDirectSearchUrl || skkuData.skkuDirectSearchUrl,
              skkuLibraryHoldings: parsed.skkuLibraryHoldings || skkuData.skkuLibraryHoldings,
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
    }

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
    const fallbackResult = buildDeterministicTextbookAnalysis(String(body.query || '대학교재'));
    return res.json({ result: fallbackResult });
  }
}
