/*  js/heatmap.js
    Construye heat-map de correlaciones + métricas de diversificación
-------------------------------------------------------------------- */

import store             from './store.js';
import { loadPricesFor } from './dataService.js';
import {
  logReturns, corrMatrix, diversificationScore
} from './stats.js';

/* 1. Referencias a elementos del DOM */
const divHeat = document.getElementById('correlation-heatmap');
const spanAvg = document.getElementById('avg-correlation');
const spanDiv = document.getElementById('diversification-score-value');

/* 2. Re-dibujo bajo demanda */
async function refreshHeatmap () {
  const { tickers, prices } = store.state;

  /* Mostrar placeholder si hay <2 activos */
  if (tickers.length < 2) {
    clearHeatmap('Añade al menos 2 activos');
    return;
  }

  /* ¿Tenemos datos OHLC para todos?  Si no, descargamos. */
  const pending = tickers.filter(t => !prices[t]);
  if (pending.length) {
    await loadPricesFor(pending);
    /* volveremos a entrar cuando pricesReady dispare de nuevo */
    return;
  }

  /* 3. Construimos series de retornos alineadas */
  const series = tickers.map(t => ({
    name : t,
    rets : logReturns(prices[t])
  }));

  /* Emparejar por longitud mínima */
  const minLen = Math.min(...series.map(s => s.rets.length));
  series.forEach(s => { s.rets = s.rets.slice(-minLen); });

  /* 4. Matriz de correlación */
  const { matrix, avg } = corrMatrix(series);

  /* 5. Plotly heat-map */
  const data = [{
    z      : matrix,
    x      : tickers,
    y      : tickers,
    type   : 'heatmap',
    colorscale : 'Viridis',
    zmin   : -1,
    zmax   : 1,
  }];

  const layout = {
    margin: { l:40, r:40, t:30, b:40 },
    width : 300,
    height: 300,
  };

  Plotly.newPlot(divHeat, data, layout, { displayModeBar:false });

  /* 6. KPI en pantalla */
  spanAvg.textContent = avg.toFixed(2);
  spanDiv.textContent = diversificationScore(avg);
}

/* Borra gráfico y muestra mensaje opcional */
function clearHeatmap (msg = 'Heatmap de Correlación') {
  divHeat.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:#777">
                         ${msg}
                       </div>`;
  spanAvg.textContent = '—';
  spanDiv.textContent = '—';
}

/* 7. Escuchamos cambios de datos */
document.addEventListener('tickersChanged', refreshHeatmap);
document.addEventListener('pricesReady',   refreshHeatmap);

/* 8. Init */
clearHeatmap();
