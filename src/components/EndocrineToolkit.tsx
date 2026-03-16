import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type EndocrineSpecies = 'dog' | 'cat' | 'ferret';
type EndocrineSystem = 'adrenal' | 'thyroid' | 'pancreas' | 'reproderm';
type HelperProtocolKey = 'dogLddst' | 'catLddst' | 'dogActhDiagnosis' | 'dogActhMonitoring';

interface LocalizedText {
  es: string;
  en: string;
}

interface ProtocolStep {
  time: string;
  action: LocalizedText;
}

interface SourceLink {
  label: string;
  url: string;
}

interface EndocrineProtocol {
  id: string;
  species: EndocrineSpecies;
  system: EndocrineSystem;
  disease: LocalizedText;
  test: LocalizedText;
  summary: LocalizedText;
  whenToUse: LocalizedText;
  prep: LocalizedText;
  steps: ProtocolStep[];
  followUp: LocalizedText;
  pearls: LocalizedText[];
  sources: SourceLink[];
}

interface HelperProtocol {
  id: HelperProtocolKey;
  species: EndocrineSpecies;
  label: LocalizedText;
  dosePerKg: number;
  doseUnit: 'mg' | 'mcg';
  concentrationUnit: 'mg/mL' | 'mcg/mL';
  capDose?: number;
  note: LocalizedText;
}

const SPECIES_LABELS: Record<EndocrineSpecies, LocalizedText> = {
  dog: { es: 'Perro', en: 'Dog' },
  cat: { es: 'Gato', en: 'Cat' },
  ferret: { es: 'Huron', en: 'Ferret' },
};

const SYSTEM_LABELS: Record<EndocrineSystem, LocalizedText> = {
  adrenal: { es: 'Adrenal', en: 'Adrenal' },
  thyroid: { es: 'Tiroides', en: 'Thyroid' },
  pancreas: { es: 'Pancreas', en: 'Pancreas' },
  reproderm: { es: 'Hormonas sexuales / piel', en: 'Sex hormones / skin' },
};

const SOURCES = {
  aahaEndocrine: 'https://www.aaha.org/resources/2023-aaha-selected-endocrinopathies-of-dogs-and-cats-guidelines/',
  aahaEndocrinePdf:
    'https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/2023-aaha-selected-endocrinopathies-of-dogs-and-cats-guidelines/resources/aaha-selected-endocrinopathies-of-dogs-and-cats-guidelines.pdf',
  aahaDiabetes: 'https://www.aaha.org/resources/2018-aaha-diabetes-management-guideline-for-dogs-and-cats/',
  aahaGlucoseCurves: 'https://www.aaha.org/resources/2018-aaha-diabetes-management-guideline-for-dogs-and-cats/interpreting-glucose-curves/',
  merckCushing: 'https://www.merckvetmanual.com/endocrine-system/the-adrenal-glands/cushing-syndrome-hyperadrenocorticism-in-animals',
  merckHypothyroidism: 'https://www.merckvetmanual.com/endocrine-system/the-thyroid-gland/hypothyroidism-in-animals',
  merckHyperthyroidism: 'https://www.merckvetmanual.com/endocrine-system/the-thyroid-gland/hyperthyroidism-in-animals',
  merckDiabetes: 'https://www.merckvetmanual.com/endocrine-system/the-pancreas/diabetes-mellitus-in-dogs-and-cats',
  merckPheo: 'https://www.merckvetmanual.com/endocrine-system/neuroendocrine-tumors/pheochromocytomas-in-animals',
  merckAcromegaly: 'https://www.merckvetmanual.com/endocrine-system/the-pituitary-gland/acromegaly-in-animals',
  merckFerretHormones: 'https://www.merckvetmanual.com/all-other-pets/ferrets/hormonal-disorders-of-ferrets',
  merckAlopecia: 'https://www.merckvetmanual.com/dog-owners/skin-disorders-of-dogs/hair-loss-alopecia-in-dogs',
  pubmedAlopeciaX: 'https://pubmed.ncbi.nlm.nih.gov/12662266/',
  pubmedAdrenalSexHormones: 'https://pubmed.ncbi.nlm.nih.gov/15742696/',
};

const HELPER_PROTOCOLS: HelperProtocol[] = [
  {
    id: 'dogLddst',
    species: 'dog',
    label: { es: 'LDDST perro', en: 'Dog LDDST' },
    dosePerKg: 0.01,
    doseUnit: 'mg',
    concentrationUnit: 'mg/mL',
    note: {
      es: 'Dexametasona IV para cribado de Cushing. Muestras de cortisol en T0, T4 h y T8 h.',
      en: 'IV dexamethasone for Cushing screening. Cortisol samples at T0, T4 h, and T8 h.',
    },
  },
  {
    id: 'catLddst',
    species: 'cat',
    label: { es: 'LDDST gato', en: 'Cat LDDST' },
    dosePerKg: 0.1,
    doseUnit: 'mg',
    concentrationUnit: 'mg/mL',
    note: {
      es: 'Dexametasona IV para HAC felino. Muestras de cortisol en T0, T4 h y T8 h.',
      en: 'IV dexamethasone for feline hypercortisolism. Cortisol samples at T0, T4 h, and T8 h.',
    },
  },
  {
    id: 'dogActhDiagnosis',
    species: 'dog',
    label: { es: 'ACTH/cosintropina perro (diagnostico)', en: 'Dog ACTH/cosyntropin (diagnostic)' },
    dosePerKg: 5,
    doseUnit: 'mcg',
    concentrationUnit: 'mcg/mL',
    capDose: 250,
    note: {
      es: 'ACTH stim para Addison: cortisol basal, cosintropina IM/IV, segunda muestra a 1 hora.',
      en: 'ACTH stimulation for Addison: baseline cortisol, IM/IV cosyntropin, second sample at 1 hour.',
    },
  },
  {
    id: 'dogActhMonitoring',
    species: 'dog',
    label: { es: 'ACTH/cosintropina perro (monitor trilostano)', en: 'Dog ACTH/cosyntropin (trilostane monitoring)' },
    dosePerKg: 1,
    doseUnit: 'mcg',
    concentrationUnit: 'mcg/mL',
    note: {
      es: 'ACTH stim de monitorizacion: realizar 3-5 h tras trilostano y mantener la misma ventana entre visitas.',
      en: 'Monitoring ACTH stimulation: perform 3-5 h after trilostane and keep the same window between visits.',
    },
  },
];

