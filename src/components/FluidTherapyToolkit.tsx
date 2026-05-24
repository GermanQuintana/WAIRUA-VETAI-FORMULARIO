import { useMemo, useState } from 'react';
import { Language } from '../i18n';

type FluidSpeciesKey = 'dog' | 'cat' | 'rabbit' | 'horse' | 'cow';
type FluidProblemKey = 'dehydration' | 'shock' | 'diarrhea' | 'anesthesia' | 'pediatric';

interface FluidSpeciesProfile {
  key: FluidSpeciesKey;
  name: { es: string; en: string };
  group: { es: string; en: string };
  maintenanceMlKgDay: number;
  anesthesiaMlKgHour: string;
  shockBolusMlKg: string;
  deficitHours: string;
  defaultWeight: number;
  defaultOngoingLossMlKgDay: number;
  route: { es: string; en: string };
  pediatricLabel: { es: string; en: string };
  pediatricMultiplier: number;
  notes: Array<{ es: string; en: string }>;
}

interface FluidProblem {
  key: FluidProblemKey;
  title: { es: string; en: string };
  fluid: { es: string; en: string };
  supplement: { es: string; en: string };
  watch: { es: string; en: string };
}

const roundValue = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const speciesProfiles: FluidSpeciesProfile[] = [
  {
    key: 'dog',
    name: { es: 'Perro', en: 'Dog' },
    group: { es: 'Pequenos animales', en: 'Companion animal' },
    maintenanceMlKgDay: 60,
    anesthesiaMlKgHour: '5 mL/kg/h',
    shockBolusMlKg: '15-20 mL/kg IV, reevaluar en 15-30 min',
    deficitHours: '12-24 h',
    defaultWeight: 20,
    defaultOngoingLossMlKgDay: 10,
    route: { es: 'IV si perfusion alterada; oral/SC si deficit leve y estable.', en: 'IV if perfusion is altered; oral/SC if mild and stable.' },
    pediatricLabel: { es: 'Cachorro', en: 'Puppy' },
    pediatricMultiplier: 3,
    notes: [
      { es: 'AAHA 2024: separar resucitacion, rehidratacion y mantenimiento.', en: 'AAHA 2024: separate resuscitation, rehydration, and maintenance.' },
      { es: 'En anestesia sana, iniciar bajo y reevaluar presion, pulso y perfusion.', en: 'In healthy anesthesia, start low and reassess pressure, pulse, and perfusion.' },
    ],
  },
  {
    key: 'cat',
    name: { es: 'Gato', en: 'Cat' },
    group: { es: 'Pequenos animales', en: 'Companion animal' },
    maintenanceMlKgDay: 40,
    anesthesiaMlKgHour: '3-5 mL/kg/h',
    shockBolusMlKg: '5-10 mL/kg IV, reevaluar en 15-30 min',
    deficitHours: '12-24 h',
    defaultWeight: 4,
    defaultOngoingLossMlKgDay: 8,
    route: { es: 'IV si shock; SC util en pacientes estables seleccionados.', en: 'IV for shock; SC can help selected stable patients.' },
    pediatricLabel: { es: 'Gatito', en: 'Kitten' },
    pediatricMultiplier: 2.5,
    notes: [
      { es: 'Vigilar sobrecarga: gatos geriatrico, renal o cardiaco toleran menos margen.', en: 'Watch overload: geriatric, renal, or cardiac cats have less margin.' },
      { es: 'En anorexia posoperatoria se pueden considerar fluidos SC si no bebe.', en: 'If postoperative anorexia persists, SC fluids may be considered.' },
    ],
  },
  {
    key: 'rabbit',
    name: { es: 'Conejo', en: 'Rabbit' },
    group: { es: 'Exoticos', en: 'Exotics' },
    maintenanceMlKgDay: 100,
    anesthesiaMlKgHour: '5-10 mL/kg/h',
    shockBolusMlKg: '10-20 mL/kg IV/IO tibio, reevaluar',
    deficitHours: '12-24 h',
    defaultWeight: 2,
    defaultOngoingLossMlKgDay: 15,
    route: { es: 'SC si leve; IV/IO si ileo, shock, hipotermia o anorexia marcada.', en: 'SC if mild; IV/IO for ileus, shock, hypothermia, or marked anorexia.' },
    pediatricLabel: { es: 'Gazapo', en: 'Kit' },
    pediatricMultiplier: 2,
    notes: [
      { es: 'Usar fluidos templados y combinar con analgesia, calor y soporte nutricional.', en: 'Use warmed fluids and combine with analgesia, heat, and nutritional support.' },
      { es: 'El ileo no se corrige solo con fluidos: buscar dolor, dental, dieta o obstruccion.', en: 'Ileus is not fixed by fluids alone: look for pain, dental disease, diet, or obstruction.' },
    ],
  },
  {
    key: 'horse',
    name: { es: 'Caballo', en: 'Horse' },
    group: { es: 'Equidos', en: 'Equine' },
    maintenanceMlKgDay: 50,
    anesthesiaMlKgHour: '5-10 mL/kg/h segun procedimiento',
    shockBolusMlKg: '20 mL/kg IV o 20-35 L/1-2 h en adulto si deficit grave',
    deficitHours: '50% en 1-2 h si shock; resto en 24 h',
    defaultWeight: 500,
    defaultOngoingLossMlKgDay: 20,
    route: { es: 'Enteral si estable; IV si shock, >8% deshidratado o reflujo gastrico positivo.', en: 'Enteral if stable; IV for shock, >8% dehydration, or positive gastric reflux.' },
    pediatricLabel: { es: 'Potro', en: 'Foal' },
    pediatricMultiplier: 2,
    notes: [
      { es: 'En colico: FC, mucosas, TRC, lactato, reflujo y dolor mandan el ritmo.', en: 'In colic: HR, mucosa, CRT, lactate, reflux, and pain set the pace.' },
      { es: 'Diarrea/enteritis puede requerir volumen alto y controles cada pocas horas.', en: 'Diarrhea/enteritis may need high volume and checks every few hours.' },
    ],
  },
  {
    key: 'cow',
    name: { es: 'Vaca', en: 'Cow' },
    group: { es: 'Bovino', en: 'Cattle' },
    maintenanceMlKgDay: 50,
    anesthesiaMlKgHour: '5-10 mL/kg/h si anestesia/quirurgico',
    shockBolusMlKg: '10-20 mL/kg IV, reevaluar perfusion',
    deficitHours: '12-24 h; mas rapido si hipovolemia',
    defaultWeight: 600,
    defaultOngoingLossMlKgDay: 20,
    route: { es: 'Oral si bebe y perfunde; IV si decubito, shock, acidosis o diarrea severa.', en: 'Oral if drinking and perfused; IV for recumbency, shock, acidosis, or severe diarrhea.' },
    pediatricLabel: { es: 'Ternero', en: 'Calf' },
    pediatricMultiplier: 1.5,
    notes: [
      { es: 'En terneros con diarrea, valorar acidosis e hiperpotasemia antes de potasio.', en: 'In diarrheic calves, assess acidosis and hyperkalemia before potassium.' },
      { es: 'La terapia oral funciona si hay reflejo de succion, postura y perfusion suficientes.', en: 'Oral therapy works if suckle reflex, posture, and perfusion are adequate.' },
    ],
  },
];

