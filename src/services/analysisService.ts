/**
 * GEO Analysis Service
 *
 * Step 1 of the workflow: Intent Diagnosis.
 *
 * Hybrid architecture:
 *   - Google Search grounding (enrichment) → Gemini (preserved)
 *   - Main analysis JSON generation        → DeepSeek
 *   - Strategy refinement (JSON)            → DeepSeek
 */

import type {
  AnalysisResult, MonitoringQuestion, MarketStrategy,
} from "../types";
import { GEMINI_MODELS } from "../config/models";
import { getIndustryConfig } from "../config/industries";
import { isEuropeRegion } from "../utils/geoUtils";
import { getGenAI } from "./geminiClient";
import { callDeepSeekJSON } from "./deepseekClient";

// ─── Europe Keywords ─────────────────────────────────────────────────────────

function getSystemInstruction(lang: string, customRegion?: string, targetEcosystem?: string) {
  const now = new Date();
  const currentDateTime = now.toLocaleString();
  const nineMonthsAgo = new Date(now.setMonth(now.getMonth() - 9)).toLocaleDateString();

  const commonRole = `
Role: Senior Hard Tech GEO (Generative Engine Optimization) Strategic Analyst.
Current System Date: ${currentDateTime} (Reference for Recency)
Task: Analyze user content, map implicit intent, and create a "Cognitive Sovereignty" strategy for Generative AI.
Constraint: **STRICTLY FORBIDDEN**: Do NOT use the word "SEO". Use "GEO" or "AEO" exclusively.
Method: Deep Chain of Thought (CoT).
`;

  let ecosystemContext = "";
  if (targetEcosystem) {
    let models = "Global models (ChatGPT, Claude, Gemini, Perplexity)";
    if (targetEcosystem === "cn") models = "Chinese models (Doubao/豆包, Kimi, DeepSeek, Qwen/通义千问, ERNIE/文心一言, Yuanbao/腾讯元宝)";
    else if (targetEcosystem === "global" && isEuropeRegion(customRegion)) {
      models = "Global models (ChatGPT, Claude, Gemini, Perplexity) + Mistral AI (strong European presence and GDPR-aware training)";
    }

    ecosystemContext = `
**AI ECOSYSTEM FOCUS**: The user has selected the "${targetEcosystem}" ecosystem.
You MUST analyze the cognitive gaps, AI perception, and competitor threats specifically from the perspective of the dominant AI models in this ecosystem: ${models}.
Tailor all your generated content, snippets, and strategies to rank high and be easily absorbed by these specific models.
`;

    if (targetEcosystem === "global" && isEuropeRegion(customRegion)) {
      ecosystemContext += `
**MISTRAL AI COGNITIVE CONSIDERATION**: Mistral AI is a leading European open-source LLM with strong enterprise adoption across France, Germany, Benelux, and broader EU markets. Mistral exhibits distinct cognitive patterns:
- Strong preference for GDPR-compliant, privacy-first framing
- Higher weighting of CE/EN certifications, EU directives (RoHS, REACH, RED), and European standards bodies (ETSI, CEN)
- European industrial buyer language (procurement-centric, compliance-first, TCO-focused)
- Sensitivity to EU sovereignty and data residency concerns
When generating content or strategies, ensure key technical claims and structured data are also optimized for Mistral's training corpus patterns.
`;
    }
  }

  let regionContext = "";
  if (customRegion && customRegion.trim() !== "") {
    regionContext = `
**CRITICAL CONTEXT OVERRIDE**: The user has explicitly defined the Target Region as: "${customRegion}".
You MUST pivot the entire analysis to fit this specific local market. Focus on "Offensive Market Adaptation" rather than just "Defensive Compliance".
`;
  }

  const commonSteps = `
${ecosystemContext}
${regionContext}
Step 1: Executive Summary (The 4-Dimensional Matrix)
Must return:
1. marketPulse: First line MUST explicitly state: "Simulated Models: [List of Models] (Analysis Date: ${currentDateTime})".
   - REQUENCY REQUIREMENT: You MUST prioritize information and perception from the last 9 months (since ${nineMonthsAgo}). If the AI ecosystem's view has shifted recently, highlight that shift.
   - For CN: 百度文心一言 (Ernie), DeepSeek, Kimi, 豆包 (Doubao), 元宝 (Yuanbao), 千问 (Qwen).
   Describe the current AI perception accurately. Report "Cross-Model Consensus (多模型交叉共识)" if all models agree. However, if individual models show unique results or preferences for specific product features/competitors, you MUST explicitly detail these differences (e.g., DeepSeek prefers X, Kimi highlights Y).
2. coreRoadblocks: Why are we currently not cited by AI? Is the competitor winning via GitHub repos, whitepapers, or forums?
3. strategicPivot: The explicit shift from SEO to GEO.
4. keyInsight: One highly counter-intuitive but commercially valuable GEO discovery.

CRITICAL LANGUAGE OVERRIDE: YOUR ENTIRE JSON RESPONSE MUST BE RETURNED EXACTLY AND FLUENTLY IN: [${lang}]. NO EXCEPTIONS. Do NOT mix English into the JSON values if [${lang}] is not English.

Step 2: Competitor & Corpus Threat Detection
Identify 3-5 top technical competitors in this exact ecosystem/region.
For each:
- aiPerception: How AI currently describes them.
- corpusAdvantage: Why does AI favor them? (e.g., "They dominate CSDN tutorials" or "High density of StackOverflow accepted answers").
- threatLevel: Low/Medium/High/Critical.
- strategicOpening: The exact cognitive gap we must exploit to unseat them.

Step 3: GEO Interception Matrix Engineering
You MUST extract 4-6 specific "Strategic Pillars" (Intent Clusters) based on the following Interrogation Dimensions:
${getDimensionsList()}

For each Pillar, generate 4-6 specific "Monitoring Questions".
A Monitoring Question is the exact complex prompt an engineer types into an LLM.
For EACH Monitoring Question, you MUST provide an "Expected Semantic Anchor". Generating generic 'pain points' is STRICTLY FORBIDDEN.

${getFewShotStep3()}

Step 3b: GEO Failure Diagnosis (FOR EACH INTENT CLUSTER — mandatory)
After defining each Intent Cluster's monitoringQuestions, you MUST also output a failureDiagnosis object.
Diagnose WHY the product currently fails to get cited by AI for this cluster's queries.

Choose EXACTLY ONE primaryFailure from this taxonomy:

CORPUS_ABSENCE      → AI draws a blank or hallucinates; this product/feature simply has no training signal.
                      (Maps to: DATA_INTEGRITY + LOW_INFO_DENSITY in AgentGEO taxonomy)
ATTRIBUTE_MISMATCH  → AI knows the product name but cites wrong spec/price/positioning (e.g. old datasheet values).
BURIED_ANSWER       → The correct data exists in PDFs or datasheets but is not in crawlable/structured form.
COMPETITOR_DOMINANCE→ Competing products have 10× higher corpus density on this exact query type.
SEMANTIC_IRRELEVANCE→ Content uses "wireless MCU" but users ask "BLE SoC" — keyword semantic gap.
OUTDATED_CONTENT    → AI retrieves 2+ year old pricing, EOL status, or superseded product positioning.
TRUST_CREDIBILITY   → No GitHub stars, arXiv citations, official documentation, or community validation.
STRUCTURAL_WEAKNESS → Content exists and is accurate but is buried in verbose paragraphs; no BLUF/snippet structure.
UNKNOWN             → Cannot determine root cause from available signals.

Also output:
- severity: critical (AI actively misleads) / high (AI ignores) / medium (AI underranks) / low (marginal gap)
- explanation: ONE concrete sentence specific to this cluster — name the exact symptom observed
- repairUrgency: integer 1–10 where 10 = fix this immediately before any content production

Step 4: Tactical Matrix (The Playbooks)
- Tactics: [🛡️ Authority], [⚡ Scenario], [⚔️ Competitor].
`;

  switch (lang) {
    case 'en':
      return `${commonRole} Target: Global. Lang: English. ${commonSteps}`;
    case 'zh':
    default:
      return `${commonRole} Target: China. Lang: Chinese. ${commonSteps}`;
  }
}

