import { validarMedicion } from '../utils/validators.js';
import { hoyISO, ahoraHHMM } from '../utils/formatters.js';
import { mostrarAlertas } from './alertas.js';

let _tiposMetrica = [];
let _rangoMap     = {};
let _onGuardar    = null;
let _container    = null;
let _alertasContainer = null;

/**
 * Inicializa el formulario de carga de mediciones.
 *
 * @param {HTMLElement} container      - Contenedor donde renderizar el formulario
 * @param {Array}       tiposMetrica   - Tipos de métrica activos
 * @param {object}      rangoMap       - Mapa de rangos por tipo_metrica_id
 * @param {Function}    onGuardar      - Callback async(datos) al guardar
 */
export function initFormulario(container, tiposMetrica, rangoMap, onGuardar) {
  _tiposMetrica     = tiposMetrica;
  _rangoMap         = rangoMap;
  _onGuardar        = onGuardar;
  _container        = container;

  _container.innerHTML = buildFormHTML();
  _alertasContainer = _container.querySelector('#form-alertas');

  attachFormEvents();
}

function buildFormHTML() {
  // Agrupar: presión (sist + diast juntas) y glucosa aparte
  const sistolica  = _tiposMetrica.find(t => t.nombre === 'presion_sistolica');
  const diastolica = _tiposMetrica.find(t => t.nombre === 'presion_diastolica');
  const glucosa    = _tiposMetrica.find(t => t.nombre === 'glucosa');
  const otros      = _tiposMetrica.filter(t =>
    t.nombre !== 'presion_sistolica' &&
    t.nombre !== 'presion_diastolica' &&
    t.nombre !== 'glucosa'
  );

  let metricsHTML = '';

  // Grupo presión
  if (sistolica || diastolica) {
    metricsHTML += `
      <div class="form-group-card">
        <div class="form-group-card-title">
          <span class="metric-icon">❤️</span> Presión Arterial
          <span class="form-group-hint">(cargar ambas o ninguna)</span>
        </div>
        <div class="form-row">`;
    if (sistolica) {
      metricsHTML += buildMetricField(sistolica);
    }
    if (diastolica) {
      metricsHTML += buildMetricField(diastolica);
    }
    metricsHTML += `</div></div>`;
  }

  // Glucosa
  if (glucosa) {
    metricsHTML += `
      <div class="form-group-card">
        <div class="form-group-card-title">
          <span class="metric-icon">💉</span> Glucosa en Sangre
        </div>
        <div class="form-row">
          ${buildMetricField(glucosa)}
        </div>
      </div>`;
  }

  // Otros
  if (otros.length > 0) {
    metricsHTML += `<div class="form-group-card"><div class="form-row">`;
    otros.forEach(t => { metricsHTML += buildMetricField(t); });
    metricsHTML += `</div></div>`;
  }

  return `
    <form id="form-medicion" novalidate>
      <div id="form-errors" class="form-errors hidden"></div>

      <!-- Fecha, hora, momento -->
      <div class="form-group-card">
        <div class="form-group-card-title">
          <span class="metric-icon">📅</span> Fecha y Momento
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="f-fecha">Fecha *</label>
            <input type="date" id="f-fecha" name="fecha" value="${hoyISO()}" required>
          </div>
          <div class="form-field">
            <label for="f-hora">Hora *</label>
            <input type="time" id="f-hora" name="hora" value="${ahoraHHMM()}" required>
          </div>
          <div class="form-field">
            <label for="f-momento">Momento del día *</label>
            <select id="f-momento" name="momento_del_dia" required>
              <option value="">Seleccionar...</option>
              <option value="ayunas">En ayunas</option>
              <option value="antes_de_comer">Antes de comer</option>
              <option value="despues_de_comer">Después de comer</option>
              <option value="manana">Mañana</option>
              <option value="noche">Noche</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Métricas -->
      ${metricsHTML}

      <!-- Notas -->
      <div class="form-group-card">
        <div class="form-group-card-title">
          <span class="metric-icon">📝</span> Notas
        </div>
        <div class="form-field full-width">
          <textarea id="f-notas" name="notas" rows="3"
            placeholder="Observaciones opcionales (síntomas, medicación, actividad física...)"></textarea>
        </div>
      </div>

      <!-- Alertas de rango -->
      <div id="form-alertas"></div>

      <!-- Acciones -->
      <div class="form-actions">
        <button type="button" id="btn-limpiar" class="btn btn-outline">Limpiar</button>
        <button type="submit" id="btn-guardar" class="btn btn-primary">
          <span id="btn-guardar-txt">Guardar medición</span>
          <span id="btn-guardar-spin" class="spinner hidden"></span>
        </button>
      </div>
    </form>`;
}

