import { supabaseClient } from '../config/supabase.js';
import { logError } from './errorService.js';

/**
 * Registra un nuevo usuario.
 * Crea la cuenta en Supabase Auth y guarda el perfil en la tabla `usuarios`.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nombre
 * @returns {Promise<{ user: object }>}
 */
export async function register(email, password, nombre) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error) throw error;

    // Guardar perfil extendido en tabla usuarios
    if (data.user) {
      const { error: profileError } = await supabaseClient.from('usuarios').upsert({
        id:              data.user.id,
        email:           email,
        nombre:          nombre,
        fecha_registro:  new Date().toISOString(),
        timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (profileError) {
        console.warn('No se pudo guardar el perfil extendido:', profileError.message);
      }
    }

    return { user: data.user };
  } catch (err) {
    await logError(err.message, 'authService.register');
    throw err;
  }
}

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session };
  } catch (err) {
    await logError(err.message, 'authService.login');
    throw err;
  }
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (err) {
    await logError(err.message, 'authService.logout');
    throw err;
  }
}

/**
 * Obtiene la sesión activa.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

/**
 * Obtiene el perfil del usuario autenticado desde la tabla `usuarios`.
 * @returns {Promise<object|null>}
 */
export async function getProfile() {
  try {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    await logError(err.message, 'authService.getProfile');
    return null;
  }
}

/**
 * Escucha cambios de autenticación.
 * @param {Function} callback - (event, session) => void
 */
export function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback);
}
