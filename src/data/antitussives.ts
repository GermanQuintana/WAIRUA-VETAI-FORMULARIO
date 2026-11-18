import { DoseCalculatorEntry, LocalizedText } from '../types';

// Checked against both the article and its image-based Table 1 on 2026-11-17.
// Conflicting regimens remain readable, but NaN prevents automatic calculation.
const articleUrl = 'https://todaysveterinarypractice.com/pharmacology/antitussive-medications-for-dogs-and-cats/';
const bibliography = `Bruner & Zhang (2025) — Bruner JM, Zhang L. Antitussive Medications for Dogs and Cats. Today's Veterinary Practice. November/December 2025; published October 6, 2025. Table 1 and accompanying text. ${articleUrl}`;
const localized = (es: string, en: string): LocalizedText => ({ es, en });
const context = localized(
  'Uso antitusivo fuera de ficha técnica, a justificar por tos persistente tras abordar la causa. No suprimir la tos protectora/productiva. Revisión narrativa; evidencia veterinaria limitada. Individualizar y comprobar contraindicaciones e interacciones de la formulación.',
  'Off-label antitussive use, requiring justification for persistent cough after addressing its cause. Do not suppress protective/productive cough. Narrative review; limited veterinary evidence. Individualise and check formulation contraindications and interactions.',
);

interface AntitussiveRegimen {
  id: string;
  ingredient: string;
  englishName: string;
  species: DoseCalculatorEntry['species'];
  group: LocalizedText;
  dose?: [number, number];
  doseText?: string;
  route?: string;
  frequency?: string;
  phase?: LocalizedText;
  notes: LocalizedText;
  conflict?: boolean;
}

const opioid = localized('Antitusivos · opioides', 'Antitussives · opioids');
const neuromodulator = localized('Antitusivos · neuromoduladores', 'Antitussives · neuromodulators');
const reviewPhase = localized('Revisar discrepancia tabla/texto · sin cálculo', 'Review table/text discrepancy · calculation unavailable');
const experimentalPhase = localized('Experimental · eficacia veterinaria no establecida', 'Experimental · veterinary efficacy not established');

