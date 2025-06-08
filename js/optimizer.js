/*  js/optimizer.js
    Monte-Carlo Efficient Frontier + KPIs
------------------------------------------------ */

import store             from './store.js';
import { loadPricesFor } from './dataService.js';
import { logReturns, mean, covariance } from './stats.js';

/* Config */
const N_PORTFOLIOS = 5000;
const RF = 0;                       // (dec.) actualizaremos luego con store.state.rf

/* DOM refs */
const chartDiv = document.getElementById('efficient-frontier-chart');
const metricRet   = document.getElementById('metric-return');
const metricVol   = document.getElementById('metric-volatility');
const metricSharpe= document.getElementById('metric-sharpe');

/* ----------------------------------------------------------- */
export async function runOptimization () {
  const { tickers, prices, rf } = store.state;
  if (tickers.length < 2) {
    alert('Añade al menos 2 activos.');
    return;
  }

  /* 1. Asegúrate de que todas las series estén descargadas */
  const pending = tickers.filter(t => !prices[t]);
  if (pending.length) await loadPricesFor(pending);

  /* 2. Matrices de retornos */
  const series = tickers.map(t => logReturns(prices[t]));
  const minLen = Math.min(...series.map(s => s.length));
  const aligned = series.map(s => s.slice(-minLen));

  /* 3. Promedios y matriz de covarianzas */
  const μ = aligned.map(s => mean(s) * 252);               // anualizar (≈252 días)
  const Σ = aligned.map((a, i) =>
      aligned.map((b, j) => covariance(a, b) * 252)        // anualizar var-cov
  );

  const results = [];          // {w, ret, vol, sharpe}

  /* 4. Monte-Carlo */
  for (let k = 0; k < N_PORTFOLIOS; k++) {
    /* 4.a Pesos aleatorios que sumen 1 */
    let w = tickers.map(() => Math.random());
    const wSum = w.reduce((s, x) => s + x, 0);
    w = w.map(x => x / wSum);

    /* 4.b KPIs */
    const ret = w.reduce((s, x, i) => s + x * μ[i], 0);
    let  varP = 0;
    for (let i = 0; i < w.length; i++) {
      for (let j = 0; j < w.length; j++) {
        varP += w[i] * w[j] * Σ[i][j];
      }
    }
    const vol = Math.sqrt(varP);
    const sharpe = (ret - (rf?.value || RF)) / vol;

    results.push({ w, ret, vol, sharpe });
  }

  /* 5. Seleccionar portafolios clave */
  const bestSharpe = results.reduce((a, b) => b.sharpe > a.sharpe ? b : a);
  const minVar     = results.reduce((a, b) => b.vol    < a.vol    ? b : a);

  /* 6. Scatter Plotly */
  const scat = {
    x  : results.map(r => r.vol * 100),
    y  : results.map(r => r.ret * 100),
    mode: 'markers',
    type: 'scatter',
    marker: { size: 4, opacity: 0.3, color: '#888' },
    name: 'Portafolios'
  };

  const star = {
    x: [bestSharpe.vol * 100],
    y: [bestSharpe.ret * 100],
    mode: 'markers+text',
    type: 'scatter',
    marker: { size: 12, symbol: 'star', color: 'gold' },
    text: ['★ Máx Sharpe'],
    textposition: 'top center',
    name: 'Óptimo'
  };

  const layout = {
    xaxis: { title: 'Volatilidad % (σ)', ticksuffix:'%' },
    yaxis: { title: 'Retorno esperado %', ticksuffix:'%' },
    margin:{l:50,r:20,t:30,b:50},
    width: 350, height: 300,
    showlegend:false
  };

  Plotly.newPlot(chartDiv, [scat, star], layout, {displayModeBar:false});

  /* 7. Actualiza métricas */
  metricRet.textContent    = (bestSharpe.ret * 100).toFixed(1) + '%';
  metricVol.textContent    = (bestSharpe.vol * 100).toFixed(1) + '%';
  metricSharpe.textContent = bestSharpe.sharpe.toFixed(2);
}
/* 8. Doughnut de pesos */
const weightsFig = [{
  labels: tickers,
  values: bestSharpe.w.map(w => +(w * 100).toFixed(1)), // array de porcentajes
  type: 'pie',
  hole: 0.5,
  textinfo: 'label+percent'
}];

Plotly.newPlot(
  'portfolio-weights-chart',    // id del div en Paso-3
  weightsFig,
  { margin: { t: 10, l: 10, r: 10, b: 10 }, showlegend: false },
  { displayModeBar: false }
);

/* Exponer función global para el botón “Optimizar”  */
window.runOptimization = runOptimization;
