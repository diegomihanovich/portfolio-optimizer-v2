export const state = {
  tickers: [],          // símbolos en mayúsculas
  max: 20,
};

export function addTicker(sym) {
  sym = sym.toUpperCase();
  if (!sym || state.tickers.includes(sym) || state.tickers.length >= state.max) return false;
  state.tickers.push(sym);
  return true;
}

export function removeTicker(sym) {
  state.tickers = state.tickers.filter(t => t !== sym);
}
