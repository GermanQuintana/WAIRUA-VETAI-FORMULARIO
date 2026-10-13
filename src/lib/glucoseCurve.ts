export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export interface GlucoseSampleInput { id: number; hour: string; glucose: string }
export interface GlucosePoint { hour: number; glucose: number }
export interface InsulinDoseInput { id: number; hour: string; dose: string }
export interface InsulinDose { hour: number; dose: number; number: number }

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
    mean: valid && points.length ? points.reduce((sum, p) => sum + p.glucose / points.length, 0) : null,
    span: valid && points.length > 1 ? points[points.length - 1].hour - points[0].hour : 0,
    boundaryNadir: valid && minimum !== null && (points[0].glucose === minimum || points[points.length - 1].glucose === minimum),
  };
}

export function analyzeInsulinDoses(rows: InsulinDoseInput[]) {
  const doses: InsulinDose[] = [];
  const invalidRows: number[] = [];
  rows.forEach((row, index) => {
    if (!row.hour.trim() && !row.dose.trim()) return;
    const hour = parseNumber(row.hour);
    const dose = parseNumber(row.dose);
    if (!Number.isFinite(hour) || hour < 0 || hour > 48 || !Number.isFinite(dose) || dose <= 0) {
      invalidRows.push(index + 1);
    } else {
      doses.push({ hour, dose, number: index + 1 });
    }
  });
  doses.sort((a, b) => a.hour - b.hour);
  return { doses, invalidRows, valid: invalidRows.length === 0 };
}

// Place nearby injection labels on separate lanes, including simultaneous doses.
export function layoutInsulinMarkers(doses: InsulinDose[], maxHour: number) {
  const laneEnds: number[] = [];
  return doses.map((dose) => {
    const x = 76 + dose.hour / maxHour * 780;
    const label = `${dose.number} · ${dose.dose} U · ${dose.hour} h`;
    const width = Math.min(740, label.length * 7 + 12);
    const labelX = Math.max(76 + width / 2, Math.min(856 - width / 2, x));
    const start = labelX - width / 2;
    let lane = laneEnds.findIndex((end) => start > end + 12);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = start + width;
    return { ...dose, x, label, labelX, lane };
  });
}
