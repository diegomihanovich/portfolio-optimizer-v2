/*  js/store.js
    ⓒ 2025 – Diego + ChatGPT
    “Store” (patrón singleton) con estado global + eventos
------------------------------------------------------------- */

const store = (() => {

  /* ---------- 1 · Estado central ---------- */
  const state = {
    tickers : [],          // e.g. ['AAPL', 'MSFT']
    prices  : {},          // e.g. { 'AAPL': [ {date:'2024-01-02', close:123.45}, … ] }
    rf      : null,        // e.g. { date:'2025-06-01', value:0.0423 }
    max     : 12,          // tope visual para ui-tickers
    params  : {
      maxWeight : 1,       // límite % por activo (1 → 100 %)
      rebalance : false    // rebalanceo automático
    }
  };

  /* ---------- 2 · Getter seguro ---------- */
  const getState = () =>
    (typeof structuredClone === 'function')
      ? structuredClone(state)
      : JSON.parse(JSON.stringify(state));

  /* ---------- 3 · Setters + eventos ---------- */
  const setTickers = (arr) => {
    state.tickers = arr;
    document.dispatchEvent(
      new CustomEvent('tickersChanged', { detail: arr })
    );
  };

  const setPrices = (ticker, rows) => {
    state.prices[ticker] = rows;
    document.dispatchEvent(
      new CustomEvent('pricesReady', { detail: { ticker } })
    );
  };

  const setRf = (rfObj) => {
    state.rf = rfObj;
    document.dispatchEvent(
      new CustomEvent('rfReady', { detail: rfObj })
    );
  };

  const setParams = (newParams) => {
    Object.assign(state.params, newParams);
    document.dispatchEvent(
      new CustomEvent('paramsChanged', { detail: state.params })
    );
  };

  /* ---------- 3.b · Helpers retro-compat ---------- */
  const addTicker = (tkr) => {
    tkr = tkr.trim().toUpperCase();
    if (!tkr) return false;
    if (state.tickers.includes(tkr) || state.tickers.length >= state.max) return false;
    state.tickers.push(tkr);
    document.dispatchEvent(
      new CustomEvent('tickersChanged', { detail: state.tickers })
    );
    return true;
  };

  const removeTicker = (tkr) => {
    const idx = state.tickers.indexOf(tkr);
    if (idx === -1) return;
    state.tickers.splice(idx, 1);
    document.dispatchEvent(
      new CustomEvent('tickersChanged', { detail: state.tickers })
    );
  };

  /* ---------- 4 · API pública ---------- */
  const api = {
    state,
    getState, setTickers, setPrices, setRf, setParams,
    addTicker, removeTicker
  };

  return api;
})();

/* Export default + named (para módulos antiguos) */
export default store;
export const { state, addTicker, removeTicker } = store;
