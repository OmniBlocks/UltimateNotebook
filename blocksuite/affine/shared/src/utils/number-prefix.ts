/**
 * Converts a non-negative integer into a lowercase alphabetic sequence using `a`..`z`.
 *
 * @param n - The non-negative integer to convert (0 maps to `a`)
 * @returns The lowercase alphabetic representation where `0` → `a`, `1` → `b`, and `26` → `aa`
 */
function number2letter(n: number) {
  const ordA = 'a'.charCodeAt(0);
  const ordZ = 'z'.charCodeAt(0);
  const len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
}

/**
 * Convert a positive integer to its Roman numeral representation.
 *
 * @param num - The integer to convert; expected to be positive (values ≤ 0 produce an empty string)
 * @returns The Roman numeral representation of `num` using standard symbols (e.g., `M`, `CM`, `D`, `CD`, `C`, `XC`, `L`, `XL`, `X`, `IX`, `V`, `IV`, `I`)
 */
function number2roman(num: number) {
  const lookup: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let romanStr = '';
  for (const [key, value] of Object.entries(lookup)) {
    while (num >= value) {
      romanStr += key;
      num -= value;
    }
  }

  return romanStr;
}

function getPrefix(depth: number, index: number) {
  const map = [
    () => index,
    () => number2letter(index - 1),
    () => number2roman(index),
  ];
  return map[depth % map.length]();
}

export function getNumberPrefix(index: number, depth: number) {
  const prefix = getPrefix(depth, index);
  return `${prefix}.`;
}