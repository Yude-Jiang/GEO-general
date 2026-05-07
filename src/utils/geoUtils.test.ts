import { describe, it, expect } from 'vitest';
import { isEuropeRegion, withTimeout, TimeoutError } from './geoUtils';

// ─── isEuropeRegion ──────────────────────────────────────────────────────────

describe('isEuropeRegion', () => {
  it('returns false for undefined/empty', () => {
    expect(isEuropeRegion(undefined)).toBe(false);
    expect(isEuropeRegion('')).toBe(false);
  });

  it('detects "europe"', () => {
    expect(isEuropeRegion('europe')).toBe(true);
    expect(isEuropeRegion('EUROPE')).toBe(true);
  });

  it('detects "eu" as substring', () => {
    expect(isEuropeRegion('eu market')).toBe(true);
  });

  it('detects country names', () => {
    expect(isEuropeRegion('france')).toBe(true);
    expect(isEuropeRegion('Germany')).toBe(true);
    expect(isEuropeRegion('UNITED KINGDOM')).toBe(true);
    expect(isEuropeRegion('netherlands')).toBe(true);
    expect(isEuropeRegion('italy')).toBe(true);
    expect(isEuropeRegion('spain')).toBe(true);
    expect(isEuropeRegion('austria')).toBe(true);
    expect(isEuropeRegion('belgium')).toBe(true);
    expect(isEuropeRegion('poland')).toBe(true);
  });

  it('detects "switzerland" via "swiss" substring', () => {
    expect(isEuropeRegion('switzerland')).toBe(true);
  });

  it('detects Chinese terms', () => {
    expect(isEuropeRegion('欧洲')).toBe(true);
    expect(isEuropeRegion('欧盟市场')).toBe(true);
  });

  it('returns false for non-European regions', () => {
    expect(isEuropeRegion('china')).toBe(false);
    expect(isEuropeRegion('japan')).toBe(false);
    expect(isEuropeRegion('korea')).toBe(false);
    expect(isEuropeRegion('brazil')).toBe(false);
    expect(isEuropeRegion('california')).toBe(false);
  });

  it('detects "emea"', () => {
    expect(isEuropeRegion('EMEA')).toBe(true);
  });
});

// ─── withTimeout / TimeoutError ──────────────────────────────────────────────

describe('withTimeout', () => {
  it('resolves when the promise resolves in time', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with TimeoutError when the promise is too slow', async () => {
    const slow = new Promise<string>(() => {}); // never settles
    await expect(withTimeout(slow, 50)).rejects.toThrow(TimeoutError);
  });

  it('rejects with original error when the promise fails in time', async () => {
    const failing = Promise.reject(new Error('API error'));
    await expect(withTimeout(failing, 1000)).rejects.toThrow('API error');
  });

  it('passes through the promise when ms <= 0', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 0);
    expect(result).toBe('ok');
  });
});
