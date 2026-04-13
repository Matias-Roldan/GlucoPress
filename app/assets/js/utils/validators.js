/**
 * Valida los datos del formulario de medición.
 * Reglas:
 * - Presión sistólica y diastólica deben cargarse juntas o ninguna.
 * - Todos los valores deben ser numéricos positivos.
 * - Al menos una métrica debe tener valor.
 *
 * @param {Object} datos - { valores: { [tipo_metrica_id]: string }, fecha, hora, momento_del_dia }
 * @param {Array}  tiposMetrica - lista de objetos tipo_metrica
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validarMedicion(datos, tiposMetrica) {
  const errors = [];

  if (!datos.fecha) errors.push('La fecha es obligatoria.');
  if (!datos.hora)  errors.push('La hora es obligatoria.');
  if (!datos.momento_del_dia) errors.push('El momento del día es obligatorio.');

  const valores = datos.valores || {};

  // Identificar IDs de sistólica y diastólica
  const sistolicaTipo  = tiposMetrica.find(t => t.nombre === 'presion_sistolica');
  const diastolicaTipo = tiposMetrica.find(t => t.nombre === 'presion_diastolica');

  const tieneSist  = sistolicaTipo  && valores[sistolicaTipo.id]  !== '' && valores[sistolicaTipo.id]  !== undefined;
  const tieneDiast = diastolicaTipo && valores[diastolicaTipo.id] !== '' && valores[diastolicaTipo.id] !== undefined;

  if (tieneSist !== tieneDiast) {
    errors.push('La presión sistólica y diastólica deben cargarse juntas o dejar ambas en blanco.');
  }

  // Validar que cada valor cargado sea numérico y positivo
  for (const [idStr, val] of Object.entries(valores)) {
    if (val === '' || val === undefined) continue;
    const num = parseFloat(val);
    if (isNaN(num)) {
      const tipo = tiposMetrica.find(t => t.id === parseInt(idStr));
      errors.push(`El valor de ${tipo?.etiqueta || 'métrica'} debe ser un número.`);
    } else if (num <= 0) {
      const tipo = tiposMetrica.find(t => t.id === parseInt(idStr));
      errors.push(`El valor de ${tipo?.etiqueta || 'métrica'} debe ser mayor a cero.`);
    }
  }

  // Al menos una métrica cargada
  const hayAlguno = Object.values(valores).some(v => v !== '' && v !== undefined);
  if (!hayAlguno) {
    errors.push('Debes ingresar al menos un valor de métrica.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida que un valor esté dentro del rango normal dado.
 * @param {number} valor
 * @param {number} minimo
 * @param {number} maximo
 * @returns {'normal'|'alto'|'bajo'}
 */
export function clasificarValor(valor, minimo, maximo) {
  if (valor < minimo) return 'bajo';
  if (valor > maximo) return 'alto';
  return 'normal';
}