const regimens: AntitussiveRegimen[] = [
  {
    id: 'hydrocodone-dog-po', ingredient: 'Hidrocodona', englishName: 'Hydrocodone', species: ['Dog'], group: opioid,
    doseText: '0.25 mg/kg', frequency: 'q6–12h', conflict: true,
    notes: localized('Texto: c6–8h; tabla: c6–12h. Inicio; titular según respuesta sin sedación excesiva ni estreñimiento. Evitar combinaciones con paracetamol en gatos.', 'Text: q6–8h; table: q6–12h. Initial regimen; titrate to response without excessive sedation or constipation. Avoid acetaminophen combinations in cats.'),
  },
  {
    id: 'butorphanol-iv-sc', ingredient: 'Butorfanol', englishName: 'Butorphanol', species: ['Dog', 'Cat'], group: opioid,
    doseText: '0.05–0.1 mg/kg', route: 'IV/SC', frequency: 'PRN', conflict: true,
    notes: localized('Tabla: 0,05–0,1 mg/kg IV/SC según necesidad; texto: 0,005–0,1 mg/kg c6–12h. Confirmar pauta antes de prescribir. Vigilar sedación y estreñimiento.', 'Table: 0.05–0.1 mg/kg IV/SC as needed; text: 0.005–0.1 mg/kg q6–12h. Confirm regimen before prescribing. Monitor sedation and constipation.'),
  },
  {
    id: 'butorphanol-po', ingredient: 'Butorfanol', englishName: 'Butorphanol', species: ['Dog', 'Cat'], group: opioid,
    doseText: '0.55–1.1 mg/kg', frequency: 'q6–12h', conflict: true,
    notes: localized('Tabla: 0,55–1,1 mg/kg VO; texto: 0,5–1 mg/kg VO. Confirmar rango. No se ha demostrado equivalencia de eficacia de formulaciones magistrales; vigilar sedación.', 'Table: 0.55–1.1 mg/kg PO; text: 0.5–1 mg/kg PO. Confirm range. Compounded formulation equivalence is unproven; monitor sedation.'),
  },
  {
    id: 'diphenoxylate-dog-po', ingredient: 'Difenoxilato', englishName: 'Diphenoxylate', species: ['Dog'], group: opioid,
    dose: [0.25, 0.5], frequency: 'q12h', phase: localized('Uso empírico · evidencia baja', 'Empirical use · low evidence'),
    notes: localized('Extrapolación humana, sin eficacia antitusiva veterinaria demostrada. Dosis del difenoxilato, no de la atropina asociada. Riesgo de estreñimiento y efectos digestivos/anticolinérgicos.', 'Human extrapolation, without proven veterinary antitussive efficacy. Dose refers to diphenoxylate, not combined atropine. Constipation and gastrointestinal/anticholinergic effects.'),
  },
  {
    id: 'codeine-po', ingredient: 'Codeína', englishName: 'Codeine', species: ['Dog', 'Cat'], group: opioid,
    dose: [1, 2], frequency: 'q6–12h', phase: localized('Uso desaconsejado por los autores', 'Use discouraged by the authors'),
    notes: localized('Solo monofármaco; excluir combinaciones con paracetamol, especialmente en gatos. Sedación y estreñimiento; potencial de abuso. La tabla no separa dosis por especie.', 'Single ingredient only; exclude acetaminophen combinations, especially in cats. Sedation, constipation and abuse potential. The table does not separate doses by species.'),
  },
  ...(['Dog', 'Cat'] as const).map((species): AntitussiveRegimen => ({
    id: `dextromethorphan-${species.toLowerCase()}-po`, ingredient: 'Dextrometorfano', englishName: 'Dextromethorphan', species: [species],
    group: localized('Antitusivos · antagonistas NMDA', 'Antitussives · NMDA antagonists'),
    dose: species === 'Dog' ? [0.5, 1] : [2, 4], frequency: 'q8–12h',
    phase: localized('Eficacia cuestionada · evidencia baja', 'Questionable efficacy · low evidence'),
    notes: localized('Biodisponibilidad baja y eficacia incierta. Confirmar composición completa del producto antes de usarlo.', 'Poor bioavailability and uncertain efficacy. Verify the complete product composition before use.'),
  })),
  {
    id: 'benzonatate-dog-po', ingredient: 'Benzonatato', englishName: 'Benzonatate', species: ['Dog'],
    group: localized('Antitusivos · periféricos', 'Antitussives · peripheral agents'), dose: [100, 100], frequency: 'q8–12h',
    phase: localized('100 mg/perro · precaución <4,5 kg · contraindicado en gatos', '100 mg/dog · caution <4.5 kg · contraindicated in cats'),
    notes: localized('Dosis fija por animal, NO mg/kg. Sin datos clínicos veterinarios; precaución en perros <4,5 kg. Contraindicado en gatos; toxicidad grave descrita en sobredosis humanas.', 'Fixed dose per animal, NOT mg/kg. No veterinary clinical data; caution in dogs <4.5 kg. Contraindicated in cats; severe toxicity reported with human overdose.'),
  },
  {
    id: 'maropitant-dog-po-cough', ingredient: 'Maropitant', englishName: 'Maropitant', species: ['Dog'],
    group: localized('Antitusivos · antagonistas NK-1', 'Antitussives · NK-1 antagonists'),
    doseText: '2 mg/kg', frequency: 'q24h / q48h', conflict: true,
    notes: localized('Tabla: c24h durante 5 días, después c48h; texto: c48h desde el inicio. Confirmar protocolo. Eficacia antitusiva controvertida; dosis óptima no establecida.', 'Table: q24h for 5 days, then q48h; text: q48h from the start. Confirm protocol. Antitussive efficacy is controversial; optimal dosing is not established.'),
  },
  {
    id: 'gabapentin-po-cough', ingredient: 'Gabapentina', englishName: 'Gabapentin', species: ['Dog', 'Cat'], group: neuromodulator,
    dose: [10, 15], frequency: 'q8h', phase: experimentalPhase,
    notes: localized('Pauta inicial propuesta; uso antitusivo sin validación veterinaria. Titular solo tras revisión clínica; vigilar sedación y efectos neurológicos. No hay dosis óptima establecida.', 'Proposed starting regimen; antitussive use lacks veterinary validation. Titrate only after clinical review; monitor sedation and neurological effects. Optimal dosing is unknown.'),
  },
  {
    id: 'amitriptyline-dog-po-cough', ingredient: 'Amitriptilina', englishName: 'Amitriptyline', species: ['Dog'], group: neuromodulator,
    doseText: '1–2 mg/kg', frequency: 'q24h / q12h', conflict: true,
    notes: localized('Tabla: c24h; texto: c12h. Pauta inicial experimental, sin ensayos veterinarios de validación. Confirmar intervalo; evitar escaladas automáticas y vigilar sedación.', 'Table: q24h; text: q12h. Experimental starting regimen without veterinary validation trials. Confirm interval; avoid automatic escalation and monitor sedation.'),
  },
  {
    id: 'amitriptyline-cat-po-cough', ingredient: 'Amitriptilina', englishName: 'Amitriptyline', species: ['Cat'], group: neuromodulator,
    dose: [0.5, 1], frequency: 'q24h', phase: experimentalPhase,
    notes: localized('Pauta inicial propuesta, sin ensayos veterinarios de validación para tos. Seguridad y titulación requieren valoración individual; vigilar sedación.', 'Proposed starting regimen, without veterinary validation trials for cough. Safety and titration require individual assessment; monitor sedation.'),
  },
  ...([
    ['gefapixant', 'Gefapixant', localized('Antitusivos · antagonistas P2X3', 'Antitussives · P2X3 antagonists')],
    ['naltrindole', 'Naltrindol', localized('Antitusivos · antagonistas δ-opioides', 'Antitussives · δ-opioid antagonists')],
    ['naltriben', 'Naltriben', localized('Antitusivos · antagonistas δ-opioides', 'Antitussives · δ-opioid antagonists')],
  ] as const).map(([id, ingredient, group]): AntitussiveRegimen => ({
    id: `${id}-investigational`, ingredient, englishName: id, species: ['Dog', 'Cat'], group,
    route: '—', phase: localized('En investigación · sin pauta veterinaria establecida', 'Investigational · no established veterinary regimen'),
    notes: localized('Mención documental para perros/gatos; la fuente no establece una pauta clínica veterinaria. No permite calcular dosis ni extrapolar dosis humanas; seguridad y contraindicaciones sin establecer.', 'Documentary mention for dogs/cats; the source establishes no veterinary clinical regimen. No dose calculation or human dose extrapolation; safety and contraindications are not established.'),
  })),
];

