import { EOI, readToken, captureToken, consumeTokens } from './utils.js';
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

const baseValueParser = (predicate, text) => (state) => {
  if (!predicate(readToken(state, text.length))) {
    return false;
  }
  state.results.push(text);
  state.index += text.length;
  return true;
};
const BASE_VALUES = {
  t: baseValueParser(isBooleanTrue, 'true'),
  f: baseValueParser(isBooleanFalse, 'false'),
  n: baseValueParser(isNullValue, 'null'),
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

export function valueParser(state) {
  const index = state.results.length;
  consumeTokens()(state);
  const initialChar = readToken(state);
  if (initialChar) {
    MODELS.find(([pred, model]) => pred(initialChar))?.[1](state);
  }
  return state.index && index !== state.index;
}

function baseParser(state) {
  const initial = readToken(state);
  return BASE_VALUES[initial](state);
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
  captureToken('[')(state);

  let token;
  if (valueParser(state)) {
    while (!EOI(state)) {
      consumeTokens()(state);
      token = readToken(state);
      if (isArraySeparator(token)) {
        captureToken(',')(state);
      } else {
        break;
      }

      consumeTokens()(state);
      token = readToken(state);
      if (!valueParser(state)) {
        state.error = 'No value';
        break;
      }
    }
  }
  consumeTokens()(state);
  token = readToken(state);
  if (isArrayEnd(token)) {
    captureToken(']')(state);
    state.results[index] = state.results.slice(index, state.results.length);
    state.results.length = index + 1;
    return true;
  } else {
    state.error = 'No end of Array';
  }
  return false;
}

function objectParser(state) {
  const index = state.results.length;
  captureToken('{')(state);

  let token;
  if (keyValueParser(state)) {
    while (!EOI(state)) {
      consumeTokens()(state);
      token = readToken(state);
      if (isObjectSeparator(token)) {
        captureToken(',')(state);
      } else {
        break;
      }

      consumeTokens()(state);
      token = readToken(state);
      if (!keyValueParser(state)) {
        state.error = 'No key-value';
        break;
      }
    }
  }
  consumeTokens()(state);
  token = readToken(state);
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
  consumeTokens()(state);
  let token = readToken(state);
  if (!isStringDelim(token)) return false;

  stringParser(state);
  consumeTokens()(state);
  token = readToken(state);
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
  if (!integerParser(state)) return false;
  fractionParser(state);
  exponentParser(state);

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
    captureToken(token)(state);
    token = readToken(state);
    if (!isSingleDigit(token)) {
      state.error = 'Invalid integer';
      return false;
    }
  }
  while (isSingleDigit(token)) {
    captureToken(token)(state);
    token = readToken(state);
  }
  return true;
}
function fractionParser(state) {
  let token = readToken(state);

  if (!isDecimalPoint(token)) return false;
  captureToken(token)(state);
  token = readToken(state);

  if (!isSingleDigit(token)) {
    state.error = 'Invalid fraction';
    return false;
  }

  while (isSingleDigit(token)) {
    captureToken(token)(state);
    token = readToken(state);
  }
  return true;
}
function exponentParser(state) {
  let token = readToken(state);

  if (!isExponentSign(token)) return false;
  captureToken(token)(state);
  token = readToken(state);

  if (isArithmeticSigns(token)) {
    captureToken(token)(state);
    token = readToken(state);
  }

  if (!isSingleDigit(token)) {
    state.error = 'Invalid exponent';
    return false;
  }

  while (isSingleDigit(token)) {
    captureToken(token)(state);
    token = readToken(state);
  }
  return true;
}
