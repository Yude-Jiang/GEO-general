import { genericConfig } from "./generic";
import type { IndustryConfig } from "./types";

/**
 * Returns the generic (cross-industry) configuration.
 */
export function getIndustryConfig(_industryId?: string): IndustryConfig {
  return genericConfig;
}
