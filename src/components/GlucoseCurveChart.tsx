import { forwardRef } from 'react';
import { Language } from '../i18n';
import { GlucosePoint, GlucoseUnit, InsulinDose, glucoseFromMgDl, layoutInsulinMarkers } from '../lib/glucoseCurve';

interface Props {
  lang: Language;
  species: 'dog' | 'cat';
  unit: GlucoseUnit;
  points: GlucosePoint[];
  doses: InsulinDose[];
  insulin: string;
  nadir: number;
  nadirHours: number[];
}

const GlucoseCurveChart = forwardRef<SVGSVGElement, Props>(function GlucoseCurveChart({ lang, species, unit, points, doses, insulin, nadir, nadirHours }, ref) {
  const es = lang === 'es';
  const format = (value: number) => new Intl.NumberFormat(es ? 'es' : 'en', { maximumFractionDigits: unit === 'mg/dL' ? 0 : 1 }).format(glucoseFromMgDl(value, unit));
  const lastHour = Math.max(12, ...points.map((p) => p.hour), ...doses.map((d) => d.hour));
  const tickStep = lastHour <= 12 ? 2 : lastHour <= 24 ? 4 : 8;
  const maxHour = Math.ceil(lastHour / tickStep) * tickStep;
  const maxValue = Math.max(350, ...points.map((p) => p.glucose));
  const maxGlucose = Math.min(Number.MAX_VALUE, maxValue * 1.12) || maxValue;
  const upper = species === 'dog' ? 200 : 300;
  const x = (hour: number) => 76 + hour / maxHour * 780;
  const y = (value: number) => 306 - value / maxGlucose * 210;
  const markers = layoutInsulinMarkers(doses, maxHour);
  const lanes = Math.max(1, ...markers.map((marker) => marker.lane + 1));
  const height = 418 + lanes * 28;
  const subtitle = `${es ? (species === 'dog' ? 'Perro' : 'Gato') : (species === 'dog' ? 'Dog' : 'Cat')} · ${unit}${insulin.trim() ? ` · ${insulin.trim().slice(0, 70)}` : ''}`;

  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" className="endocrine-chart" viewBox={`0 0 900 ${height}`} width="900" height={height} role="img" aria-label={es ? `Curva de glucosa: nadir observado ${format(nadir)} ${unit} a ${nadirHours.join(', ')} h; ${doses.length} dosis de insulina marcadas con flechas.` : `Glucose curve: observed nadir ${format(nadir)} ${unit} at ${nadirHours.join(', ')} h; ${doses.length} insulin doses marked with arrows.`}>
    <rect width="900" height={height} rx="12" fill="#ffffff" />
    <g fontFamily="Arial, sans-serif" fill="#243b48">
      <text x="28" y="32" fontSize="18" fontWeight="700">WAIRUA · {es ? 'Curva de glucosa' : 'Glucose curve'}</text>
      <text x="28" y="57" fontSize="13" fill="#526677">{subtitle}</text>
      <text x="856" y="32" textAnchor="end" fontSize="14" fontWeight="700" fill="#087b86">{es ? 'Nadir observado' : 'Observed nadir'}: {format(nadir)} {unit}</text>
      <text x="856" y="57" textAnchor="end" fontSize="12" fill="#526677">{nadirHours.join(' / ')} h</text>
      <rect x="76" y={y(upper)} width="780" height={y(80) - y(upper)} fill="#e4f4ef" />
      {[0, 80, upper, maxGlucose].map((value) => <g key={value}>
        <line x1="76" x2="856" y1={y(value)} y2={y(value)} stroke="#d9e3e8" strokeWidth="1" />
        <text x="64" y={y(value) + 4} textAnchor="end" fontSize="12">{format(value)}</text>
      </g>)}
      {Array.from({ length: Math.round(maxHour / tickStep) + 1 }, (_, index) => index * tickStep).map((hour) => <g key={hour}>
        <line x1={x(hour)} x2={x(hour)} y1="96" y2="306" stroke="#edf1f4" strokeWidth="1" />
        <text x={x(hour)} y="330" textAnchor="middle" fontSize="12">{hour} h</text>
      </g>)}
      {markers.map((marker) => <g key={marker.number}>
        <line x1={marker.x} x2={marker.x} y1="96" y2="306" stroke="#b45e18" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.65" />
        <path d={`M${marker.x} 104 v24 m-5 -6 l5 6 5 -6`} fill="none" stroke="#a65213" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={marker.x} x2={marker.labelX} y1="344" y2={354 + marker.lane * 28} stroke="#c78346" strokeWidth="1" />
        <rect x={marker.labelX - (marker.label.length * 7 + 12) / 2} y={348 + marker.lane * 28} width={marker.label.length * 7 + 12} height="24" rx="5" fill="#fff1e4" />
        <text x={marker.labelX} y={364 + marker.lane * 28} textAnchor="middle" fontSize="12" fontWeight="700" fill="#8e450e">{marker.label}</text>
      </g>)}
      {points.length > 1 && <polyline points={points.map((point) => `${x(point.hour)},${y(point.glucose)}`).join(' ')} fill="none" stroke="#087b86" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((point) => <g key={point.hour}>
        {point.glucose === nadir && <circle cx={x(point.hour)} cy={y(point.glucose)} r="10" fill="#087b86" opacity="0.15" />}
        <circle cx={x(point.hour)} cy={y(point.glucose)} r={point.glucose === nadir ? 6 : 4} fill="#087b86" stroke="#ffffff" strokeWidth="2"><title>{point.hour} h: {format(point.glucose)} {unit}</title></circle>
      </g>)}
      <line x1="28" x2="51" y1={height - 39} y2={height - 39} stroke="#087b86" strokeWidth="3" /><text x="59" y={height - 35} fontSize="12">{es ? 'Glucosa' : 'Glucose'}</text>
      <rect x="158" y={height - 47} width="16" height="14" fill="#e4f4ef" /><text x="182" y={height - 35} fontSize="12">AAHA {format(80)}–{format(upper)} {unit}</text>
      <path d={`M425 ${height - 48} v16 m-4 -4 l4 4 4 -4`} fill="none" stroke="#a65213" strokeWidth="2" /><text x="438" y={height - 35} fontSize="12">{es ? 'Aplicación de insulina (U)' : 'Insulin administration (U)'}</text>
      <text x="28" y={height - 12} fontSize="11" fill="#526677">{es ? 'Horas desde el inicio del registro. Líneas entre muestras orientativas; mínimo observado, no nadir demostrado.' : 'Hours from the start of the record. Connecting lines are visual; observed minimum, not a proven nadir.'}</text>
    </g>
  </svg>;
});

export default GlucoseCurveChart;
