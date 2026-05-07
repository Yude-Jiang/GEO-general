/**
 * URL Fetch Utility
 *
 * Fetches a URL through the Jina Reader proxy endpoint on the server.
 */

/**
 * Fetches a URL's content via the server-side Jina Reader proxy.
 * Returns the title, raw content, clean body, and word count.
 */
export const fetchUrlContent = async (url: string) => {
  const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let detail = '';
    try { detail = JSON.parse(body).error; } catch { detail = body; }
    throw new Error(detail || `Fetch failed (${res.status})`);
  }
  const text = await res.text();

  // Jina Reader prepends structured metadata — extract the real page title
  const titleMatch = text.match(/^Title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : url;

  // Strip the Jina metadata header to get clean body text
  const bodyStart = text.indexOf('\n\n');
  const body = bodyStart !== -1 ? text.slice(bodyStart).trim() : text;

  return { title, content: text, body, wordCount: body.split(/\s+/).filter(Boolean).length };
};
