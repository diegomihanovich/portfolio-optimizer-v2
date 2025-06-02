/* heatmap.js – calcula matriz de correlaciones y dibuja Heatmap */
import { fetchHistory } from './dataService.js';

let debounceId = null;

/* Escucha cuando cambian los tickers */
document.addEventListener('tickersChanged', e => {
  const tickers = e.detail;
  if (tickers.length < 2) {
    clearHeatmap();
    return;
  }
  /* debounce 800 ms */
  clearTimeout(debounceId);
  debounceId = setTimeout(() => buildHeatmap(tickers), 800);
});

function clearHeatmap() {
  document.getElementById('correlation-heatmap').innerHTML =
    'Heatmap de Correlación';
  document.getElementById('avg-correlation').textContent = '—';
  document.getElementById('diversification-score-value').textContent = '--';
}

async function buildHeatmap(tickers) {
  try {
    /* 1. Descarga precios diarios */
    const sets = await Promise.all(
      tickers.map(t => fetchHistory(t, 'daily'))
    );

    /* 2. Rendimientos log   r_t = ln(P_t / P_{t-1}) */
    const rets = sets.map(rows => rows.slice(1).map((r,i) => {
      const p0 = rows[i].Close;
      const p1 = rows[i+1].Close;
      return Math.log(p1 / p0);
    }));

    /* 3. Alinear por longitud mínima */
    const minLen = Math.min(...rets.map(r => r.length));
    const aligned = rets.map(r => r.slice(-minLen));

    /* 4. Matriz de correlaciones */
    const corr = aligned.map((x,i) =>
      aligned.map((y,j) => pearson(x,y))
    );

    /* 5. Correlación media y score */
    const flat   = corr.flat().filter((_,i)=> i % (tickers.length+1) !== 0); // sin diag.
    const avgR   = flat.reduce((s,v)=>s+v,0) / flat.length;
    const score  = Math.round((1 - Math.abs(avgR)) * 100);

    /* 6. Plotly heatmap */
    Plotly.newPlot('correlation-heatmap', [{
      z: corr,
      x: tickers, y: tickers,
      type: 'heatmap',
      colorscale: 'RdBu',
      zmin: -1, zmax: 1,
      showscale: false
    }], {
      margin:{l:40,r:0,t:0,b:40},
    }, {displayModeBar:false});

    /* 7. Actualiza textos */
    document.getElementById('avg-correlation').textContent = avgR.toFixed(2);
    document.getElementById('diversification-score-value').textContent = score;

  } catch(err) {
    console.error(err);
    clearHeatmap();
    showToast('No pude calcular correlaciones', 'error');
  }
}

/* ---------- helper: Pearson r ---------- */
function pearson(x, y) {
  const n  = x.length;
  const mx = x.reduce((s,v)=>s+v,0) / n;
  const my = y.reduce((s,v)=>s+v,0) / n;
  let num=0, dx=0, dy=0;
  for (let i=0;i<n;i++){
    const a = x[i]-mx, b = y[i]-my;
    num += a*b; dx += a*a; dy += b*b;
  }
  return num / Math.sqrt(dx*dy);
}