export const antitussiveDoseEntries: DoseCalculatorEntry[] = regimens.map((regimen) => {
  const dose = regimen.conflict ? undefined : regimen.dose;
  return {
    id: `tvp-2025-${regimen.id}`,
    activeIngredient: regimen.ingredient,
    category: localized('Respiratorio', 'Respiratory'),
    subcategory: regimen.group,
    species: regimen.species,
    route: regimen.route ?? 'VO',
    indication: localized('Tos persistente · uso antitusivo', 'Persistent cough · antitussive use'),
    doseRangeMgKg: { min: dose?.[0] ?? Number.NaN, max: dose?.[1] ?? Number.NaN },
    defaultDoseMgKg: dose?.[0] ?? Number.NaN,
    doseText: regimen.doseText,
    doseUnit: !regimen.dose && !regimen.doseText ? '—' : regimen.ingredient === 'Benzonatato' ? 'mg' : 'mg/kg',
    frequency: regimen.frequency,
    dosePhase: regimen.conflict ? reviewPhase : regimen.phase,
    clinicalNotes: localized(`${regimen.notes.es} ${context.es}`, `${regimen.englishName}. ${regimen.notes.en} ${context.en}`),
    bibliography,
    concentration: localized('Confirmar formulación y concentración', 'Verify formulation and concentration'),
  };
});
