// Configuración de Supabase
// Las credenciales del cliente (anon/publishable) son seguras para el frontend
const SUPABASE_URL = 'https://oqpvxothozuzpmjnpcbm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AhLADJUl4HIPOS3NKWTBeg_X-0xFo_r';

if (!window.supabase) {
  throw new Error('Supabase SDK no cargado. Verifica que el script CDN esté incluido en el HTML.');
}

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
