import { LocalizedText, Species } from '../types';

export type GeneticsRiskTone = 'red' | 'amber' | 'yellow' | 'green' | 'blue';

export interface BreedMdr1Profile {
  breed: string;
  species: Species;
  aliases?: string[];
  prevalence: LocalizedText;
  summary: LocalizedText;
  recommendation: LocalizedText;
  tone: GeneticsRiskTone;
}

export interface Mdr1MedicationGuidance {
  activeIngredient: string;
  signal: 'contraindicated' | 'avoid' | 'caution';
  category: LocalizedText;
  evidence: LocalizedText;
  recommendation: LocalizedText;
  notes: LocalizedText;
}

export interface MetabolismAlert {
  id: string;
  title: string;
  species: Species;
  breeds: string[];
  pathway: LocalizedText;
  risk: LocalizedText;
  examples: string[];
  recommendation: LocalizedText;
  tone: GeneticsRiskTone;
}

export const mdr1BreedProfiles: BreedMdr1Profile[] = [
  {
    breed: 'Collie de pelo largo',
    aliases: ['Rough Collie', 'Collie'],
    species: 'Dog',
    prevalence: { es: 'Alta frecuencia descrita', en: 'High reported prevalence' },
    summary: {
      es: 'Raza de referencia para mutacion ABCB1/MDR1. Si el estatus genetico es desconocido, asume riesgo hasta demostrar lo contrario.',
      en: 'Reference breed for the ABCB1/MDR1 mutation. If genetic status is unknown, assume risk until proven otherwise.',
    },
    recommendation: {
      es: 'Priorizar test genetico si va a recibir lactonas macrociclicas a dosis altas, loperamida o quimioterapia sensible a P-gp.',
      en: 'Prioritize genetic testing before high-dose macrocyclic lactones, loperamide, or P-gp-sensitive chemotherapy.',
    },
    tone: 'red',
  },
  {
    breed: 'Collie de pelo corto',
    aliases: ['Smooth Collie'],
    species: 'Dog',
    prevalence: { es: 'Alta frecuencia descrita', en: 'High reported prevalence' },
    summary: {
      es: 'Se maneja con la misma cautela practica que el collie de pelo largo ante farmacos sustrato de P-gp.',
      en: 'Handled with the same practical caution as the rough collie for P-gp substrate drugs.',
    },
    recommendation: {
      es: 'Evitar extrapolar seguridad solo por ausencia de antecedentes clinicos. Confirmar genotipo cuando sea posible.',
      en: 'Do not infer safety just because there is no known previous reaction. Confirm genotype whenever possible.',
    },
    tone: 'red',
  },
  {
    breed: 'Pastor australiano',
    aliases: ['Australian Shepherd'],
    species: 'Dog',
    prevalence: { es: 'Frecuencia relevante descrita', en: 'Meaningful reported prevalence' },
    summary: {
      es: 'Riesgo bien reconocido de mutacion MDR1. La sensibilidad clinica puede ser marcada con loperamida o ivermectina a dosis no preventivas.',
      en: 'Well-recognized MDR1 mutation risk. Clinical sensitivity can be marked with loperamide or non-preventive ivermectin doses.',
    },
    recommendation: {
      es: 'En pacientes sin test, usar alternativas cuando existan y monitorizar mas de cerca sedantes y citotoxicos sustrato.',
      en: 'Use alternatives when available in untested dogs and monitor substrate sedatives and cytotoxics more closely.',
    },
    tone: 'red',
  },
  {
    breed: 'Mini American Shepherd',
    aliases: ['Miniature American Shepherd', 'Mini Aussie'],
    species: 'Dog',
    prevalence: { es: 'Frecuencia relevante descrita', en: 'Meaningful reported prevalence' },
    summary: {
      es: 'Comparte la misma preocupacion practica que el pastor australiano para mutacion ABCB1.',
      en: 'Shares the same practical concern as the Australian Shepherd for ABCB1 mutation.',
    },
    recommendation: {
      es: 'No asumir que el tamaño pequeño reduce el riesgo. Seleccionar farmacos y dosis con el mismo nivel de prudencia.',
      en: 'Do not assume smaller size reduces the risk. Choose drugs and doses with the same level of caution.',
    },
    tone: 'red',
  },
  {
    breed: 'Shetland Sheepdog',
    aliases: ['Sheltie', 'Pastor de Shetland'],
    species: 'Dog',
    prevalence: { es: 'Frecuencia relevante descrita', en: 'Meaningful reported prevalence' },
    summary: {
      es: 'Otra raza de pastoreo con asociacion firme a MDR1. El riesgo es suficiente para cambiar conducta prescriptora.',
      en: 'Another herding breed with a strong MDR1 association. The risk is high enough to change prescribing behavior.',
    },
    recommendation: {
      es: 'Si no hay genotipo, tratar como susceptible cuando se planteen sustratos claros de P-gp.',
      en: 'If genotype is unknown, treat as susceptible when clear P-gp substrates are considered.',
    },
    tone: 'red',
  },
  {
    breed: 'Bobtail',
    aliases: ['Old English Sheepdog'],
    species: 'Dog',
    prevalence: { es: 'Frecuencia intermedia descrita', en: 'Intermediate reported prevalence' },
    summary: {
      es: 'La mutacion se ha descrito en la raza y obliga a preguntar por test si el plan terapeutico incluye farmacos de riesgo.',
      en: 'The mutation has been reported in the breed and warrants checking test status before higher-risk drugs.',
    },
    recommendation: {
      es: 'Mantener prudencia con loperamida, quimioterapia sustrato y lactonas macrociclicas fuera de uso preventivo habitual.',
      en: 'Stay cautious with loperamide, substrate chemotherapy, and macrocyclic lactones outside routine preventive use.',
    },
    tone: 'amber',
  },
  {
    breed: 'Pastor blanco suizo',
    aliases: ['White Swiss Shepherd', 'Berger Blanc Suisse'],
    species: 'Dog',
    prevalence: { es: 'Frecuencia intermedia descrita', en: 'Intermediate reported prevalence' },
    summary: {
      es: 'Puede compartir riesgo ABCB1 con otras lineas de pastoreo. Preguntar por test y antecedentes familiares ayuda mucho.',
      en: 'May share ABCB1 risk with other herding lines. Asking for test status and family history is helpful.',
    },
    recommendation: {
      es: 'Planificar alternativas si se necesitan sustratos fuertes de P-gp y no hay resultado genetico disponible.',
      en: 'Plan alternatives when strong P-gp substrates are needed and no genetic result is available.',
    },
    tone: 'amber',
  },
  {
    breed: 'Silken Windhound',
    aliases: ['Long-haired Whippet', 'Whippet de pelo largo'],
    species: 'Dog',
    prevalence: { es: 'Casos y lineas descritas', en: 'Reported cases and lines' },
    summary: {
      es: 'No es una raza de pastoreo, pero se ha descrito mutacion en determinadas lineas. Conviene no pasarla por alto.',
      en: 'Not a herding breed, yet the mutation has been described in some lines. It should not be overlooked.',
    },
    recommendation: {
      es: 'Si hay duda, preguntar por test antes de usar loperamida o avermectinas a dosis altas.',
      en: 'If uncertain, ask for test status before loperamide or high-dose avermectins.',
    },
    tone: 'yellow',
  },
  {
    breed: 'Border Collie',
    species: 'Dog',
    prevalence: { es: 'Lineas descritas', en: 'Reported lines' },
    summary: {
      es: 'No es la raza con mayor frecuencia, pero la mutacion existe y conviene tenerla presente si el paciente no esta testado.',
      en: 'Not the highest-frequency breed, but the mutation exists and should stay on the radar in untested dogs.',
    },
    recommendation: {
      es: 'Mantener cautela con sustratos claros de P-gp y preguntar por antecedentes de linea o test.',
      en: 'Stay cautious with clear P-gp substrates and ask for line history or test status.',
    },
    tone: 'yellow',
  },
  {
    breed: 'McNab',
    species: 'Dog',
    prevalence: { es: 'Frecuencia relevante descrita', en: 'Meaningful reported prevalence' },
    summary: {
      es: 'Puede pasar desapercibido fuera de ciertos entornos de trabajo, pero comparte el mismo problema farmacogenetico.',
      en: 'It can be overlooked outside some working-dog circles, yet it shares the same pharmacogenetic issue.',
    },
    recommendation: {
      es: 'No banalizar su riesgo por menor popularidad de la raza.',
      en: 'Do not downplay its risk just because the breed is less common.',
    },
    tone: 'amber',
  },
  {
    breed: 'Waller',
    aliases: ['Wäller'],
    species: 'Dog',
    prevalence: { es: 'Lineas descritas', en: 'Reported lines' },
    summary: {
      es: 'Se han descrito lineas afectadas y la recomendacion practica es similar a otras razas de pastoreo susceptibles.',
      en: 'Affected lines have been described and the practical recommendation mirrors other susceptible herding breeds.',
    },
    recommendation: {
      es: 'Si el estatus es desconocido, actuar con prudencia con avermectinas, loperamida y citotoxicos sensibles.',
      en: 'If status is unknown, stay conservative with avermectins, loperamide, and sensitive cytotoxics.',
    },
    tone: 'amber',
  },
  {
    breed: 'English Shepherd',
    species: 'Dog',
    prevalence: { es: 'Casos y familias descritas', en: 'Reported cases and families' },
    summary: {
      es: 'Otra raza de pastoreo en la que conviene no asumir normalidad farmacologica si no hay test.',
      en: 'Another herding breed where normal drug handling should not be assumed without testing.',
    },
    recommendation: {
      es: 'Especial cuidado si el paciente recibe varios sustratos de P-gp al mismo tiempo.',
      en: 'Use extra care when the dog is receiving several P-gp substrates at once.',
    },
    tone: 'amber',
  },
  {
    breed: 'Pastor aleman',
    aliases: ['German Shepherd'],
    species: 'Dog',
    prevalence: { es: 'Baja pero descrita', en: 'Low but reported' },
    summary: {
      es: 'No es una alerta de rutina como en collie o aussie, pero hay lineas con mutacion y no conviene excluirla por completo.',
      en: 'Not a routine alert like collies or aussies, but some lines carry the mutation and it should not be fully excluded.',
    },
    recommendation: {
      es: 'Considerarlo si aparecen reacciones inesperadas o si el pedigree sugiere cruce con razas de pastoreo de riesgo.',
      en: 'Consider it when reactions are unexpected or the pedigree suggests crossing with higher-risk herding lines.',
    },
    tone: 'yellow',
  },
];

