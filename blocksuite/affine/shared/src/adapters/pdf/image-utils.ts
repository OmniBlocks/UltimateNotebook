/**
 * Image dimension utilities
 */

import { MAX_PAPER_HEIGHT, MAX_PAPER_WIDTH } from './utils.js';

/**
 * Compute target image width and height using provided block dimensions or fallbacks to original dimensions, then clamp to paper size limits preserving aspect ratio when necessary.
 *
 * @param blockWidth - Preferred width from layout; used if > 0
 * @param blockHeight - Preferred height from layout; used if > 0
 * @param originalWidth - Source image intrinsic width; used when `blockWidth` is not provided
 * @param originalHeight - Source image intrinsic height; used when `blockHeight` is not provided
 * @returns An object containing `width` and/or `height` (numbers) representing the computed dimensions; empty object if neither dimension can be determined
 */
export function calculateImageDimensions(
  blockWidth: number | undefined,
  blockHeight: number | undefined,
  originalWidth: number | undefined,
  originalHeight: number | undefined
): { width?: number; height?: number } {
  let targetWidth =
    blockWidth && blockWidth > 0
      ? blockWidth
      : originalWidth && originalWidth > 0
        ? originalWidth
        : undefined;

  let targetHeight =
    blockHeight && blockHeight > 0
      ? blockHeight
      : originalHeight && originalHeight > 0
        ? originalHeight
        : undefined;

  if (!targetWidth && !targetHeight) {
    return {};
  }

  if (targetWidth && targetWidth > MAX_PAPER_WIDTH) {
    const ratio = MAX_PAPER_WIDTH / targetWidth;
    targetWidth = MAX_PAPER_WIDTH;
    if (targetHeight) {
      targetHeight = targetHeight * ratio;
    }
  }

  if (targetHeight && targetHeight > MAX_PAPER_HEIGHT) {
    const ratio = MAX_PAPER_HEIGHT / targetHeight;
    targetHeight = MAX_PAPER_HEIGHT;
    if (targetWidth) {
      targetWidth = targetWidth * ratio;
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Parse an SVG source string and extract numeric width and height.
 *
 * If `width` or `height` attributes are missing, attempt to derive them from the SVG `viewBox`'s width and height when available.
 *
 * @param svgText - The SVG document text to parse
 * @returns An object containing numeric `width` and/or `height` when found; properties are `undefined` if not present or not derivable
 */
export function extractSvgDimensions(svgText: string): {
  width?: number;
  height?: number;
} {
  const widthMatch = svgText.match(/width\s*=\s*["']?(\d+(?:\.\d+)?)/i);
  const heightMatch = svgText.match(/height\s*=\s*["']?(\d+(?:\.\d+)?)/i);
  const viewBoxMatch = svgText.match(
    /viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i
  );

  let width: number | undefined;
  let height: number | undefined;

  if (widthMatch) {
    width = parseFloat(widthMatch[1]);
  }
  if (heightMatch) {
    height = parseFloat(heightMatch[1]);
  }

  if ((!width || !height) && viewBoxMatch) {
    const viewBoxWidth = parseFloat(viewBoxMatch[1]);
    const viewBoxHeight = parseFloat(viewBoxMatch[2]);
    if (!width) width = viewBoxWidth;
    if (!height) height = viewBoxHeight;
  }

  return { width, height };
}

/**
 * Extract the intrinsic width and height in pixels from an image Blob.
 *
 * @param blob - Image file blob (e.g., JPEG or PNG)
 * @returns An object with `width` and `height` in pixels when available, or an empty object if dimensions could not be determined
 */
export async function extractImageDimensions(
  blob: Blob
): Promise<{ width?: number; height?: number }> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve({});
    }, 5000);
    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}