import { useState } from 'react';
import { Language } from '../i18n';

type Localized = { es: string; en: string };
type DogSize = 'small' | 'medium' | 'large';
type FipPresentation = 'systemic' | 'ocular' | 'neurologic';

const show = (copy: Localized, lang: Language) => copy[lang];
const validPositive = (value: string) => {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const format = (value: number, lang: Language, digits = 2) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: digits }).format(value);

const chillMelatonin: Record<DogSize, string> = { small: '0.5–1 mg', medium: '1–3 mg', large: '5 mg' };

function Bibliography({ lang, items }: { lang: Language; items: { title: string; url: string; note: Localized }[] }) {
  return (
    <section className="toolkit-utility-card protocol-bibliography">
      <h4>{lang === 'es' ? 'Bibliografía y base de la pauta' : 'References and dosing basis'}</h4>
      <ol>
        {items.map((item) => (
          <li key={item.url}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
            <span>{show(item.note, lang)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ChillProtocolToolkit({ lang }: { lang: Language }) {
  const [weight, setWeight] = useState('10');
  const [size, setSize] = useState<DogSize>('medium');
  const [concentration, setConcentration] = useState('10');
  const kg = validPositive(weight);
  const mgPerMl = validPositive(concentration);
  const dose = kg === null ? null : {
    gabapentinMin: kg * 20,
    gabapentinMax: kg * 25,
    aceMin: kg * 0.025,
    aceMax: kg * 0.05,
  };

  return (
    <section className="toolkit-utility protocol-toolkit">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{lang === 'es' ? 'Perros · preconsulta' : 'Dogs · pre-visit'}</p>
          <h3>{lang === 'es' ? 'Calculadora y protocolo Chill' : 'Chill protocol and calculator'}</h3>
          <p>{lang === 'es'
            ? 'Gabapentina, melatonina y acepromazina transmucosa oral antes de una visita que provoca miedo o agresividad. En un ensayo prospectivo con 45 perros disminuyó la puntuación de estrés; es una ayuda para el manejo, no una garantía de sedación ni de analgesia para procedimientos invasivos.'
            : 'Gabapentin, melatonin, and oral-transmucosal acepromazine before a fear-provoking visit. In a prospective trial of 45 dogs, stress scores fell; this is a handling aid, not a guarantee of sedation or analgesia for invasive procedures.'}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{lang === 'es' ? 'Uso profesional' : 'Professional use'}</strong>
          <p>{lang === 'es' ? 'Confirmar prescripción, comorbilidades, medicación concomitante y formulación antes de administrar.' : 'Confirm prescription, comorbidities, concomitant medicines, and formulation before administration.'}</p>
        </div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <h4>{lang === 'es' ? 'Datos del paciente' : 'Patient details'}</h4>
          <div className="toolkit-utility-form">
            <label>{lang === 'es' ? 'Peso (kg)' : 'Weight (kg)'}
              <input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
            <label>{lang === 'es' ? 'Tamaño del perro para elegir melatonina' : 'Dog size for melatonin dose'}
              <select value={size} onChange={(event) => setSize(event.target.value as DogSize)}>
                <option value="small">{lang === 'es' ? 'Pequeño' : 'Small'}</option>
                <option value="medium">{lang === 'es' ? 'Mediano' : 'Medium'}</option>
                <option value="large">{lang === 'es' ? 'Grande' : 'Large'}</option>
              </select>
            </label>
            <label>{lang === 'es' ? 'Acepromazina para uso OTM (mg/mL)' : 'Acepromazine for OTM use (mg/mL)'}
              <input type="number" min="0.01" step="0.1" value={concentration} onChange={(event) => setConcentration(event.target.value)} />
            </label>
          </div>
          <p className="protocol-muted">{lang === 'es' ? 'La bibliografía no proporciona rangos de peso para “pequeño”, “mediano” o “grande”: ofrece una dosis fija de melatonina para cada categoría. Por eso se selecciona el tamaño clínico del perro y no se calcula con mg/kg. En Chill se usa la formulación inyectable de acepromazina aplicada sobre la mucosa oral (OTM), sin inyectarla; no se debe sustituir por una suspensión oral salvo indicación expresa de la ficha y del veterinario. La referencia describe 10 mg/mL; confirma la concentración real.' : 'The literature does not provide weight cut-offs for “small”, “medium”, or “large”: it gives a fixed melatonin dose for each category. Choose the dog’s clinical size rather than calculating melatonin in mg/kg. Chill uses the injectable acepromazine formulation applied to the oral mucosa (OTM), without injecting it; do not substitute an oral suspension unless the product information and veterinarian explicitly confirm it. The reference describes 10 mg/mL; confirm the actual concentration.'}</p>
        </section>
        <section className="toolkit-utility-card result-card" aria-live="polite">
          <h4>{lang === 'es' ? 'Chill original · cronograma orientativo' : 'Original Chill · indicative schedule'}</h4>
          {dose ? (
            <div className="protocol-steps">
              <div><span>{lang === 'es' ? 'Noche anterior' : 'Previous evening'}</span><strong>{format(dose.gabapentinMin, lang)}–{format(dose.gabapentinMax, lang)} mg</strong><small>{lang === 'es' ? 'Gabapentina PO · 20–25 mg/kg' : 'Gabapentin PO · 20–25 mg/kg'}</small></div>
              <div><span>{lang === 'es' ? '1–2 h antes' : '1–2 h before'}</span><strong>{format(dose.gabapentinMin, lang)}–{format(dose.gabapentinMax, lang)} mg</strong><small>{lang === 'es' ? 'Gabapentina PO · misma dosis' : 'Gabapentin PO · same dose'}</small><small>{lang === 'es' ? 'Melatonina PO' : 'Melatonin PO'} · {chillMelatonin[size]}</small></div>
              <div><span>{lang === 'es' ? '30 min antes' : '30 min before'}</span><strong>{format(dose.aceMin, lang, 3)}–{format(dose.aceMax, lang, 3)} mg</strong><small>{lang === 'es' ? 'Acepromazina OTM · 0,025–0,05 mg/kg' : 'Acepromazine OTM · 0.025–0.05 mg/kg'}</small>
                {mgPerMl && <small>{format(dose.aceMin / mgPerMl, lang, 3)}–{format(dose.aceMax / mgPerMl, lang, 3)} mL · {format(mgPerMl, lang)} mg/mL</small>}</div>
            </div>
          ) : <p>{lang === 'es' ? 'Introduce un peso válido para ver las dosis.' : 'Enter a valid weight to see doses.'}</p>}
          {!mgPerMl && <p className="protocol-muted">{lang === 'es' ? 'Introduce una concentración válida para convertir acepromazina a mL.' : 'Enter a valid concentration to convert acepromazine to mL.'}</p>}
        </section>
      </div>

      <section className="toolkit-utility-card protocol-caution">
        <h4>{lang === 'es' ? 'Antes de prescribir' : 'Before prescribing'}</h4>
        <p>{lang === 'es' ? 'Valorar estado cardiovascular y renal, edad, sedantes concomitantes y riesgo de hipotensión o sedación excesiva. La acepromazina no aporta analgesia. Avisar de posible ataxia y supervisar al perro; no repetir dosis automáticamente si la visita se retrasa. Ajustar o evitar la pauta según el paciente y el procedimiento.' : 'Assess cardiovascular and renal status, age, concurrent sedatives, and risks of hypotension or excessive sedation. Acepromazine provides no analgesia. Warn about possible ataxia and supervise the dog; do not automatically redose if the visit is delayed. Adjust or avoid the protocol according to the patient and procedure.'}</p>
      </section>
      <Bibliography lang={lang} items={[
        { title: 'Costa et al. JAVMA 2023 · DOI 10.2460/javma.23.02.0067', url: 'https://pubmed.ncbi.nlm.nih.gov/37495226/', note: { es: 'Ensayo prospectivo de 45 perros; apoya efecto sobre estrés, con diseño antes/después.', en: 'Prospective trial in 45 dogs; supports stress reduction, with a before/after design.' } },
        { title: 'Costa, Karas & Borns-Weil · Clinician’s Brief 2019', url: 'https://www.cliniciansbrief.com/article/chill-protocol-manage-aggressive-fearful-dogs', note: { es: 'Protocolo original, tiempos, rangos y formulación OTM.', en: 'Original protocol, timing, ranges, and OTM formulation.' } },
      ]} />
    </section>
  );
}

const fipDose: Record<FipPresentation, { mgKg: number; administrations: number; label: Localized }> = {
  systemic: { mgKg: 15, administrations: 1, label: { es: 'Sin signos oculares ni neurológicos', en: 'No ocular or neurological signs' } },
  ocular: { mgKg: 20, administrations: 1, label: { es: 'Con afectación ocular', en: 'With ocular involvement' } },
  neurologic: { mgKg: 10, administrations: 2, label: { es: 'Con afectación neurológica', en: 'With neurological involvement' } },
};

export function FipProtocolToolkit({ lang }: { lang: Language }) {
  const [weight, setWeight] = useState('4');
  const [presentation, setPresentation] = useState<FipPresentation>('systemic');
  const [duration, setDuration] = useState<'42' | '84'>('84');
  const [concentration, setConcentration] = useState('');
  const [formulation, setFormulation] = useState<'tablet' | 'suspension'>('tablet');
  const [route, setRoute] = useState<'oral' | 'sc'>('oral');
  const [scDose, setScDose] = useState('4');
  const [tabletStrength, setTabletStrength] = useState('');
  const kg = validPositive(weight);
  const mgPerMl = validPositive(concentration);
  const mgPerTablet = validPositive(tabletStrength);
  const prescribedScDose = validPositive(scDose);
  const selected = fipDose[presentation];
  const doseMgKg = route === 'sc' ? prescribedScDose : selected.mgKg;
  const administrations = route === 'sc' ? 1 : selected.administrations;
  const administrationMg = kg === null || doseMgKg === null ? null : kg * doseMgKg;
  const dailyMg = administrationMg === null ? null : administrationMg * administrations;

  return (
    <section className="toolkit-utility protocol-toolkit">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{lang === 'es' ? 'Gatos · antiviral' : 'Cats · antiviral'}</p>
          <h3>{lang === 'es' ? 'Calculadora y protocolo PIF' : 'FIP protocol and calculator'}</h3>
          <p>{lang === 'es' ? 'La peritonitis infecciosa felina requiere confirmar la probabilidad diagnóstica, iniciar soporte individualizado y controlar la respuesta. GS-441524 oral es la opción preferente en la guía ABCD 2026 cuando existe acceso legal a una formulación fiable.' : 'Feline infectious peritonitis requires diagnostic assessment, individualised supportive care, and response monitoring. Oral GS-441524 is the preferred option in the 2026 ABCD guideline when a reliable formulation is legally accessible.'}</p>
        </div>
        <div className="toolkit-utility-note"><strong>GS-441524 PO</strong><p>{lang === 'es' ? 'Cálculo orientativo, no prescripción automática. Solo gatos con PIF probable y bajo supervisión veterinaria.' : 'Indicative calculation, not an automatic prescription. Only for cats with likely FIP under veterinary supervision.'}</p></div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <h4>{lang === 'es' ? 'Plan de tratamiento' : 'Treatment plan'}</h4>
          <div className="toolkit-utility-form">
            <label>{lang === 'es' ? 'Peso actual (kg)' : 'Current weight (kg)'}
              <input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
            <label>{lang === 'es' ? 'Afectación ocular / neurológica' : 'Ocular / neurological involvement'}
              <select value={presentation} onChange={(event) => {
                const next = event.target.value as FipPresentation;
                setPresentation(next);
                if (next !== 'systemic') setDuration('84');
              }}>
                {(Object.keys(fipDose) as FipPresentation[]).map((key) => <option key={key} value={key}>{show(fipDose[key].label, lang)}</option>)}
              </select>
            </label>
            <label>{lang === 'es' ? 'Vía de GS-441524' : 'GS-441524 route'}
              <select value={route} onChange={(event) => setRoute(event.target.value as 'oral' | 'sc')}>
                <option value="oral">{lang === 'es' ? 'Oral · comprimido o suspensión' : 'Oral · tablet or suspension'}</option>
                <option value="sc">{lang === 'es' ? 'Subcutánea · inyectable' : 'Subcutaneous · injectable'}</option>
              </select>
            </label>
            <label>{lang === 'es' ? 'Escenario de duración' : 'Duration scenario'}
              <select value={duration} onChange={(event) => setDuration(event.target.value as '42' | '84')}>
                <option value="84">84 {lang === 'es' ? 'días · 12 semanas' : 'days · 12 weeks'}</option>
                <option value="42" disabled={presentation !== 'systemic'}>42 {lang === 'es' ? 'días · 6 semanas' : 'days · 6 weeks'}</option>
              </select>
            </label>
            {route === 'oral' && <label>{lang === 'es' ? 'Presentación de GS-441524 · vía oral' : 'GS-441524 formulation · oral route'}
              <select value={formulation} onChange={(event) => setFormulation(event.target.value as 'tablet' | 'suspension')}>
                <option value="tablet">{lang === 'es' ? 'Comprimidos (mg/comprimido)' : 'Tablets (mg/tablet)'}</option>
                <option value="suspension">{lang === 'es' ? 'Suspensión oral (mg/mL)' : 'Oral suspension (mg/mL)'}</option>
              </select>
            </label>}
            {route === 'sc' ? <label>{lang === 'es' ? 'Dosis SC prescrita (mg/kg)' : 'Prescribed SC dose (mg/kg)'}
              <input type="number" min="0.01" step="0.1" value={scDose} onChange={(event) => setScDose(event.target.value)} />
            </label> : formulation === 'suspension' ? <label>{lang === 'es' ? 'Concentración confirmada (mg/mL)' : 'Confirmed concentration (mg/mL)'}
              <input type="number" min="0.01" step="0.1" value={concentration} onChange={(event) => setConcentration(event.target.value)} placeholder={lang === 'es' ? 'Según etiqueta' : 'From label'} />
            </label> : <label>{lang === 'es' ? 'Contenido confirmado (mg/comprimido)' : 'Confirmed strength (mg/tablet)'}
              <input type="number" min="0.01" step="0.1" value={tabletStrength} onChange={(event) => setTabletStrength(event.target.value)} placeholder={lang === 'es' ? 'Según etiqueta' : 'From label'} />
            </label>}
            {route === 'sc' && <label>{lang === 'es' ? 'Concentración inyectable (mg/mL)' : 'Injectable concentration (mg/mL)'}
              <input type="number" min="0.01" step="0.1" value={concentration} onChange={(event) => setConcentration(event.target.value)} placeholder={lang === 'es' ? 'Según etiqueta' : 'From label'} />
            </label>}
          </div>
          <p className="protocol-muted">{lang === 'es' ? 'La forma efusiva (húmeda) o no efusiva (seca) no cambia por sí sola esta dosis base; la afectación ocular o neurológica sí modifica la pauta. Los mg/mL o mg/comprimido sirven para convertirla a volumen o unidades.' : 'Effusive (wet) or non-effusive (dry) disease does not by itself change this baseline dose; ocular or neurological involvement does. Mg/mL or mg/tablet converts it into volume or units.'}</p>
          <p className="protocol-muted">{lang === 'es' ? 'Si coexisten signos oculares y neurológicos, selecciona neurológica. El escenario de 42 días se limita aquí a PIF sin afectación ocular o neurológica: el ensayo aleatorizado incluyó principalmente casos con derrame. Usa solo la concentración comprobada de la preparación oral; no extrapoles a remdesivir ni a GS inyectable.' : 'If ocular and neurological signs coexist, choose neurological. The 42-day scenario is limited here to FIP without ocular or neurological involvement: the randomised trial mainly enrolled cats with effusions. Use only the verified concentration of the oral preparation; do not extrapolate to remdesivir or injectable GS.'}</p>
        </section>
        <section className="toolkit-utility-card result-card" aria-live="polite">
          <h4>{route === 'sc' ? (lang === 'es' ? 'Resultado · GS-441524 inyectable SC' : 'Result · injectable SC GS-441524') : (lang === 'es' ? 'Resultado · GS-441524 oral' : 'Result · oral GS-441524')}</h4>
          {administrationMg !== null && dailyMg !== null ? <>
            <div className="toolkit-utility-result"><strong>{format(administrationMg, lang)} mg</strong><span>{lang === 'es' ? 'por toma' : 'per dose'}</span></div>
            <p className="toolkit-utility-equation">{doseMgKg} mg/kg × {format(kg!, lang)} kg · {administrations === 1 ? 'q24h' : 'q12h'} · {route === 'sc' ? 'SC' : 'PO'}</p>
            <div className="protocol-result-row"><span>{lang === 'es' ? 'Total diario' : 'Daily total'}</span><strong>{format(dailyMg, lang)} mg</strong></div>
            {route === 'sc' && mgPerMl && <div className="protocol-result-row"><span>{lang === 'es' ? 'Volumen por inyección · SC' : 'Volume per injection · SC'}</span><strong>{format(administrationMg / mgPerMl, lang, 3)} mL</strong></div>}
            {route === 'oral' && formulation === 'suspension' && mgPerMl && <div className="protocol-result-row"><span>{lang === 'es' ? 'Volumen por toma · oral' : 'Volume per dose · oral'}</span><strong>{format(administrationMg / mgPerMl, lang, 3)} mL</strong></div>}
            {route === 'oral' && formulation === 'tablet' && mgPerTablet && <div className="protocol-result-row"><span>{lang === 'es' ? 'Comprimidos por toma · equivalencia matemática' : 'Tablets per dose · mathematical equivalent'}</span><strong>≈ {format(administrationMg / mgPerTablet, lang, 3)}</strong></div>}
            <div className="protocol-result-row"><span>{lang === 'es' ? `Estimación para ${duration} días` : `Estimate for ${duration} days`}</span><strong>{format(dailyMg * Number(duration), lang)} mg</strong></div>
            <p className="protocol-muted">{lang === 'es' ? 'El total del ciclo presupone peso y dosis constantes; recalcula al menos cada 1–2 semanas y al ganar peso. No redondees comprimidos sin confirmar su divisibilidad.' : 'The course total assumes constant weight and dose; recalculate at least every 1–2 weeks and after weight gain. Do not round tablets without confirming whether they can be divided.'}</p>
          </> : <p>{lang === 'es' ? 'Introduce un peso válido para ver la dosis.' : 'Enter a valid weight to see the dose.'}</p>}
          {(route === 'sc' ? !mgPerMl : formulation === 'suspension' ? !mgPerMl : !mgPerTablet) && <p className="protocol-muted">{lang === 'es' ? 'Introduce un valor mayor que cero según la etiqueta para obtener mL o comprimidos. La dosis en mg sigue disponible.' : 'Enter a positive value from the label to obtain mL or tablets. The dose in mg remains available.'}</p>}
        </section>
      </div>

      <section className="toolkit-utility-card protocol-table-card">
        <h4>{lang === 'es' ? 'Tabla de dosis de referencia · GS-441524 oral' : 'Reference dosing table · oral GS-441524'}</h4>
        <div className="toolkit-table-shell">
          <table className="toolkit-table">
            <thead><tr><th>{lang === 'es' ? 'Presentación clínica' : 'Clinical presentation'}</th><th>mg/kg</th><th>{lang === 'es' ? 'Frecuencia' : 'Frequency'}</th><th>{lang === 'es' ? 'Duración habitual' : 'Usual duration'}</th></tr></thead>
            <tbody>
              <tr><td>{lang === 'es' ? 'Efusiva o no efusiva, sin signos oculares/neuro' : 'Effusive or non-effusive, no ocular/neuro signs'}</td><td>15</td><td>q24h PO</td><td>42–84 {lang === 'es' ? 'días, según respuesta' : 'days, response-based'}</td></tr>
              <tr><td>{lang === 'es' ? 'Afectación ocular' : 'Ocular involvement'}</td><td>20</td><td>q24h PO</td><td>84 {lang === 'es' ? 'días habitual' : 'days usual'}</td></tr>
              <tr><td>{lang === 'es' ? 'Afectación neurológica' : 'Neurological involvement'}</td><td>10</td><td>q12h PO</td><td>84 {lang === 'es' ? 'días habitual' : 'days usual'}</td></tr>
              <tr><td>{lang === 'es' ? 'Inyectable SC' : 'Injectable SC'}</td><td>{lang === 'es' ? 'Según protocolo prescrito' : 'Per prescribed protocol'}</td><td>q24h SC</td><td>{lang === 'es' ? 'Según respuesta' : 'Response-based'}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="protocol-muted">{lang === 'es' ? 'La tabla resume rangos descritos por ABCD 2026; la dosis final, la duración y los cambios por respuesta corresponden al veterinario responsable.' : 'This table summarises ranges described by ABCD 2026; the responsible veterinarian determines final dose, duration, and response-based changes.'}</p>
      </section>

      <section className="toolkit-utility-card protocol-context">
        <h4>{lang === 'es' ? 'Presentaciones y vías descritas' : 'Formulations and documented routes'}</h4>
        <dl className="protocol-comparison">
          <div><dt>GS-441524 · PO</dt><dd>{lang === 'es' ? 'Comprimidos o suspensión oral: son las presentaciones que calcula esta herramienta. ABCD describe, entre otras, comprimidos de 50 mg y preparados orales de 50 mg/mL en algunos países; no son concentraciones universales ni confirman disponibilidad en España.' : 'Tablets or oral suspension: these are the formulations calculated here. ABCD describes, among others, 50 mg tablets and 50 mg/mL oral preparations in some countries; these are not universal strengths or confirmation of availability in Spain.'}</dd></div>
          <div><dt>GS-441524 · SC</dt><dd>{lang === 'es' ? 'Vía subcutánea inyectable descrita en estudios; puede ser dolorosa y causar lesiones locales. Esta calculadora permite introducir la dosis y concentración SC prescritas, sin convertir automáticamente desde la pauta oral.' : 'Subcutaneous injectable administration is documented in studies; it can be painful and cause local lesions. This calculator accepts the prescribed SC dose and concentration without automatically converting the oral regimen.'}</dd></div>
          <div><dt>{lang === 'es' ? 'Remdesivir · IV / SC' : 'Remdesivir · IV / SC'}</dt><dd>{lang === 'es' ? 'Es otro fármaco, precursor de GS-441524. Se describen administración intravenosa (IV) y subcutánea (SC); se prefiere IV si se necesita tratamiento parenteral, por ejemplo al inicio si no se tolera la vía oral. La SC puede ser dolorosa. La guía describe infusión IV lenta (30 min–2 h), con preparación y dilución específicas; no es una pauta IM ni un bolo rápido. Cambiar de fármaco o vía requiere recalcular con su protocolo.' : 'A different drug, the prodrug of GS-441524. Intravenous (IV) and subcutaneous (SC) administration are documented; IV is preferred when parenteral therapy is needed, for example initially if oral medication is not tolerated. SC can be painful. The guideline describes slow IV infusion (30 min–2 h), with product-specific preparation and dilution; this is not an IM regimen or a rapid bolus. Changing drug or route requires recalculation using its own protocol.'}</dd></div>
        </dl>
      </section>
      <section className="toolkit-utility-card protocol-caution">
        <h4>{lang === 'es' ? 'Seguimiento y límites' : 'Monitoring and limits'}</h4>
        <p>{lang === 'es' ? 'Administrar preferentemente en ayunas, 30 minutos antes de comer; puede usarse una pequeña cantidad de alimento si es necesario. Contactar a las 48 h, pesar cada 1–2 semanas, revisar derrames a las 2 semanas y repetir hemograma/bioquímica a las 2 semanas y después mensualmente si es posible. Antes de suspender, comprobar resolución clínica y analítica; AGP normal en dos mediciones separadas 1–2 semanas puede ayudar. Vigilar vómitos, diarrea y alteraciones analíticas.' : 'Ideally give on an empty stomach, 30 minutes before food; a small amount of food may be used if needed. Check in at 48 h, weigh every 1–2 weeks, reassess effusions at 2 weeks, and repeat blood count/biochemistry at 2 weeks and then monthly if possible. Before stopping, confirm clinical and laboratory resolution; normal AGP on two measurements 1–2 weeks apart can help. Monitor vomiting, diarrhoea, and laboratory abnormalities.'}</p>
        <p>{duration === '42'
          ? lang === 'es' ? '42 días: respaldado por estudios en gatos con buena respuesta, pero no implica suspensión automática. Si la respuesta no es rápida y completa, reevaluar y prolongar según criterio clínico.' : '42 days: supported by studies in cats responding well, but it does not mean automatic discontinuation. If response is not prompt and complete, reassess and extend as clinically indicated.'
          : lang === 'es' ? '84 días: escenario usado en numerosos estudios; tampoco sustituye la decisión de suspender según respuesta.' : '84 days: a scenario used in many studies; it still does not replace response-based stopping decisions.'}</p>
        <p>{lang === 'es' ? 'La disponibilidad y legalidad de GS-441524 varían por país. Evitar preparaciones no reguladas de composición incierta; verificar la vía legal, calidad y ficha de la formulación concreta. Molnupiravir y otros antivirales requieren valoración especializada y no se calculan aquí.' : 'GS-441524 availability and legality vary by country. Avoid unregulated products of uncertain composition; verify the lawful route, quality, and product-specific information. Molnupiravir and other antivirals need specialist assessment and are not calculated here.'}</p>
      </section>
      <Bibliography lang={lang} items={[
        { title: 'ABCD · FIP guideline, updated March 2026', url: 'https://www.abcdcatsvets.org/guideline-for-feline-infectious-peritonitis/', note: { es: 'Fuente principal de dosis, duración, seguridad y seguimiento.', en: 'Primary source for dosing, duration, safety, and monitoring.' } },
        { title: 'Tasker et al. Viruses 2026;18:452 · treatment update', url: 'https://doi.org/10.3390/v18040452', note: { es: 'Actualización de tratamiento del European Advisory Board on Cat Diseases.', en: 'Treatment update from the European Advisory Board on Cat Diseases.' } },
        { title: 'Zuzzi-Krebitz et al. Viruses 2024 · 42 vs 84 days', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11281457/', note: { es: 'Ensayo prospectivo aleatorizado de 40 gatos con derrame; base del escenario de 42 días.', en: 'Prospective randomised trial in 40 cats with effusions; basis for the 42-day scenario.' } },
      ]} />
    </section>
  );
}
