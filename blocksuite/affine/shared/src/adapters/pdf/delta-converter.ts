/**
 * Delta to PDF content converter
 */

import { resolveCssVariable } from './css-utils.js';

/**
 * Convert a Quill-style delta (props.text.delta) into a normalized text representation with inline styling.
 *
 * @param props - Input object expected to contain a Quill-like delta at `props.text.delta`.
 * @param configs - Map of configuration values; supports `docLinkBaseUrl` for constructing reference links and `title:<pageId>` entries to supply display titles for referenced pages.
 * @returns A single space when no renderable content is present; a plain string when the result is a single unstyled segment; otherwise an array of strings and objects. Objects include a `text` property and optional inline styling fields such as `bold`, `italics`, `decoration`, `font`, `fontSize`, `color`, `background`, and `link`.
export function extractTextWithInline(
  props: Record<string, any>,
  configs: Map<string, string>
): string | Array<string | { text: string; [key: string]: any }> {
  const delta = props?.text?.delta;
  if (!Array.isArray(delta)) {
    return ' ';
  }

  const result: Array<string | { text: string; [key: string]: any }> = [];

  for (const op of delta) {
    if (typeof op.insert !== 'string') {
      continue;
    }

    const text = op.insert;
    const attrs = op.attributes;

    if (!attrs || Object.keys(attrs).length === 0) {
      result.push(text);
      continue;
    }

    const styleObj: { text: string; [key: string]: any } = { text };

    if (attrs.bold === true) {
      styleObj.bold = true;
    }
    if (attrs.italic === true) {
      styleObj.italics = true;
    }
    const decorations: string[] = [];
    if (attrs.strike === true) {
      decorations.push('lineThrough');
    }
    if (attrs.underline === true) {
      decorations.push('underline');
    }
    if (decorations.length > 0) {
      styleObj.decoration = decorations;
    }
    if (attrs.code === true) {
      styleObj.font = 'Inter';
      styleObj.background = '#f5f5f5';
      styleObj.fontSize = 10;
      styleObj.text = ' ' + text + ' ';
    }
    if (attrs.color && typeof attrs.color === 'string') {
      const resolved = resolveCssVariable(attrs.color);
      if (resolved) {
        styleObj.color = resolved;
      }
    }
    if (
      attrs.background &&
      typeof attrs.background === 'string' &&
      !attrs.code
    ) {
      const resolvedBg = resolveCssVariable(attrs.background);
      if (resolvedBg) {
        styleObj.background = resolvedBg;
      }
    }
    if (attrs.link) {
      styleObj.link = attrs.link;
      styleObj.color = '#0066cc';
    }
    if (attrs.reference) {
      const ref = attrs.reference;
      if (ref.type === 'LinkedPage' || ref.type === 'Subpage') {
        const docLinkBaseUrl = configs.get('docLinkBaseUrl') || '';
        const linkUrl = docLinkBaseUrl ? `${docLinkBaseUrl}/${ref.pageId}` : '';

        const pageTitle = configs.get('title:' + ref.pageId);
        const isPageFound = pageTitle !== undefined;
        const displayTitle = pageTitle || 'Page not found';

        if (!text || text.trim() === '' || text === ' ') {
          styleObj.text = displayTitle;
        }
        styleObj.color = '#0066cc';
        if (!isPageFound && styleObj.decoration) {
          if (!Array.isArray(styleObj.decoration)) {
            styleObj.decoration = [styleObj.decoration];
          }
          if (!styleObj.decoration.includes('lineThrough')) {
            styleObj.decoration.push('lineThrough');
          }
        }
        if (linkUrl) {
          styleObj.link = linkUrl;
        }
      }
    }
    if (attrs.latex) {
      styleObj.text = attrs.latex;
      styleObj.italics = true;
      styleObj.color = '#666666';
    }

    result.push(styleObj);
  }

  if (result.length === 0) {
    return ' ';
  }
  if (result.length === 1 && typeof result[0] === 'string') {
    return result[0] || ' ';
  }
  return result;
}