import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import valueParser from '../src/parsers.js';

const defaultState = (text, index = 0, results = [], error = '') => ({
  error,
  text,
  index,
  results,
});

describe('Parsers', () => {
  describe('baseParser', () => {
    test('passes: true', () => {
      const state = defaultState('true');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('true', 4, [true]));
    });
    test('passes: false', () => {
      const state = defaultState('false');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('false', 5, [false]));
    });
    test('passes: null', () => {
      const state = defaultState('null');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('null', 4, [null]));
    });
    test('fails: test', () => {
      const state = defaultState('test');
      assert.ok(!valueParser(state));
      assert.deepEqual(state, defaultState('test', 0, []));
    });
    test('fails: excess content', () => {
      const state = defaultState('true false');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('true false', 4, [true]));
    });
  });

  describe('stringParser', () => {
    test('passes: empty string', () => {
      const state = defaultState('""');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('""', 2, ['""']));
    });
    test('passes: string of spaces', () => {
      const state = defaultState('"  "');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('"  "', 4, ['"  "']));
    });
    test('passes: string of printable text', () => {
      const state = defaultState('"text"');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('"text"', 6, ['"text"']));
    });
    test('passes: string of unicode text', () => {
      const state = defaultState('"\u1234"');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('"\u1234"', 3, ['"\u1234"']));
    });
    test('passes: string of escape text', () => {
      const state = defaultState(JSON.stringify('\t'));
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('"\\t"', 4, ['"\\t"']));
    });
    test('fails: an invalid string', () => {
      const state = defaultState('"');
      assert.ok(!valueParser(state));
      assert.deepEqual(state, defaultState('"', 1, ['"'], 'No end of String'));
    });
  });

  describe('arrayParser', () => {
    test('passes: empty array', () => {
      const state = defaultState('[]');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('[]', 2, [['[', ']']]));
      assert.deepEqual(state.results, [['[', ']']]);
    });
    test('fails: malformed array', () => {
      const state = defaultState('[,]');
      assert.ok(!valueParser(state));
      assert.deepEqual(state, defaultState('[,]', 1, ['['], 'No end of Array'));
      assert.deepEqual(state.results, ['[']);
    });
    test('fails: unterminated array', () => {
      const state = defaultState('[');
      assert.ok(!valueParser(state));
      assert.deepEqual(state, defaultState('[', 1, ['['], 'No end of Array'));
      assert.deepEqual(state.results, ['[']);
    });
    test('passes: single-item array', () => {
      const state = defaultState('[ true ]');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('[ true ]', 8, [['[', true, ']']]));
      assert.deepEqual(state.results, [['[', true, ']']]);
    });
    test('fails: incomplete array', () => {
      const state = defaultState('[ true, ]');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState('[ true, ]', 8, ['[', true, ','], 'No value'),
      );
      assert.deepEqual(state.results, ['[', true, ',']);
    });
    test('passes: multi-item array', () => {
      const state = defaultState('[ true, false ]');
      assert.ok(valueParser(state));
      assert.deepEqual(
        state,
        defaultState('[ true, false ]', 15, [['[', true, ',', false, ']']]),
      );
      assert.deepEqual(state.results, [['[', true, ',', false, ']']]);
    });
  });

  describe('objectParser', () => {
    test('passes: empty object', () => {
      const state = defaultState('{}');
      assert.ok(valueParser(state));
      assert.deepEqual(state, defaultState('{}', 2, [['{', '}']]));
      assert.deepEqual(state.results, [['{', '}']]);
    });
    test('fails: malformed object (property separator)', () => {
      const state = defaultState('{,}');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState('{,}', 1, ['{'], 'No end of Object'),
      );
      assert.deepEqual(state.results, ['{']);
    });
    test('fails: malformed object (k-v separator)', () => {
      const state = defaultState('{:}');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState('{:}', 1, ['{'], 'No end of Object'),
      );
      assert.deepEqual(state.results, ['{']);
    });
    test('fails: unterminated object', () => {
      const state = defaultState('{');
      assert.ok(!valueParser(state));
      assert.deepEqual(state, defaultState('{', 1, ['{'], 'No end of Object'));
      assert.deepEqual(state.results, ['{']);
    });
    test('fails: no key-value separator', () => {
      const state = defaultState('{ "hello" }');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState(
          '{ "hello" }',
          10,
          ['{', '"hello"'],
          'Missing key-value separator',
        ),
      );
      assert.deepEqual(state.results, ['{', '"hello"']);
    });
    test('fails: no value', () => {
      const state = defaultState('{ "hello": }');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState(
          '{ "hello": }',
          11,
          ['{', '"hello"', ':'],
          'No property value',
        ),
      );
      assert.deepEqual(state.results, ['{', '"hello"', ':']);
    });
    test('passes: single key-value pair', () => {
      const state = defaultState('{ "hello": "World" }');
      assert.ok(valueParser(state));
      assert.deepEqual(
        state,
        defaultState('{ "hello": "World" }', 20, [
          ['{', '"hello"', ':', '"World"', '}'],
        ]),
      );
      assert.deepEqual(state.results, [['{', '"hello"', ':', '"World"', '}']]);
    });
    test('fails: incomplete object', () => {
      const state = defaultState('{ "hello": "World", }');
      assert.ok(!valueParser(state));
      assert.deepEqual(
        state,
        defaultState(
          '{ "hello": "World", }',
          20,
          ['{', '"hello"', ':', '"World"', ','],
          'No key-value',
        ),
      );
      assert.deepEqual(state.results, ['{', '"hello"', ':', '"World"', ',']);
    });
    test('passes: multi-item key-value pair', () => {
      const state = defaultState('{ "hello": "World", "dont_panic": 42 }');
      assert.ok(valueParser(state));
      assert.deepEqual(
        state,
        defaultState('{ "hello": "World", "dont_panic": 42 }', 38, [
          ['{', '"hello"', ':', '"World"', ',', '"dont_panic"', ':', 42, '}'],
        ]),
      );
      assert.deepEqual(state.results, [
        ['{', '"hello"', ':', '"World"', ',', '"dont_panic"', ':', 42, '}'],
      ]);
    });
  });

  describe('numberParser', () => {
    describe('integer', () => {
      test('passes: zero', () => {
        const state = defaultState('0');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('0', 1, [0]));
      });
      test('passes: minus zero', () => {
        const state = defaultState('-0');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('-0', 2, [-0]));
      });
      test('fails: minus only', () => {
        const state = defaultState('-');
        assert.ok(!valueParser(state));
        assert.deepEqual(state, defaultState('-', 1, ['-'], 'Invalid integer'));
      });
      test('passes: positive value', () => {
        const state = defaultState('42');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('42', 2, [42]));
      });
      test('passes: valid fraction', () => {
        const state = defaultState('1.2');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('1.2', 3, [1.2]));
      });
      test('fails: invalid fraction', () => {
        const state = defaultState('1.');
        assert.ok(!valueParser(state));
        assert.deepEqual(
          state,
          defaultState('1.', 2, ['1', '.'], 'Invalid fraction'),
        );
      });
      test('passes: valid exponent (negative)', () => {
        const state = defaultState('1E-24');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('1E-24', 5, [1e-24]));
      });
      test('passes: valid exponent (positive)', () => {
        const state = defaultState('1e+24');
        assert.ok(valueParser(state));
        assert.deepEqual(state, defaultState('1e+24', 5, [1e24]));
      });
      test('passes: invalid exponent', () => {
        const state = defaultState('1e');
        assert.ok(!valueParser(state));
        assert.deepEqual(
          state,
          defaultState('1e', 2, ['1', 'e'], 'Invalid exponent'),
        );
      });
    });
  });
});
