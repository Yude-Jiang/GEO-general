/**
 * Concurrency control utilities.
 *
 * Limits the number of in-flight promises so bursty parallel calls
 * don't overwhelm API rate limits.
 */

/**
 * Maps an array of items through an async mapper function,
 * limiting concurrency to `concurrency` simultaneous calls.
 *
 * Works like Promise.all(items.map(mapper)) but with a cap on
 * how many promises run at once.
 *
 * @example
 *   const results = await pMap(urls, url => fetch(url), { concurrency: 3 });
 */
export async function pMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  { concurrency = 5 }: { concurrency?: number } = {},
): Promise<R[]> {
  if (items.length === 0) return [];
  if (concurrency <= 0) concurrency = 1;

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
