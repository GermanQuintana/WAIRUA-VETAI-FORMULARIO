export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export interface GlucoseSampleInput { id: number; hour: string; glucose: string }
export interface GlucosePoint { hour: number; glucose: number }

const parseNumber = (text: string) => text.trim() ? Number(text.replace(',', '.')) : NaN;
export const glucoseToMgDl = (value: number, unit: GlucoseUnit) => unit === 'mmol/L' ? value * 18.0182 : value;
export const glucoseFromMgDl = (value: number, unit: GlucoseUnit) => unit === 'mmol/L' ? value / 18.0182 : value;

export function analyzeGlucoseCurve(rows: GlucoseSampleInput[], unit: GlucoseUnit) {
  const points: GlucosePoint[] = [];
  const invalidRows: number[] = [];
  rows.forEach((row, index) => {
    if (!row.hour.trim() && !row.glucose.trim()) return;
    const hour = parseNumber(row.hour);
    const glucose = parseNumber(row.glucose);
    if (!Number.isFinite(hour) || hour < 0 || hour > 48 || !Number.isFinite(glucose) || glucose <= 0 || !Number.isFinite(glucoseToMgDl(glucose, unit))) {
      invalidRows.push(index + 1);
    } else {
      points.push({ hour, glucose: glucoseToMgDl(glucose, unit) });
    }
  });
  points.sort((a, b) => a.hour - b.hour);
  const duplicateHours = points.some((point, index) => index > 0 && points[index - 1].hour === point.hour);
  const valid = invalidRows.length === 0 && !duplicateHours;
  const minimum = points.length ? Math.min(...points.map((p) => p.glucose)) : null;
  return {
    points, invalidRows, duplicateHours, valid,
    nadir: valid ? minimum : null,
    nadirHours: valid ? points.filter((p) => p.glucose === minimum).map((p) => p.hour) : [],
    maximum: valid && points.length ? Math.max(...points.map((p) => p.glucose)) : null,
    mean: valid && points.length ? points.reduce((sum, p) => sum + p.glucose, 0) / points.length : null,
    span: valid && points.length > 1 ? points[points.length - 1].hour - points[0].hour : 0,
    boundaryNadir: valid && minimum !== null && (points[0].glucose === minimum || points[points.length - 1].glucose === minimum),
  };
}
