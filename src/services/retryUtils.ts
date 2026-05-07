/**
 * Universal retry utility for API 429 (rate-limit) errors.
 *
 * Handles both:
 *   - Gemini API (Google): nested JSON error with `error.details[].retryDelay`
 *   - OpenAI-compatible (DeepSeek): HTTP 429 with `Retry-After` header
 *
 * Parses the retry delay from the error response and waits with a
 * countdown callback before retrying.
 */

// ─── Error Parsing ───────────────────────────────────────────────────────────

/**
 * Extracts the retry delay (in seconds) from a 429 API error.
 *
 * Supports:
 *   1. OpenAI-compatible: error.status === 429 + retryAfter field
 *   2. Google/Gemini: nested JSON error.details[].retryDelay
 *   3. Plain-text fallback: "retry in Xs" pattern
 */
export const parseRetrySeconds = (err: any): number | null => {
  // 1. OpenAI / DeepSeek style — check .status + .retryAfter (attached by deepseekClient)
  if (err?.status === 429 && err?.retryAfter) {
    const parsed = parseInt(err.retryAfter, 10);
    if (!isNaN(parsed)) return parsed;
  }

  try {
    // 2. Google / Gemini style — nested JSON with retryDelay
    const raw = typeof err?.message === 'string' ? JSON.parse(err.message) : err;
    const details = raw?.error?.details || [];
    for (const d of details) {
      if (d?.retryDelay) {
        const match = String(d.retryDelay).match(/([\d.]+)/);
        if (match) return Math.ceil(parseFloat(match[1]));
      }
    }
    const inner = raw?.error?.message || raw?.message || '';
    const match = inner.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1]));
  } catch { /* parse failure is non-fatal */ }
  return null;
};

const is429 = (err: any): boolean => {
  // 1. OpenAI / DeepSeek style: .status attached by deepseekClient
  if (err?.status === 429) return true;

  // 2. Google / Gemini style: nested JSON error.code === 429
  try {
    const raw = typeof err?.message === 'string' ? JSON.parse(err.message) : err;
    return raw?.error?.code === 429 || raw?.error?.status === 'RESOURCE_EXHAUSTED';
  } catch { return false; }
};

// ─── Retry Wrapper ───────────────────────────────────────────────────────────

/**
 * Wraps an async API call with automatic 429 retry + countdown callback.
 *
 * @param fn           The API call to retry
 * @param onCountdown  Optional callback receiving the remaining seconds
 * @param maxRetries   Maximum retry attempts (default 3)
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  onCountdown?: (secondsLeft: number) => void,
  maxRetries = 3,
): Promise<T> => {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (is429(err) && attempt < maxRetries) {
        const seconds = parseRetrySeconds(err) || 60;
        for (let s = seconds; s > 0; s--) {
          onCountdown?.(s);
          await new Promise(r => setTimeout(r, 1000));
        }
        onCountdown?.(0);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};
