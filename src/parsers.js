import { EOI, readToken, captureToken, consumeSpaces } from './utils.js';
import {
  isBooleanTrue,
  isBooleanFalse,
  isNullValue,
  isStringDelim,
  isPrintableChar,
  isEscaped,
  isUnicode,
  isArrayStart,
  isArrayEnd,
  isArraySeparator,
  isObjectStart,
  isObjectEnd,
  isObjectKeyValSep,
  isObjectSeparator,
  isMinusSign,
  isZero,
  isPositiveDigit,
  isSingleDigit,
  isDecimalPoint,
  isExponentSign,
  isArithmeticSigns,
  isSpace,
  isWhitespace,
} from './predicates.js';

const baseValueParser = (predicate, token) => (state) => {
  const text = `${token}`;
  if (!predicate(readToken(state, text.length))) {
    return false;
  }
  state.results.push(token);
  state.index += text.length;
  return true;
};
const BASE_VALUES = {
  t: baseValueParser(isBooleanTrue, true),
  f: baseValueParser(isBooleanFalse, false),
  n: baseValueParser(isNullValue, null),
};
const isBaseValueInitial = (char) => BASE_VALUES.hasOwnProperty(char);

const MODELS = [
  [isBaseValueInitial, baseParser],
  [isStringDelim, stringParser],
  [isArrayStart, arrayParser],
  [isObjectStart, objectParser],
  [isMinusSign, numberParser],
  [isZero, numberParser],
  [isPositiveDigit, numberParser],
];

export default function valueParser(state) {
  const initialChar = consumeSpaces(state);
  return (
    initialChar && MODELS.find(([pred, model]) => pred(initialChar))?.[1](state)
  );
}

function baseParser(state) {
  return BASE_VALUES[readToken(state)](state);
}

function stringParser(state) {
  const index = state.results.length;
  captureToken('"')(state);
  let token;
  while (!EOI(state)) {
    token = readToken(state, 2);
    if (token) {
      if (isEscaped(token)) {
        captureToken(token)(state);
        continue;
      }
      token = token[0];
      (isPrintableChar(token) || isUnicode(token)) &&
        captureToken(token)(state);

      if (isStringDelim(token)) break;
    }
  }
  if (isStringDelim(token)) {
    captureToken('"')(state);
    state.results[index] = state.results.slice(index).join('');
    state.results.length = index + 1;
    return true;
  } else {
    state.error = 'No end of String';
  }
  return false;
}

function arrayParser(state) {
  const index = state.results.length;
  let token = captureToken('[')(state);
  if (valueParser(state)) {
    while (!EOI(state)) {
      token = consumeSpaces(state);
      if (isArraySeparator(token)) {
        captureToken(',')(state);
      } else {
        break;
      }
      token = consumeSpaces(state);
      if (!valueParser(state)) {
        state.error = 'No value';
        return false;
      }
    }
  }
  token = consumeSpaces(state);
  if (isArrayEnd(token)) {
    captureToken(token)(state);
    state.results[index] = state.results.slice(index, state.results.length);
    state.results.length = index + 1;
    return true;
  }
  state.error = 'No end of Array';
  return false;
}

function objectParser(state) {
  const index = state.results.length;
  captureToken('{')(state);
  let token;
  if (keyValueParser(state)) {
    while (!EOI(state)) {
      token = consumeSpaces(state);
      if (isObjectSeparator(token)) {
        captureToken(',')(state);
      } else {
        break;
      }
      token = consumeSpaces(state);
      if (!keyValueParser(state)) {
        state.error = 'No key-value';
        return false;
      }
    }
  }
  if (state.error.length) return false;
  token = consumeSpaces(state);
  if (isObjectEnd(token)) {
    captureToken('}')(state);
    state.results[index] = state.results.slice(index, state.results.length);
    state.results.length = index + 1;
    return true;
  } else {
    state.error = 'No end of Object';
  }
  return false;
}
function keyValueParser(state) {
  let token = consumeSpaces(state);
  if (!isStringDelim(token)) return false;
  stringParser(state);
  token = consumeSpaces(state);
  if (isObjectKeyValSep(token)) {
    captureToken(':')(state);
  } else {
    state.error = 'Missing key-value separator';
    return false;
  }
  if (!valueParser(state)) {
    state.error = 'No property value';
    return false;
  }
  return true;
}

function numberParser(state) {
  const index = state.results.length;
  integerParser(state);
  fractionParser(state);
  exponentParser(state);
  if (state.error) return false;
  state.results[index] = +state.results.slice(index).join('');
  state.results.length = index + 1;
  return true;
}
function integerParser(state) {
  let token = readToken(state);
  if (token === '0') {
    captureToken(token)(state);
    return true;
  }
  if (token === '-') {
    token = captureToken(token)(state);
    if (!isSingleDigit(token)) {
      state.error = 'Invalid integer';
      return false;
    }
  }
  while (isSingleDigit(token)) {
    token = captureToken(token)(state);
  }
  return true;
}
function fractionParser(state) {
  if (state.error) return false;
  let token = readToken(state);
  if (!isDecimalPoint(token)) return false;
  token = captureToken(token)(state);
  if (!isSingleDigit(token)) {
    state.error = 'Invalid fraction';
    return false;
  }
  while (isSingleDigit(token)) {
    token = captureToken(token)(state);
  }
  return true;
}
function exponentParser(state) {
  if (state.error) return false;
  let token = readToken(state);
  if (!isExponentSign(token)) return false;
  token = captureToken(token)(state);
  if (isArithmeticSigns(token)) {
    token = captureToken(token)(state);
  }
  if (!isSingleDigit(token)) {
    state.error = 'Invalid exponent';
    return false;
  }
  while (isSingleDigit(token)) {
    token = captureToken(token)(state);
  }
  return true;
}
