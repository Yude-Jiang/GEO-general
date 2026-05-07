/**
 * GEO Service Barrel
 *
 * Re-exports all GEO services for backward compatibility.
 * New code should import directly from the specialized service files:
 *
 *   - ./geminiClient        — Singleton GoogleGenAI client
 *   - ./retryUtils          — 429 retry logic
 *   - ./analysisService     — analyzeContent, refineStrategy
 *   - ./contentService      — generateContentStream, optimizeContentForGeoStream, generateJsonLdSchema
 *   - ./chatService         — chatWithAssistant
 *   - ./formattingService   — humanizeContent, translateContent
 *   - ./evidenceService     — deepEvidenceGrounding, verifyAnchors, verifyModelClaims
 *   - ./reportService       — generateWorkflowReportStream
 *   - ./fetchUtils          — fetchUrlContent
 */

// Retry utilities
export { parseRetrySeconds, withRetry } from './retryUtils';

// Analysis (Step 1)
export { analyzeContent, refineStrategy } from './analysisService';

// Content generation (Step 3 + Standalone Mode)
export { generateContentStream, optimizeContentForGeoStream, generateJsonLdSchema } from './contentService';

// Chat assistant
export { chatWithAssistant } from './chatService';

// Text formatting (humanize, translate)
export { humanizeContent, translateContent } from './formattingService';

// Evidence & verification
export { deepEvidenceGrounding, verifyAnchors, verifyModelClaims } from './evidenceService';

// URL fetching
export { fetchUrlContent } from './fetchUtils';

// Report generation
export { generateWorkflowReportStream } from './reportService';
export type { WorkflowReportParams } from './reportService';
