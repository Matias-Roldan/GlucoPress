import { formatearNumero } from '../utils/formatters.js';
import { clasificarValor } from '../utils/validators.js';

/**
 * Calcula estadísticas por métrica a partir de mediciones aplanadas.
 * @param {Array} filas   - Mediciones aplanadas (aplanarMediciones)
 * @param {Array} tiposMetrica
 * @returns {object} { [nombre_metrica]: { promedio, max, min, etiqueta, unidad, count } }
 */
export function calcularEstadisticas(filas, tiposMetrica) {
  const stats = {};

  for (const tipo of tiposMetrica) {
    const valores = filas
      .filter(f => f.tipo_metrica_id === tipo.id)
      .map(f => parseFloat(f.valor))
      .filter(v => !isNaN(v));

    if (valores.length === 0) continue;

    const sum = valores.reduce((a, b) => a + b, 0);
    stats[tipo.nombre] = {
      etiqueta: tipo.etiqueta,
      unidad:   tipo.unidad,
      count:    valores.length,
      promedio: parseFloat((sum / valores.length).toFixed(1)),
      max:      Math.max(...valores),
      min:      Math.min(...valores),
    };
  }
  return stats;
}

/**
 * Renderiza el panel de estadísticas.
 * @param {HTMLElement} container
 * @param {object}      estadisticas  - Resultado de calcularEstadisticas
 * @param {object}      rangoMap      - { [tipo_metrica_id]: rango }
 * @param {Array}       tiposMetrica
 */
export function renderEstadisticas(container, estadisticas, rangoMap, tiposMetrica) {
  if (!container) return;

  if (Object.keys(estadisticas).length === 0) {
    container.innerHTML = '<div class="empty-state">No hay datos suficientes para mostrar estadísticas.</div>';
    return;
  }

  const cards = tiposMetrica.map(tipo => {
    const est = estadisticas[tipo.nombre];
    if (!est) return '';

    const rango = rangoMap[tipo.id];
    let estadoPromedio = 'muted';
    let estadoTexto    = '';

    if (rango) {
      const est_ = clasificarValor(est.promedio, rango.valor_minimo_normal, rango.valor_maximo_normal);
      if (est_ === 'normal') {
        estadoPromedio = 'success';
        estadoTexto    = 'dentro del rango normal';
      } else {
        estadoPromedio = 'danger';
        estadoTexto    = est_ === 'alto' ? 'promedio ALTO' : 'promedio BAJO';
      }
    }

    return `
      <div class="stat-card">
        <div class="stat-card-header">
          <h3 class="stat-card-title">${est.etiqueta}</h3>
          ${rango ? `<span class="stat-rango-hint">Normal: ${rango.valor_minimo_normal}–${rango.valor_maximo_normal} ${est.unidad}</span>` : ''}
        </div>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">Promedio</span>
            <span class="stat-value stat-${estadoPromedio}">${formatearNumero(est.promedio)} <small>${est.unidad}</small></span>
            ${estadoTexto ? `<span class="stat-estado-txt stat-${estadoPromedio}">${estadoTexto}</span>` : ''}
          </div>
          <div class="stat-item">
            <span class="stat-label">Máximo</span>
            <span class="stat-value">${formatearNumero(est.max)} <small>${est.unidad}</small></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mínimo</span>
            <span class="stat-value">${formatearNumero(est.min)} <small>${est.unidad}</small></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Registros</span>
            <span class="stat-value">${est.count}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="stat-cards-grid">${cards}</div>`;
}
