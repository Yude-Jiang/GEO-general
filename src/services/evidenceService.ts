/**
 * Evidence & Verification Service
 *
 * Deep Evidence Grounding, Anchor Verification, and Multi-Model Claim
 * Verification using Google Search grounding.
 */

import type {
  MonitoringQuestion, ScoredEvidenceSource, EvidenceAuthority, EvidenceRecency,
  AnchorVerificationResult, ModelVerificationResult, ModelClaimVerification,
} from "../types";
import { GEMINI_MODELS } from "../config/models";
import { getGenAI } from "./geminiClient";
import { pMap } from "../utils/concurrency";
import { getIndustryConfig } from "../config/industries";

// ─── Authority Scoring ───────────────────────────────────────────────────────

function scoreAuthority(
  uris: string[],
  highDomains: string[],
  mediumDomains: string[],
): EvidenceAuthority {
  for (const uri of uris) {
    try {
      const host = new URL(uri).hostname.replace('www.', '');
      if (highDomains.some(d => host === d || host.endsWith('.' + d))) return 'high';
    } catch { /* ignore */ }
  }
  for (const uri of uris) {
    try {
      const host = new URL(uri).hostname.replace('www.', '');
      if (mediumDomains.some(d => host === d || host.endsWith('.' + d))) return 'medium';
    } catch { /* ignore */ }
  }
  return uris.length > 0 ? 'medium' : 'low';
}

function scoreRecency(uris: string[]): EvidenceRecency {
  const currentYear = new Date().getFullYear();
  for (const uri of uris) {
    const yearMatch = uri.match(/[/=_-](20\d{2})[/=_-]/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return year >= currentYear - 1 ? 'fresh' : 'stale';
    }
  }
  return 'unknown';
}

function scoreAnchorMatch(content: string, anchor: string): boolean {
  const anchorTerms = anchor.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  const contentLower = content.toLowerCase();
  const matchCount = anchorTerms.filter(term => contentLower.includes(term)).length;
  return anchorTerms.length > 0 && matchCount / anchorTerms.length >= 0.5;
}

function computeScore(
  authority: EvidenceAuthority,
  recency: EvidenceRecency,
  anchorMatch: boolean,
): number {
  const a = authority === 'high' ? 0.5 : authority === 'medium' ? 0.3 : 0.1;
  const r = recency === 'fresh' ? 0.3 : recency === 'unknown' ? 0.15 : 0.0;
  const m = anchorMatch ? 0.2 : 0.0;
  return Math.round((a + r + m) * 100) / 100;
}

// ─── Deep Evidence Grounding ─────────────────────────────────────────────────

/**
 * Finds hard evidence for each anchor and scores each source by
 * authority, recency, and anchor-keyword match.
 * Results are sorted by score (highest first).
 */
export const deepEvidenceGrounding = async (
  anchors: string[],
): Promise<ScoredEvidenceSource[]> => {
  if (!anchors || anchors.length === 0) return [];
  const { highAuthorityDomains, mediumAuthorityDomains } = getIndustryConfig();

  const results = await pMap(
    anchors,
    async (anchor): Promise<ScoredEvidenceSource | null> => {
      try {
        const gResult = await getGenAI().models.generateContent({
          model: GEMINI_MODELS.grounding,
          contents: [{
            role: 'user', parts: [{
              text: `DEEP FACT CHECK: Find authoritative technical specifications, official prices, or performance figures for: "${anchor}". Priority: Official Whitepapers, Wiki, or Technical Forums. Summarize the hard data found.`,
            }],
          }],
          config: { tools: [{ googleSearch: {} } as any] },
        });

        const content = gResult.text || '';
        const urls: { title: string; uri: string }[] = [];
        if ((gResult as any).groundingMetadata?.groundingChunks) {
          (gResult as any).groundingMetadata.groundingChunks
            .map((c: any) => c.web).filter(Boolean)
            .forEach((w: any) => urls.push({ title: w.title || '', uri: w.uri || '' }));
        }

        const uris = urls.map(u => u.uri);
        const authority = scoreAuthority(uris, highAuthorityDomains, mediumAuthorityDomains);
        const recency = scoreRecency(uris);
        const anchorMatch = scoreAnchorMatch(content, anchor);
        const score = computeScore(authority, recency, anchorMatch);

        return {
          name: `Deep Evidence: ${anchor.slice(0, 40)}`,
          content,
          type: 'system' as const,
          urls,
          quality: { authority, recency, anchorMatch, score },
        };
      } catch (err) {
        console.warn(`Deep grounding failed for "${anchor}":`, err);
        return null;
      }
    },
    { concurrency: 3 },
  );

  return (results.filter(Boolean) as ScoredEvidenceSource[])
    .sort((a, b) => b.quality.score - a.quality.score);
};

// ─── Anchor Verification ─────────────────────────────────────────────────────

/**
 * Validates that each expectedAnchor actually exists in public sources.
 *
 * Status logic:
 *   verified   → search returned ≥1 URL and anchor keywords found in content
 *   partial    → URLs found but anchor keywords not clearly present
 *   unverified → no URLs returned (anchor may be fabricated or too obscure)
 */
