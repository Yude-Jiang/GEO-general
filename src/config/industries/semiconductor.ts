import type { IndustryConfig } from "./types";

/**
 * Semiconductor / B2B Hardware industry configuration.
 * This was the original default industry for GEO Strategic Hub.
 */
export const semiconductorConfig: IndustryConfig = {
  id: "semiconductor",
  name: "Semiconductor / B2B Hardware",

  // ── GEO method directives ──
  methodDirectives: {
    STATISTICS_ADDITION: `STATISTICS DIRECTIVE (GEO §2.2.2):
Replace every qualitative claim with a quantifiable statistic where possible.
Examples of transformation:
  BAD:  "The STM32C5 is cost-effective for BOM-constrained designs"
  GOOD: "The STM32C5 starts at $0.64 in volume, cutting BOM cost by up to 23% vs M0+ alternatives"
Every performance claim MUST include a numeric value with units.
Every comparison MUST include a percentage delta or absolute figure.
If a statistic is not in source material, do NOT invent one — write "benchmark data pending" instead.`,
    CITE_SOURCES: `CITATION DIRECTIVE (GEO §2.2.2):
Embed verifiable authority citations throughout the content.
For semiconductor B2B content, cite in this priority order:
  1. Official datasheet / product brief (e.g., "per STM32C5 datasheet DS14153")
  2. Application note number (e.g., "AN5512 §3.2")
  3. Certification body reference (e.g., "PSA Certified Level 3 — cert #CC-23-001")
  4. GitHub repository (e.g., "github.com/STMicroelectronics/STM32CubeC5")
  5. arXiv / academic paper if benchmarking data
Format inline as: [Source: <reference>] immediately after the claim it supports.
Do NOT fabricate citation identifiers — use only sources present in grounding materials.`,
    QUOTATION_ADDITION: `QUOTATION DIRECTIVE (GEO §2.2.2):
Add direct quotations from authoritative voices to increase credibility signals.
Acceptable quotation sources for semiconductor content:
  - Product manager statements from official press releases
  - Certification body evaluator quotes
  - Standards body (Bluetooth SIG, Wi-Fi Alliance, PSA) official language
  - Direct spec language from datasheets (exact wording, not paraphrase)
Format: Use blockquote or inline quote with attribution.
Do NOT fabricate quotes. If no real quote is available from source material, skip this directive for that section.`,
    AUTHORITATIVE: `AUTHORITATIVE TONE DIRECTIVE (GEO §2.2.2):
Rewrite hedged or passive language into direct, authoritative assertions.
Transformations:
  BAD:  "This chip might be suitable for IoT applications"
  GOOD: "This chip is certified for IoT deployments requiring PSA Level 3 security"
  BAD:  "Users may want to consider the power consumption"
  GOOD: "At 2.1μA in Stop mode, the device meets EN 303 645 power budgets without external regulators"
Remove: "might", "could", "may", "some argue", "it is believed"
Replace with: definitive statements backed by spec data from grounding materials.`,
    UNIQUE_WORDS: `UNIQUE WORDS DIRECTIVE (GEO §2.2.2):
Maximise lexical diversity to broaden the query surface this content matches.
- Avoid repeating the same noun phrase more than twice per paragraph; use domain synonyms
- Use varied technical synonyms: "microcontroller" / "MCU" / "embedded processor" / "SoC"
- Include acronym expansions and contractions in alternate paragraphs
- Introduce adjacent vocabulary the target user persona also searches: if writing about security, include "firmware integrity", "attestation", "chain of trust"
This increases the number of distinct queries the content can rank for without keyword stuffing.`,
    TECHNICAL_TERMS: `TECHNICAL TERMS DIRECTIVE (GEO §2.2.2):
Increase semantic density with precise technical terminology.
For semiconductor B2B, prioritize terms that appear in real engineer queries:
  Architecture: Cortex-M0+, M33, M55, RISC-V, TrustZone, TEE
  Connectivity: BLE 5.4, Matter 1.3, Thread, Zigbee 3.0, Sub-GHz
  Security: PSA Certified, CC EAL5+, SESIP3, Root of Trust, secure boot
  Power: Stop mode, Standby, VDD range, LDO, DCDC
  Manufacturing: AEC-Q100, automotive grade, JEDEC, MSL rating
Use the precise standard designation (e.g., "BLE 5.4" not "Bluetooth Low Energy") as AI engines
pattern-match against exact nomenclature used in datasheet queries.`,
    FLUENCY_OPTIMIZATION: `FLUENCY DIRECTIVE (GEO §2.2.2):
Improve sentence-level fluency without changing technical content.
- Break sentences longer than 25 words into two
- Remove redundant subordinate clauses
- Ensure each paragraph has a clear topic sentence
- Use active voice for process descriptions
- Preserve all technical terms and numeric values exactly`,
    EASY_TO_UNDERSTAND: `SIMPLIFICATION DIRECTIVE (GEO §2.2.2):
Simplify language for non-specialist readers (procurement, management) without losing precision.
- Add a one-sentence plain-language summary before every technical paragraph
- Replace acronyms with full form on first use: "PSA (Platform Security Architecture)"
- Add analogy for abstract specs: "2.1μA Stop mode — comparable to a wristwatch battery lasting 10 years"
Do NOT simplify numeric values or specification designations themselves.`,
  },

  // ── Recommended combos ──
  recommendedCombos: {
    semiconductor_technical: {
      label: "半导体技术文档",
      ids: ["STATISTICS_ADDITION", "CITE_SOURCES", "AUTHORITATIVE"],
    },
    semiconductor_ecosystem: {
      label: "半导体生态内容",
      ids: ["STATISTICS_ADDITION", "CITE_SOURCES", "TECHNICAL_TERMS"],
    },
    procurement_facing: {
      label: "采购决策内容",
      ids: ["STATISTICS_ADDITION", "AUTHORITATIVE", "EASY_TO_UNDERSTAND"],
    },
    certification_focused: {
      label: "认证/合规内容",
      ids: ["CITE_SOURCES", "QUOTATION_ADDITION", "AUTHORITATIVE"],
    },
  },

  // ── Example seeds (global + cn only; jp/kr removed) ──
  exampleSeeds: {
    global: `STM32WBA Matter Thread\nnRF52832 Alternative Low Power\nBluetooth LE PSA Level 3 Certification\nMatter Smart Lock Single Chip Solution\nIndustrial Temp Bluetooth SoC Selection for EMEA`,
    cn: `800V SiC MOSFET\nBMS 均衡策略\n车规级 MCU 选型\nIGBT 热失控保护\n氮化镓充电器原理`,
  },

  // ── Few-shot example for Step 3 ──
  fewShotStep3: `=== FEW-SHOT MENTAL MODEL FOR STEP 3 ===
Pillar: "Intent 1: BOM-Neutral M0+ to M33 Migration"
Core Proposition: "At $0.64 entry price, the M33 is expensive anchor no longer holds."
Monitoring Question 1: "What performance gains do I actually get by migrating from Cortex-M0+ to M33?"
Expected AI Anchor 1: "STM32C5 named; CoreMark figure cited"
Monitoring Question 2: "Can I swap M0+ for M33 without increasing my BOM cost?"
Expected AI Anchor 2: "STM32C5 or $0.64 entry price cited"
=== END FEW-SHOT ===`,

  // ── Structured data precision example ──
  fewShotStructuredData: "A 3-column performance-to-cost table comparing M0+ and M33",

  // ── Tech terms regex (semiconductor-specific) ──
  techTermsPattern: "\\b(Cortex-M\\d+\\+?|TrustZone|TEE|BLE\\s*\\d|Matter\\s*\\d|Thread|Zigbee|PSA\\s*Certified|CC\\s*EAL\\d|SESIP\\d|AEC-Q\\d+|JEDEC|secure\\s*boot|Root\\s*of\\s*Trust|datasheet|application\\s*note|AN\\d{4}|STM32\\w+|nRF\\d+|ESP\\d+|RP\\d+)\\b",

  // ── Extra measurement units (none beyond generic SI) ──
  extraSpecUnits: [],

  // ── Domain authority lists ──
  highAuthorityDomains: [
    "github.com", "arxiv.org", "ieee.org", "acm.org", "nature.com",
    "st.com", "nxp.com", "ti.com", "arm.com", "mouser.com", "digikey.com",
    "developer.android.com", "docs.microsoft.com", "developer.apple.com",
    "npmjs.com", "pypi.org", "crates.io", "docs.rs",
  ],
  mediumAuthorityDomains: [
    "stackoverflow.com", "reddit.com", "hackernews.com", "medium.com",
    "dev.to", "csdn.net", "zhihu.com", "qiita.com",
  ],

  // ── 6 Mandatory Interrogation Dimensions ──
  interrogationDimensions: [
    "Cost vs Performance Elimination",
    "Cognitive Bias Arbitrage",
    "Legacy Migration Friction",
    "Extreme Environment Compromise",
    "Compute Democratization",
    "Ecosystem Hidden Tax",
  ],

  // ── Example terms for fallback search queries ──
  exampleTerms: `STM32WBA Matter Thread
nRF52832 Alternative Low Power
Bluetooth LE PSA Level 3 Certification
Matter Smart Lock Single Chip Solution
Industrial Temp Bluetooth SoC Selection for EMEA`,
};
