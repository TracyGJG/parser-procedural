import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { isEscaped, isUnicode } from '../src/predicates.js';

import {
  State,
  EOI,
  readText,
  advance,
  Parser,
  ParserWithWhitespace,
  ParserWithoutWhitespace,
  prepareInput,
  inError,
  reportError,
  consumeWhitespace,
} from '../src/utils.js';

describe('Utils', () => {
  describe('State, returns a state object when given', () => {
    test('only the input text', () => {
      assert.deepEqual(State('Hello'), {
        text: 'Hello',
        index: 0,
        results: [],
        error: '',
      });
    });
  });

  describe('State Error', () => {
    test('Default state is an empty string and not in Error', () => {
      const state = State('TEST');
      assert.equal(state.error, '');
      assert.ok(!inError(state));
    });
    test('Report error when in error state (default)', () => {
      const state = State('TEST');
      reportError('error', (_) => false)(state);
      assert.equal(state.error, 'Error @0: error');
      assert.ok(inError(state));
    });
    test('Report error when in error state (override)', () => {
      const state = State('TEST');
      state.error = 'Error: DONE';
      reportError('error', (_) => false)(state);
      assert.equal(state.error, 'Error: DONE');
      assert.ok(inError(state));
    });
    test('Does not report error when not in error state (default)', () => {
      const state = State('TEST');
      reportError('error', (_) => true)(state);
      assert.equal(state.error, '');
      assert.ok(!inError(state));
    });
    test('Does not report error when not in error state (override)', () => {
      const state = State('TEST');
      state.error = 'Error: DONE';
      reportError('error', (_) => true)(state);
      assert.equal(state.error, 'Error: DONE');
      assert.ok(inError(state));
    });
    test('Report error when no parser if given', () => {
      const state = State('TEST');
      reportError('error')(state);
      assert.equal(state.error, 'Error @0: error');
      assert.ok(inError(state));
    });
  });

  describe('EOI', () => {
    test('returns false when at the start of the input text', () => {
      assert.ok(
        !EOI(
          State({
            text: 'Hello',
            index: 0,
            results: [],
            error: '',
          }),
        ),
      );
    });
    test('returns false when in the middle of the input text', () => {
      assert.ok(
        !EOI(
          State({
            text: 'Hello',
            index: 2,
            results: [],
            error: '',
          }),
        ),
      );
    });
    test('returns true when at the end of the input text', () => {
      assert.ok(
        !EOI(
          State({
            text: 'Hello',
            index: 5,
            results: [],
            error: '',
          }),
        ),
      );
    });
    test('returns true when passed the end of the input text', () => {
      assert.ok(
        !EOI(
          State({
            text: 'Hello',
            index: 6,
            results: [],
            error: '',
          }),
        ),
      );
    });
  });

  describe('readText', () => {
    test('returns the character at a given index (initial)', () => {
      assert.equal(readText(State('Hello')), 'H');
    });
    test('returns the character at a given index (midway)', () => {
      assert.equal(readText({ text: 'Hello, World!', index: 7 }), 'W');
    });
    test('returns the character at a given the last index', () => {
      assert.equal(readText({ text: 'Hello, World!', index: 12 }), '!');
    });
    test('returns an empty string when given an exceeded index', () => {
      assert.equal(readText({ text: 'Hello, World!', index: 13 }), '');
    });
    test('returns a string when given a length', () => {
      assert.equal(readText({ text: 'Hello, World!', index: 7 }, 5), 'World');
    });
  });

  describe('advance, Updates the index and results when', () => {
    test('in range (initial)', () => {
      const state = State('Hello');
      assert.equal(advance(state), 'H');
      assert.deepEqual(state, {
        text: 'Hello',
        index: 1,
        results: ['H'],
        error: '',
      });
    });
    test('in range (midway)', () => {
      const state = State('Hello, World!');
      state.index = 7;
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 7,
        results: [],
        error: '',
      });
      assert.equal(advance(state, 5), 'World');
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 12,
        results: ['World'],
        error: '',
      });
    });
    test('in range (end)', () => {
      const state = State('Hello, World!');
      state.index = 12;
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 12,
        results: [],
        error: '',
      });
      assert.equal(advance(state), '!');
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 13,
        results: ['!'],
        error: '',
      });
    });
    test('in range (exceeded)', () => {
      const state = State('Hello, World!');
      state.index = 13;
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 13,
        results: [],
        error: '',
      });
      assert.equal(advance(state), '');
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 13,
        results: [],
        error: '',
      });
    });
    test('in range (exhausted)', () => {
      const state = State('Hello, World!');
      state.index = 12;
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 12,
        results: [],
        error: '',
      });
      assert.equal(advance(state, 2), '');
      assert.deepEqual(state, {
        text: 'Hello, World!',
        index: 12,
        results: [],
        error: '',
      });
    });
  });

  describe('Parser', () => {
    describe('Printable chars', () => {
      test('with default options', () => {
        const parser = Parser(() => true);
        const state = {
          text: 'Hello, World!',
          index: 7,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), 'W');
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 8,
          results: ['W'],
          error: '',
        });
      });
      test('with size = 5', () => {
        const parser = Parser(() => true, { size: 5 });
        const state = {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), 'World');
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 12,
          results: ['World'],
          error: '',
        });
      });
      test('with size = 5 and ignoreWhitespace = false', () => {
        const parser = Parser(() => true, { size: 5, ignoreWhitespace: false });
        const state = {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), ' Worl');
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 11,
          results: [' Worl'],
          error: '',
        });
      });
      test('with size = 5 and errorWhitespace = true', () => {
        const parser = Parser(() => true, { size: 5, errorWhitespace: true });
        const state = {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), false);
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        });
      });
      test('with size = 5 using ParserWithWhitespace', () => {
        const parser = ParserWithWhitespace(() => true, { size: 5 });
        const state = {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), ' Worl');
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 11,
          results: [' Worl'],
          error: '',
        });
      });
      test('with size = 5 using ParserWithoutWhitespace', () => {
        const parser = ParserWithoutWhitespace(() => true, { size: 5 });
        const state = {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        };
        assert.deepEqual(parser(state), false);
        assert.deepEqual(state, {
          text: 'Hello, World!',
          index: 6,
          results: [],
          error: '',
        });
      });
    });
    //
    describe('multi-part', () => {
      test('Escape character', () => {
        const parser = Parser(isEscaped, { size: 2 });
        const testText = '\"';
        const state = {
          text: JSON.stringify(testText),
          index: 1,
          results: [],
          error: '',
        };
        const result = parser(state);
        assert.equal(result, '\\"');
        assert.deepEqual(state, {
          text: '"\\""',
          index: 3,
          results: ['\\\"'],
          error: '',
        });
      });
      test('Unicode character', () => {
        const parser = Parser(isUnicode);
        const testText = '\u1234';
        const state = {
          text: JSON.stringify(testText),
          index: 1,
          results: [],
          error: '',
        };
        parser(state);
        assert.deepEqual(state, {
          text: '"ሴ"',
          index: 2,
          results: ['ሴ'],
          error: '',
        });
      });
    });
  });

  describe('prepareInput', () => {
    test('returns false when at the start of the input text', () => {
      assert.deepEqual(prepareInput('   "Hello,\t World!"\n  '), {
        text: '"Hello, World!"',
        index: 0,
        results: [],
        error: '',
      });
    });
  });

  describe('consumeWhitespace utility', () => {
    test('accepts an empty imput', () => {
      const state = {
        text: '',
        index: 0,
        results: [],
        error: '',
      };
      assert.deepEqual(consumeWhitespace(state), {
        text: '',
        index: 0,
        results: [],
        error: '',
      });
    });
    test('strips whitespace when populated', () => {
      const state = {
        text: ' \n \r \t _',
        index: 0,
        results: [],
        error: '',
      };
      assert.deepEqual(consumeWhitespace(state), {
        text: ' \n \r \t _',
        index: 7,
        results: [],
        error: '',
      });
    });
    test('exhausts the input', () => {
      const state = {
        text: '_    ',
        index: 1,
        results: [],
        error: '',
      };
      assert.deepEqual(consumeWhitespace(state), {
        text: '_    ',
        index: 5,
        results: [],
        error: '',
      });
      assert.ok(EOI(state));
    });
  });
});
