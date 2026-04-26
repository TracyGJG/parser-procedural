import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import jsonParser from '../src/json-parser.js';

describe('JSON Parser', () => {
  describe('passes parsing of:', () => {
    test('base vales', () => {
      assert.deepEqual(jsonParser('  true  '), { error: '', results: true });
      assert.deepEqual(jsonParser('  false  '), { error: '', results: false });
      assert.deepEqual(jsonParser('  null  '), { error: '', results: null });
    });
    test('strings', () => {
      assert.deepEqual(jsonParser('  ""  '), { error: '', results: '""' });
      assert.deepEqual(jsonParser('  " "  '), { error: '', results: '" "' });
      assert.deepEqual(
        jsonParser(`  "Hello, World! \n\tThat's All folkes."  `),
        {
          error: '',
          results: '"Hello, World! That\'s All folkes."',
        },
      );
    });
  });
  describe('fails parsing of:', () => {
    test('bad documents', () => {
      assert.deepEqual(jsonParser('    '), {
        error: 'Invalid JSON string',
        results: undefined,
      });
      assert.deepEqual(jsonParser('  test  '), {
        error: 'Unexpected content in JSON string',
        results: undefined,
      });
      assert.deepEqual(jsonParser('  true false  '), {
        error: 'Unexpected content in JSON string',
        results: true,
      });
    });
  });
});