export const mdr1MedicationGuidance: Mdr1MedicationGuidance[] = [
  {
    activeIngredient: 'Ivermectina',
    signal: 'contraindicated',
    category: { es: 'No usar sin conocer genotipo en dosis altas o extra-label', en: 'Do not use without genotype in high-dose or extra-label settings' },
    evidence: { es: 'Evidencia alta', en: 'High evidence' },
    recommendation: {
      es: 'Evitar en pacientes con riesgo MDR1 cuando se planteen dosis superiores a las preventivas habituales.',
      en: 'Avoid in at-risk MDR1 patients when doses exceed routine preventive use.',
    },
    notes: {
      es: 'Mayor preocupacion en protocolos neurologicos, dermatologicos o antiparasitarios intensivos.',
      en: 'Greatest concern in neurologic, dermatologic, or intensive antiparasitic protocols.',
    },
  },
  {
    activeIngredient: 'Loperamida',
    signal: 'contraindicated',
    category: { es: 'No usar', en: 'Do not use' },
    evidence: { es: 'Evidencia alta', en: 'High evidence' },
    recommendation: {
      es: 'Evitar por alto riesgo de neurotoxicidad y depresión del SNC en perros predispuestos.',
      en: 'Avoid because of high risk of neurotoxicity and CNS depression in predisposed dogs.',
    },
    notes: {
      es: 'Es una de las alertas mas utiles para anamnesis rapida en razas de pastoreo.',
      en: 'One of the most useful alerts for quick anamnesis in herding breeds.',
    },
  },
  {
    activeIngredient: 'Doramectina / moxidectina',
    signal: 'avoid',
    category: { es: 'Evitar si es posible', en: 'Avoid if possible' },
    evidence: { es: 'Evidencia moderada-alta', en: 'Moderate-to-high evidence' },
    recommendation: {
      es: 'Valorar alternativas o ajustar de forma muy conservadora si se sale del uso preventivo estandar.',
      en: 'Consider alternatives or dose very conservatively outside standard preventive use.',
    },
    notes: {
      es: 'El contexto de dosis y formulacion importa. El riesgo sube con exposiciones intensivas.',
      en: 'Dose and formulation context matter. Risk rises with intensive exposures.',
    },
  },
  {
    activeIngredient: 'Milbemicina / selamectina',
    signal: 'caution',
    category: { es: 'Precaucion segun dosis y contexto', en: 'Use caution depending on dose and context' },
    evidence: { es: 'Evidencia contextual', en: 'Contextual evidence' },
    recommendation: {
      es: 'El riesgo no es equivalente al de ivermectina a dosis altas, pero conviene no extrapolar alegremente si el plan cambia de dosis o indicacion.',
      en: 'Risk is not equivalent to high-dose ivermectin, but dosing or indication changes should still be approached carefully.',
    },
    notes: {
      es: 'Diferenciar profilaxis rutinaria de usos intensivos o fuera de ficha.',
      en: 'Differentiate routine prophylaxis from intensive or extra-label use.',
    },
  },
  {
    activeIngredient: 'Vincristina / vinblastina / doxorrubicina',
    signal: 'avoid',
    category: { es: 'Evitar si es posible', en: 'Avoid if possible' },
    evidence: { es: 'Evidencia moderada', en: 'Moderate evidence' },
    recommendation: {
      es: 'Si se usan, hacerlo con plan oncologico y monitorizacion estrecha de toxicidad.',
      en: 'If used, do so within a monitored oncology plan with close toxicity surveillance.',
    },
    notes: {
      es: 'El problema principal es la mayor exposicion sistémica por alteracion de transporte.',
      en: 'The main issue is higher systemic exposure due to altered transport.',
    },
  },
  {
    activeIngredient: 'Vinorelbina / paclitaxel',
    signal: 'avoid',
    category: { es: 'Evitar si es posible', en: 'Avoid if possible' },
    evidence: { es: 'Evidencia moderada', en: 'Moderate evidence' },
    recommendation: {
      es: 'Si el caso oncologico obliga, usar solo con plan experto y monitorizacion muy estrecha.',
      en: 'If the oncology case requires it, use only within an expert plan and very close monitoring.',
    },
    notes: {
      es: 'El problema esperado es mayor exposicion y toxicidad acumulada.',
      en: 'Expected issue is increased exposure and cumulative toxicity.',
    },
  },
  {
    activeIngredient: 'Acepromacina',
    signal: 'caution',
    category: { es: 'Precaucion y posible mayor efecto', en: 'Use caution and expect possible enhanced effect' },
    evidence: { es: 'Evidencia moderada', en: 'Moderate evidence' },
    recommendation: {
      es: 'Empezar mas bajo y titular efecto si la raza o el genotipo sugieren susceptibilidad.',
      en: 'Start lower and titrate to effect when breed or genotype suggests susceptibility.',
    },
    notes: {
      es: 'El cambio esperado suele ser mas de intensidad/duracion que de tipo de efecto.',
      en: 'The expected change is usually intensity or duration rather than a different effect.',
    },
  },
  {
    activeIngredient: 'Butorfanol',
    signal: 'caution',
    category: { es: 'Precaucion', en: 'Use caution' },
    evidence: { es: 'Evidencia moderada', en: 'Moderate evidence' },
    recommendation: {
      es: 'Vigilar sedacion y recuperacion, sobre todo si se combina con otros depresores del SNC.',
      en: 'Monitor sedation and recovery, especially when combined with other CNS depressants.',
    },
    notes: {
      es: 'Suele ser un ajuste de vigilancia y dosis, no siempre una contraindicación absoluta.',
      en: 'Usually a monitoring and dose-adjustment issue, not always an absolute contraindication.',
    },
  },
  {
    activeIngredient: 'Morfina / metadona',
    signal: 'caution',
    category: { es: 'Precaucion', en: 'Use caution' },
    evidence: { es: 'Evidencia moderada-baja', en: 'Moderate-to-low evidence' },
    recommendation: {
      es: 'Vigilar sedacion y recuperacion, sobre todo en combinaciones anestesicas ricas en depresores del SNC.',
      en: 'Monitor sedation and recovery, especially in anesthesia plans rich in CNS depressants.',
    },
    notes: {
      es: 'Suele ser una alerta de monitorizacion mas que de prohibicion.',
      en: 'Usually more of a monitoring alert than a prohibition.',
    },
  },
  {
    activeIngredient: 'Maropitant / ondansetron',
    signal: 'caution',
    category: { es: 'Precaucion', en: 'Use caution' },
    evidence: { es: 'Evidencia emergente o contextual', en: 'Emerging or contextual evidence' },
    recommendation: {
      es: 'No asumir problema universal, pero revisar plan completo si el paciente es muy sensible o polimedicado.',
      en: 'Do not assume universal toxicity, but review the full plan in very sensitive or heavily medicated patients.',
    },
    notes: {
      es: 'Conviene dejar claro que la evidencia es menor que para loperamida o avermectinas.',
      en: 'Important to state that the evidence is weaker than for loperamide or avermectins.',
    },
  },
  {
    activeIngredient: 'Apomorfina',
    signal: 'caution',
    category: { es: 'Precaucion', en: 'Use caution' },
    evidence: { es: 'Evidencia contextual', en: 'Contextual evidence' },
    recommendation: {
      es: 'Usar con contexto clinico claro y vigilar respuesta exagerada o efectos neurologicos inesperados.',
      en: 'Use with a clear clinical rationale and monitor for exaggerated response or unexpected neurologic effects.',
    },
    notes: {
      es: 'Interesa sobre todo en razas de alto riesgo MDR1 sin test genetico conocido.',
      en: 'Most relevant in high-risk MDR1 breeds without known genetic status.',
    },
  },
];

