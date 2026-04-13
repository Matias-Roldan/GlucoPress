import { logError } from './errorService.js';
import { formatearFecha, formatearHora, getMomentoLabel } from '../utils/formatters.js';
import { COLORS } from '../config/constants.js';

/**
 * Exporta los datos a PDF usando jsPDF.
 * @param {object} opciones
 * @param {object}  opciones.perfil          - { nombre }
 * @param {Array}   opciones.mediciones       - Mediciones aplanadas
 * @param {object}  opciones.estadisticas     - { [nombre_metrica]: { promedio, max, min, etiqueta, unidad } }
 * @param {object}  opciones.rangoMap         - { [tipo_metrica_id]: rango }
 * @param {Array}   opciones.tiposMetrica     - tipos de métrica activos
 * @param {object}  opciones.chartCanvases    - { [nombre_metrica]: HTMLCanvasElement }
 * @param {string}  opciones.fechaDesde
 * @param {string}  opciones.fechaHasta
 */
export async function exportarPDF(opciones) {
  const { perfil, mediciones, estadisticas, rangoMap, tiposMetrica, chartCanvases, fechaDesde, fechaHasta } = opciones;

  try {
    if (!window.jspdf) throw new Error('jsPDF no cargado');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const W = doc.internal.pageSize.getWidth();
    let y = 20;
    const margin = 15;
    const lineH = 7;

    // ─── PORTADA ───────────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, W, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GlucoPress', W / 2, 18, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Salud Personal', W / 2, 27, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, W / 2, 36, { align: 'center' });

    y = 55;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente: ${perfil?.nombre || 'Sin nombre'}`, margin, y);
    y += lineH;

    if (fechaDesde || fechaHasta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `Período: ${fechaDesde ? formatearFecha(fechaDesde) : 'inicio'} al ${fechaHasta ? formatearFecha(fechaHasta) : 'hoy'}`,
        margin, y
      );
      y += lineH;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, W - margin, y);
    y += 8;

    // ─── SECCIÓN POR MÉTRICA ───────────────────────────────────────────────────
    for (const tipo of tiposMetrica) {
      const datosTipo = mediciones.filter(m => m.tipo_metrica_id === tipo.id);
      if (datosTipo.length === 0) continue;

      const est = estadisticas[tipo.nombre];
      const rango = rangoMap[tipo.id];

      // Subtítulo de métrica
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y - 4, W - margin * 2, 10, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(tipo.etiqueta, margin + 2, y + 3);
      y += 12;

      // Estadísticas
      if (est) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const stats = [
          `Promedio: ${est.promedio} ${tipo.unidad}`,
          `Máximo: ${est.max} ${tipo.unidad}`,
          `Mínimo: ${est.min} ${tipo.unidad}`,
        ];
        if (rango) {
          stats.push(`Rango normal: ${rango.valor_minimo_normal} - ${rango.valor_maximo_normal} ${tipo.unidad}`);
        }
        stats.forEach(s => {
          doc.text(s, margin + 4, y);
          y += lineH - 1;
        });
        y += 3;
      }

      // Gráfico embebido
      const canvas = chartCanvases?.[tipo.nombre];
      if (canvas) {
        try {
          const imgData = canvas.toDataURL('image/png');
          const imgW = W - margin * 2;
          const imgH = imgW * 0.45;
          if (y + imgH > 280) { doc.addPage(); y = 20; }
          doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
          y += imgH + 8;
        } catch (_) { /* si falla no bloquear el PDF */ }
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, W - margin, y);
      y += 8;
    }

    // ─── PIE DE PÁGINA en cada página ─────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages} — GlucoPress`, W / 2, 290, { align: 'center' });
    }

    doc.save(`GlucoPress_${perfil?.nombre?.replace(/\s+/g, '_') || 'reporte'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    await logError(err.message, 'reporteService.exportarPDF');
    throw err;
  }
}

/**
 * Exporta los datos a Excel usando SheetJS.
 * Una hoja por métrica.
 *
 * @param {object} opciones
 * @param {Array}  opciones.mediciones   - Mediciones aplanadas
 * @param {Array}  opciones.tiposMetrica - Tipos de métrica activos
 */
export async function exportarExcel(opciones) {
  const { mediciones, tiposMetrica } = opciones;

  try {
    if (!window.XLSX) throw new Error('SheetJS no cargado');
    const XLSX = window.XLSX;

    const wb = XLSX.utils.book_new();

    for (const tipo of tiposMetrica) {
      const datosTipo = mediciones
        .filter(m => m.tipo_metrica_id === tipo.id)
        .sort((a, b) => {
          if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
          return a.hora < b.hora ? -1 : 1;
        });

      if (datosTipo.length === 0) continue;

      const filas = datosTipo.map(d => ({
        Fecha:          formatearFecha(d.fecha),
        Hora:           formatearHora(d.hora),
        'Momento del día': getMomentoLabel(d.momento_del_dia),
        Valor:          parseFloat(d.valor),
        Unidad:         d.unidad || tipo.unidad,
        Notas:          d.notas || '',
      }));

      const ws = XLSX.utils.json_to_sheet(filas);

      // Ancho de columnas
      ws['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 30 },
      ];

      const sheetName = tipo.etiqueta.substring(0, 31); // Excel limita a 31 chars
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    if (wb.SheetNames.length === 0) {
      throw new Error('No hay datos para exportar.');
    }

    XLSX.writeFile(wb, `GlucoPress_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    await logError(err.message, 'reporteService.exportarExcel');
    throw err;
  }
}
