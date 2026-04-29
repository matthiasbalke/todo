/**
 * Extracts the leading emoji grapheme cluster from a string.
 * Returns the full cluster (including variation selectors) or '' if the
 * string does not start with an Extended_Pictographic character.
 */
export function extractEmoji(str: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const [first] = segmenter.segment(str);
  if (!first) return '';
  return /^\p{Extended_Pictographic}/u.test(first.segment) ? first.segment : '';
}
