import { supabaseClient } from '../config/supabase.js';
import { logError } from './errorService.js';

/**
 * Crea una medición con sus detalles.
 *
 * @param {object} datos
 * @param {string}  datos.fecha
 * @param {string}  datos.hora
 * @param {string}  datos.momento_del_dia
 * @param {string}  datos.notas
 * @param {object}  datos.valores - { [tipo_metrica_id]: number }
 * @param {string}  usuarioId
 * @returns {Promise<object>} La medición creada
 */
export async function crearMedicion(datos, usuarioId) {
  try {
    // 1. Insertar la medición principal
    const { data: medicion, error: medicionError } = await supabaseClient
      .from('mediciones')
      .insert({
        usuario_id:       usuarioId,
        fecha:            datos.fecha,
        hora:             datos.hora,
        momento_del_dia:  datos.momento_del_dia,
        notas:            datos.notas || null,
      })
      .select()
      .single();

    if (medicionError) throw medicionError;

    // 2. Construir los detalles (solo valores no vacíos)
    const detalles = Object.entries(datos.valores)
      .filter(([, val]) => val !== '' && val !== undefined && val !== null)
      .map(([tipo_metrica_id, val]) => ({
        medicion_id:      medicion.id,
        tipo_metrica_id:  parseInt(tipo_metrica_id, 10),
        valor:            parseFloat(val),
      }));

    if (detalles.length === 0) {
      throw new Error('No hay valores para guardar.');
    }

    const { error: detalleError } = await supabaseClient
      .from('medicion_detalle')
      .insert(detalles);

    if (detalleError) throw detalleError;

    return medicion;
  } catch (err) {
    await logError(err.message, 'medicionService.crearMedicion', usuarioId);
    throw err;
  }
}

/**
 * Obtiene las mediciones del usuario con sus detalles y tipo_metrica.
 *
 * @param {string} usuarioId
 * @param {object} filtros - { fechaDesde, fechaHasta, tipoMetricaId }
 * @returns {Promise<Array>}
 */
export async function getMediciones(usuarioId, filtros = {}) {
  try {
    let query = supabaseClient
      .from('mediciones')
      .select(`
        *,
        medicion_detalle (
          *,
          tipo_metrica (*)
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (filtros.fechaDesde) {
      query = query.gte('fecha', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      query = query.lte('fecha', filtros.fechaHasta);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filtrar por tipo_metrica_id en cliente si se especificó
    if (filtros.tipoMetricaId) {
      return data.filter(m =>
        m.medicion_detalle.some(d => d.tipo_metrica_id === parseInt(filtros.tipoMetricaId, 10))
      );
    }

    return data;
  } catch (err) {
    await logError(err.message, 'medicionService.getMediciones', usuarioId);
    throw err;
  }
}

/**
 * Elimina una medición y sus detalles (cascada en DB).
 * @param {string} medicionId
 * @param {string} usuarioId
 */
export async function deleteMedicion(medicionId, usuarioId) {
  try {
    // Primero eliminar detalles
    const { error: detalleError } = await supabaseClient
      .from('medicion_detalle')
      .delete()
      .eq('medicion_id', medicionId);

    if (detalleError) throw detalleError;

    // Luego eliminar la medición
    const { error } = await supabaseClient
      .from('mediciones')
      .delete()
      .eq('id', medicionId)
      .eq('usuario_id', usuarioId);

    if (error) throw error;
  } catch (err) {
    await logError(err.message, 'medicionService.deleteMedicion', usuarioId);
    throw err;
  }
}

/**
 * Aplana las mediciones en filas planas por detalle, útil para gráficos y stats.
 * @param {Array} mediciones
 * @returns {Array} [{ medicion_id, fecha, hora, momento_del_dia, notas, tipo_metrica_id, nombre, etiqueta, unidad, valor }]
 */
export function aplanarMediciones(mediciones) {
  const filas = [];
  for (const m of mediciones) {
    for (const d of m.medicion_detalle || []) {
      filas.push({
        medicion_id:      m.id,
        fecha:            m.fecha,
        hora:             m.hora,
        momento_del_dia:  m.momento_del_dia,
        notas:            m.notas,
        tipo_metrica_id:  d.tipo_metrica_id,
        nombre:           d.tipo_metrica?.nombre,
        etiqueta:         d.tipo_metrica?.etiqueta,
        unidad:           d.tipo_metrica?.unidad,
        valor:            d.valor,
      });
    }
  }
  return filas;
}
