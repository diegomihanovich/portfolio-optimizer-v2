/*  js/dataService.js
    Descarga precios OHLC de Stooq + tasa RF de FRED.
    Cachea en localStorage y actualiza el store global
----------------------------------------------------------- */

import store from './store.js';

/* ---------- 0 · Helpers ---------- */
const PROXY = 'https://corsproxy.io/?';
const STQ_URL = (tkr, freq = 'daily') => {
  const map = { daily: 'd', weekly: 'w', monthly: 'm' };
  const i = map[freq] || 'd';
  return `https://stooq.com/q/d/l/?s=${tkr.toLowerCase()}.us&i=${i}`;
};
const RF_URL  = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTB3';

/* Wrapper fetch con retry (2 intentos) */
async function fetchRetry (url, tries = 2) {
  try { return await fetch(url); }
  catch (err) {
    if (tries <= 1) throw err;
    await new Promise(r => setTimeout(r, 1500));  // 1,5 s
    return fetchRetry(url, tries - 1);
  }
}

/* ---------- 1 · Precios históricos ---------- */
export async function fetchHistory (ticker, freq = 'daily', range = '5y') {
  const key = `${ticker}_${freq}_${range}`;
  if (localStorage[key]) {
    /* ① Cache hit */
    const rows = JSON.parse(localStorage[key]);
    store.setPrices(ticker, rows);
    return rows;
  }

  /* ② Cache miss → descargamos CSV Stooq */
  const url = PROXY + encodeURIComponent(STQ_URL(ticker, freq));
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const csv = await res.text();

  /* ③ Limpiar y parsear: devolvemos [{date:'YYYY-MM-DD', Close: n}] */
  let rows = csv.trim().split('\n')
    .slice(1)                         // quitamos cabecera
    .map(line => {
      const [d, o, h, l, c] = line.split(',');
      return { date: d, Close: +c };
    })
    .filter(r => !isNaN(r.Close))     // quitamos huecos
    .reverse();                       // ascendente

  const factor = freq === 'weekly' ? 52
                : freq === 'monthly' ? 12
                : 252;
  const years = parseInt(range) || 5;
  const limit = years * factor;
  rows = rows.slice(-limit);

  /* ④ Guardamos en cache + store */
 try {
 localStorage[key] = JSON.stringify(rows);
} catch (e) {
console.warn('LocalStorage lleno, no se cachea', key);
}
    store.setPrices(ticker, rows);
    return rows;
}

/* ---------- 2 · Tasa libre de riesgo ---------- */
export async function fetchRiskFree () {
  if (store.state.rf) {
    document.getElementById('risk-free-rate').value =
      store.state.rf.value.toFixed(4);
    return store.state.rf;   // ya la tenemos
  }

  const url = PROXY + encodeURIComponent(RF_URL);
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`RF HTTP ${res.status}`);

  /* CSV: fecha,valor … tomamos la última fila válida */
  const lines = (await res.text()).trim().split('\n');
  const last  = lines[lines.length - 1].split(',');
  const rfObj = { date: last[0], value: +last[1] / 100 }; // %→decimal

  store.setRf(rfObj);
  document.getElementById('risk-free-rate').value = rfObj.value.toFixed(4);
  return rfObj;
}

/* ---------- 3 · Batch para lista de tickers ---------- */
export async function loadPricesFor (tickers, freq = 'daily', range = '5y') {
  if (!Array.isArray(tickers) || tickers.length === 0) return;
  document.body.classList.add('loading');        // spinner simple

  try {
    await Promise.all(tickers.map(t => fetchHistory(t, freq, range)));
  } finally {
    document.body.classList.remove('loading');
  }
}
