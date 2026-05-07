/**
 * Model Configuration
 *
 * Gemini models — kept for Google Search grounding and evidence verification.
 * DeepSeek models — primary AI engine for all content generation tasks.
 */

export const GEMINI_MODELS = {
  grounding: 'gemini-2.5-flash',
  groundingFallback: 'gemini-2.5-flash',
} as const;

export const DEEPSEEK_MODELS = {
  analysis: 'deepseek-chat',
  chat: 'deepseek-chat',
  contentGen: 'deepseek-chat',
} as const;

export type GeminiModelId = keyof typeof GEMINI_MODELS;
export type DeepSeekModelId = keyof typeof DEEPSEEK_MODELS;
