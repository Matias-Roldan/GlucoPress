import { supabaseClient } from '../config/supabase.js';

/**
 * Registra un error en la tabla errores_log.
 * Falla silenciosamente para no interrumpir el flujo de la app.
 *
 * @param {string} mensaje  - Descripción del error
 * @param {string} contexto - Contexto donde ocurrió (ej: 'authService.login')
 * @param {string|null} usuarioId - UUID del usuario (null si no hay sesión)
 */
export async function logError(mensaje, contexto, usuarioId = null) {
  try {
    // Intentar obtener el usuario si no se pasó
    let uid = usuarioId;
    if (!uid) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      uid = session?.user?.id ?? null;
    }

    if (!uid) return; // Sin sesión no podemos insertar (RLS lo rechazaría de todos modos)

    await supabaseClient.from('errores_log').insert({
      usuario_id: uid,
      mensaje:    String(mensaje).substring(0, 500),
      contexto:   String(contexto).substring(0, 200),
    });
  } catch (_) {
    // Silencioso: no causar bucles de error
    console.error('[errorService] No se pudo registrar el error:', mensaje, contexto);
  }
}

/**
 * Muestra un mensaje de error amigable en el contenedor indicado.
 * @param {HTMLElement} container
 * @param {string} mensaje
 */
export function mostrarError(container, mensaje) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-danger" role="alert">
      <span class="alert-icon">⚠️</span>
      <span>${mensaje}</span>
    </div>`;
}

/**
 * Muestra un mensaje de éxito en el contenedor indicado.
 * @param {HTMLElement} container
 * @param {string} mensaje
 */
export function mostrarExito(container, mensaje) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-success" role="alert">
      <span class="alert-icon">✓</span>
      <span>${mensaje}</span>
    </div>`;
}

/**
 * Limpia los mensajes de alerta del contenedor.
 * @param {HTMLElement} container
 */
export function limpiarMensajes(container) {
  if (!container) return;
  container.innerHTML = '';
}
