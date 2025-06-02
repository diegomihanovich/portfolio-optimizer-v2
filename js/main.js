/* ---------- Estado mínimo ---------- */
let currentStep = 1;

/* ---------- Navegación entre pasos ---------- */
export function goToStep(step) {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${step}`).style.display = 'block';
  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Añadir ticker ---------- */
export function addTicker() {
  const input = document.getElementById('ticker-search');
  const value = input.value.trim().toUpperCase();
  if (!value) return;

  const chipBox = document.getElementById('ticker-chips');
  if (chipBox.children.length >= 10) {
    showToast('Límite de tickers para demo alcanzado', 'warning');
    return;
  }

  const chip = document.createElement('span');
  chip.classList.add('ticker-chip');
  const sectors = ['sector-tech', 'sector-finance', 'sector-energy', 'sector-other'];
  chip.classList.add(sectors[Math.floor(Math.random() * sectors.length)]);
  chip.textContent = value;
  chipBox.appendChild(chip);
  input.value = '';

  // Demo: refresco aleatorio de correlación y score
  document.getElementById('avg-correlation').textContent =
    (Math.random() * 0.5 + 0.1).toFixed(2);
  document.getElementById('diversification-score-value').textContent =
    Math.floor(Math.random() * 50 + 50);
}

/* ---------- Slider de riesgo ---------- */
export function updateSliderValue(val) {
  document.getElementById('risk-slider-value').textContent = `${val}%`;
}

/* ---------- Mostrar / ocultar collapses ---------- */
export function toggleCollapse(id, open) {
  document.getElementById(id).style.display = open ? 'block' : 'none';
}

/* ---------- Toast sencillo ---------- */
export function showToast(msg, type = 'info') {
  const el = document.getElementById('app-toast');
  el.textContent = msg;
  if (type === 'warning')      { el.style.background = '#FFC107'; el.style.color = '#333'; }
  else if (type === 'error')   { el.style.background = '#DC3545'; el.style.color = '#fff'; }
  else                         { el.style.background = '#7F5AF0'; el.style.color = '#fff'; }
  el.style.display = 'block';
  setTimeout(() => (el.style.display = 'none'), 3500);
}

/* ---------- Simulación de optimización ---------- */
export function runOptimization() {
  showToast('Optimizando… (demo)', 'info');
  if (currentStep !== 3) goToStep(3);

  // Rellena métricas con números aleatorios de demo
  document.getElementById('metric-return').textContent     = `${(Math.random()*15+5).toFixed(1)}%`;
  document.getElementById('metric-volatility').textContent = `${(Math.random()*20+8).toFixed(1)}%`;
  document.getElementById('metric-sharpe').textContent     = (Math.random()*1+0.5).toFixed(2);
  document.getElementById('metric-beta').textContent       = (Math.random()*0.8+0.7).toFixed(2);
}

/* ---------- Eventos iniciales ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Paso visible por defecto
  document.getElementById('step-1').style.display = 'block';

  // Valores iniciales aleatorios (demo)
  document.getElementById('avg-correlation').textContent =
    (Math.random() * 0.5 + 0.1).toFixed(2);
  document.getElementById('diversification-score-value').textContent =
    Math.floor(Math.random() * 50 + 50);

  // Wire-up botones y controles
  document.getElementById('btn-optimize')?.addEventListener('click', runOptimization);
});

/* ---------- Hacer accesibles las funciones al HTML ---------- */
window.goToStep           = goToStep;
window.addTicker          = addTicker;
window.updateSliderValue  = updateSliderValue;
window.toggleCollapse     = toggleCollapse;
window.runOptimization    = runOptimization;
