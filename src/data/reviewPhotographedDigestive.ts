import type { DoseCalculatorEntry } from '../types';

const cerenia = 'AEMPS · Cerenia 60 mg: https://cimavet.aemps.es/cimavet/publico/detalle.html?nregistro=EU%2F2%2F06%2F062%2F003\nVMD · Posología: https://www.vmd.defra.gov.uk/productinformationdatabase/files/SPC_Documents/SPC_2243343.PDF';
const clevor = 'UE · Clevor: https://medicines.health.europa.eu/veterinary/en/600000000281';
const phosphateToxicity = 'Tomsa et al. · https://hero.epa.gov/reference/3998680/';
const urolithConsensus = 'ACVIM · https://pubmed.ncbi.nlm.nih.gov/27611724/';

const category = { es: 'Digestivo y Metabolismo', en: 'Digestive system and metabolism' };
const referenceOnly = { doseRangeMgKg: { min: NaN, max: NaN }, defaultDoseMgKg: NaN };

export const photographedDigestiveAdditions: DoseCalculatorEntry[] = [
  {
    id: 'hydroxocobalamin-feline-hypocobalaminemia',
    activeIngredient: 'Hidroxocobalamina',
    category,
    subcategory: { es: 'Vitaminas del complejo B', en: 'B-complex vitamins' },
    species: ['Cat'],
    route: 'IM',
    indication: {
      es: 'Hipocobalaminemia asociada a enfermedad gastrointestinal',
      en: 'Hypocobalaminemia associated with gastrointestinal disease',
    },
    doseRangeMgKg: { min: 300, max: 300 },
    defaultDoseMgKg: 300,
    doseUnit: 'mcg/gato',
    frequency: 'Cada 2 semanas / Every 2 weeks',
    duration: '4 dosis / 4 doses',
    concentration: { es: 'Verificar formulación inyectable IM', en: 'Verify IM injection formulation' },
    clinicalNotes: {
      es: 'Uso extraficha con formulación humana. Estudio prospectivo de 23 gatos sin grupo de control. Reevaluar el estado de cobalamina tras el ciclo inicial. Contraindicación de la ficha humana: hipersensibilidad al principio activo o excipientes.',
      en: 'Off-label use of a human formulation. Uncontrolled prospective study in 23 cats. Reassess cobalamin status after the initial course. Human label contraindication: hypersensitivity to the active substance or excipients.',
    },
    bibliography: 'Guía terapéutica del animal de compañía, p. 76.\nKook et al. (2020): https://pubmed.ncbi.nlm.nih.gov/32815652/\nAEMPS · Formulación humana: https://cima.aemps.es/cima/dochtml/ft/88743/FT_88743.html',
  },
  {
    id: 'maropitant-canine-motion-sickness',
    activeIngredient: 'Maropitant',
    category,
    subcategory: { es: 'Antieméticos', en: 'Antiemetics' },
    linkedEntryId: 'maropitant',
    species: ['Dog'],
    route: 'VO',
    indication: {
      es: 'Prevención de vómitos por cinetosis',
      en: 'Prevention of motion sickness-induced vomiting',
    },
    doseRangeMgKg: { min: 8, max: 8 },
    defaultDoseMgKg: 8,
    doseUnit: 'mg/kg',
    frequency: 'c24h',
    duration: 'Máx. 2 días consecutivos / Max. 2 consecutive days',
    concentration: { es: 'Cerenia comprimidos · tabla según peso', en: 'Cerenia tablets · weight-band table' },
    clinicalNotes: {
      es: 'Pauta oral para perros de al menos 16 semanas. Administrar al menos una hora antes del viaje. Confirmar número de comprimidos y tramo de peso en la ficha. Precaución en hepatopatía. Seguridad sin establecer durante gestación y lactancia.',
      en: 'Oral regimen for dogs aged 16 weeks or older. Give at least one hour before travel. Confirm tablet count and weight band in the product information. Use caution in liver disease. Safety during pregnancy and lactation has not been established.',
    },
    bibliography: cerenia,
  },
  {
    id: 'enterococcus-faecium-sf68-reference',
    activeIngredient: 'Enterococcus faecium',
    category,
    subcategory: { es: 'Probióticos', en: 'Probiotics' },
    species: ['Cat', 'Dog'],
    route: 'VO',
    indication: { es: 'Referencia sobre la cepa probiótica SF68', en: 'Reference for the SF68 probiotic strain' },
    ...referenceOnly,
    concentration: { es: 'Según producto y cepa', en: 'Product- and strain-specific' },
    clinicalNotes: {
      es: 'Ensayo controlado en refugio. En gatos se observó menor frecuencia de diarrea de dos días o más. En perros no se demostró una diferencia significativa. Las concentraciones de distintos productos y cepas no son intercambiables.',
      en: 'Controlled shelter trial. Cats had fewer episodes of diarrhea lasting at least two days. A significant difference was not demonstrated in dogs. Concentrations across products and strains are not interchangeable.',
    },
    bibliography: 'Guía terapéutica del animal de compañía, p. 69.\nBybee et al. (2011): https://pubmed.ncbi.nlm.nih.gov/21689152/',
  },
  {
    id: 'nicotinamide-canine-cutaneous-lupus-reference',
    activeIngredient: 'Nicotinamida',
    category,
    subcategory: { es: 'Vitaminas del complejo B', en: 'B-complex vitamins' },
    species: ['Dog'],
    route: 'VO',
    indication: { es: 'Lupus eritematoso discoide · referencia', en: 'Discoid lupus erythematosus · reference' },
    ...referenceOnly,
    concentration: { es: 'Según producto', en: 'Product-specific' },
    clinicalNotes: {
      es: 'Serie clínica de baja certeza. El estudio evalúa nicotinamida asociada a tetraciclina. Confirmar protocolo dermatológico y distinguir nicotinamida de ácido nicotínico.',
      en: 'Low-certainty case series. The study evaluated nicotinamide combined with tetracycline. Verify the dermatology protocol and distinguish nicotinamide from nicotinic acid.',
    },
    bibliography: 'Guía terapéutica del animal de compañía, p. 76.\nWhite et al. (1992): https://pubmed.ncbi.nlm.nih.gov/1535346/',
  },
  {
    id: 'pyridoxine-canine-urolith-reference',
    activeIngredient: 'Piridoxina',
    category,
    subcategory: { es: 'Vitaminas del complejo B', en: 'B-complex vitamins' },
    species: ['Dog'],
    route: 'VO',
    indication: { es: 'Urolitos de oxalato cálcico · referencia', en: 'Calcium oxalate uroliths · reference' },
    ...referenceOnly,
    concentration: { es: 'Según producto', en: 'Product-specific' },
    clinicalNotes: {
      es: 'La fuente fotografiada recoge su uso. La evidencia clínica para recomendar suplementación sistemática en perros es insuficiente. Consultar el consenso para el manejo de los urolitos.',
      en: 'The photographed source lists its use. Clinical evidence is insufficient to recommend routine supplementation in dogs. See the consensus statement for urolith management.',
    },
    bibliography: 'Guía terapéutica del animal de compañía, p. 76.\n' + urolithConsensus,
  },
  {
    id: 'thiamine-feline-deficiency-reference',
    activeIngredient: 'Tiamina',
    category,
    subcategory: { es: 'Vitaminas del complejo B', en: 'B-complex vitamins' },
    species: ['Cat'],
    route: '—',
    indication: { es: 'Déficit de tiamina · referencia', en: 'Thiamine deficiency · reference' },
    ...referenceOnly,
    concentration: { es: 'Según formulación', en: 'Formulation-specific' },
    clinicalNotes: {
      es: 'La página fotografiada lista formulaciones humanas. Los casos publicados apoyan la suplementación y la corrección de la dieta en gatos con déficit. Evidencia de baja certeza basada en casos.',
      en: 'The photographed page lists human formulations. Published cases support supplementation and dietary correction in deficient cats. Low-certainty evidence from case reports.',
    },
    bibliography: 'Guía terapéutica del animal de compañía, p. 76.\nMoon et al. (2013): https://pubmed.ncbi.nlm.nih.gov/23820206/',
  },
];