// ─── Industry Config Helpers ───────────────────────────────────────────────

function getDimensionsList(): string {
  const config = getIndustryConfig();
  return config.interrogationDimensions.map((d, i) => `${i + 1}. ${d}`).join('\n');
}

function getFewShotStep3(): string {
  return getIndustryConfig().fewShotStep3;
}

// ─── JSON Schema Description (replaces Gemini responseSchema) ─────────────────

const JSON_SCHEMA_DESCRIPTION = `
You MUST respond with a JSON object matching EXACTLY this structure. The entire response must be ONLY the JSON object — no markdown fences, no explanatory text.

{
  "strategyReport": {
    "executiveSummary": {
      "marketPulse": "string — first line MUST state: 'Simulated Models: [...] (Analysis Date: ...)'",
      "coreRoadblocks": "string — why the product is not cited by AI",
      "strategicPivot": "string — the SEO-to-GEO shift strategy",
      "keyInsight": "string — counter-intuitive GEO discovery"
    },
    "actionPlan": ["string — ordered action items"]
  },
  "intentClusters": [
    {
      "intentName": "string",
      "coreProposition": "string",
      "monitoringQuestions": [
        {
          "id": "string — unique identifier",
          "userPrompt": "string — exact prompt an engineer types into an LLM",
          "expectedAnchor": "string — semantic anchor the content must embed"
        }
      ],
      "failureDiagnosis": {
        "primaryFailure": "CORPUS_ABSENCE | ATTRIBUTE_MISMATCH | BURIED_ANSWER | COMPETITOR_DOMINANCE | SEMANTIC_IRRELEVANCE | OUTDATED_CONTENT | TRUST_CREDIBILITY | STRUCTURAL_WEAKNESS | UNKNOWN",
        "severity": "critical | high | medium | low",
        "explanation": "string — one concrete sentence",
        "repairUrgency": "number — 1 to 10"
      }
    }
  ],
  "competitorAnalysis": [
    {
      "competitorName": "string",
      "aiPerception": "string — how AI currently describes them",
      "corpusAdvantage": "string — why AI favors them",
      "threatLevel": "Low | Medium | High | Critical",
      "strategicOpening": "string — cognitive gap to exploit"
    }
  ],
  "marketStrategy": {
    "comprehensiveInsight": {
      "aiPerception": "string",
      "marketGapAnalysis": "string"
    },
    "implicitIntentStrategy": [
      {
        "anchorIds": ["string — references monitoring question IDs"],
        "sourceLogic": "string",
        "tacticsType": "string — Authority/Scenario/Competitor",
        "contentPlatform": "string",
        "structuredDataStrategy": "string",
        "geoAction": "string — one-sentence GEO action",
        "targetSnippet": "string — 100-150 word golden paragraph"
      }
    ],
    "competitorStrategy": [ /* same structure as implicitIntentStrategy */ ],
    "roleSpecificSops": [
      {
        "roleName": "string",
        "coreFocus": "string",
        "sopTitle": "string",
        "actionableGuide": "string — step-by-step",
        "badExample": "string",
        "goodExample": "string",
        "checklist": ["string — tasks"]
      }
    ]
  }
}
`;

