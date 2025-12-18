/**
 * Resolve a CSS custom property reference of the form `var(--name)` to its computed value from the document root.
 *
 * Accepts a CSS color string or a `var(...)` expression. If the input is a plain value (not a `var(...)` expression), it is returned unchanged.
 *
 * @param color - A CSS color string or a `var(...)` reference to a CSS custom property.
 * @returns `null` if the input is falsy, not a string, the environment lacks a `document`, the input is not a valid `var(...)` reference, the referenced name does not start with `--`, or the computed value is empty; otherwise the trimmed computed value of the CSS custom property.
 */
export function resolveCssVariable(color: string): string | null {
  if (!color || typeof color !== 'string') {
    return null;
  }
  if (!color.startsWith('var(')) {
    return color;
  }
  if (typeof document === 'undefined') {
    return null;
  }
  const rootComputedStyle = getComputedStyle(document.documentElement);
  const match = color.match(/var\(([^)]+)\)/);
  if (!match || !match[1]) {
    return null;
  }
  const variable = match[1].trim();
  if (!variable.startsWith('--')) {
    return null;
  }
  const value = rootComputedStyle.getPropertyValue(variable).trim();
  return value || null;
}