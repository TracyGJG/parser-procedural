import { isSpace, isWhitespace } from './predicates.js';

// UTILITIES
export const State = (text) => ({
  text,
  index: 0,
  results: [],
  error: '',
});
export const inError = (State) => !!State.error;
export const reportError = (errMsg, parser) => (state) => {
  if (!parser?.(state)) {
    state.error ||= `Error @${state.index}: ${errMsg}`;
  }
  return state;
};
export const EOI = (state) => state.text.length <= state.index;
export const readText = (state, length = 1) =>
  state.text.slice(state.index, state.index + length);
export const advance = (state, length = 1) => {
  const result = state.text.slice(state.index, state.index + length);
  if (result?.length !== length) return '';
  state.results.push(result);
  state.index += length;
  return result;
};

export function Parser(predicate, options = {}) {
  const { size, ignoreWhitespace, errorWhitespace } = {
    size: 1,
    errorWhitespace: false,
    ignoreWhitespace: true,
    ...options,
  };
  return (state) => {
    let nextChar = readText(state, size);
    if (errorWhitespace && isSpace(nextChar)) return false;
    ignoreWhitespace &&
      consumeWhitespace(state) &&
      (nextChar = readText(state, size));
    return predicate(nextChar) && advance(state, size);
  };
}
export const ParserWithWhitespace = (predicate, options = {}) =>
  Parser(predicate, { ...options, ignoreWhitespace: false });
export const ParserWithoutWhitespace = (predicate, options = {}) =>
  Parser(predicate, { ...options, errorWhitespace: true });

export function prepareInput(text) {
  return State([...text.trim()].filter((char) => !isWhitespace(char)).join(''));
}

export function consumeWhitespace(state) {
  let nextChar = readText(state);
  while (!EOI(state)) {
    if (isWhitespace(nextChar) || isSpace(nextChar)) {
      state.index++;
      nextChar = readText(state);
    } else {
      break;
    }
  }
  return state;
}

//======================

export function readToken(state, length = 1) {
  return state.text.slice(state.index, state.index + length);
}

export function captureToken(token) {
  return (state) => {
    token && state.results.push(token);
    state.index += token.length || 1;
  };
}
