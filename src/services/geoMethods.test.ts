import { describe, it, expect } from 'vitest';
import {
  GEO_METHODS,
  RECOMMENDED_COMBOS,
  buildMethodDirectives,
} from './geoMethods';

// ─── Data integrity ──────────────────────────────────────────────────────────

describe('GEO_METHODS', () => {
  it('has all 8 methods defined', () => {
    expect(GEO_METHODS.length).toBe(8);
  });

  it('each method has all required fields', () => {
    for (const method of GEO_METHODS) {
      expect(method.id).toBeTruthy();
      expect(method.label).toBeTruthy();
      expect(method.description).toBeTruthy();
      expect(method.promptDirective).toBeTruthy();
      expect(Array.isArray(method.recommendedFor)).toBe(true);
      expect(method.liftEstimate).toMatch(/^[+-]?\d+%/);
      expect(Array.isArray(method.combinesWellWith)).toBe(true);
    }
  });

  it('has unique ids across all methods', () => {
    const ids = GEO_METHODS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each combinesWellWith references valid method IDs', () => {
    const validIds = new Set(GEO_METHODS.map(m => m.id));
    for (const method of GEO_METHODS) {
      for (const partner of method.combinesWellWith) {
        expect(validIds.has(partner)).toBe(true);
      }
    }
  });

  it('has lift estimates matching known research values', () => {
    const lifts: Record<string, string> = {
      STATISTICS_ADDITION: '+40%',
      CITE_SOURCES: '+40%',
      QUOTATION_ADDITION: '+35%',
      AUTHORITATIVE: '+28%',
      UNIQUE_WORDS: '+20%',
      TECHNICAL_TERMS: '+18%',
      FLUENCY_OPTIMIZATION: '+15%',
      EASY_TO_UNDERSTAND: '+10%',
    };
    for (const method of GEO_METHODS) {
      expect(method.liftEstimate).toBe(lifts[method.id]);
    }
  });

  it('STATISTICS_ADDITION combines well with CITE_SOURCES and AUTHORITATIVE', () => {
    const stats = GEO_METHODS.find(m => m.id === 'STATISTICS_ADDITION')!;
    expect(stats.combinesWellWith).toContain('CITE_SOURCES');
    expect(stats.combinesWellWith).toContain('AUTHORITATIVE');
  });
});

// ─── RECOMMENDED_COMBOS ─────────────────────────────────────────────────────

describe('RECOMMENDED_COMBOS', () => {
  it('each combo references valid method IDs', () => {
    const validIds = new Set(GEO_METHODS.map(m => m.id));
    for (const [, combo] of Object.entries(RECOMMENDED_COMBOS)) {
      expect(combo.label).toBeTruthy();
      for (const id of combo.ids) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it('technical_deep_dive has 3 methods', () => {
    const combo = RECOMMENDED_COMBOS.technical_deep_dive;
    expect(combo.ids).toHaveLength(3);
    expect(combo.ids).toContain('STATISTICS_ADDITION');
    expect(combo.ids).toContain('CITE_SOURCES');
    expect(combo.ids).toContain('AUTHORITATIVE');
  });
});

// ─── buildMethodDirectives ──────────────────────────────────────────────────

describe('buildMethodDirectives', () => {
  it('returns empty string for no methods', () => {
    expect(buildMethodDirectives([])).toBe('');
    expect(buildMethodDirectives(undefined as any)).toBe('');
  });

  it('returns directive for a single method', () => {
    const result = buildMethodDirectives(['STATISTICS_ADDITION']);
    expect(result).toContain('STATISTICS DIRECTIVE');
    expect(result).toContain('+40%');
  });

  it('includes all selected methods up to 3', () => {
    const result = buildMethodDirectives(['STATISTICS_ADDITION', 'CITE_SOURCES', 'AUTHORITATIVE']);
    expect(result).toContain('STATISTICS DIRECTIVE');
    expect(result).toContain('CITATION DIRECTIVE');
    expect(result).toContain('AUTHORITATIVE TONE DIRECTIVE');
  });

  it('caps at 3 methods (paper finding: diminishing returns beyond 3)', () => {
    const allIds = GEO_METHODS.map(m => m.id) as any[];
    const result = buildMethodDirectives(allIds);
    // Method count in output should reflect 3, not 8
    const count = (result.match(/### Method \d+/g) || []).length;
    expect(count).toBeLessThanOrEqual(3);
  });

  it('ignores unknown method IDs gracefully', () => {
    const result = buildMethodDirectives(['NONEXISTENT' as any]);
    expect(result).toBe('');
  });

  it('includes a combined lift estimate', () => {
    const result = buildMethodDirectives(['STATISTICS_ADDITION', 'CITE_SOURCES']);
    expect(result).toMatch(/\d+%/);
  });
});
