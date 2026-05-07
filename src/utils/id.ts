/**
 * Simple UUID v4 generator
 *
 * Uses crypto.randomUUID() where available (modern browsers, Node 19+),
 * with a fallback for older environments.
 */

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: crypto.getRandomValues with hex formatting
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Set version 4 bits
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
