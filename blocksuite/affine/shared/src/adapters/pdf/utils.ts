/**
 * Pure utility functions for PDF adapter
 */

// Layout constants
export const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 24;
export const MAX_PAPER_WIDTH = 550;
export const MAX_PAPER_HEIGHT = 800;

// Color constants
export const PDF_COLORS = {
  /** Primary link color */
  link: '#0066cc',
  /** Primary text color */
  text: '#333333',
  /** Secondary/muted text color */
  textMuted: '#666666',
  /** Tertiary/disabled text color */
  textDisabled: '#999999',
  /** Border/divider color */
  border: '#cccccc',
  /** Code block background */
  codeBackground: '#f5f5f5',
  /** Card/container background */
  cardBackground: '#f9f9f9',
} as const;

/**
 * Table layout with no borders (for custom styled containers)
 */
export const TABLE_LAYOUT_NO_BORDERS = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 0,
  paddingBottom: () => 0,
} as const;

/**
 * Create a fallback placeholder label for an image.
 *
 * @param caption - Optional caption to include in the placeholder
 * @returns `"[Image: {caption}]"` if `caption` is provided, `"[Image]"` otherwise
 */
export function getImagePlaceholder(caption?: string): string {
  return caption ? `[Image: ${caption}]` : '[Image]';
}

/**
 * Determine whether provided text content contains any non-empty text.
 *
 * @param textContent - A string or an array of strings or objects with a `text` property. When a string is provided, whitespace-only strings are treated as empty. When an array is provided, presence is determined by the array having at least one element.
 * @returns `true` if the content contains text (a string with non-whitespace characters or an array with at least one item), `false` otherwise.
 */
export function hasTextContent(
  textContent: string | Array<string | { text: string; [key: string]: any }>
): boolean {
  if (typeof textContent === 'string') {
    return textContent.trim() !== '';
  }
  return textContent.length > 0;
}

/**
 * Convert mixed text content into a single plain string.
 *
 * @param textContent - A string or an array containing strings or objects with a `text` property; when an array is provided, each element's string or `text` value is used in order.
 * @returns The concatenated plain string produced from the input.
 */
export function textContentToString(
  textContent: string | Array<string | { text: string; [key: string]: any }>
): string {
  if (typeof textContent === 'string') {
    return textContent;
  }
  return textContent
    .map(item => (typeof item === 'string' ? item : item.text))
    .join('');
}