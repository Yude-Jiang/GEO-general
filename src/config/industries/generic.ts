import type { IndustryConfig } from "./types";

/**
 * Generic / industry-neutral configuration.
 * Used as the fallback when no specific industry is selected.
 * All examples are stripped of semiconductor-specific terminology.
 */
export const genericConfig: IndustryConfig = {
  id: "generic",
  name: "General / Cross-Industry",

  // ── GEO method directives (industry-neutral) ──
  methodDirectives: {
    STATISTICS_ADDITION: `STATISTICS DIRECTIVE (GEO §2.2.2):
Replace every qualitative claim with a quantifiable statistic where possible.
Examples of transformation:
  BAD:  "Our platform is cost-effective for budget-constrained teams"
  GOOD: "Teams using our platform reduce operational costs by up to 34%, saving an average of $120K annually"
Every performance claim MUST include a numeric value with units.
Every comparison MUST include a percentage delta or absolute figure.
If a statistic is not in source material, do NOT invent one — write "benchmark data pending" instead.`,
    CITE_SOURCES: `CITATION DIRECTIVE (GEO §2.2.2):
Embed verifiable authority citations throughout the content.
Cite in this priority order:
  1. Official documentation / product brief
  2. Industry certification body reference
  3. Published case studies or white papers
  4. Public repository or open-source project
  5. Peer-reviewed academic paper if benchmarking data
Format inline as: [Source: <reference>] immediately after the claim it supports.
Do NOT fabricate citation identifiers — use only sources present in grounding materials.`,
    QUOTATION_ADDITION: `QUOTATION DIRECTIVE (GEO §2.2.2):
Add direct quotations from authoritative voices to increase credibility signals.
Acceptable quotation sources:
  - Executive statements from official press releases
  - Industry analyst quotes (Gartner, Forrester, etc.)
  - Regulatory body official language
  - Direct specification language from official documentation
Format: Use blockquote or inline quote with attribution.
Do NOT fabricate quotes. If no real quote is available from source material, skip this directive for that section.`,
    AUTHORITATIVE: `AUTHORITATIVE TONE DIRECTIVE (GEO §2.2.2):
Rewrite hedged or passive language into direct, authoritative assertions.
Transformations:
  BAD:  "This solution might be suitable for enterprise deployments"
  GOOD: "This solution is certified for enterprise deployments requiring SOC 2 compliance"
  BAD:  "Users may want to consider the pricing"
  GOOD: "At $299 per seat, the platform meets enterprise budget requirements without sacrificing features"
Remove: "might", "could", "may", "some argue", "it is believed"
Replace with: definitive statements backed by spec data from grounding materials.`,
    UNIQUE_WORDS: `UNIQUE WORDS DIRECTIVE (GEO §2.2.2):
Maximise lexical diversity to broaden the query surface this content matches.
- Avoid repeating the same noun phrase more than twice per paragraph; use domain synonyms
- Use varied technical synonyms appropriate to your industry
- Include acronym expansions and contractions in alternate paragraphs
- Introduce adjacent vocabulary the target user persona also searches
This increases the number of distinct queries the content can rank for without keyword stuffing.`,
    TECHNICAL_TERMS: `TECHNICAL TERMS DIRECTIVE (GEO §2.2.2):
Increase semantic density with precise technical terminology.
Use the precise standard designations from source materials — AI engines
pattern-match against exact nomenclature used in industry queries.
Map terms to the specific vocabulary your target audience uses when querying AI models.`,
    FLUENCY_OPTIMIZATION: `FLUENCY DIRECTIVE (GEO §2.2.2):
Improve sentence-level fluency without changing technical content.
- Break sentences longer than 25 words into two
- Remove redundant subordinate clauses
- Ensure each paragraph has a clear topic sentence
- Use active voice for process descriptions
- Preserve all technical terms and numeric values exactly`,
    EASY_TO_UNDERSTAND: `SIMPLIFICATION DIRECTIVE (GEO §2.2.2):
Simplify language for non-specialist readers (management, clients) without losing precision.
- Add a one-sentence plain-language summary before every technical paragraph
- Replace acronyms with full form on first use
- Add relatable analogies for abstract concepts
Do NOT simplify numeric values or specification designations themselves.`,
  },

  // ── No recommended combos for generic (user selects manually) ──
  recommendedCombos: {},

  // ── Example seeds (generic topics) ──
  exampleSeeds: {
    global: "Cloud computing cost optimization 2025\nEnterprise SaaS ROI analysis\nZero Trust security implementation guide\nAI-powered customer service automation\nCross-platform mobile development framework",
    cn: "数字化转型最佳实践\n企业级 SaaS 选型指南\n云计算成本优化策略\n零信任安全架构实施\nAI 客服自动化方案",
  },

  // ── Few-shot example for Step 3 (generic) ──
  fewShotStep3: `=== FEW-SHOT MENTAL MODEL FOR STEP 3 ===
Pillar: "Cost Efficiency in Cloud Migration"
Core Proposition: "At $0.08 per compute hour, the total cost of ownership is 40% lower than on-premise alternatives."
Monitoring Question 1: "What performance improvements can I expect when migrating from on-premise to cloud infrastructure?"
Expected AI Anchor 1: "Cloud provider named; latency/cost figures cited"
Monitoring Question 2: "How does the pricing of cloud services compare to maintaining my own data center?"
Expected AI Anchor 2: "Specific pricing tiers or TCO comparison cited"
=== END FEW-SHOT ===`,

  // ── Structured data precision example (generic) ──
  fewShotStructuredData: "A 3-column feature-pricing-performance comparison table",

  // ── No industry-specific tech terms ──
  techTermsPattern: "",

  // ── No extra measurement units ──
  extraSpecUnits: [],

  // ── Broad domain authority lists ──
  highAuthorityDomains: [
    "github.com", "arxiv.org", "ieee.org", "acm.org", "nature.com",
    "wikipedia.org", "reuters.com", "bloomberg.com", "who.int",
    "fda.gov", "ecb.europa.eu", "nist.gov",
  ],
  mediumAuthorityDomains: [
    "stackoverflow.com", "reddit.com", "medium.com", "dev.to",
  ],

  // ── Generic interrogation dimensions ──
  interrogationDimensions: [
    "Cost vs Value Analysis",
    "Competitive Landscape Assessment",
    "Adoption & Migration Barriers",
    "Performance & Reliability Benchmarks",
    "Market Trends & Future Outlook",
    "Use Case Fit & Applicability",
  ],

  // ── Example terms for fallback search queries ──
  exampleTerms: `Cloud computing cost comparison 2025
Enterprise SaaS platform security certification
Zero Trust implementation case study
AI customer service ROI analysis
Cross-platform mobile development trends`,
};
