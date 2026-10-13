import { useState } from 'react';
import { Language } from '../i18n';
import { ENDOCRINE_PROTOCOLS, ENDOCRINE_SOURCES, EndocrineSpecies, EndocrineSystem, EndocrineText } from '../data/endocrineTesting';
import GlucoseCurveTool from './GlucoseCurveTool';

const speciesLabels: Record<EndocrineSpecies, EndocrineText> = {
  dog: { es: 'Perro', en: 'Dog' }, cat: { es: 'Gato', en: 'Cat' }, ferret: { es: 'Hurón', en: 'Ferret' },
};
const systemLabels: Record<EndocrineSystem, EndocrineText> = {
  adrenal: { es: 'Adrenal / cortisol', en: 'Adrenal / cortisol' }, thyroid: { es: 'Tiroides', en: 'Thyroid' },
  pancreas: { es: 'Diabetes / páncreas', en: 'Diabetes / pancreas' }, other: { es: 'Otras pruebas', en: 'Other tests' },
};
const evidenceLabels = {
  official: { es: 'Ficha oficial', en: 'Official product label' }, guideline: { es: 'Guía / consenso clínico', en: 'Clinical guideline / consensus' },
  study: { es: 'Estudio diagnóstico', en: 'Diagnostic study' }, limited: { es: 'Evidencia limitada / casos seleccionados', en: 'Limited evidence / selected cases' },
};
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const helpers = [
  { id: 'cosacthen', species: 'dog', dose: 5, unit: 'µg', title: { es: 'Cosacthen · 5 µg/kg IV/IM (ficha AEMPS)', en: 'Cosacthen · 5 µg/kg IV/IM (AEMPS label)' }, note: { es: '250 µg/mL; cortisol basal y a 60–90 min. Pauta oficial sin máximo de dosis especificado. Vial de uso único.', en: '250 µg/mL; baseline and 60–90 min cortisol. Official protocol with no specified dose maximum. Single-use vial.' }, source: ENDOCRINE_SOURCES.cosacthen },
  { id: 'acth-aaha', species: 'dog', dose: 5, cap: 250, unit: 'µg', title: { es: 'Cosintropina · AAHA 5 µg/kg (máx. 250 µg)', en: 'Cosyntropin · AAHA 5 µg/kg (max. 250 µg)' }, note: { es: 'Protocolo genérico AAHA: IV/IM, basal y a 1 h. No trasladar este máximo a la ficha de Cosacthen.', en: 'Generic AAHA protocol: IV/IM, baseline and 1 h. Do not transfer this maximum to the Cosacthen label.' }, source: ENDOCRINE_SOURCES.addison },
  { id: 'acth-monitor', species: 'dog', dose: 1, unit: 'µg', title: { es: 'ACTH · seguimiento 1 µg/kg IV (fuera de ficha)', en: 'ACTH · monitoring 1 µg/kg IV (off label)' }, note: { es: 'Solo seguimiento de trilostano/mitotano según AAHA. Trilostano: iniciar a 3–5 h de la dosis y muestra 1 h tras ACTH. Con Cosacthen se aparta de la posología oficial; no usar para diagnosticar Cushing.', en: 'Only trilostane/mitotane monitoring per AAHA. Trilostane: start 3–5 h after dosing, sample 1 h after ACTH. Outside the Cosacthen licensed dose; not for Cushing diagnosis.' }, source: ENDOCRINE_SOURCES.adrenalTreatment },
  { id: 'dog-lddst', species: 'dog', dose: 0.01, unit: 'mg', title: { es: 'LDDST perro · dexametasona 0,01 mg/kg IV', en: 'Dog LDDST · dexamethasone 0.01 mg/kg IV' }, note: { es: 'Cortisol T0, T4 y T8 h. Introducir concentración equivalente de dexametasona base del producto, no confundir con masa de la sal.', en: 'Cortisol T0, T4, and T8 h. Enter equivalent dexamethasone-base concentration for the actual product, not salt mass.' }, source: ENDOCRINE_SOURCES.adrenalDiagnosis },
  { id: 'dog-hddst', species: 'dog', dose: 0.1, unit: 'mg', title: { es: 'HDDST perro · dexametasona 0,1 mg/kg IV', en: 'Dog HDDST · dexamethasone 0.1 mg/kg IV' }, note: { es: 'Diferenciación tras confirmar Cushing; no cribado. Cortisol T0, T4 y T8 h.', en: 'Differentiation after Cushing confirmation, not screening. Cortisol T0, T4, and T8 h.' }, source: ENDOCRINE_SOURCES.acvim },
  { id: 'cat-lddst', species: 'cat', dose: 0.1, unit: 'mg', title: { es: 'LDDST gato · dexametasona 0,1 mg/kg IV', en: 'Cat LDDST · dexamethasone 0.1 mg/kg IV' }, note: { es: 'Cortisol T0, T4 y T8 h. Dosis diez veces la canina; confirmar producto y concentración equivalente de base.', en: 'Cortisol T0, T4, and T8 h. Ten times the canine dose; confirm product and equivalent base concentration.' }, source: ENDOCRINE_SOURCES.adrenalCat },
] as const;

