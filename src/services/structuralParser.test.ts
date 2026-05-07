import { describe, it, expect } from 'vitest';
import {
  parseIntoChunks,
  buildAnnotatedContext,
  computeGeoSignals,
  getParseStats,
} from './structuralParser';

// ─── parseIntoChunks ─────────────────────────────────────────────────────────

describe('parseIntoChunks', () => {
  it('returns an empty array for empty input', () => {
    expect(parseIntoChunks('')).toEqual([]);
    expect(parseIntoChunks('   ')).toEqual([]);
  });

  it('classifies a pipe table as spec_table', () => {
    const text = '| Parameter | Value  | Units  |\n|-----------|--------|--------|\n| Voltage  | 3.3    | V      |\n| Current  | 2.1    | μA     |';
    const chunks = parseIntoChunks(text);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].type).toBe('spec_table');
    expect(chunks[0].geoWeight).toBe(0.95);
  });

  it('classifies content with measurement units as spec_table', () => {
    const text = 'The device operates at 3.3V with 2.1μA in Stop mode and 1.8V I/O voltage range.';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'spec_table')).toBe(true);
  });

  it('classifies fenced code blocks as code_example', () => {
    const text = [
      '```c',
      'void main(void) {',
      '  printf("Hello from STM32");',
      '}',
      '```',
    ].join('\n');
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'code_example')).toBe(true);
    const codeChunk = chunks.find(c => c.type === 'code_example')!;
    expect(codeChunk.geoWeight).toBe(0.85);
  });

  it('classifies content with programming tokens as code_example', () => {
    const text = '    const int max_value = 42;\n    return max_value * 2;';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'code_example')).toBe(true);
  });

  it('classifies comparison language as comparison', () => {
    const text = 'The STM32C5 is better than traditional M0+ alternatives in terms of raw performance.';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'comparison')).toBe(true);
    const cmp = chunks.find(c => c.type === 'comparison')!;
    expect(cmp.geoWeight).toBe(0.80);
  });

  it('classifies markdown headings as headline', () => {
    const text = '# Section Title Here\n\nSome descriptive content about this section.';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'headline')).toBe(true);
    const hl = chunks.find(c => c.type === 'headline')!;
    expect(hl.geoWeight).toBe(0.60);
  });

  it('classifies short text with prices/part numbers as dense_fact', () => {
    const text = 'STM32C5 series starts at $0.64 in 10K unit volumes for 2025.';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'dense_fact')).toBe(true);
    const df = chunks.find(c => c.type === 'dense_fact')!;
    expect(df.geoWeight).toBe(0.90);
  });

  it('classifies general prose as narrative', () => {
    const text = 'This device is designed for a wide range of IoT applications requiring low power consumption and robust security features throughout the product lifetime.';
    const chunks = parseIntoChunks(text);
    expect(chunks.some(c => c.type === 'narrative')).toBe(true);
    const narr = chunks.find(c => c.type === 'narrative')!;
    expect(narr.geoWeight).toBe(0.40);
  });

  it('assigns incrementing charOffsets', () => {
    const text = 'First longer paragraph here for testing.\n\nSecond longer paragraph there for content.';
    const chunks = parseIntoChunks(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[1].charOffset).toBeGreaterThan(chunks[0].charOffset);
  });

  it('filters out segments shorter than 4 characters', () => {
    const text = 'ab\n\nThis is a much longer paragraph that should survive the filter.';
    const chunks = parseIntoChunks(text);
    const allLongEnough = chunks.every(c => c.content.length > 3);
    expect(allLongEnough).toBe(true);
  });

  it('handles mixed content types in a single document', () => {
    const text = [
      '# Product Overview',
      '',
      'This product delivers outstanding performance across multiple dimensions of operation.',
      '',
      '| Parameter | Value | Unit    |',
      '|-----------|-------|---------|',
      '| Freq      | 64    | MHz     |',
      '',
      'The device costs $1.25 in volume and is comparable to competing solutions.',
      '',
      '```python',
      'import stm32',
      'device = stm32.STM32C5()',
      '```',
    ].join('\n');
    const chunks = parseIntoChunks(text);
    expect(chunks.length).toBeGreaterThanOrEqual(4);
    const types = chunks.map(c => c.type);
    expect(types).toContain('headline');
    expect(types).toContain('narrative');
    expect(types).toContain('spec_table');
    expect(types).toContain('code_example');
  });
});

// ─── buildAnnotatedContext ───────────────────────────────────────────────────

