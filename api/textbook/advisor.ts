import {
  advisorCache,
  ApiRequest,
  ApiResponse,
  buildDeterministicAdvisorAnswer,
  FALLBACK_MODELS,
  getGenAIClient,
  isQuotaOrRateLimitError,
  parseJsonBody,
  sleep,
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
  const textbookTitle = typeof body.textbookTitle === 'string' ? body.textbookTitle : '';
  const isbn = typeof body.isbn === 'string' ? body.isbn : '';
  const question = body.question;

  try {
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question for the textbook advisor.' });
    }

    const cacheKey = `${textbookTitle}::${isbn}::${question.trim().toLowerCase()}`;
    if (advisorCache.has(cacheKey)) {
      return res.json({ answer: advisorCache.get(cacheKey) });
    }

    const ai = getGenAIClient();
    if (ai) {
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
      textbookTitle || '전공교재',
      isbn || 'N/A',
      typeof question === 'string' ? question : ''
    );
    return res.json({ answer: fallbackAnswer });
  }
}
