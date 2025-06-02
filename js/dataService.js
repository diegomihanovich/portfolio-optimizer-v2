/* dataService.js  –  descarga precios y tasa libre de riesgo */

const PROXY   = url => 'https://corsproxy.io/?' + encodeURIComponent(url);
const FREQMAP = { daily:'d', weekly:'w', monthly:'m' };

/* ---------- 1. Históricos de precios (Stooq) ---------- */
export async function fetchHistory(ticker, freq = 'daily') {
  const key = `px_${ticker}_${freq}`;
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const url = `https://stooq.com/q/d/l/?s=${ticker}.US&i=${FREQMAP[freq]}`;
  const csv = await fetch(PROXY(url)).then(r => r.text());
  const { data } = Papa.parse(csv, { header:true, dynamicTyping:true });

  // Limpieza: Date & Close válidos
  const rows = data.filter(r => r.Date && r.Close);
  localStorage.setItem(key, JSON.stringify(rows));
  return rows;
}

/* ---------- 2. Tasa libre de riesgo ---------- */
export async function updateRiskFree() {
  const input = document.getElementById('risk-free-rate');
  input.placeholder = '…';

  try {
    const fred = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTB3';
    const csv  = await fetch(PROXY(fred)).then(r => r.text());
    const last = csv.trim().split('\n').pop().split(',')[1];
    const rate = parseFloat(last);
    if (!isNaN(rate)) { input.value = rate.toFixed(2); return; }
  } catch { /* fall-through */ }

  try {
    const stooq = 'https://stooq.com/q/l/?s=%5EIRX.US&i=d';
    const csv   = await fetch(PROXY(stooq)).then(r => r.text());
    const close = parseFloat(csv.split('\n')[1].split(',')[4]);
    if (!isNaN(close)) { input.value = (close/100).toFixed(2); return; }
  } catch { /* ignore */ }

  input.placeholder = '';
  alert('No pude actualizar la tasa libre de riesgo.');
}
