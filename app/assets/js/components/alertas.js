import { clasificarValor } from '../utils/validators.js';
import { formatearNumero } from '../utils/formatters.js';

/**
 * Muestra alertas visuales para los valores cargados comparándolos con los rangos.
 *
 * @param {HTMLElement} container     - Elemento donde renderizar las alertas
 * @param {object}      valores       - { [tipo_metrica_id]: number }
 * @param {Array}       tiposMetrica  - Lista de tipos de métrica
 * @param {object}      rangoMap      - { [tipo_metrica_id]: { valor_minimo_normal, valor_maximo_normal } }
 */
export function mostrarAlertas(container, valores, tiposMetrica, rangoMap) {
  if (!container) return;
  container.innerHTML = '';

  const tieneValores = Object.values(valores).some(v => v !== '' && v !== undefined && v !== null);
  if (!tieneValores) return;

  const alertas = [];

  for (const tipo of tiposMetrica) {
    const val = valores[tipo.id];
    if (val === '' || val === undefined || val === null) continue;

    const rango = rangoMap[tipo.id];
    if (!rango) continue;

    const valorNum = parseFloat(val);
    const estado = clasificarValor(valorNum, rango.valor_minimo_normal, rango.valor_maximo_normal);

    alertas.push({ tipo, valorNum, rango, estado });
  }

  if (alertas.length === 0) return;

  const html = alertas.map(({ tipo, valorNum, rango, estado }) => {
    const esNormal = estado === 'normal';
    const icono    = esNormal ? '✓' : '⚠';
    const clase    = esNormal ? 'alert-success' : 'alert-danger';
    const texto    = esNormal
      ? `${tipo.etiqueta}: ${formatearNumero(valorNum)} ${tipo.unidad} — dentro del rango normal (${rango.valor_minimo_normal}–${rango.valor_maximo_normal} ${tipo.unidad})`
      : `${tipo.etiqueta}: ${formatearNumero(valorNum)} ${tipo.unidad} — fuera del rango normal (${rango.valor_minimo_normal}–${rango.valor_maximo_normal} ${tipo.unidad}) ← ${estado === 'alto' ? 'ALTO' : 'BAJO'}`;

    return `<div class="alert ${clase}">
      <span class="alert-icon">${icono}</span>
      <span>${texto}</span>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

/**
 * Determina la clase CSS de color para un valor según su rango.
 * @param {number} valor
 * @param {object} rango - { valor_minimo_normal, valor_maximo_normal }
 * @returns {'badge-success'|'badge-danger'|'badge-warning'|'badge-muted'}
 */
export function badgeClase(valor, rango) {
  if (!rango) return 'badge-muted';
  const estado = clasificarValor(parseFloat(valor), rango.valor_minimo_normal, rango.valor_maximo_normal);
  if (estado === 'normal') return 'badge-success';
  return 'badge-danger';
}
