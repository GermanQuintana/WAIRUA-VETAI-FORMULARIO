import { useRef, useState } from 'react';
import { Language } from '../i18n';
import { ENDOCRINE_SOURCES } from '../data/endocrineTesting';
import { analyzeGlucoseCurve, glucoseFromMgDl, GlucoseSampleInput, GlucoseUnit } from '../lib/glucoseCurve';

const blankRows = (): GlucoseSampleInput[] => Array.from({ length: 7 }, (_, id) => ({ id, hour: '', glucose: '' }));
const format = (value: number, unit: GlucoseUnit) => glucoseFromMgDl(value, unit).toFixed(unit === 'mg/dL' ? 0 : 1);

export default function GlucoseCurveTool({ lang, initialSpecies = 'dog' }: { lang: Language; initialSpecies?: 'dog' | 'cat' }) {
  const es = lang === 'es';
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [species, setSpecies] = useState<'dog' | 'cat'>(initialSpecies);
  const [rows, setRows] = useState(blankRows);
  const nextId = useRef(7);
  const [insulin, setInsulin] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const curve = analyzeGlucoseCurve(rows, unit);
  const points = curve.valid ? curve.points : [];
  const maxHour = Math.max(12, ...points.map((p) => p.hour));
  const maxGlucose = Math.max(350, ...points.map((p) => p.glucose)) * 1.08;
  const x = (hour: number) => 60 + hour / maxHour * 580;
  const y = (value: number) => 255 - value / maxGlucose * 225;
  const upper = species === 'dog' ? 200 : 300;
  const setRow = (id: number, key: 'hour' | 'glucose', value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const changeUnit = (newUnit: GlucoseUnit) => {
    // Convert entered values, never silently reinterpret them after switching units.
    setRows((current) => current.map((row) => {
      const value = Number(row.glucose.replace(',', '.'));
      if (!row.glucose.trim() || !Number.isFinite(value) || value <= 0) return row;
      const converted = newUnit === 'mmol/L' ? value / 18.0182 : value * 18.0182;
      return { ...row, glucose: String(Number(converted.toFixed(4))) };
    }));
    setUnit(newUnit);
  };
  const reset = () => { setRows(blankRows()); nextId.current = 7; setInsulin(''); setDose(''); setNotes(''); };
  const exportCsv = () => {
    const csv = [['hour', `glucose (${unit})`], ...points.map((p) => [String(p.hour), String(glucoseFromMgDl(p.glucose, unit))])].map((row) => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'wairua-glucose-curve.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="toolkit-reference-table endocrine-curve" id="endocrine-glucose-curve">
    <div className="toolkit-reference-header"><h4>{es ? 'Curva de glucosa · nadir observado' : 'Glucose curve · observed nadir'}</h4></div>
    <p>{es ? 'Introduce horas desde la insulina (0 = antes de la dosis) y glucosa. Campos vacíos al iniciar; conserva comida y pauta habituales según el plan del paciente.' : 'Enter hours from insulin (0 = before dosing) and glucose. Fields start empty; maintain normal feeding and dosing according to the patient’s plan.'}</p>
    <div className="toolkit-utility-form">
      <label>{es ? 'Especie de la curva' : 'Curve species'}<select value={species} onChange={(e) => setSpecies(e.target.value as 'dog' | 'cat')}><option value="dog">{es ? 'Perro' : 'Dog'}</option><option value="cat">{es ? 'Gato' : 'Cat'}</option></select></label>
      <label>{es ? 'Unidad de glucosa' : 'Glucose unit'}<select value={unit} onChange={(e) => changeUnit(e.target.value as GlucoseUnit)}><option>mg/dL</option><option>mmol/L</option></select></label>
      <label>{es ? 'Insulina / concentración' : 'Insulin / strength'}<input value={insulin} onChange={(e) => setInsulin(e.target.value)} placeholder={es ? 'Producto, U-40/U-100/U-300' : 'Product, U-40/U-100/U-300'} /></label>
      <label>{es ? 'Dosis administrada (U)' : 'Administered dose (U)'}<input type="number" min="0" step="any" value={dose} onChange={(e) => setDose(e.target.value)} /></label>
    </div>
    <div className="endocrine-curve-layout">
      <div className="endocrine-table-scroll"><table className="endocrine-input-table"><caption>{es ? 'Muestras de glucosa' : 'Glucose samples'}</caption><thead><tr><th scope="col">{es ? 'Hora (0–48 h)' : 'Time (0–48 h)'}</th><th scope="col">{unit}</th><th scope="col">{es ? 'Acción' : 'Action'}</th></tr></thead><tbody>
        {rows.map((row, index) => <tr key={row.id}>
          <td><input type="number" min="0" max="48" step="any" aria-label={`${es ? 'Hora muestra' : 'Sample hour'} ${index + 1}`} value={row.hour} onChange={(e) => setRow(row.id, 'hour', e.target.value)} /></td>
          <td><input type="number" min="0" step="any" aria-label={`${es ? 'Glucosa muestra' : 'Sample glucose'} ${index + 1}`} value={row.glucose} onChange={(e) => setRow(row.id, 'glucose', e.target.value)} /></td>
          <td><button type="button" disabled={rows.length === 1} aria-label={`${es ? 'Eliminar muestra' : 'Remove sample'} ${index + 1}`} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>×</button></td>
        </tr>)}
      </tbody></table><button className="secondary-button" type="button" onClick={() => { const id = nextId.current++; setRows((current) => [...current, { id, hour: '', glucose: '' }]); }}>{es ? 'Añadir muestra' : 'Add sample'}</button></div>
      <div>
        {curve.invalidRows.length > 0 && <p role="status">{es ? 'Completa hora y glucosa positiva en las filas: ' : 'Complete time and positive glucose in rows: '}{curve.invalidRows.join(', ')}.</p>}
        {curve.duplicateHours && <p role="status">{es ? 'Hay horas repetidas. Corrígelas para analizar una sola lectura por hora.' : 'Duplicate times. Correct them to analyze one reading per time.'}</p>}
        {curve.valid && points.length > 0 ? <>
          <div className="haemo-metrics" aria-live="polite">
            <article className="haemo-metric-card"><span>{es ? 'Nadir observado' : 'Observed nadir'}</span><strong>{format(curve.nadir!, unit)} {unit}</strong><p>{curve.nadirHours.join(' / ')} h</p></article>
            <article className="haemo-metric-card"><span>{es ? 'Máximo / media de muestras' : 'Maximum / sample mean'}</span><strong>{format(curve.maximum!, unit)} / {format(curve.mean!, unit)}</strong><p>{points.length} {es ? 'lecturas' : 'readings'} · {curve.span.toFixed(1)} h</p></article>
          </div>
          <svg className="endocrine-chart" viewBox="0 0 680 300" role="img" aria-label={es ? `Curva con nadir observado de ${format(curve.nadir!, unit)} ${unit} a ${curve.nadirHours.join(', ')} horas` : `Curve with observed nadir ${format(curve.nadir!, unit)} ${unit} at ${curve.nadirHours.join(', ')} hours`}>
            <rect x="60" y={y(upper)} width="580" height={y(80) - y(upper)} className="endocrine-chart-band" />
            {[0, 80, upper, Math.round(maxGlucose)].map((value) => <g key={value}><line x1="60" x2="640" y1={y(value)} y2={y(value)} className="endocrine-chart-grid" /><text x="52" y={y(value) + 4} textAnchor="end">{format(value, unit)}</text></g>)}
            {[0, maxHour / 2, maxHour].map((hour) => <text key={hour} x={x(hour)} y="277" textAnchor="middle">{hour} h</text>)}
            {points.length > 1 && <polyline points={points.map((p) => `${x(p.hour)},${y(p.glucose)}`).join(' ')} fill="none" className="endocrine-chart-line" />}
            {points.map((p) => <circle key={p.hour} cx={x(p.hour)} cy={y(p.glucose)} r={p.glucose === curve.nadir ? 6 : 4} className="endocrine-chart-point"><title>{p.hour} h: {format(p.glucose, unit)} {unit}</title></circle>)}
          </svg>
          {curve.boundaryNadir && <p>{es ? 'El mínimo está en un extremo de la curva: puede no haberse capturado el nadir real.' : 'The minimum is at a curve endpoint: the true nadir may not have been captured.'}</p>}
        </> : curve.valid ? <p>{es ? 'Introduce al menos una muestra completa para ver el mínimo. Dos o más permiten trazar la curva.' : 'Enter at least one complete sample to see the minimum. Two or more allow plotting.'}</p> : null}
        {curve.points.some((point) => point.glucose < 80) && <p className="endocrine-alert" role="alert">{es ? 'Lectura baja: confirmar glucosa y valorar hipoglucemia antes de la siguiente dosis. No aumentar insulina; con debilidad, convulsiones o colapso, atención urgente.' : 'Low reading: confirm glucose and assess hypoglycemia before the next dose. Do not increase insulin; weakness, seizures, or collapse require urgent care.'}</p>}
        <p>{es ? `Banda orientativa AAHA: ${format(80, unit)}–${format(upper, unit)} ${unit}. El mínimo observado no demuestra el nadir real. Líneas entre muestras son visuales; la media no es una media ponderada en el tiempo. No se calcula una dosis de insulina ni se infiere efecto Somogyi.` : `AAHA reference band: ${format(80, unit)}–${format(upper, unit)} ${unit}. The observed minimum is not proof of the true nadir. Connecting lines are visual; the mean is not time weighted. No insulin dose is calculated or Somogyi effect inferred.`}</p>
      </div>
    </div>
    <label className="endocrine-notes">{es ? 'Comida, hora de insulina, signos y observaciones' : 'Meals, insulin timing, signs, and observations'}<textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
    <div className="endocrine-actions"><button type="button" className="secondary-button" onClick={reset}>{es ? 'Vaciar curva' : 'Clear curve'}</button><button type="button" className="secondary-button" disabled={!curve.valid || points.length === 0} onClick={exportCsv}>{es ? 'Exportar muestras CSV' : 'Export samples CSV'}</button><a href={species === 'dog' ? ENDOCRINE_SOURCES.curvesDog : ENDOCRINE_SOURCES.curvesCat} target="_blank" rel="noreferrer">AAHA · {es ? 'monitorización de glucosa' : 'glucose monitoring'}</a></div>
  </section>;
}
