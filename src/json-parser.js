import { EOI, prepareInput, reportError } from './utils.js';

import { valueParser } from './parsers.js';

const jsonParser = (jsonText) => {
  const state = prepareInput(jsonText);
  if (!valueParser(state)) {
    state.error = 'Invalid JSON string';
  }
  if (state.text.slice(state.index).trim().length) {
    state.error = 'Unexpected content in JSON string';
  }
  return state; //.error || state.results?.[0];
};

export default jsonParser;
