import { getIndustryConfig } from "../config/industries";

/**
 * GEO Method Registry — based on GEO (2311.09735) Table 1
 * Each method is a prompt modifier that targets a specific visibility lever.
 * Recommended priority: STATISTICS > CITE_SOURCES > AUTHORITATIVE
 */

export type GeoMethodId =
  | 'STATISTICS_ADDITION'
  | 'CITE_SOURCES'
  | 'QUOTATION_ADDITION'
  | 'AUTHORITATIVE'
  | 'UNIQUE_WORDS'
  | 'TECHNICAL_TERMS'
  | 'FLUENCY_OPTIMIZATION'
  | 'EASY_TO_UNDERSTAND';
  // Keyword Stuffing intentionally excluded — paper shows negative ROI

export interface GeoMethod {
  id: GeoMethodId;
  label: string;
  description: string;
  promptDirective: string;       // injected into systemLayer
  recommendedFor: string[];      // domain tags
  liftEstimate: string;          // from paper Table 1
  combinesWellWith: GeoMethodId[];
}

export const GEO_METHODS: GeoMethod[] = [
  {
    id: 'STATISTICS_ADDITION',
    label: '📊 Statistics Addition',
    description: 'Replace qualitative claims with verifiable quantitative data',
    promptDirective: `STATISTICS DIRECTIVE (GEO §2.2.2):
Replace every qualitative claim with a quantifiable statistic where possible.
Examples of transformation:
  BAD:  "Our solution is more cost-effective than alternatives"
  GOOD: "Our solution reduces total cost of ownership by 23% compared to the leading alternative, based on a 3-year deployment study"
Every performance claim MUST include a numeric value with units.
Every comparison MUST include a percentage delta or absolute figure.
If a statistic is not in source material, do NOT invent one — write "benchmark data pending" instead.`,
    recommendedFor: ['B2B', 'technical', 'general'],
    liftEstimate: '+40%',
    combinesWellWith: ['CITE_SOURCES', 'AUTHORITATIVE'],
  },
  {
    id: 'CITE_SOURCES',
    label: '🔗 Cite Sources',
    description: 'Embed verifiable authority citations throughout the content',
    promptDirective: `CITATION DIRECTIVE (GEO §2.2.2):
Embed verifiable authority citations throughout the content.
Cite sources in this priority order:
  1. Official documentation / product brief
  2. Industry standard or certification reference
  3. Authoritative third-party analysis
  4. Public repository / official GitHub
  5. arXiv / academic paper if benchmarking data
Format inline as: [Source: <reference>] immediately after the claim it supports.
Do NOT fabricate citation identifiers — use only sources present in grounding materials.`,
    recommendedFor: ['B2B', 'technical', 'general'],
    liftEstimate: '+40%',
    combinesWellWith: ['STATISTICS_ADDITION', 'QUOTATION_ADDITION'],
  },
  {
    id: 'QUOTATION_ADDITION',
    label: '💬 Quotation Addition',
    description: 'Add direct quotes from authoritative sources',
    promptDirective: `QUOTATION DIRECTIVE (GEO §2.2.2):
Add direct quotations from authoritative voices to increase credibility signals.
Acceptable quotation sources:
  - Official statements from company press releases
  - Certification body evaluator quotes
  - Industry standards body official language
  - Direct spec language from official documentation (exact wording, not paraphrase)
Format: Use blockquote or inline quote with attribution.
Do NOT fabricate quotes. If no real quote is available from source material, skip this directive for that section.`,
    recommendedFor: ['B2B', 'general'],
    liftEstimate: '+35%',
    combinesWellWith: ['CITE_SOURCES'],
  },
  {
    id: 'AUTHORITATIVE',
    label: '🛡️ Authoritative Tone',
    description: 'Rewrite hedged language into direct, confident assertions',
    promptDirective: `AUTHORITATIVE TONE DIRECTIVE (GEO §2.2.2):
Rewrite hedged or passive language into direct, authoritative assertions.
Transformations:
  BAD:  "This solution might be suitable for enterprise deployments"
  GOOD: "This solution is certified for enterprise deployments requiring SOC 2 compliance"
  BAD:  "Users may want to consider the performance impact"
  GOOD: "Benchmarked at 2.5x throughput improvement under standard workloads, the solution meets enterprise SLA requirements without additional infrastructure"
Remove: "might", "could", "may", "some argue", "it is believed"
Replace with: definitive statements backed by evidence from grounding materials.`,
    recommendedFor: ['B2B', 'technical', 'general'],
    liftEstimate: '+28%',
    combinesWellWith: ['STATISTICS_ADDITION', 'TECHNICAL_TERMS'],
  },
  {
    id: 'UNIQUE_WORDS',
    label: '✨ Unique Words',
    description: 'Increase lexical diversity to broaden semantic query coverage',
    promptDirective: `UNIQUE WORDS DIRECTIVE (GEO §2.2.2):
Maximise lexical diversity to broaden the query surface this content matches.
- Avoid repeating the same noun phrase more than twice per paragraph; use domain synonyms
- Use varied technical synonyms and industry terminology
- Include acronym expansions and contractions in alternate paragraphs
- Introduce adjacent vocabulary the target user persona also searches: e.g., if writing about security, include "compliance", "audit trail", "encryption", "access control"
This increases the number of distinct queries the content can rank for without keyword stuffing.`,
    recommendedFor: ['technical', 'general'],
    liftEstimate: '+20%',
    combinesWellWith: ['TECHNICAL_TERMS', 'FLUENCY_OPTIMIZATION'],
  },
  {
    id: 'TECHNICAL_TERMS',
    label: '⚙️ Technical Terms',
    description: 'Increase domain-specific technical terminology density',
    promptDirective: `TECHNICAL TERMS DIRECTIVE (GEO §2.2.2):
Increase semantic density with precise technical terminology.
Use terms that appear in real practitioner queries across your domain:
  - Architecture patterns and design methodologies
  - Industry-specific connectivity and integration standards
  - Security certifications, compliance frameworks, and audit standards
  - Performance metrics, benchmarks, and efficiency ratios
  - Manufacturing and quality standards
Use the precise standard designation (e.g., "SOC 2 Type II" not "security compliance") as AI engines
pattern-match against exact nomenclature used in technical queries.`,
    recommendedFor: ['technical', 'B2B'],
    liftEstimate: '+18%',
    combinesWellWith: ['STATISTICS_ADDITION', 'AUTHORITATIVE'],
  },
  {
    id: 'FLUENCY_OPTIMIZATION',
    label: '🌊 Fluency Optimization',
    description: 'Improve sentence-level fluency and readability',
    promptDirective: `FLUENCY DIRECTIVE (GEO §2.2.2):
Improve sentence-level fluency without changing technical content.
- Break sentences longer than 25 words into two
- Remove redundant subordinate clauses
- Ensure each paragraph has a clear topic sentence
- Use active voice for process descriptions
- Preserve all technical terms and numeric values exactly`,
    recommendedFor: ['ecosystem', 'application', 'general'],
    liftEstimate: '+15%',
    combinesWellWith: ['EASY_TO_UNDERSTAND'],
  },
  {
    id: 'EASY_TO_UNDERSTAND',
    label: '📖 Easy to Understand',
    description: 'Simplify language for cross-functional audiences',
    promptDirective: `SIMPLIFICATION DIRECTIVE (GEO §2.2.2):
Simplify language for non-specialist readers (management, cross-functional stakeholders) without losing precision.
- Add a one-sentence plain-language summary before every technical paragraph
- Replace acronyms with full form on first use
- Add analogy for abstract concepts where helpful
Do NOT simplify numeric values or specification designations themselves.`,
    recommendedFor: ['general', 'executive', 'procurement'],
    liftEstimate: '+10%',
    combinesWellWith: ['FLUENCY_OPTIMIZATION', 'QUOTATION_ADDITION'],
  },
];

