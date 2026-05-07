/**
 * Singleton Gemini Client
 *
 * Reads the API key from window.env (production) or import.meta.env (dev)
 * and creates the GoogleGenAI client exactly once.
 */

import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;
let lastKey = '';

/**
 * Returns a singleton GoogleGenAI instance.
 * Re-creates the client only when the API key changes.
 */
export function getGenAI(): GoogleGenAI {
  const apiKey =
    (typeof window !== 'undefined' && (window as any).env?.VITE_GEMINI_API_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error(
      'API key is missing. Set VITE_GEMINI_API_KEY in .env.local (dev) ' +
        'or as an environment variable on the server (production).',
    );
  }

  if (!client || apiKey !== lastKey) {
    client = new GoogleGenAI({ apiKey });
    lastKey = apiKey;
  }
  return client;
}

/**
 * Resets the cached client — useful for testing or when the key changes
 * at runtime.
 */
export function resetGeminiClient(): void {
  client = null;
  lastKey = '';
}
