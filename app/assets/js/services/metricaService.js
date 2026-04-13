import { supabaseClient } from '../config/supabase.js';
import { logError } from './errorService.js';

// Cache en memoria para evitar múltiples consultas
let _tiposMetrica = null;
let _rangosReferencia = null;

/**
 * Obtiene los tipos de métrica activos, ordenados por orden_visualizacion.
 * @returns {Promise<Array>}
 */
export async function getTiposMetrica() {
  if (_tiposMetrica) return _tiposMetrica;

  try {
    const { data, error } = await supabaseClient
      .from('tipo_metrica')
      .select('*')
      .eq('activo', true)
      .order('orden_visualizacion', { ascending: true });

    if (error) throw error;
    _tiposMetrica = data;
    return data;
  } catch (err) {
    await logError(err.message, 'metricaService.getTiposMetrica');
    throw err;
  }
}

/**
 * Obtiene todos los rangos de referencia.
 * @returns {Promise<Array>}
 */
export async function getRangosReferencia() {
  if (_rangosReferencia) return _rangosReferencia;

  try {
    const { data, error } = await supabaseClient
      .from('rangos_referencia')
      .select('*');

    if (error) throw error;
    _rangosReferencia = data;
    return data;
  } catch (err) {
    await logError(err.message, 'metricaService.getRangosReferencia');
    throw err;
  }
}

/**
 * Retorna un mapa indexado por tipo_metrica_id → rango.
 * @returns {Promise<Object>} { [tipo_metrica_id]: { valor_minimo_normal, valor_maximo_normal, ... } }
 */
export async function getRangoMap() {
  const rangos = await getRangosReferencia();
  return rangos.reduce((acc, r) => {
    acc[r.tipo_metrica_id] = r;
    return acc;
  }, {});
}

/**
 * Retorna un mapa indexado por nombre de métrica → rango.
 * Útil para acceder rápidamente por nombre.
 * @returns {Promise<Object>}
 */
export async function getRangoMapPorNombre() {
  const [tipos, rangos] = await Promise.all([getTiposMetrica(), getRangosReferencia()]);
  const tipoMap = tipos.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

  return rangos.reduce((acc, r) => {
    const tipo = tipoMap[r.tipo_metrica_id];
    if (tipo) acc[tipo.nombre] = r;
    return acc;
  }, {});
}

/**
 * Limpia la caché (útil para testing o refresco forzado).
 */
export function clearMetricaCache() {
  _tiposMetrica = null;
  _rangosReferencia = null;
}