export function reviewPhotographedDigestive(entry: DoseCalculatorEntry): DoseCalculatorEntry {
  switch (entry.activeIngredient) {
    case 'Apomorfina':
      return {
        ...entry,
        indication: { es: 'Inducción del vómito', en: 'Induction of vomiting' },
        clinicalNotes: {
          es: 'Emedog, dosis única subcutánea de administración veterinaria. Revisar la lista completa de contraindicaciones en la ficha: incluye depresión del SNC, riesgo de aspiración, shock e ingestión de cáusticos, volátiles, espumosos u objetos cortantes.',
          en: 'Emedog, single subcutaneous dose administered by a veterinarian. Check the full label contraindications, including CNS depression, aspiration risk, shock, and ingestion of caustics, volatile or foaming agents, or sharp objects.',
        },
        bibliography: 'AEMPS · Emedog: https://cimavet.aemps.es/cimavet/pdfs/es/ft/3283%2BESP/FT_3283%2BESP.pdf',
      };
    case 'Ropinirol':
      return {
        ...entry,
        doseText: undefined,
        frequency: undefined,
        duration: undefined,
        indication: { es: 'Inducción del vómito', en: 'Induction of vomiting' },
        clinicalNotes: {
          es: 'Clevor, uso oftálmico canino según tabla de peso. Consultar la ficha antes de repetir. Contraindicado ante ingestión de corrosivos, volátiles u objetos punzantes, depresión del SNC, convulsiones o pérdida del reflejo faríngeo.',
          en: 'Clevor, canine ophthalmic use according to the weight table. Consult the label before repeating. Contraindicated following ingestion of corrosives, volatile agents or sharp objects, and in CNS depression, seizures or loss of the pharyngeal reflex.',
        },
        bibliography: clevor,
      };
    case 'Fosfato de sodio (enema)':
      return {
        ...entry,
        ...referenceOnly,
        doseText: undefined,
        doseUnit: undefined,
        frequency: undefined,
        observations: undefined,
        indication: { es: 'Estreñimiento · alerta de seguridad', en: 'Constipation · safety alert' },
        clinicalNotes: {
          es: 'Se han descrito alteraciones electrolíticas potencialmente mortales con enemas de fosfato en perros y gatos. Evitar en gatos y valorar alternativas en perros.',
          en: 'Life-threatening electrolyte disturbances have been reported following phosphate enemas in dogs and cats. Avoid in cats and consider alternatives in dogs.',
        },
        bibliography: phosphateToxicity,
      };
    case 'Ácido ascórbico':
      return {
        ...entry,
        ...referenceOnly,
        doseText: undefined,
        doseUnit: undefined,
        frequency: undefined,
        indication: { es: 'Acidificación urinaria · referencia', en: 'Urinary acidification · reference' },
        clinicalNotes: {
          es: 'La fuente fotografiada se refiere a acidificación. La modificación del pH debe individualizarse según el tipo de urolito. El consenso ACVIM desaconseja acidificar en pacientes con urolitos de oxalato cálcico.',
          en: 'The photographed source refers to acidification. Urine pH management depends on the urolith type. ACVIM advises against acidification in calcium oxalate stone formers.',
        },
        bibliography: 'Guía terapéutica del animal de compañía, p. 77.\n' + urolithConsensus,
      };
    default:
      return entry;
  }
}