// Paper finding: combining more than 3 methods shows diminishing returns
// Recommended combos for common use cases:
export const RECOMMENDED_COMBOS: Record<string, { label: string; ids: GeoMethodId[] }> = {
  technical_deep_dive: {
    label: 'Technical Deep Dive',
    ids: ['STATISTICS_ADDITION', 'CITE_SOURCES', 'AUTHORITATIVE'],
  },
  ecosystem_overview: {
    label: 'Ecosystem / Overview Content',
    ids: ['STATISTICS_ADDITION', 'CITE_SOURCES', 'TECHNICAL_TERMS'],
  },
  decision_maker: {
    label: 'Decision-Maker Content',
    ids: ['STATISTICS_ADDITION', 'AUTHORITATIVE', 'EASY_TO_UNDERSTAND'],
  },
  compliance_focused: {
    label: 'Compliance / Certification',
    ids: ['CITE_SOURCES', 'QUOTATION_ADDITION', 'AUTHORITATIVE'],
  },
};

/**
 * Returns GEO methods with prompt directives sourced from the active config.
 */
export function getGeoMethods(): GeoMethod[] {
  const config = getIndustryConfig();
  return GEO_METHODS.map(m => ({
    ...m,
    promptDirective: config.methodDirectives[m.id] || m.promptDirective,
  }));
}

/**
 * Returns recommended combos from the active config.
 */
export function getRecommendedCombos(): Record<string, { label: string; ids: GeoMethodId[] }> {
  const config = getIndustryConfig();
  const combos = config.recommendedCombos;
  return Object.keys(combos).length > 0 ? combos : RECOMMENDED_COMBOS;
}

// Build the combined prompt directive for selected methods
export function buildMethodDirectives(selectedIds: GeoMethodId[]): string {
  if (!selectedIds || selectedIds.length === 0) return '';

  // Cap at 3 per paper's diminishing returns finding
  const capped = selectedIds.slice(0, 3);
  const methods = capped.map(id => GEO_METHODS.find(m => m.id === id)!).filter(Boolean);
  if (methods.length === 0) return '';

  return `## ⚙️ ACTIVE GEO OPTIMIZATION METHODS (GEO KDD2024 §2.2.2)
The following ${methods.length} method(s) are active. Apply ALL directives simultaneously.
Combined visibility lift estimate: ${estimateCombinedLift(methods)}

${methods.map((m, i) => `### Method ${i + 1}: ${m.label} (est. ${m.liftEstimate} lift)
${m.promptDirective}`).join('\n\n')}`;
}

function estimateCombinedLift(methods: { liftEstimate: string }[]): string {
  // Paper shows subadditive combination effects — approximate with sqrt
  const lifts = methods.map(m => parseInt(m.liftEstimate));
  const combined = lifts.reduce((acc, l) => acc + Math.sqrt(l * 10), 0);
  return `~${Math.round(combined)}%`;
}