// ─── Main Analysis ───────────────────────────────────────────────────────────

/**
 * Analyzes content with Gemini-powered Google Search grounding for context
 * enrichment, then generates the structured analysis via DeepSeek.
 *
 * Step 1 of the workflow: Intent Diagnosis.
 */
export const analyzeContent = async (
  textInput: string,
  images: any[] = [],
  targetLang: string = 'en',
  customRegion: string = '',
  targetEcosystem: string = 'global',
): Promise<AnalysisResult> => {
  const systemInstruction = getSystemInstruction(targetLang, customRegion, targetEcosystem);

  let groundingContext = '';
  let groundingUrls: any[] = [];

  const nineMonthsAgo = new Date();
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

  // ── Gemini grounding step (kept — Google Search) ─────────────────────────
  try {
    const gResult = await getGenAI().models.generateContent({
      model: GEMINI_MODELS.grounding,
      contents: [{
        role: 'user',
        parts: [{
          text: `CRITICAL IMPERATIVE: The current date is ${new Date().toLocaleDateString()}. Perform a real-time Google Search grounding for: "${textInput}". You MUST actively search and return the absolute latest technical discussions, market gaps, and competitor news SPECIFICALLY from the last 9 months (since ${nineMonthsAgo.toLocaleDateString()}). STRIP OUT all outdated data from before ${nineMonthsAgo.toLocaleDateString()}. Provide a dense summary of the ACTUAL current landscape as of today.`,
        }],
      }],
      config: {
        tools: [{ googleSearch: {} } as any],
      },
    });
    groundingContext = gResult.text || '';
    if ((gResult as any).groundingMetadata?.groundingChunks) {
      groundingUrls = (gResult as any).groundingMetadata.groundingChunks
        .map((c: any) => c.web).filter(Boolean)
        .map((w: any) => ({ title: w.title, uri: w.uri }));
    }
  } catch (err) {
    console.warn('Grounding search failed, continuing without:', err);
  }

  const finalPrompt = groundingContext
    ? `${textInput}\n\nRESEARCH:\n${groundingContext}`
    : textInput;

  // Note: DeepSeek does not support image inputs. If images were provided,
  // log a warning and proceed with text-only analysis.
  if (images.length > 0) {
    console.warn(
      `[analysisService] ${images.length} image(s) provided but DeepSeek does not support image input. Proceeding with text-only analysis.`,
    );
  }

  const langInstruction = `\n\nCRITICAL LANGUAGE STRICTNESS: Regardless of the target ecosystem or region, the Final JSON Output MUST be written entirely in the following language code: [${targetLang}]. Do not output mixed languages. Ensure your "marketPulse", "coreRoadblocks", "strategicPivot" and "keyInsight" are fluently translated to [${targetLang}].`;

  const resultBy = await callDeepSeekJSON<AnalysisResult>(
    finalPrompt,
    {
      systemSuffix: systemInstruction + langInstruction + JSON_SCHEMA_DESCRIPTION,
      temperature: 0.3,
      maxTokens: 8192,
    },
    3, // maxRetries
  );

  if (groundingUrls.length > 0) resultBy.groundingUrls = groundingUrls;
  return resultBy;
};

