import { Language } from '../i18n';
import { GlucosePoint, GlucoseUnit, InsulinDose, glucoseFromMgDl } from './glucoseCurve';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function chartToPng(svg: SVGSVGElement): Promise<Blob> {
  // Snapshot now: edits made during rendering must not change the exported record.
  const markup = new XMLSerializer().serializeToString(svg);
  const { width, height } = svg.viewBox.baseVal;
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Canvas unavailable')); return; }
      context.scale(2, 2);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Chart rendering failed')); };
    image.src = url;
  });
}

interface ExportData {
  lang: Language;
  species: 'dog' | 'cat';
  unit: GlucoseUnit;
  insulin: string;
  notes: string;
  points: GlucosePoint[];
  doses: InsulinDose[];
  nadir: number;
  nadirHours: number[];
  source: string;
}

export async function exportGlucoseWorkbook(data: ExportData, png: Blob) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WAIRUA VetAI';
  workbook.created = new Date();
  const es = data.lang === 'es';
  const overview = workbook.addWorksheet(es ? 'Curva' : 'Curve');
  overview.columns = [{ width: 26 }, ...Array.from({ length: 9 }, () => ({ width: 12 }))];
  overview.mergeCells('A1:J1');
  overview.getCell('A1').value = es ? 'WAIRUA · Curva de glucosa' : 'WAIRUA · Glucose curve';
  overview.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF087B86' } };
  overview.addRow([es ? 'Especie' : 'Species', es ? (data.species === 'dog' ? 'Perro' : 'Gato') : (data.species === 'dog' ? 'Dog' : 'Cat')]);
  overview.addRow([es ? 'Insulina / concentración' : 'Insulin / strength', data.insulin]);
  overview.addRow([`${es ? 'Nadir observado' : 'Observed nadir'} (${data.unit})`, glucoseFromMgDl(data.nadir, data.unit)]);
  overview.getCell('B4').numFmt = '0.00';
  overview.addRow([es ? 'Horas del mínimo' : 'Minimum times', data.nadirHours.join(' / ')]);
  overview.addRow([es ? 'Lecturas / dosis registradas' : 'Readings / recorded doses', `${data.points.length} / ${data.doses.length}`]);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(png);
  });
  const image = workbook.addImage({ base64, extension: 'png' });
  // Retain the chart's actual aspect ratio, including extra insulin label lanes.
  const bitmap = await createImageBitmap(png);
  const imageHeight = bitmap.height / bitmap.width * 900;
  bitmap.close();
  overview.addImage(image, { tl: { col: 0, row: 7 }, ext: { width: 900, height: imageHeight } });
  const notesRow = 10 + Math.ceil(imageHeight / 20);
  overview.mergeCells(`A${notesRow}:J${notesRow}`);
  overview.getCell(`A${notesRow}`).value = `${es ? 'Observaciones' : 'Notes'}: ${data.notes}`;
  overview.getCell(`A${notesRow}`).alignment = { wrapText: true, vertical: 'top' };
  overview.getRow(notesRow).height = Math.max(36, Math.ceil(data.notes.length / 110) * 16);
  overview.mergeCells(`A${notesRow + 2}:J${notesRow + 2}`);
  overview.getCell(`A${notesRow + 2}`).value = es ? 'Registro exportado. Mínimo observado; no calcula dosis de insulina. Horas desde el inicio del registro.' : 'Exported record. Observed minimum; no insulin dose calculation. Hours from the start of the record.';
  overview.getCell(`A${notesRow + 2}`).alignment = { wrapText: true };
  overview.getRow(notesRow + 2).height = 32;
  overview.getCell(`A${notesRow + 3}`).value = { text: 'AAHA', hyperlink: data.source };
  const readings = workbook.addWorksheet(es ? 'Glucosa' : 'Glucose');
  readings.columns = [{ header: es ? 'Hora (h)' : 'Time (h)', key: 'hour', width: 18 }, { header: `${es ? 'Glucosa' : 'Glucose'} (${data.unit})`, key: 'glucose', width: 24 }];
  readings.addRows(data.points.map((point) => ({ hour: point.hour, glucose: glucoseFromMgDl(point.glucose, data.unit) })));
  readings.getColumn('hour').numFmt = '0.00';
  readings.getColumn('glucose').numFmt = '0.00';
  const insulin = workbook.addWorksheet(es ? 'Insulina' : 'Insulin');
  insulin.columns = [{ header: es ? 'Aplicación' : 'Administration', key: 'number', width: 18 }, { header: es ? 'Hora (h)' : 'Time (h)', key: 'hour', width: 18 }, { header: es ? 'Dosis (U)' : 'Dose (U)', key: 'dose', width: 18 }, { header: es ? 'Producto / concentración' : 'Product / strength', key: 'product', width: 40 }];
  insulin.addRows(data.doses.map((dose) => ({ ...dose, product: data.insulin })));
  insulin.getColumn('hour').numFmt = '0.00';
  insulin.getColumn('dose').numFmt = '0.00';
  [readings, insulin].forEach((sheet) => {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF087B86' } };
    sheet.getRow(1).height = 25;
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: sheet.columnCount } };
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
