import { useState } from 'react';
import { Language } from '../i18n';
import { redCellVolume, transfusionRate } from '../lib/haemotherapyMath';

const MERCK =
  'https://www.merckvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions-in-dogs-and-cats/blood-transfusions-in-dogs-and-cats';
const CORNELL =
  'https://www.vet.cornell.edu/animal-health-diagnostic-center/testing/testing-protocols-interpretations/immunology/crossmatch-testing';
const TRACS = 'https://doi.org/10.1111/vec.13045';
const ISFM = 'https://doi.org/10.1177/1098612X211007071';
type Product = 'redCells' | 'wholeBlood' | 'plasma';
type View = 'calculate' | 'guide' | 'safety';
const texts = {
  es: {
    title: 'Hemoterapia',
    intro: 'Perro y gato · volumen, administración y seguridad transfusional.',
    free: 'Acceso gratuito',
    calculate: 'Calcular volumen',
    guide: 'Elegir componente',
    safety: 'Compatibilidad y vigilancia',
    species: 'Especie',
    dog: 'Perro',
    cat: 'Gato',
    product: 'Componente',
    redCells: 'Concentrado de eritrocitos',
    wholeBlood: 'Sangre total',
    plasma: 'Plasma',
    weight: 'Peso (kg)',
    current: 'Hto actual (%)',
    target: 'Hto objetivo (%)',
    unit: 'Hto medido de la unidad (%)',
    bv: 'Volemia estimada (mL/kg)',
    dose: 'Dosis de plasma prescrita (mL/kg)',
    clear: 'Limpiar paciente',
    input: 'Datos del paciente y del producto',
    volume: 'Volumen calculado',
    empty: 'Completa los datos para calcular.',
    invalid:
      'Revisa los datos: peso y volemia positivos; hematocritos de 0 a 100%, objetivo mayor que actual y Hto de unidad mayor que cero.',
    plasmaInvalid: 'Introduce peso y dosis prescrita positivos.',
    bvHint:
      'Referencia Merck: perro 80–90; gato 40–60 mL/kg. Se usa 85 o 55 como estimación inicial editable.',
    hctHint:
      'La indicación y el objetivo dependen del estado clínico. Introduce el Hto real del producto; la fórmula estima la respuesta, no la garantiza.',
    plasmaHint:
      'Coagulopatías: Merck orienta 10–20 mL/kg en perro y 6–10 en gato. Individualiza la dosis; el plasma no corrige la anemia.',
    equation: 'Peso × volemia × (Hto objetivo − actual) / Hto de la unidad',
    plan: 'Planificar administración',
    duration: 'Duración prescrita (horas)',
    rate: 'Velocidad media',
    rateHint:
      'Volumen / duración. No incluye fase de prueba ni ajustes durante la transfusión. Individualiza según estabilidad, función cardiaca/renal y protocolo del banco.',
    durationWarning:
      'Más de 4 h: confirma conservación y tiempo máximo fuera de refrigeración con el banco. Si necesitas administrar más despacio, acuerda fraccionamiento u otra estrategia; no prolongues automáticamente la exposición del producto.',
    rateInvalid: 'La duración debe ser mayor que cero.',
    summary: 'Resumen para copiar',
    copy: 'Copiar resumen',
    copied: 'Resumen copiado',
    copyFailed:
      'No se pudo copiar. Selecciona el resumen y cópialo manualmente.',
    productsIntro:
      'Elige según el déficit y el estado del paciente. Confirma composición, conservación y pauta con el banco de sangre.',
    rbcUse:
      'Soporte eritrocitario en anemia clínicamente relevante. Menor volumen que sangre total para un mismo aporte de eritrocitos.',
    wholeUse:
      'Aporta eritrocitos y plasma. Considerar cuando se necesitan ambos; los factores y las plaquetas disponibles dependen de cómo se obtiene y conserva el producto.',
    plasmaUse:
      'Soporte de factores de coagulación cuando está indicado. No es eficaz como tratamiento rutinario de la hipoproteinemia y no sustituye a eritrocitos.',
    specialty: 'Plaquetas y crioprecipitado',
    specialtyUse:
      'Son productos específicos: confirma indicación, contenido y unidades con el banco. No conviertas automáticamente una “unidad” en un volumen ni extrapoles una dosis entre productos.',
    select: 'Usar en el cálculo',
    sources: 'Fuentes y alcance',
    sourceHint:
      'Referencia clínica revisada, consensos TRACS/ISFM y protocolo de laboratorio. Cálculos estimativos para uso profesional; confirmar con el producto, el banco y la evolución clínica.',
    typing: 'Antes de transfundir: tipaje y crossmatch',
    typingDog:
      'Perro: tipar donante y receptor para DEA 1. Confirmar transfusiones previas y realizar crossmatch antes de repetir (especialmente si han pasado más de 4 días) o si la historia es desconocida.',
    typingCat:
      'Gato: tipar A/B/AB y realizar crossmatch, también antes de la primera transfusión. Puede haber anticuerpos contra otros antígenos aunque coincida A/B/AB.',
    cross:
      'Crossmatch mayor: plasma del receptor frente a eritrocitos del donante. Un resultado compatible no excluye todas las reacciones. Plasma y sangre total requieren considerar también anticuerpos del donante: confirmar con el banco.',
    prepare: 'Preparar producto y vía',
    preparation:
      'Verificar identidad, producto, caducidad y condiciones del banco. Usar vía exclusiva con filtro y dispositivo apto para sangre; no mezclar medicamentos ni fluidos con calcio en esa vía.',
    monitor: 'Vigilar y registrar',
    monitoring:
      'Registrar constantes basales. Valorar cada 15 min durante la primera hora, después cada hora hasta finalizar; volver a valorar a los 15 min, 1 h y 24 h. Tras eritrocitos, comprobar Hto y respuesta clínica.',
    reaction: 'Si aparece una reacción',
    reactionText:
      'Ante sospecha de reacción (fiebre, disnea, vómitos, urticaria, hipotensión o hemólisis), detener la transfusión y evaluar de inmediato. Investigar la causa y tratar según el cuadro; no reiniciar automáticamente.',
    checkTitle: 'Comprobación previa',
    checkHint:
      'Lista local de apoyo, sin guardar datos del paciente. Las casillas no certifican compatibilidad.',
    checks: [
      'Identidad y producto verificados',
      'Tipaje y crossmatch revisados',
      'Constantes basales registradas',
      'Vía y filtro preparados',
      'Volumen, pauta y vigilancia acordados',
    ],
  },
  en: {
    title: 'Haemotherapy',
    intro: 'Dogs and cats · volume, administration and transfusion safety.',
    free: 'Free access',
    calculate: 'Calculate volume',
    guide: 'Choose a component',
    safety: 'Compatibility and monitoring',
    species: 'Species',
    dog: 'Dog',
    cat: 'Cat',
    product: 'Component',
    redCells: 'Packed red cells',
    wholeBlood: 'Whole blood',
    plasma: 'Plasma',
    weight: 'Weight (kg)',
    current: 'Current Hct (%)',
    target: 'Target Hct (%)',
    unit: 'Measured unit Hct (%)',
    bv: 'Estimated blood volume (mL/kg)',
    dose: 'Prescribed plasma dose (mL/kg)',
    clear: 'Clear patient',
    input: 'Patient and product data',
    volume: 'Calculated volume',
    empty: 'Complete the data to calculate.',
    invalid:
      'Check the data: positive weight and blood volume; Hct between 0 and 100%, target above current and unit Hct greater than zero.',
    plasmaInvalid: 'Enter positive weight and prescribed dose.',
    bvHint:
      'Merck reference: dogs 80–90; cats 40–60 mL/kg. 85 or 55 is used as an editable initial estimate.',
    hctHint:
      'Indication and target depend on clinical condition. Enter the actual product Hct; the formula estimates the response, without guaranteeing it.',
    plasmaHint:
      'Coagulopathies: Merck suggests 10–20 mL/kg in dogs and 6–10 in cats. Individualise the dose; plasma does not correct anaemia.',
    equation: 'Weight × blood volume × (target − current Hct) / unit Hct',
    plan: 'Plan administration',
    duration: 'Prescribed duration (hours)',
    rate: 'Average rate',
    rateHint:
      'Volume / duration. Excludes a test phase and adjustments during transfusion. Individualise to stability, cardiac/renal function and blood-bank protocol.',
    durationWarning:
      'More than 4 h: confirm storage and maximum time out of refrigeration with the blood bank. If slower administration is needed, agree on aliquots or another strategy; do not automatically extend product exposure.',
    rateInvalid: 'Duration must be greater than zero.',
    summary: 'Summary to copy',
    copy: 'Copy summary',
    copied: 'Summary copied',
    copyFailed: 'Unable to copy. Select the summary and copy it manually.',
    productsIntro:
      'Choose according to the deficit and patient condition. Confirm composition, storage and dosing with the blood bank.',
    rbcUse:
      'Red-cell support for clinically relevant anaemia. Less volume than whole blood for the same red-cell contribution.',
    wholeUse:
      'Provides red cells and plasma. Consider when both are needed; available factors and platelets depend on collection and storage.',
    plasmaUse:
      'Clotting-factor support when indicated. Inefficient for routine treatment of hypoproteinaemia and does not replace red cells.',
    specialty: 'Platelets and cryoprecipitate',
    specialtyUse:
      'These are specialised products: confirm indication, content and units with the blood bank. Do not automatically convert a “unit” to a volume or extrapolate a dose between products.',
    select: 'Use in calculator',
    sources: 'Sources and scope',
    sourceHint:
      'Reviewed clinical reference, TRACS/ISFM consensus and laboratory protocol. Estimates for professional use; confirm against product details, blood-bank guidance and clinical response.',
    typing: 'Before transfusion: typing and crossmatch',
    typingDog:
      'Dogs: type donor and recipient for DEA 1. Confirm previous transfusions and crossmatch before repeat transfusions (especially after more than 4 days) or if history is unknown.',
    typingCat:
      'Cats: type A/B/AB and crossmatch, including before the first transfusion. Antibodies to other antigens may exist even with matching A/B/AB types.',
    cross:
      'Major crossmatch: recipient plasma against donor red cells. A compatible result does not exclude every reaction. Plasma and whole blood also require consideration of donor antibodies: confirm with the blood bank.',
    prepare: 'Prepare product and line',
    preparation:
      'Verify identity, product, expiry and blood-bank conditions. Use a dedicated filtered line and blood-compatible device; do not mix medicines or calcium-containing fluids in that line.',
    monitor: 'Monitor and record',
    monitoring:
      'Record baseline vital signs. Assess every 15 min during the first hour, then hourly until completion; reassess at 15 min, 1 h and 24 h. After red cells, check Hct and clinical response.',
    reaction: 'If a reaction occurs',
    reactionText:
      'If a reaction is suspected (fever, dyspnoea, vomiting, urticaria, hypotension or haemolysis), stop the transfusion and assess immediately. Investigate and treat the cause; do not restart automatically.',
    checkTitle: 'Pre-transfusion check',
    checkHint:
      'Local supporting checklist; no patient data are saved. Checks do not certify compatibility.',
    checks: [
      'Identity and product verified',
      'Typing and crossmatch reviewed',
      'Baseline vital signs recorded',
      'Line and filter prepared',
      'Volume, rate and monitoring agreed',
    ],
  },
};