const problems: FluidProblem[] = [
  {
    key: 'dehydration',
    title: { es: 'Deshidratacion estable', en: 'Stable dehydration' },
    fluid: { es: 'Cristaloide isotónico balanceado. Oral/SC si leve y perfusion normal; IV si moderada-severa.', en: 'Balanced isotonic crystalloid. Oral/SC if mild with normal perfusion; IV if moderate-severe.' },
    supplement: { es: 'Añadir potasio solo con diuresis y K medido o sospecha razonable de deficit.', en: 'Add potassium only with urine production and measured or likely deficit.' },
    watch: { es: 'Peso, mucosas, TRC, diuresis, electrolitos y tendencia de hidratacion.', en: 'Weight, mucosa, CRT, urine output, electrolytes, and hydration trend.' },
  },
  {
    key: 'shock',
    title: { es: 'Shock / hipovolemia', en: 'Shock / hypovolemia' },
    fluid: { es: 'Bolus IV de cristaloide isotónico balanceado, reevaluando perfusion tras cada bolus.', en: 'IV bolus of balanced isotonic crystalloid, reassessing perfusion after each bolus.' },
    supplement: { es: 'No añadir potasio al bolus de shock. Corregir causa: hemorragia, sepsis, diarrea, colico.', en: 'Do not add potassium to shock boluses. Correct the cause: hemorrhage, sepsis, diarrhea, colic.' },
    watch: { es: 'FC, pulso, mucosas, TRC, PANI/MAP, lactato, temperatura y mentacion.', en: 'HR, pulse, mucosa, CRT, NIBP/MAP, lactate, temperature, and mentation.' },
  },
  {
    key: 'diarrhea',
    title: { es: 'Diarrea / perdidas digestivas', en: 'Diarrhea / GI losses' },
    fluid: { es: 'Reponer deficit + mantenimiento + perdidas. Considerar oral si estable; IV si perfusion mala.', en: 'Replace deficit + maintenance + losses. Consider oral if stable; IV if perfusion is poor.' },
    supplement: { es: 'K si hipopotasemia. Bicarbonato si acidosis metabolica documentada o ternero diarreico grave.', en: 'K for hypokalemia. Bicarbonate for documented metabolic acidosis or severe diarrheic calf.' },
    watch: { es: 'Perdidas continuas, albumina/proteinas, Na/K/Cl, glucosa y equilibrio acido-base.', en: 'Ongoing losses, albumin/protein, Na/K/Cl, glucose, and acid-base status.' },
  },
  {
    key: 'anesthesia',
    title: { es: 'Anestesia', en: 'Anesthesia' },
    fluid: { es: 'Cristaloide isotónico balanceado a ritmo conservador; corregir deshidratacion antes si se puede.', en: 'Balanced isotonic crystalloid at a conservative rate; correct dehydration beforehand when possible.' },
    supplement: { es: 'Dextrosa en cachorro/gatito toy o hipoglucemia. Evitar subir fluidos sin revisar plano anestesico.', en: 'Dextrose for toy puppy/kitten or hypoglycemia. Avoid raising fluids without checking anesthetic depth.' },
    watch: { es: 'MAP objetivo >=60 mmHg, temperatura, profundidad, bradicardia y signos de sobrecarga.', en: 'MAP target >=60 mmHg, temperature, depth, bradycardia, and overload signs.' },
  },
  {
    key: 'pediatric',
    title: { es: 'Cachorro / joven', en: 'Pediatric / young' },
    fluid: { es: 'Mantenimiento mayor que adulto. Usar bombas, fluidos templados y controles frecuentes.', en: 'Higher maintenance than adults. Use pumps, warmed fluids, and frequent checks.' },
    supplement: { es: 'Dextrosa si riesgo de hipoglucemia. Potasio solo con monitorizacion.', en: 'Dextrose if hypoglycemia risk. Potassium only with monitoring.' },
    watch: { es: 'Glucosa, temperatura, peso, sobrecarga, diuresis y respuesta clinica.', en: 'Glucose, temperature, weight, overload, urine output, and clinical response.' },
  },
];

