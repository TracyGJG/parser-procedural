import { isSpace, isWhitespace } from './predicates.js';

// UTILITIES
export const advance = (state, length = 1) => {
  const result = state.text.slice(state.index, state.index + length);
  if (result?.length !== length) return '';
  state.results.push(result);
  state.index += length;
  return result;
};

export const EOI = (state) => state.text.length <= state.index;

export const State = (text) => ({
  text,
  index: 0,
  results: [],
  error: '',
});

export function captureToken(token) {
  return (state) => {
    token && state.results.push(token);
    state.index += token?.length || 1;
    return readToken(state);
  };
}

export function consumeSpaces(state) {
  while (isSpace(readToken(state))) captureToken()(state);
  return readToken(state);
}

export function prepareInput(text) {
  return State([...text.trim()].filter((char) => !isWhitespace(char)).join(''));
}

export function readToken(state, length = 1) {
  return state.text.slice(state.index, state.index + length);
}
