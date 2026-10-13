import { useRef, useState } from 'react';
import { Language } from '../i18n';
import { ENDOCRINE_SOURCES } from '../data/endocrineTesting';
import { analyzeGlucoseCurve, analyzeInsulinDoses, glucoseFromMgDl, GlucoseSampleInput, GlucoseUnit, InsulinDoseInput } from '../lib/glucoseCurve';
import { chartToPng, downloadBlob, exportGlucoseWorkbook } from '../lib/glucoseCurveExport';
import GlucoseCurveChart from './GlucoseCurveChart';

const blankRows = (): GlucoseSampleInput[] => Array.from({ length: 7 }, (_, id) => ({ id, hour: '', glucose: '' }));
const blankDoses = (): InsulinDoseInput[] => [{ id: 0, hour: '', dose: '' }];
type ExportAction = 'copy' | 'png' | 'excel';

export default function GlucoseCurveTool({ lang, initialSpecies = 'dog', open, onOpenChange }: { lang: Language; initialSpecies?: 'dog' | 'cat'; open: boolean; onOpenChange: (open: boolean) => void }) {
  const es = lang === 'es';
  const format = (value: number, displayUnit: GlucoseUnit) => new Intl.NumberFormat(es ? 'es' : 'en', { minimumFractionDigits: displayUnit === 'mmol/L' ? 1 : 0, maximumFractionDigits: displayUnit === 'mmol/L' ? 1 : 0 }).format(glucoseFromMgDl(value, displayUnit));
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [species, setSpecies] = useState<'dog' | 'cat'>(initialSpecies);
  const [rows, setRows] = useState(blankRows);
  const [doseRows, setDoseRows] = useState(blankDoses);
  const nextId = useRef(7);
  const nextDoseId = useRef(1);
  const chartRef = useRef<SVGSVGElement>(null);
  const [insulin, setInsulin] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<ExportAction | null>(null);
  const [exportStatus, setExportStatus] = useState<{ action: ExportAction; success: boolean } | null>(null);
  const curve = analyzeGlucoseCurve(rows, unit);
  const injections = analyzeInsulinDoses(doseRows);
  const points = curve.valid ? curve.points : [];
  const readyToExport = curve.valid && points.length > 0 && injections.valid && !busy;
  const source = species === 'dog' ? ENDOCRINE_SOURCES.curvesDog : ENDOCRINE_SOURCES.curvesCat;
  const setRow = (id: number, key: 'hour' | 'glucose', value: string) => { setExportStatus(null); setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row)); };
  const setDoseRow = (id: number, key: 'hour' | 'dose', value: string) => { setExportStatus(null); setDoseRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row)); };
  const changeUnit = (newUnit: GlucoseUnit) => {
    if (newUnit === unit) return;
    setExportStatus(null);
    setRows((current) => current.map((row) => {
      const value = Number(row.glucose.replace(',', '.'));
      if (!row.glucose.trim() || !Number.isFinite(value) || value <= 0) return row;
      const converted = newUnit === 'mmol/L' ? value / 18.0182 : value * 18.0182;
      return { ...row, glucose: String(Number(converted.toFixed(4))) };
    }));
    setUnit(newUnit);
  };
  const reset = () => { setRows(blankRows()); nextId.current = 7; setDoseRows(blankDoses()); nextDoseId.current = 1; setInsulin(''); setNotes(''); setExportStatus(null); };
  const exportCsv = () => {
    const csv = [['hour', `glucose (${unit})`], ...points.map((p) => [String(p.hour), String(glucoseFromMgDl(p.glucose, unit))])].map((row) => row.join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'wairua-glucose-curve.csv');
  };
  const exportChart = async (action: ExportAction) => {
    if (!readyToExport || !chartRef.current) return;
    setBusy(action);
    setExportStatus(null);
    try {
      if (action === 'copy' && (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')) throw new Error('Image clipboard unavailable');
      const png = chartToPng(chartRef.current);
      if (action === 'copy') {
        // Start during the click gesture; Safari accepts a promised PNG.
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      } else if (action === 'png') {
        downloadBlob(await png, 'wairua-glucose-curve.png');
      } else {
        const data = { lang, species, unit, insulin, notes, points, doses: injections.doses, nadir: curve.nadir!, nadirHours: curve.nadirHours, source };
        downloadBlob(await exportGlucoseWorkbook(data, await png), 'wairua-glucose-curve.xlsx');
      }
      setExportStatus({ action, success: true });
    } catch {
      setExportStatus({ action, success: false });
    } finally { setBusy(null); }
  };
  const statusText = exportStatus?.success
    ? exportStatus.action === 'copy' ? (es ? 'Gráfica copiada como imagen. Ya puedes pegarla.' : 'Chart copied as an image. You can paste it now.') : (es ? 'Descarga preparada.' : 'Download prepared.')
    : exportStatus?.action === 'copy' ? (es ? 'Este navegador no ha permitido copiar la imagen. Utiliza Descargar PNG.' : 'This browser did not allow copying the image. Use Download PNG.') : (es ? 'No se ha podido exportar. Vuelve a intentarlo.' : 'Export failed. Please try again.');

  return <details className="endocrine-disclosure endocrine-curve" id="endocrine-glucose-curve" open={open}>
    <summary onClick={(event) => { event.preventDefault(); onOpenChange(!open); }}><span className="endocrine-tool-icon" aria-hidden="true">↘</span><span className="endocrine-summary-copy"><strong>{es ? 'Curva de glucosa e insulina' : 'Glucose and insulin curve'}</strong><span>{es ? 'Lecturas, aplicaciones de insulina, nadir y exportación' : 'Readings, insulin administrations, nadir, and export'}</span></span><span className="endocrine-chevron" aria-hidden="true">⌄</span></summary>
    <div className="endocrine-disclosure-body">
    <p className="endocrine-curve-intro">{es ? 'Fija una hora de inicio (0 h) y registra cada lectura y cada aplicación de insulina respecto a ese mismo origen. Puedes registrar varias dosis durante 0–48 h.' : 'Set a start time (0 h) and record each reading and insulin administration relative to that same origin. You can record multiple doses over 0–48 h.'}</p>
    <div className="toolkit-utility-form endocrine-curve-settings">
      <label>{es ? 'Especie de la curva' : 'Curve species'}<select value={species} onChange={(e) => { setSpecies(e.target.value as 'dog' | 'cat'); setExportStatus(null); }}><option value="dog">{es ? 'Perro' : 'Dog'}</option><option value="cat">{es ? 'Gato' : 'Cat'}</option></select></label>
      <label>{es ? 'Unidad de glucosa' : 'Glucose unit'}<select value={unit} onChange={(e) => changeUnit(e.target.value as GlucoseUnit)}><option>mg/dL</option><option>mmol/L</option></select></label>
      <label>{es ? 'Insulina / concentración' : 'Insulin / strength'}<input value={insulin} onChange={(e) => { setInsulin(e.target.value); setExportStatus(null); }} placeholder={es ? 'Producto, U-40 / U-100 / U-300' : 'Product, U-40 / U-100 / U-300'} /></label>
    </div>
    <div className="endocrine-curve-workspace">
      <div className="endocrine-curve-inputs">
        <div className="endocrine-entry-heading"><span className="endocrine-step-number">1</span><h5>{es ? 'Lecturas de glucosa' : 'Glucose readings'}</h5></div>
        <div className="endocrine-table-scroll"><table className="endocrine-input-table"><caption className="sr-only">{es ? 'Muestras de glucosa' : 'Glucose samples'}</caption><thead><tr><th scope="col">{es ? 'Hora (h)' : 'Time (h)'}</th><th scope="col">{unit}</th><th scope="col"><span className="sr-only">{es ? 'Eliminar' : 'Remove'}</span></th></tr></thead><tbody>
          {rows.map((row, index) => <tr key={row.id}>
            <td><input type="number" min="0" max="48" step="any" placeholder="—" aria-label={`${es ? 'Hora muestra' : 'Sample hour'} ${index + 1}`} value={row.hour} onChange={(e) => setRow(row.id, 'hour', e.target.value)} /></td>
            <td><input type="number" min="0" step="any" placeholder="—" aria-label={`${es ? 'Glucosa muestra' : 'Sample glucose'} ${index + 1}`} value={row.glucose} onChange={(e) => setRow(row.id, 'glucose', e.target.value)} /></td>
            <td><button type="button" className="endocrine-remove-row" disabled={rows.length === 1} aria-label={`${es ? 'Eliminar muestra' : 'Remove sample'} ${index + 1}`} onClick={() => { setRows((current) => current.filter((item) => item.id !== row.id)); setExportStatus(null); }}>×</button></td>
          </tr>)}
        </tbody></table><button className="endocrine-text-button" type="button" onClick={() => { const id = nextId.current++; setRows((current) => [...current, { id, hour: '', glucose: '' }]); setExportStatus(null); }}>+ {es ? 'Añadir lectura' : 'Add reading'}</button></div>
        {curve.invalidRows.length > 0 && <p className="endocrine-input-error" role="status">{es ? 'Completa hora (0–48 h) y glucosa positiva en las filas: ' : 'Complete time (0–48 h) and positive glucose in rows: '}{curve.invalidRows.join(', ')}.</p>}
        {curve.duplicateHours && <p className="endocrine-input-error" role="status">{es ? 'Hay horas repetidas en las lecturas. Corrígelas para analizar una lectura por hora.' : 'Duplicate reading times. Correct them to analyze one reading per time.'}</p>}
        <div className="endocrine-entry-heading endocrine-insulin-heading"><span className="endocrine-step-number">2</span><h5>{es ? 'Aplicaciones de insulina' : 'Insulin administrations'}</h5></div>
        <p className="endocrine-field-hint">{es ? 'Opcional · dosis administradas en U, nunca en mL.' : 'Optional · administered doses in U, never in mL.'}</p>
        <div className="endocrine-table-scroll"><table className="endocrine-input-table endocrine-insulin-table"><caption className="sr-only">{es ? 'Dosis de insulina administradas' : 'Administered insulin doses'}</caption><thead><tr><th scope="col">{es ? 'Hora (h)' : 'Time (h)'}</th><th scope="col">{es ? 'Dosis (U)' : 'Dose (U)'}</th><th scope="col"><span className="sr-only">{es ? 'Eliminar' : 'Remove'}</span></th></tr></thead><tbody>
          {doseRows.map((row, index) => <tr key={row.id}>
            <td><input type="number" min="0" max="48" step="any" placeholder="—" aria-label={`${es ? 'Hora insulina' : 'Insulin time'} ${index + 1}`} value={row.hour} onChange={(e) => setDoseRow(row.id, 'hour', e.target.value)} /></td>
            <td><input type="number" min="0" step="any" placeholder="—" aria-label={`${es ? 'Dosis insulina' : 'Insulin dose'} ${index + 1}`} value={row.dose} onChange={(e) => setDoseRow(row.id, 'dose', e.target.value)} /></td>
            <td><button type="button" className="endocrine-remove-row" disabled={doseRows.length === 1} aria-label={`${es ? 'Eliminar insulina' : 'Remove insulin'} ${index + 1}`} onClick={() => { setDoseRows((current) => current.filter((item) => item.id !== row.id)); setExportStatus(null); }}>×</button></td>
          </tr>)}
        </tbody></table><button className="endocrine-text-button" type="button" onClick={() => { const id = nextDoseId.current++; setDoseRows((current) => [...current, { id, hour: '', dose: '' }]); setExportStatus(null); }}>+ {es ? 'Añadir aplicación' : 'Add administration'}</button></div>
        {injections.invalidRows.length > 0 && <p className="endocrine-input-error" role="status">{es ? 'Completa hora (0–48 h) y dosis positiva en las aplicaciones: ' : 'Complete time (0–48 h) and positive dose in administrations: '}{injections.invalidRows.join(', ')}. {es ? 'Corrige estos datos para exportar la gráfica.' : 'Correct these entries before exporting the chart.'}</p>}
      </div>
      <div className="endocrine-curve-preview">
        <div className="endocrine-entry-heading"><span className="endocrine-step-number">3</span><h5>{es ? 'Gráfica y resultados' : 'Chart and results'}</h5></div>
        {curve.valid && points.length > 0 ? <>
          <div className="endocrine-curve-metrics" aria-live="polite">
            <div className="endocrine-nadir"><span>{es ? 'Nadir observado' : 'Observed nadir'}</span><strong>{format(curve.nadir!, unit)} <small>{unit}</small></strong><span>{curve.nadirHours.join(' / ')} h</span></div>
            <div><span>{es ? 'Máximo' : 'Maximum'}</span><strong>{format(curve.maximum!, unit)} <small>{unit}</small></strong></div>
            <div><span>{es ? 'Media de muestras' : 'Sample mean'}</span><strong>{format(curve.mean!, unit)} <small>{unit}</small></strong><span>{points.length} {es ? 'lecturas' : 'readings'}</span></div>
          </div>
          <div className="endocrine-chart-wrap"><GlucoseCurveChart ref={chartRef} lang={lang} species={species} unit={unit} points={points} doses={injections.doses} insulin={insulin} nadir={curve.nadir!} nadirHours={curve.nadirHours} /></div>
          <p className="endocrine-field-hint endocrine-chart-scroll-hint">{es ? 'Desliza la gráfica horizontalmente para verla completa.' : 'Swipe the chart horizontally to view it in full.'}</p>
          {curve.boundaryNadir && <p className="endocrine-field-hint">{es ? 'El mínimo está en un extremo: puede no haberse capturado el nadir real.' : 'The minimum is at an endpoint: the true nadir may not have been captured.'}</p>}
        </> : <div className="endocrine-chart-empty"><svg viewBox="0 0 240 100" aria-hidden="true"><path d="M20 12v70h200" fill="none" stroke="currentColor" opacity="0.3" /><path d="M25 28Q70 70 100 65T215 24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 5" opacity="0.4" /></svg><strong>{curve.valid ? (es ? 'Tu gráfica aparecerá aquí' : 'Your chart will appear here') : (es ? 'Revisa las lecturas señaladas' : 'Review the flagged readings')}</strong><p>{es ? 'Añade una lectura para ver el mínimo y dos o más para trazar la curva. Las flechas marcarán la insulina.' : 'Add one reading to see the minimum and two or more to plot the curve. Arrows will mark insulin.'}</p></div>}
        {curve.points.some((point) => point.glucose < 80) && <p className="endocrine-alert" role="alert">{es ? 'Lectura baja: confirmar glucosa y valorar hipoglucemia antes de la siguiente dosis. No aumentar insulina; con debilidad, convulsiones o colapso, atención urgente.' : 'Low reading: confirm glucose and assess hypoglycemia before the next dose. Do not increase insulin; weakness, seizures, or collapse require urgent care.'}</p>}
        <div className="endocrine-export-actions" aria-label={es ? 'Exportar curva' : 'Export curve'}>
          <button type="button" className="secondary-button" disabled={!readyToExport} onClick={() => void exportChart('copy')}>{es ? 'Copiar gráfica' : 'Copy chart'}</button>
          <button type="button" className="secondary-button" disabled={!readyToExport} onClick={() => void exportChart('png')}>{es ? 'Descargar PNG' : 'Download PNG'}</button>
          <button type="button" className="primary-button" disabled={!readyToExport} onClick={() => void exportChart('excel')}>{es ? 'Descargar Excel' : 'Download Excel'}</button>
        </div>
        {busy && <p role="status">{es ? 'Preparando exportación…' : 'Preparing export…'}</p>}
        {exportStatus && <p role="status">{statusText}</p>}
        <p className="endocrine-field-hint">{es ? 'PNG y copia incluyen las flechas. Excel incluye gráfica, lecturas, dosis y observaciones.' : 'PNG and clipboard include arrows. Excel includes the chart, readings, doses, and notes.'}</p>
      </div>
    </div>
    <label className="endocrine-notes">{es ? 'Comida, hora de insulina, signos y observaciones' : 'Meals, insulin timing, signs, and observations'}<textarea rows={2} value={notes} onChange={(e) => { setNotes(e.target.value); setExportStatus(null); }} /></label>
    <div className="endocrine-actions"><button type="button" className="endocrine-text-button" disabled={!!busy} onClick={reset}>{es ? 'Vaciar curva y dosis' : 'Clear curve and doses'}</button><button type="button" className="endocrine-text-button" disabled={!readyToExport} onClick={exportCsv}>{es ? 'Solo lecturas CSV' : 'Readings only CSV'}</button></div>
    <footer className="endocrine-evidence"><details><summary>{es ? 'Interpretación, evidencia y fuentes' : 'Interpretation, evidence, and sources'}</summary><p>{es ? `Banda orientativa AAHA: ${format(80, unit)}–${format(species === 'dog' ? 200 : 300, unit)} ${unit}. Conserva comida y pauta habituales según el plan del paciente. El mínimo observado no demuestra el nadir real; la media de muestras no está ponderada por tiempo. Las flechas registran aplicaciones y no representan valores de glucosa. No se calcula una dosis de insulina ni se infiere efecto Somogyi.` : `AAHA reference band: ${format(80, unit)}–${format(species === 'dog' ? 200 : 300, unit)} ${unit}. Maintain normal feeding and dosing according to the patient’s plan. The observed minimum is not proof of the true nadir; sample mean is not time weighted. Arrows record administrations, not glucose values. No insulin dose is calculated or Somogyi effect inferred.`}</p><a href={source} target="_blank" rel="noreferrer">AAHA · {es ? 'monitorización de glucosa' : 'glucose monitoring'} ↗</a></details></footer>
    </div>
  </details>;
}
