import { useId, useMemo, useState } from 'react';
import { Language } from '../i18n';
import FluidTypeGuide from './FluidTypeGuide';
import FluidMonitoring from './FluidMonitoring';
import { FLUID_SOURCES } from '../data/fluidGuide';
import { calculatePotassiumAdmixture } from '../lib/fluidMath';

type FluidSpeciesKey = 'dog' | 'cat' | 'rabbit' | 'horse' | 'cow';
type FluidProblemKey = 'dehydration' | 'shock' | 'diarrhea' | 'anesthesia' | 'pediatric';
type PotassiumAmpUnit = 'meqMl' | 'mgMlKcl' | 'mgMlK';
const fluidViews = ['plan', 'guide', 'electrolytes', 'monitor'] as const;
type FluidView = (typeof fluidViews)[number];

interface FluidSpeciesProfile {
  key: FluidSpeciesKey;
  name: { es: string; en: string };
  group: { es: string; en: string };
  maintenanceMlKgDay: number;
  anesthesiaMlKgHour: string;
  anesthesiaRateRange: [number, number];
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

interface SpecialFluidItem {
  key: string;
  title: { es: string; en: string };
  dose: string;
  use: { es: string; en: string };
  caution: { es: string; en: string };
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
    anesthesiaRateRange: [5, 5],
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
    anesthesiaRateRange: [3, 5],
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
    anesthesiaRateRange: [5, 10],
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
    anesthesiaRateRange: [5, 10],
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
    anesthesiaRateRange: [5, 10],
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
    add: '80 mEq/L',
    note: {
      es: 'Hipopotasemia severa: ECG, bomba y control estrecho; no superar 0,5 mEq/kg/h. No administrar en bolo.',
      en: 'Severe hypokalemia: ECG, pump, and close control; do not exceed 0.5 mEq/kg/h. Never administer as a bolus.',
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
    add: '25-30 mEq/L',
    note: { es: 'Confirmar pérdidas, diuresis y ritmo real antes de suplementar.', en: 'Confirm losses, urine output, and actual rate before supplementation.' },
  },
  {
    serum: '3.6-5.0',
    add: '20 mEq/L',
    note: { es: 'Mantenimiento bajo solo si hay perdidas continuas y diuresis.', en: 'Low maintenance only with ongoing losses and urine output.' },
  },
  { serum: '>5.0', add: '0 mEq/L', note: { es: 'No añadir KCl; valorar hiperpotasemia y causa.', en: 'Do not add KCl; assess hyperkalemia and the cause.' } },
];

const potassiumPathologyGuide = [
  {
    problem: { es: 'Diarrea con K desconocido', en: 'Diarrhea with unknown K' },
    action: { es: 'Medir K y confirmar diuresis antes de elegir la suplementación; no asignar una concentración solo por la diarrea.', en: 'Measure K and confirm urine output before selecting supplementation; do not choose concentration based only on diarrhea.' },
  },
  {
    problem: { es: 'Anorexia/ileos prolongados', en: 'Prolonged anorexia/ileus' },
    action: { es: 'Valorar déficit de K con ionograma y ajustar al ritmo real; repetir controles según estabilidad.', en: 'Assess K deficit with electrolytes and adjust to the actual rate; repeat checks according to stability.' },
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

const generalSpecialFluids: SpecialFluidItem[] = [
  {
    key: 'hypertonic',
    title: { es: 'Salino hipertonico 7.2-7.5%', en: '7.2-7.5% hypertonic saline' },
    dose: '3-5 mL/kg IV en 10-15 min',
    use: {
      es: 'Rescate de hipovolemia/shock con poco volumen. Siempre seguir con cristaloide isotónico.',
      en: 'Low-volume rescue for hypovolemia/shock. Always follow with isotonic crystalloid.',
    },
    caution: {
      es: 'Evitar si hipernatremia, deshidratacion libre severa o sin acceso a agua/fluido posterior.',
      en: 'Avoid with hypernatremia, severe free-water dehydration, or no access to follow-up water/fluid.',
    },
  },
  {
    key: 'mannitol',
    title: { es: 'Manitol 20%', en: '20% mannitol' },
    dose: '0.25-1 g/kg IV lento',
    use: {
      es: 'Edema cerebral, hipertension intracraneal, glaucoma agudo o diuresis osmotica seleccionada.',
      en: 'Cerebral edema, intracranial hypertension, acute glaucoma, or selected osmotic diuresis.',
    },
    caution: {
      es: 'No usar sin perfusion/diuresis adecuadas. Vigilar osmolaridad, sodio y sobrecarga.',
      en: 'Do not use without adequate perfusion/urine output. Monitor osmolality, sodium, and overload.',
    },
  },
  {
    key: 'colloid',
    title: { es: 'Coloides / dextrano', en: 'Colloids / dextran' },
    dose: 'Usar dosis bajas tituladas',
    use: {
      es: 'Hipoproteinemia o soporte oncótico muy seleccionado cuando cristaloides no bastan.',
      en: 'Very selected oncotic support or hypoproteinemia when crystalloids are insufficient.',
    },
    caution: {
      es: 'Riesgo renal/coagulacion/anafilaxia. Revisar disponibilidad, indicacion y alternativa con plasma.',
      en: 'Renal/coagulation/anaphylaxis risk. Review availability, indication, and plasma alternatives.',
    },
  },
];

const specialFluidBySpecies: Record<FluidSpeciesKey, SpecialFluidItem[]> = {
  dog: generalSpecialFluids,
  cat: [
    { ...generalSpecialFluids[0], dose: '2-4 mL/kg IV en 10-15 min' },
    { ...generalSpecialFluids[1], dose: '0.25-0.5 g/kg IV lento' },
    { ...generalSpecialFluids[2], dose: 'Muy seleccionado; evitar uso rutinario' },
  ],
  rabbit: [
    { ...generalSpecialFluids[0], dose: 'Solo UCI/exoticos; bolos pequenos titulados' },
    { ...generalSpecialFluids[1], dose: 'Exoticos: individualizar y monitorizar diuresis' },
    { ...generalSpecialFluids[2], dose: 'No rutinario; priorizar cristaloide tibio + soporte' },
  ],
  horse: [
    { ...generalSpecialFluids[0], dose: '4 mL/kg IV; adulto 2 L aprox.' },
    { ...generalSpecialFluids[1], dose: '0.25-1 g/kg IV lento' },
    { ...generalSpecialFluids[2], dose: 'Plasma/coloide si hipoproteinemia marcada; monitorizar' },
  ],
  cow: [
    { ...generalSpecialFluids[0], dose: '4-5 mL/kg IV; seguir con agua oral/isotonico' },
    { ...generalSpecialFluids[1], dose: 'Uso excepcional; priorizar causa y perfusion' },
    { ...generalSpecialFluids[2], dose: 'Plasma/coloide rara vez; valorar coste y objetivo' },
  ],
};

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
const englishReferenceText: Record<string, string> = {
  '15-20 mL/kg IV, reevaluar en 15-30 min': '15–20 mL/kg IV, reassess in 15–30 min',
  '5-10 mL/kg IV, reevaluar en 15-30 min': '5–10 mL/kg IV, reassess in 15–30 min',
  '10-20 mL/kg IV/IO tibio, reevaluar': '10–20 mL/kg warmed IV/IO, reassess',
  '20 mL/kg IV o 20-35 L/1-2 h en adulto si deficit grave': '20 mL/kg IV or 20–35 L over 1–2 h in an adult with severe deficit',
  '10-20 mL/kg IV, reevaluar perfusion': '10–20 mL/kg IV, reassess perfusion',
  '5-10 mL/kg/h segun procedimiento': '5–10 mL/kg/h according to procedure',
  '5-10 mL/kg/h si anestesia/quirurgico': '5–10 mL/kg/h for anesthesia/surgery',
  '50% en 1-2 h si shock; resto en 24 h': '50% over 1–2 h with shock; remainder over 24 h',
  '12-24 h; mas rapido si hipovolemia': '12–24 h; faster if hypovolemic',
  '3-5 mL/kg IV en 10-15 min': '3–5 mL/kg IV over 10–15 min',
  '2-4 mL/kg IV en 10-15 min': '2–4 mL/kg IV over 10–15 min',
  '0.25-1 g/kg IV lento': '0.25–1 g/kg slowly IV',
  '0.25-0.5 g/kg IV lento': '0.25–0.5 g/kg slowly IV',
  'Usar dosis bajas tituladas': 'Use low titrated doses',
  'Muy seleccionado; evitar uso rutinario': 'Highly selected cases; avoid routine use',
  'Solo UCI/exoticos; bolos pequenos titulados': 'ICU/exotics only; small titrated boluses',
  'Exoticos: individualizar y monitorizar diuresis': 'Exotics: individualize and monitor urine output',
  'No rutinario; priorizar cristaloide tibio + soporte': 'Not routine; prioritize warmed crystalloid and support',
  '4 mL/kg IV; adulto 2 L aprox.': '4 mL/kg IV; approximately 2 L in an adult',
  'Plasma/coloide si hipoproteinemia marcada; monitorizar': 'Plasma/colloid with marked hypoproteinemia; monitor',
  '4-5 mL/kg IV; seguir con agua oral/isotonico': '4–5 mL/kg IV; follow with oral water/isotonic fluid',
  'Uso excepcional; priorizar causa y perfusion': 'Exceptional use; prioritize cause and perfusion',
  'Plasma/coloide rara vez; valorar coste y objetivo': 'Plasma/colloid rarely; consider cost and goal',
};
const referenceText = (value: string, lang: Language) => lang === 'en' ? englishReferenceText[value] ?? value : value;

const getCopy = (lang: Language) => ({
  kicker: lang === 'es' ? 'Fluidoterapia' : 'Fluid therapy',
  title: lang === 'es' ? 'Plan rápido por especie' : 'Quick species-first plan',
  text:
    lang === 'es'
      ? 'Calcula mantenimiento, déficit y pérdidas; elige el fluido y reevalúa la respuesta.'
      : 'Calculate maintenance, dehydration deficit, and losses with practical decisions by problem.',
  patient: lang === 'es' ? 'Paciente' : 'Patient',
  species: lang === 'es' ? 'Especie' : 'Species',
  weight: lang === 'es' ? 'Peso' : 'Weight',
  dehydration: lang === 'es' ? 'Deshidratación' : 'Dehydration',
  ongoing: lang === 'es' ? 'Pérdidas continuas' : 'Ongoing losses',
  pediatric: lang === 'es' ? 'Paciente joven' : 'Young patient',
  problem: lang === 'es' ? 'Problema principal' : 'Main problem',
  maintenance: lang === 'es' ? 'Mantenimiento' : 'Maintenance',
  maintenanceRate: lang === 'es' ? 'Base mantenimiento' : 'Maintenance base',
  deficit: lang === 'es' ? 'Déficit' : 'Deficit',
  losses: lang === 'es' ? 'Pérdidas' : 'Losses',
  total: lang === 'es' ? 'Total 24 h' : 'Total 24 h',
  hourly: lang === 'es' ? 'Ritmo inicial del plan' : 'Initial plan rate',
  bolus: lang === 'es' ? 'Bolo de hipovolemia' : 'Hypovolemia bolus',
  anesthesia: lang === 'es' ? 'Anestesia' : 'Anesthesia',
  anesthesiaCalculated: lang === 'es' ? 'Anestesia calculada' : 'Calculated anesthesia',
  route: lang === 'es' ? 'Ruta' : 'Route',
  dehydrationGuide: lang === 'es' ? 'Cómo estimar la deshidratación' : 'How to estimate dehydration',
  fluidChoice: lang === 'es' ? 'Fluido y suplementos' : 'Fluid and supplements',
  potassium: lang === 'es' ? 'Potasio y electrolitos' : 'Potassium and electrolytes',
  kConverter: lang === 'es' ? 'Conversor de ampolla KCl' : 'KCl ampoule converter',
  serumK: lang === 'es' ? 'K analítico' : 'Serum K',
  targetBag: lang === 'es' ? 'K final objetivo (total)' : 'Final target K (total)',
  bagVolume: lang === 'es' ? 'Volumen de bolsa' : 'Bag volume',
  ampConcentration: lang === 'es' ? 'Concentración ampolla' : 'Ampoule concentration',
  ampUnit: lang === 'es' ? 'Unidad ampolla' : 'Ampoule unit',
  calculated: lang === 'es' ? 'Calculado' : 'Calculated',
  specialFluids: lang === 'es' ? 'Fluidos especiales' : 'Special fluids',
  sources: lang === 'es' ? 'Referencias' : 'References',
  note:
    lang === 'es'
      ? 'Herramienta orientativa: ajustar por perfusion, electrolitos, diuresis, comorbilidades y respuesta.'
      : 'Guidance tool: adjust by perfusion, electrolytes, urine output, comorbidities, and response.',
});

export default function FluidTherapyToolkit({ lang }: { lang: Language }) {
  const copy = getCopy(lang);
  const es = lang === 'es';
  const instanceId = useId();
  const [activeView, setActiveView] = useState<FluidView>('plan');
  const viewLabels = es ? ['Plan', 'Tipos de fluidos', 'Electrolitos / KCl', 'Seguimiento'] : ['Plan', 'Fluid types', 'Electrolytes / KCl', 'Monitoring'];
  const [speciesKey, setSpeciesKey] = useState<FluidSpeciesKey>('dog');
  const [problemKey, setProblemKey] = useState<FluidProblemKey>('dehydration');
  const activeSpecies = speciesProfiles.find((item) => item.key === speciesKey) ?? speciesProfiles[0];
  const activeProblem = problems.find((item) => item.key === problemKey) ?? problems[0];
  const activeSpecialFluids = specialFluidBySpecies[activeSpecies.key];
  const [weight, setWeight] = useState('');
  const [dehydration, setDehydration] = useState('');
  const [ongoingLoss, setOngoingLoss] = useState('');
  const [isPediatric, setIsPediatric] = useState(false);
  const [serumPotassium, setSerumPotassium] = useState('');
  const [targetPotassium, setTargetPotassium] = useState('');
  const [bagVolume, setBagVolume] = useState('');
  const [ampConcentration, setAmpConcentration] = useState('');
  const [ampUnit, setAmpUnit] = useState<PotassiumAmpUnit>('meqMl');
  const [deficitDuration, setDeficitDuration] = useState('24');
  const [basePotassium, setBasePotassium] = useState('');
  const [pumpRate, setPumpRate] = useState('');
  const [resetVersion, setResetVersion] = useState(0);

  const parsedWeight = Number.parseFloat(weight);
  const parsedDehydration = Number.parseFloat(dehydration);
  const parsedOngoingLoss = Number.parseFloat(ongoingLoss);
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;
  const safeDehydration = Number.isFinite(parsedDehydration) && parsedDehydration >= 0 && parsedDehydration <= 15 ? parsedDehydration : 0;
  const safeOngoingLoss = Number.isFinite(parsedOngoingLoss) && parsedOngoingLoss > 0 ? parsedOngoingLoss : 0;
  const hasWeight = validWeight > 0;
  const planInvalid = (!!weight && !hasWeight) || (!!dehydration && (!Number.isFinite(parsedDehydration) || parsedDehydration < 0 || parsedDehydration > 15)) || (!!ongoingLoss && (!Number.isFinite(parsedOngoingLoss) || parsedOngoingLoss < 0));
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
      hourlyMl: maintenanceMlDay / 24 + deficitMl / Number(deficitDuration) + ongoingMlDay / 24,
      maintenanceMlKgHour: (activeSpecies.maintenanceMlKgDay * maintenanceMultiplier) / 24,
    };
  }, [activeSpecies, isPediatric, safeDehydration, safeOngoingLoss, validWeight, deficitDuration]);
  const hasPlan = hasWeight && !planInvalid && Number.isFinite(calculations.totalMlDay) && Number.isFinite(calculations.hourlyMl);

