import { formatearFechaHora } from '../utils/formatters.js';
import { METRIC_COLORS, COLORS } from '../config/constants.js';

// Instancias de Chart activas: { [nombre_metrica]: Chart }
let _charts = {};

/**
 * Renderiza los gráficos de línea por cada métrica.
 *
 * @param {HTMLElement} container
 * @param {Array}       filas        - Mediciones aplanadas, ordenadas asc por fecha/hora
 * @param {object}      rangoMap     - { [tipo_metrica_id]: rango }
 * @param {Array}       tiposMetrica
 */
export function renderGraficos(container, filas, rangoMap, tiposMetrica) {
  if (!container) return;

  destroyAllCharts();
  container.innerHTML = '';

  if (filas.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay datos para graficar. Registra algunas mediciones primero.</div>';
    return;
  }

  const Chart = window.Chart;
  if (!Chart) {
    container.innerHTML = '<div class="alert alert-danger">Chart.js no disponible.</div>';
    return;
  }

  for (const tipo of tiposMetrica) {
    const datosTipo = filas
      .filter(f => f.tipo_metrica_id === tipo.id)
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha > b.fecha ? 1 : -1;
        return a.hora > b.hora ? 1 : -1;
      });

    if (datosTipo.length === 0) continue;

    const colores = METRIC_COLORS[tipo.nombre] || { border: COLORS.primary, background: 'rgba(37,99,235,0.12)' };
    const rango   = rangoMap[tipo.id];
    const labels  = datosTipo.map(d => formatearFechaHora(d.fecha, d.hora));
    const valores  = datosTipo.map(d => parseFloat(d.valor));

    // Datos del gráfico principal
    const datasets = [
      {
        label:           tipo.etiqueta,
        data:            valores,
        borderColor:     colores.border,
        backgroundColor: colores.background,
        fill:            true,
        tension:         0.35,
        pointRadius:     4,
        pointHoverRadius:7,
        borderWidth:     2,
      },
    ];

    // Líneas de referencia (min y max)
    if (rango) {
      datasets.push({
        label:       `Mín. normal (${rango.valor_minimo_normal})`,
        data:        labels.map(() => rango.valor_minimo_normal),
        borderColor: COLORS.success,
        borderWidth: 1.5,
        borderDash:  [6, 4],
        pointRadius: 0,
        fill:        false,
        tension:     0,
      });
      datasets.push({
        label:       `Máx. normal (${rango.valor_maximo_normal})`,
        data:        labels.map(() => rango.valor_maximo_normal),
        borderColor: COLORS.danger,
        borderWidth: 1.5,
        borderDash:  [6, 4],
        pointRadius: 0,
        fill:        false,
        tension:     0,
      });
    }

    // Crear wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-card';
    wrapper.innerHTML = `
      <div class="chart-card-header">
        <h3>${tipo.etiqueta}</h3>
        <span class="chart-unit">${tipo.unidad}</span>
      </div>
      <div class="chart-wrapper">
        <canvas id="chart-${tipo.nombre}"></canvas>
      </div>`;
    container.appendChild(wrapper);

    const canvas = wrapper.querySelector(`#chart-${tipo.nombre}`);
    const ctx    = canvas.getContext('2d');

    _charts[tipo.nombre] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { color: COLORS.muted, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${tipo.unidad}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color:    COLORS.muted,
              maxRotation: 45,
              maxTicksLimit: 12,
              font: { size: 10 },
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          y: {
            ticks: {
              color: COLORS.muted,
              callback: v => `${v} ${tipo.unidad}`,
              font: { size: 10 },
            },
            grid: { color: 'rgba(0,0,0,0.07)' },
          },
        },
      },
    });
  }

  if (container.children.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay datos para ninguna métrica.</div>';
  }
}

/**
 * Retorna un mapa de canvas de los gráficos activos.
 * @returns {object} { [nombre_metrica]: HTMLCanvasElement }
 */
export function getChartCanvases() {
  return Object.fromEntries(
    Object.entries(_charts).map(([nombre, chart]) => [nombre, chart.canvas])
  );
}

/**
 * Destruye todos los gráficos activos (libera memoria de Chart.js).
 */
export function destroyAllCharts() {
  Object.values(_charts).forEach(c => {
    try { c.destroy(); } catch (_) { /* ignore */ }
  });
  _charts = {};
}
