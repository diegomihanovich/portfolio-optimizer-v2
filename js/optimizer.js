/*  js/optimizer.js
    Monte-Carlo Efficient Frontier + Doughnut de pesos
    ------------------------------------------------- */

import store             from './store.js';
import { loadPricesFor } from './dataService.js';
import { logReturns, mean, covariance } from './stats.js';

/* Config */
const N_PORTFOLIOS = 5000;

/* Referencias DOM (Paso-3) */
const chartDiv  = document.getElementById('efficient-frontier-chart');
const donutDiv  = document.getElementById('portfolio-weights-chart');
const metricRet = document.getElementById('metric-return');
const metricVol = document.getElementById('metric-volatility');
const metricShr = document.getElementById('metric-sharpe');

/* Función principal -------------------------------------------------------- */
export async function runOptimization () {

  /* 1. Verifica tickers seleccionados y descarga OHLC faltantes */
  const { tickers, prices, rf } = store.state;
  if (tickers.length < 2) {
    alert('Añade al menos 2 activos antes de optimizar.');   // UX rápida
    return;
  }

  const pending = tickers.filter(t => !prices[t]);
  if (pending.length) await loadPricesFor(pending);

  /* 2. Arma series de retornos log */
  const series = tickers.map(t => logReturns(prices[t]));
  const minLen = Math.min(...series.map(s => s.length));
  const aligned = series.map(s => s.slice(-minLen));          // misma longitud

  /* 3. Estadísticos anuales */
  const μ = aligned.map(s => mean(s) * 252);                  // retorno esp.
  const Σ = aligned.map(a =>
              aligned.map(b => covariance(a, b) * 252));      // matriz cov.

  const rfVal = rf?.value || 0;

  /* 4. Monte-Carlo -------------------------------------------------------- */
  const results = [];                                         // guarda KPIs

  const capInput = document.getElementById('max-asset-percentage');
  let cap = capInput ? +capInput.value / 100 : 1;
  if (!isFinite(cap) || cap <= 0) cap = 1;
  if (cap * tickers.length < 1) cap = 1;        // fallback if impossible

  for (let k = 0; k < N_PORTFOLIOS; k++) {

    // 4.a Pesos aleatorios que sumen 1 respetando el tope
    let w;
    do {
      w = tickers.map(() => Math.random());
      const sum = w.reduce((s, x) => s + x, 0);
      w = w.map(x => x / sum);
    } while (w.some(x => x > cap));

    // 4.b Retorno, varianza, σ, Sharpe
    const ret = w.reduce((s, x, i) => s + x * μ[i], 0);

    let varP = 0;
    for (let i = 0; i < w.length; i++)
      for (let j = 0; j < w.length; j++)
        varP += w[i] * w[j] * Σ[i][j];

    const vol    = Math.sqrt(varP);
    const sharpe = (ret - rfVal) / vol;

    results.push({ w, ret, vol, sharpe });
  }

  /* 5. Selecciona portafolio Máx-Sharpe */
  const best = results.reduce((a,b)=> b.sharpe > a.sharpe ? b : a);

  /* 5.b Filtra por tolerancia de riesgo ------------------------------- */
  const slider = document.getElementById('risk-slider');
  const pct     = slider ? +slider.value : 100;           // 0-100
  const minVol  = Math.min(...results.map(r=>r.vol));
  const maxVol  = Math.max(...results.map(r=>r.vol));
  const target  = minVol + (pct/100) * (maxVol - minVol);
  const subset  = results.filter(r => r.vol <= target);
  const choice  = subset.length
    ? subset.reduce((a,b)=> b.sharpe > a.sharpe ? b : a)
    : best;

  /* 6. Scatter + estrellita ---------------------------------------------- */
  const scat = {
    x: results.map(r => r.vol * 100),
    y: results.map(r => r.ret * 100),
    mode:'markers', type:'scatter',
    marker:{size:4,opacity:.3,color:'#888'},
    name:'Portafolios'
  };

  const star = {
    x:[choice.vol*100], y:[choice.ret*100],
    mode:'markers+text', type:'scatter',
    marker:{size:12,symbol:'star',color:'gold'},
    text:['★ max sharpe'], textposition:'top center'
  };

  Plotly.newPlot(
    chartDiv, [scat, star],
    { xaxis:{title:'Volatilidad %'}, yaxis:{title:'Retorno esperado %'},
      margin:{l:40,r:20,t:20,b:40}, width:320,height:280, showlegend:false },
    { displayModeBar:false }
  );

  /* 7. KPI en pantalla */
  metricRet.textContent = (choice.ret*100).toFixed(1)+'%';
  metricVol.textContent = (choice.vol*100).toFixed(1)+'%';
  metricShr.textContent = choice.sharpe.toFixed(2);

  /* 8. Doughnut de pesos -------------------------------------------------- */
  const donut = [{
    labels: tickers,
    values: choice.w.map(w=>+(w*100).toFixed(1)),
    type:'pie', hole:0.5, textinfo:'label+percent'
  }];

  Plotly.newPlot(
    donutDiv, donut,
    { margin:{t:10,l:10,r:10,b:10}, showlegend:false },
    { displayModeBar:false }
  );
}

/* Haz accesible para el import dinámico en main.html */
window.runOptimization = runOptimization;