describe('buildAnnotatedContext', () => {
  it('returns fallback for empty input', () => {
    expect(buildAnnotatedContext('')).toBe('*(no source content provided)*');
    expect(buildAnnotatedContext('   ')).toBe('*(no source content provided)*');
  });

  it('annotates chunks with type labels in BLUF order', () => {
    const text = [
      'Some narrative description about the product capabilities here.',
      '',
      'STM32C5 priced at $0.64 for 10K volumes in 2025.',
      '',
      '| VDD Range | Value |',
      '|-----------|-------|',
      '| Min       | 1.8V  |',
    ].join('\n');
    const result = buildAnnotatedContext(text);
    expect(result).toContain('[SPEC_TABLE]');
    expect(result).toContain('[NARRATIVE]');
    // spec_table (0.95) should appear before narrative (0.40) — BLUF ordering
    const specPos = result.indexOf('[SPEC_TABLE]');
    const narrPos = result.indexOf('[NARRATIVE]');
    expect(specPos).toBeLessThan(narrPos);
  });

  it('respects maxChars limit', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Chunk number ${i + 1} with some padding content for testing.`).join('\n\n');
    const result = buildAnnotatedContext(text, 100);
    expect(result.length).toBeLessThan(500);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── computeGeoSignals ──────────────────────────────────────────────────────

describe('computeGeoSignals', () => {
  it('returns zeros for empty input', () => {
    const signals = computeGeoSignals('');
    expect(signals.quantifiedClaims).toBe(0);
    expect(signals.hedgeWords).toBe(0);
    expect(signals.techTerms).toBe(0);
    expect(signals.citableChunks).toBe(0);
    expect(signals.blufCompliance).toBe(false);
    expect(signals.wordCount).toBe(0);
  });

  it('counts quantified claims including currency before digits ($0.64)', () => {
    const text = 'Device consumes 2.1μA at 3.3V supply. Priced at $0.64 achieving 40% lower power.';
    const signals = computeGeoSignals(text);
    expect(signals.quantifiedClaims).toBeGreaterThanOrEqual(4);
  });

  it('counts hedge words', () => {
    const text = 'This might be suitable and could potentially be the best option for many general use cases.';
    const signals = computeGeoSignals(text);
    expect(signals.hedgeWords).toBeGreaterThanOrEqual(2);
  });

  it('counts tech terms', () => {
    const text = 'The Cortex-M33 with TrustZone and PSA Certified Level 3 provide robust security for IoT.';
    const signals = computeGeoSignals(text);
    expect(signals.techTerms).toBeGreaterThanOrEqual(3);
  });

  it('counts citable chunks (spec_table, dense_fact, code_example, comparison)', () => {
    const text = [
      '| Param | Value | Unit |',
      '|-------|-------|------|',
      '| VDD   | 3.3   | V    |',
      '',
      'STM32C5 costs $0.64 per unit in volume quantities.',
      '',
      'Some narrative text about general features and capabilities.',
    ].join('\n');
    const signals = computeGeoSignals(text);
    expect(signals.citableChunks).toBeGreaterThanOrEqual(2);
  });

  it('detects BLUF compliance when currency claim in first 150 chars', () => {
    const text = 'At $0.64 per unit, the STM32C5 redefines entry-level pricing for cost-sensitive designs. Then more text follows to fill out the paragraph content.';
    const signals = computeGeoSignals(text);
    expect(signals.blufCompliance).toBe(true);
  });

  it('detects non-BLUF compliance when no early quantified claim', () => {
    const text = 'The device represents a significant advancement in microcontroller technology for embedded systems. It offers improved performance and better power efficiency when compared to previous generations of devices.';
    const signals = computeGeoSignals(text);
    expect(signals.blufCompliance).toBe(false);
  });

  it('computes word count correctly', () => {
    const text = 'one two three four five six seven';
    const signals = computeGeoSignals(text);
    expect(signals.wordCount).toBe(7);
  });
});

// ─── getParseStats ──────────────────────────────────────────────────────────

describe('getParseStats', () => {
  it('returns breakdown by chunk type', () => {
    const text = [
      '# Product Header Title',
      '',
      'Some narrative content about the product.',
      '',
      '| A | B | C |',
      '|---|---|---|',
      '| 1 | 2 | 3 |',
      '',
      'STM32C5 costs $0.64 per unit at volume.',
    ].join('\n');
    const stats = getParseStats(text);
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.byType.headline).toBeGreaterThanOrEqual(1);
    expect(stats.byType.narrative).toBeGreaterThanOrEqual(1);
    expect(stats.byType.spec_table).toBeGreaterThanOrEqual(1);
  });

  it('returns zero total for empty text', () => {
    const stats = getParseStats('');
    expect(stats.total).toBe(0);
    expect(stats.byType.narrative).toBe(0);
  });
});
