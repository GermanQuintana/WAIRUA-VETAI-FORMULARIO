import { TherapeuticEntry } from '../types';

export const therapeuticEntries: TherapeuticEntry[] = [
  {
    id: 'amoxicillin-clavulanate',
    activeIngredient: 'Amoxicillin + Clavulanic Acid',
    tradeNames: ['Clavamox', 'Synulox'],
    species: ['Dog', 'Cat', 'Rabbit'],
    systems: ['Infectious Diseases', 'Dermatology', 'Respiratory'],
    pathologies: ['Pyoderma', 'Upper Respiratory Infection', 'Soft Tissue Infection'],
    indications: {
      es: 'Tratamiento empirico de infecciones bacterianas susceptibles mientras se esperan cultivo y antibiograma.',
      en: 'Empirical treatment of susceptible bacterial infections while culture and susceptibility are pending.',
    },
    dosage: {
      es: 'Perros: 12.5-25 mg/kg VO cada 12 h.\nGatos: 12.5-25 mg/kg VO cada 12 h.\nConejos: usar con precaucion y monitorizacion veterinaria estricta.',
      en: 'Dogs: 12.5-25 mg/kg PO q12h.\nCats: 12.5-25 mg/kg PO q12h.\nRabbits: use with caution and only under strict veterinary monitoring.',
    },
    contraindications: {
      es: 'Evitar en hipersensibilidad grave a beta-lactamicos. Reevaluar en especies con riesgo de disbiosis gastrointestinal.',
      en: 'Avoid in severe beta-lactam hypersensitivity. Reassess in GI dysbiosis risk species.',
    },
    notes: {
      es: 'Se recomienda desescalado dirigido por cultivo cuando este disponible la sensibilidad.',
      en: 'Culture-directed de-escalation is recommended once susceptibility testing becomes available.',
    },
    evidenceLevel: 'Moderate',
    references: [
      {
        id: 'ref-iscaid-2019',
        title: 'ISCAID guidelines for the diagnosis and management of bacterial urinary tract infections in dogs and cats',
        authors: 'Weese JS et al.',
        year: 2019,
        source: 'Veterinary Journal',
        url: 'https://doi.org/10.1016/j.tvjl.2019.105406',
      },
    ],
    cimavet: {
      nameQuery: 'Synulox',
    },
    lastUpdated: '2026-03-05',
  },
  {
    id: 'maropitant',
    activeIngredient: 'Maropitant',
    tradeNames: ['Cerenia'],
    species: ['Dog', 'Cat', 'Ferret'],
    systems: ['Gastroenterology', 'Oncology Support'],
    pathologies: ['Acute Vomiting', 'Motion Sickness', 'Chemotherapy-Induced Nausea'],
    indications: {
      es: 'Antiemetico para vias centrales y perifericas del vomito. Util en control multimodal de pacientes hospitalizados.',
      en: 'Antiemetic for central and peripheral emetic pathways. Useful as multimodal control in hospitalized patients.',
    },
    dosage: {
      es: 'Perros: 1 mg/kg SC/VO cada 24 h.\nGatos: 1 mg/kg SC cada 24 h o 2 mg/kg VO cada 24 h segun protocolo.',
      en: 'Dogs: 1 mg/kg SC/PO q24h.\nCats: 1 mg/kg SC q24h or 2 mg/kg PO q24h depending on protocol.',
    },
    contraindications: {
      es: 'Precaucion en disfuncion hepatica grave y en pacientes muy jovenes.',
      en: 'Use caution in severe hepatic dysfunction and in very young patients.',
    },
    evidenceLevel: 'High',
    references: [],
    cimavet: {
      nregistro: 'EU/2/06/062/005',
      nameQuery: 'Cerenia',
    },
    lastUpdated: '2026-03-05',
  },
  {
    id: 'meloxicam',
    activeIngredient: 'Meloxicam',
    tradeNames: ['Metacam', 'Meloxidyl'],
    species: ['Dog', 'Cat', 'Rabbit', 'Guinea Pig', 'Chinchilla', 'Equine'],
    systems: ['Analgesia', 'Orthopedics', 'Inflammation'],
    pathologies: ['Postoperative Pain', 'Osteoarthritis', 'Inflammatory Conditions'],
    indications: {
      es: 'AINE para control del dolor inflamatorio en especies seleccionadas, con monitorizacion renal y gastrointestinal.',
      en: 'NSAID for inflammatory pain control in selected species with renal and GI monitoring.',
    },
    dosage: {
      es: 'Perros: 0.1 mg/kg VO dosis inicial y luego 0.05 mg/kg cada 24 h.\nGatos: solo protocolos autorizados por especie.',
      en: 'Dogs: 0.1 mg/kg PO loading then 0.05 mg/kg q24h.\nCats: species-specific licensed protocols only.',
    },
    contraindications: {
      es: 'No combinar con otros AINE ni corticosteroides. Evitar en deshidratacion, hipotension o compromiso renal.',
      en: 'Do not combine with other NSAIDs or corticosteroids. Avoid in dehydration, hypotension, or renal compromise.',
    },
    evidenceLevel: 'Moderate',
    references: [],
    cimavet: {
      nameQuery: 'Metacam',
    },
    lastUpdated: '2026-03-05',
  },
  {
    id: 'itraconazole',
    activeIngredient: 'Itraconazole',
    tradeNames: ['Sporanox', 'Itrafungol'],
    species: ['Dog', 'Cat', 'Psittacines', 'Reptiles'],
    systems: ['Dermatology', 'Infectious Diseases', 'Avian Medicine', 'Exotics'],
    pathologies: ['Dermatophytosis', 'Aspergillosis', 'Systemic Mycoses'],
    indications: {
      es: 'Antifungico sistemico para infecciones por levaduras y mohos; suele requerir tratamientos prolongados y monitorizacion.',
      en: 'Systemic antifungal for yeast and mold infections, often long-course and monitoring-intensive.',
    },
    dosage: {
      es: 'Perros: 5 mg/kg VO cada 24 h en pauta continua o pulsada.\nGatos: 5 mg/kg VO cada 24 h en pauta continua o pulsada.',
      en: 'Dogs: 5 mg/kg PO q24h in pulse or continuous protocols.\nCats: 5 mg/kg PO q24h in pulse or continuous protocols.',
    },
    contraindications: {
      es: 'Monitorizar riesgo de hepatotoxicidad y posibles interacciones por metabolismo CYP.',
      en: 'Monitor hepatotoxicity risk. Adjust strategy when interacting with CYP-metabolized drugs.',
    },
    evidenceLevel: 'Moderate',
    references: [],
    cimavet: {
      nameQuery: 'Itrafungol',
    },
    lastUpdated: '2026-03-05',
  },
  {
    id: 'enrofloxacin',
    activeIngredient: 'Enrofloxacin',
    tradeNames: ['Baytril'],
    species: ['Dog', 'Cat', 'Rabbit', 'Ferret', 'Reptiles', 'Poultry', 'Equine'],
    systems: ['Infectious Diseases', 'Respiratory', 'Urology'],
    pathologies: ['Complicated UTI', 'Pneumonia', 'Gram-negative infections'],
    indications: {
      es: 'Fluoroquinolona reservada para infecciones con sensibilidad documentada y uso bajo criterios de stewardship.',
      en: 'Fluoroquinolone reserved for infections with documented susceptibility and stewardship oversight.',
    },
    dosage: {
      es: 'Perros: 5-20 mg/kg VO cada 24 h segun indicacion.\nGatos: evitar dosis altas por riesgo de toxicidad retiniana.',
      en: 'Dogs: 5-20 mg/kg PO q24h depending on indication.\nCats: avoid high doses due to retinal toxicity risk.',
    },
    contraindications: {
      es: 'Evitar uso empirico de primera linea cuando existan alternativas. Precaucion en animales en crecimiento.',
      en: 'Avoid empirical first-line use when alternatives are available. Use caution in growing animals.',
    },
    evidenceLevel: 'High',
    references: [],
    cimavet: {
      nameQuery: 'Baytril',
    },
    lastUpdated: '2026-03-05',
  },
];
