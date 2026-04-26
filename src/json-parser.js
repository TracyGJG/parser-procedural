import { prepareInput } from './utils.js';

import valueParser from './parsers.js';

const jsonParser = (jsonText) => {
  const state = prepareInput(jsonText);
  const result = valueParser(state);
  const remainder = state.text.slice(state.index).trim().length;

  if (!state.error.length && remainder) {
    state.error = 'Unexpected content in JSON string';
  }
  if (!state.error.length && (!state.results.length || !result)) {
    state.error = 'Invalid JSON string';
  }
  return { results: state.results?.[0], error: state.error };
};

export default jsonParser;