  const resetPatient = () => {
    setWeight('');
    setDehydration('');
    setOngoingLoss('');
    setIsPediatric(false);
    setProblemKey('dehydration');
    setSerumPotassium(''); setTargetPotassium(''); setBagVolume(''); setAmpConcentration(''); setBasePotassium(''); setPumpRate(''); setAmpUnit('meqMl'); setDeficitDuration('24');
    setResetVersion((version) => version + 1);
  };
  const handleSpeciesChange = (nextSpecies: FluidSpeciesProfile) => {
    if (nextSpecies.key === speciesKey) return;
    setSpeciesKey(nextSpecies.key);
    resetPatient();
  };

  const selectedPotassiumGuide = potassiumSupplementationGuide.find((item) => {
    if (!Number.isFinite(parsedSerumPotassium)) return false;
    if (item.serum === '<2.0') return parsedSerumPotassium < 2;
    if (item.serum === '2.1-2.5') return parsedSerumPotassium >= 2.1 && parsedSerumPotassium <= 2.5;
    if (item.serum === '2.6-3.0') return parsedSerumPotassium >= 2.6 && parsedSerumPotassium <= 3;
    if (item.serum === '3.1-3.5') return parsedSerumPotassium >= 3.1 && parsedSerumPotassium <= 3.5;
    if (item.serum === '>5.0') return parsedSerumPotassium > 5;
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
  const parsedBasePotassium = basePotassium.trim() ? Number(basePotassium) : NaN;
  const parsedPumpRate = pumpRate.trim() ? Number(pumpRate) : NaN;
  const hasPotassiumMix = Number.isFinite(parsedBasePotassium) && parsedBasePotassium >= 0 && Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium >= parsedBasePotassium && Number.isFinite(parsedBagVolume) && parsedBagVolume > 0;
  const invalidKInputs = (basePotassium !== '' && (!Number.isFinite(parsedBasePotassium) || parsedBasePotassium < 0)) || (pumpRate !== '' && (!Number.isFinite(parsedPumpRate) || parsedPumpRate < 0)) || (targetPotassium !== '' && (!Number.isFinite(parsedTargetPotassium) || parsedTargetPotassium < 0)) || (bagVolume !== '' && (!Number.isFinite(parsedBagVolume) || parsedBagVolume <= 0)) || (ampConcentration !== '' && (!Number.isFinite(parsedAmpConcentration) || parsedAmpConcentration <= 0));
  const potassiumMix = calculatePotassiumAdmixture(parsedTargetPotassium, parsedBasePotassium, parsedBagVolume, ampMeqPerMl);
  const targetMeq = potassiumMix?.addedMeq ?? 0;
  const ampMlToAdd = potassiumMix?.ampVolumeMl ?? 0;
  const deliveredKMeqKgHour =
    hasWeight && Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium >= 0 && Number.isFinite(parsedPumpRate) && parsedPumpRate >= 0
      ? (parsedTargetPotassium * (parsedPumpRate / 1000)) / validWeight
      : 0;
  const anesthesiaMinMlHour = hasWeight ? activeSpecies.anesthesiaRateRange[0] * validWeight : 0;
  const anesthesiaMaxMlHour = hasWeight ? activeSpecies.anesthesiaRateRange[1] * validWeight : 0;
  const anesthesiaCalculated =
    anesthesiaMinMlHour > 0
      ? anesthesiaMinMlHour === anesthesiaMaxMlHour
        ? `${roundValue(anesthesiaMinMlHour, 0)} mL/h`
        : `${roundValue(anesthesiaMinMlHour, 0)}-${roundValue(anesthesiaMaxMlHour, 0)} mL/h`
      : '-';

  const formatNumber = (value: number, decimals = 0, suffix = '') =>
    Number.isFinite(value) && value >= 0 ? `${new Intl.NumberFormat(es ? 'es' : 'en', { maximumFractionDigits: decimals }).format(value)}${suffix}` : '—';
  const formatPlan = (value: number, decimals = 0, suffix = '') => hasPlan ? formatNumber(value, decimals, suffix) : '—';

  return (
    <section className="toolkit-utility fluid-toolkit">
      <div className="toolkit-utility-header fluid-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
          <p>{copy.text}</p>
        </div>
        <div className="fluid-summary-note">
          <strong>{activeSpecies.name[lang]}{hasWeight ? ` · ${formatNumber(validWeight, 3, ' kg')}` : ''}{isPediatric ? ` · ${activeSpecies.pediatricLabel[lang]}` : ''}</strong>
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
            aria-pressed={species.key === activeSpecies.key}
            onClick={() => handleSpeciesChange(species)}
          >
            <span>{species.name[lang]}</span>
            <small>{species.group[lang]}</small>
          </button>
        ))}
      </div>
      <p className="fluid-muted">{es ? 'Cambiar de especie vacía los datos del paciente y de KCl. Los campos de déficit y pérdidas vacíos no añaden volumen al plan.' : 'Changing species clears patient and KCl data. Empty deficit and loss fields add no volume to the plan.'}</p>
      <div className="fluid-workspace-tabs" role="tablist" aria-label={es ? 'Secciones de fluidoterapia' : 'Fluid therapy sections'}>{fluidViews.map((view, index) => <button type="button" key={view} role="tab" id={`${instanceId}-${view}-tab`} aria-controls={`${instanceId}-${view}-panel`} aria-selected={activeView === view} tabIndex={activeView === view ? 0 : -1} onClick={() => setActiveView(view)} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? fluidViews.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + fluidViews.length) % fluidViews.length;
        setActiveView(fluidViews[next]); event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
      }}><span className="fluid-tab-number" aria-hidden="true">{index + 1}</span>{viewLabels[index]}</button>)}</div>
      <div className="fluid-tab-panel" id={`${instanceId}-plan-panel`} role="tabpanel" aria-labelledby={`${instanceId}-plan-tab`} hidden={activeView !== 'plan'}>
      <div className="fluid-layout">
        <section className="toolkit-utility-card fluid-input-panel">
          <div className="infusion-block-header">
            <h4>{copy.patient}</h4>
            <p>{activeSpecies.notes[0][lang]}</p>
            <button type="button" className="fluid-text-button" onClick={resetPatient}>{es ? 'Vaciar datos' : 'Clear data'}</button>
          </div>

          <div className="toolkit-utility-form fluid-form">
            <label>
              {copy.weight} (kg)
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                aria-invalid={!!weight && !hasWeight}
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
                aria-invalid={!!dehydration && (!Number.isFinite(parsedDehydration) || parsedDehydration < 0 || parsedDehydration > 15)}
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
              <select value={problemKey} onChange={(event) => { const next = event.target.value as FluidProblemKey; setProblemKey(next); if (next === 'pediatric') setIsPediatric(true); }}>
                {problems.map((problem) => (
                  <option key={problem.key} value={problem.key}>
                    {problem.key === 'pediatric' ? `${copy.pediatric} · ${activeSpecies.pediatricLabel[lang]}` : problem.title[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label>{es ? 'Reponer déficit en' : 'Replace deficit over'}<select value={deficitDuration} onChange={(event) => setDeficitDuration(event.target.value)}><option value="24">24 h</option><option value="12">12 h</option></select></label>
          </div>

          <label className="fluid-toggle">
            <input type="checkbox" checked={isPediatric} onChange={(event) => { setIsPediatric(event.target.checked); if (!event.target.checked && problemKey === 'pediatric') setProblemKey('dehydration'); }} />
            <span>
              {copy.pediatric}: {activeSpecies.pediatricLabel[lang]}
            </span>
          </label>
          {planInvalid && <p className="fluid-alert" role="status">{es ? 'Revisa los datos: peso >0, deshidratación 0–15% y pérdidas ≥0.' : 'Review inputs: weight >0, dehydration 0–15%, and losses ≥0.'}</p>}
        </section>

        <section className="toolkit-utility-card result-card fluid-result-panel">
          <div className="fluid-result-heading"><h4>{es ? 'Composición del plan' : 'Plan composition'}</h4><span>{es ? 'Reposición y mantenimiento' : 'Replacement and maintenance'}</span></div>
          {!hasWeight && <p className="fluid-muted">{es ? 'Introduce el peso para calcular el volumen del paciente.' : 'Enter weight to calculate patient volumes.'}</p>}
          <div className="fluid-result-grid" aria-live="polite">
            <article className="fluid-component-base">
              <span>{copy.maintenanceRate}</span>
              <strong>{formatNumber(calculations.maintenanceMlKgHour, 1)}</strong>
              <small>mL/kg/h</small>
            </article>
            <article className="fluid-component-maintenance">
              <span>{copy.maintenance}</span>
              <strong>{formatPlan(calculations.maintenanceMlDay)}</strong>
              <small>mL/24 h</small>
            </article>
            <article className="fluid-component-deficit">
              <span>{copy.deficit}</span>
              <strong>{formatPlan(calculations.deficitMl / 1000, 2)}</strong>
              <small>L</small>
            </article>
            <article className="fluid-component-losses">
              <span>{copy.losses}</span>
              <strong>{formatPlan(calculations.ongoingMlDay)}</strong>
              <small>mL/24 h</small>
            </article>
            <article className="fluid-result-total">
              <span>{copy.total}</span>
              <strong>{formatPlan(calculations.totalMlDay / 1000, 2)}</strong>
              <small>L</small>
            </article>
          </div>
          {hasPlan && <div className="fluid-volume-bar" role="img" aria-label={`${copy.maintenance} ${formatNumber(calculations.maintenanceMlDay)} mL; ${copy.deficit} ${formatNumber(calculations.deficitMl)} mL; ${copy.losses} ${formatNumber(calculations.ongoingMlDay)} mL`}><span className="fluid-bar-maintenance" style={{ width: `${calculations.maintenanceMlDay / calculations.totalMlDay * 100}%` }} /><span className="fluid-bar-deficit" style={{ width: `${calculations.deficitMl / calculations.totalMlDay * 100}%` }} /><span className="fluid-bar-losses" style={{ width: `${calculations.ongoingMlDay / calculations.totalMlDay * 100}%` }} /></div>}
          <div className="fluid-rate-strip">
            <div>
              <span>{copy.hourly}</span>
              <strong>{formatPlan(calculations.hourlyMl, 1, ' mL/h')}</strong>
            </div>
            <div>
              <span>{copy.bolus}</span>
              <strong>{referenceText(activeSpecies.shockBolusMlKg, lang)}</strong>
            </div>
            <div>
              <span>{copy.anesthesia}</span>
              <strong>{referenceText(activeSpecies.anesthesiaMlKgHour, lang)}</strong>
            </div>
            <div>
              <span>{copy.anesthesiaCalculated}</span>
              <strong>{anesthesiaCalculated}</strong>
            </div>
          </div>
          <p className="fluid-muted">{es ? `Mantenimiento/24 + déficit/${deficitDuration} + pérdidas/24. Al terminar la reposición del déficit, recalcula el ritmo. El total no incluye bolos; contabiliza otros aportes antes de prescribir.` : `Maintenance/24 + deficit/${deficitDuration} + losses/24. Recalculate the rate when deficit replacement ends. Total excludes boluses; count other inputs before prescribing.`}</p>
          {problemKey === 'shock' && <p className="fluid-alert" role="alert">{es ? 'Prioriza restaurar la perfusión y reevaluar cada bolo. Este ritmo de reposición no es una pauta de resucitación.' : 'Restore perfusion first and reassess every bolus. This replacement rate is not a resuscitation regimen.'}</p>}
          {problemKey === 'anesthesia' && <p className="fluid-notice">{es ? 'El total y ritmo inicial corresponden a reposición y mantenimiento. La referencia anestésica se muestra por separado; en perros y gatos presupone función cardíaca y renal normal y requiere ajuste durante el procedimiento.' : 'The total and initial rate represent replacement and maintenance. The anesthesia reference is shown separately; in dogs and cats it assumes normal heart and kidney function and requires adjustment during the procedure.'}</p>}
        </section>
      </div>

      <section className="fluid-decision-grid">
        <details className="fluid-decision-card fluid-disclosure">
          <summary>{copy.dehydrationGuide}</summary>
          <div className="fluid-scale-list">
            {dehydrationGuide.map((item) => (
              <div key={item.range}>
                <strong>{item.range}</strong>
                <span>{item[lang]}</span>
              </div>
            ))}
          </div>
        </details>

        <article className="fluid-decision-card fluid-problem-card">
          <h4>{problemKey === 'pediatric' ? `${copy.pediatric} · ${activeSpecies.pediatricLabel[lang]}` : activeProblem.title[lang]}</h4>
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
          <button type="button" className="fluid-text-button" onClick={() => { setActiveView('guide'); document.getElementById(`${instanceId}-guide-tab`)?.focus(); }}>{es ? 'Consultar tipos de fluidos →' : 'View fluid types →'}</button>
        </article>

        <article className="fluid-decision-card">
          <h4>{lang === 'es' ? 'Notas de especie' : 'Species notes'}</h4>
          <ul className="fluid-note-list">
            <li>
              {lang === 'es' ? 'Rehidratacion estimada: ' : 'Estimated rehydration: '}
              {referenceText(activeSpecies.deficitHours, lang)}
            </li>
            {activeSpecies.notes.map((note) => (
              <li key={note.es}>{note[lang]}</li>
            ))}
          </ul>
        </article>
      </section>
      </div>
      <div className="fluid-tab-panel" id={`${instanceId}-guide-panel`} role="tabpanel" aria-labelledby={`${instanceId}-guide-tab`} hidden={activeView !== 'guide'}><FluidTypeGuide lang={lang} companionSpecies={speciesKey === 'dog' || speciesKey === 'cat'} />
      <details className="fluid-special-fluids">
        <summary><span>{copy.specialFluids}</span><strong>{activeSpecies.name[lang]}</strong></summary>
        <div className="fluid-special-grid">{activeSpecialFluids.map((item) => <article key={item.key}><h4>{item.title[lang]}</h4><strong>{referenceText(item.dose, lang)}</strong><p>{item.use[lang]}</p><small>{item.caution[lang]}</small></article>)}</div>
      </details></div>
      <div className="fluid-tab-panel" id={`${instanceId}-electrolytes-panel`} role="tabpanel" aria-labelledby={`${instanceId}-electrolytes-tab`} hidden={activeView !== 'electrolytes'}>
      <section className="fluid-electrolyte-section">
        <div className="fluid-electrolyte-header">
          <div>
            <p className="section-kicker">{copy.potassium}</p>
            <h4>{copy.kConverter}</h4>
          </div>
          <p>
            {lang === 'es'
              ? 'KCl: 1 mEq = 74,55 mg de KCl o 39,1 mg de K. No administrar en bolo ni superar 0,5 mEq/kg/h.'
              : 'KCl: 1 mEq = 74.55 mg of KCl or 39.1 mg of K. Never bolus or exceed 0.5 mEq/kg/h.'}
          </p>
        </div>

        <div className="fluid-electrolyte-layout">
          <article className="fluid-decision-card fluid-k-converter">
            {!hasWeight && <p className="fluid-notice">{es ? 'Introduce el peso del paciente en Plan para comprobar la dosis de K por kg y hora.' : 'Enter patient weight in Plan to check K dose per kg per hour.'}</p>}
            <div className="toolkit-utility-form fluid-form">
              <label>{es ? 'K del fluido base (mEq/L)' : 'K in base fluid (mEq/L)'}<input type="number" min="0" step="any" value={basePotassium} onChange={(event) => setBasePotassium(event.target.value)} /></label>
              <label>{es ? 'Ritmo real de bomba (mL/h)' : 'Actual pump rate (mL/h)'}<input type="number" min="0" step="any" value={pumpRate} onChange={(event) => setPumpRate(event.target.value)} /></label>
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
            <div className="fluid-k-shortcuts"><button type="button" onClick={() => setBasePotassium('0')}>{es ? 'Base sin K: 0' : 'K-free base: 0'}</button><button type="button" onClick={() => setBasePotassium('4')}>{es ? 'Ringer lactato: 4' : 'Lactated Ringer’s: 4'}</button><button type="button" onClick={() => setBasePotassium('5')}>{es ? 'Base con K: 5' : 'Base containing K: 5'}</button><button type="button" disabled={!hasPlan} onClick={() => setPumpRate(String(roundValue(calculations.hourlyMl, 2)))}>{es ? 'Usar ritmo del plan' : 'Use plan rate'}</button></div>
            <p className="fluid-muted">{es ? 'Confirmar composición del producto. El objetivo es K final total. Cálculo a volumen final: retirar de la bolsa el mismo volumen de fluido base que se añade de ampolla; el cálculo incluye el K retirado. Comprobar preparación y concentración final.' : 'Confirm product composition. Target is total final K. Final-volume calculation: remove the same base-fluid volume as the ampoule volume added; the calculation includes K removed. Verify preparation and final concentration.'}</p>
            <div className="fluid-converter-results">
              <div>
                <span>{lang === 'es' ? 'Equivalencia ampolla' : 'Ampoule equivalent'}</span>
                <strong>{ampMeqPerMl > 0 ? formatNumber(ampMeqPerMl, 2, ' mEq/mL') : '—'}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'K total a añadir' : 'Total K to add'}</span>
                <strong>{potassiumMix ? formatNumber(targetMeq, 2, ' mEq') : '—'}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'Volumen de ampolla' : 'Ampoule volume'}</span>
                <strong>{potassiumMix ? formatNumber(ampMlToAdd, 2, ' mL') : '—'}</strong>
              </div>
              <div>
                <span>{lang === 'es' ? 'Ritmo K estimado' : 'Estimated K rate'}</span>
                <strong>{hasWeight && Number.isFinite(parsedPumpRate) && parsedPumpRate >= 0 && Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium >= 0 ? formatNumber(deliveredKMeqKgHour, 3, ' mEq/kg/h') : '—'}</strong>
              </div>
            </div>
            {invalidKInputs && <p className="fluid-alert" role="status">{es ? 'K y ritmo deben ser ≥0; volumen y concentración de ampolla, mayores que cero.' : 'K and rate must be ≥0; volume and ampoule concentration must be greater than zero.'}</p>}
            {deliveredKMeqKgHour > 0.5 && <p className="fluid-alert" role="alert">{es ? 'La infusión supera 0,5 mEq/kg/h. Revisar concentración y ritmo antes de administrar.' : 'Infusion exceeds 0.5 mEq/kg/h. Review concentration and rate before administration.'}</p>}
            {Number.isFinite(parsedBasePotassium) && Number.isFinite(parsedTargetPotassium) && parsedTargetPotassium < parsedBasePotassium && <p className="fluid-alert" role="status">{es ? 'El K objetivo es menor que el K del fluido base. Añadir KCl no puede reducir la concentración.' : 'Target K is below base-fluid K. Adding KCl cannot reduce concentration.'}</p>}
            {hasPotassiumMix && ampMeqPerMl > 0 && !potassiumMix && <p className="fluid-alert" role="status">{es ? 'No se puede preparar ese objetivo con esta concentración/volumen. Revisa unidades, ampolla y fluido base.' : 'This target cannot be prepared with this concentration/volume. Review units, ampoule, and base fluid.'}</p>}

            {selectedPotassiumGuide ? (
              <p className="fluid-k-recommendation">
                {lang === 'es' ? 'Rango orientativo MSD (confirmar ritmo): ' : 'MSD reference range (verify rate): '}
                <strong>{selectedPotassiumGuide.add}</strong>
              </p>
            ) : null}
          </article>
          <details className="fluid-decision-card fluid-disclosure fluid-k-reference">
            <summary>{lang === 'es' ? 'Tabla orientativa KCl · perros y gatos' : 'KCl guidance table · dogs and cats'}</summary>
            <p className="fluid-muted">{es ? 'Referencia MSD: KCl añadido a 1 L de fluido de mantenimiento. No equivale al objetivo de K final total del conversor. La concentración por litro no fija la dosis/hora: comprueba peso y ritmo real.' : 'MSD reference: KCl added to 1 L of maintenance fluid. This is not the converter’s total final K target. Concentration per liter does not set hourly dose: check weight and actual rate.'}</p>
            <div className="fluid-k-table"><div className="fluid-k-table-header"><strong>{copy.serumK}</strong><span>{es ? 'KCl añadido por litro' : 'KCl added per liter'}</span><p>{es ? 'Notas de uso' : 'Use notes'}</p></div>{potassiumSupplementationGuide.map((item) => <div key={item.serum} className={selectedPotassiumGuide?.serum === item.serum ? 'is-highlighted' : ''}><strong>{item.serum} mEq/L</strong><span>{item.add}</span><p>{item.note[lang]}</p></div>)}</div>
            <footer className="fluid-evidence"><a href="https://www.msdvetmanual.com/multimedia/table/guideline-for-potassium-supplementation-in-dogs-and-cats" target="_blank" rel="noreferrer">MSD · {es ? 'tabla original de KCl' : 'original KCl table'} ↗</a><p>{es ? 'Se conservan los intervalos publicados; si el valor no encaja exactamente, consultar el protocolo clínico.' : 'Published intervals are retained; if a value does not match exactly, consult the clinical protocol.'}</p></footer>
          </details>
          <details className="fluid-decision-card fluid-disclosure">
            <summary>{lang === 'es' ? 'Si no hay ionograma · perros y gatos' : 'If electrolytes are unavailable · dogs and cats'}</summary>
            <p className="fluid-muted">{es ? 'AAHA recomienda elegir la dosis según K sérico. Priorizar medición y diuresis; el diagnóstico por sí solo no determina cuánto KCl añadir.' : 'AAHA recommends choosing the dose by serum K. Prioritize measurement and urine output; diagnosis alone does not determine how much KCl to add.'}</p>
            <div className="fluid-scale-list">
              {potassiumPathologyGuide.map((item) => (
                <div key={item.problem.es}>
                  <strong>{item.problem[lang]}</strong>
                  <span>{item.action[lang]}</span>
                </div>
              ))}
            </div>
          </details>
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
      <footer className="fluid-evidence"><a href={FLUID_SOURCES.illness} target="_blank" rel="noreferrer">AAHA · KCl ↗</a><p>{es ? 'Guía AAHA 2024: K sérico, diuresis y controles dirigen la suplementación.' : 'AAHA 2024 guideline: serum K, urine output, and monitoring guide supplementation.'}</p></footer></div>
      <div className="fluid-tab-panel" id={`${instanceId}-monitor-panel`} role="tabpanel" aria-labelledby={`${instanceId}-monitor-tab`} hidden={activeView !== 'monitor'}><FluidMonitoring key={`${speciesKey}-${resetVersion}`} lang={lang} baselineWeight={validWeight} companionSpecies={speciesKey === 'dog' || speciesKey === 'cat'} /></div>
      <details className="fluid-source-note fluid-disclosure">
        <summary>{copy.sources}</summary>
        <p>{copy.note}</p>
        <div className="vital-source-links">
          {references.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}
