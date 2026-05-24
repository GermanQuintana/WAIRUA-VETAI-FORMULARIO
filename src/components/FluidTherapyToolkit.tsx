import { useMemo, useState } from 'react';
import { Language } from '../i18n';

type FluidSpeciesKey = 'dog' | 'cat' | 'rabbit' | 'horse' | 'cow';
type FluidProblemKey = 'dehydration' | 'shock' | 'diarrhea' | 'anesthesia' | 'pediatric';
type PotassiumAmpUnit = 'meqMl' | 'mgMlKcl' | 'mgMlK';

interface FluidSpeciesProfile {
  key: FluidSpeciesKey;
  name: { es: string; en: string };
  group: { es: string; en: string };
  maintenanceMlKgDay: number;
  anesthesiaMlKgHour: string;
  shockBolusMlKg: string;
  deficitHours: string;
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

const potassiumSupplementationGuide = [
  {
    serum: '<2.0',
    add: '60-80 mEq/L',
    note: {
      es: 'Hipopotasemia severa: ECG, bomba y control estrecho; no superar 0.5 mEq/kg/h salvo UCI.',
      en: 'Severe hypokalemia: ECG, pump, and close control; do not exceed 0.5 mEq/kg/h except ICU.',
    },
  },
  {
    serum: '2.1-2.5',
    add: '60 mEq/L',
    note: { es: 'Revisar cada 4-6 h si el paciente esta inestable.', en: 'Recheck every 4-6 h if unstable.' },
  },
  {
    serum: '2.6-3.0',
    add: '40 mEq/L',
    note: { es: 'Frecuente en anorexia, diarrea o poliuria.', en: 'Common with anorexia, diarrhea, or polyuria.' },
  },
  {
    serum: '3.1-3.5',
    add: '20-40 mEq/L',
    note: { es: 'Elegir el extremo alto si hay perdidas digestivas activas.', en: 'Use the upper end with active GI losses.' },
  },
  {
    serum: '3.6-5.0',
    add: '0-20 mEq/L',
    note: { es: 'Mantenimiento bajo solo si hay perdidas continuas y diuresis.', en: 'Low maintenance only with ongoing losses and urine output.' },
  },
];

const potassiumPathologyGuide = [
  {
    problem: { es: 'Diarrea con K desconocido', en: 'Diarrhea with unknown K' },
    action: { es: '10-20 mEq/L si hay diuresis y no sospechas hiperK.', en: '10-20 mEq/L if urinating and hyperK is not suspected.' },
  },
  {
    problem: { es: 'Anorexia/ileos prolongados', en: 'Prolonged anorexia/ileus' },
    action: { es: '20 mEq/L y repetir ionograma cuando sea posible.', en: '20 mEq/L and repeat electrolytes when possible.' },
  },
  {
    problem: { es: 'Obstruccion urinaria, Addison, AKI', en: 'Urinary obstruction, Addison, AKI' },
    action: { es: 'No suplementar hasta medir K y confirmar diuresis.', en: 'Do not supplement until K is measured and urine output confirmed.' },
  },
];

const cowMineralGuide = [
  {
    title: { es: 'Calcio', en: 'Calcium' },
    body: {
      es: 'Hipocalcemia/fiebre de la leche: calcio borogluconato IV lento segun producto, monitorizando corazon. Muchos protocolos adultos usan 400-500 mL.',
      en: 'Hypocalcemia/milk fever: slow IV calcium borogluconate by product label, monitoring the heart. Many adult protocols use 400-500 mL.',
    },
  },
  {
    title: { es: 'Magnesio', en: 'Magnesium' },
    body: {
      es: 'Tetania de los pastos o hipomagnesemia: combinar calcio + magnesio. Merck cita 400 mL Ca borogluconato 40% + 50 mL MgSO4 25% IV lento.',
      en: 'Grass tetany or hypomagnesemia: combine calcium + magnesium. Merck cites 400 mL 40% Ca borogluconate + 50 mL 25% MgSO4 slow IV.',
    },
  },
  {
    title: { es: 'Seguridad', en: 'Safety' },
    body: {
      es: 'No mezclar calcio/magnesio en cualquier bolsa sin revisar compatibilidad del producto. Auscultar y detener si hay arritmia.',
      en: 'Do not mix calcium/magnesium in any bag without checking product compatibility. Auscultate and stop if arrhythmia appears.',
    },
  },
];

const references = [
  { label: 'AAHA fluid therapy 2024', url: 'https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-3-fluids-for-replacement-and-maintenance/' },
  { label: 'AAHA anesthesia fluids', url: 'https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-4-fluid-therapy-and-anesthesia/' },
  { label: 'Merck equine emergency fluids', url: 'https://www.merckvetmanual.com/emergency-medicine-and-critical-care/emergency-medicine-in-horses/emergency-procedures-in-horses' },
  { label: 'Merck colic fluid needs', url: 'https://www.merckvetmanual.com/digestive-system/colic-in-horses/overview-of-colic-in-horses' },
  { label: 'Merck potassium supplementation', url: 'https://www.merckvetmanual.com/therapeutics/fluid-therapy/the-fluid-resuscitation-plan-in-animals' },
  { label: 'MSD potassium table', url: 'https://www.msdvetmanual.com/multimedia/table/guideline-for-potassium-supplementation-in-dogs-and-cats' },
  { label: 'Merck cattle Mg/Ca', url: 'https://www.merckvetmanual.com/metabolic-disorders/disorders-of-magnesium-metabolism/hypomagnesemic-tetany-in-cattle-and-sheep' },
  { label: 'Calf diarrhea IV fluids', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7126998/' },
];

const KCL_MG_PER_MEQ = 74.55;
const POTASSIUM_MG_PER_MEQ = 39.1;

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
  maintenanceRate: lang === 'es' ? 'Base mantenimiento' : 'Maintenance base',
  deficit: lang === 'es' ? 'Deficit' : 'Deficit',
  losses: lang === 'es' ? 'Perdidas' : 'Losses',
  total: lang === 'es' ? 'Total 24 h' : 'Total 24 h',
  hourly: lang === 'es' ? 'Ritmo medio' : 'Average rate',
  bolus: lang === 'es' ? 'Bolus shock' : 'Shock bolus',
  anesthesia: lang === 'es' ? 'Anestesia' : 'Anesthesia',
  route: lang === 'es' ? 'Ruta' : 'Route',
  dehydrationGuide: lang === 'es' ? 'Como estimar la deshidratacion' : 'How to estimate dehydration',
  fluidChoice: lang === 'es' ? 'Fluido y suplementos' : 'Fluid and supplements',
  potassium: lang === 'es' ? 'Potasio y electrolitos' : 'Potassium and electrolytes',
  kConverter: lang === 'es' ? 'Conversor de ampolla KCl' : 'KCl ampoule converter',
  serumK: lang === 'es' ? 'K analitico' : 'Serum K',
  targetBag: lang === 'es' ? 'K objetivo en bolsa' : 'Target K in bag',
  bagVolume: lang === 'es' ? 'Volumen de bolsa' : 'Bag volume',
  ampConcentration: lang === 'es' ? 'Concentracion ampolla' : 'Ampoule concentration',
  ampUnit: lang === 'es' ? 'Unidad ampolla' : 'Ampoule unit',
  calculated: lang === 'es' ? 'Calculado' : 'Calculated',
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
  const [weight, setWeight] = useState('');
  const [dehydration, setDehydration] = useState('');
  const [ongoingLoss, setOngoingLoss] = useState('');
  const [isPediatric, setIsPediatric] = useState(false);
  const [serumPotassium, setSerumPotassium] = useState('');
  const [targetPotassium, setTargetPotassium] = useState('');
  const [bagVolume, setBagVolume] = useState('');
  const [ampConcentration, setAmpConcentration] = useState('');
  const [ampUnit, setAmpUnit] = useState<PotassiumAmpUnit>('meqMl');

  const parsedWeight = Number.parseFloat(weight);
  const parsedDehydration = Number.parseFloat(dehydration);
  const parsedOngoingLoss = Number.parseFloat(ongoingLoss);
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;
  const safeDehydration = Number.isFinite(parsedDehydration) && parsedDehydration > 0 ? Math.min(parsedDehydration, 15) : 0;
  const safeOngoingLoss = Number.isFinite(parsedOngoingLoss) && parsedOngoingLoss > 0 ? parsedOngoingLoss : 0;
  const hasWeight = validWeight > 0;
  const parsedSerumPotassium = Number.parseFloat(serumPotassium);
  const parsedTargetPotassium = Number.parseFloat(targetPotassium);
  const parsedBagVolume = Number.parseFloat(bagVolume);
  const parsedAmpConcentration = Number.parseFloat(ampConcentration);

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
      maintenanceMlKgHour: (activeSpecies.maintenanceMlKgDay * maintenanceMultiplier) / 24,
    };
  }, [activeSpecies, isPediatric, safeDehydration, safeOngoingLoss, validWeight]);

  const handleSpeciesChange = (nextSpecies: FluidSpeciesProfile) => {
    setSpeciesKey(nextSpecies.key);
    setWeight('');
    setDehydration('');
    setOngoingLoss('');
    setIsPediatric(false);
  };

  const selectedPotassiumGuide = potassiumSupplementationGuide.find((item) => {
    if (!Number.isFinite(parsedSerumPotassium)) return false;
    if (item.serum === '<2.0') return parsedSerumPotassium < 2;
    if (item.serum === '2.1-2.5') return parsedSerumPotassium >= 2.1 && parsedSerumPotassium <= 2.5;
    if (item.serum === '2.6-3.0') return parsedSerumPotassium >= 2.6 && parsedSerumPotassium <= 3;
    if (item.serum === '3.1-3.5') return parsedSerumPotassium >= 3.1 && parsedSerumPotassium <= 3.5;
    return parsedSerumPotassium >= 3.6 && parsedSerumPotassium <= 5;
  });

  const ampMeqPerMl =
    Number.isFinite(parsedAmpConcentration) && parsedAmpConcentration > 0
      ? ampUnit === 'meqMl'
        ? parsedAmpConcentration
        : ampUnit === 'mgMlKcl'
          ? parsedAmpConcentration / KCL_MG_PER_MEQ
          : parsedAmpConcentration / POTASSIUM_MG_PER_MEQ
      : 0;
  const targetMeq =
    Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium > 0 && Number.isFinite(parsedBagVolume) && parsedBagVolume > 0
      ? parsedTargetPotassium * (parsedBagVolume / 1000)
      : 0;
  const ampMlToAdd = ampMeqPerMl > 0 && targetMeq > 0 ? targetMeq / ampMeqPerMl : 0;
  const deliveredKMeqKgHour =
    hasWeight && Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium > 0 && calculations.hourlyMl > 0
      ? (parsedTargetPotassium * (calculations.hourlyMl / 1000)) / validWeight
      : 0;

  const formatNumber = (value: number, decimals = 0, suffix = '') =>
    Number.isFinite(value) && value > 0 ? `${roundValue(value, decimals)}${suffix}` : '-';

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
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                placeholder="kg"
                onChange={(event) => setWeight(event.target.value)}
              />
            </label>
            <label>
              {copy.dehydration} (%)
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                value={dehydration}
                placeholder="%"
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
                placeholder="mL/kg/d"
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
              <span>{copy.maintenanceRate}</span>
              <strong>{roundValue(calculations.maintenanceMlKgHour, 1)}</strong>
              <small>mL/kg/h</small>
            </article>
            <article>
              <span>{copy.maintenance}</span>
              <strong>{formatNumber(calculations.maintenanceMlDay)}</strong>
              <small>mL/24 h</small>
            </article>
            <article>
              <span>{copy.deficit}</span>
              <strong>{formatNumber(calculations.deficitMl / 1000, 2)}</strong>
              <small>L</small>
            </article>
            <article>
              <span>{copy.losses}</span>
              <strong>{formatNumber(calculations.ongoingMlDay)}</strong>
              <small>mL/24 h</small>
            </article>
            <article className="fluid-result-total">
              <span>{copy.total}</span>
              <strong>{formatNumber(calculations.totalMlDay / 1000, 2)}</strong>
              <small>L</small>
            </article>
          </div>

          <div className="fluid-rate-strip">
            <div>
              <span>{copy.hourly}</span>
              <strong>{formatNumber(calculations.hourlyMl, 0, ' mL/h')}</strong>
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

      <section className="fluid-electrolyte-section">
        <div className="fluid-electrolyte-header">
          <div>
            <p className="section-kicker">{copy.potassium}</p>
            <h4>{copy.kConverter}</h4>
          </div>
          <p>
            {lang === 'es'
              ? 'KCl: 1 mEq equivale a 74.55 mg de KCl o 39.1 mg de potasio. No superar 0.5 mEq/kg/h salvo UCI.'
              : 'KCl: 1 mEq equals 74.55 mg of KCl or 39.1 mg of potassium. Do not exceed 0.5 mEq/kg/h except ICU.'}
          </p>
        </div>

        <div className="fluid-electrolyte-layout">
          <article className="fluid-decision-card">
            <h4>{lang === 'es' ? 'Tabla orientativa KCl' : 'KCl guidance table'}</h4>
            <div className="fluid-k-table">
              {potassiumSupplementationGuide.map((item) => (
                <div key={item.serum} className={selectedPotassiumGuide?.serum === item.serum ? 'is-highlighted' : ''}>
                  <strong>{item.serum} mEq/L</strong>
                  <span>{item.add}</span>
                  <p>{item.note[lang]}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="fluid-decision-card fluid-k-converter">
            <div className="toolkit-utility-form fluid-form">
              <label>
                {copy.serumK} (mEq/L)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={serumPotassium}
                  placeholder="mEq/L"
                  onChange={(event) => setSerumPotassium(event.target.value)}
                />
              </label>
              <label>
                {copy.targetBag} (mEq/L)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={targetPotassium}
                  placeholder="mEq/L"
                  onChange={(event) => setTargetPotassium(event.target.value)}
                />
              </label>
              <label>
                {copy.bagVolume} (mL)
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={bagVolume}
                  placeholder="mL"
                  onChange={(event) => setBagVolume(event.target.value)}
                />
              </label>
              <label>
                {copy.ampConcentration}
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ampConcentration}
                  placeholder={ampUnit === 'meqMl' ? 'mEq/mL' : 'mg/mL'}
                  onChange={(event) => setAmpConcentration(event.target.value)}
                />
              </label>
              <label>
                {copy.ampUnit}
                <select value={ampUnit} onChange={(event) => setAmpUnit(event.target.value as PotassiumAmpUnit)}>
                  <option value="meqMl">mEq/mL</option>
                  <option value="mgMlKcl">mg/mL KCl</option>
                  <option value="mgMlK">mg/mL K+</option>
                </select>
              </label>
            </div>

            <div className="fluid-converter-results">
              <div>
                <span>{lang === 'es' ? 'Equivalencia ampolla' : 'Ampoule equivalent'}</span>
                <strong>{formatNumber(ampMeqPerMl, 2, ' mEq/mL')}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'K total a anadir' : 'Total K to add'}</span>
                <strong>{formatNumber(targetMeq, 1, ' mEq')}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'Volumen de ampolla' : 'Ampoule volume'}</span>
                <strong>{formatNumber(ampMlToAdd, 2, ' mL')}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'Ritmo K estimado' : 'Estimated K rate'}</span>
                <strong>{formatNumber(deliveredKMeqKgHour, 3, ' mEq/kg/h')}</strong>
              </div>
            </div>

            {selectedPotassiumGuide ? (
              <p className="fluid-k-recommendation">
                {lang === 'es' ? 'Segun K analitico: ' : 'By serum K: '}
                <strong>{selectedPotassiumGuide.add}</strong>
              </p>
            ) : null}
          </article>

          <article className="fluid-decision-card">
            <h4>{lang === 'es' ? 'Si no hay ionograma' : 'If electrolytes are unavailable'}</h4>
            <div className="fluid-scale-list">
              {potassiumPathologyGuide.map((item) => (
                <div key={item.problem.es}>
                  <strong>{item.problem[lang]}</strong>
                  <span>{item.action[lang]}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {activeSpecies.key === 'cow' ? (
          <section className="fluid-cow-minerals">
            {cowMineralGuide.map((item) => (
              <article key={item.title.es}>
                <strong>{item.title[lang]}</strong>
                <p>{item.body[lang]}</p>
              </article>
            ))}
          </section>
        ) : null}
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
