/*  js/stats.js
    Helpers numéricos (retornos, media, covarianzas, correlaciones)
------------------------------------------------------------------ */

/* 1. Log-returns de una serie [{date, Close}] → [r1, r2, …] */
export function logReturns (rows) {
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = Math.log(rows[i].Close / rows[i - 1].Close);
    if (isFinite(r)) out.push(r);
  }
  return out;
}

/* 2. Media aritmética */
export const mean = arr => arr.reduce((s, x) => s + x, 0) / arr.length;

/* 3. Covarianza entre dos arrays */
export function covariance (a, b) {
  const μa = mean(a), μb = mean(b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - μa) * (b[i] - μb);
  return sum / (a.length - 1);
}

/* 4. Correlación ρ */
export const correlation = (a, b) =>
  covariance(a, b) / Math.sqrt(covariance(a, a) * covariance(b, b));

/* 5. Matriz de correlación => {matrix, avg} */
export function corrMatrix (series) {
  const n = series.length;
  const M = Array.from({ length: n }, () => Array(n).fill(1));

  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ρ = correlation(series[i].rets, series[j].rets);
      M[i][j] = M[j][i] = ρ;
      sum += ρ; count++;
    }
  }
  return { matrix: M, avg: count ? sum / count : 0 };
}

/* 6. Diversification Score = (1 – |avgCorr|)×100 redondeado */
export const diversificationScore = avgCorr =>
  Math.round((1 - Math.abs(avgCorr)) * 100);
