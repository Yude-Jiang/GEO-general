import type { GeoMethodId } from "../../services/geoMethods";

/**
 * IndustryConfig defines all industry-specific content used throughout
 * the GEO application. Every semiconductor-specific string, example,
 * regex pattern, and domain list is extracted here.
 *
 * Built-in configs: semiconductor, generic.
 * To add a new industry, create a new file and register it in index.ts.
 */
export interface IndustryConfig {
  id: string;
  name: string;

  // ── GEO method prompt templates (per method ID → directive text) ──
  methodDirectives: Record<GeoMethodId, string>;

  // ── Recommended GEO method combinations ──
  recommendedCombos: Record<string, { label: string; ids: GeoMethodId[] }>;

  // ── Example seeds per ecosystem (for Step 1 textarea placeholder) ──
  exampleSeeds: Record<string, string>;

  // ── Few-shot examples for analysis prompts ──
  fewShotStep3: string;
  fewShotStructuredData: string;

  // ── Structural parser: tech term regex pattern (string form) ──
  techTermsPattern: string;

  // ── Additional measurement unit patterns beyond generic SI units ──
  extraSpecUnits: string[];

  // ── Domain authority lists ──
  highAuthorityDomains: string[];
  mediumAuthorityDomains: string[];

  // ── Analysis interrogation dimensions (used in getSystemInstruction) ──
  interrogationDimensions: string[];

  // ── Example terms for model fallback search queries ──
  exampleTerms: string;
}
