/*  js/store.js
    ⓒ 2025 – Diego + ChatGPT
    Pequeño “store” (patrón singleton) que mantiene el estado global
    y dispara eventos para que el resto de la app reaccione.
------------------------------------------------------------------ */

const store = (() => {

  /* ---------- 1 · Estado central ---------- */
  const state = {
    tickers : [],          // Ej: ['AAPL', 'MSFT']
    prices  : {},          // Ej: { 'AAPL': [ {date:'2024-01-02', close:123.45}, … ] }
    rf      : null,        // Ej: { date:'2025-06-01', value:0.0423 }
    params  : {            // Preferencias de usuario
      maxWeight : 1,       // Límite % por activo (1 → 100 %)
      rebalance : false,   // ¿Rebalanceo automático activado?
    }
  };

  /* ---------- 2 · Getters ---------- */
  const getState = () => {
    // structuredClone evita mutaciones accidentales ✨
    // (fallback simple para navegadores sin soporte)
    return typeof structuredClone === 'function'
      ? structuredClone(state)
      : JSON.parse(JSON.stringify(state));
  };

  /* ---------- 3 · Setters + Eventos ---------- */
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
  /* ---------- 3.b · Helpers retro-compatibilidad ---------- */
  const addTicker = (tkr) => {
    tkr = tkr.trim().toUpperCase();
    if (!tkr) return;
    if (state.tickers.includes(tkr)) return;        // evita duplicados
    state.tickers.push(tkr);
    document.dispatchEvent(
      new CustomEvent('tickersChanged', { detail: state.tickers })
    );
  };

  const removeTicker = (tkr) => {
    const idx = state.tickers.indexOf(tkr);
    if (idx === -1) return;
    state.tickers.splice(idx, 1);
    document.dispatchEvent(
      new CustomEvent('tickersChanged', { detail: state.tickers })
    );
  };

-  /* ---------- 4 · API pública ---------- */
-   return { getState, setTickers, setPrices, setRf, setParams,
-            addTicker, removeTicker };
+  /* ---------- 4 · API pública ---------- */
+  const api = {                     // ← agrupamos para exportar varias veces
+    state,          //  👈  añadido
+    getState, setTickers, setPrices, setRf, setParams,
+    addTicker, removeTicker
+  };
+  return api;

})();

 /* ↓↓↓ Mantén compatibilidad con importación “default” ↓↓↓ */
-export default store;
+export default store;               // default intacto

-/* (fin de archivo) */
+/*  Exponer también exports con nombre para los módulos “viejos”  */
+export const { state, addTicker, removeTicker } = store;

