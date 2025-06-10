/* ui-tickers.js – buscador y chips de activos
   ------------------------------------------------------------ */
import { state, addTicker, removeTicker } from './store.js';
import { showToast }                       from './main.js';

/* 1. Referencias al DOM  */
const input    = document.getElementById('ticker-search');
const addBtn   = document.getElementById('btn-add-ticker');
const chipBox  = document.getElementById('ticker-chips');
const counterP = document.getElementById('asset-counter');

/* Lista UL para sugerencias  */
const acList = document.createElement('ul');
acList.id = 'acList';
acList.style.listStyle = 'none';
acList.style.padding   = '4px 0';
acList.style.margin    = 0;
acList.style.position  = 'absolute';
acList.style.background = '#1E2128';
acList.style.border     = '1px solid #3A3F4B';
acList.style.maxHeight  = '160px';
acList.style.overflowY  = 'auto';
acList.style.zIndex     = 1000;
input.parentNode.appendChild(acList);

/* 2. Descargar y cachear la lista de tickers  */
const TICKERS_URL = '/portfolio-optimizer-v2/data/company_tickers.json';
let fullList = null;

async function loadTickers () {
  if (fullList) return;
  try {
    const txt  = await fetch(TICKERS_URL).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
    const clean = txt.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    const obj   = JSON.parse(clean);
    fullList    = Object.values(obj).map(o => ({
      symbol : o.ticker.toUpperCase(),
      name   : o.title
    }));
  } catch (err) {
    console.error('tickers JSON malformado', err);
    showToast('Error cargando la lista de activos', 'error');
  }
}

/* 3. Redibuja chips + contador  */
function refreshChips () {
  chipBox.innerHTML = '';
  state.tickers.forEach(sym => {
    const span = document.createElement('span');
    span.className = 'ticker-chip sector-other';
    span.textContent = sym;
    span.title = 'Quitar';

    /* borrar chip → el store ya emite tickersChanged */
    span.onclick = () => {
      removeTicker(sym);   // evento ya disparado internamente
      refreshChips();      // solo actualizamos la vista
    };
    chipBox.appendChild(span);
  });

  counterP.textContent = `${state.tickers.length}/${state.max}`;
  addBtn.disabled      = state.tickers.length >= state.max;
}

/* 4. Añadir ticker desde el input  */
function handleAdd () {
  const ok = addTicker(input.value.trim());   // evento emitido por el store
  if (!ok) showToast('Ticker repetido o límite alcanzado', 'warning');

  input.value = '';
  acList.innerHTML = '';
  refreshChips();             // refresco local – ¡sin re-emitir!
}

/* 5. Autocompletado */
input.addEventListener('input', async () => {
  const q = input.value.trim().toLowerCase();
  acList.innerHTML = '';
  if (q.length < 2) return;

  await loadTickers();
  fullList
    .filter(t => t.symbol.toLowerCase().includes(q) ||
                 t.name  .toLowerCase().includes(q))
    .slice(0, 12)
    .forEach(t => {
      const li = document.createElement('li');
      li.style.padding = '4px 8px';
      li.style.cursor  = 'pointer';
      li.textContent   = `${t.symbol} – ${t.name}`;
      li.onmouseover   = () => li.style.background = '#3A3F4B';
      li.onmouseout    = () => li.style.background = 'transparent';
      li.onclick       = () => { input.value = t.symbol; handleAdd(); };
      acList.appendChild(li);
    });
});

/* Enter = añade lo primero sugerido o lo escrito */
input.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  (acList.querySelector('li') || { click: handleAdd }).click();
});

/* Clic fuera → cierra lista */
document.addEventListener('click', e => {
  if (e.target !== input) acList.innerHTML = '';
});

/* Botón “Añadir” */
addBtn.addEventListener('click', handleAdd);

/* Init */
refreshChips();
