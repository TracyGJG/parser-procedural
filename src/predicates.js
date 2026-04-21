// PREDICATES
export const matchText =
  (...patterns) =>
  (text = '') =>
    !!text.length &&
    patterns.some(
      (pattern) =>
        text.length >= pattern.length &&
        pattern.includes(text.slice(0, pattern.length)),
    );

// Base Values
export const isBooleanTrue = matchText('true');
export const isBooleanFalse = matchText('false');
export const isNullValue = matchText('null');

// String
export const isStringDelim = matchText('"');
const isEscapePrefix = matchText('\\');
const isControlChar = matchText(
  ...`\u007F${String.fromCharCode(...Array(32).keys())}`,
);
export const isPrintableChar = (text) =>
  !(isControlChar(text) || isStringDelim(text) || isEscapePrefix(text));
const ESCAPED_CHARACTERS = [
  '\\\"',
  '\\\\',
  '\\/',
  '\\b',
  '\\f',
  '\\n',
  '\\r',
  '\\t',
];
export const isEscaped = matchText(...ESCAPED_CHARACTERS);
const FIRST_UNICODE_CHAR = 0x0080;
export const isUnicode = (text) => text.codePointAt(0) > FIRST_UNICODE_CHAR;

// Number
// - Integer
export const isMinusSign = matchText('-');
export const isZero = matchText('0');
export const isPositiveDigit = matchText(...'123456789');
export const isSingleDigit = matchText(...'0123456789');
// - Fraction
export const isDecimalPoint = matchText('.');
// - Exponent
export const isExponentSign = matchText(...'eE');
export const isArithmeticSigns = matchText(...'-+');

// Array
export const isArrayStart = matchText('[');
export const isArrayEnd = matchText(']');
export const isArraySeparator = matchText(',');

// Object
export const isObjectStart = matchText('{');
export const isObjectEnd = matchText('}');
export const isObjectSeparator = matchText(',');
export const isObjectKeyValSep = matchText(':');

// Whitespace
export const isSpace = matchText(' ');
export const isWhitespace = matchText('\n', '\r', '\t');