const PROTOCOLS: EndocrineProtocol[] = [
  {
    id: 'dog-cushing-lddst',
    species: 'dog',
    system: 'adrenal',
    disease: { es: 'Cushing canino', en: 'Canine Cushing syndrome' },
    test: { es: 'LDDST (prueba de supresion con dexametasona a baja dosis)', en: 'LDDST (low-dose dexamethasone suppression test)' },
    summary: {
      es: 'Prueba de cribado de eleccion cuando el perro encaja clinicamente y no esta descompensado por otra enfermedad importante.',
      en: 'Preferred screening test when the dog fits the syndrome clinically and is not destabilized by another major illness.',
    },
    whenToUse: {
      es: 'Perros con PU/PD, abdomen pendular, panting, alopecia simetrica, debilidad muscular o ALP alta compatible. Evita interpretar aislado en estres o diabetes mal controlada.',
      en: 'Dogs with PU/PD, pot belly, panting, symmetric alopecia, muscle wasting, or compatible ALP increase. Avoid isolated interpretation in stress or poorly controlled diabetes.',
    },
    prep: {
      es: 'Idealmente estabiliza comorbilidades antes. Via IV. Mantener al paciente tranquilo durante la prueba.',
      en: 'Ideally stabilize comorbidities first. IV test. Keep the patient calm during the procedure.',
    },
    steps: [
      { time: 'T0', action: { es: 'Extrae cortisol basal.', en: 'Collect baseline cortisol.' } },
      { time: 'T0', action: { es: 'Administra dexametasona 0.01 mg/kg IV.', en: 'Administer dexamethasone 0.01 mg/kg IV.' } },
      { time: 'T4 h', action: { es: 'Extrae cortisol a las 4 horas.', en: 'Collect cortisol at 4 hours.' } },
      { time: 'T8 h', action: { es: 'Extrae cortisol a las 8 horas e interpreta junto al basal.', en: 'Collect cortisol at 8 hours and interpret with the baseline value.' } },
    ],
    followUp: {
      es: 'Si confirma HAC, completa diferenciacion con supresion parcial, ACTH endogena e imagen. En tratamiento con trilostano, los controles se valoran a 2 semanas, 1 mes y luego cada 3-6 meses.',
      en: 'If HAC is confirmed, complete differentiation with suppression pattern, endogenous ACTH, and imaging. During trilostane treatment, reassess at 2 weeks, 1 month, and then every 3-6 months.',
    },
    pearls: [
      {
        es: 'En perros, la muestra de 8 horas es la que confirma o descarta mejor el HAC.',
        en: 'In dogs, the 8-hour sample best confirms or excludes HAC.',
      },
      {
        es: 'El ACTH stim tras trilostano se hace 3-5 h despues de la dosis y siempre en una ventana consistente entre revisiones.',
        en: 'ACTH stimulation after trilostane is done 3-5 h after dosing and should be kept at a consistent timing across rechecks.',
      },
    ],
    sources: [
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
      { label: 'Merck Cushing syndrome', url: SOURCES.merckCushing },
    ],
  },
  {
    id: 'dog-addison-acth',
    species: 'dog',
    system: 'adrenal',
    disease: { es: 'Addison canino', en: 'Canine hypoadrenocorticism' },
    test: { es: 'Cortisol basal + ACTH stimulation con cosintropina', en: 'Resting cortisol + ACTH stimulation with cosyntropin' },
    summary: {
      es: 'El cortisol basal sirve para descartar; la confirmacion se hace con ACTH stim.',
      en: 'Resting cortisol helps rule out disease; confirmation is made with ACTH stimulation.',
    },
    whenToUse: {
      es: 'Sospecha de Addison clasico o atipico: episodios GI, letargia, hipovolemia, Na/K alterados o cuadro inespecifico compatible.',
      en: 'Suspected classic or atypical Addison disease: GI episodes, lethargy, hypovolemia, sodium/potassium changes, or other compatible but vague signs.',
    },
    prep: {
      es: 'Puede requerir ayuno para evitar lipemia. Evita glucocorticoides que interfieran con el cortisol si es posible.',
      en: 'Fasting may be needed to avoid lipemia. Avoid glucocorticoids that interfere with cortisol assays when possible.',
    },
    steps: [
      { time: 'Screen', action: { es: 'Si el cortisol basal es >2 mcg/dL, Addison queda practicamente descartado.', en: 'If resting cortisol is >2 mcg/dL, Addison disease is essentially ruled out.' } },
      { time: 'T0', action: { es: 'Extrae cortisol basal.', en: 'Collect baseline cortisol.' } },
      { time: 'T0', action: { es: 'Administra cosintropina 5 mcg/kg IM o IV (maximo 250 mcg por perro).', en: 'Administer cosyntropin 5 mcg/kg IM or IV (maximum 250 mcg per dog).' } },
      { time: 'T1 h', action: { es: 'Extrae segunda muestra 1 hora despues.', en: 'Collect the second sample 1 hour later.' } },
    ],
    followUp: {
      es: 'La confirmacion se basa en cortisol post-ACTH por debajo del punto de corte diagnostico del laboratorio. Si estas en crisis, prioriza estabilizacion y documenta segun el contexto clinico.',
      en: 'Confirmation is based on a post-ACTH cortisol below the lab diagnostic cutoff. If the patient is in crisis, prioritize stabilization and document according to the clinical context.',
    },
    pearls: [
      {
        es: 'Usa la misma tecnica y el mismo laboratorio siempre que puedas.',
        en: 'Use the same technique and laboratory whenever possible.',
      },
      {
        es: 'La dosis diagnostica de cosintropina no es la misma que la dosis baja usada para monitorizar trilostano.',
        en: 'The diagnostic cosyntropin dose is not the same as the low dose used for trilostane monitoring.',
      },
    ],
    sources: [
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
    ],
  },
  {
    id: 'dog-hypothyroidism',
    species: 'dog',
    system: 'thyroid',
    disease: { es: 'Hipotiroidismo canino', en: 'Canine hypothyroidism' },
    test: { es: 'TT4 + fT4 + TSH y monitorizacion con TT4', en: 'TT4 + fT4 + TSH with TT4 monitoring' },
    summary: {
      es: 'No diagnostiques con TT4 baja aislada; integra clinica, bioquimica y panel tiroideo.',
      en: 'Do not diagnose on low TT4 alone; integrate clinical signs, biochemistry, and the thyroid panel.',
    },
    whenToUse: {
      es: 'Letargia, aumento de peso, intolerancia al ejercicio, alteraciones dermatologicas, hipercolesterolemia o anemia no regenerativa compatible.',
      en: 'Lethargy, weight gain, exercise intolerance, dermatologic changes, hypercholesterolemia, or compatible nonregenerative anemia.',
    },
    prep: {
      es: 'Idealmente toma la muestra cuando el perro este clinicamente estable. Si monitorizas levotiroxina, el farmaco va en ayunas siempre que puedas.',
      en: 'Ideally collect the sample when the dog is clinically stable. If you are monitoring levothyroxine, give the drug on an empty stomach whenever possible.',
    },
    steps: [
      { time: 'Dx', action: { es: 'TT4 baja o en borde bajo con sospecha alta: anade fT4 y TSH.', en: 'If TT4 is low or low-normal with high suspicion, add fT4 and TSH.' } },
      { time: 'Dx', action: { es: 'Confirma con dos de tres alteradas (TT4/fT4 bajas y/o TSH alta) mas cuadro clinico compatible.', en: 'Confirm with two of three abnormalities (low TT4/fT4 and/or high TSH) plus a compatible clinical picture.' } },
      { time: 'Monitor 4 wk', action: { es: 'Revisa TT4 unas 4 semanas tras iniciar o ajustar levotiroxina.', en: 'Recheck TT4 about 4 weeks after starting or adjusting levothyroxine.' } },
      { time: 'Post-pill', action: { es: 'Toma TT4 4-6 horas tras la pastilla matinal.', en: 'Measure TT4 4-6 hours after the morning pill.' } },
    ],
    followUp: {
      es: 'Una vez estable, controla TT4 cada 6-12 meses. Si das la medicacion con comida, intenta mantener siempre el mismo contexto al monitorizar.',
      en: 'Once stable, monitor TT4 every 6-12 months. If medication is given with food, keep the context consistent for monitoring.',
    },
    pearls: [
      {
        es: 'En obesos, la dosis inicial se calcula con peso magro estimado.',
        en: 'In obese dogs, the initial dose is calculated from estimated lean body weight.',
      },
      {
        es: 'Retrasa el estudio si hay enfermedad no tiroidea activa importante.',
        en: 'Delay testing if major nonthyroidal illness is active.',
      },
    ],
    sources: [
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
      { label: 'Merck hypothyroidism', url: SOURCES.merckHypothyroidism },
    ],
  },
  {
    id: 'dog-diabetes',
    species: 'dog',
    system: 'pancreas',
    disease: { es: 'Diabetes mellitus canina', en: 'Canine diabetes mellitus' },
    test: { es: 'Hiperglucemia persistente, glucosuria y curva de glucosa/fructosamina', en: 'Persistent hyperglycemia, glucosuria, and glucose curve/fructosamine' },
    summary: {
      es: 'El diagnostico se apoya en hiperglucemia persistente con glucosuria; el control se decide por signos clinicos y curvas/monitorizacion.',
      en: 'Diagnosis relies on persistent hyperglycemia with glucosuria; control is judged by clinical signs plus curves/monitoring.',
    },
    whenToUse: {
      es: 'PU/PD, polifagia, perdida de peso, cataratas o infecciones recurrentes. En perros el cuadro suele ser persistente, no solo por estres.',
      en: 'PU/PD, polyphagia, weight loss, cataracts, or recurrent infections. In dogs, the pattern is usually persistent rather than stress-only.',
    },
    prep: {
      es: 'Estandariza comida e insulina el dia de la curva. Registra hora de comida, hora de insulina y signos clinicos.',
      en: 'Standardize feeding and insulin on curve day. Record meal time, insulin time, and clinical signs.',
    },
    steps: [
      { time: 'Dx', action: { es: 'Confirma hiperglucemia persistente mas glucosuria.', en: 'Confirm persistent hyperglycemia plus glucosuria.' } },
      { time: 'Monitor', action: { es: 'Valora el nadir ideal entre 80-150 mg/dL y la duracion en rango 80-200 mg/dL la mayor parte del dia.', en: 'Assess an ideal nadir of 80-150 mg/dL and duration in the 80-200 mg/dL range for most of the day.' } },
      { time: 'Recheck', action: { es: 'Si persiste hiperglucemia con signos, aumenta dosis y repite curva en 7-14 dias.', en: 'If hyperglycemia persists with clinical signs, increase the dose and repeat the curve in 7-14 days.' } },
    ],
    followUp: {
      es: 'Los signos clinicos mandan. Si el peso sube o se mantiene y no hay signos, no ajustes solo por una curva aislada discordante.',
      en: 'Clinical signs take priority. If body weight is stable or increasing and signs are absent, do not change treatment from a discordant single curve alone.',
    },
    pearls: [
      {
        es: 'En las curvas del perro, una duracion corta con nadir correcto puede indicar tipo de insulina o pauta, no necesariamente falta de dosis.',
        en: 'In dogs, a short duration with an adequate nadir may indicate an insulin-type or schedule issue rather than too little dose.',
      },
    ],
    sources: [
      { label: 'Merck diabetes', url: SOURCES.merckDiabetes },
      { label: 'AAHA diabetes', url: SOURCES.aahaDiabetes },
      { label: 'AAHA glucose curves', url: SOURCES.aahaGlucoseCurves },
    ],
  },
  {
    id: 'dog-pheochromocytoma',
    species: 'dog',
    system: 'adrenal',
    disease: { es: 'Feocromocitoma', en: 'Pheochromocytoma' },
    test: { es: 'PA indirecta + imagen adrenal (ecografia/TC) + estadiaje', en: 'Indirect BP + adrenal imaging (ultrasound/CT) + staging' },
    summary: {
      es: 'No es una prueba unica de minuto 0-horas, sino una ruta diagnostica basada en sospecha, hipertension e imagen.',
      en: 'This is not a single minute-0/hour-based test but a diagnostic pathway based on suspicion, hypertension, and imaging.',
    },
    whenToUse: {
      es: 'Perros mayores con masa adrenal incidental o signos episodicos: debilidad, colapso, taquicardia, disnea o hipertension.',
      en: 'Older dogs with an incidental adrenal mass or episodic signs such as weakness, collapse, tachycardia, dyspnea, or hypertension.',
    },
    prep: {
      es: 'Mide presion arterial en reposo y completa ecografia/TC. Incluye radiografias toracicas para metastasis pulmonares.',
      en: 'Measure blood pressure at rest and complete ultrasound/CT imaging. Include thoracic radiographs for pulmonary metastasis screening.',
    },
    steps: [
      { time: 'Paso 1', action: { es: 'Confirma hipertension si esta presente.', en: 'Confirm hypertension if present.' } },
      { time: 'Paso 2', action: { es: 'Caracteriza la masa adrenal con ecografia o TC.', en: 'Characterize the adrenal mass with ultrasound or CT.' } },
      { time: 'Paso 3', action: { es: 'Descarta otras causas de masa adrenal, incluido Cushing.', en: 'Rule out other causes of adrenal masses, including Cushing syndrome.' } },
    ],
    followUp: {
      es: 'Si es quirurgico, la preparacion preoperatoria importa mucho: el manual Merck senala fenoxibenzamina 1-2 semanas antes de cirugia.',
      en: 'If surgery is planned, preoperative preparation matters: Merck notes phenoxybenzamine for 1-2 weeks before surgery.',
    },
    pearls: [
      {
        es: 'La sospecha nace muchas veces de una masa adrenal incidental mas hipertension o signos paroxisticos.',
        en: 'Suspicion often starts with an incidental adrenal mass plus hypertension or paroxysmal signs.',
      },
    ],
    sources: [
      { label: 'Merck pheochromocytoma', url: SOURCES.merckPheo },
    ],
  },
  {
    id: 'dog-alopecia-x',
    species: 'dog',
    system: 'reproderm',
    disease: { es: 'Alopecia X / alopecias endocrinas de exclusion', en: 'Alopecia X / endocrine alopecias by exclusion' },
    test: { es: 'Ruta de exclusion: piel, tiroides, Cushing y paneles sexuales segun contexto', en: 'Exclusion pathway: skin workup, thyroid, Cushing, and sex-hormone panels when indicated' },
    summary: {
      es: 'No existe una unica prueba confirmatoria. Primero descarta causas dermatologicas y endocrinas frecuentes; luego valora paneles sexuales si el fenotipo encaja.',
      en: 'There is no single confirmatory test. First exclude common dermatologic and endocrine causes, then consider sex-hormone panels if the phenotype fits.',
    },
    whenToUse: {
      es: 'Alopecia simetrica no inflamatoria, razas Spitz/Pomerania, piel hiperpigmentada, cabeza y extremidades distales respetadas, sin clinica sistemica clara.',
      en: 'Noninflammatory symmetric alopecia in Spitz/Pomeranian-type dogs, hyperpigmented skin, head and distal limbs spared, and no clear systemic illness.',
    },
    prep: {
      es: 'Antes de buscar hormonas sexuales, descarta parasitos, infecciones, hipotiroidismo y Cushing. Considera biopsia si el patron no es limpio.',
      en: 'Before pursuing sex-hormone testing, rule out parasites, infections, hypothyroidism, and Cushing syndrome. Consider biopsy if the pattern is not straightforward.',
    },
    steps: [
      { time: 'Paso 1', action: { es: 'Dermatologia basica: raspados, tricograma/citologia, cultivos segun el caso.', en: 'Basic dermatology workup: scrapings, trichogram/cytology, and cultures as indicated.' } },
      { time: 'Paso 2', action: { es: 'Endocrino base: panel tiroideo y cribado de Cushing si la clinica acompana.', en: 'Baseline endocrine workup: thyroid panel and Cushing screening if the clinical picture supports it.' } },
      { time: 'Paso 3', action: { es: 'Si sigues pensando en alopecia endocrina/sexual, considera esteroides intermedios y hormonas sexuales basales o post-ACTH.', en: 'If endocrine/sex-hormone alopecia remains likely, consider steroid intermediates and basal or post-ACTH sex-hormone testing.' } },
    ],
    followUp: {
      es: 'La evidencia publicada muestra mucha variabilidad; una alteracion hormonal no siempre aparece ni siempre explica el caso por completo.',
      en: 'Published evidence shows substantial variability; hormonal abnormalities may not always be present or fully explain the case.',
    },
    pearls: [
      {
        es: 'Piensa tambien en exposicion a hormonas humanas topicas si el patron es compatible.',
        en: 'Also consider exposure to human topical hormones if the pattern is compatible.',
      },
    ],
    sources: [
      { label: 'Merck hair loss', url: SOURCES.merckAlopecia },
      { label: 'PubMed alopecia and sex hormones', url: SOURCES.pubmedAlopeciaX },
      { label: 'PubMed adrenal sex hormones', url: SOURCES.pubmedAdrenalSexHormones },
    ],
  },
  {
    id: 'cat-hyperthyroidism',
    species: 'cat',
    system: 'thyroid',
    disease: { es: 'Hipertiroidismo felino', en: 'Feline hyperthyroidism' },
    test: { es: 'T4 total; si es dudoso, repetir T4 + fT4 y ampliar con T3 suppression/TSH/scintigrafia', en: 'Total T4; if equivocal, repeat T4 + fT4 and expand with T3 suppression/TSH/scintigraphy' },
    summary: {
      es: 'La T4 alta con clinica clasica suele bastar. Si la T4 es normal-alta o normal y sospechas mucho, repite y escala.',
      en: 'High T4 with a classic presentation is often enough. If T4 is upper-normal or normal but suspicion remains high, repeat and escalate.',
    },
    whenToUse: {
      es: 'Gatos mayores con perdida de peso, hiperactividad, soplo/taquicardia, polifagia, vomitos o nodulo tiroideo.',
      en: 'Older cats with weight loss, hyperactivity, murmur/tachycardia, polyphagia, vomiting, or a thyroid nodule.',
    },
    prep: {
      es: 'Para diagnostico inicial no necesitas una ventana exacta si aun no toma metimazol. Usa laboratorio de referencia si puedes y manten el mismo para seguimiento.',
      en: 'For initial diagnosis no exact dosing-time window is needed if the cat is not yet on methimazole. Use a reference lab when possible and stay consistent for follow-up.',
    },
    steps: [
      { time: 'Dx base', action: { es: 'T4 total elevada + clinica compatible = FHT muy probable.', en: 'Elevated total T4 + compatible signs = very likely FHT.' } },
      { time: 'Si dudoso', action: { es: 'Repite T4 y fT4 en 2-4 semanas.', en: 'Repeat T4 and fT4 in 2-4 weeks.' } },
      { time: 'Si persiste duda', action: { es: 'Valora T3 suppression, TSH con T4/fT4ed o gammagrafia tiroidea.', en: 'Consider T3 suppression, TSH with T4/fT4ed, or thyroid scintigraphy.' } },
      { time: 'Monitor metimazol', action: { es: 'Una vez tratado con metimazol, revisa T4 cada 2-4 semanas hasta objetivo.', en: 'Once on methimazole, recheck T4 every 2-4 weeks until the target is reached.' } },
    ],
    followUp: {
      es: 'La muestra para T4 en gatos con metimazol puede tomarse en cualquier momento del dia; no hace falta fijarla a X horas postdosis. Una vez regulado, minimo cada 6 meses.',
      en: 'For cats on methimazole, T4 can be sampled at any time of day; no fixed post-dose timing is required. Once regulated, recheck at least every 6 months.',
    },
    pearls: [
      {
        es: 'Completa CBC, bioquimica y urianalisis durante la regulacion para vigilar azotemia y efectos adversos.',
        en: 'Use CBC, chemistry, and urinalysis during regulation to watch for azotemia and adverse effects.',
      },
    ],
    sources: [
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
      { label: 'Merck hyperthyroidism', url: SOURCES.merckHyperthyroidism },
    ],
  },
  {
    id: 'cat-diabetes',
    species: 'cat',
    system: 'pancreas',
    disease: { es: 'Diabetes mellitus felina', en: 'Feline diabetes mellitus' },
    test: { es: 'Hiperglucemia persistente, glucosuria y fructosamina/curvas', en: 'Persistent hyperglycemia, glucosuria, and fructosamine/curves' },
    summary: {
      es: 'En gatos hay que separar diabetes real de hiperglucemia por estres; la fructosamina ayuda mucho.',
      en: 'In cats, you must separate true diabetes from stress hyperglycemia; fructosamine is especially useful.',
    },
    whenToUse: {
      es: 'PU/PD, perdida de peso, debilidad o neuropatia plantigrada, sobre todo en gatos con glucosuria y glucosas repetidamente altas.',
      en: 'PU/PD, weight loss, weakness, or plantigrade neuropathy, especially with glucosuria and repeatedly high glucose values.',
    },
    prep: {
      es: 'Estandariza horarios de comida e insulina el dia de la curva. Minimiza estres y prioriza monitorizacion en casa si es posible.',
      en: 'Standardize feeding and insulin timing on curve day. Minimize stress and favor home monitoring when possible.',
    },
    steps: [
      { time: 'Dx', action: { es: 'Confirma glucosuria e hiperglucemia persistente.', en: 'Confirm glucosuria and persistent hyperglycemia.' } },
      { time: 'Dx apoyo', action: { es: 'Solicita fructosamina si dudas entre estres y diabetes.', en: 'Request fructosamine if you are unsure whether this is stress hyperglycemia or diabetes.' } },
      { time: 'Curva', action: { es: 'Busca nadir ideal 80-150 mg/dL y duracion util 80-300 mg/dL la mayor parte del dia.', en: 'Aim for an ideal nadir of 80-150 mg/dL and useful duration of 80-300 mg/dL for most of the day.' } },
      { time: 'Ajuste', action: { es: 'Si sigue alto con signos, sube 0.5-1 U/dosis y repite curva en 7-14 dias.', en: 'If the curve stays high with clinical signs, increase by 0.5-1 U/dose and repeat the curve in 7-14 days.' } },
    ],
    followUp: {
      es: 'Si la curva parece mala pero el gato esta estable y el peso sube, piensa en estres de clinica y repite en casa o en entorno menos estresante.',
      en: 'If the curve looks poor but the cat is clinically stable and gaining weight, think about clinic stress and repeat at home or in a lower-stress setting.',
    },
    pearls: [
      {
        es: 'En gatos recien diagnosticados, la dosis inicial de insulina suele calcularse sobre peso ideal y con arranque conservador.',
        en: 'In newly diagnosed cats, the starting insulin dose is usually based on ideal body weight and kept conservative.',
      },
    ],
    sources: [
      { label: 'Merck diabetes', url: SOURCES.merckDiabetes },
      { label: 'AAHA glucose curves', url: SOURCES.aahaGlucoseCurves },
      { label: 'AAHA diabetes', url: SOURCES.aahaDiabetes },
    ],
  },
  {
    id: 'cat-insulin-resistance',
    species: 'cat',
    system: 'pancreas',
    disease: { es: 'Gato diabetico con resistencia a insulina', en: 'Diabetic cat with insulin resistance' },
    test: {
      es: 'Descartar hipersomatotropismo/acromegalia y, si la clinica encaja, hipercortisolismo felino',
      en: 'Rule out hypersomatotropism/acromegaly and, if the signs fit, feline hypercortisolism',
    },
    summary: {
      es: 'En un gato que necesita dosis altas o sigue mal regulado, el principal proceso endocrino a descartar es hipersomatotropismo/acromegalia. Si ademas hay piel fragil o hallazgos compatibles, anade despistaje de HAC felino.',
      en: 'In a cat needing high insulin doses or remaining poorly regulated, the main endocrine disorder to rule out is hypersomatotropism/acromegaly. If fragile skin or compatible signs are present, add feline HAC screening.',
    },
    whenToUse: {
      es: 'Gatos con diabetes dificil de regular, requerimientos insulinicos crecientes o muy altos, aumento de peso pese a diabetes, prognatismo, soplo/cardiomiopatia, organomegalias o neuropatia persistente.',
      en: 'Cats with hard-to-regulate diabetes, rising or very high insulin requirements, weight gain despite diabetes, prognathism, murmur/cardiomyopathy, organ enlargement, or persistent neuropathy.',
    },
    prep: {
      es: 'No busques solo con la curva de glucosa. Primero confirma que la tecnica, el producto de insulina, la alimentacion y la adherencia son correctos. Luego escala el estudio endocrino.',
      en: 'Do not rely on the glucose curve alone. First confirm that injection technique, insulin product, feeding, and adherence are appropriate. Then escalate the endocrine workup.',
    },
    steps: [
      { time: 'Paso 1', action: { es: 'Revisa tecnica, conservacion de insulina, dieta y comorbilidades infecciosas/inflamatorias.', en: 'Review technique, insulin storage, diet, and infectious/inflammatory comorbidities.' } },
      { time: 'Paso 2', action: { es: 'Si la resistencia persiste, solicita IGF-1 para despistar hipersomatotropismo/acromegalia.', en: 'If resistance persists, request IGF-1 to screen for hypersomatotropism/acromegaly.' } },
      { time: 'Paso 3', action: { es: 'Si IGF-1 apoya el diagnostico, confirma extension con imagen avanzada hipofisaria si cambia decisiones terapeuticas.', en: 'If IGF-1 supports the diagnosis, define pituitary involvement with advanced imaging if it will change treatment decisions.' } },
      { time: 'Paso 4', action: { es: 'Si ademas hay piel fragil, hepatomegalia o sospecha de HAC, usa UCCR en casa y/o LDDST felino 0.1 mg/kg IV con muestras T0, T4 h y T8 h.', en: 'If fragile skin, hepatomegaly, or HAC suspicion is also present, use home UCCR and/or a feline LDDST with 0.1 mg/kg IV and samples at T0, T4 h, and T8 h.' } },
    ],
    followUp: {
      es: 'Un IGF-1 alto orienta mucho hacia acromegalia; despues decide si el caso se maneja solo ajustando insulina o si necesitas imagen/derivacion. El HAC felino se descarta solo si la clinica lo justifica.',
      en: 'A high IGF-1 strongly supports acromegaly; then decide whether the case will be handled by insulin adjustment alone or needs imaging/referral. Feline HAC should only be pursued when the clinical picture justifies it.',
    },
    pearls: [
      {
        es: 'En el gato insulinorresistente, la acromegalia es mucho mas frecuente que el HAC felino.',
        en: 'In an insulin-resistant cat, acromegaly is much more common than feline HAC.',
      },
      {
        es: 'Si no hay rasgos compatibles con HAC, no hace falta meter a todos los gatos resistentes en un LDDST.',
        en: 'If there are no compatible HAC features, not every resistant diabetic cat needs an LDDST.',
      },
    ],
    sources: [
      { label: 'Merck acromegaly', url: SOURCES.merckAcromegaly },
      { label: 'Merck diabetes', url: SOURCES.merckDiabetes },
      { label: 'AAHA diabetes', url: SOURCES.aahaDiabetes },
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
    ],
  },
  {
    id: 'cat-hypercortisolism',
    species: 'cat',
    system: 'adrenal',
    disease: { es: 'Hipercortisolismo felino', en: 'Feline hypercortisolism' },
    test: { es: 'LDDST felino y UCCR; ACTH stim no recomendado como prueba diagnostica primaria', en: 'Feline LDDST and UCCR; ACTH stimulation not recommended as primary diagnostic test' },
    summary: {
      es: 'Es raro y suele requerir combinar clinica, LDDST felino, muestras de UCCR en casa e imagen.',
      en: 'This disease is rare and often requires combining clinical suspicion, a feline LDDST, home UCCR samples, and imaging.',
    },
    whenToUse: {
      es: 'Gatos con piel fragil, diabetes dificil de controlar, hepatomegalia o clinica compatible con HAC.',
      en: 'Cats with fragile skin, hard-to-regulate diabetes, hepatomegaly, or other signs compatible with HAC.',
    },
    prep: {
      es: 'Para UCCR, recoge al menos dos muestras matutinas en casa. Para LDDST usa dosis felina, no la canina.',
      en: 'For UCCR, collect at least two morning samples at home. For the LDDST, use the feline dose rather than the canine dose.',
    },
    steps: [
      { time: 'UCCR', action: { es: 'Recoge al menos dos orinas matutinas en casa.', en: 'Collect at least two morning urine samples at home.' } },
      { time: 'T0', action: { es: 'Si haces LDDST, extrae cortisol basal.', en: 'If performing an LDDST, collect baseline cortisol.' } },
      { time: 'T0', action: { es: 'Administra dexametasona 0.1 mg/kg IV.', en: 'Administer dexamethasone 0.1 mg/kg IV.' } },
      { time: 'T4 h + T8 h', action: { es: 'Extrae cortisol a las 4 y 8 horas.', en: 'Collect cortisol at 4 and 8 hours.' } },
    ],
    followUp: {
      es: 'AAHA no recomienda ACTH stimulation como prueba diagnostica primaria en el gato por su baja sensibilidad para HAC felino.',
      en: 'AAHA does not recommend ACTH stimulation as the primary diagnostic test in cats because of poor sensitivity for feline HAC.',
    },
    pearls: [
      {
        es: 'Si tratas con trilostano, el seguimiento se centra sobre todo en mejoria clinica y controles de laboratorio a 7-14 dias y luego cada 3-4 meses.',
        en: 'If treated with trilostane, follow-up focuses mainly on clinical improvement and lab rechecks at 7-14 days and then every 3-4 months.',
      },
    ],
    sources: [
      { label: 'AAHA endocrinopathies', url: SOURCES.aahaEndocrinePdf },
    ],
  },
  {
    id: 'ferret-insulinoma',
    species: 'ferret',
    system: 'pancreas',
    disease: { es: 'Insulinoma del huron', en: 'Ferret insulinoma' },
    test: { es: 'Glucosa en ayuno corto + insulina concurrente', en: 'Short fast glucose + concurrent insulin' },
    summary: {
      es: 'La prueba practica base es una glucosa tras ayuno corto; la insulina normal o alta en ese contexto apoya el diagnostico.',
      en: 'The practical core test is a short-fast glucose; a normal or high insulin concentration in that context supports the diagnosis.',
    },
    whenToUse: {
      es: 'Hurones >3 anos con debilidad, letargia, sialorrea, bruxismo, paresia posterior o crisis.',
      en: 'Ferrets older than 3 years with weakness, lethargy, sialorrhea, bruxism, hindlimb weakness, or seizures.',
    },
    prep: {
      es: 'Retira comida unas 4 horas antes de la cita. No prolongues el ayuno sin necesidad.',
      en: 'Withhold food for about 4 hours before the visit. Do not extend the fast unnecessarily.',
    },
    steps: [
      { time: 'Pretest', action: { es: 'Ayuno corto de ~4 horas.', en: 'Short fast of about 4 hours.' } },
      { time: 'Visita', action: { es: 'Mide glucosa y, si puedes, insulina concurrente.', en: 'Measure glucose and, if possible, concurrent insulin.' } },
      { time: 'Extra', action: { es: 'La ecografia puede ayudar pero muchas veces no detecta el tumor.', en: 'Ultrasound can help but often fails to identify the tumor.' } },
    ],
    followUp: {
      es: 'Los hurones en tratamiento necesitan glucemias cada pocos meses y tras cambios de medicacion.',
      en: 'Ferrets on treatment need blood glucose checks every few months and after medication changes.',
    },
    pearls: [
      {
        es: 'Si colapsa en casa, el Merck indica ofrecer algo de miel o sirope; si convulsiona, no dar nada por boca.',
        en: 'If the ferret collapses at home, Merck notes that a little honey or syrup can help; if seizing, do not give anything by mouth.',
      },
    ],
    sources: [
      { label: 'Merck ferret hormones', url: SOURCES.merckFerretHormones },
    ],
  },
  {
    id: 'ferret-adrenal',
    species: 'ferret',
    system: 'reproderm',
    disease: { es: 'Enfermedad adrenal del huron (hormonas sexuales)', en: 'Ferret adrenal disease (sex hormones)' },
    test: { es: 'Historia + exploracion + ecografia + panel de hormonas sexuales', en: 'History + exam + ultrasound + sex-hormone panel' },
    summary: {
      es: 'En hurones no equivale al Cushing clasico: predominan hormonas sexuales, no cortisol.',
      en: 'In ferrets this is not classic Cushing disease: sex hormones predominate rather than cortisol.',
    },
    whenToUse: {
      es: 'Alopecia caudal progresiva, vulva aumentada, agresividad, problemas prostáticos o signos reproductivos anormales.',
      en: 'Progressive caudal alopecia, enlarged vulva, aggression, prostatic issues, or abnormal reproductive signs.',
    },
    prep: {
      es: 'Empieza por historia y exploracion. La ecografia puede mostrar glandulas aumentadas, pero para afinar se miden hormonas sexuales.',
      en: 'Start with history and physical exam. Ultrasound may show enlarged glands, but sex-hormone measurement sharpens the diagnosis.',
    },
    steps: [
      { time: 'Paso 1', action: { es: 'Historia + examen dirigido a alopecia, vulva, prostata y conducta.', en: 'History and exam focused on alopecia, vulva, prostate, and behavior.' } },
      { time: 'Paso 2', action: { es: 'Ecografia adrenal si es posible.', en: 'Adrenal ultrasound if available.' } },
      { time: 'Paso 3', action: { es: 'Mide hormonas sexuales para confirmar mejor el cuadro.', en: 'Measure sex hormones to better confirm the syndrome.' } },
    ],
    followUp: {
      es: 'Si optas por manejo medico, la respuesta clinica se sigue de cerca y el tratamiento puede ser cronico.',
      en: 'If medical management is chosen, follow clinical response closely and expect chronic treatment.',
    },
    pearls: [
      {
        es: 'Melatonina o leuprolide pueden controlar signos, pero no frenan el crecimiento tumoral segun Merck.',
        en: 'Melatonin or leuprolide can control signs, but Merck notes they do not stop tumor growth.',
      },
    ],
    sources: [
      { label: 'Merck ferret hormones', url: SOURCES.merckFerretHormones },
    ],
  },
];

