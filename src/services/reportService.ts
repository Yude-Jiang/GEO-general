/**
 * Workflow Report Service
 *
 * Generates comprehensive GEO strategic reports from diagnosis → strategy → content.
 * Uses DeepSeek for report generation.
 */

import { callDeepSeekStream } from "./deepseekClient";

export interface WorkflowReportParams {
  diagnosisResult?: any;
  selectedPlaybooks?: any[];
  selectedMonitoringQuestions?: any[];
  generatedContent: string;
  geoAnalysis: string;
  geoSignalsBefore?: import('./structuralParser').GeoSignals | null;
  geoSignalsAfter?: import('./structuralParser').GeoSignals | null;
  ecosystem?: string;
  customRegion?: string;
  uiLang: string;
  sourceSummary?: string;
  selectedMethodLabels?: string[];
}

// ─── Report Prompt Builder ───────────────────────────────────────────────────

function buildReportPrompt(p: WorkflowReportParams): string {
  const date = new Date().toISOString().slice(0, 10);
  const titleMatch = p.generatedContent.match(/^#\s+(.+)/m)
    || p.generatedContent.match(/^##\s+(.+)/m);
  const topic = titleMatch ? titleMatch[1].replace(/[*_`]/g, '') : 'GEO Content';

  let dataSection = '';

  if (p.diagnosisResult) {
    const es = p.diagnosisResult.strategyReport?.executiveSummary || {};
    const clusters = (p.diagnosisResult.intentClusters || []).slice(0, 5);
    const competitors = (p.diagnosisResult.competitorAnalysis || []).slice(0, 3);
    dataSection += `
=== SECTION: DIAGNOSIS ===
Market Pulse: ${es.marketPulse?.slice(0, 600) || 'N/A'}
Core Roadblocks: ${es.coreRoadblocks?.slice(0, 400) || 'N/A'}
Key Insight: ${es.keyInsight?.slice(0, 300) || 'N/A'}
Strategic Pivot: ${es.strategicPivot?.slice(0, 300) || 'N/A'}
Intent Clusters: ${clusters.map((c: any) => c.intentName).join(' | ')}
Competitors: ${competitors.map((c: any) => `${c.competitorName} [${c.threatLevel}] — ${c.strategicOpening?.slice(0, 120)}`).join('\n')}
`;
  }

  if (p.selectedPlaybooks && p.selectedPlaybooks.length > 0) {
    dataSection += `
=== SECTION: STRATEGY PLAYBOOKS (${p.selectedPlaybooks.length}) ===
${p.selectedPlaybooks.map((pb: any, i: number) =>
    `${i + 1}. [${pb.tacticsType}] ${pb.geoAction}\n   Target Snippet: ${pb.targetSnippet?.slice(0, 200) || ''}`
  ).join('\n')}
`;
  }

  if (p.sourceSummary) {
    dataSection += `\n=== SECTION: SOURCE CONTENT ===\n${p.sourceSummary}\n`;
  }

  if (p.selectedMethodLabels && p.selectedMethodLabels.length > 0) {
    dataSection += `\n=== SECTION: GEO METHODS APPLIED ===\n${p.selectedMethodLabels.join(', ')}\n`;
  }

  if (p.geoSignalsBefore && p.geoSignalsAfter) {
    const b = p.geoSignalsBefore;
    const a = p.geoSignalsAfter;
    const d = (key: keyof typeof b) => {
      const delta = (a[key] as number) - (b[key] as number);
      return `${b[key]} → ${a[key]} (${delta > 0 ? '+' : ''}${delta})`;
    };
    dataSection += `
=== SECTION: GEO SIGNAL IMPROVEMENT ===
Quantified Claims: ${d('quantifiedClaims')}
Tech Terms: ${d('techTerms')}
Citable Chunks: ${d('citableChunks')}
Hedge Words: ${d('hedgeWords')}
Word Count: ${d('wordCount')}
BLUF Compliance After: ${a.blufCompliance ? 'YES' : 'NO'}
`;
  }

  if (p.geoAnalysis) {
    dataSection += `\n=== SECTION: GEO AUDIT ===\n${p.geoAnalysis.slice(0, 1500)}\n`;
  }

  dataSection += `\n=== SECTION: GENERATED CONTENT (excerpt, first 2500 chars) ===\n${p.generatedContent.slice(0, 2500)}\n`;

  const hasFullWorkflow = !!p.diagnosisResult;
  const structureNote = hasFullWorkflow
    ? `1. **Executive Overview** (3-4 paragraphs: strategic context, AI perception challenges, what was achieved)
2. **Diagnosis Findings** (AI cognitive gaps, competitor threats, critical intent clusters — be specific, cite data)
3. **Strategy Deployed** (playbooks chosen, tactical logic, why these GEO methods)
4. **Content Production Results** (what was produced; include the GEO signal comparison as a Markdown table)
5. **Next Recommended Actions** (5-7 concrete, prioritized steps — name specific platforms, content types, and tactics)`
    : `1. **Optimization Summary** (what was optimized and why it matters)
2. **GEO Methods Applied** (explain each method used and its expected impact)
3. **Signal Improvement Results** (include the GEO signal comparison as a Markdown table)
4. **Content Quality Assessment** (what changed structurally and linguistically)
5. **Next Recommended Actions** (5-7 concrete steps to further amplify AI citation probability)`;

  return `ROLE: Senior GEO Strategy Consultant & Professional Report Writer.
TASK: Generate a comprehensive, professional GEO Strategic Report from the data below.

OUTPUT LANGUAGE: [${p.uiLang}] — Write the ENTIRE report fluently in this language. Do NOT mix languages.
TARGET ECOSYSTEM: ${p.ecosystem || 'Global'} | REGION: ${p.customRegion || 'Global'}

MANDATORY REPORT STRUCTURE:
# GEO ${hasFullWorkflow ? 'Strategic' : 'Optimization'} Report: ${topic}
**Date**: ${date} | **Ecosystem**: ${p.ecosystem || 'Global'}${p.customRegion ? ` | **Region**: ${p.customRegion}` : ''}

${structureNote}

---
*${date} © 2026 GEO Strategic Hub*

CRITICAL: Generate the full professional report. Be specific and data-driven. Reference actual numbers from the data. No generic platitudes.

WORKFLOW DATA:
${dataSection}`;
}

// ─── Report Generator ─────────────────────────────────────────────────────────

/**
 * Generates a streaming GEO Workflow Report.
 * Synthesizes diagnosis → strategy → content into a professional Markdown report.
 */
export const generateWorkflowReportStream = async (params: WorkflowReportParams) => {
  const prompt = buildReportPrompt(params);
  return callDeepSeekStream(prompt, { temperature: 0.3, maxTokens: 8192 });
};
