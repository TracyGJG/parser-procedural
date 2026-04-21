import { EOI, prepareInput, reportError } from './utils.js';

import { valueModel as valueParser } from './parsers.js';

const jsonParser = (jsonText) => {
  const state = prepareInput(jsonText);
  valueParser(state);
  return state; //.error || state.results?.[0];
};

export default jsonParser;
