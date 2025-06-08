/* js/main.js – navegación + utilidades básicas
   ─────────────────────────────────────────── */

import { showToast } from './ui-tickers.js';   // o quita si no hace falta

/* ---------- Estado ----------- */
let currentStep = 1;

/* ---------- Navegación -------- */
export function goToStep(step) {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${step}`).style.display        = 'block';
  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Slider de riesgo -- */
export const updateSliderValue = val =>
  (document.getElementById('risk-slider-value').textContent = `${val}%`);

/* ---------- Collapse toggle --- */
export const toggleCollapse = (id, open) =>
  (document.getElementById(id).style.display = open ? 'block' : 'none');

/* ---------- Eventos iniciales - */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('step-1').style.display = 'block';
  // El botón Optimizar importa optimizer.js dinámicamente
  document.getElementById('btn-optimize').addEventListener('click', () => {
    import('./optimizer.js').then(m => m.runOptimization());
  });
});

/* ---------- Exponer a HTML ---- */
window.goToStep          = goToStep;
window.updateSliderValue = updateSliderValue;
window.toggleCollapse    = toggleCollapse;