const roundValue = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatValue = (value: number, decimals = 2) => Number(value.toFixed(decimals)).toString();

export default function EndocrineToolkit({ lang }: Props) {
  const copy =
    lang === 'es'
      ? {
          kicker: 'Pruebas endocrinas',
          title: 'Toolkit de endocrino',
          text:
            'Guia practica por especie para organizar pruebas endocrinas en perro, gato y huron: minuto 0, horas de muestreo, ayuno, medicacion, revisiones y recordatorios de monitorizacion.',
          species: 'Especie',
          system: 'Sistema',
          allSystems: 'Todos',
          helperKicker: 'Ayuda de calculo',
          helperTitle: 'Dexametasona / Cosintropina',
          helperText:
            'Calculadora rapida para pruebas por peso. Introduce concentracion solo si quieres convertir dosis a mL.',
          helperProtocol: 'Protocolo',
          helperWeight: 'Peso (kg)',
          helperConcentration: 'Concentracion',
          helperDose: 'Dosis calculada',
          helperVolume: 'Volumen',
          helperNoVolume: 'Sin conversion',
          helperConcentrationHint: 'Deja 0 si solo quieres la dosis.',
          helperNote: 'Nota practica',
          protocolsKicker: 'Protocolos disponibles',
          disease: 'Enfermedad',
          test: 'Prueba',
          whenToUse: 'Cuando usarla',
          prep: 'Preparacion',
          steps: 'Cronograma',
          followUp: 'Revision / seguimiento',
          pearls: 'Perlas practicas',
          sources: 'Fuentes',
          emptyState: 'No hay protocolos para ese filtro.',
          disclaimer:
            'Uso clinico orientativo. Confirma siempre tecnica, tubos, laboratorio, dosis y adecuacion del protocolo al paciente real antes de aplicarlo.',
          summaryTitle: 'Como esta organizado',
          summaryBullets: [
            'Empieza por especie y luego filtra por adrenal, tiroides, pancreas o hormonas sexuales/piel.',
            'Las pruebas con cronograma fijo llevan pasos tipo T0, T4 h y T8 h.',
            'Cuando la mejor aproximacion es una ruta diagnostica y no una sola prueba, se deja explicitado.',
          ],
        }
      : {
          kicker: 'Endocrine testing',
          title: 'Endocrine toolkit',
          text:
            'Species-first practical guide for endocrine testing in dogs, cats, and ferrets: minute 0, sampling windows, fasting, medication, rechecks, and monitoring reminders.',
          species: 'Species',
          system: 'System',
          allSystems: 'All',
          helperKicker: 'Dose helper',
          helperTitle: 'Dexamethasone / Cosyntropin',
          helperText:
            'Fast weight-based calculator for common endocrine tests. Enter a concentration only if you want the dose converted into mL.',
          helperProtocol: 'Protocol',
          helperWeight: 'Weight (kg)',
          helperConcentration: 'Concentration',
          helperDose: 'Calculated dose',
          helperVolume: 'Volume',
          helperNoVolume: 'No conversion',
          helperConcentrationHint: 'Leave at 0 if you only need the dose.',
          helperNote: 'Practical note',
          protocolsKicker: 'Available protocols',
          disease: 'Disease',
          test: 'Test',
          whenToUse: 'When to use it',
          prep: 'Preparation',
          steps: 'Timeline',
          followUp: 'Recheck / follow-up',
          pearls: 'Practical pearls',
          sources: 'Sources',
          emptyState: 'No protocols for that filter.',
          disclaimer:
            'Guidance-only clinical use. Always confirm the technique, tubes, laboratory, dose, and patient fit before applying any protocol.',
          summaryTitle: 'How it is organized',
          summaryBullets: [
            'Start with species and then filter by adrenal, thyroid, pancreas, or sex hormones/skin.',
            'Tests with a fixed timeline use steps like T0, T4 h, and T8 h.',
            'When the best approach is a diagnostic pathway rather than a single test, that is stated explicitly.',
          ],
        };

  const [species, setSpecies] = useState<EndocrineSpecies>('dog');
  const [system, setSystem] = useState<EndocrineSystem | 'all'>('all');
  const [helperProtocolId, setHelperProtocolId] = useState<HelperProtocolKey>('dogLddst');
  const [weight, setWeight] = useState('');
  const [concentration, setConcentration] = useState('');

  const filteredProtocols = useMemo(
    () => PROTOCOLS.filter((protocol) => protocol.species === species && (system === 'all' ? true : protocol.system === system)),
    [species, system],
  );

  const availableSystems = useMemo(
    () => Array.from(new Set(PROTOCOLS.filter((protocol) => protocol.species === species).map((protocol) => protocol.system))),
    [species],
  );

  useEffect(() => {
    if (system !== 'all' && !availableSystems.includes(system)) {
      setSystem('all');
    }
  }, [availableSystems, system]);

  useEffect(() => {
    const preferredHelper = HELPER_PROTOCOLS.find((protocol) => protocol.species === species) ?? HELPER_PROTOCOLS[0];
    setHelperProtocolId(preferredHelper.id);
  }, [species]);

  const activeHelper = HELPER_PROTOCOLS.find((protocol) => protocol.id === helperProtocolId) ?? HELPER_PROTOCOLS[0];

  const helperResult = useMemo(() => {
    const numericWeight = Number.parseFloat(weight);
    const numericConcentration = Number.parseFloat(concentration);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) return null;

    const rawDose = activeHelper.dosePerKg * numericWeight;
    const cappedDose = activeHelper.capDose ? Math.min(rawDose, activeHelper.capDose) : rawDose;
    const volume = Number.isFinite(numericConcentration) && numericConcentration > 0 ? cappedDose / numericConcentration : null;

    return {
      dose: cappedDose,
      volume,
    };
  }, [activeHelper, concentration, weight]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
          <p>{copy.text}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{copy.summaryTitle}</strong>
          <ul className="haemo-list">
            {copy.summaryBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <div className="toolkit-utility-form">
            <label>
              {copy.species}
              <select value={species} onChange={(event) => setSpecies(event.target.value as EndocrineSpecies)}>
                {(Object.keys(SPECIES_LABELS) as EndocrineSpecies[]).map((option) => (
                  <option key={option} value={option}>
                    {SPECIES_LABELS[option][lang]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="endo-system-row" role="tablist" aria-label={copy.system}>
            <button type="button" className={system === 'all' ? 'active' : ''} onClick={() => setSystem('all')}>
              {copy.allSystems}
            </button>
            {availableSystems.map((option) => (
              <button
                key={option}
                type="button"
                className={system === option ? 'active' : ''}
                onClick={() => setSystem(option)}
              >
                {SYSTEM_LABELS[option][lang]}
              </button>
            ))}
          </div>
        </section>

        <section className="toolkit-utility-card result-card">
          <p className="section-kicker">{copy.helperKicker}</p>
          <h4 className="endo-helper-title">{copy.helperTitle}</h4>
          <p className="endo-helper-text">{copy.helperText}</p>

          <div className="toolkit-utility-form endo-helper-form">
            <label>
              {copy.helperProtocol}
              <select value={helperProtocolId} onChange={(event) => setHelperProtocolId(event.target.value as HelperProtocolKey)}>
                {HELPER_PROTOCOLS.filter((protocol) => protocol.species === species).map((protocol) => (
                  <option key={protocol.id} value={protocol.id}>
                    {protocol.label[lang]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {copy.helperWeight}
              <input
                type="number"
                min="0.2"
                step="0.1"
                value={weight}
                placeholder={lang === 'es' ? 'Ej: 20' : 'Eg: 20'}
                onChange={(event) => setWeight(event.target.value)}
              />
            </label>

            <label>
              {copy.helperConcentration} ({activeHelper.concentrationUnit})
              <input
                type="number"
                min="0"
                step="any"
                value={concentration}
                placeholder={activeHelper.concentrationUnit === 'mg/mL' ? '2' : '250'}
                onChange={(event) => setConcentration(event.target.value)}
              />
            </label>
          </div>

          <div className="toolkit-utility-help endo-helper-note">
            <strong>{copy.helperNote}</strong>
            <p>{activeHelper.note[lang]}</p>
          </div>

          <div className="haemo-metrics">
            <article className="haemo-metric-card">
              <span>{copy.helperDose}</span>
              <strong>
                {helperResult ? formatValue(roundValue(helperResult.dose, activeHelper.doseUnit === 'mg' ? 3 : 1), activeHelper.doseUnit === 'mg' ? 3 : 1) : '--'}{' '}
                {activeHelper.doseUnit}
              </strong>
            </article>
            <article className="haemo-metric-card">
              <span>{copy.helperVolume}</span>
              <strong>
                {helperResult?.volume !== null && helperResult?.volume !== undefined
                  ? `${formatValue(roundValue(helperResult.volume, 3), 3)} mL`
                  : copy.helperNoVolume}
              </strong>
              <p>{copy.helperConcentrationHint}</p>
            </article>
          </div>
        </section>
      </div>

      <section className="toolkit-reference-table">
        <div className="toolkit-reference-header">
          <div>
            <p className="section-kicker">{copy.protocolsKicker}</p>
            <h4>{SPECIES_LABELS[species][lang]}</h4>
          </div>
          <span>{system === 'all' ? copy.allSystems : SYSTEM_LABELS[system][lang]}</span>
        </div>
        <div className="toolkit-utility-help">
          <p>{copy.disclaimer}</p>
        </div>
      </section>

      {filteredProtocols.length === 0 ? (
        <section className="toolkit-reference-table">
          <p>{copy.emptyState}</p>
        </section>
      ) : (
        <div className="endo-card-grid">
          {filteredProtocols.map((protocol) => (
            <details key={protocol.id} className="toolkit-reference-table accordion-card endo-protocol">
              <summary className="accordion-summary">
                <div className="endo-protocol-summary">
                  <p className="section-kicker">{SYSTEM_LABELS[protocol.system][lang]}</p>
                  <h4>{protocol.disease[lang]}</h4>
                  <p className="endo-protocol-test">{protocol.test[lang]}</p>
                </div>
              </summary>

              <div className="endo-protocol-content">
                <p className="endo-protocol-summary-text">{protocol.summary[lang]}</p>

                <div className="endo-protocol-block">
                  <strong>{copy.whenToUse}</strong>
                  <p>{protocol.whenToUse[lang]}</p>
                </div>

                <div className="endo-protocol-block">
                  <strong>{copy.prep}</strong>
                  <p>{protocol.prep[lang]}</p>
                </div>

                <div className="endo-protocol-block">
                  <strong>{copy.steps}</strong>
                  <div className="endo-step-list compact">
                    {protocol.steps.map((step) => (
                      <article key={`${protocol.id}-${step.time}`} className="endo-step-card">
                        <span>{step.time}</span>
                        <p>{step.action[lang]}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="endo-protocol-block">
                  <strong>{copy.followUp}</strong>
                  <p>{protocol.followUp[lang]}</p>
                </div>

                <div className="endo-protocol-block">
                  <strong>{copy.pearls}</strong>
                  <ul className="haemo-list">
                    {protocol.pearls.map((item) => (
                      <li key={item.en}>{item[lang]}</li>
                    ))}
                  </ul>
                </div>

                <div className="endo-protocol-block">
                  <strong>{copy.sources}</strong>
                  <div className="haemo-source-links">
                    {protocol.sources.map((source) => (
                      <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                        {source.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
