import { LocalizedText } from '../types';

export interface LocalizedCollectionCard {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  bullets?: {
    es: string[];
    en: string[];
  };
  status?: LocalizedText;
}

export const otcWorkflowCards: LocalizedCollectionCard[] = [
  {
    id: 'partner-request',
    title: { es: 'Alta bajo solicitud del laboratorio', en: 'Lab-requested onboarding' },
    description: {
      es: 'Los productos OTC solo se publicaran si el laboratorio solicita activamente formar parte del catalogo y acepta el formato de datos comun.',
      en: 'OTC products will only be published when the manufacturer actively requests inclusion and accepts the shared data format.',
    },
  },
  {
    id: 'structured-delivery',
    title: { es: 'Entrega estructurada', en: 'Structured submission' },
    description: {
      es: 'Cada laboratorio debera enviar nombre, presentacion, compuestos activos, indicaciones, bibliografia y materiales tecnicos en un formato uniforme.',
      en: 'Each manufacturer must submit name, presentation, active compounds, indications, bibliography, and technical materials in a uniform format.',
    },
  },
  {
    id: 'editorial-review',
    title: { es: 'Revision editorial y cientifica', en: 'Editorial and scientific review' },
    description: {
      es: 'WAIRUA VetAI revisara consistencia, referencias y trazabilidad antes de publicar el producto en el catalogo abierto.',
      en: 'WAIRUA VetAI will review consistency, references, and traceability before publishing any product in the open catalog.',
    },
  },
];

export const otcSubmissionFields: LocalizedCollectionCard[] = [
  {
    id: 'identity',
    title: { es: 'Identidad del producto', en: 'Product identity' },
    description: {
      es: 'Nombre comercial, laboratorio, presentacion, formato farmaceutico, especie diana y categoria funcional.',
      en: 'Trade name, manufacturer, presentation, dosage form, target species, and functional category.',
    },
  },
  {
    id: 'composition',
    title: { es: 'Composicion y activos', en: 'Composition and actives' },
    description: {
      es: 'Principios o compuestos activos, concentracion, excipientes clave y observaciones regulatorias.',
      en: 'Active principles or compounds, concentration, key excipients, and regulatory notes.',
    },
  },
  {
    id: 'claims',
    title: { es: 'Indicaciones y uso esperado', en: 'Indications and intended use' },
    description: {
      es: 'Indicaciones propuestas, contexto clinico, limitaciones de uso y claims permitidos por el fabricante.',
      en: 'Proposed indications, clinical context, use limitations, and manufacturer-approved claims.',
    },
  },
  {
    id: 'evidence',
    title: { es: 'Soporte documental', en: 'Supporting evidence' },
    description: {
      es: 'Estudios, dossiers tecnicos, fichas del producto, enlaces verificables y fecha de actualizacion.',
      en: 'Studies, technical dossiers, product sheets, verifiable links, and last-updated date.',
    },
  },
];

export const activeIngredientWorkstreams: LocalizedCollectionCard[] = [
  {
    id: 'dose-matrix',
    title: { es: 'Dosis por especie e indicacion', en: 'Dose matrix by species and indication' },
    description: {
      es: 'Cada ficha de principio activo debe evolucionar hacia una matriz clara de dosis, vias de administracion y frecuencia por especie e indicacion.',
      en: 'Each active-ingredient record should evolve into a clear matrix of dose, route, and frequency by species and indication.',
    },
  },
  {
    id: 'monitoring',
    title: { es: 'Monitorizacion y tiempos de muestreo', en: 'Monitoring and sampling windows' },
    description: {
      es: 'Protocolos de control terapeutico, tiempos pre y post administracion, y como interpretar las mediciones.',
      en: 'Therapeutic monitoring protocols, pre/post administration timing, and how to interpret measurements.',
    },
  },
  {
    id: 'protocols',
    title: { es: 'Protocolos aplicados', en: 'Applied protocols' },
    description: {
      es: 'Uso en pruebas diagnosticas, protocolos anestesicos, cronogramas de ajuste y notas practicas de seguimiento.',
      en: 'Use in diagnostic tests, anesthetic protocols, titration schedules, and practical follow-up notes.',
    },
  },
];

