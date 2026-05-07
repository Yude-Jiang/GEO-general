/**
 * Shared GEO utility functions.
 *
 * Extracted from geminiService.ts and promptBuilder.ts to eliminate
 * duplicated Europe/Mistral detection logic and provide common helpers.
 */

// ─── Europe Region Detection ─────────────────────────────────────────────────

export const EUROPE_KEYWORDS = [
  'europe', 'eu ', 'eu,', 'emea',
  '欧洲', '欧盟',
  'europa',
  'france', 'germany', 'deutschland', 'united kingdom', 'britain',
  'netherlands', 'spain', 'italy',
  'nordic', 'scandinavia', 'benelux',
  'swiss', 'switzerland',
  'austria', 'belgium', 'poland', 'czech',
] as const;

/**
 * Returns true when the given region string matches any known European
 * keyword.  Uses substring matching so e.g. "switzerland" matches "swiss".
 */
export function isEuropeRegion(region?: string): boolean {
  if (!region) return false;
  const lower = region.toLowerCase();
  return EUROPE_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Promise Timeout ─────────────────────────────────────────────────────────

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise so it rejects with TimeoutError if it doesn't settle
 * within `ms` milliseconds.  The original promise is **not** aborted —
 * use `withAbortableTimeout` when cancellation matters.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * Wraps a promise that accepts an AbortSignal so it both times out and
 * signals the underlying operation to cancel.
 */
export function withAbortableTimeout<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  if (ms <= 0) return factory(new AbortController().signal);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return factory(ctrl.signal).then(
    (val) => { clearTimeout(timer); return val; },
    (err) => { clearTimeout(timer); throw err; },
  );
}
