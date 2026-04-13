import { formatearFecha, formatearHora, formatearNumero, getMomentoLabel } from '../utils/formatters.js';
import { badgeClase } from './alertas.js';

let _mediciones    = [];
let _rangoMap      = {};
let _tiposMetrica  = [];
let _container     = null;
let _onDelete      = null;
let _filtros       = {};

/**
 * Inicializa el historial.
 * @param {HTMLElement} container
 * @param {Array}       mediciones    - Mediciones con medicion_detalle
 * @param {object}      rangoMap      - { [tipo_metrica_id]: rango }
 * @param {Array}       tiposMetrica
 * @param {Function}    onDelete      - async(medicionId) al eliminar
 */
export function initHistorial(container, mediciones, rangoMap, tiposMetrica, onDelete) {
  _container    = container;
  _mediciones   = mediciones;
  _rangoMap     = rangoMap;
  _tiposMetrica = tiposMetrica;
  _onDelete     = onDelete;
  _filtros      = {};
  renderHistorial();
}

/**
 * Actualiza los datos del historial y vuelve a renderizar.
 */
export function actualizarHistorial(mediciones) {
  _mediciones = mediciones;
  renderHistorial();
}

function renderHistorial() {
  if (!_container) return;
  const filtradas = aplicarFiltros(_mediciones, _filtros);

  _container.innerHTML = `
    <!-- Filtros -->
    <div class="filtros-bar">
      <div class="filtros-group">
        <label>Desde</label>
        <input type="date" id="filtro-desde" value="${_filtros.fechaDesde || ''}">
      </div>
      <div class="filtros-group">
        <label>Hasta</label>
        <input type="date" id="filtro-hasta" value="${_filtros.fechaHasta || ''}">
      </div>
      <div class="filtros-group">
        <label>Métrica</label>
        <select id="filtro-metrica">
          <option value="">Todas</option>
          ${_tiposMetrica.map(t => `<option value="${t.id}" ${_filtros.tipoMetricaId == t.id ? 'selected' : ''}>${t.etiqueta}</option>`).join('')}
        </select>
      </div>
      <button id="btn-filtrar" class="btn btn-outline btn-sm">Filtrar</button>
      <button id="btn-limpiar-filtros" class="btn btn-ghost btn-sm">Limpiar</button>
    </div>
    <p class="historial-count">${filtradas.length} medición${filtradas.length !== 1 ? 'es' : ''} encontrada${filtradas.length !== 1 ? 's' : ''}</p>
    ${filtradas.length === 0 ? '<div class="empty-state">No hay mediciones para los filtros seleccionados.</div>' : buildTabla(filtradas)}
  `;

  attachHistorialEvents();
}

function buildTabla(mediciones) {
  const rows = mediciones.map(m => {
    const detalles = (m.medicion_detalle || []).map(d => {
      const rango = _rangoMap[d.tipo_metrica_id];
      const badge = badgeClase(d.valor, rango);
      return `<span class="badge ${badge}" title="${d.tipo_metrica?.etiqueta}">
        ${d.tipo_metrica?.etiqueta}: <strong>${formatearNumero(d.valor)}</strong> ${d.tipo_metrica?.unidad}
      </span>`;
    }).join('');

    return `<tr>
      <td>${formatearFecha(m.fecha)}</td>
      <td>${formatearHora(m.hora)}</td>
      <td>${getMomentoLabel(m.momento_del_dia)}</td>
      <td class="td-metricas">${detalles}</td>
      <td class="td-notas">${m.notas ? `<span title="${m.notas}">📝 ${m.notas.substring(0, 30)}${m.notas.length > 30 ? '…' : ''}</span>` : '-'}</td>
      <td>
        <button class="btn btn-icon btn-danger-ghost btn-delete" data-id="${m.id}" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Momento</th>
            <th>Valores</th>
            <th>Notas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function aplicarFiltros(mediciones, filtros) {
  return mediciones.filter(m => {
    if (filtros.fechaDesde && m.fecha < filtros.fechaDesde) return false;
    if (filtros.fechaHasta && m.fecha > filtros.fechaHasta) return false;
    if (filtros.tipoMetricaId) {
      const id = parseInt(filtros.tipoMetricaId, 10);
      if (!m.medicion_detalle?.some(d => d.tipo_metrica_id === id)) return false;
    }
    return true;
  });
}

function attachHistorialEvents() {
  _container.querySelector('#btn-filtrar')?.addEventListener('click', () => {
    _filtros = {
      fechaDesde:     _container.querySelector('#filtro-desde')?.value || '',
      fechaHasta:     _container.querySelector('#filtro-hasta')?.value || '',
      tipoMetricaId:  _container.querySelector('#filtro-metrica')?.value || '',
    };
    renderHistorial();
  });

  _container.querySelector('#btn-limpiar-filtros')?.addEventListener('click', () => {
    _filtros = {};
    renderHistorial();
  });

  _container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('¿Eliminar esta medición? Esta acción no se puede deshacer.')) return;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await _onDelete(id);
        _mediciones = _mediciones.filter(m => m.id !== id);
        renderHistorial();
      } catch (_) {
        btn.disabled = false;
        btn.textContent = '🗑';
      }
    });
  });
}