export const protocolFocusExamples: LocalizedCollectionCard[] = [
  {
    id: 'cosyntropin',
    title: { es: 'Cosintropina', en: 'Cosyntropin' },
    description: {
      es: 'Preparar una ficha que cubra uso diagnostico, toma de muestras y ventanas de interpretacion sin depender solo de la dosis.',
      en: 'Prepare a record covering diagnostic use, sample collection, and interpretation windows instead of dose alone.',
    },
  },
  {
    id: 'levothyroxine',
    title: { es: 'Levotiroxina', en: 'Levothyroxine' },
    description: {
      es: 'Documentar administracion, interacciones con alimento y cuando medir concentraciones o respuesta clinica.',
      en: 'Document administration, food interactions, and when to measure concentrations or clinical response.',
    },
  },
  {
    id: 'phenobarbital',
    title: { es: 'Fenobarbital', en: 'Phenobarbital' },
    description: {
      es: 'Añadir niveles terapeuticos, momento recomendado para control, ajuste escalonado y monitorizacion hepatica.',
      en: 'Add therapeutic levels, recommended sampling time, stepwise adjustment, and hepatic monitoring.',
    },
  },
  {
    id: 'cyclosporine',
    title: { es: 'Ciclosporina', en: 'Cyclosporine' },
    description: {
      es: 'Incluir tiempos de administracion, relacion con alimento, objetivos de seguimiento y protocolos de reduccion.',
      en: 'Include administration timing, food relationship, follow-up goals, and tapering protocols.',
    },
  },
];

export const toolkitModules: LocalizedCollectionCard[] = [
  {
    id: 'dose-calculator',
    title: { es: 'Calculadora de dosis', en: 'Dose calculator' },
    description: {
      es: 'Conversion rapida de mg/kg a mg, mL o comprimidos segun peso, concentracion y presentacion.',
      en: 'Fast conversion from mg/kg to mg, mL, or tablets based on weight, concentration, and presentation.',
    },
    status: { es: 'Prioridad alta', en: 'High priority' },
  },
  {
    id: 'cri',
    title: { es: 'Calculadora de CRI', en: 'CRI calculator' },
    description: {
      es: 'Preparada para infusiones continuas, diluciones, ritmo de bomba y concentraciones finales.',
      en: 'Prepared for constant-rate infusions, dilutions, pump rates, and final concentrations.',
    },
    status: { es: 'Siguiente modulo', en: 'Next module' },
  },
  {
    id: 'unit-converter',
    title: { es: 'Conversores de unidades', en: 'Unit converters' },
    description: {
      es: 'Peso, volumen, concentraciones, energia, gasometria y conversiones clinicas frecuentes.',
      en: 'Weight, volume, concentrations, energy, blood gas, and frequent clinical conversions.',
    },
    status: { es: 'En diseño', en: 'In design' },
  },
  {
    id: 'anesthesia',
    title: { es: 'Protocolos anestesicos', en: 'Anesthetic protocols' },
    description: {
      es: 'Constructor de protocolos con premedicacion, induccion, mantenimiento, rescate y monitorizacion.',
      en: 'Protocol builder with premedication, induction, maintenance, rescue, and monitoring.',
    },
    status: { es: 'Planificado', en: 'Planned' },
  },
  {
    id: 'recover',
    title: { es: 'Tablas RECOVER y urgencias', en: 'RECOVER and emergency charts' },
    description: {
      es: 'Accesos rapidos a tablas de RCP, desfibrilacion, reversores y recordatorios de emergencias.',
      en: 'Quick access to CPR, defibrillation, reversal, and emergency reminder charts.',
    },
    status: { es: 'Planificado', en: 'Planned' },
  },
  {
    id: 'custom-workflows',
    title: { es: 'Workflows clinicos', en: 'Clinical workflows' },
    description: {
      es: 'Atajos hacia formularios y guias internas para que el veterinario resuelva tareas frecuentes desde un mismo lugar.',
      en: 'Shortcuts into internal forms and guides so veterinarians can solve recurring tasks from one place.',
    },
    status: { es: 'Evolutivo', en: 'Iterative' },
  },
];

export const humanCimaCards: LocalizedCollectionCard[] = [
  {
    id: 'human-search',
    title: { es: 'Busqueda equivalente a CIMAVET', en: 'CIMAVET-like search' },
    description: {
      es: 'Buscador por nombre comercial y principio activo para medicamentos de uso humano via base CIMA de AEMPS.',
      en: 'Search by trade name and active ingredient for human medicines through the AEMPS CIMA database.',
    },
  },
  {
    id: 'cross-reference',
    title: { es: 'Cruce veterinaria-humana', en: 'Vet-to-human cross-reference' },
    description: {
      es: 'Pensado para contrastar presentaciones humanas cuando no exista alternativa veterinaria o se requiera contexto adicional.',
      en: 'Intended to cross-check human presentations when no veterinary alternative exists or additional context is needed.',
    },
  },
  {
    id: 'pending-integration',
    title: { es: 'Integracion activa', en: 'Live integration' },
    description: {
      es: 'La app ya consulta la API REST oficial de CIMA para buscar medicamentos humanos y abrir ficha tecnica o prospecto cuando estan disponibles.',
      en: 'The app now queries the official CIMA REST API to search human medicines and open the SmPC or leaflet when available.',
    },
  },
];
