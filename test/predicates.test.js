import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { EOI } from '../src/utils.js';

import {
  matchText,
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
  isObjectSeparator,
  isObjectKeyValSep,
  isMinusSign,
  isZero,
  isPositiveDigit,
  isSingleDigit,
  isDecimalPoint,
  isExponentSign,
  isArithmeticSigns,
} from '../src/predicates.js';

describe('Predicate', () => {
  describe('matchText helper', () => {
    test('matches a single char pattern', () => {
      const matchA = matchText('A');
      assert.ok(matchA('A'));
      assert.ok(!matchA('Z'));
      assert.ok(matchA('AZ'));
    });
    test('matches a multi-char pattern', () => {
      const matchAZ = matchText('AZ');
      assert.ok(matchAZ('AZ_'));
      assert.ok(!matchAZ('A'));
    });
    test('matche text with multiple patterns', () => {
      const matchAorZ = matchText(...'AZ');
      assert.ok(matchAorZ('A'));
      assert.ok(matchAorZ('Z'));
      assert.ok(!matchAorZ('_'));
    });
  });

  describe('Base Value predicates', () => {
    test('matches "true"', () => {
      assert.ok(isBooleanTrue('true'));
      assert.ok(!isBooleanTrue('false'));
    });
    test('matches "false"', () => {
      assert.ok(isBooleanFalse('false'));
      assert.ok(!isBooleanFalse('true'));
    });
    test('matches "null"', () => {
      assert.ok(isNullValue('null'));
      assert.ok(!isNullValue('NULL'));
    });
  });

  describe('String predicates', () => {
    test('Delimiters', () => {
      assert.ok(isStringDelim('"'));
      assert.ok(!isStringDelim('_'));
    });
    test('Printable chars', () => {
      assert.ok(isPrintableChar('A'));
      assert.ok(!isPrintableChar('\u007F'));
      assert.ok(!isPrintableChar('\u000A'));
      assert.ok(!isPrintableChar('\\'));
    });
    test('Escape chars', () => {
      assert.ok(isEscaped('\\\\'));
      assert.ok(isEscaped('\\/'));
      assert.ok(!isEscaped('A'));
    });
    test('Unicode chars', () => {
      assert.ok(isUnicode('\u0081'));
      assert.ok(!isUnicode('\u0080'));
    });
  });

  describe('Array predicates', () => {
    test('Delimiters', () => {
      assert.ok(isArrayStart('['));
      assert.ok(isArrayEnd(']'));
      assert.ok(isArraySeparator(','));
    });
  });

  describe('Object predicates', () => {
    test('Delimiters', () => {
      assert.ok(isObjectStart('{'));
      assert.ok(isObjectEnd('}'));
      assert.ok(isObjectSeparator(','));
      assert.ok(isObjectKeyValSep(':'));
    });
  });

  describe('Number predicates', () => {
    test('Integer', () => {
      assert.ok(isMinusSign('-'));
      assert.ok(isZero('0'));
      assert.ok(isPositiveDigit('1'));
      assert.ok(!isPositiveDigit('0'));
      assert.ok(isSingleDigit('0'));
      assert.ok(!isSingleDigit('A'));
    });
    test('Fraction', () => {
      assert.ok(isDecimalPoint('.'));
    });
    test('Exponent', () => {
      assert.ok(isExponentSign('e'));
      assert.ok(isExponentSign('E'));
      assert.ok(isArithmeticSigns('+'));
      assert.ok(isArithmeticSigns('-'));
    });
  });
});