export const metabolismAlerts: MetabolismAlert[] = [
  {
    id: 'cats-glucuronidation',
    title: 'Glucuronidacion limitada en gato',
    species: 'Cat',
    breeds: ['Todas las razas felinas'],
    pathway: {
      es: 'Conjugacion hepatica limitada para determinados compuestos',
      en: 'Limited hepatic conjugation for selected compounds',
    },
    risk: {
      es: 'Mayor riesgo de toxicidad con farmacos que dependen mucho de esa via.',
      en: 'Higher toxicity risk with drugs that rely heavily on that pathway.',
    },
    examples: ['Paracetamol', 'Aspirina', 'Diazepam (uso repetido)', 'Permetrinas'],
    recommendation: {
      es: 'Evitar los no seguros para gato y extremar ajuste de dosis e intervalo cuando la especie cambie el aclaramiento esperado.',
      en: 'Avoid non-safe feline drugs and be very conservative with dose and interval when species changes expected clearance.',
    },
    tone: 'red',
  },
  {
    id: 'sighthound-oxidative',
    title: 'Lebreles y metabolismo oxidativo de anestesicos',
    species: 'Dog',
    breeds: ['Greyhound', 'Galgo', 'Whippet', 'Saluki', 'Borzoi'],
    pathway: {
      es: 'Aclaramiento mas lento para algunos anestesicos y lipofilia corporal particular',
      en: 'Slower clearance for some anesthetics with specific body-fat distribution',
    },
    risk: {
      es: 'Recuperaciones mas largas o concentraciones mantenidas si se extrapolan protocolos generales sin ajuste.',
      en: 'Longer recoveries or sustained concentrations when generic protocols are extrapolated without adjustment.',
    },
    examples: ['Thiobarbituricos', 'Propofol', 'Diazepam'],
    recommendation: {
      es: 'Usar dosis tituladas a efecto y vigilar recuperacion con un plan anestesico adaptado al tipo de lebrel.',
      en: 'Titrate to effect and monitor recovery with an anesthetic plan adapted to the sighthound type.',
    },
    tone: 'amber',
  },
  {
    id: 'herding-pgp',
    title: 'Razas de pastoreo y transporte P-gp',
    species: 'Dog',
    breeds: ['Collie', 'Pastor australiano', 'Shetland Sheepdog', 'Bobtail'],
    pathway: {
      es: 'Alteracion de transporte ABCB1/P-glicoproteina',
      en: 'ABCB1/P-glycoprotein transport alteration',
    },
    risk: {
      es: 'Mayor paso al SNC o menor extrusion de determinados sustratos.',
      en: 'Greater CNS penetration or reduced efflux of selected substrates.',
    },
    examples: ['Ivermectina', 'Loperamida', 'Vincristina', 'Acepromacina'],
    recommendation: {
      es: 'Pensar en el transportador como parte del metabolismo clinico cuando se valora seguridad.',
      en: 'Treat the transporter as part of the clinical drug-handling picture when evaluating safety.',
    },
    tone: 'red',
  },
  {
    id: 'cyclo-keto',
    title: 'Ciclosporina y bloqueo CYP3A por azoles',
    species: 'Dog',
    breeds: ['Todas las razas caninas'],
    pathway: {
      es: 'Inhibicion metabolica CYP3A / P-gp',
      en: 'CYP3A / P-gp metabolic inhibition',
    },
    risk: {
      es: 'Aumento de exposicion de ciclosporina, a veces buscado como ahorro de dosis, pero no inocuo.',
      en: 'Higher cyclosporine exposure, sometimes intentionally used for dose sparing, but not risk-free.',
    },
    examples: ['Ciclosporina + ketoconazol', 'Ciclosporina + itraconazol'],
    recommendation: {
      es: 'Solo usar con plan explicito de monitorizacion clinica y analitica.',
      en: 'Use only with an explicit clinical and laboratory monitoring plan.',
    },
    tone: 'amber',
  },
  {
    id: 'doberman-cyp',
    title: 'Doberman y variabilidad metabolica con antiepilepticos',
    species: 'Dog',
    breeds: ['Doberman'],
    pathway: {
      es: 'Variabilidad individual marcada en biotransformacion hepatica',
      en: 'Marked individual variability in hepatic biotransformation',
    },
    risk: {
      es: 'La respuesta a fenobarbital u otros farmacos con aclaramiento hepatico puede ser menos predecible.',
      en: 'Response to phenobarbital and other hepatically cleared drugs can be less predictable.',
    },
    examples: ['Fenobarbital', 'Diazepam', 'Lidocaina'],
    recommendation: {
      es: 'Titular con controles clinicos y analiticos, evitando dar por hecho que el comportamiento farmacocinetico sera promedio.',
      en: 'Titrate with clinical and laboratory checks rather than assuming average pharmacokinetics.',
    },
    tone: 'yellow',
  },
  {
    id: 'brachy-opioids',
    title: 'Braquicefalos y aclaramiento/efecto de sedantes',
    species: 'Dog',
    breeds: ['Bulldog frances', 'Bulldog ingles', 'Pug', 'Boston Terrier'],
    pathway: {
      es: 'No es solo metabolismo: via aerea, sedacion y eliminacion funcional condicionan mucho el riesgo clinico',
      en: 'Not metabolism alone: airway, sedation depth, and functional elimination strongly shape clinical risk',
    },
    risk: {
      es: 'Mayor margen estrecho con opioides, acepromacina o combinaciones sedantes si no se titulan a efecto.',
      en: 'Narrower safety margin with opioids, acepromazine, or sedative combinations if not titrated to effect.',
    },
    examples: ['Acepromacina', 'Butorfanol', 'Metadona', 'Dexmedetomidina'],
    recommendation: {
      es: 'Usar la genetica/raza como aviso de prudencia anestesica: dosis mas finas, mejor recuperacion y mas vigilancia.',
      en: 'Use breed background as an anesthesia caution flag: finer dosing, cleaner recovery, and closer monitoring.',
    },
    tone: 'amber',
  },
  {
    id: 'cats-renal-excretion',
    title: 'Gato y farmacos de eliminacion renal estrecha',
    species: 'Cat',
    breeds: ['Todas las razas felinas'],
    pathway: {
      es: 'Eliminacion renal y margen de seguridad mas estrecho en pacientes con nefropatia oculta o edad avanzada',
      en: 'Renal elimination with a narrower safety margin in cats with occult kidney disease or older age',
    },
    risk: {
      es: 'Pequenos cambios de filtracion o hidratacion pueden disparar acumulacion clinica.',
      en: 'Small filtration or hydration changes can trigger clinically relevant accumulation.',
    },
    examples: ['Gabapentina', 'Levetiracetam', 'Amoxicilina'],
    recommendation: {
      es: 'Pensar siempre en ajuste de intervalo, creatinina/SDMA y estado de hidratacion antes de extrapolar dosis caninas.',
      en: 'Always consider interval adjustment, renal markers, and hydration before extrapolating from canine dosing.',
    },
    tone: 'amber',
  },
];
