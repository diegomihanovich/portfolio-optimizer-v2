/* js/main.js – navegación + utilidades básicas
 ─────────────────────────────────────────── */

import { fetchRiskFree } from './dataService.js';

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

/* ---------- Toast sencillo ---------- */
export function showToast(msg, type = 'info') {
  const el = document.getElementById('app-toast');
  el.textContent = msg;
  if      (type === 'warning') { el.style.background = '#FFC107'; el.style.color = '#333'; }
  else if (type === 'error')   { el.style.background = '#DC3545'; el.style.color = '#fff'; }
  else                          { el.style.background = '#7F5AF0'; el.style.color = '#fff'; }
  el.style.display = 'block';
  setTimeout(() => (el.style.display = 'none'), 3500);
}

/* ---------- Eventos iniciales - */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('step-1').style.display = 'block';
  // El botón Optimizar importa optimizer.js dinámicamente
  document.getElementById('btn-optimize').addEventListener('click', () => {
    import('./optimizer.js').then(m => m.runOptimization());
  });
});

document.getElementById('btn-rf-refresh')
  .addEventListener('click', async () => {
    const rf = await fetchRiskFree();
    document.getElementById('risk-free-rate').value = rf.value.toFixed(4);
  });

/* ---------- Exponer a HTML ---- */
window.goToStep          = goToStep;
window.updateSliderValue = updateSliderValue;
window.toggleCollapse    = toggleCollapse;
window.showToast = showToast;
