export const RELATIVE_ASC = [
  'last30',
  'last7',
  'yesterday',
  'today',
  'tomorrow',
  'next7',
  'next30',
] as const;
export const RELATIVE_DESC = [...RELATIVE_ASC].reverse();

/**
 * Orders two relative date keys according to a predefined chronological sequence.
 *
 * @param a - First key to compare.
 * @param b - Second key to compare.
 * @param asc - When true, use ascending chronological order; when false, use descending order.
 * @returns A negative number if `a` comes before `b`, a positive number if `a` comes after `b`, or `0` if their order is undefined.
 */
export function sortRelativeKeys(a: string, b: string, asc: boolean): number {
  const order: readonly string[] = asc ? RELATIVE_ASC : RELATIVE_DESC;
  const idxA = order.indexOf(a);
  const idxB = order.indexOf(b);

  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return asc ? 1 : -1;
  if (idxB !== -1) return asc ? -1 : 1;

  return 0; // Both not found
}

/**
 * Compare two strings that represent numeric date keys by their numeric value.
 *
 * If both inputs convert to finite numbers the result orders them ascending when `asc` is true,
 * otherwise descending. If either input is not numeric, no ordering is applied.
 *
 * @param a - First key string, expected to contain a numeric timestamp
 * @param b - Second key string, expected to contain a numeric timestamp
 * @param asc - When true, sort in ascending numeric order; when false, sort in descending numeric order
 * @returns A negative number if `a` should come before `b`, a positive number if `a` should come after `b`, `0` if they are equal or either value is not numeric
 */
export function sortNumericKeys(a: string, b: string, asc: boolean): number {
  const na = Number(a);
  const nb = Number(b);

  if (Number.isFinite(na) && Number.isFinite(nb)) {
    return asc ? na - nb : nb - na;
  }

  return 0; // Not both numeric
}

/**
 * Create a comparator for date-like string keys that orders relative keys, numeric keys, and plain strings according to the chosen mode and direction.
 *
 * When `mode` is `'date-relative'`, relative keys are ordered by a predefined chronological list first, then numeric-like keys by their numeric value, and finally by lexicographic order for remaining ties. For other modes, numeric-like keys are compared first, then lexicographically.
 *
 * @param mode - If `'date-relative'` use relative-key-first ordering; any other value uses numeric-first ordering.
 * @param asc - If `true` sort ascending; if `false` sort descending.
 * @returns A comparator function that returns a negative number if `a` should come before `b`, `0` if they are equivalent, or a positive number if `a` should come after `b`.
 */
export function compareDateKeys(mode: string | undefined, asc: boolean) {
  return (a: string, b: string) => {
    if (mode === 'date-relative') {
      // Try relative key sorting first
      const relativeResult = sortRelativeKeys(a, b, asc);
      if (relativeResult !== 0) return relativeResult;

      // Try numeric sorting second
      const numericResult = sortNumericKeys(a, b, asc);
      if (numericResult !== 0) return numericResult;

      // Fallback to lexicographic order for mixed cases
      return asc ? a.localeCompare(b) : b.localeCompare(a);
    }

    // Standard numeric/lexicographic comparison for other date modes
    return (
      sortNumericKeys(a, b, asc) ||
      (asc ? a.localeCompare(b) : b.localeCompare(a))
    );
  };
}