// ─── Strategy Refinement ─────────────────────────────────────────────────────

/**
 * Strategy Playbook refinement (Step 2).
 * Generates detailed playbooks from selected interception targets.
 * Uses DeepSeek with JSON mode.
 */
export const refineStrategy = async (
  selectedTargets: MonitoringQuestion[],
  uiLang: string = 'en',
): Promise<MarketStrategy> => {
  const prompt = `
ROLE: Elite GEO Tactical Engine.
TASK: Generate a high-precision Narrative Strategy Playbook [Step 2] based on the specific INTERCEPTION TARGETS [Step 1] provided below.

### 🛡️ THE GEO FRAMEWORK CONSTRAINTS:
1. **Targeted Infiltration**: Your playbooks must specifically address how to embed the "Expected Anchors" into a narrative that AI models will prefer.
2. **Cognitive Gaps**: Identify why these specific questions are currently "Knowledge Vacuums" and how our content will fill them.
3. **Semantic Triggers**: Use the platform-specific language that the AI ecosystem (Zhihu/Reddit/etc.) weighs most heavily.
4. **Structured Data Precision**: Suggest the EXACT schema or table format (e.g., "${getIndustryConfig().fewShotStructuredData}") rather than generic advice.

### 🎯 SELECTED INTERCEPTION TARGETS (FROM STEP 1):
${selectedTargets.map((t, i) => `Target ${i + 1}:
 - ID: "${t.id}"
 - User Prompt: "${t.userPrompt}"
 - Mandatory Anchor: "${t.expectedAnchor}"`).join('\n')}

### 📝 REQUIRED OUTPUT (JSON FORMAT):
You must return a VALID JSON object matching this structure:
{
  "comprehensiveInsight": {
    "aiPerception": "Summary of current AI bias against these specific targets",
    "marketGapAnalysis": "The exact cognitive arbitrage opportunity for these targets"
  },
  "implicitIntentStrategy": [
     {
       "anchorIds": ["<id of the target(s) this playbook directly addresses, from the list above>"],
       "sourceLogic": "How the core technical logic answers the target prompt",
       "tacticsType": "Scenario/Authority/Counter-Competitor",
       "contentPlatform": "Recommended platform (e.g. Technical Forum/Wiki)",
       "structuredDataStrategy": "Specific layout (Table/Code/List) to ensure AI extraction",
       "geoAction": "One sentence specific GEO action",
       "targetSnippet": "A 100-150 word 'Golden Paragraph' that perfectly captures the target anchor"
     }
  ],
  "competitorStrategy": [
     // Same structure as above (including anchorIds), but focused on displacing specific competitors for these targets
  ],
  "roleSpecificSops": [
     {
       "roleName": "SOP for Developer/Marketer",
       "coreFocus": "What they must prioritize",
       "sopTitle": "Actionable Title",
       "actionableGuide": "Step-by-step specific to these targets",
       "badExample": "Common mistake (e.g., being too promotional)",
       "goodExample": "Expert execution",
       "checklist": ["Task 1", "Task 2"]
     }
  ]
}

CRITICAL: Return ONLY the JSON. No markdown fences. Ensure ALL text is in [${uiLang}].
`;

  return callDeepSeekJSON<MarketStrategy>(
    prompt,
    {
      systemSuffix: `You are a precise JSON generator. Respond ONLY with a valid JSON object matching the structure described above. All text must be in [${uiLang}]. No markdown fences. No explanatory text.`,
      temperature: 0.3,
      maxTokens: 8192,
    },
    3,
  );
};
