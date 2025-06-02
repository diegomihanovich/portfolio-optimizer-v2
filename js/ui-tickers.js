import { state, addTicker, removeTicker } from './store.js';
import { showToast }                        from './main.js';   // ya existe

/* ---- DOM refs ---- */
const input      = document.getElementById('ticker-search');
const chipBox    = document.getElementById('ticker-chips');
const addBtn     = document.getElementById('btn-add-ticker');     // le pondremos este id
const counterP   = document.getElementById('asset-counter');      // opcional
const acList     = document.createElement('ul');                  // lista sugerencias
acList.id = 'acList';
acList.className = 'autocomplete-list';
input.parentNode.appendChild(acList);

/* ---- Autocompletado: bajamos JSON 1 sola vez ---- */
const TICKERS_URL =
  'https://raw.githubusercontent.com/diegomihanovich/portfolio-optimizer/main/data/company_tickers.json';
let fullList = null;

async function loadTickers() {
  if (fullList) return;
  const obj = await fetch(TICKERS_URL).then(r => r.json());
  fullList  = Object.values(obj).map(o => o.ticker.toUpperCase());
}

/* ---- Render chips ---- */
function refreshChips() {
  chipBox.innerHTML = '';
  state.tickers.forEach(t => {
    const span = document.createElement('span');
    span.className = 'ticker-chip sector-other';   // color aleatorio opcional
    span.textContent = t;
    span.title = 'Quitar';
    span.onclick = () => { removeTicker(t); refreshChips(); };
    chipBox.appendChild(span);
  });

  if (counterP) counterP.textContent = `${state.tickers.length}/${state.max}`;
  addBtn.disabled = state.tickers.length >= state.max;
}

/* ---- Añadir ticker desde input ---- */
function handleAdd() {
  const ok = addTicker(input.value.trim());
  if (!ok) {
    showToast('Ticker repetido o límite alcanzado', 'warning');
  }
  input.value = '';
  acList.innerHTML = '';
  refreshChips();
}

/* ---- Eventos ---- */
input.addEventListener('input', async () => {
  const q = input.value.trim().toUpperCase();
  acList.innerHTML = '';
  if (q.length < 2) return;

  await loadTickers();
  fullList
    .filter(s => s.includes(q))
    .slice(0, 12)
    .forEach(sym => {
      const li = document.createElement('li');
      li.textContent = sym;
      li.onclick = () => { input.value = sym; handleAdd(); };
      acList.appendChild(li);
    });
});
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
});
addBtn.addEventListener('click', handleAdd);

/* ---- init ---- */
refreshChips();
