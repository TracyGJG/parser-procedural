import { EOI, readToken, captureToken } from './utils.js';
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
  isObjectStart,
  isObjectEnd,
  isSpace,
  isWhitespace,
} from './predicates.js';

const isBaseValueInitial = (char) => 'fnt'.includes(char);

export function valueParser(state) {
  const MODELS = [
    [isBaseValueInitial, baseParser],
    [isStringDelim, stringParser],
    [isArrayStart, arrayParser],
    [isObjectStart, objectParser],
    //[ isMinusSign, ''],
    // [isZero, ''],
    // [isPositiveDigit, ''],
    [isSpace, captureToken()],
    [isWhitespace, captureToken()],
  ];

  const initialChar = readToken(state);
  if (initialChar) {
    const _model = MODELS.find(([pred, model]) => pred(initialChar));
    if (_model) {
      _model[1](state, initialChar);
    }
  }
  return state;
}

function baseParser(state, initial) {
  isBooleanTrue(readToken(state, 4)) && captureToken('true')(state);
  isBooleanFalse(readToken(state, 5)) && captureToken('false')(state);
  isNullValue(readToken(state, 4)) && captureToken('null')(state);
  return state;
}

function stringParser(state) {
  // let index = state.index;
  captureToken('"')(state);
  let token;
  while (!EOI(state)) {
    token = readToken(state);
    if (isStringDelim(token)) break;
    (isPrintableChar(token) || isUnicode(token)) && captureToken(token)(state);
    token = readToken(state, 2);
    isEscaped(token) && captureToken(token)(state);
  }
  isStringDelim(readToken(state)) && captureToken('"')(state);
  return state;
}

function arrayParser(state) {
  captureToken('[')(state);
  isArrayEnd(readToken(state)) && captureToken(']')(state);
  return state;
}

function objectParser(state) {
  captureToken('{')(state);
  isObjectEnd(readToken(state)) && captureToken('}')(state);
  return state;
}

/*
function numberParser(state) {
  return state;
}
function integerParser(state) {
  return state;
}
function fractionParser(state) {
  return state;
}
function exponentParser(state) {
  return state;
}
*/
