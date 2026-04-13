// Constantes globales de la aplicación

export const COLORS = {
  primary:   '#2563eb',
  secondary: '#1e3a5f',
  success:   '#22c55e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  info:      '#06b6d4',
  muted:     '#64748b',
  surface:   '#ffffff',
  background:'#f1f5f9',
};

// Colores para cada métrica en los gráficos
export const METRIC_COLORS = {
  presion_sistolica:  { border: '#ef4444', background: 'rgba(239,68,68,0.12)' },
  presion_diastolica: { border: '#f59e0b', background: 'rgba(245,158,11,0.12)' },
  glucosa:            { border: '#2563eb', background: 'rgba(37,99,235,0.12)' },
};

// Etiquetas legibles para momento_del_dia
export const MOMENTOS_LABELS = {
  ayunas:           'En ayunas',
  antes_de_comer:   'Antes de comer',
  despues_de_comer: 'Después de comer',
  manana:           'Mañana',
  noche:            'Noche',
  otro:             'Otro',
};

// IDs de las secciones del dashboard
export const SECTIONS = {
  DASHBOARD:   'section-dashboard',
  NUEVA:       'section-nueva',
  HISTORIAL:   'section-historial',
  GRAFICOS:    'section-graficos',
  ESTADISTICAS:'section-estadisticas',
  EXPORTAR:    'section-exportar',
};

// Nombre de la app
export const APP_NAME = 'GlucoPress';

// Formato de fecha para mostrar
export const DATE_FORMAT_OPTIONS = {
  year: 'numeric', month: '2-digit', day: '2-digit',
};

export const DATETIME_FORMAT_OPTIONS = {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
};

// Mensaje de error genérico
export const MSG_ERROR_GENERICO = 'Ocurrió un error inesperado. Intenta nuevamente.';
