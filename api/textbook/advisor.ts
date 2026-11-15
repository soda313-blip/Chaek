import { GoogleGenAI } from '@google/genai';

export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => unknown;
  setHeader: (name: string, value: string | string[]) => unknown;
  end: (chunk?: unknown) => unknown;
}

function parseJsonBody(req: ApiRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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
• 무료배송 기준 활용: 교보문고·예스24·11번가 도서는 ₩15,000 이상, 알라딘 직배송 중고는 ₩20,000 이상, 쿠팡은 ₩19,800(와우회원 무제한 무료) 이상일 때 배송비가 ₩0입니다. 부족한 금액은 학기 중 필요한 연습장이나 다른 교양 교재와 함께 묶어서 무료배송 기준을 맞추세요.`;
}

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
