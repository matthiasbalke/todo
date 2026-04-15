import { describe, it, expect } from 'vitest';
import { extractEmoji } from './emoji';

describe('extractEmoji', () => {
  it('returns empty string for plain text', () => {
    expect(extractEmoji('Hello')).toBe('');
  });

  it('extracts plain emoji without variation selector (🪡)', () => {
    expect(extractEmoji('🪡 Sewing')).toBe('🪡');
  });

  it('extracts emoji with variation selector (🏞️)', () => {
    expect(extractEmoji('🏞️ Landscape')).toBe('🏞️');
  });

  it('extracts emoji with variation selector (🏷️)', () => {
    expect(extractEmoji('🏷️ Tags')).toBe('🏷️');
  });

  it('extracts emoji not followed by a space (🏞️SSE Test)', () => {
    expect(extractEmoji('🏞️SSE Test')).toBe('🏞️');
  });

  it('returns empty string for empty input', () => {
    expect(extractEmoji('')).toBe('');
  });
});