const dehydrationGuide = [
  { range: '<5%', es: 'Puede no verse clinicamente; historia y peso ayudan.', en: 'May be clinically inapparent; history and weight help.' },
  { range: '5-6%', es: 'Mucosas algo secas, sed, ligera perdida de elasticidad.', en: 'Slightly dry mucosa, thirst, mild loss of skin elasticity.' },
  { range: '7-8%', es: 'Pliegue cutaneo, ojos hundidos, TRC puede alargarse.', en: 'Skin tenting, sunken eyes, CRT may prolong.' },
  { range: '10%+', es: 'Depresion, pulso debil, extremidades frias, shock posible.', en: 'Depression, weak pulse, cool limbs, shock possible.' },
];

const references = [
  { label: 'AAHA fluid therapy 2024', url: 'https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-3-fluids-for-replacement-and-maintenance/' },
  { label: 'AAHA anesthesia fluids', url: 'https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-4-fluid-therapy-and-anesthesia/' },
  { label: 'Merck equine emergency fluids', url: 'https://www.merckvetmanual.com/emergency-medicine-and-critical-care/emergency-medicine-in-horses/emergency-procedures-in-horses' },
  { label: 'Merck colic fluid needs', url: 'https://www.merckvetmanual.com/digestive-system/colic-in-horses/overview-of-colic-in-horses' },
  { label: 'Calf diarrhea IV fluids', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7126998/' },
];

const getCopy = (lang: Language) => ({
  kicker: lang === 'es' ? 'Fluidoterapia' : 'Fluid therapy',
  title: lang === 'es' ? 'Plan rapido por especie' : 'Quick species-first plan',
  text:
    lang === 'es'
      ? 'Calcula mantenimiento, deficit por deshidratacion y perdidas, con decisiones practicas por problema.'
      : 'Calculate maintenance, dehydration deficit, and losses with practical decisions by problem.',
  patient: lang === 'es' ? 'Paciente' : 'Patient',
  species: lang === 'es' ? 'Especie' : 'Species',
  weight: lang === 'es' ? 'Peso' : 'Weight',
  dehydration: lang === 'es' ? 'Deshidratacion' : 'Dehydration',
  ongoing: lang === 'es' ? 'Perdidas continuas' : 'Ongoing losses',
  pediatric: lang === 'es' ? 'Paciente joven' : 'Young patient',
  problem: lang === 'es' ? 'Problema principal' : 'Main problem',
  maintenance: lang === 'es' ? 'Mantenimiento' : 'Maintenance',
  deficit: lang === 'es' ? 'Deficit' : 'Deficit',
  losses: lang === 'es' ? 'Perdidas' : 'Losses',
  total: lang === 'es' ? 'Total 24 h' : 'Total 24 h',
  hourly: lang === 'es' ? 'Ritmo medio' : 'Average rate',
  bolus: lang === 'es' ? 'Bolus shock' : 'Shock bolus',
  anesthesia: lang === 'es' ? 'Anestesia' : 'Anesthesia',
  route: lang === 'es' ? 'Ruta' : 'Route',
  dehydrationGuide: lang === 'es' ? 'Como estimar la deshidratacion' : 'How to estimate dehydration',
  fluidChoice: lang === 'es' ? 'Fluido y suplementos' : 'Fluid and supplements',
  sources: lang === 'es' ? 'Referencias' : 'References',
  note:
    lang === 'es'
      ? 'Herramienta orientativa: ajustar por perfusion, electrolitos, diuresis, comorbilidades y respuesta.'
      : 'Guidance tool: adjust by perfusion, electrolytes, urine output, comorbidities, and response.',
});

export default function FluidTherapyToolkit({ lang }: { lang: Language }) {
  const copy = getCopy(lang);
  const [speciesKey, setSpeciesKey] = useState<FluidSpeciesKey>('dog');
  const [problemKey, setProblemKey] = useState<FluidProblemKey>('dehydration');
  const activeSpecies = speciesProfiles.find((item) => item.key === speciesKey) ?? speciesProfiles[0];
  const activeProblem = problems.find((item) => item.key === problemKey) ?? problems[0];
  const [weight, setWeight] = useState(String(activeSpecies.defaultWeight));
  const [dehydration, setDehydration] = useState('6');
  const [ongoingLoss, setOngoingLoss] = useState(String(activeSpecies.defaultOngoingLossMlKgDay));
  const [isPediatric, setIsPediatric] = useState(false);

  const parsedWeight = Number.parseFloat(weight);
  const parsedDehydration = Number.parseFloat(dehydration);
  const parsedOngoingLoss = Number.parseFloat(ongoingLoss);
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;
  const safeDehydration = Number.isFinite(parsedDehydration) && parsedDehydration > 0 ? Math.min(parsedDehydration, 15) : 0;
  const safeOngoingLoss = Number.isFinite(parsedOngoingLoss) && parsedOngoingLoss > 0 ? parsedOngoingLoss : 0;

  const calculations = useMemo(() => {
    const maintenanceMultiplier = isPediatric ? activeSpecies.pediatricMultiplier : 1;
    const maintenanceMlDay = validWeight * activeSpecies.maintenanceMlKgDay * maintenanceMultiplier;
    const deficitMl = validWeight * safeDehydration * 10;
    const ongoingMlDay = validWeight * safeOngoingLoss;
    const totalMlDay = maintenanceMlDay + deficitMl + ongoingMlDay;

    return {
      maintenanceMlDay,
      deficitMl,
      ongoingMlDay,
      totalMlDay,
      hourlyMl: totalMlDay / 24,
    };
  }, [activeSpecies, isPediatric, safeDehydration, safeOngoingLoss, validWeight]);

  const handleSpeciesChange = (nextSpecies: FluidSpeciesProfile) => {
    setSpeciesKey(nextSpecies.key);
    setWeight(String(nextSpecies.defaultWeight));
    setOngoingLoss(String(nextSpecies.defaultOngoingLossMlKgDay));
    setIsPediatric(false);
  };

  return (
    <section className="toolkit-utility fluid-toolkit">
      <div className="toolkit-utility-header fluid-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
          <p>{copy.text}</p>
        </div>
        <div className="toolkit-utility-note fluid-summary-note">
          <strong>{activeSpecies.name[lang]}</strong>
          <p>
            {copy.route}: {activeSpecies.route[lang]}
          </p>
        </div>
      </div>

      <div className="fluid-species-row" aria-label={copy.species}>
        {speciesProfiles.map((species) => (
          <button
            key={species.key}
            type="button"
            className={`fluid-species-chip ${species.key === activeSpecies.key ? 'is-active' : ''}`}
            onClick={() => handleSpeciesChange(species)}
          >
            <span>{species.name[lang]}</span>
            <small>{species.group[lang]}</small>
          </button>
        ))}
      </div>

      <div className="fluid-layout">
        <section className="toolkit-utility-card fluid-input-panel">
          <div className="infusion-block-header">
            <h4>{copy.patient}</h4>
            <p>{activeSpecies.notes[0][lang]}</p>
          </div>

          <div className="toolkit-utility-form fluid-form">
            <label>
              {copy.weight} (kg)
              <input type="number" min="0" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
            <label>
              {copy.dehydration} (%)
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                value={dehydration}
                onChange={(event) => setDehydration(event.target.value)}
              />
            </label>
            <label>
              {copy.ongoing} (mL/kg/d)
              <input
                type="number"
                min="0"
                step="1"
                value={ongoingLoss}
                onChange={(event) => setOngoingLoss(event.target.value)}
              />
            </label>
            <label>
              {copy.problem}
              <select value={problemKey} onChange={(event) => setProblemKey(event.target.value as FluidProblemKey)}>
                {problems.map((problem) => (
                  <option key={problem.key} value={problem.key}>
                    {problem.title[lang]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="fluid-toggle">
            <input type="checkbox" checked={isPediatric} onChange={(event) => setIsPediatric(event.target.checked)} />
            <span>
              {copy.pediatric}: {activeSpecies.pediatricLabel[lang]}
            </span>
          </label>
        </section>

        <section className="toolkit-utility-card result-card fluid-result-panel">
          <div className="fluid-result-grid">
            <article>
              <span>{copy.maintenance}</span>
              <strong>{roundValue(calculations.maintenanceMlDay, 0)}</strong>
              <small>mL/24 h</small>
            </article>
            <article>
              <span>{copy.deficit}</span>
              <strong>{roundValue(calculations.deficitMl / 1000, 2)}</strong>
              <small>L</small>
            </article>
            <article>
              <span>{copy.losses}</span>
              <strong>{roundValue(calculations.ongoingMlDay, 0)}</strong>
              <small>mL/24 h</small>
            </article>
            <article className="fluid-result-total">
              <span>{copy.total}</span>
              <strong>{roundValue(calculations.totalMlDay / 1000, 2)}</strong>
              <small>L</small>
            </article>
          </div>

          <div className="fluid-rate-strip">
            <div>
              <span>{copy.hourly}</span>
              <strong>{roundValue(calculations.hourlyMl, 0)} mL/h</strong>
            </div>
            <div>
              <span>{copy.bolus}</span>
              <strong>{activeSpecies.shockBolusMlKg}</strong>
            </div>
            <div>
              <span>{copy.anesthesia}</span>
              <strong>{activeSpecies.anesthesiaMlKgHour}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="fluid-decision-grid">
        <article className="fluid-decision-card">
          <h4>{copy.dehydrationGuide}</h4>
          <div className="fluid-scale-list">
            {dehydrationGuide.map((item) => (
              <div key={item.range}>
                <strong>{item.range}</strong>
                <span>{item[lang]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="fluid-decision-card fluid-problem-card">
          <h4>{activeProblem.title[lang]}</h4>
          <dl>
            <div>
              <dt>{copy.fluidChoice}</dt>
              <dd>{activeProblem.fluid[lang]}</dd>
            </div>
            <div>
              <dt>{lang === 'es' ? 'Suplementacion' : 'Supplementation'}</dt>
              <dd>{activeProblem.supplement[lang]}</dd>
            </div>
            <div>
              <dt>{lang === 'es' ? 'Monitorizar' : 'Monitor'}</dt>
              <dd>{activeProblem.watch[lang]}</dd>
            </div>
          </dl>
        </article>

        <article className="fluid-decision-card">
          <h4>{lang === 'es' ? 'Notas de especie' : 'Species notes'}</h4>
          <ul className="fluid-note-list">
            <li>
              {lang === 'es' ? 'Rehidratacion estimada: ' : 'Estimated rehydration: '}
              {activeSpecies.deficitHours}
            </li>
            {activeSpecies.notes.map((note) => (
              <li key={note.es}>{note[lang]}</li>
            ))}
          </ul>
        </article>
      </section>

      <article className="toolkit-source-note fluid-source-note">
        <strong>{copy.sources}</strong>
        <p>{copy.note}</p>
        <div className="vital-source-links">
          {references.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}