export default function HaemotherapyCalculator({ lang }: { lang: Language }) {
  const t = texts[lang];
  const [view, setView] = useState<View>('calculate');
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [product, setProduct] = useState<Product>('redCells');
  const [weight, setWeight] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [bloodVolume, setBloodVolume] = useState('85');
  const [dose, setDose] = useState('');
  const [hours, setHours] = useState('');
  const [checked, setChecked] = useState<boolean[]>(Array(5).fill(false));
  const [copyStatus, setCopyStatus] = useState('');
  const reset = () => {
    setWeight('');
    setCurrent('');
    setTarget('');
    setUnit('');
    setDose('');
    setHours('');
    setChecked(Array(5).fill(false));
    setCopyStatus('');
    setBloodVolume(species === 'dog' ? '85' : '55');
  };
  const required =
    product === 'plasma'
      ? [weight, dose]
      : [weight, current, target, unit, bloodVolume];
  const ready = required.every((v) => v.trim() !== '');
  const w = Number(weight);
  const calculated =
    product === 'plasma'
      ? w > 0 && Number(dose) > 0
        ? w * Number(dose)
        : null
      : redCellVolume(
          w,
          Number(bloodVolume),
          Number(current),
          Number(target),
          Number(unit),
        );
  const volume =
    ready && calculated !== null && Number.isFinite(calculated)
      ? calculated
      : null;
  const rate =
    volume !== null && hours !== ''
      ? transfusionRate(volume, Number(hours))
      : null;
  const n = (v: number) =>
    new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
      maximumFractionDigits: 1,
    }).format(v);
  const summary =
    volume === null
      ? ''
      : `${t[species]} · ${t[product]}\n${t.weight}: ${weight}\n${product === 'plasma' ? `${t.dose}: ${dose}` : `${t.current}: ${current} · ${t.target}: ${target} · ${t.unit}: ${unit}\n${t.bv}: ${bloodVolume}`}\n${t.volume}: ${n(volume)} mL (${n(volume / w)} mL/kg)${rate !== null ? `\n${t.duration}: ${hours} · ${t.rate}: ${n(rate)} mL/h\n${t.rateHint}${Number(hours) > 4 ? `\n${t.durationWarning}` : ''}` : ''}\n${product === 'plasma' ? t.plasmaHint : t.hctHint}`;
  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    max?: number,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min="0"
        max={max}
        step="any"
        value={value}
        onChange={(e) => {
          setter(e.target.value);
          setCopyStatus('');
        }}
      />
    </label>
  );
  const changeProduct = (value: Product) => {
    setProduct(value);
    setUnit('');
    setHours('');
    setChecked(Array(5).fill(false));
    setCopyStatus('');
  };
  return (
    <section className="toolkit-utility haemo-workbench">
      <header className="clinical-heading">
        <div>
          <h3>{t.title}</h3>
          <p>{t.intro}</p>
        </div>
        <span className="status-pill status-pill-available">{t.free}</span>
      </header>
      <div className="haemo-species-control">
        <label>
          {t.species}
          <select
            value={species}
            onChange={(e) => {
              const next = e.target.value as 'dog' | 'cat';
              reset();
              setSpecies(next);
              setBloodVolume(next === 'dog' ? '85' : '55');
            }}
          >
            <option value="dog">{t.dog}</option>
            <option value="cat">{t.cat}</option>
          </select>
        </label>
      </div>
      <nav className="clinical-nav" aria-label={t.title}>
        {(['calculate', 'guide', 'safety'] as View[]).map((key, i) => (
          <button
            type="button"
            key={key}
            aria-pressed={view === key}
            onClick={() => setView(key)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {t[key]}
          </button>
        ))}
      </nav>
      <div hidden={view !== 'calculate'}>
        <div className="clinical-workspace">
          <section className="clinical-input">
            <h4>{t.input}</h4>
            <div className="toolkit-utility-form">
              <label>
                {t.product}
                <select
                  value={product}
                  onChange={(e) => changeProduct(e.target.value as Product)}
                >
                  {(['redCells', 'wholeBlood', 'plasma'] as Product[]).map(
                    (p) => (
                      <option key={p} value={p}>
                        {t[p]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              {field(t.weight, weight, setWeight)}
              {product === 'plasma' ? (
                field(t.dose, dose, setDose)
              ) : (
                <>
                  {field(t.current, current, setCurrent, 100)}
                  {field(t.target, target, setTarget, 100)}
                  {field(t.unit, unit, setUnit, 100)}
                  {field(t.bv, bloodVolume, setBloodVolume)}
                </>
              )}
            </div>
            <p className="clinical-hint">
              {product === 'plasma' ? t.plasmaHint : t.bvHint}
            </p>
            <button type="button" onClick={reset}>
              {t.clear}
            </button>
          </section>
          <aside className="clinical-result haemo-volume" aria-live="polite">
            <span>{t.volume}</span>
            <strong>
              {volume === null ? '—' : n(volume)} <small>mL</small>
            </strong>
            <p>{volume !== null ? `${n(volume / w)} mL/kg` : t.empty}</p>
            <div className="haemo-formula">
              {product === 'plasma' ? `${t.weight} × ${t.dose}` : t.equation}
            </div>
            <p>{product === 'plasma' ? t.plasmaHint : t.hctHint}</p>
            {ready && volume === null && (
              <p role="alert">
                {product === 'plasma' ? t.plasmaInvalid : t.invalid}
              </p>
            )}
          </aside>
        </div>
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">↗</span>
            <strong>{t.plan}</strong>
          </summary>
          <div className="clinical-detail">
            <div className="clinical-workspace">
              <div className="toolkit-utility-form">
                {field(t.duration, hours, setHours)}
                <p className="clinical-hint">{t.rateHint}</p>
                <a href={TRACS} target="_blank" rel="noreferrer">
                  TRACS 2021 ·{' '}
                  {lang === 'es'
                    ? 'Pauta individualizada; evidencia limitada'
                    : 'Individualised rate; limited evidence'}
                </a>
              </div>
              <div className="clinical-result">
                <span>{t.rate}</span>
                <strong>
                  {rate === null ? '—' : n(rate)} <small>mL/h</small>
                </strong>
                {rate !== null && <p>{n(rate / w)} mL/kg/h</p>}
                {Number(hours) > 4 && <p role="alert">{t.durationWarning}</p>}
                {hours !== '' && Number(hours) <= 0 && (
                  <p role="alert">{t.rateInvalid}</p>
                )}
              </div>
            </div>
          </div>
        </details>
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">✓</span>
            <strong>{t.checkTitle}</strong>
            <span>{checked.filter(Boolean).length}/5</span>
          </summary>
          <div className="clinical-detail">
            <p>{t.checkHint}</p>
            <div className="haemo-checklist">
              {t.checks.map((label, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={(e) =>
                      setChecked((values) =>
                        values.map((v, j) => (i === j ? e.target.checked : v)),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </details>
        {volume !== null && (
          <details className="clinical-disclosure">
            <summary>
              <span className="clinical-step">≡</span>
              <strong>{t.summary}</strong>
            </summary>
            <div className="clinical-detail">
              <pre className="haemo-summary">{summary}</pre>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(summary);
                    setCopyStatus(t.copied);
                  } catch {
                    setCopyStatus(t.copyFailed);
                  }
                }}
              >
                {t.copy}
              </button>
              <p role="status">{copyStatus}</p>
            </div>
          </details>
        )}
      </div>
      <div hidden={view !== 'guide'}>
        <p>{t.productsIntro}</p>
        {(['redCells', 'wholeBlood', 'plasma'] as Product[]).map((p, i) => (
          <details className={`clinical-disclosure product-${p}`} key={p}>
            <summary>
              <span className="clinical-step">
                {String(i + 1).padStart(2, '0')}
              </span>
              <strong>{t[p]}</strong>
            </summary>
            <div className="clinical-detail">
              <p>
                {p === 'redCells'
                  ? t.rbcUse
                  : p === 'wholeBlood'
                    ? t.wholeUse
                    : t.plasmaUse}
              </p>
              <button
                type="button"
                onClick={() => {
                  changeProduct(p);
                  setView('calculate');
                }}
              >
                {t.select}
              </button>
              <p>
                <a
                  href={p === 'wholeBlood' ? ISFM : MERCK}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p === 'wholeBlood' ? 'ISFM 2021' : 'Merck 2026'}
                </a>
              </p>
            </div>
          </details>
        ))}
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">04</span>
            <strong>{t.specialty}</strong>
          </summary>
          <div className="clinical-detail">
            <p>{t.specialtyUse}</p>
            <a href={MERCK} target="_blank" rel="noreferrer">
              Merck 2026
            </a>
          </div>
        </details>
      </div>
      <div hidden={view !== 'safety'}>
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">01</span>
            <strong>{t.typing}</strong>
          </summary>
          <div className="clinical-detail">
            <h4>{t[species]}</h4>
            <p>{species === 'dog' ? t.typingDog : t.typingCat}</p>
            <p>{t.cross}</p>
            <a href={CORNELL} target="_blank" rel="noreferrer">
              Cornell · Crossmatch
            </a>{' '}
            ·{' '}
            <a href={MERCK} target="_blank" rel="noreferrer">
              Merck 2026
            </a>
          </div>
        </details>
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">02</span>
            <strong>{t.prepare}</strong>
          </summary>
          <div className="clinical-detail">
            <p>{t.preparation}</p>
            <a href={MERCK} target="_blank" rel="noreferrer">
              Merck 2026
            </a>
          </div>
        </details>
        <details className="clinical-disclosure">
          <summary>
            <span className="clinical-step">03</span>
            <strong>{t.monitor}</strong>
          </summary>
          <div className="clinical-detail">
            <p>{t.monitoring}</p>
            <a href={MERCK} target="_blank" rel="noreferrer">
              Merck 2026
            </a>
          </div>
        </details>
        <details className="clinical-disclosure haemo-reaction">
          <summary>
            <span className="clinical-step">!</span>
            <strong>{t.reaction}</strong>
          </summary>
          <div className="clinical-detail">
            <p>{t.reactionText}</p>
            <a href={MERCK} target="_blank" rel="noreferrer">
              Merck 2026
            </a>
          </div>
        </details>
      </div>
      <footer className="clinical-sources">
        <strong>{t.sources}</strong>
        <p>{t.sourceHint}</p>
        <a href={MERCK} target="_blank" rel="noreferrer">
          Merck ·{' '}
          {lang === 'es' ? 'Transfusiones (2026)' : 'Transfusions (2026)'}
        </a>
        <a href={CORNELL} target="_blank" rel="noreferrer">
          Cornell · Crossmatch
        </a>
        <a href={TRACS} target="_blank" rel="noreferrer">
          TRACS ·{' '}
          {lang === 'es'
            ? 'Prevención y vigilancia (2021)'
            : 'Prevention and monitoring (2021)'}
        </a>
        <a href={ISFM} target="_blank" rel="noreferrer">
          ISFM ·{' '}
          {lang === 'es' ? 'Consenso felino (2021)' : 'Feline consensus (2021)'}
        </a>
      </footer>
    </section>
  );
}