function buildMetricField(tipo) {
  return `
    <div class="form-field">
      <label for="metric-${tipo.id}">${tipo.etiqueta}</label>
      <div class="input-with-unit">
        <input type="number" id="metric-${tipo.id}"
          data-tipo-id="${tipo.id}"
          name="metric_${tipo.id}"
          min="0" step="0.1"
          placeholder="0"
          class="metric-input">
        <span class="input-unit">${tipo.unidad}</span>
      </div>
    </div>`;
}

function attachFormEvents() {
  const form = _container.querySelector('#form-medicion');
  if (!form) return;

  // Limpiar form
  _container.querySelector('#btn-limpiar')?.addEventListener('click', resetFormulario);

  // Preview de alertas al cambiar valores
  _container.querySelectorAll('.metric-input').forEach(input => {
    input.addEventListener('input', previewAlertas);
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit();
  });
}

function previewAlertas() {
  const valores = getValores();
  const alertasEl = _container.querySelector('#form-alertas');
  mostrarAlertas(alertasEl, valores, _tiposMetrica, _rangoMap);
}

function getValores() {
  const valores = {};
  _container.querySelectorAll('.metric-input').forEach(input => {
    const id = parseInt(input.dataset.tipoId, 10);
    valores[id] = input.value;
  });
  return valores;
}

async function handleSubmit() {
  const errorsEl = _container.querySelector('#form-errors');
  errorsEl.innerHTML = '';
  errorsEl.classList.add('hidden');

  const datos = {
    fecha:          _container.querySelector('#f-fecha').value,
    hora:           _container.querySelector('#f-hora').value,
    momento_del_dia:_container.querySelector('#f-momento').value,
    notas:          _container.querySelector('#f-notas').value.trim(),
    valores:        getValores(),
  };

  const { valid, errors } = validarMedicion(datos, _tiposMetrica);
  if (!valid) {
    errorsEl.innerHTML = errors.map(e => `<p>• ${e}</p>`).join('');
    errorsEl.classList.remove('hidden');
    return;
  }

  // Mostrar spinner
  const btnTxt  = _container.querySelector('#btn-guardar-txt');
  const btnSpin = _container.querySelector('#btn-guardar-spin');
  const btnGuardar = _container.querySelector('#btn-guardar');
  btnTxt.classList.add('hidden');
  btnSpin.classList.remove('hidden');
  btnGuardar.disabled = true;

  try {
    await _onGuardar(datos);
    resetFormulario();
    // Mostrar alertas con los valores guardados
    mostrarAlertas(
      _container.querySelector('#form-alertas'),
      datos.valores, _tiposMetrica, _rangoMap
    );
  } finally {
    btnTxt.classList.remove('hidden');
    btnSpin.classList.add('hidden');
    btnGuardar.disabled = false;
  }
}

/**
 * Resetea el formulario a su estado inicial.
 */
export function resetFormulario() {
  const form = _container?.querySelector('#form-medicion');
  if (!form) return;
  form.reset();
  _container.querySelector('#f-fecha').value = hoyISO();
  _container.querySelector('#f-hora').value  = ahoraHHMM();
  const errorsEl = _container.querySelector('#form-errors');
  if (errorsEl) { errorsEl.innerHTML = ''; errorsEl.classList.add('hidden'); }
  if (_alertasContainer) _alertasContainer.innerHTML = '';
}
