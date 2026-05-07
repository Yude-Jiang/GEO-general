/**
 * Content Formatting Service
 *
 * Humanization, Translation, and other text transformations.
 * Uses DeepSeek as the language model backend.
 */

import { callDeepSeek } from "./deepseekClient";

// ─── Humanize ──────────────────────────────────────────────────────────────────

/**
 * Rewrites AI-generated content to sound more natural and human,
 * while preserving all technical facts and data.
 */
export const humanizeContent = async (content: string, uiLang: string = 'en') => {
  const isZh = uiLang === 'zh' || uiLang.startsWith('zh');

  const zhHumanizerPrompt = `你是一位顶尖的中文深度资深编辑，专门识别并剔除文本中的"AI 味"。
你的目标是让以下文本听起来更自然、更像真实的人类专家书写，同时保留所有核心技术点和数据。

### 🚨 必须剔除的"AI 痕迹"：
1. **宏大叙事与虚假意义**：删掉"标志着关键时刻"、"见证了历史"、"体现了核心价值"等空洞表述。
2. **公式化连接词**：大量删减"此外"、"然而"、"总之"、"至关重要"、"不仅...而且"等机械连词。
3. **分词式浅薄总结**：删除"彰显了..."、"确保了..."、"为...奠定了基础"等句末尾缀。
4. **宣传辞令**：剔除"充满活力的"、"开创性的"、"令人叹为观止的"等过度赞美的广告词。
5. **打破死板节奏**：混合长短句，避免每个句子长度都一样。
6. **信任读者**：直接说事实，不要像保姆一样解释"这意味着..."。

### ✅ 创作要求：
- **语调**：专业但有锋芒，允许适度的观点表达，甚至可以带点"人味"的思考（如"我一直在关注这个趋势..."）。
- **结构**：打破 AI 喜欢的三段式列表，合并信息，或者用更随意的段落结构。
- **语言**：严禁中英混杂（除非是必要的专业术语），确保流畅、地道。

待处理文本：
"""
${content.slice(0, 6000)}
"""`;

  const genericHumanizerPrompt = `You are an expert technical editor specialized in "humanizing" AI-generated text based on the WikiProject AI Cleanup standards.
Your goal is to strip away the robotic, overly-structured, and hyperbolic patterns of LLM output.

### 🚨 ELIMINATE THESE AI PATTERNS:
1. **Fabricated Significance**: Remove phrases like "marks a pivotal moment", "testament to", "underscores the importance of".
2. **Superficial "-ing" Analysis**: Delete ending phrases like ", ensuring that..." or ", highlighting the...".
3. **AI Connectives**: Heavily reduce use of "Additionally", "Moreover", "Furthermore", "In conclusion", "Crucial".
4. **Formulaic "Not only... but also"**: Replace with direct statements.
5. **Robotic Symmetry**: Vary sentence length. AI loves 3-item lists; break them into 2 or 4 items to sound human.
6. **Hedge Phrases**: Remove "It is important to note," or "It appears that." Just state the facts.

### ✅ EXECUTION:
- **Tone**: Professional, direct, and authoritative.
- **Voice**: Injects a sense of individual agency. Use "I/We found" instead of "It was observed" where appropriate.
- **Rhythm**: Mix punchy short sentences with occasional complex ones.

Content to humanize:
"""
${content.slice(0, 6000)}
"""`;

  const finalPrompt = isZh ? zhHumanizerPrompt : genericHumanizerPrompt;

  return callDeepSeek(finalPrompt, { temperature: 0.5, maxTokens: 4096 });
};

// ─── Translate ─────────────────────────────────────────────────────────────────

/**
 * Translates content into the target language while preserving
 * Markdown formatting, technical acronyms, and data values.
 */
export const translateContent = async (content: string, targetLang: string) => {
  const langNames: Record<string, string> = {
    zh: 'Chinese (Mandarin)', en: 'English',
  };
  const langName = langNames[targetLang] || targetLang;

  const prompt = `You are a professional translator. Your ENTIRE response MUST be written exclusively in ${langName}. Do NOT include any text in any other language. Do NOT add a preamble like "Here is the translation:" or any translator's notes. Begin the output directly with the translated content.

Translate the following Markdown content into ${langName}:
- Preserve all Markdown formatting exactly (headers, bold, bullets, tables, code blocks)
- Keep all technical acronyms, product names, and part numbers unchanged
- Ensure the translation sounds fluent and native, NOT robotic
- Preserve ALL data values (numbers, percentages, specifications) exactly as-is

Content to translate:
${content.slice(0, 6000)}`;

  return callDeepSeek(prompt, { temperature: 0.3, maxTokens: 4096 });
};
