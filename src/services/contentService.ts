/**
 * Content Generation & Optimization Service
 *
 * Step 3 of the workflow: Content Production and Standalone Mode.
 * Uses DeepSeek for content generation and JSON-LD schema production.
 */

import type { PlaybookAnchorBundle, MonitoringQuestion } from "../types";
import type { GeoMethodId } from "./geoMethods";
import { callDeepSeekStream, callDeepSeekJSON } from "./deepseekClient";
import { buildContentPrompt } from "./promptBuilder";
import { buildMethodDirectives } from "./geoMethods";

// ─── Content Generation ──────────────────────────────────────────────────────

/**
 * Generates a streaming GEO-optimized content based on selected playbooks,
 * anchors, source context, and user preferences.
 */
export const generateContentStream = async (
  platform: string,
  format: string,
  bundles: PlaybookAnchorBundle[],
  orphanAnchors: MonitoringQuestion[],
  customPrompt: string,
  sourceContext: string,
  uiLang: string,
  focusedMode: boolean = false,
  selectedMethods: GeoMethodId[] = [],
  ecosystem?: string,
  customRegion?: string,
) => {
  const prompt = buildContentPrompt({
    platform, format, bundles, orphanAnchors, customPrompt,
    sourceContext, uiLang, focusedMode, selectedMethods,
    ecosystem, customRegion,
  });

  return callDeepSeekStream(prompt, { temperature: 0.3, maxTokens: 8192 });
};

// ─── Standalone Content Optimizer ────────────────────────────────────────────

function buildOptimizePrompt({
  existingContent, methodDirectives, platform, format,
  userDirective, uiLang, ecosystem, customRegion,
}: {
  existingContent: string;
  methodDirectives: string;
  platform: string;
  format: string;
  userDirective: string;
  uiLang: string;
  ecosystem?: string;
  customRegion?: string;
}): string {
  const directive = userDirective.trim()
    ? `\nUSER DIRECTIVE: ${userDirective.trim()}`
    : '';

  const mistralClause = ecosystem === 'global' && customRegion
    ? `\nEUROPEAN MARKET CONSIDERATION: Target region includes Europe. Reference EU standards, CE/EN certifications, GDPR compliance, and European regulatory frameworks where these topics are supported by the source content.`
    : '';

  return `ROLE: Elite GEO (Generative Engine Optimization) Content Optimizer / Editor.
TASK: Rewrite and strengthen the provided content to maximize its probability of being cited, quoted, and recommended by AI language models in response to future user queries.

TARGET PLATFORM: [${platform}]
FORMAT TYPE: [${format}] — Strictly adhere to the structure and length norms of this format.
OUTPUT LANGUAGE: [${uiLang}] — The ENTIRE output MUST be in this language. Do not mix languages.${directive}${mistralClause}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ZERO-HALLUCINATION PROTOCOL — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- EVERY claim, figure, specification, product name, and statistic in your output MUST originate from the SOURCE CONTENT below.
- Do NOT introduce any new facts, entities, prices, or statistics not found in the source.
- If a GEO method requires a data point you cannot find in the sources, SKIP that directive rather than fabricating data.
- You are an editor improving presentation, NOT a researcher inventing new content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GEO OPTIMIZATION DIRECTIVES (apply all that are supported by the source data):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${methodDirectives}
- BLUF (Bottom Line Up Front): The opening paragraph must lead with the single most citable, high-value fact or claim from the source.
- Snippet-optimized structure: Use clear H2/H3 headings, spec tables, and concise bullet lists to enable AI snippet extraction.
- Technical terminology precision: Use exact product names, specs, part numbers, and standard acronyms as found in the source.
- Remove hedge language: Eliminate phrases like "may", "might", "could potentially", "it is believed that" — replace with direct assertions backed by source data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE CONTENT TO OPTIMIZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
${existingContent.slice(0, 8000)}
"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY OUTPUT FORMAT (follow exactly):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write the complete optimized/rewritten content.
2. Then write exactly on its own line: == GEO_ANALYSIS ==
3. Write a structured GEO audit with two sections:
   **Changes Made**: Bullet list of specific structural and language changes applied.
   **Expected GEO Signal Improvement**: Quantified estimates (e.g., "quantified claims: +3 → from 2 to 5", "hedge words removed: -4").
4. Then write exactly on its own line: == END ==`;
}

/**
 * Streaming GEO content optimizer for Standalone Mode.
 * Rewrites existing content to maximize AI citation probability.
 */
export const optimizeContentForGeoStream = async (
  existingContent: string,
  selectedMethods: GeoMethodId[],
  platform: string,
  format: string,
  userDirective: string,
  uiLang: string,
  ecosystem?: string,
  customRegion?: string,
) => {
  const methodDirectives = buildMethodDirectives(selectedMethods.slice(0, 3));
  const prompt = buildOptimizePrompt({
    existingContent, methodDirectives, platform, format,
    userDirective, uiLang, ecosystem, customRegion,
  });

  return callDeepSeekStream(prompt, { temperature: 0.3, maxTokens: 8192 });
};

// ─── JSON-LD Schema Generator ────────────────────────────────────────────────

/**
 * Generates JSON-LD structured data for the given content.
 * Uses callDeepSeekJSON with a schema-generation prompt.
 */
export const generateJsonLdSchema = async (content: string, uiLang: string, platform: string) => {
  const langNames: Record<string, string> = {
    zh: 'Chinese (Mandarin)', en: 'English',
  };
  const langName = langNames[uiLang] || uiLang;

  const prompt = `You are a Schema.org expert. Based on the following content, generate a VALID JSON-LD structured data block (application/ld+json). The schema should include @context, @type (Article, TechArticle, or HowTo as appropriate), headline, description, author, datePublished, and any relevant properties. Platform: ${platform}.

OUTPUT LANGUAGE: [${langName}] — All text value fields (headline, description, keywords, name, etc.) MUST be written in ${langName}. Do NOT output English text in value fields unless the language is English.

Content to schema-ify:
${content.slice(0, 4000)}

RESPOND WITH ONLY THE JSON OBJECT. Do NOT wrap in markdown code fences. Do NOT add explanatory text.`;

  const result = await callDeepSeekJSON<Record<string, unknown>>(prompt, {
    temperature: 0.2,
    maxTokens: 2048,
  });

  return JSON.stringify(result, null, 2);
};