export default function EndocrineToolkit({ lang }: { lang: Language }) {
  const es = lang === 'es';
  const [species, setSpecies] = useState<EndocrineSpecies>('dog');
  const [system, setSystem] = useState<EndocrineSystem | 'all'>('all');
  const [query, setQuery] = useState('');
  const [helperId, setHelperId] = useState<string>('cosacthen');
  const [weight, setWeight] = useState('');
  const [concentration, setConcentration] = useState('');
  const [openProtocolId, setOpenProtocolId] = useState<string | null>(null);
  const [openSystems, setOpenSystems] = useState<EndocrineSystem[]>([]);
  const [helperOpen, setHelperOpen] = useState(false);
  const [curveOpen, setCurveOpen] = useState(false);
  const availableHelpers = helpers.filter((helper) => helper.species === species);
  const helper = availableHelpers.find((item) => item.id === helperId) ?? availableHelpers[0];
  const speciesProtocols = ENDOCRINE_PROTOCOLS.filter((p) => p.species.includes(species));
  const availableSystems = [...new Set(speciesProtocols.map((p) => p.system))];
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const filtered = speciesProtocols.filter((p) => (system === 'all' || p.system === system) && tokens.every((token) => normalize([p.title[lang], p.indications[lang], p.preparation[lang], p.interpretation[lang], ...p.steps.map((s) => s.action[lang])].join(' ')).includes(token)));
  const numericWeight = weight.trim() ? Number(weight.replace(',', '.')) : NaN;
  const numericConcentration = concentration.trim() ? Number(concentration.replace(',', '.')) : NaN;
  const rawDose = helper && Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight * helper.dose : null;
  const cap = helper && 'cap' in helper ? helper.cap : null;
  const dose = rawDose !== null && cap ? Math.min(rawDose, cap) : rawDose;
  const volume = dose !== null && Number.isFinite(numericConcentration) && numericConcentration > 0 ? dose / numericConcentration : null;
  const display = (value: number) => new Intl.NumberFormat(es ? 'es' : 'en', { maximumFractionDigits: 4 }).format(value);

  return <section className="toolkit-utility endocrine-toolkit">
    <div className="toolkit-utility-header"><div><p className="section-kicker">{es ? 'Pruebas y seguimiento' : 'Testing and monitoring'}</p><h3>{es ? 'Endocrino' : 'Endocrinology'}</h3><p>{es ? 'Protocolos por especie, preparación, tiempos de muestreo e interpretación clínica.' : 'Species-specific protocols, preparation, sampling times, and clinical interpretation.'}</p></div></div>
    <p className="endocrine-lab-note">{es ? 'Interpretación: utiliza los rangos y puntos de corte de tu laboratorio.' : 'Interpretation: use your laboratory’s reference ranges and diagnostic cutoffs.'}</p>
    <div className="toolkit-utility-form endocrine-filters">
      <label>{es ? 'Especie' : 'Species'}<select value={species} onChange={(e) => { const next = e.target.value as EndocrineSpecies; setSpecies(next); setSystem('all'); setOpenSystems([]); setOpenProtocolId(null); setHelperOpen(false); setCurveOpen(false); setHelperId(helpers.find((h) => h.species === next)?.id ?? ''); setConcentration(''); setWeight(''); }}>{Object.entries(speciesLabels).map(([id, label]) => <option key={id} value={id}>{label[lang]}</option>)}</select></label>
      <label>{es ? 'Buscar prueba, enfermedad o medicamento' : 'Search test, disease, or medication'}<input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setOpenSystems(e.target.value.trim() ? availableSystems : []); setOpenProtocolId(null); }} placeholder={es ? 'ACTH, Cosacthen, cortisol, T4, fructosamina…' : 'ACTH, Cosacthen, cortisol, T4, fructosamine…'} /></label>
    </div>
    <p className="live-hint">{es ? 'Cambiar de especie vacía los cálculos y la curva para iniciar otro paciente.' : 'Changing species clears calculations and the curve to start another patient.'}</p>
    <div className="endo-system-row" role="group" aria-label={es ? 'Filtrar por sistema' : 'Filter by system'}>
      <button type="button" aria-pressed={system === 'all'} className={system === 'all' ? 'active' : ''} onClick={() => setSystem('all')}>{es ? 'Todos' : 'All'}</button>
      {availableSystems.map((id) => <button key={id} type="button" aria-pressed={system === id} className={system === id ? 'active' : ''} onClick={() => { setSystem(id); setOpenSystems([id]); setOpenProtocolId(null); }}>{systemLabels[id][lang]}</button>)}
    </div>

    {(helper || species !== 'ferret') && <div className="endocrine-section-heading"><h4>{es ? 'Herramientas' : 'Tools'}</h4><button type="button" className="endocrine-text-button" onClick={() => { setOpenSystems([]); setOpenProtocolId(null); setHelperOpen(false); setCurveOpen(false); }}>{es ? 'Contraer todo' : 'Collapse all'}</button></div>}
    <div className="endocrine-tools">
    {helper && <details key={`helper-${species}`} className="endocrine-disclosure endocrine-helper" open={helperOpen}>
      <summary onClick={(event) => { event.preventDefault(); setHelperOpen(!helperOpen); }}><span className="endocrine-tool-icon" aria-hidden="true">{species === 'cat' ? 'mg' : 'µg'}</span><span className="endocrine-summary-copy"><strong>{es ? 'Dosis para las pruebas' : 'Test doses'}</strong><span>{species === 'cat' ? (es ? 'Dexametasona · peso y volumen' : 'Dexamethasone · weight and volume') : (es ? 'ACTH / Cosacthen y dexametasona · peso y volumen' : 'ACTH / Cosacthen and dexamethasone · weight and volume')}</span></span><span className="endocrine-chevron" aria-hidden="true">⌄</span></summary>
      <div className="endocrine-disclosure-body">
      <div className="toolkit-utility-form">
        <label>{es ? 'Protocolo de cálculo' : 'Calculator protocol'}<select value={helper.id} onChange={(e) => { setHelperId(e.target.value); setConcentration(''); }}>{availableHelpers.map((h) => <option key={h.id} value={h.id}>{h.title[lang]}</option>)}</select></label>
        <label>{es ? 'Peso (kg)' : 'Weight (kg)'}<input type="number" min="0" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
        <label>{es ? 'Concentración' : 'Concentration'} ({helper.unit}/mL)<input type="number" min="0" step="any" value={concentration} onChange={(e) => setConcentration(e.target.value)} /></label>
      </div>
      {helper.unit === 'µg' && <button type="button" className="secondary-button" onClick={() => setConcentration('250')}>{es ? 'Usar Cosacthen 250 µg/mL' : 'Use Cosacthen 250 µg/mL'}</button>}
      <p>{helper.note[lang]}</p>
      {helper.id === 'cosacthen' && <p>{es ? 'No usar en gestación/hipersensibilidad; no recomendado en lactancia. Seguridad no establecida en <5 meses, <4,5 kg, diabetes o hipotiroidismo: valorar beneficio/riesgo.' : 'Do not use in pregnancy/hypersensitivity; not recommended during lactation. Safety not established below 5 months/4.5 kg or with diabetes/hypothyroidism: assess benefit/risk.'}</p>}
      <div className="haemo-metrics" aria-live="polite"><article className="haemo-metric-card"><span>{es ? 'Dosis de la prueba' : 'Test dose'}</span><strong>{dose === null ? '—' : `${display(dose)} ${helper.unit}`}</strong></article><article className="haemo-metric-card"><span>{es ? 'Volumen' : 'Volume'}</span><strong>{volume === null ? '—' : `${display(volume)} mL`}</strong></article></div>
      {cap && rawDose !== null && rawDose > cap && <p>{es ? `Aplicado máximo AAHA de ${cap} µg.` : `AAHA ${cap} µg maximum applied.`}</p>}
      {concentration && (!Number.isFinite(numericConcentration) || numericConcentration <= 0) && <p role="status">{es ? 'La concentración debe ser mayor que cero para calcular mL.' : 'Concentration must be greater than zero to calculate mL.'}</p>}
      <footer className="endocrine-evidence"><a href={helper.source} target="_blank" rel="noreferrer">{es ? 'Fuente y pauta completa' : 'Source and full protocol'}</a></footer>
      </div>
    </details>}
    {species !== 'ferret' && <GlucoseCurveTool key={`curve-${species}`} lang={lang} initialSpecies={species} open={curveOpen} onOpenChange={setCurveOpen} />}
    </div>
    <div className="endocrine-section-heading"><h4>{es ? 'Protocolos clínicos' : 'Clinical protocols'}</h4><span aria-live="polite">{filtered.length} {es ? 'protocolos' : 'protocols'} · {speciesLabels[species][lang]}</span></div>
    {filtered.length === 0 && <p>{es ? 'No hay protocolos para estos filtros.' : 'No protocols match these filters.'}</p>}
    <div className="endocrine-system-list">{availableSystems.map((id, index) => {
      const protocols = filtered.filter((p) => p.system === id);
      if (!protocols.length) return null;
      return <details key={`${species}-${id}`} className={`endocrine-disclosure endocrine-system endocrine-system-${id}`} open={openSystems.includes(id)}>
      <summary onClick={(event) => { event.preventDefault(); setOpenSystems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }}><span className="endocrine-system-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="endocrine-summary-copy"><strong>{systemLabels[id][lang]}</strong><span>{protocols.length} {es ? 'protocolos' : 'protocols'}</span></span><span className="endocrine-chevron" aria-hidden="true">⌄</span></summary>
      <div className="endocrine-protocol-list">{protocols.map((protocol) => <details key={protocol.id} id={`endo-${protocol.id}`} className="endocrine-protocol-row" open={openProtocolId === protocol.id}>
      <summary onClick={(event) => { event.preventDefault(); setOpenProtocolId((current) => current === protocol.id ? null : protocol.id); }}><strong>{protocol.title[lang]}</strong><span className="endocrine-chevron" aria-hidden="true">⌄</span></summary>
      {openProtocolId === protocol.id && <div className="endo-protocol-content">
        <div className="endo-protocol-block"><strong>{es ? 'Cuándo usarla' : 'When to use it'}</strong><p>{protocol.indications[lang]}</p></div>
        <div className="endo-protocol-block"><strong>{es ? 'Preparación y medicación' : 'Preparation and medication'}</strong><p>{protocol.preparation[lang]}</p></div>
        <div className="endo-protocol-block"><strong>{es ? 'Cronograma / toma de muestras' : 'Timeline / sampling'}</strong><ol className="endo-step-list compact">{protocol.steps.map((step, index) => <li key={`${protocol.id}-${index}`} className="endo-step-card"><span>{step.time}</span><p>{step.action[lang]}</p></li>)}</ol></div>
        <div className="endo-protocol-block"><strong>{es ? 'Interpretación y seguimiento' : 'Interpretation and follow-up'}</strong><p>{protocol.interpretation[lang]}</p></div>
        <div className="endo-protocol-block"><strong>{es ? 'Limitaciones, interferencias y seguridad' : 'Limitations, interference, and safety'}</strong><p>{protocol.limitations[lang]}</p></div>
        <footer className="endocrine-evidence"><details><summary>{es ? 'Evidencia, estudios y fuentes' : 'Evidence, studies, and sources'}</summary><p className="endocrine-evidence-level">{evidenceLabels[protocol.evidence][lang]}</p><p>{protocol.accuracy[lang]}</p><p className="live-hint">{es ? 'Sensibilidad y especificidad dependen del ensayo y la población; no equivalen a la probabilidad individual de enfermedad.' : 'Sensitivity and specificity depend on assay and population; they are not an individual probability of disease.'}</p><ul>{protocol.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul></details></footer>
      </div>}
    </details>)}</div>
    </details>;
    })}</div>
    <p className="endocrine-review-date">{es ? 'Contenido clínico revisado el 13/10/2026.' : 'Clinical content reviewed on 13 Oct 2026.'}</p>
  </section>;
}
