/**
 * Singleton DeepSeek Client
 *
 * OpenAI-compatible HTTP client for DeepSeek Chat API.
 * Provides three call patterns:
 *   1. callDeepSeek        — non-streaming text response
 *   2. callDeepSeekStream  — streaming SSE response (AsyncGenerator)
 *   3. callDeepSeekJSON<T> — JSON mode with automatic retry+parse loop
 *
 * Reads the API key from window.env (production / Cloud Run) or
 * import.meta.env (dev / Vite).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekOptions {
  temperature?: number;
  maxTokens?: number;
  /** Extra system-level instructions appended to the system message */
  systemSuffix?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

const DEFAULT_TIMEOUT_MS = 120_000; // 2 min — generous for complex analysis

// ─── API Key Resolution ───────────────────────────────────────────────────────

function getApiKey(): string {
  const key =
    (typeof window !== 'undefined' && (window as any).env?.VITE_DEEPSEEK_API_KEY) ||
    import.meta.env.VITE_DEEPSEEK_API_KEY ||
    '';

  if (!key) {
    throw new Error(
      'DeepSeek API key is missing. Set VITE_DEEPSEEK_API_KEY in .env.local (dev) ' +
        'or as an environment variable on the server (production).',
    );
  }
  return key;
}

// ─── Shared Fetch Helper ──────────────────────────────────────────────────────

let controllerCache: AbortController | null = null;

/**
 * Returns a reusable AbortController, aborting any previous in-flight request.
 * Each call resets the timeout, so concurrent callers each get their own timer.
 */
function getController(timeoutMs: number): AbortController {
  if (controllerCache) controllerCache.abort();
  controllerCache = new AbortController();
  setTimeout(() => controllerCache?.abort(), timeoutMs);
  return controllerCache;
}

async function deepSeekFetch(
  body: Record<string, unknown>,
): Promise<Response> {
  const apiKey = getApiKey();
  const controller = getController(DEFAULT_TIMEOUT_MS);

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // Attach status for retryUtils to inspect
    const err = new Error(`DeepSeek API error ${res.status}: ${errText.slice(0, 500)}`);
    (err as any).status = res.status;
    (err as any).retryAfter = res.headers.get('Retry-After');
    throw err;
  }

  return res;
}

// ─── Message Builder ──────────────────────────────────────────────────────────

function buildMessages(
  userContent: string,
  options?: DeepSeekOptions,
): DeepSeekMessage[] {
  const systemParts: string[] = [];
  if (options?.systemSuffix) systemParts.push(options.systemSuffix);

  const messages: DeepSeekMessage[] = [];
  if (systemParts.length > 0) {
    messages.push({ role: 'system', content: systemParts.join('\n') });
  }
  messages.push({ role: 'user', content: userContent });
  return messages;
}

// ─── 1. Non-Streaming ─────────────────────────────────────────────────────────

/**
 * Sends a non-streaming request to DeepSeek and returns the full text response.
 *
 * @param userContent  The user message content
 * @param options      Optional: temperature, maxTokens, systemSuffix
 */
export async function callDeepSeek(
  userContent: string,
  options?: DeepSeekOptions,
): Promise<string> {
  const messages = buildMessages(userContent, options);
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
    stream: false,
  };

  const res = await deepSeekFetch(body);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

// ─── 2. Streaming (SSE) ───────────────────────────────────────────────────────

/**
 * Sends a streaming request to DeepSeek and returns an async generator that
 * yields text chunks as they arrive via Server-Sent Events.
 *
 * @param userContent  The user message content
 * @param options      Optional: temperature, maxTokens, systemSuffix
 */
export async function* callDeepSeekStream(
  userContent: string,
  options?: DeepSeekOptions,
): AsyncGenerator<string> {
  const messages = buildMessages(userContent, options);
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
    stream: true,
  };

  const res = await deepSeekFetch(body);
  const reader = res.body?.getReader();
  if (!reader) throw new Error('DeepSeek stream: response body is null');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6); // strip "data: "
        if (payload === '[DONE]') return;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Malformed SSE chunk — skip silently
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const payload = trimmed.slice(6);
        if (payload !== '[DONE]') {
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { /* skip */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── 3. JSON Mode with Retry ──────────────────────────────────────────────────

const JSON_SYSTEM_INSTRUCTION =
  'You are a precise JSON generator. Respond ONLY with a valid JSON object. ' +
  'Do NOT wrap it in markdown code fences (```json). Do NOT add any explanatory text before or after. ' +
  'Your entire response must be a single, parseable JSON value.';

/**
 * Sends a request to DeepSeek and automatically retries if the response is not
 * valid JSON.  Appends JSON-formatting instructions to the system message.
 *
 * @param userContent  The user message content
 * @param options      Optional: temperature, maxTokens, extra systemSuffix
 * @param maxRetries   Max parse-failure retries (default 3)
 */
export async function callDeepSeekJSON<T = unknown>(
  userContent: string,
  options?: DeepSeekOptions,
  maxRetries = 3,
): Promise<T> {
  const combinedSuffix = [
    JSON_SYSTEM_INSTRUCTION,
    options?.systemSuffix ?? '',
  ].filter(Boolean).join('\n');

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: combinedSuffix },
    { role: 'user', content: userContent },
  ];

  let lastError = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const body: Record<string, unknown> = {
      model: DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    };

    const res = await deepSeekFetch(body);
    const json = await res.json();
    const rawText = json.choices?.[0]?.message?.content || '';

    // Strip markdown fences if the model wrapped the JSON anyway
    let cleaned = rawText.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      lastError = cleaned.slice(0, 200);

      // On the last attempt, throw; otherwise append error feedback
      if (attempt >= maxRetries) {
        throw new Error(
          `DeepSeek JSON parse failed after ${maxRetries + 1} attempts. ` +
          `Last raw prefix: "${lastError}"`,
        );
      }

      // Feed the error back so the model can self-correct
      messages.push({
        role: 'assistant',
        content: rawText,
      });
      messages.push({
        role: 'user',
        content:
          `Your previous response was not valid JSON. Parse error: ${lastError}. ` +
          `Please respond with ONLY a valid JSON object. No markdown fences. No explanatory text.`,
      });
    }
  }

  throw new Error('Unreachable: callDeepSeekJSON retry loop exhausted');
}
