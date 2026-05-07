/**
 * Chat Assistant Service
 *
 * Provides context-aware GEO assistant chat functionality.
 * Uses DeepSeek as the language model backend.
 */

import { callDeepSeek } from "./deepseekClient";

/**
 * Sends a chat message to the GEO assistant with history and context.
 */
export const chatWithAssistant = async (
  message: string,
  history: any[],
  contextData: any,
  uiLang: string,
) => {
  const systemMsg = `Expert GEO Assistant. UI Lang: ${uiLang}. Context: ${JSON.stringify(contextData)}`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemMsg },
    ...history.map(h => ({
      role: (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message },
  ];

  return callDeepSeek(
    messages[messages.length - 1].content,
    { systemSuffix: systemMsg, temperature: 0.7, maxTokens: 2048 },
  );
};
