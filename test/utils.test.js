import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  advance,
  EOI,
  State,
  captureToken,
  consumeSpaces,
  prepareInput,
  readToken,
} from '../src/utils.js';

describe('Utils', () => {
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

  describe('captureToken', () => {
    test('updates results when a token is defined', () => {
      const state = {
        results: [],
        index: 0,
        text: '__',
      };
      const capture = captureToken('_');
      const result = capture(state);
      assert.equal(result, '_');
      assert.equal(state.index, 1);
      assert.equal(state.results.length, 1);
      assert.equal(state.results[0], '_');
    });
    test('only advances when a token is not defined', () => {
      const state = {
        results: [],
        index: 0,
        text: ' ',
      };
      const capture = captureToken();
      const result = capture(state);
      assert.equal(result, '');
      assert.equal(state.index, 1);
      assert.equal(state.results.length, 0);
    });
  });

  describe('consumeSpaces utility', () => {
    test('accepts an empty input', () => {
      const state = {
        text: '',
        index: 0,
        results: [],
        error: '',
      };
      const result = consumeSpaces(state);
      assert.equal(result, '');
      assert.deepEqual(state, {
        text: '',
        index: 0,
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
      const result = consumeSpaces(state);
      assert.equal(result, '');
      assert.deepEqual(state, {
        text: '_    ',
        index: 5,
        results: [],
        error: '',
      });
      assert.ok(EOI(state));
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

  describe('readToken', () => {
    test('returns the character at a given index (initial)', () => {
      assert.equal(readToken(State('Hello')), 'H');
    });
    test('returns the character at a given index (midway)', () => {
      assert.equal(readToken({ text: 'Hello, World!', index: 7 }), 'W');
    });
    test('returns the character at a given the last index', () => {
      assert.equal(readToken({ text: 'Hello, World!', index: 12 }), '!');
    });
    test('returns an empty string when given an exceeded index', () => {
      assert.equal(readToken({ text: 'Hello, World!', index: 13 }), '');
    });
    test('returns a string when given a length', () => {
      assert.equal(readToken({ text: 'Hello, World!', index: 7 }, 5), 'World');
    });
  });
});
