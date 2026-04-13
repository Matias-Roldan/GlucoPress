import { MOMENTOS_LABELS, DATE_FORMAT_OPTIONS, DATETIME_FORMAT_OPTIONS } from '../config/constants.js';

/**
 * Formatea una fecha ISO a dd/mm/aaaa
 * @param {string} dateStr - Fecha en formato ISO (YYYY-MM-DD)
 */
export function formatearFecha(dateStr) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una hora HH:MM:SS a HH:MM
 * @param {string} timeStr
 */
export function formatearHora(timeStr) {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
}

/**
 * Combina fecha y hora en un string legible
 * @param {string} dateStr
 * @param {string} timeStr
 */
export function formatearFechaHora(dateStr, timeStr) {
  return `${formatearFecha(dateStr)} ${formatearHora(timeStr)}`;
}

/**
 * Formatea un número a dos decimales si es necesario
 * @param {number|string} num
 */
export function formatearNumero(num) {
  if (num === null || num === undefined || num === '') return '-';
  const n = parseFloat(num);
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

/**
 * Retorna la etiqueta legible de un momento del día
 * @param {string} momento
 */
export function getMomentoLabel(momento) {
  return MOMENTOS_LABELS[momento] || momento || '-';
}

/**
 * Convierte una fecha ISO + hora a objeto Date para ordenar/graficar
 * @param {string} dateStr
 * @param {string} timeStr
 */
export function toDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr || '00:00:00'}`);
}

/**
 * Retorna el timestamp actual en formato YYYY-MM-DD
 */
export function hoyISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retorna la hora actual en formato HH:MM
 */
export function ahoraHHMM() {
  const now = new Date();
  return now.toTimeString().substring(0, 5);
}
