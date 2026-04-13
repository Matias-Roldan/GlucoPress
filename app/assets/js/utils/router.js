import { SECTIONS } from '../config/constants.js';

let _currentSection = null;
let _onNavigate = null;

/**
 * Inicializa el router, asociando los botones de navegación del sidebar.
 * @param {Function} onNavigate - callback(sectionId) llamado al cambiar de sección
 */
export function initRouter(onNavigate) {
  _onNavigate = onNavigate;

  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = btn.dataset.section;
      navigate(sectionId);
    });
  });

  // Navegar a dashboard por defecto
  navigate(SECTIONS.DASHBOARD);
}

/**
 * Navega a una sección del dashboard.
 * @param {string} sectionId - ID de la sección destino
 */
export function navigate(sectionId) {
  // Ocultar todas las secciones
  Object.values(SECTIONS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Mostrar la sección activa
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
    _currentSection = sectionId;
  }

  // Actualizar nav activo
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  // Cerrar sidebar móvil al navegar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');

  if (_onNavigate) _onNavigate(sectionId);
}

/**
 * Retorna el ID de la sección actualmente visible.
 */
export function getCurrentSection() {
  return _currentSection;
}