export const verifyAnchors = async (
  questions: MonitoringQuestion[],
): Promise<AnchorVerificationResult[]> => {
  if (!questions || questions.length === 0) return [];

  const results = await Promise.all(
    questions.map(async (q): Promise<AnchorVerificationResult> => {
      try {
        const gResult = await getGenAI().models.generateContent({
          model: GEMINI_MODELS.grounding,
          contents: [{
            role: 'user', parts: [{
              text: `Search for real-world evidence of this specific technical fact or entity: "${q.expectedAnchor}". Return any authoritative sources (official docs, datasheets, whitepapers, forum posts) that confirm it exists. Be direct — only state what the sources say.`,
            }],
          }],
          config: { tools: [{ googleSearch: {} } as any] },
        });

        const content = gResult.text || '';
        const urls: string[] = [];
        if ((gResult as any).groundingMetadata?.groundingChunks) {
          (gResult as any).groundingMetadata.groundingChunks
            .map((c: any) => c.web?.uri).filter(Boolean)
            .forEach((uri: string) => urls.push(uri));
        }

        const anchorMatch = scoreAnchorMatch(content, q.expectedAnchor);
        const hasUrls = urls.length > 0;

        const status: AnchorVerificationResult['status'] =
          hasUrls && anchorMatch ? 'verified'
          : hasUrls ? 'partial'
          : 'unverified';

        const confidence =
          status === 'verified' ? 0.85 + Math.min(urls.length * 0.03, 0.15)
          : status === 'partial' ? 0.4
          : 0.05;

        return {
          anchorId: q.id, anchor: q.expectedAnchor,
          status, supportingUrls: urls.slice(0, 3), confidence,
        };
      } catch {
        return {
          anchorId: q.id, anchor: q.expectedAnchor,
          status: 'unverified', supportingUrls: [], confidence: 0,
        };
      }
    }),
  );

  return results;
};

// ─── Multi-Model Claim Verification ─────────────────────────────────────────

/**
 * Uses Google Search grounding to find real-world evidence for claims
 * in the marketPulse text about how AI models perceive a product.
 */
export const verifyModelClaims = async (
  marketPulseText: string,
  ecosystem: string,
): Promise<ModelVerificationResult> => {
  const disclaimer =
    ecosystem === 'cn'
      ? '以下多模型认知分析由 Gemini 推理模拟生成，非实时调用 DeepSeek / Kimi / 百度等模型 API。如已配置对应 API Key，下方「跨模型认知共识」一栏将展示各模型真实响应以供对照。'
      : 'The multi-model analysis below is simulated by Gemini — it does NOT reflect real-time queries to DeepSeek, Kimi, Doubao, or other ecosystem models. The verification layer uses Google Search grounding to find public evidence supporting these inferences.';

  // Step 1: Ask Gemini to extract 2-3 concrete, searchable claims
  const claimExtractionPrompt = `From this AI market analysis, extract exactly 2-3 specific verifiable claims about how named AI models perceive or recommend specific products/technologies.
Return ONLY a JSON array of short search query strings that would verify each claim.
Example: ["DeepSeek STM32C5 low-cost M33 recommendation 2024", "Kimi BLE Matter chip preference embedded"]

Text:
${marketPulseText.slice(0, 800)}

Return ONLY the JSON array. No markdown fences.`;

  let searchQueries: string[] = [];
  try {
    const extractRes = await getGenAI().models.generateContent({
      model: GEMINI_MODELS.grounding,
      contents: [{ role: 'user', parts: [{ text: claimExtractionPrompt }] }],
      config: { responseMimeType: 'application/json' },
    });
    const raw = (extractRes.text || '[]')
      .replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) searchQueries = parsed.slice(0, 3);
  } catch {
    const fallbackTerm = ecosystem === 'cn' ? 'DeepSeek Kimi'
      : 'ChatGPT Perplexity';
    searchQueries = [`${fallbackTerm} product recommendation analysis`];
  }

  // Step 2: Google Search grounding for each claim
  const verifiedClaims: ModelClaimVerification[] = await Promise.all(
    searchQueries.map(async (query): Promise<ModelClaimVerification> => {
      try {
        const gResult = await getGenAI().models.generateContent({
          model: GEMINI_MODELS.grounding,
          contents: [{
            role: 'user', parts: [{
              text: `Find public evidence (tech forums, articles, official docs) supporting or refuting: "${query}". Summarize what you find.`,
            }],
          }],
          config: { tools: [{ googleSearch: {} } as any] },
        });
        const urls: string[] = [];
        if ((gResult as any).groundingMetadata?.groundingChunks) {
          (gResult as any).groundingMetadata.groundingChunks
            .map((c: any) => c.web?.uri).filter(Boolean).slice(0, 3)
            .forEach((uri: string) => urls.push(uri));
        }
        return { claim: query, evidenceFound: urls.length > 0, sourceUrls: urls };
      } catch {
        return { claim: query, evidenceFound: false, sourceUrls: [] };
      }
    }),
  );

  const verifiedCount = verifiedClaims.filter(c => c.evidenceFound).length;
  const total = verifiedClaims.length;
  const confidence: ModelVerificationResult['confidence'] =
    total === 0 ? 'unverified'
    : verifiedCount === total ? 'high'
    : verifiedCount >= Math.ceil(total / 2) ? 'medium'
    : 'low';

  return { disclaimer, confidence, verifiedClaims, searchedAt: new Date().toISOString() };
};
