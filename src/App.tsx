import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ActiveIngredientForm from './components/ActiveIngredientForm';
import AnesthesiaToolkit from './components/AnesthesiaToolkit';
import AuthAccessPanel from './components/AuthAccessPanel';
import BodySurfaceAreaCalculator from './components/BodySurfaceAreaCalculator';
import ClinicalNutritionToolkit from './components/ClinicalNutritionToolkit';
import ComingSoonToolkit from './components/ComingSoonToolkit';
import DoseCalculator from './components/DoseCalculator';
import DrugInteractionChecker from './components/DrugInteractionChecker';
import EntryCard from './components/EntryCard';
import FluidTherapyToolkit from './components/FluidTherapyToolkit';
import GeneticsToolkit from './components/GeneticsToolkit';
import InfusionCalculator from './components/InfusionCalculator';
import LegalCompliance from './components/LegalCompliance';
import ManagementToolkit from './components/ManagementToolkit';
import UnitConverter from './components/UnitConverter';
import VitalConstantsToolkit from './components/VitalConstantsToolkit';
import {
  LocalizedCollectionCard,
  otcSubmissionFields,
  otcWorkflowCards,
  toolkitModules,
} from './data/platform';
import wairuaLogo from './assets/wairua-logo.jpg';
import { otcProducts } from './data/otcProducts';
import { therapeuticEntries } from './data/entries';
import { labels, Language } from './i18n';
import {
  buildDoseCalculatorEntries,
  getIndicationOptions,
  getSpeciesOptions,
  getSystemOptions,
  getTagOptions,
} from './lib/indexes';
import { excludeEquivalentValues, normalizeStringList } from './lib/entryNormalization';
import { expandMedicalTermAliases, translateMedicalTerm, translateMedicalTerms } from './lib/terms';
import {
  buildCimaRecordUrl,
  CimaMedicationDetail,
  CimaMedicationSummary,
  createCimaServiceFromEnv,
  resolveCimaBaseUrl,
} from './services/cima';
import { createClinicalNutritionService } from './services/clinicalNutrition';
import {
  buildCimavetRecordUrl,
  getCimavetMaxWithdrawalDays,
  getCimavetWithdrawalTimeItems,
  CimavetMedicationDetail,
  CimavetMedicationSummary,
  CimavetWithdrawalTimeItem,
  createCimavetServiceFromEnv,
  resolveCimavetBaseUrl,
} from './services/cimavet';
import { createSupabaseAccessService, createSupabaseEditorialService } from './services/supabase';
import { AccessPreviewMode, AuthAccountSnapshot, LocalizedText, OtcProductRecord, TherapeuticEntry, UserRole } from './types';

gsap.registerPlugin(ScrollTrigger);

const productTabs = ['prescription', 'human', 'active', 'otc', 'toolkit'] as const;
const premiumTabs = ['active'] as const;
const activeViews = ['records', 'create'] as const;
const toolkitViews = [
  'overview',
  'dose',
  'infusion',
  'haemotherapy',
  'endocrine',
  'genetics',
  'interactions',
  'constants',
  'ranges',
  'fluid',
  'anesthesia',
  'emergency',
  'converter',
  'surface',
  'assistant',
  'nutrition',
  'management',
] as const;
const CIMA_BASE_URL = resolveCimaBaseUrl(import.meta.env.VITE_CIMA_BASE_URL);
const CIMAVET_BASE_URL = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);

type ProductTab = (typeof productTabs)[number];
type ActiveView = (typeof activeViews)[number];
type ToolkitView = (typeof toolkitViews)[number];
type EditorialQueueFilter = 'all' | 'draft' | 'review' | 'publication' | 'active' | 'rejected';

const premiumTabSet = new Set<ProductTab>(premiumTabs);
const availableToolkitViewSet = new Set<ToolkitView>([
  'dose',
  'infusion',
  'constants',
  'ranges',
  'fluid',
  'anesthesia',
  'emergency',
  'converter',
  'surface',
  'assistant',
  'nutrition',
  'management',
]);
const freeToolkitViewSet = new Set<ToolkitView>(['infusion', 'constants', 'converter', 'surface', 'management', 'fluid', 'anesthesia']);
const accessPreviewRoleMap: Record<Exclude<AccessPreviewMode, 'actual'>, UserRole[]> = {
  free_viewer: ['viewer'],
  premium_viewer: ['viewer'],
  contributor: ['contributor'],
  editor: ['editor'],
  reviewer: ['reviewer'],
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }
  return 'Unknown error';
};
const canAccessToolkitView = (view: ToolkitView, hasPremiumAccess: boolean) =>
  view === 'overview' || freeToolkitViewSet.has(view) || (hasPremiumAccess && availableToolkitViewSet.has(view));
const isCatalogSearchQuery = (value: string) =>
  ['*', 'todo', 'todos', 'toda', 'todas', 'all'].includes(value.trim().toLowerCase());
const getEffectivePublicationStatus = (entry: TherapeuticEntry) =>
  entry.publicationStatus ?? (entry.editorialStatus === 'approved' ? 'active' : 'pending_activation');
const isPendingPublicationEntry = (entry: TherapeuticEntry) =>
  entry.editorialStatus === 'approved' && getEffectivePublicationStatus(entry) === 'pending_activation';
const isActivePublishedEntry = (entry: TherapeuticEntry) =>
  entry.editorialStatus === 'approved' && getEffectivePublicationStatus(entry) === 'active';

const speciesReferenceScope: LocalizedText[] = [
  { es: 'Perro', en: 'Dog' },
  { es: 'Gato', en: 'Cat' },
  { es: 'Caballo', en: 'Horse' },
  { es: 'Bovino', en: 'Cattle' },
  { es: 'Porcino', en: 'Pig' },
  { es: 'Ovino', en: 'Sheep' },
  { es: 'Caprino', en: 'Goat' },
  { es: 'Conejo', en: 'Rabbit' },
  { es: 'Cobaya', en: 'Guinea pig' },
  { es: 'Chinchilla', en: 'Chinchilla' },
  { es: 'Hamster', en: 'Hamster' },
  { es: 'Tortuga', en: 'Tortoise / turtle' },
  { es: 'Pogona', en: 'Bearded dragon' },
  { es: 'Gecko', en: 'Gecko' },
  { es: 'Petauro', en: 'Sugar glider' },
  { es: 'Periquito', en: 'Budgerigar' },
  { es: 'Canario', en: 'Canary' },
  { es: 'Loridos y loros', en: 'Parrots and lories' },
  { es: 'Iguana', en: 'Iguana' },
];

const comingSoonToolkitContent: Record<
  'constants' | 'ranges' | 'fluid' | 'emergency',
  {
    title: LocalizedText;
    subtitle: LocalizedText;
    statusNote: LocalizedText;
    scopeTitle: LocalizedText;
    scopeLabel: LocalizedText;
    lanesTitle: LocalizedText;
    footerNote: LocalizedText;
    lanes: Array<{
      id: string;
      title: LocalizedText;
      description: LocalizedText;
    }>;
  }
> = {
  constants: {
    title: { es: 'Constantes fisiologicas y triage', en: 'Physiologic constants and triage' },
    subtitle: {
      es: 'Modulo reservado para centralizar temperatura, FC, FR, PANI/PAM, TRC, mucosas, diuresis y referencias de exploracion por especie.',
      en: 'Reserved module to centralize temperature, HR, RR, NIBP/MAP, CRT, mucous membranes, urine output, and examination references by species.',
    },
    statusNote: {
      es: 'Ya queda creada la estructura del modulo para ir completando rangos y alertas clinicas sin mezclarlo con las calculadoras.',
      en: 'The module structure is now in place so we can progressively add ranges and clinical alerts without mixing them into the calculators.',
    },
    scopeTitle: { es: 'Especies objetivo iniciales', en: 'Initial target species' },
    scopeLabel: { es: 'Cobertura prevista', en: 'Planned coverage' },
    lanesTitle: { es: 'Bloques previstos', en: 'Planned lanes' },
    footerNote: {
      es: 'Este espacio queda preparado para añadir tablas por especie, filtros por etapa vital y alertas de valores criticos.',
      en: 'This space is ready for species tables, life-stage filters, and critical value alerts.',
    },
    lanes: [
      {
        id: 'vital-signs',
        title: { es: 'Signos vitales', en: 'Vital signs' },
        description: {
          es: 'Temperatura, FC, FR, pulsos, dolor, estado mental y patrones respiratorios esperados por especie.',
          en: 'Temperature, HR, RR, pulses, pain, mentation, and expected respiratory patterns by species.',
        },
      },
      {
        id: 'perfusion-pressure',
        title: { es: 'Perfusion y PANI', en: 'Perfusion and NIBP' },
        description: {
          es: 'PANI/PAM, perfusion periferica, TRC, mucosas, lactato y diuresis como referencia de monitorizacion.',
          en: 'NIBP/MAP, peripheral perfusion, CRT, mucous membranes, lactate, and urine output as monitoring references.',
        },
      },
      {
        id: 'triage-warnings',
        title: { es: 'Alertas de triage', en: 'Triage alerts' },
        description: {
          es: 'Banderas rojas y umbrales rapidos para urgencias, UCI, anestesia y pacientes exotic-friendly.',
          en: 'Red flags and fast thresholds for ER, ICU, anesthesia, and exotic-friendly workflows.',
        },
      },
    ],
  },
  ranges: {
    title: { es: 'Rangos laboratoriales', en: 'Laboratory ranges' },
    subtitle: {
      es: 'Espacio para agrupar hemograma, bioquimica, electrolitos y gasometria con referencias comparables por especie.',
      en: 'Workspace to group CBC, biochemistry, electrolytes, and blood gases with comparable references by species.',
    },
    statusNote: {
      es: 'Queda preparado para crecer como repositorio de consulta rapida junto a filtros por especie, edad y contexto clinico.',
      en: 'Prepared to grow as a quick-reference repository with filters by species, age, and clinical context.',
    },
    scopeTitle: { es: 'Especies previstas', en: 'Planned species' },
    scopeLabel: { es: 'Primer alcance', en: 'First scope' },
    lanesTitle: { es: 'Bloques previstos', en: 'Planned lanes' },
    footerNote: {
      es: 'La idea es poder navegar por laboratorio sin salir del toolkit y enlazar despues interpretaciones y causas frecuentes.',
      en: 'The goal is to navigate lab references without leaving the toolkit and later connect them to interpretations and common causes.',
    },
    lanes: [
      {
        id: 'hematology',
        title: { es: 'Hematologia', en: 'Hematology' },
        description: {
          es: 'RBC, HCT, Hb, leucograma y plaquetas con rangos base y notas sobre juveniles o geriatria.',
          en: 'RBC, HCT, Hb, leukogram, and platelets with baseline ranges plus juvenile and geriatric notes.',
        },
      },
      {
        id: 'biochemistry',
        title: { es: 'Bioquimica y electrolitos', en: 'Biochemistry and electrolytes' },
        description: {
          es: 'Renal, hepatica, glucosa, proteinas, calcio, fosforo, sodio, potasio y cloro por especie.',
          en: 'Renal, hepatic, glucose, protein, calcium, phosphorus, sodium, potassium, and chloride values by species.',
        },
      },
      {
        id: 'acid-base',
        title: { es: 'Gasometria y equilibrio acido-base', en: 'Blood gases and acid-base' },
        description: {
          es: 'pH, pCO2, HCO3, BE, lactato y patrones de interpretacion rapida en urgencias y UCI.',
          en: 'pH, pCO2, HCO3, base excess, lactate, and fast interpretation patterns for ER and ICU.',
        },
      },
    ],
  },
  fluid: {
    title: { es: 'Fluidoterapia', en: 'Fluid therapy' },
    subtitle: {
      es: 'Modulo reservado para planes de mantenimiento, deficit, perdidas continuas, reanimacion y suplementaciones.',
      en: 'Reserved module for maintenance, deficit, ongoing-loss, resuscitation, and supplementation plans.',
    },
    statusNote: {
      es: 'Lo dejo estructurado para poder desarrollar despues calculo de fluidos por especie y contexto sin rehacer la navegacion.',
      en: 'Structured so we can later build species-first fluid calculations without reworking navigation.',
    },
    scopeTitle: { es: 'Especies previstas', en: 'Planned species' },
    scopeLabel: { es: 'Base de trabajo', en: 'Working base' },
    lanesTitle: { es: 'Bloques previstos', en: 'Planned lanes' },
    footerNote: {
      es: 'Aqui podremos enlazar constantes, perfusion y objetivos de diuresis con calculos y advertencias de seguridad.',
      en: 'Here we will be able to connect constants, perfusion, and urine-output goals with calculations and safety warnings.',
    },
    lanes: [
      {
        id: 'maintenance-deficit',
        title: { es: 'Mantenimiento y deficit', en: 'Maintenance and deficit' },
        description: {
          es: 'Calculo de mantenimiento, porcentaje de deshidratacion y reposicion progresiva por especie.',
          en: 'Maintenance, dehydration percentage, and staged replacement calculations by species.',
        },
      },
      {
        id: 'ongoing-losses',
        title: { es: 'Perdidas continuas', en: 'Ongoing losses' },
        description: {
          es: 'Vomitos, diarrea, poliuria, drenajes y ajustes de ritmo con reevaluacion seriada.',
          en: 'Vomiting, diarrhea, polyuria, drains, and rate adjustments with serial reassessment.',
        },
      },
      {
        id: 'supplementation',
        title: { es: 'Suplementacion y seguridad', en: 'Supplementation and safety' },
        description: {
          es: 'Potasio, glucosa, calcio, limites de infusion y recordatorios de mezcla segura.',
          en: 'Potassium, glucose, calcium, infusion limits, and safe-mixing reminders.',
        },
      },
    ],
  },
  emergency: {
    title: { es: 'Urgencias y RECOVER', en: 'Emergency and RECOVER' },
    subtitle: {
      es: 'Espacio reservado para algoritmos rapidos de actuacion, tablas RESUS/RECOVER, reversores y crisis frecuentes.',
      en: 'Reserved space for rapid-response algorithms, RESUS/RECOVER charts, reversal agents, and common crises.',
    },
    statusNote: {
      es: 'La estructura queda ya lista para ir cargando protocolos muy operativos sin dispersarlos en varias calculadoras.',
      en: 'The structure is ready to absorb highly practical protocols without scattering them across multiple calculators.',
    },
    scopeTitle: { es: 'Especies previstas', en: 'Planned species' },
    scopeLabel: { es: 'Cobertura de urgencias', en: 'Emergency scope' },
    lanesTitle: { es: 'Bloques previstos', en: 'Planned lanes' },
    footerNote: {
      es: 'La idea es combinar checklist, dosis de rescate, tablas de referencia y acceso ultrarrapido para situaciones criticas.',
      en: 'The idea is to combine checklists, rescue doses, reference charts, and ultra-fast access for critical situations.',
    },
    lanes: [
      {
        id: 'recover-cpr',
        title: { es: 'RCP y RECOVER', en: 'CPR and RECOVER' },
        description: {
          es: 'Compresiones, ventilacion, ritmos, desfibrilacion, adrenalina y checklists de parada.',
          en: 'Compressions, ventilation, rhythms, defibrillation, epinephrine, and arrest checklists.',
        },
      },
      {
        id: 'critical-events',
        title: { es: 'Eventos criticos', en: 'Critical events' },
        description: {
          es: 'Anafilaxia, hipoglucemia, status epilepticus, golpe de calor y shock con pasos iniciales claros.',
          en: 'Anaphylaxis, hypoglycemia, status epilepticus, heatstroke, and shock with clear first steps.',
        },
      },
      {
        id: 'reversal-tox',
        title: { es: 'Reversores y toxicos', en: 'Reversal agents and toxics' },
        description: {
          es: 'Recordatorios rapidos de antagonistas, antidosis y notas de monitorizacion asociada.',
          en: 'Quick reminders for antagonists, antidotes, and associated monitoring notes.',
        },
      },
    ],
  },
};

const getCimaDocumentUrl = (medication: Pick<CimaMedicationSummary, 'docs'> | undefined, type: number) => {
  const doc = medication?.docs?.find((item) => item.tipo === type);
  return doc?.urlHtml ?? doc?.url ?? null;
};

const getCimavetDocumentUrl = (medication: Pick<CimavetMedicationDetail, 'docs'> | undefined | null, type: number) => {
  const doc = medication?.docs?.find((item) => item.tipo === type);
  return doc?.url ?? null;
};

const normalizeFilterText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const structuredFilterTokenPattern = /[a-z]+|\d+(?:[.,]\d+)?/gi;

const getStructuredFilterTokens = (value: string) => normalizeFilterText(value).match(structuredFilterTokenPattern) ?? [];

const normalizeNumericToken = (value: string) => {
  const normalized = value.replace(',', '.');
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return normalized;
  return String(amount);
};

const matchesStructuredFilter = (text: string, query: string) => {
  const normalizedQuery = normalizeFilterText(query);
  if (!normalizedQuery) return true;

  const normalizedText = normalizeFilterText(text);
  const textTokens = getStructuredFilterTokens(normalizedText);
  const queryTokens = getStructuredFilterTokens(normalizedQuery);

  if (queryTokens.length === 0) return normalizedText.includes(normalizedQuery);

  return queryTokens.every((token) => {
    if (/^\d+(?:[.,]\d+)?$/.test(token)) {
      const normalizedToken = normalizeNumericToken(token);
      return textTokens.some(
        (candidate) => /^\d+(?:[.,]\d+)?$/.test(candidate) && normalizeNumericToken(candidate) === normalizedToken,
      );
    }

    return normalizedText.includes(token);
  });
};

const formatDelimitedText = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');

type PresentationCodeItem = { cn?: string; nombre: string; comerc?: boolean };

const getPresentationCodeItems = (presentations?: PresentationCodeItem[] | null) => {
  const seen = new Set<string>();

  return (presentations ?? [])
    .filter((item) => {
      const key = `${item.cn ?? ''}::${item.nombre}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => Number(right.comerc === true) - Number(left.comerc === true));
};

const formatNationalCodeSummary = (presentations?: PresentationCodeItem[] | null) => {
  const items = getPresentationCodeItems(presentations);
  if (items.length === 0) return '-';
  if (items.length === 1) return items[0].cn?.trim() || '-';
  return 'Ver presentaciones';
};

const formatPresentationCodeLine = (item: PresentationCodeItem) => (item.cn ? `${item.nombre} · CN ${item.cn}` : item.nombre);

const renderPresentationCodeLine = (item: PresentationCodeItem, lang: Language) => {
  const statusLabel =
    item.comerc === true
      ? lang === 'es'
        ? 'Comercializada'
        : 'Commercialized'
      : item.comerc === false
        ? lang === 'es'
          ? 'No comercializada'
          : 'Not commercialized'
        : '';

  return (
    <span className="presentation-code-line">
      {item.comerc !== undefined ? (
        <span
          className={`presentation-status-dot ${item.comerc ? 'is-available' : 'is-unavailable'}`}
          aria-label={statusLabel}
          title={statusLabel}
        />
      ) : null}
      <span>{formatPresentationCodeLine(item)}</span>
    </span>
  );
};

const renderLiveCollapsibleSection = <T,>({
  medicationId,
  keyPrefix,
  title,
  items,
  renderItem,
}: {
  medicationId: string;
  keyPrefix: string;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}) =>
  items.length > 0 ? (
    <details className="live-indications live-collapsible">
      <summary>
        <span>{title}</span>
        <strong>{items.length}</strong>
      </summary>
      <ul>
        {items.map((item, index) => (
          <li key={`${medicationId}-${keyPrefix}-${index}`}>{renderItem(item, index)}</li>
        ))}
      </ul>
    </details>
  ) : null;

const renderPresentationCodeDetails = (medicationId: string, items: PresentationCodeItem[], lang: Language, keyPrefix: string) =>
  renderLiveCollapsibleSection({
    medicationId,
    keyPrefix,
    title: lang === 'es' ? 'Presentaciones y CN' : 'Presentations and national code',
    items,
    renderItem: (item) => renderPresentationCodeLine(item, lang),
  });

const hasEquivalentMedicalTerm = (left: string, right: string) => {
  const leftAliases = new Set(expandMedicalTermAliases(left));
  return expandMedicalTermAliases(right).some((alias) => leftAliases.has(alias));
};

const getMedicalOptionKeys = (value: string, lang: Language) =>
  Array.from(
    new Set(
      [
        value,
        translateMedicalTerm(value, lang),
        ...expandMedicalTermAliases(value),
        ...expandMedicalTermAliases(translateMedicalTerm(value, lang)),
      ]
        .map(normalizeFilterText)
        .filter(Boolean),
    ),
  );

const hasEquivalentOption = (left: string, right: string, lang: Language) => {
  const rightKeys = new Set(getMedicalOptionKeys(right, lang));
  return getMedicalOptionKeys(left, lang).some((key) => rightKeys.has(key));
};

const getUniqueMedicalOptions = (values: string[], lang: Language) => {
  const options: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (options.some((option) => hasEquivalentOption(option, trimmed, lang))) return;
    options.push(trimmed);
  });

  return options.sort((left, right) =>
    translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
  );
};

const toggleEquivalentTag = (current: string[], value: string) => {
  const exists = current.some((item) => hasEquivalentMedicalTerm(item, value));
  if (exists) {
    return current.filter((item) => !hasEquivalentMedicalTerm(item, value));
  }
  return [...current, value];
};

const productionSpeciesOptions = ['Bovine', 'Ovine', 'Caprine', 'Porcine', 'Poultry', 'Equine', 'Fish', 'Bee'] as const;
const SUPPORT_EMAIL = 'gerqd79@gmail.com';

const formatDecimal = (value: number) => {
  const rounded = value >= 10 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return rounded.replace(/\.0$/, '');
};

const formatWithdrawalSummary = (days: number, lang: Language) => {
  if (days < 1) return `${formatDecimal(days * 24)} h`;
  return `${formatDecimal(days)} ${lang === 'es' ? 'dias' : 'days'}`;
};

const formatAccessDate = (lang: Language, isoDate?: string) =>
  isoDate
    ? new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
        dateStyle: 'medium',
      }).format(new Date(isoDate))
    : '--';

const formatWithdrawalTimeItem = (item: CimavetWithdrawalTimeItem) => {
  const prefix = item.especie?.nombre ? `${item.especie.nombre} · ` : '';
  const tissue = item.tejido?.nombre ?? 'Tejido no especificado';

  if (item.observaciones) return `${prefix}${tissue}: ${item.observaciones}`;

  const amount = item.cantidad?.trim();
  const unit = item.unidadTiempo?.nombre?.trim();
  if (amount && unit) return `${prefix}${tissue}: ${amount} ${unit}`;
  if (amount) return `${prefix}${tissue}: ${amount}`;
  return `${prefix}${tissue}`;
};

const getVetDoseFilterText = (medication: CimavetMedicationSummary) => medication.nombre;

const getVetPresentationFilterText = (medication: CimavetMedicationSummary, detail?: CimavetMedicationDetail | null) =>
  [
    medication.forma?.nombre,
    medication.formasFarmaceuticas?.map((item) => item.nombre).join(' '),
    medication.viasAdministracion?.map((item) => item.nombre).join(' '),
    detail?.presentaciones?.map((item) => item.nombre).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

const getOtcSearchableText = (product: OtcProductRecord) =>
  [
    product.productName,
    product.manufacturer,
    product.portfolio ?? '',
    product.productType.label.es,
    product.productType.label.en,
    product.category.label.es,
    product.category.label.en,
    product.format,
    product.presentations.join(' '),
    product.activeCompounds,
    product.summary.es,
    product.summary.en,
    ...product.species,
    ...(product.searchTerms ?? []),
  ]
    .filter(Boolean)
    .join(' ');

const hasLongOtcBadgeRow = (product: OtcProductRecord, lang: Language) =>
  [product.productType.label[lang], product.category.label[lang]].some((label) => label.length > 18);

const getDoseRangeLabel = (min: number, max: number) => (min === max ? `${min} mg/kg` : `${min}-${max} mg/kg`);

const getEntryIndicationFilterValues = (entry: TherapeuticEntry) =>
  [
    ...entry.pathologies,
    entry.indications.es,
    entry.indications.en,
    ...(entry.calculatorPresets ?? []).flatMap((preset) => [preset.indication.es, preset.indication.en]),
  ].filter(Boolean);

const getEntryConcentrationFilterText = (entry: TherapeuticEntry) =>
  [
    ...entry.concentrations,
    entry.dosage.es,
    entry.dosage.en,
    ...(entry.calculatorPresets ?? []).flatMap((preset) => [
      preset.concentration.es,
      preset.concentration.en,
      getDoseRangeLabel(preset.doseRangeMgKg.min, preset.doseRangeMgKg.max),
      `${preset.defaultDoseMgKg} mg/kg`,
      preset.route,
    ]),
  ]
    .filter(Boolean)
    .join(' ');

const getMedicationNameFilterText = (medication: Pick<CimavetMedicationSummary | CimaMedicationSummary, 'nombre'>) => medication.nombre;

const filterTherapeuticEntries = (
  entries: TherapeuticEntry[],
  query: string,
  selectedSpecies: string,
  selectedIndication: string,
  selectedTags: string[],
  concentrationQuery: string,
) => {
  const loweredQuery = isCatalogSearchQuery(query) ? '' : query.trim().toLowerCase();
  const loweredConcentration = concentrationQuery.trim().toLowerCase();

  return entries.filter((entry) => {
    const inSpecies = selectedSpecies ? entry.species.some((value) => value === selectedSpecies) : true;
    const inIndication = selectedIndication
      ? getEntryIndicationFilterValues(entry).some(
          (value) =>
            matchesStructuredFilter(value, selectedIndication) ||
            hasEquivalentMedicalTerm(value, selectedIndication) ||
            hasEquivalentMedicalTerm(selectedIndication, value),
        )
      : true;
    const facetValues = Array.from(new Set([...entry.tags, ...entry.systems, ...entry.pathologies]));
    const inTags =
      selectedTags.length > 0
        ? facetValues.some((tag) => selectedTags.some((selectedTag) => hasEquivalentMedicalTerm(selectedTag, tag)))
        : true;
    const inConcentration = loweredConcentration
      ? matchesStructuredFilter(getEntryConcentrationFilterText(entry), concentrationQuery)
      : true;

    if (!loweredQuery) return inSpecies && inIndication && inTags && inConcentration;

    const translatedAliases = [...entry.pathologies, ...entry.systems, ...entry.species, ...entry.tags].flatMap((term) =>
      expandMedicalTermAliases(term),
    );

    const searchable = [
      entry.activeIngredient,
      ...entry.tradeNames,
      ...entry.pathologies,
      ...entry.systems,
      ...entry.species,
      ...entry.tags,
      ...entry.concentrations,
      entry.indications.es,
      entry.indications.en,
      entry.dosage.es,
      entry.dosage.en,
      entry.administrationConditions.es,
      entry.administrationConditions.en,
      entry.adverseEffects.es,
      entry.adverseEffects.en,
      entry.contraindications.es,
      entry.contraindications.en,
      entry.interactions.es,
      entry.interactions.en,
      entry.notes?.es ?? '',
      entry.notes?.en ?? '',
      ...translatedAliases,
    ]
      .join(' ')
      .toLowerCase();

    return inSpecies && inIndication && inTags && inConcentration && searchable.includes(loweredQuery);
  });
};

function App() {
  const livePageSizeOptions = [12, 24, 'all'] as const;
  const activeRecordPageSizeOptions = [12, 24, 'all'] as const;

  const [entryCatalog, setEntryCatalog] = useState<TherapeuticEntry[]>(therapeuticEntries);
  const [editingEntry, setEditingEntry] = useState<TherapeuticEntry | null>(null);
  const [lang, setLang] = useState<Language>('es');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<ProductTab>('prescription');
  const [activeKnowledgeView, setActiveKnowledgeView] = useState<ActiveView>('records');
  const [activeToolkitView, setActiveToolkitView] = useState<ToolkitView>('overview');
  const [isLiveExpanded, setIsLiveExpanded] = useState(true);

  const [rxQuery, setRxQuery] = useState('');
  const [rxSpecies, setRxSpecies] = useState('');
  const [rxIndication, setRxIndication] = useState('');
  const [rxDoseFilter, setRxDoseFilter] = useState('');
  const [rxPresentationFilter, setRxPresentationFilter] = useState('');
  const [rxOnlyCommercialized, setRxOnlyCommercialized] = useState(false);
  const [rxSortByShortestWithdrawal, setRxSortByShortestWithdrawal] = useState(false);
  const [livePageSize, setLivePageSize] = useState<(typeof livePageSizeOptions)[number]>(24);
  const [livePage, setLivePage] = useState(1);

  const [activeQuery, setActiveQuery] = useState('');
  const [activeSpecies, setActiveSpecies] = useState('');
  const [activeIndication, setActiveIndication] = useState('');
  const [activeConcentrationQuery, setActiveConcentrationQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isActiveTagFilterExpanded, setIsActiveTagFilterExpanded] = useState(false);
  const [isActiveVetExpanded, setIsActiveVetExpanded] = useState(true);
  const [isActiveHumanExpanded, setIsActiveHumanExpanded] = useState(true);
  const [activeRecordPageSize, setActiveRecordPageSize] = useState<(typeof activeRecordPageSizeOptions)[number]>(24);
  const [activeRecordPage, setActiveRecordPage] = useState(1);
  const [editorialQueueFilter, setEditorialQueueFilter] = useState<EditorialQueueFilter>('all');

  const [humanQuery, setHumanQuery] = useState('');
  const [humanDoseFilter, setHumanDoseFilter] = useState('');
  const [humanPresentationFilter, setHumanPresentationFilter] = useState('');
  const [humanOnlyCommercialized, setHumanOnlyCommercialized] = useState(false);
  const [humanPageSize, setHumanPageSize] = useState<(typeof livePageSizeOptions)[number]>(24);
  const [humanPage, setHumanPage] = useState(1);

  const [otcQuery, setOtcQuery] = useState('');
  const [otcManufacturer, setOtcManufacturer] = useState('');
  const [otcSpecies, setOtcSpecies] = useState('');
  const [otcCategory, setOtcCategory] = useState('');
  const [otcType, setOtcType] = useState('');
  const [otcPageSize, setOtcPageSize] = useState<(typeof livePageSizeOptions)[number]>(24);
  const [otcPage, setOtcPage] = useState(1);
  const [isOtcWorkflowExpanded, setIsOtcWorkflowExpanded] = useState(false);

  const [liveResults, setLiveResults] = useState<CimavetMedicationSummary[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveDetails, setLiveDetails] = useState<Record<string, CimavetMedicationDetail>>({});
  const [humanResults, setHumanResults] = useState<CimaMedicationSummary[]>([]);
  const [humanLoading, setHumanLoading] = useState(false);
  const [humanError, setHumanError] = useState<string | null>(null);
  const [humanDetails, setHumanDetails] = useState<Record<string, CimaMedicationDetail>>({});
  const [activeVetResults, setActiveVetResults] = useState<CimavetMedicationSummary[]>([]);
  const [activeVetLoading, setActiveVetLoading] = useState(false);
  const [activeVetError, setActiveVetError] = useState<string | null>(null);
  const [activeVetDetails, setActiveVetDetails] = useState<Record<string, CimavetMedicationDetail>>({});
  const [activeHumanResults, setActiveHumanResults] = useState<CimaMedicationSummary[]>([]);
  const [activeHumanLoading, setActiveHumanLoading] = useState(false);
  const [activeHumanError, setActiveHumanError] = useState<string | null>(null);
  const [activeHumanDetails, setActiveHumanDetails] = useState<Record<string, CimaMedicationDetail>>({});
  const [activeOfficialPageSize, setActiveOfficialPageSize] = useState<(typeof livePageSizeOptions)[number]>(12);
  const [activeVetPage, setActiveVetPage] = useState(1);
  const [activeHumanPage, setActiveHumanPage] = useState(1);

  const [assistantSpecies, setAssistantSpecies] = useState('');
  const [assistantPathology, setAssistantPathology] = useState('');
  const [assistantWeight, setAssistantWeight] = useState('');
  const [assistantNotes, setAssistantNotes] = useState('');
  const [assistantGenerated, setAssistantGenerated] = useState(false);
  const [remoteSyncMessage, setRemoteSyncMessage] = useState('');
  const [authAccount, setAuthAccount] = useState<AuthAccountSnapshot | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessPreviewMode, setAccessPreviewMode] = useState<AccessPreviewMode>('actual');
  const [supportFeedback, setSupportFeedback] = useState('');
  const [isSupportFormOpen, setIsSupportFormOpen] = useState(false);
  const [supportIssueType, setSupportIssueType] = useState('incidencia');
  const [supportIssueText, setSupportIssueText] = useState('');
  const [supportIssueStatus, setSupportIssueStatus] = useState('');
  const [supportIssueSubmitting, setSupportIssueSubmitting] = useState(false);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const authResolvedRef = useRef(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const cimaService = useMemo(() => createCimaServiceFromEnv(), []);
  const cimavetService = useMemo(() => createCimavetServiceFromEnv(), []);
  const clinicalNutritionService = useMemo(() => createClinicalNutritionService(), []);
  const supabaseAccessService = useMemo(() => createSupabaseAccessService(), []);
  const supabaseEditorialService = useMemo(() => createSupabaseEditorialService(), []);
  const t = labels[lang];
  const activeConcentrationPlaceholder = lang === 'es' ? 'Ejemplo: 10 mg/mL, 50 mg...' : 'Example: 10 mg/mL, 50 mg...';
  const accessText =
    lang === 'es'
      ? {
          loading: 'Comprobando acceso seguro...',
          loadingBody: 'Estamos validando la sesión y preparando tu acceso a la guía terapéutica.',
          freeBadge: 'Gratis',
          premiumBadge: 'Premium',
          lockedBadge: 'Bloqueado',
          lockedTitle: 'Disponible con premium',
          accessKicker: 'Acceso del usuario',
          accessTitle: 'Tu cuenta entra primero. Después decides hasta dónde llega el acceso.',
          accessBody:
            'Las áreas gratuitas quedan disponibles siempre tras iniciar sesión. La prueba gratuita abre también las funciones premium durante unos días y después se limita el acceso si no hay plan activo.',
          freeTitle: 'Incluido con tu cuenta',
          freeBody: 'Puedes consultar medicación veterinaria oficial y el catálogo OTC siempre que tengas sesión iniciada.',
          premiumTitle: 'Premium clínica',
          premiumBodyActive: 'Tu prueba o plan activo mantiene desbloqueadas la base colaborativa, la parte humana y el toolkit.',
          premiumBodyLocked: 'La prueba premium ha terminado o todavía no está activada. Mantienes acceso a la parte gratuita.',
          freeFeatureOne: t.prescriptionHub,
          freeFeatureTwo: t.otcHub,
          premiumFeatureOne: t.humanHub,
          premiumFeatureTwo: t.activeHub,
          premiumFeatureThree: t.toolkitHub,
          statusTrial: 'Prueba activa hasta',
          statusPremium: 'Premium activa',
          statusLimited: 'Acceso limitado a la zona gratuita',
          statusNoPlan: 'Cuenta autenticada sin prueba activada',
          activateHint: 'Puedes activar o cambiar el plan desde el panel "Mi acceso".',
          limitedHint: 'Las pestañas premium quedan visibles, pero bloqueadas hasta reactivar el plan.',
          supportLabel: 'Soporte',
          supportMail: 'Escribir',
          supportCopy: 'Copiar email',
          supportCopied: 'Email copiado',
          supportTitle: 'Bugs, incidencias, ideas o propuestas',
        }
      : {
          loading: 'Checking secure access...',
          loadingBody: 'We are validating the session and preparing your access to the therapeutic guide.',
          freeBadge: 'Free',
          premiumBadge: 'Premium',
          lockedBadge: 'Locked',
          lockedTitle: 'Available with premium',
          accessKicker: 'User access',
          accessTitle: 'Your account enters first. Then access is shaped by the plan.',
          accessBody:
            'Free areas remain available after sign-in. The free trial also opens premium functions for a few days and later access becomes limited unless a paid plan stays active.',
          freeTitle: 'Included with your account',
          freeBody: 'You can always use the official veterinary medication search and the OTC catalog once you are signed in.',
          premiumTitle: 'Clinical premium',
          premiumBodyActive: 'Your trial or active plan keeps the collaborative knowledge base, human section, and toolkit unlocked.',
          premiumBodyLocked: 'The premium trial has ended or is not active yet. Free areas remain available.',
          freeFeatureOne: t.prescriptionHub,
          freeFeatureTwo: t.otcHub,
          premiumFeatureOne: t.humanHub,
          premiumFeatureTwo: t.activeHub,
          premiumFeatureThree: t.toolkitHub,
          statusTrial: 'Trial active until',
          statusPremium: 'Premium active',
          statusLimited: 'Access limited to free areas',
          statusNoPlan: 'Signed-in account without active trial',
          activateHint: 'You can activate or change the plan from the "My access" panel.',
          limitedHint: 'Premium tabs remain visible but locked until the plan is reactivated.',
          supportLabel: 'Support',
          supportMail: 'Write',
          supportCopy: 'Copy email',
          supportCopied: 'Email copied',
          supportTitle: 'Bugs, issues, ideas, or proposals',
        };

  const visibilityActualProfileRoles = authAccount?.profile?.roles ?? [authAccount?.profile?.role ?? 'viewer'];
  const visibilityEffectiveProfileRoles =
    visibilityActualProfileRoles.includes('admin') && accessPreviewMode !== 'actual'
      ? accessPreviewRoleMap[accessPreviewMode]
      : visibilityActualProfileRoles;
  const canViewUnpublishedEntries = visibilityEffectiveProfileRoles.some((role) => ['editor', 'reviewer', 'admin'].includes(role));
  const entriesVisibleToCurrentUser = useMemo(
    () => (canViewUnpublishedEntries ? entryCatalog : entryCatalog.filter(isActivePublishedEntry)),
    [canViewUnpublishedEntries, entryCatalog],
  );

  const speciesOptions = useMemo(() => getSpeciesOptions(entriesVisibleToCurrentUser), [entriesVisibleToCurrentUser]);
  const sortedSpeciesOptions = useMemo(
    () =>
      [...speciesOptions].sort((left, right) =>
        translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
      ),
    [lang, speciesOptions],
  );
  const prescriptionSpeciesOptions = useMemo(
    () =>
      Array.from(new Set([...speciesOptions, ...productionSpeciesOptions])).sort((left, right) =>
        translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
      ),
    [lang, speciesOptions],
  );
  const systemOptions = useMemo(() => getSystemOptions(entriesVisibleToCurrentUser), [entriesVisibleToCurrentUser]);
  const localIndicationOptions = useMemo(() => getIndicationOptions(entriesVisibleToCurrentUser), [entriesVisibleToCurrentUser]);
  const activeIndicationOptions = useMemo(
    () =>
      getUniqueMedicalOptions(
        [
          ...localIndicationOptions,
          ...Object.values(activeVetDetails).flatMap((detail) => detail.indicaciones?.map((item) => item.nombre) ?? []),
        ],
        lang,
      ),
    [activeVetDetails, lang, localIndicationOptions],
  );
  const tagOptions = useMemo(() => getTagOptions(entriesVisibleToCurrentUser), [entriesVisibleToCurrentUser]);
  const formTagOptions = useMemo(
    () => Array.from(new Set([...tagOptions, ...systemOptions])).sort((a, b) => a.localeCompare(b)),
    [systemOptions, tagOptions],
  );
  const activeFacetOptions = useMemo(
    () => Array.from(new Set([...formTagOptions, ...localIndicationOptions])).sort((a, b) => a.localeCompare(b)),
    [formTagOptions, localIndicationOptions],
  );
  const sortedTagOptions = useMemo(
    () =>
      [...activeFacetOptions].sort((left, right) =>
        translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
      ),
    [activeFacetOptions, lang],
  );
  const doseCalculatorEntries = useMemo(() => buildDoseCalculatorEntries(entriesVisibleToCurrentUser), [entriesVisibleToCurrentUser]);
  const pathologyOptions = useMemo(
    () => Array.from(new Set(entriesVisibleToCurrentUser.flatMap((entry) => entry.pathologies))).sort((a, b) => a.localeCompare(b)),
    [entriesVisibleToCurrentUser],
  );
  const otcManufacturerOptions = useMemo(
    () => Array.from(new Set(otcProducts.map((product) => product.manufacturer))).sort((a, b) => a.localeCompare(b)),
    [],
  );
  const otcSpeciesOptions = useMemo(
    () =>
      Array.from(new Set(otcProducts.flatMap((product) => product.species))).sort((left, right) =>
        translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
      ),
    [lang],
  );
  const otcCategoryOptions = useMemo(
    () =>
      Array.from(new Map(otcProducts.map((product) => [product.category.key, product.category])).values()).sort((left, right) =>
        left.label[lang].localeCompare(right.label[lang], lang === 'es' ? 'es' : 'en'),
      ),
    [lang],
  );
  const otcTypeOptions = useMemo(
    () =>
      Array.from(new Map(otcProducts.map((product) => [product.productType.key, product.productType])).values()).sort(
        (left, right) => left.label[lang].localeCompare(right.label[lang], lang === 'es' ? 'es' : 'en'),
      ),
    [lang],
  );

  useEffect(() => {
    if (!supabaseAccessService) {
      setAuthAccount(null);
      setAuthLoading(false);
      return;
    }

    let ignore = false;

    const loadAuthAccount = async () => {
      if (!ignore && !authResolvedRef.current) setAuthLoading(true);

      try {
        const snapshot = await supabaseAccessService.getAccountSnapshot();
        if (!ignore) setAuthAccount(snapshot);
      } catch {
        if (!ignore) setAuthAccount({ profile: null, membership: null, clinicAccess: null, email: null });
      } finally {
        authResolvedRef.current = true;
        if (!ignore) setAuthLoading(false);
      }
    };

    void loadAuthAccount();

    const {
      data: { subscription },
    } = supabaseAccessService.onAuthStateChange(() => {
      void loadAuthAccount();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [supabaseAccessService]);

  useEffect(() => {
    if (!authAccount?.profile || !appShellRef.current) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const revealTargets = [
        '.app-topbar > *',
        '.product-tabs button',
        '.workspace-main > *',
      ];

      gsap.set(revealTargets, { willChange: 'transform, opacity' });

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .from('.app-topbar > *', { y: 22, opacity: 0, stagger: 0.08, duration: 0.58 })
        .from('.product-tabs button', { y: 14, opacity: 0, stagger: 0.05, duration: 0.32 }, '-=0.26')
        .from('.workspace-main > *', { y: 24, opacity: 0, stagger: 0.06, duration: 0.5 }, '-=0.12');

      if (backdropRef.current) {
        gsap.to(backdropRef.current, {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: appShellRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, appShellRef);

    return () => ctx.revert();
  }, [authAccount, lang, theme]);

  const refreshAuthAccount = async () => {
    if (!supabaseAccessService) {
      setAuthAccount(null);
      setAuthLoading(false);
      return;
    }

    try {
      const snapshot = await supabaseAccessService.getAccountSnapshot();
      setAuthAccount(snapshot);
    } catch {
      setAuthAccount({ profile: null, membership: null, clinicAccess: null, email: null });
    } finally {
      setAuthLoading(false);
    }
  };

  const membership = authAccount?.membership ?? null;
  const hasClinicAccess = Boolean(authAccount?.clinicAccess);
  const accountType = authAccount?.profile?.accountType ?? 'free';
  const isAuthenticated = Boolean(authAccount?.profile);
  const trialEndsAtTime = membership?.trialEndsAt ? new Date(membership.trialEndsAt).getTime() : null;
  const isTrialExpired = Boolean(membership && membership.status !== 'active' && trialEndsAtTime && trialEndsAtTime < Date.now());
  const hasManualPremiumAccess = ['premium', 'company', 'partner'].includes(accountType);
  const actualHasPremiumAccess = Boolean(
    hasClinicAccess ||
      hasManualPremiumAccess ||
      (membership && (membership.status === 'active' || (membership.status === 'trialing' && !isTrialExpired))),
  );
  const actualProfileRoles = authAccount?.profile?.roles ?? [authAccount?.profile?.role ?? 'viewer'];
  const isActualAdmin = actualProfileRoles.includes('admin');
  const effectiveProfileRoles =
    isActualAdmin && accessPreviewMode !== 'actual' ? accessPreviewRoleMap[accessPreviewMode] : actualProfileRoles;
  const hasPremiumAccess =
    isActualAdmin && accessPreviewMode !== 'actual'
      ? accessPreviewMode !== 'free_viewer'
      : actualHasPremiumAccess;
  const hasToolkitAccess = hasPremiumAccess || (isActualAdmin && accessPreviewMode === 'actual');
  const accessStatusMessage = hasPremiumAccess ? accessText.premiumBadge : lang === 'es' ? 'Gratuita' : 'Free';
  const canCreateEditorial = effectiveProfileRoles.some((role) => ['contributor', 'editor', 'reviewer', 'admin'].includes(role));
  const canManageEditorial = effectiveProfileRoles.some((role) => ['editor', 'reviewer', 'admin'].includes(role));
  const canReviewEditorial = effectiveProfileRoles.some((role) => ['reviewer', 'admin'].includes(role));
  const canActivateEditorial = effectiveProfileRoles.includes('admin');
  useEffect(() => {
    if (!canManageEditorial && editorialQueueFilter !== 'all') {
      setEditorialQueueFilter('all');
    }
  }, [canManageEditorial, editorialQueueFilter]);
  const currentWorkspaceLabel =
    activeTab === 'prescription'
      ? t.prescriptionHub
      : activeTab === 'human'
        ? t.humanHub
        : activeTab === 'active'
          ? t.activeHub
          : activeTab === 'otc'
            ? t.otcHub
            : t.toolkitHub;

  const supportSubject =
    lang === 'es'
      ? 'WAIRUA VetAI | Bug / incidencia / propuesta'
      : 'WAIRUA VetAI | Bug / issue / proposal';
  const supportBody =
    lang === 'es'
      ? 'Describe aqui el problema o la idea.%0A%0AModulo:%20%0APantalla:%20%0APasos:%20%0AResultado%20esperado:%20%0AResultado%20actual:%20'
      : 'Describe the issue or idea here.%0A%0AModule:%20%0AScreen:%20%0ASteps:%20%0AExpected%20result:%20%0ACurrent%20result:%20';
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(supportSubject)}&body=${supportBody}`;
  const supportIssueOptions =
    lang === 'es'
      ? [
          { value: 'incidencia', label: 'Incidencia' },
          { value: 'dato', label: 'Dato incorrecto' },
          { value: 'mejora', label: 'Mejora' },
          { value: 'propuesta', label: 'Propuesta' },
        ]
      : [
          { value: 'incidencia', label: 'Issue' },
          { value: 'dato', label: 'Incorrect data' },
          { value: 'mejora', label: 'Improvement' },
          { value: 'propuesta', label: 'Proposal' },
        ];

  const handleCopySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setSupportFeedback(accessText.supportCopied);
      window.setTimeout(() => setSupportFeedback(''), 1800);
    } catch {
      setSupportFeedback(SUPPORT_EMAIL);
      window.setTimeout(() => setSupportFeedback(''), 2200);
    }
  };

  const handleSubmitSupportIssue = async () => {
    const selectedLabel = supportIssueOptions.find((option) => option.value === supportIssueType)?.label ?? supportIssueType;
    const description = supportIssueText.trim();
    if (!description) return;

    setSupportIssueSubmitting(true);
    setSupportIssueStatus('');

    try {
      if (supabaseAccessService) {
        await supabaseAccessService.createSupportIssue({
          type: selectedLabel,
          module: currentWorkspaceLabel,
          description,
          url: window.location.href,
          accountEmail: authAccount?.email,
        });
      } else {
        const storageKey = 'wairua.support-issues';
        const current = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as unknown[];
        window.localStorage.setItem(
          storageKey,
          JSON.stringify([
            {
              type: selectedLabel,
              module: currentWorkspaceLabel,
              description,
              url: window.location.href,
              createdAt: new Date().toISOString(),
            },
            ...current,
          ]),
        );
      }

      setSupportIssueText('');
      setSupportIssueStatus(
        supabaseAccessService
          ? lang === 'es'
            ? 'Incidencia enviada.'
            : 'Issue sent.'
          : lang === 'es'
            ? 'Modo demo: incidencia guardada localmente.'
            : 'Demo mode: issue saved locally.',
      );
    } catch (error) {
      setSupportIssueStatus(
        `${lang === 'es' ? 'No se pudo enviar.' : 'Could not send.'} ${getErrorMessage(error)}`,
      );
    } finally {
      setSupportIssueSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'toolkit' && !canAccessToolkitView(activeToolkitView, hasPremiumAccess)) {
      setActiveToolkitView('overview');
    }
  }, [activeTab, activeToolkitView, hasPremiumAccess]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false);
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isAccountMenuOpen]);

  const openKnowledgeRecord = (entryId?: string, ingredientName?: string) => {
    setActiveTab('active');
    setActiveKnowledgeView('records');
    setActiveSpecies('');
    setActiveIndication('');
    setActiveConcentrationQuery('');
    setActiveTags([]);
    if (entryId) {
      const matched = entryCatalog.find((entry) => entry.id === entryId);
      setActiveQuery(matched?.activeIngredient ?? ingredientName ?? '');
      return;
    }

    setActiveQuery(ingredientName ?? '');
  };

  const openEntryEditor = (entry: TherapeuticEntry) => {
    if (!canCreateEditorial) return;
    setActiveTab('active');
    setActiveKnowledgeView('create');
    setEditingEntry(entry);
    setRemoteSyncMessage('');
  };

  const removeCatalogEntry = (entry: TherapeuticEntry) => {
    setEntryCatalog((current) => current.filter((item) => item.id !== entry.id));
    if (editingEntry?.id === entry.id) {
      setEditingEntry(null);
    }
  };

  const searchedEntries = useMemo(
    () =>
      filterTherapeuticEntries(
        entriesVisibleToCurrentUser,
        activeQuery,
        activeSpecies,
        activeIndication,
        activeTags,
        activeConcentrationQuery,
      ),
    [activeConcentrationQuery, activeIndication, activeQuery, activeSpecies, activeTags, entriesVisibleToCurrentUser],
  );
  const draftEntries = useMemo(() => entryCatalog.filter((entry) => entry.editorialStatus === 'draft'), [entryCatalog]);
  const reviewQueueEntries = useMemo(() => entryCatalog.filter((entry) => entry.editorialStatus === 'under_review'), [entryCatalog]);
  const publicationQueueEntries = useMemo(
    () => entryCatalog.filter(isPendingPublicationEntry),
    [entryCatalog],
  );
  const activePublishedEntries = useMemo(
    () => entryCatalog.filter(isActivePublishedEntry),
    [entryCatalog],
  );
  const rejectedEntries = useMemo(
    () => entryCatalog.filter((entry) => getEffectivePublicationStatus(entry) === 'rejected'),
    [entryCatalog],
  );
  const hasActiveSearchCriteria = Boolean(
    activeQuery.trim().length > 0 ||
      activeSpecies ||
      activeIndication ||
      activeConcentrationQuery.trim().length > 0 ||
      activeTags.length > 0,
  );
  const effectiveEditorialQueueFilter = hasActiveSearchCriteria ? 'all' : editorialQueueFilter;
  const filteredEntries = useMemo(() => {
    let entries: TherapeuticEntry[];
    switch (effectiveEditorialQueueFilter) {
      case 'draft':
        entries = searchedEntries.filter((entry) => entry.editorialStatus === 'draft');
        break;
      case 'review':
        entries = searchedEntries.filter((entry) => entry.editorialStatus === 'under_review');
        break;
      case 'publication':
        entries = searchedEntries.filter(isPendingPublicationEntry);
        break;
      case 'active':
        entries = searchedEntries.filter(isActivePublishedEntry);
        break;
      case 'rejected':
        entries = searchedEntries.filter((entry) => getEffectivePublicationStatus(entry) === 'rejected');
        break;
      default:
        entries = searchedEntries;
    }

    return [...entries].sort((left, right) =>
      left.activeIngredient.localeCompare(right.activeIngredient, lang === 'es' ? 'es' : 'en', { sensitivity: 'base' }),
    );
  }, [effectiveEditorialQueueFilter, lang, searchedEntries]);
  const shouldShowActiveRecords = true;
  const activeFilteredCount = filteredEntries.length;
  const hasActiveVetCatalogRequest = isCatalogSearchQuery(activeQuery);
  const hasActiveVetSearchRequest = activeQuery.trim().length >= 2 || hasActiveVetCatalogRequest;
  const activeRecordTotalPages = useMemo(() => {
    if (activeRecordPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(activeFilteredCount / activeRecordPageSize));
  }, [activeFilteredCount, activeRecordPageSize]);
  const activeRecordBounds = useMemo(() => {
    if (activeFilteredCount === 0) return { start: 0, end: 0 };
    if (activeRecordPageSize === 'all') return { start: 1, end: activeFilteredCount };

    const start = (activeRecordPage - 1) * activeRecordPageSize + 1;
    const end = Math.min(activeFilteredCount, activeRecordPage * activeRecordPageSize);
    return { start, end };
  }, [activeFilteredCount, activeRecordPage, activeRecordPageSize]);
  const visibleActiveEntries = useMemo(
    () =>
      activeRecordPageSize === 'all'
        ? filteredEntries
        : filteredEntries.slice((activeRecordPage - 1) * activeRecordPageSize, activeRecordPage * activeRecordPageSize),
    [activeRecordPage, activeRecordPageSize, filteredEntries],
  );

  const assistantMatches = useMemo(() => {
    return entriesVisibleToCurrentUser.filter((entry) => {
      const speciesMatch = assistantSpecies ? entry.species.some((value) => value === assistantSpecies) : true;
      const pathologyMatch = assistantPathology ? entry.pathologies.includes(assistantPathology) : true;
      return speciesMatch && pathologyMatch;
    });
  }, [assistantPathology, assistantSpecies, entriesVisibleToCurrentUser]);

  const rxIndicationOptions = useMemo(
    () =>
      getUniqueMedicalOptions(
        [
          ...localIndicationOptions,
          ...Object.values(liveDetails).flatMap((detail) => detail.indicaciones?.map((item) => item.nombre) ?? []),
        ],
        lang,
      ),
    [lang, liveDetails, localIndicationOptions],
  );

  const rxSpeciesLabel = useMemo(() => (rxSpecies ? translateMedicalTerm(rxSpecies, 'es') : undefined), [rxSpecies]);
  const hasRxCatalogRequest = isCatalogSearchQuery(rxQuery);
  const hasRxSearchRequest = rxQuery.trim().length >= 2 || hasRxCatalogRequest;

  const filteredLiveResults = useMemo(() => {
    const normalizedDose = normalizeFilterText(rxDoseFilter);
    const normalizedPresentation = normalizeFilterText(rxPresentationFilter);
    let results = rxOnlyCommercialized ? liveResults.filter((medication) => medication.comerc) : liveResults;

    if (rxIndication) {
      results = results.filter((medication) => {
        const detail = liveDetails[medication.nregistro];
        if (!detail?.indicaciones?.length) return false;
        return detail.indicaciones.some((item) => hasEquivalentOption(item.nombre, rxIndication, lang));
      });
    }

    if (normalizedDose) {
      results = results.filter((medication) => {
        const doseText = getVetDoseFilterText(medication);
        return matchesStructuredFilter(doseText, rxDoseFilter);
      });
    }

    if (normalizedPresentation) {
      results = results.filter((medication) => {
        const detail = liveDetails[medication.nregistro];
        const presentationText = getVetPresentationFilterText(medication, detail);
        return matchesStructuredFilter(presentationText, rxPresentationFilter);
      });
    }

    if (!rxSortByShortestWithdrawal) return results;

    return [...results].sort((left, right) => {
      const leftDays = getCimavetMaxWithdrawalDays(liveDetails[left.nregistro], rxSpeciesLabel);
      const rightDays = getCimavetMaxWithdrawalDays(liveDetails[right.nregistro], rxSpeciesLabel);

      if (leftDays == null && rightDays == null) return left.nombre.localeCompare(right.nombre);
      if (leftDays == null) return 1;
      if (rightDays == null) return -1;
      if (leftDays === rightDays) return left.nombre.localeCompare(right.nombre);
      return leftDays - rightDays;
    });
  }, [
    liveDetails,
    liveResults,
    lang,
    rxDoseFilter,
    rxIndication,
    rxOnlyCommercialized,
    rxPresentationFilter,
    rxSortByShortestWithdrawal,
    rxSpeciesLabel,
  ]);

  const liveTotalPages = useMemo(() => {
    if (livePageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredLiveResults.length / livePageSize));
  }, [filteredLiveResults.length, livePageSize]);

  const livePageBounds = useMemo(() => {
    if (filteredLiveResults.length === 0) return { start: 0, end: 0 };
    if (livePageSize === 'all') return { start: 1, end: filteredLiveResults.length };

    const start = (livePage - 1) * livePageSize + 1;
    const end = Math.min(filteredLiveResults.length, livePage * livePageSize);
    return { start, end };
  }, [filteredLiveResults.length, livePage, livePageSize]);

  const visibleLiveResults = useMemo(
    () =>
      livePageSize === 'all'
        ? filteredLiveResults
        : filteredLiveResults.slice((livePage - 1) * livePageSize, livePage * livePageSize),
    [filteredLiveResults, livePage, livePageSize],
  );
  const liveDetailPrefetchResults = useMemo(() => {
    const needsFullDetailScan = Boolean(
      rxIndication || normalizeFilterText(rxPresentationFilter) || rxSortByShortestWithdrawal,
    );
    return needsFullDetailScan ? liveResults : visibleLiveResults;
  }, [liveResults, rxIndication, rxPresentationFilter, rxSortByShortestWithdrawal, visibleLiveResults]);
  const liveDetailPrefetchIds = useMemo(
    () => liveDetailPrefetchResults.map((medication) => medication.nregistro).join('|'),
    [liveDetailPrefetchResults],
  );

  const filteredHumanResults = useMemo(() => {
    const normalizedDose = normalizeFilterText(humanDoseFilter);
    const normalizedPresentation = normalizeFilterText(humanPresentationFilter);

    return humanResults.filter((medication) => {
      if (humanOnlyCommercialized && !medication.comerc) return false;

      const formText = `${medication.formaFarmaceuticaSimplificada?.nombre ?? ''} ${medication.formaFarmaceutica?.nombre ?? ''}`;
      const doseText = medication.dosis ?? '';

      const matchesDose = !normalizedDose || normalizeFilterText(doseText).includes(normalizedDose);
      const matchesPresentation =
        !normalizedPresentation || normalizeFilterText(formText).includes(normalizedPresentation);

      return matchesDose && matchesPresentation;
    });
  }, [
    humanDoseFilter,
    humanPresentationFilter,
    humanResults,
    humanOnlyCommercialized,
  ]);
  const humanTotalPages = useMemo(() => {
    if (humanPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredHumanResults.length / humanPageSize));
  }, [filteredHumanResults.length, humanPageSize]);
  const humanPageBounds = useMemo(() => {
    if (filteredHumanResults.length === 0) return { start: 0, end: 0 };
    if (humanPageSize === 'all') return { start: 1, end: filteredHumanResults.length };

    const start = (humanPage - 1) * humanPageSize + 1;
    const end = Math.min(filteredHumanResults.length, humanPage * humanPageSize);
    return { start, end };
  }, [filteredHumanResults.length, humanPage, humanPageSize]);
  const visibleHumanResults = useMemo(
    () =>
      humanPageSize === 'all'
        ? filteredHumanResults
        : filteredHumanResults.slice((humanPage - 1) * humanPageSize, humanPage * humanPageSize),
    [filteredHumanResults, humanPage, humanPageSize],
  );
  const humanResultsForDetails = useMemo(() => visibleHumanResults, [visibleHumanResults]);

  const filteredOtcProducts = useMemo(() => {
    const normalizedQuery = normalizeFilterText(otcQuery);

    return otcProducts.filter((product) => {
      if (otcManufacturer && product.manufacturer !== otcManufacturer) return false;
      if (otcSpecies && !product.species.includes(otcSpecies as OtcProductRecord['species'][number])) return false;
      if (otcCategory && product.category.key !== otcCategory) return false;
      if (otcType && product.productType.key !== otcType) return false;
      if (!normalizedQuery) return true;

      return normalizeFilterText(getOtcSearchableText(product)).includes(normalizedQuery);
    });
  }, [otcCategory, otcManufacturer, otcQuery, otcSpecies, otcType]);
  const otcTotalPages = useMemo(() => {
    if (otcPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredOtcProducts.length / otcPageSize));
  }, [filteredOtcProducts.length, otcPageSize]);
  const hasOtcSearchCriteria = useMemo(
    () => Boolean(normalizeFilterText(otcQuery) || otcManufacturer || otcSpecies || otcCategory || otcType),
    [otcCategory, otcManufacturer, otcQuery, otcSpecies, otcType],
  );
  const otcPageBounds = useMemo(() => {
    if (filteredOtcProducts.length === 0) return { start: 0, end: 0 };
    if (otcPageSize === 'all') return { start: 1, end: filteredOtcProducts.length };

    const start = (otcPage - 1) * otcPageSize + 1;
    const end = Math.min(filteredOtcProducts.length, otcPage * otcPageSize);
    return { start, end };
  }, [filteredOtcProducts.length, otcPage, otcPageSize]);
  const visibleOtcProducts = useMemo(
    () =>
      otcPageSize === 'all'
        ? filteredOtcProducts
        : filteredOtcProducts.slice((otcPage - 1) * otcPageSize, otcPage * otcPageSize),
    [filteredOtcProducts, otcPage, otcPageSize],
  );
  const isSingleVisibleOtcProduct = visibleOtcProducts.length === 1;

  const filteredActiveVetResults = useMemo(
    () =>
      activeVetResults.filter((medication) => {
        const detail = activeVetDetails[medication.nregistro];
        const indicationMatch = activeIndication
          ? detail?.indicaciones?.some((item) => matchesStructuredFilter(`${item.especie?.nombre ?? ''} ${item.nombre}`.trim(), activeIndication))
          : true;
        const concentrationMatch = activeConcentrationQuery
          ? matchesStructuredFilter(getMedicationNameFilterText(medication), activeConcentrationQuery)
          : true;
        return indicationMatch && concentrationMatch;
      }),
    [activeConcentrationQuery, activeIndication, activeVetDetails, activeVetResults],
  );

  const activeVetTotalPages = useMemo(() => {
    if (activeOfficialPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredActiveVetResults.length / activeOfficialPageSize));
  }, [activeOfficialPageSize, filteredActiveVetResults.length]);
  const activeVetPageBounds = useMemo(() => {
    if (filteredActiveVetResults.length === 0) return { start: 0, end: 0 };
    if (activeOfficialPageSize === 'all') return { start: 1, end: filteredActiveVetResults.length };

    const start = (activeVetPage - 1) * activeOfficialPageSize + 1;
    const end = Math.min(filteredActiveVetResults.length, activeVetPage * activeOfficialPageSize);
    return { start, end };
  }, [activeOfficialPageSize, activeVetPage, filteredActiveVetResults.length]);
  const activeVetResultsForDetails = useMemo(
    () =>
      activeOfficialPageSize === 'all'
        ? filteredActiveVetResults
        : filteredActiveVetResults.slice((activeVetPage - 1) * activeOfficialPageSize, activeVetPage * activeOfficialPageSize),
    [activeOfficialPageSize, activeVetPage, filteredActiveVetResults],
  );

  const filteredActiveHumanResults = useMemo(
    () =>
      activeHumanResults.filter((medication) => {
        if (!activeConcentrationQuery) return true;
        return matchesStructuredFilter(getMedicationNameFilterText(medication), activeConcentrationQuery);
      }),
    [activeConcentrationQuery, activeHumanResults],
  );

  const activeHumanTotalPages = useMemo(() => {
    if (activeOfficialPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredActiveHumanResults.length / activeOfficialPageSize));
  }, [filteredActiveHumanResults.length, activeOfficialPageSize]);
  const activeHumanPageBounds = useMemo(() => {
    if (filteredActiveHumanResults.length === 0) return { start: 0, end: 0 };
    if (activeOfficialPageSize === 'all') return { start: 1, end: filteredActiveHumanResults.length };

    const start = (activeHumanPage - 1) * activeOfficialPageSize + 1;
    const end = Math.min(filteredActiveHumanResults.length, activeHumanPage * activeOfficialPageSize);
    return { start, end };
  }, [activeHumanPage, filteredActiveHumanResults.length, activeOfficialPageSize]);
  const activeHumanResultsForDetails = useMemo(
    () =>
      activeOfficialPageSize === 'all'
        ? filteredActiveHumanResults
        : filteredActiveHumanResults.slice(
            (activeHumanPage - 1) * activeOfficialPageSize,
            activeHumanPage * activeOfficialPageSize,
          ),
    [activeHumanPage, filteredActiveHumanResults, activeOfficialPageSize],
  );

  useEffect(() => {
    const warmup = window.setTimeout(() => {
      void cimavetService.loadCatalog().catch(() => undefined);
    }, 300);

    return () => window.clearTimeout(warmup);
  }, [cimavetService]);

  useEffect(() => {
    setLivePage(1);
  }, [livePageSize, rxDoseFilter, rxIndication, rxOnlyCommercialized, rxPresentationFilter, rxQuery, rxSortByShortestWithdrawal, rxSpecies]);

  useEffect(() => {
    setLivePage((current) => Math.min(current, liveTotalPages));
  }, [liveTotalPages]);

  useEffect(() => {
    setActiveRecordPage(1);
  }, [activeQuery, activeSpecies, activeIndication, activeTags, activeConcentrationQuery, activeRecordPageSize, editorialQueueFilter]);

  useEffect(() => {
    if (editorialQueueFilter !== 'all') {
      setEditorialQueueFilter('all');
    }
  }, [activeConcentrationQuery, activeIndication, activeQuery, activeSpecies, activeTags]);

  useEffect(() => {
    setActiveRecordPage((current) => Math.min(current, activeRecordTotalPages));
  }, [activeRecordTotalPages]);

  useEffect(() => {
    setHumanPage(1);
  }, [humanDoseFilter, humanOnlyCommercialized, humanPageSize, humanPresentationFilter, humanQuery]);

  useEffect(() => {
    setHumanPage((current) => Math.min(current, humanTotalPages));
  }, [humanTotalPages]);

  useEffect(() => {
    setOtcPage(1);
  }, [otcCategory, otcManufacturer, otcPageSize, otcQuery, otcSpecies, otcType]);

  useEffect(() => {
    setOtcPage((current) => Math.min(current, otcTotalPages));
  }, [otcTotalPages]);

  useEffect(() => {
    setActiveVetPage(1);
  }, [activeOfficialPageSize, activeQuery, activeSpecies, activeIndication, activeConcentrationQuery]);

  useEffect(() => {
    setActiveVetPage((current) => Math.min(current, activeVetTotalPages));
  }, [activeVetTotalPages]);

  useEffect(() => {
    setActiveHumanPage(1);
  }, [activeKnowledgeView, activeOfficialPageSize, activeQuery, activeTab, activeIndication, activeConcentrationQuery]);

  useEffect(() => {
    setActiveHumanPage((current) => Math.min(current, activeHumanTotalPages));
  }, [activeHumanTotalPages]);

  useEffect(() => {
    if (!supabaseEditorialService) return;

    let ignore = false;

    const loadRemoteEntries = async () => {
      try {
        const remoteEntries = await supabaseEditorialService.listTherapeuticEntries();
        if (ignore || remoteEntries.length === 0) return;

        setEntryCatalog((current) => {
          const merged = new Map<string, TherapeuticEntry>();
          current.forEach((entry) => merged.set(entry.activeIngredient.toLowerCase(), entry));
          remoteEntries.forEach((entry) => merged.set(entry.activeIngredient.toLowerCase(), entry));
          return Array.from(merged.values());
        });
      } catch (error) {
        if (!ignore) {
          setRemoteSyncMessage(getErrorMessage(error));
        }
      }
    };

    void loadRemoteEntries();

    return () => {
      ignore = true;
    };
  }, [supabaseEditorialService]);

  useEffect(() => {
    if (activeTab !== 'prescription') return;

    const q = rxQuery.trim();
    const shouldLoadCatalog = isCatalogSearchQuery(q);
    if (q.length < 2 && !shouldLoadCatalog) {
      setLiveResults([]);
      setLiveError(null);
      setLiveLoading(false);
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setLiveLoading(true);
      setLiveError(null);

      const cimavetSpecies = rxSpecies ? translateMedicalTerm(rxSpecies, 'es') : undefined;

      try {
        const fastResults = await cimavetService.searchMedications(q || '*', {
          species: cimavetSpecies,
          speciesResultLimit: 120,
          includeActiveIngredientSearch: false,
        });

        if (!ignore) {
          setLiveResults(fastResults);
        }

        if (q.length >= 3) {
          try {
            const expanded = await cimavetService.searchMedications(q, {
              species: cimavetSpecies,
              speciesResultLimit: 120,
              includeActiveIngredientSearch: true,
            });

            if (!ignore) {
              const merged = new Map<string, CimavetMedicationSummary>();
              [...fastResults, ...expanded].forEach((item) => merged.set(item.nregistro, item));
              setLiveResults(Array.from(merged.values()));
            }
          } catch {
            // Keep the fast pass rendered even if the wider search fails.
          }
        }

        if (!ignore) setLiveLoading(false);
      } catch (error) {
        if (!ignore) {
          setLiveResults([]);
          setLiveError(error instanceof Error ? error.message : 'Unknown CIMAVet error');
          setLiveLoading(false);
        }
      }
    }, 450);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, cimavetService, rxQuery, rxSpecies]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasPremiumAccess) return;
    if (!premiumTabSet.has(activeTab)) return;
    setActiveTab('prescription');
  }, [activeTab, hasPremiumAccess, isAuthenticated]);

  useEffect(() => {
    if (activeTab !== 'prescription' || !liveDetailPrefetchIds) return;

    const missing = liveDetailPrefetchIds.split('|').filter((nregistro) => !liveDetails[nregistro]);
    if (missing.length === 0) return;

    let ignore = false;

    const loadDetails = async () => {
      const batchSize = 4;

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const details = await Promise.all(
          batch.map(async (nregistro) => {
            const detail = await cimavetService.getMedicationByRegistration(nregistro).catch(() => null);
            return detail ? ({ nregistro, detail } as const) : null;
          }),
        );

        if (ignore) return;

        setLiveDetails((current) => {
          const next = { ...current };
          details.forEach((item) => {
            if (item) next[item.nregistro] = item.detail;
          });
          return next;
        });

        if (i + batchSize < missing.length) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
        }
      }
    };

    void loadDetails();

    return () => {
      ignore = true;
    };
  }, [activeTab, cimavetService, liveDetailPrefetchIds]);

  useEffect(() => {
    if (activeTab !== 'human') return;

    const q = humanQuery.trim();
    if (q.length < 2) {
      setHumanResults([]);
      setHumanError(null);
      setHumanLoading(false);
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setHumanLoading(true);
      setHumanError(null);

      try {
        const results = await cimaService.searchMedications(q, {
          includeActiveIngredientSearch: q.length >= 3,
        });
        if (!ignore) {
          setHumanResults(results);
          setHumanLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setHumanResults([]);
          setHumanError(error instanceof Error ? error.message : 'Unknown CIMA error');
          setHumanLoading(false);
        }
      }
    }, 450);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, cimaService, humanQuery]);

  useEffect(() => {
    if (activeTab !== 'human' || humanResultsForDetails.length === 0) return;

    const missing = humanResultsForDetails.filter((item) => !humanDetails[item.nregistro]).map((item) => item.nregistro);
    if (missing.length === 0) return;

    let ignore = false;

    const loadDetails = async () => {
      const batchSize = 6;

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const details = await Promise.all(
          batch.map(async (nregistro) => {
            const detail = await cimaService.getMedicationByRegistration(nregistro).catch(() => null);
            return detail ? ({ nregistro, detail } as const) : null;
          }),
        );

        if (ignore) return;

        setHumanDetails((current) => {
          const next = { ...current };
          details.forEach((item) => {
            if (item) next[item.nregistro] = item.detail;
          });
          return next;
        });
      }
    };

    void loadDetails();

    return () => {
      ignore = true;
    };
  }, [activeTab, cimaService, humanDetails, humanResultsForDetails]);

  useEffect(() => {
    if (activeTab !== 'active' || activeKnowledgeView !== 'records') return;

    const q = activeQuery.trim();
    const shouldLoadCatalog = isCatalogSearchQuery(q);
    if (q.length < 2 && !shouldLoadCatalog) {
      setActiveVetResults([]);
      setActiveVetError(null);
      setActiveVetLoading(false);
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setActiveVetLoading(true);
      setActiveVetError(null);

      try {
        const results = await cimavetService.searchMedications(q || '*', {
          species: activeSpecies ? translateMedicalTerm(activeSpecies, 'es') : undefined,
          speciesResultLimit: 120,
          includeActiveIngredientSearch: true,
          preferExactActiveIngredient: true,
        });

        if (!ignore) {
          setActiveVetResults(results);
          setActiveVetLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setActiveVetResults([]);
          setActiveVetError(error instanceof Error ? error.message : 'Unknown CIMAVet error');
          setActiveVetLoading(false);
        }
      }
    }, 450);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeKnowledgeView, activeQuery, activeSpecies, activeTab, cimavetService]);

  useEffect(() => {
    if (activeTab !== 'active' || activeKnowledgeView !== 'records' || activeVetResultsForDetails.length === 0) return;

    const missing = activeVetResultsForDetails
      .filter((item) => !activeVetDetails[item.nregistro])
      .map((item) => item.nregistro);
    if (missing.length === 0) return;

    let ignore = false;

    const loadDetails = async () => {
      const batchSize = 6;

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const details = await Promise.all(
          batch.map(async (nregistro) => {
            const detail = await cimavetService.getMedicationByRegistration(nregistro).catch(() => null);
            return detail ? ({ nregistro, detail } as const) : null;
          }),
        );

        if (ignore) return;

        setActiveVetDetails((current) => {
          const next = { ...current };
          details.forEach((item) => {
            if (item) next[item.nregistro] = item.detail;
          });
          return next;
        });
      }
    };

    void loadDetails();

    return () => {
      ignore = true;
    };
  }, [activeKnowledgeView, activeTab, activeVetDetails, activeVetResultsForDetails, cimavetService]);

  useEffect(() => {
    if (activeTab !== 'active' || activeKnowledgeView !== 'records') return;

    const q = activeQuery.trim();
    if (q.length < 2) {
      setActiveHumanResults([]);
      setActiveHumanError(null);
      setActiveHumanLoading(false);
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setActiveHumanLoading(true);
      setActiveHumanError(null);

      try {
        const results = await cimaService.searchMedications(q, {
          includeActiveIngredientSearch: true,
          includeTradeNameSearch: false,
          preferExactActiveIngredient: true,
        });

        if (!ignore) {
          setActiveHumanResults(results);
          setActiveHumanLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setActiveHumanResults([]);
          setActiveHumanError(error instanceof Error ? error.message : 'Unknown CIMA error');
          setActiveHumanLoading(false);
        }
      }
    }, 450);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeKnowledgeView, activeQuery, activeTab, cimaService]);

  useEffect(() => {
    if (activeTab !== 'active' || activeKnowledgeView !== 'records' || activeHumanResultsForDetails.length === 0) return;

    const missing = activeHumanResultsForDetails
      .filter((item) => !activeHumanDetails[item.nregistro])
      .map((item) => item.nregistro);
    if (missing.length === 0) return;

    let ignore = false;

    const loadDetails = async () => {
      const batchSize = 6;

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const details = await Promise.all(
          batch.map(async (nregistro) => {
            const detail = await cimaService.getMedicationByRegistration(nregistro).catch(() => null);
            return detail ? ({ nregistro, detail } as const) : null;
          }),
        );

        if (ignore) return;

        setActiveHumanDetails((current) => {
          const next = { ...current };
          details.forEach((item) => {
            if (item) next[item.nregistro] = item.detail;
          });
          return next;
        });
      }
    };

    void loadDetails();

    return () => {
      ignore = true;
    };
  }, [activeHumanDetails, activeHumanResultsForDetails, activeKnowledgeView, activeTab, cimaService]);

  const renderLocalizedCards = (cards: LocalizedCollectionCard[], gridClassName?: string) => {
    const orderedCards = cards === toolkitModules ? [...cards].sort((left, right) => left.title[lang].localeCompare(right.title[lang], lang)) : cards;

    return (
      <div className={`feature-grid ${gridClassName ?? ''}`.trim()}>
        {orderedCards.map((card) => {
          const isToolkitCard = Boolean(card.toolkitView);
          const isSoonToolkitCard = Boolean(card.toolkitView && card.statusTone === 'soon');
          const canPreviewSoonToolkitCard = Boolean(isSoonToolkitCard && canActivateEditorial);
          const isOpenableToolkitCard = card.toolkitView
            ? canAccessToolkitView(card.toolkitView, hasToolkitAccess) || canPreviewSoonToolkitCard
            : false;
          const isLockedToolkitCard = Boolean(
            isToolkitCard &&
              card.toolkitView &&
              availableToolkitViewSet.has(card.toolkitView) &&
              !canAccessToolkitView(card.toolkitView, hasToolkitAccess) &&
              !canPreviewSoonToolkitCard,
          );

          return (
            <article key={card.id} className={`feature-card ${card.statusTone === 'soon' ? 'feature-card-soon' : ''}`.trim()}>
              <h3>{card.title[lang]}</h3>
              <p>{card.description[lang]}</p>
              {card.bullets?.[lang]?.length ? (
                <ul>
                  {card.bullets[lang].map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}

              {(card.status || isOpenableToolkitCard || isLockedToolkitCard) && (
                <div className="feature-card-footer">
                  {card.status && (
                    <span className={`status-pill ${card.statusTone ? `status-pill-${card.statusTone}` : ''}`}>{card.status[lang]}</span>
                  )}
                  {isOpenableToolkitCard ? (
                    <button
                      type="button"
                      className="feature-card-link"
                      onClick={() => {
                        setActiveTab('toolkit');
                        setActiveToolkitView(card.toolkitView!);
                      }}
                    >
                      <span>{t.openToolkitModule}</span>
                    </button>
                  ) : isLockedToolkitCard ? (
                    <span className="feature-card-link feature-card-link-disabled">{accessText.lockedTitle}</span>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const replaceCatalogEntry = (nextEntry: TherapeuticEntry, previousId?: string) => {
    setEntryCatalog((current) => {
      const matchedIndex = current.findIndex((item) => item.id === (previousId ?? nextEntry.id));
      if (matchedIndex >= 0) {
        return current.map((item, index) => (index === matchedIndex ? nextEntry : item));
      }

      const deduped = current.filter((item) => item.activeIngredient.toLowerCase() !== nextEntry.activeIngredient.toLowerCase());
      return [nextEntry, ...deduped];
    });
  };

  const handleSaveEntry = async (entry: TherapeuticEntry, mode: 'create' | 'edit') => {
    if (!canCreateEditorial) {
      setRemoteSyncMessage(
        lang === 'es'
          ? 'La edición está restringida a perfiles autorizados por el administrador.'
          : 'Editing is restricted to profiles authorized by the administrator.',
      );
      return {
        persisted: false,
        entry,
        message:
          lang === 'es'
            ? 'La edición está restringida a perfiles autorizados por el administrador.'
            : 'Editing is restricted to profiles authorized by the administrator.',
      };
    }
    setRemoteSyncMessage('');
    const normalizedSystems = normalizeStringList(entry.systems, systemOptions);
    const normalizedTags = excludeEquivalentValues(normalizeStringList(entry.tags, formTagOptions), normalizedSystems);
    const normalizedEntry: TherapeuticEntry = {
      ...entry,
      tradeNames: normalizeStringList(entry.tradeNames),
      tags: normalizedTags,
      systems: normalizedSystems,
      pathologies: normalizeStringList(entry.pathologies),
      concentrations: normalizeStringList(entry.concentrations),
      publicationStatus: canActivateEditorial ? entry.publicationStatus : 'pending_activation',
    };

    if (mode === 'create') {
      if (!supabaseEditorialService) {
        replaceCatalogEntry(normalizedEntry);
        setEditingEntry(null);
        return {
          persisted: false,
          entry: normalizedEntry,
          message:
            lang === 'es'
              ? 'Ficha creada como propuesta local. Para persistirla, configura Supabase y aplica el schema.'
              : 'Record created locally as a proposal. Configure Supabase and apply the schema to persist it.',
        };
      }

      try {
        const savedEntry = await supabaseEditorialService.createTherapeuticEntry(normalizedEntry);
        replaceCatalogEntry(savedEntry, entry.id);
        setEditingEntry(null);
        return {
          persisted: true,
          entry: savedEntry,
          message:
            lang === 'es'
              ? 'Ficha creada y enviada al flujo editorial.'
              : 'Record created and sent to the editorial workflow.',
        };
      } catch (error) {
        const detail = getErrorMessage(error);
        setRemoteSyncMessage(detail);
        replaceCatalogEntry(normalizedEntry);
        setEditingEntry(null);
        return {
          persisted: false,
          entry: normalizedEntry,
          message:
            lang === 'es'
              ? `Ficha creada en local, pero no se pudo guardar en Supabase (${detail}).`
              : `Record created locally, but could not be saved to Supabase (${detail}).`,
        };
      }
    }

    if (!supabaseEditorialService) {
      replaceCatalogEntry(normalizedEntry);
      setEditingEntry(normalizedEntry);
      return {
        persisted: false,
        entry: normalizedEntry,
        message:
          lang === 'es'
            ? 'Ficha actualizada en local. La edicion remota requiere un registro persistido en Supabase.'
            : 'Record updated locally. Remote editing requires a persisted Supabase record.',
      };
    }

    try {
      if (!isUuid(entry.id)) {
        const savedEntry = await supabaseEditorialService.createTherapeuticEntry(normalizedEntry);
        replaceCatalogEntry(savedEntry, entry.id);
        setEditingEntry(savedEntry);
        return {
          persisted: true,
          entry: savedEntry,
          message:
            lang === 'es'
              ? 'Ficha local persistida en Supabase y actualizada.'
              : 'Local record persisted to Supabase and updated.',
        };
      }

      const savedEntry = await supabaseEditorialService.updateTherapeuticEntry(normalizedEntry);
      replaceCatalogEntry(savedEntry, entry.id);
      setEditingEntry(savedEntry);
      return {
        persisted: true,
        entry: savedEntry,
        message: lang === 'es' ? 'Ficha actualizada en Supabase.' : 'Record updated in Supabase.',
      };
    } catch (error) {
      const detail = getErrorMessage(error);
      setRemoteSyncMessage(detail);
      replaceCatalogEntry(normalizedEntry);
      setEditingEntry(normalizedEntry);
      return {
        persisted: false,
        entry: normalizedEntry,
        message:
          lang === 'es'
            ? `Ficha actualizada en local, pero no se pudo sincronizar con Supabase (${detail}).`
            : `Record updated locally, but could not sync to Supabase (${detail}).`,
      };
    }
  };

  const handleDeleteEntry = async (entry: TherapeuticEntry) => {
    if (!canManageEditorial) {
      setRemoteSyncMessage(
        lang === 'es'
          ? 'La eliminación está restringida a perfiles autorizados por el administrador.'
          : 'Deletion is restricted to profiles authorized by the administrator.',
      );
      return;
    }
    const confirmed = window.confirm(t.deleteConfirm);
    if (!confirmed) return;

    setRemoteSyncMessage('');

    if (!supabaseEditorialService || !isUuid(entry.id)) {
      removeCatalogEntry(entry);
      return;
    }

    try {
      await supabaseEditorialService.deleteTherapeuticEntry(entry.id);
      removeCatalogEntry(entry);
    } catch (error) {
      setRemoteSyncMessage(getErrorMessage(error));
    }
  };

  const handleReviewEntry = async (entry: TherapeuticEntry, approvalLevel: number) => {
    if (!canReviewEditorial || !supabaseEditorialService || !isUuid(entry.id)) return;

    try {
      const savedEntry = await supabaseEditorialService.saveActiveIngredientReview(entry.id, approvalLevel);
      replaceCatalogEntry(savedEntry, entry.id);
    } catch (error) {
      setRemoteSyncMessage(getErrorMessage(error));
    }
  };

  const handlePublicationChange = async (entry: TherapeuticEntry, publicationStatus: TherapeuticEntry['publicationStatus']) => {
    if (!canActivateEditorial) return;

    if (!supabaseEditorialService || !isUuid(entry.id)) {
      replaceCatalogEntry({ ...entry, publicationStatus });
      return;
    }

    try {
      const savedEntry = await supabaseEditorialService.updatePublicationStatus(entry.id, publicationStatus);
      replaceCatalogEntry(savedEntry, entry.id);
    } catch (error) {
      setRemoteSyncMessage(getErrorMessage(error));
    }
  };

  const editorialQueueCards = [
    {
      id: 'draft' as const,
      label: t.editorialQueueDraft,
      count: draftEntries.length,
      note: t.editorialQueueSummaryDraft,
    },
    {
      id: 'review' as const,
      label: t.editorialQueueReview,
      count: reviewQueueEntries.length,
      note: t.editorialQueueSummaryReview,
    },
    {
      id: 'publication' as const,
      label: t.editorialQueuePublication,
      count: publicationQueueEntries.length,
      note: t.editorialQueueSummaryPublication,
    },
    {
      id: 'active' as const,
      label: t.editorialQueueActive,
      count: activePublishedEntries.length,
      note: t.editorialQueueSummaryActive,
    },
    {
      id: 'rejected' as const,
      label: t.editorialQueueRejected,
      count: rejectedEntries.length,
      note: t.editorialQueueSummaryRejected,
    },
  ];

  const renderAppearanceControls = () => (
    <>
      <button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? t.dark : t.light}
      </button>
      <div className="lang-switch" role="group" aria-label={t.language}>
        <button onClick={() => setLang('es')} className={lang === 'es' ? 'active' : ''}>
          <span className="flag-emoji" aria-hidden="true">
            🇪🇸
          </span>{' '}
          ES
        </button>
        <button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>
          <span className="flag-emoji" aria-hidden="true">
            🇬🇧
          </span>{' '}
          EN
        </button>
      </div>
    </>
  );

  if (authLoading && authAccount === null) {
    return (
      <div className={`app auth-app-shell ${theme}`}>
        <section className="auth-loading-shell">
          <div className="auth-loading-card">
            <p className="badge">WAIRUA VetAI</p>
            <h1>{accessText.loading}</h1>
            <p>{accessText.loadingBody}</p>
          </div>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`app auth-app-shell ${theme}`}>
        <div className="auth-utility-bar">{renderAppearanceControls()}</div>
        <AuthAccessPanel
          lang={lang}
          service={supabaseAccessService}
          account={authAccount}
          onRefreshAccount={refreshAuthAccount}
          layout="screen"
          supportEmail={SUPPORT_EMAIL}
        />
        <LegalCompliance lang={lang} contactEmail={SUPPORT_EMAIL} compact />
      </div>
    );
  }

  return (
    <div className={`app ${theme}`} ref={appShellRef}>
      <div className="app-backdrop" ref={backdropRef} aria-hidden="true">
        <div className="app-backdrop-orb app-backdrop-orb-one" />
        <div className="app-backdrop-orb app-backdrop-orb-two" />
        <div className="app-backdrop-grid" />
      </div>

      <header className="app-topbar">
        <div className="topbar-brand">
          <img src={wairuaLogo} alt="WAIRUA" className="brand-logo brand-logo-topbar" />
          <div className="topbar-brand-copy">
            <strong>{currentWorkspaceLabel}</strong>
            <span>{lang === 'es' ? 'Aplicación clínica' : 'Clinical application'}</span>
          </div>
        </div>

        <div className="topbar-utilities">
          <div className="topbar-status-group">
            <span className={`topbar-status-chip ${hasPremiumAccess ? 'is-premium' : 'is-free'}`}>{accessStatusMessage}</span>
          </div>

          <div className="topbar-actions">
            <div className="topbar-support" title={accessText.supportTitle}>
              <button
                type="button"
                className="topbar-support-link topbar-support-link-icon"
                aria-label={lang === 'es' ? 'Abrir formulario de incidencias' : 'Open issue form'}
                onClick={() => setIsSupportFormOpen(true)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="topbar-support-icon" fill="none">
                  <path
                    d="M4.5 7.5h15a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m4 8 8 6 8-6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{lang === 'es' ? 'Incidencia' : 'Issue'}</span>
              </button>
            </div>
            <button type="button" className="topbar-icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? t.dark : t.light}
            </button>
            <div className="lang-switch topbar-lang-switch" role="group" aria-label={t.language}>
              <button type="button" onClick={() => setLang('es')} className={lang === 'es' ? 'active' : ''}>
                ES
              </button>
              <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>
                EN
              </button>
            </div>
            <button type="button" className="topbar-account-button" onClick={() => setIsAccountMenuOpen(true)}>
              <span>{lang === 'es' ? 'Mi cuenta' : 'My account'}</span>
              <strong>{authAccount?.profile?.fullName || authAccount?.email || 'WAIRUA'}</strong>
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs product-tabs" aria-label="Product selector">
        {[
          { key: 'prescription' as const, label: t.prescriptionHub },
          { key: 'human' as const, label: t.humanHub },
          { key: 'active' as const, label: t.activeHub },
          { key: 'otc' as const, label: t.otcHub },
          { key: 'toolkit' as const, label: t.toolkitHub },
        ].map((tab) => {
          const isLocked = premiumTabSet.has(tab.key) && !hasPremiumAccess;
          const isToolkitTab = tab.key === 'toolkit';

          return (
            <button
              key={tab.key}
              onClick={() => {
                if (isLocked) return;
                setActiveTab(tab.key);
                if (isToolkitTab) setActiveToolkitView('overview');
              }}
              className={`${activeTab === tab.key ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              disabled={isLocked}
              title={isLocked ? accessText.lockedTitle : undefined}
            >
              <span translate={tab.key === 'otc' ? 'no' : undefined}>{tab.label}</span>
              <small>{isLocked ? accessText.lockedBadge : premiumTabSet.has(tab.key) ? accessText.premiumBadge : accessText.freeBadge}</small>
            </button>
          );
        })}
      </nav>

      <main className="workspace-main">
        {activeTab === 'prescription' && (
          <section className="panel module-panel">
            <div className="module-header">
              <div>
                <p className="section-kicker">{lang === 'es' ? 'Busqueda oficial' : 'Official search'}</p>
                <h2>{t.prescriptionHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Buscador de medicamentos veterinarios de prescripcion conectado a CIMAVET, con filtros clinicos y despliegue de indicaciones por producto.'
                    : 'Search for veterinary prescription medicines connected to CIMAVET, with clinical filters and per-product indication details.'}
                </p>
              </div>
              <div className="module-note">
                <strong>{lang === 'es' ? 'Fuente regulatoria' : 'Regulatory source'}</strong>
                <p>CIMAVET / AEMPS</p>
              </div>
            </div>

            <div className="search-grid">
              <label>
                {t.search}
                <input
                  type="search"
                  placeholder={t.activeSearchPlaceholder}
                  title={t.searchPlaceholder}
                  value={rxQuery}
                  onChange={(event) => setRxQuery(event.target.value)}
                />
                <span className="field-hint">
                  {lang === 'es'
                    ? 'Para listar por especie, elige especie y escribe *.'
                    : 'To list by species, choose a species and type *.'}
                </span>
              </label>

              <label>
                {t.species}
                <select value={rxSpecies} onChange={(event) => setRxSpecies(event.target.value)}>
                  <option value="">{t.all}</option>
                  {prescriptionSpeciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {translateMedicalTerm(species, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.indicationFilter}
                <select value={rxIndication} onChange={(event) => setRxIndication(event.target.value)}>
                  <option value="">{t.all}</option>
                  {rxIndicationOptions.map((indication) => (
                    <option key={indication} value={indication}>
                      {indication}
                    </option>
                  ))}
                  </select>
              </label>

              <label>
                {t.dose}
                <input
                  type="search"
                  placeholder={t.humanDosePlaceholder}
                  title={t.humanDosePlaceholder}
                  value={rxDoseFilter}
                  onChange={(event) => setRxDoseFilter(event.target.value)}
                />
              </label>

              <label>
                {t.presentation}
                <input
                  type="search"
                  placeholder={t.humanPresentationPlaceholder}
                  title={t.humanPresentationPlaceholder}
                  value={rxPresentationFilter}
                  onChange={(event) => setRxPresentationFilter(event.target.value)}
                />
              </label>
            </div>

            <div className="search-grid-checkboxes">
              <strong>{t.results}</strong>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={rxOnlyCommercialized}
                  onChange={(event) => setRxOnlyCommercialized(event.target.checked)}
                />
                {t.commercializedOnly}
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={rxSortByShortestWithdrawal}
                  onChange={(event) => setRxSortByShortestWithdrawal(event.target.checked)}
                />
                {t.withdrawalSortAscending}
              </label>
            </div>

            <section className="live-panel">
              <div className="live-panel-header">
                <div>
                  <h3>{t.liveResults}</h3>
                  <p className="live-hint">{t.liveHint}</p>
                </div>
                <div className="live-panel-tools">
                  <div className="live-page-size" aria-label={t.visibleCards}>
                    <span>{t.visibleCards}</span>
                    {livePageSizeOptions.map((option) => {
                      const label = option === 'all' ? t.all : String(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          className={livePageSize === option ? 'active' : ''}
                          onClick={() => setLivePageSize(option)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button className="live-toggle" onClick={() => setIsLiveExpanded((value) => !value)} type="button">
                    {isLiveExpanded ? t.collapseLive : t.expandLive}
                  </button>
                </div>
              </div>

              {isLiveExpanded && liveLoading && <p>{t.liveLoading}</p>}
              {isLiveExpanded && !liveLoading && liveError && <p>{t.liveError} ({liveError})</p>}
              {isLiveExpanded && !liveLoading && !liveError && hasRxSearchRequest && filteredLiveResults.length === 0 && (
                <p>{t.liveEmpty}</p>
              )}

              {isLiveExpanded && !liveLoading && !liveError && filteredLiveResults.length > 0 && (
                <>
                  <p className="live-summary">
                    {t.liveShowing}: <strong>{filteredLiveResults.length}</strong>
                  </p>
                  {livePageSize !== 'all' && filteredLiveResults.length > livePageSize && (
                    <div className="live-pagination">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setLivePage((page) => Math.max(1, page - 1))}
                        disabled={livePage === 1}
                      >
                        {t.previousPage}
                      </button>
                      <p>
                        {livePageBounds.start}-{livePageBounds.end} {t.ofLabel} {filteredLiveResults.length}. {t.pageLabel}{' '}
                        {livePage} {t.ofLabel} {liveTotalPages}
                      </p>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setLivePage((page) => Math.min(liveTotalPages, page + 1))}
                        disabled={livePage === liveTotalPages}
                      >
                        {t.nextPage}
                      </button>
                    </div>
                  )}
                  <ul className="live-results-list">
                    {visibleLiveResults.map((medication) => {
                      const detail = liveDetails[medication.nregistro];
                      const withdrawalItems = getCimavetWithdrawalTimeItems(detail, rxSpeciesLabel);
                      const withdrawalMaxDays = getCimavetMaxWithdrawalDays(detail, rxSpeciesLabel);
                      const speciesLabel = detail?.especies?.map((item) => item.nombre).join(', ') ?? '-';
                      const formLabel = medication.forma?.nombre ?? medication.formasFarmaceuticas?.[0]?.nombre ?? '-';
                      const nationalCodeLabel = formatNationalCodeSummary(detail?.presentaciones);
                      const presentationCodeItems = getPresentationCodeItems(detail?.presentaciones);
                      const technicalSheetUrl = getCimavetDocumentUrl(detail, 1);
                      const leafletUrl = getCimavetDocumentUrl(detail, 2);
                      const routeLabel =
                        medication.administracion?.nombre ?? medication.viasAdministracion?.[0]?.nombre ?? '-';

                      return (
                        <li key={medication.nregistro}>
                          <article className="live-card">
                            <header className="live-card-header">
                              <h4>{medication.nombre}</h4>
                              <div className="live-badges">
                                {medication.comerc && <span className="live-badge live-badge-green">{t.commercialized}</span>}
                                {medication.receta && <span className="live-badge live-badge-amber">{t.prescriptionOnly}</span>}
                                {medication.antibiotico && <span className="live-badge live-badge-red">{t.antibiotic}</span>}
                              </div>
                            </header>

                            <div className="live-meta-grid">
                              <p>
                                <span>{t.laboratory}</span>
                                <strong>{medication.labtitular || '-'}</strong>
                              </p>
                              <p>
                                <span>{t.pharmaceuticalForm}</span>
                                <strong>{formLabel}</strong>
                              </p>
                              <p>
                                <span>{t.activeIngredient}</span>
                                <strong>{medication.pactivos ? formatDelimitedText(medication.pactivos) : '-'}</strong>
                              </p>
                              <p>
                                <span>{t.administrationRoute}</span>
                                <strong>{routeLabel}</strong>
                              </p>
                              <p>
                                <span>{t.species}</span>
                                <strong>{speciesLabel}</strong>
                              </p>
                              <p>
                                <span>{t.nationalCode}</span>
                                <strong>{nationalCodeLabel}</strong>
                              </p>
                              <p>
                                <span>{t.withdrawalMax}</span>
                                <strong>{withdrawalMaxDays != null ? formatWithdrawalSummary(withdrawalMaxDays, lang) : '-'}</strong>
                              </p>
                            </div>

                            {renderLiveCollapsibleSection({
                              medicationId: medication.nregistro,
                              keyPrefix: 'indication',
                              title: t.indications,
                              items: detail?.indicaciones ?? [],
                              renderItem: (indication) => (
                                <>
                                  {indication.especie?.nombre ? `${indication.especie.nombre}: ` : ''}
                                  {indication.nombre}
                                </>
                              ),
                            })}

                            {renderLiveCollapsibleSection({
                              medicationId: medication.nregistro,
                              keyPrefix: 'withdrawal',
                              title: t.withdrawalTimes,
                              items: withdrawalItems,
                              renderItem: (item) => formatWithdrawalTimeItem(item),
                            })}

                            {renderPresentationCodeDetails(medication.nregistro, presentationCodeItems, lang, 'rx')}

                            <footer className="live-card-footer">
                              <div className="live-card-identifiers">
                                <span>
                                  {t.registration}: {medication.nregistro}
                                </span>
                              </div>
                              <div className="live-card-links">
                                {technicalSheetUrl ? (
                                  <a href={technicalSheetUrl} target="_blank" rel="noreferrer">
                                    {t.technicalSheet}
                                  </a>
                                ) : null}
                                {leafletUrl ? (
                                  <a href={leafletUrl} target="_blank" rel="noreferrer">
                                    {t.leaflet}
                                  </a>
                                ) : null}
                                <a
                                  href={buildCimavetRecordUrl(CIMAVET_BASE_URL, medication.nregistro)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {lang === 'es' ? 'Ficha CIMAVET' : 'CIMAVET record'}
                                </a>
                              </div>
                            </footer>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          </section>
        )}

        {activeTab === 'otc' && (
          <section className="panel module-panel">
            <div className="module-header">
              <div>
                <p className="section-kicker" translate="no">
                  {lang === 'es' ? 'Catalogo OTC veterinario' : 'Veterinary OTC catalog'}
                </p>
                <h2 translate="no">{t.otcHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Busqueda curada de soluciones no sujetas a prescripcion, con suplementos, higiene, diagnostico y monitorizacion enlazados a paginas oficiales.'
                    : 'Curated search for non-prescription solutions, covering supplements, hygiene, diagnostics, and monitoring entries linked to official sources.'}
                </p>
              </div>
              <div className="module-note">
                <strong>{lang === 'es' ? 'Catalogo inicial' : 'Starter catalog'}</strong>
                <p>
                  {lang === 'es'
                    ? `${otcProducts.length} fichas enlazadas a fuentes oficiales`
                    : `${otcProducts.length} records linked to official sources`}
                </p>
              </div>
            </div>

            <div className="search-grid otc-search-grid">
              <label>
                {t.search}
                <input
                  type="search"
                  placeholder={
                    lang === 'es'
                      ? 'Buscar por producto, laboratorio, activo, categoria o indicacion...'
                      : 'Search by product, manufacturer, actives, category, or indication...'
                  }
                  title={
                    lang === 'es'
                      ? 'Buscar por producto, laboratorio, activo, categoria o indicacion'
                      : 'Search by product, manufacturer, actives, category, or indication'
                  }
                  value={otcQuery}
                  onChange={(event) => setOtcQuery(event.target.value)}
                />
              </label>

              <label>
                {lang === 'es' ? 'Laboratorio' : 'Manufacturer'}
                <select value={otcManufacturer} onChange={(event) => setOtcManufacturer(event.target.value)}>
                  <option value="">{t.all}</option>
                  {otcManufacturerOptions.map((manufacturer) => (
                    <option key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.species}
                <select value={otcSpecies} onChange={(event) => setOtcSpecies(event.target.value)}>
                  <option value="">{t.all}</option>
                  {otcSpeciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {translateMedicalTerm(species, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {lang === 'es' ? 'Categoria' : 'Category'}
                <select value={otcCategory} onChange={(event) => setOtcCategory(event.target.value)}>
                  <option value="">{t.all}</option>
                  {otcCategoryOptions.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label[lang]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {lang === 'es' ? 'Tipo' : 'Type'}
                <select value={otcType} onChange={(event) => setOtcType(event.target.value)}>
                  <option value="">{t.all}</option>
                  {otcTypeOptions.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label[lang]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section className="panel live-results-panel otc-results-panel">
              <div className="live-panel-header">
                <div>
                  <h3>{lang === 'es' ? 'Resultados OTC curados' : 'Curated OTC results'}</h3>
                  <p>{lang === 'es' ? 'Busqueda filtrable con fichas enlazadas a fuente oficial.' : 'Filterable search with cards linked to official sources.'}</p>
                </div>
                {hasOtcSearchCriteria && (
                  <div className="live-panel-tools">
                    <div className="live-page-size">
                      <span>{t.visibleCards}</span>
                      {livePageSizeOptions.map((option) => {
                        const label = option === 'all' ? (lang === 'es' ? 'Todas' : 'All') : option;
                        return (
                          <button
                            key={`otc-page-size-${option}`}
                            type="button"
                            className={otcPageSize === option ? 'active' : ''}
                            onClick={() => setOtcPageSize(option)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {hasOtcSearchCriteria ? (
                <>
                  <div className="live-pagination">
                    <p>
                      {lang === 'es' ? 'Resultados catalogados' : 'Catalog results'}: <strong>{filteredOtcProducts.length}</strong>
                    </p>
                    {otcPageSize !== 'all' && filteredOtcProducts.length > otcPageSize && (
                      <p>
                        {otcPageBounds.start}-{otcPageBounds.end} {t.ofLabel} {filteredOtcProducts.length}. {t.pageLabel}{' '}
                        {otcPage} {t.ofLabel} {otcTotalPages}
                      </p>
                    )}
                  </div>

                  {visibleOtcProducts.length > 0 ? (
                    <div className="feature-grid otc-grid">
                      {visibleOtcProducts.map((product) => (
                        <article key={product.id} className="feature-card otc-card">
                          <div className="otc-card-header">
                            <div>
                              <p className="section-kicker">{product.portfolio ?? product.manufacturer}</p>
                              <h3>{product.productName}</h3>
                            </div>
                          </div>

                          <div
                            className={`otc-badge-row ${hasLongOtcBadgeRow(product, lang) ? 'otc-badge-row-long' : ''} ${
                              isSingleVisibleOtcProduct ? 'otc-badge-row-single' : ''
                            }`}
                          >
                            <span className="otc-badge otc-badge-type" title={product.productType.label[lang]}>
                              {product.productType.label[lang]}
                            </span>
                            <span className="otc-badge otc-badge-category" title={product.category.label[lang]}>
                              {product.category.label[lang]}
                            </span>
                          </div>

                          <p>{product.summary[lang]}</p>

                          <div className="otc-card-meta">
                            <div>
                              <strong>{lang === 'es' ? 'Laboratorio' : 'Manufacturer'}</strong>
                              <span>{product.manufacturer}</span>
                            </div>
                            <div>
                              <strong>{t.species}</strong>
                              <span>{translateMedicalTerms(product.species, lang).join(', ')}</span>
                            </div>
                            <div>
                              <strong>{lang === 'es' ? 'Formato' : 'Format'}</strong>
                              <span>{product.format}</span>
                            </div>
                            <div>
                              <strong>{lang === 'es' ? 'Presentaciones' : 'Presentations'}</strong>
                              <span>{product.presentations.join(', ')}</span>
                            </div>
                            <div className="otc-card-meta-full">
                              <strong>{lang === 'es' ? 'Composicion / activos' : 'Composition / actives'}</strong>
                              <span>{product.activeCompounds}</span>
                            </div>
                          </div>

                          <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="feature-card-link">
                            <span>{lang === 'es' ? 'Abrir ficha oficial' : 'Open official page'}</span>
                          </a>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">{t.noResults}</p>
                  )}

                  {otcPageSize !== 'all' && filteredOtcProducts.length > otcPageSize && (
                    <div className="live-pagination otc-pagination">
                      <button type="button" onClick={() => setOtcPage((current) => Math.max(1, current - 1))} disabled={otcPage === 1}>
                        {t.previousPage}
                      </button>
                      <p>
                        {otcPageBounds.start}-{otcPageBounds.end} {t.ofLabel} {filteredOtcProducts.length}. {t.pageLabel} {otcPage}{' '}
                        {t.ofLabel} {otcTotalPages}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtcPage((current) => Math.min(otcTotalPages, current + 1))}
                        disabled={otcPage === otcTotalPages}
                      >
                        {t.nextPage}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="empty-state">
                  {lang === 'es'
                    ? 'Empieza escribiendo o aplicando un filtro para mostrar productos OTC.'
                    : 'Start typing or apply a filter to display OTC products.'}
                </p>
              )}
            </section>

            <section className="embedded-section otc-onboarding-section">
              <button
                type="button"
                className={`secondary-button otc-disclosure ${isOtcWorkflowExpanded ? 'active' : ''}`}
                onClick={() => setIsOtcWorkflowExpanded((current) => !current)}
              >
                <span>{lang === 'es' ? 'Como entran nuevas marcas OTC' : 'How new OTC brands are added'}</span>
                <span className={`otc-disclosure-caret ${isOtcWorkflowExpanded ? 'open' : ''}`}>▸</span>
              </button>

              {isOtcWorkflowExpanded && (
                <>
                  {renderLocalizedCards(otcWorkflowCards, 'feature-grid-three-up')}

                  <h3>{lang === 'es' ? 'Formato minimo de entrega' : 'Minimum submission format'}</h3>
                  {renderLocalizedCards(otcSubmissionFields, 'feature-grid-four-up')}

                  <div className="feature-callout otc-editorial-callout">
                    <h3>{lang === 'es' ? 'Criterio editorial' : 'Editorial gate'}</h3>
                    <p>
                      {lang === 'es'
                        ? 'Este catalogo se esta cargando de forma curada con fichas oficiales verificables. Sigue abierto para crecer con nuevas marcas siempre que haya trazabilidad, pagina fuente y mantenimiento conjunto del registro.'
                        : 'This catalog is being added as a curated layer from verifiable official pages. It remains open to new manufacturers as long as the source page, traceability, and shared maintenance are preserved.'}
                    </p>
                  </div>
                </>
              )}
            </section>
          </section>
        )}

        {activeTab === 'active' && (
          <section className="panel module-panel">
            <div className="module-header">
              <div>
                <p className="section-kicker">{lang === 'es' ? 'Base colaborativa' : 'Collaborative knowledge base'}</p>
                <h2>{t.activeHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Aqui crece la parte diferencial de WAIRUA VetAI: fichas por principio activo con dosis, vias, indicaciones, protocolos, tiempos de muestreo y referencias validas.'
                    : 'This is the differentiating part of WAIRUA VetAI: active-ingredient records with dose, routes, indications, protocols, sampling windows, and valid references.'}
                </p>
              </div>
              <div className="module-note">
                <strong>{lang === 'es' ? 'Enfoque' : 'Focus'}</strong>
                <p>{lang === 'es' ? 'Curacion colaborativa con revision' : 'Collaborative curation with review'}</p>
              </div>
            </div>

            <div className="search-grid">
              <label>
                {t.search}
                <input
                  type="search"
                  placeholder={t.activeSearchPlaceholder}
                  title={t.activeSearchPlaceholder}
                  value={activeQuery}
                  onChange={(event) => setActiveQuery(event.target.value)}
                />
                <span className="field-hint">
                  {lang === 'es'
                    ? 'Para CIMAVET: escribe un principio activo o usa * con una especie para listar medicamentos autorizados.'
                    : 'For CIMAVET: type an active ingredient or use * with a species to list authorized medicines.'}
                </span>
              </label>

              <label>
                {t.species}
                <select value={activeSpecies} onChange={(event) => setActiveSpecies(event.target.value)}>
                  <option value="">{t.all}</option>
                  {prescriptionSpeciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {translateMedicalTerm(species, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.indicationFilter}
                <select value={activeIndication} onChange={(event) => setActiveIndication(event.target.value)}>
                  <option value="">{t.all}</option>
                  {activeIndicationOptions.map((indication) => (
                    <option key={indication} value={indication}>
                      {translateMedicalTerm(indication, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.concentrationFilter}
                <input
                  type="search"
                  value={activeConcentrationQuery}
                  onChange={(event) => setActiveConcentrationQuery(event.target.value)}
                  placeholder={activeConcentrationPlaceholder}
                  title={activeConcentrationPlaceholder}
                />
              </label>
            </div>

            <section className="tag-filter-panel">
              <div className="tag-filter-header">
                <div>
                  <h3>{t.tagFilterTitle}</h3>
                  <p>{t.tagFilterText}</p>
                </div>
                <button
                  type="button"
                  className="secondary-button tag-filter-toggle"
                  onClick={() => setIsActiveTagFilterExpanded((value) => !value)}
                >
                  {isActiveTagFilterExpanded ? t.collapseLive : t.expandLive}
                </button>
              </div>
              <p className="tag-filter-summary">
                {t.selectedTags}: <strong>{activeTags.length}</strong>
              </p>
              {isActiveTagFilterExpanded && (
                <div className="tag-checklist">
                  {sortedTagOptions.map((tag) => (
                    <label key={tag} className="checkbox-inline tag-check-item">
                      <input
                        type="checkbox"
                        checked={activeTags.some((selectedTag) => hasEquivalentMedicalTerm(selectedTag, tag))}
                        onChange={() => setActiveTags((current) => toggleEquivalentTag(current, tag))}
                      />
                      <span>{translateMedicalTerm(tag, lang)}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {activeKnowledgeView === 'records' && (
              <section className="embedded-section">
                <div className="feature-callout">
                  <h3>{t.liveKnowledgeTitle}</h3>
                  <p>{t.liveKnowledgeText}</p>
                </div>

                <div className="active-live-grid">
                  <section className="live-panel">
                    <div className="live-panel-header">
                      <div>
                        <h3>{t.liveResults}</h3>
                        <p className="live-hint">{t.liveHint}</p>
                      </div>
                      <div className="live-panel-tools">
                        <div className="live-page-size" aria-label={t.visibleCards}>
                          <span>{t.visibleCards}</span>
                          {livePageSizeOptions.map((option) => {
                            const label = option === 'all' ? t.all : String(option);
                            return (
                              <button
                                key={`active-official-vet-size-${option}`}
                                type="button"
                                className={activeOfficialPageSize === option ? 'active' : ''}
                                onClick={() => setActiveOfficialPageSize(option)}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <button className="live-toggle" onClick={() => setIsActiveVetExpanded((value) => !value)} type="button">
                          {isActiveVetExpanded ? t.collapseLive : t.expandLive}
                        </button>
                      </div>
                    </div>

                    {isActiveVetExpanded && activeVetLoading && <p>{t.liveLoading}</p>}
                    {isActiveVetExpanded && !activeVetLoading && activeVetError && <p>{t.liveError} ({activeVetError})</p>}
                    {isActiveVetExpanded && !hasActiveVetSearchRequest && (
                      <p>
                        {lang === 'es'
                          ? 'Escribe un principio activo o usa * con una especie para listar CIMAVET.'
                          : 'Type an active ingredient or use * with a species to list CIMAVET.'}
                      </p>
                    )}
                    {isActiveVetExpanded && hasActiveVetSearchRequest && !activeVetLoading && !activeVetError && filteredActiveVetResults.length === 0 && <p>{t.liveEmpty}</p>}

                    {isActiveVetExpanded && hasActiveVetSearchRequest && !activeVetLoading && !activeVetError && filteredActiveVetResults.length > 0 && (
                      <>
                        <p className="live-summary">
                          {t.liveShowing}: <strong>{filteredActiveVetResults.length}</strong>
                        </p>
                        {activeOfficialPageSize !== 'all' && filteredActiveVetResults.length > activeOfficialPageSize && (
                          <div className="live-pagination">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setActiveVetPage((page) => Math.max(1, page - 1))}
                              disabled={activeVetPage === 1}
                            >
                              {t.previousPage}
                            </button>
                            <p>
                              {activeVetPageBounds.start}-{activeVetPageBounds.end} {t.ofLabel} {filteredActiveVetResults.length}. {t.pageLabel}{' '}
                              {activeVetPage} {t.ofLabel} {activeVetTotalPages}
                            </p>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setActiveVetPage((page) => Math.min(activeVetTotalPages, page + 1))}
                              disabled={activeVetPage === activeVetTotalPages}
                            >
                              {t.nextPage}
                            </button>
                          </div>
                        )}
                        <ul className="live-results-list">
                          {activeVetResultsForDetails.map((medication) => {
                            const detail = activeVetDetails[medication.nregistro];
                            const withdrawalItems = getCimavetWithdrawalTimeItems(detail);
                            const nationalCodeLabel = formatNationalCodeSummary(detail?.presentaciones);
                            const presentationCodeItems = getPresentationCodeItems(detail?.presentaciones);
                            const technicalSheetUrl = getCimavetDocumentUrl(detail, 1);
                            const leafletUrl = getCimavetDocumentUrl(detail, 2);

                            return (
                              <li key={`active-vet-${medication.nregistro}`}>
                                <article className="live-card">
                                  <header className="live-card-header">
                                    <h4>{medication.nombre}</h4>
                                    <div className="live-badges">
                                      {medication.comerc && <span className="live-badge live-badge-green">{t.commercialized}</span>}
                                      {medication.receta && <span className="live-badge live-badge-amber">{t.prescriptionOnly}</span>}
                                      {medication.antibiotico && <span className="live-badge live-badge-red">{t.antibiotic}</span>}
                                    </div>
                                  </header>

                                  <div className="live-meta-grid">
                                    <p>
                                      <span>{t.laboratory}</span>
                                      <strong>{medication.labtitular || '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.pharmaceuticalForm}</span>
                                      <strong>{medication.forma?.nombre || '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.activeIngredient}</span>
                                      <strong>{medication.pactivos ? formatDelimitedText(medication.pactivos) : '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.administrationRoute}</span>
                                      <strong>{medication.administracion?.nombre || '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.nationalCode}</span>
                                      <strong>{nationalCodeLabel}</strong>
                                    </p>
                                  </div>

                                  {renderLiveCollapsibleSection({
                                    medicationId: medication.nregistro,
                                    keyPrefix: 'active-indication',
                                    title: t.indications,
                                    items: detail?.indicaciones ?? [],
                                    renderItem: (indication) => (
                                      <>
                                        {indication.especie?.nombre ? `${indication.especie.nombre}: ` : ''}
                                        {indication.nombre}
                                      </>
                                    ),
                                  })}

                                  {renderLiveCollapsibleSection({
                                    medicationId: medication.nregistro,
                                    keyPrefix: 'active-withdrawal',
                                    title: t.withdrawalTimes,
                                    items: withdrawalItems,
                                    renderItem: (item) => formatWithdrawalTimeItem(item),
                                  })}

                                  {renderPresentationCodeDetails(medication.nregistro, presentationCodeItems, lang, 'active-vet')}

                                  <footer className="live-card-footer">
                                    <div className="live-card-identifiers">
                                      <span>
                                        {t.registration}: {medication.nregistro}
                                      </span>
                                    </div>
                                    <div className="live-card-links">
                                      {technicalSheetUrl ? (
                                        <a href={technicalSheetUrl} target="_blank" rel="noreferrer">
                                          {t.technicalSheet}
                                        </a>
                                      ) : null}
                                      {leafletUrl ? (
                                        <a href={leafletUrl} target="_blank" rel="noreferrer">
                                          {t.leaflet}
                                        </a>
                                      ) : null}
                                      <a
                                        href={buildCimavetRecordUrl(CIMAVET_BASE_URL, medication.nregistro)}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {lang === 'es' ? 'Ficha CIMAVET' : 'CIMAVET record'}
                                      </a>
                                    </div>
                                  </footer>
                                </article>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </section>

                  <section className="live-panel">
                    <div className="live-panel-header">
                      <div>
                        <h3>{t.humanLiveResults}</h3>
                        <p className="live-hint">{t.humanLiveHint}</p>
                      </div>
                      <div className="live-panel-tools">
                        <div className="live-page-size" aria-label={t.visibleCards}>
                          <span>{t.visibleCards}</span>
                          {livePageSizeOptions.map((option) => {
                            const label = option === 'all' ? t.all : String(option);
                            return (
                              <button
                                key={`active-official-human-size-${option}`}
                                type="button"
                                className={activeOfficialPageSize === option ? 'active' : ''}
                                onClick={() => setActiveOfficialPageSize(option)}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <button className="live-toggle" onClick={() => setIsActiveHumanExpanded((value) => !value)} type="button">
                          {isActiveHumanExpanded ? t.collapseLive : t.expandLive}
                        </button>
                      </div>
                    </div>

                    {isActiveHumanExpanded && activeHumanLoading && <p>{t.humanLiveLoading}</p>}
                    {isActiveHumanExpanded && !activeHumanLoading && activeHumanError && <p>{t.humanLiveError} ({activeHumanError})</p>}
                    {isActiveHumanExpanded && activeQuery.trim().length < 2 && (
                      <p>{lang === 'es' ? 'Escribe un principio activo para consultar CIMA.' : 'Type an active ingredient to query CIMA.'}</p>
                    )}
                    {isActiveHumanExpanded && activeQuery.trim().length >= 2 && !activeHumanLoading && !activeHumanError && filteredActiveHumanResults.length === 0 && (
                      <p>{t.humanLiveEmpty}</p>
                    )}

                    {isActiveHumanExpanded && activeQuery.trim().length >= 2 && !activeHumanLoading && !activeHumanError && filteredActiveHumanResults.length > 0 && (
                      <>
                        <p className="live-summary">
                          {t.humanLiveShowing}: <strong>{filteredActiveHumanResults.length}</strong>
                        </p>
                        {activeOfficialPageSize !== 'all' && filteredActiveHumanResults.length > activeOfficialPageSize && (
                          <div className="live-pagination">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setActiveHumanPage((page) => Math.max(1, page - 1))}
                              disabled={activeHumanPage === 1}
                            >
                              {t.previousPage}
                            </button>
                            <p>
                              {activeHumanPageBounds.start}-{activeHumanPageBounds.end} {t.ofLabel} {filteredActiveHumanResults.length}. {t.pageLabel}{' '}
                              {activeHumanPage} {t.ofLabel} {activeHumanTotalPages}
                            </p>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setActiveHumanPage((page) => Math.min(activeHumanTotalPages, page + 1))}
                              disabled={activeHumanPage === activeHumanTotalPages}
                            >
                              {t.nextPage}
                            </button>
                          </div>
                        )}
                        <ul className="live-results-list">
                          {activeHumanResultsForDetails.map((medication) => {
                            const detail = activeHumanDetails[medication.nregistro];
                            const technicalSheetUrl = getCimaDocumentUrl(detail ?? medication, 1);
                            const leafletUrl = getCimaDocumentUrl(detail ?? medication, 2);
                            const recordUrl = buildCimaRecordUrl(CIMA_BASE_URL, medication.nregistro);
                            const nationalCodeLabel = formatNationalCodeSummary(detail?.presentaciones);
                            const presentationCodeItems = getPresentationCodeItems(detail?.presentaciones);

                            return (
                              <li key={`active-human-${medication.nregistro}`}>
                                <article className="live-card">
                                  <header className="live-card-header">
                                    <h4>{medication.nombre}</h4>
                                    <div className="live-badges">
                                      {medication.comerc && <span className="live-badge live-badge-green">{t.commercialized}</span>}
                                      {medication.receta && <span className="live-badge live-badge-amber">{t.prescriptionOnly}</span>}
                                      {medication.generico && <span className="live-badge live-badge-blue">{t.generic}</span>}
                                    </div>
                                  </header>

                                  <div className="live-meta-grid">
                                    <p>
                                      <span>{t.laboratory}</span>
                                      <strong>{medication.labtitular || '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.pharmaceuticalForm}</span>
                                      <strong>
                                        {medication.formaFarmaceuticaSimplificada?.nombre ??
                                          medication.formaFarmaceutica?.nombre ??
                                          '-'}
                                      </strong>
                                    </p>
                                    <p>
                                      <span>{t.activeIngredient}</span>
                                      <strong>{medication.pactivos ? formatDelimitedText(medication.pactivos) : '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.dose}</span>
                                      <strong>{medication.dosis || '-'}</strong>
                                    </p>
                                    <p>
                                      <span>{t.nationalCode}</span>
                                      <strong>{nationalCodeLabel}</strong>
                                    </p>
                                  </div>

                                  {detail?.viasAdministracion?.length ? (
                                    <section className="live-indications">
                                      <h5>{t.presentation}</h5>
                                      <ul>
                                        {detail.viasAdministracion.slice(0, 4).map((route, index) => (
                                          <li key={`${medication.nregistro}-active-route-${index}`}>{route.nombre}</li>
                                        ))}
                                      </ul>
                                    </section>
                                  ) : null}

                                  {presentationCodeItems.length > 0 ? (
                                    <section className="live-indications">
                                      <h5>{lang === 'es' ? 'Presentaciones y CN' : 'Presentations and national code'}</h5>
                                      <ul>
                                        {presentationCodeItems.map((item, index) => (
                                          <li key={`${medication.nregistro}-active-human-presentation-cn-${index}`}>{formatPresentationCodeLine(item)}</li>
                                        ))}
                                      </ul>
                                    </section>
                                  ) : null}

                                  <footer className="live-card-footer">
                                    <div className="live-card-identifiers">
                                      <span>
                                        {t.registration}: {medication.nregistro}
                                      </span>
                                    </div>
                                    <div className="live-card-links">
                                      {technicalSheetUrl && (
                                        <a href={technicalSheetUrl} target="_blank" rel="noreferrer">
                                          {t.technicalSheet}
                                        </a>
                                      )}
                                      {leafletUrl && (
                                        <a href={leafletUrl} target="_blank" rel="noreferrer">
                                          {t.leaflet}
                                        </a>
                                      )}
                                      <a href={recordUrl} target="_blank" rel="noreferrer">
                                        {t.openRecord}
                                      </a>
                                    </div>
                                  </footer>
                                </article>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </section>
                </div>
              </section>
            )}

            <div className="collaborative-callout">
              <h3>{t.collaborativeNoticeTitle}</h3>
              <p>{t.collaborativeNoticeText}</p>
              {!canCreateEditorial ? (
                <p className="collaborative-permissions-note">
                  {lang === 'es'
                    ? 'Tu perfil actual es de solo lectura. El administrador puede autorizarte como contributor, editor, reviewer o admin.'
                    : 'Your current profile is read-only. An administrator can authorize you as contributor, editor, reviewer, or admin.'}
                </p>
              ) : null}
            </div>

            {remoteSyncMessage && <p className="form-message form-error">{remoteSyncMessage}</p>}

            {canManageEditorial ? (
              <section className="editorial-queue-board">
                <div className="module-header editorial-queue-header">
                  <div>
                    <p className="section-kicker">{t.editorialWorkflowTitle}</p>
                    <h3>{t.editorialWorkflowTitle}</h3>
                    <p>{t.editorialWorkflowText}</p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setActiveKnowledgeView('create');
                      setEditingEntry(null);
                    }}
                  >
                    {t.editorialQueueOpenCreate}
                  </button>
                </div>

                <div className="feature-grid editorial-queue-grid">
                  {editorialQueueCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={`feature-card editorial-queue-card ${effectiveEditorialQueueFilter === card.id ? 'is-active' : ''}`}
                      onClick={() => setEditorialQueueFilter((current) => (current === card.id ? 'all' : card.id))}
                    >
                      <span className="section-kicker">{card.label}</span>
                      <strong>{card.count}</strong>
                      <p>{card.note}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`feature-card editorial-queue-card ${effectiveEditorialQueueFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setEditorialQueueFilter('all')}
                  >
                    <span className="section-kicker">{t.editorialQueueAll}</span>
                    <strong>{entryCatalog.length}</strong>
                    <p>{t.activeIngredientSummaries}</p>
                  </button>
                </div>
              </section>
            ) : null}

            <div className="subtabs" role="tablist" aria-label="Knowledge views">
              <button
                onClick={() => {
                  setActiveKnowledgeView('records');
                  setEditingEntry(null);
                }}
                className={activeKnowledgeView === 'records' ? 'active' : ''}
              >
                {t.recordsView}
              </button>
              {canCreateEditorial ? (
                <button
                  onClick={() => {
                    setActiveKnowledgeView('create');
                    setEditingEntry(null);
                  }}
                  className={activeKnowledgeView === 'create' ? 'active' : ''}
                >
                  {t.createRecordView}
                </button>
              ) : null}
            </div>

            {activeKnowledgeView === 'records' && (
              <>
                <div className="live-panel-header active-records-header">
                  <div>
                    <h3>{`${t.activeIngredientSummaries}: ${activeFilteredCount}`}</h3>
                    <p className="live-hint">
                      {lang === 'es'
                        ? 'Listado alfabetico. Busca por principio activo o filtra por especie, indicacion, tags o presentacion.'
                        : 'Alphabetical list. Search by active ingredient or filter by species, indication, tags, or presentation.'}
                    </p>
                  </div>
                  {shouldShowActiveRecords && (
                    <div className="live-panel-tools">
                      <div className="live-page-size" aria-label={t.visibleCards}>
                        <span>{t.visibleCards}</span>
                        {activeRecordPageSizeOptions.map((option) => {
                          const label = option === 'all' ? t.all : String(option);
                          return (
                            <button
                              key={`active-size-${option}`}
                              type="button"
                              className={activeRecordPageSize === option ? 'active' : ''}
                              onClick={() => setActiveRecordPageSize(option)}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {shouldShowActiveRecords && activeFilteredCount === 0 && <p>{t.noResults}</p>}
                {shouldShowActiveRecords && activeRecordPageSize !== 'all' && activeFilteredCount > activeRecordPageSize && (
                  <div className="live-pagination">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setActiveRecordPage((page) => Math.max(1, page - 1))}
                      disabled={activeRecordPage === 1}
                    >
                      {t.previousPage}
                    </button>
                    <p>
                      {activeRecordBounds.start}-{activeRecordBounds.end} {t.ofLabel} {activeFilteredCount}. {t.pageLabel}{' '}
                      {activeRecordPage} {t.ofLabel} {activeRecordTotalPages}
                    </p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setActiveRecordPage((page) => Math.min(activeRecordTotalPages, page + 1))}
                      disabled={activeRecordPage === activeRecordTotalPages}
                    >
                      {t.nextPage}
                    </button>
                  </div>
                )}
                {shouldShowActiveRecords && (
                  <div className="entry-grid">
                    {visibleActiveEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        lang={lang}
                        onEdit={openEntryEditor}
                        onDelete={handleDeleteEntry}
                        canManage={canManageEditorial}
                        canReview={canReviewEditorial}
                        canActivate={canActivateEditorial}
                        onReview={handleReviewEntry}
                        onPublicationChange={handlePublicationChange}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeKnowledgeView === 'create' && canCreateEditorial && (
              <section className="embedded-section">
                <ActiveIngredientForm
                  lang={lang}
                  speciesOptions={sortedSpeciesOptions}
                  systemOptions={systemOptions}
                  tagOptions={tagOptions}
                  initialEntry={editingEntry}
                  onSubmit={handleSaveEntry}
                  onCancelEdit={() => setEditingEntry(null)}
                />
              </section>
            )}
          </section>
        )}

        {activeTab === 'toolkit' && (
          <section className="panel module-panel">
            <div className="module-header">
              <div>
                <p className="section-kicker">{lang === 'es' ? 'Veterinary toolkit' : 'Veterinary toolkit'}</p>
                <h2>{t.toolkitHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Modulo para reunir calculadoras, conversiones, protocolos y accesos rapidos que hoy estan dispersos en distintas apps y hojas de trabajo.'
                    : 'Module to gather calculators, conversions, protocols, and shortcuts that are currently spread across different apps and worksheets.'}
                </p>
              </div>
              {activeToolkitView !== 'overview' ? (
                <button type="button" className="module-back-button" onClick={() => setActiveToolkitView('overview')}>
                  {lang === 'es' ? 'Volver al resumen' : 'Back to overview'}
                </button>
              ) : null}
            </div>

            {activeToolkitView === 'overview' && (
              <>
                {renderLocalizedCards(toolkitModules)}
              </>
            )}

            {activeToolkitView === 'dose' && (
              <DoseCalculator
                entries={doseCalculatorEntries}
                lang={lang}
                onOpenKnowledge={(entry) => openKnowledgeRecord(entry.linkedEntryId, entry.activeIngredient)}
                onReviewEntry={(entry, approvalLevel) => {
                  const matched = entryCatalog.find((item) => item.id === entry.linkedEntryId);
                  if (matched) void handleReviewEntry(matched, approvalLevel);
                }}
                onPublicationChange={(entry, status) => {
                  const matched = entryCatalog.find((item) => item.id === entry.linkedEntryId);
                  if (matched) void handlePublicationChange(matched, status);
                }}
                canReview={canReviewEditorial}
                canActivate={canActivateEditorial}
              />
            )}

            {activeToolkitView === 'infusion' && <InfusionCalculator lang={lang} />}

            {activeToolkitView === 'genetics' && <GeneticsToolkit lang={lang} />}

            {activeToolkitView === 'interactions' && <DrugInteractionChecker lang={lang} entries={entriesVisibleToCurrentUser} />}

            {activeToolkitView === 'constants' && <VitalConstantsToolkit lang={lang} />}

            {activeToolkitView === 'ranges' && (
              <ComingSoonToolkit lang={lang} species={speciesReferenceScope} {...comingSoonToolkitContent.ranges} />
            )}

            {activeToolkitView === 'fluid' && <FluidTherapyToolkit lang={lang} />}

            {activeToolkitView === 'anesthesia' && <AnesthesiaToolkit lang={lang} />}

            {activeToolkitView === 'emergency' && (
              <ComingSoonToolkit lang={lang} species={speciesReferenceScope} {...comingSoonToolkitContent.emergency} />
            )}

            {activeToolkitView === 'converter' && <UnitConverter lang={lang} />}

            {activeToolkitView === 'surface' && <BodySurfaceAreaCalculator lang={lang} />}

            {activeToolkitView === 'nutrition' && <ClinicalNutritionToolkit lang={lang} service={clinicalNutritionService} />}

            {activeToolkitView === 'assistant' && (
              <section className="embedded-section">
                <h3>{t.assistantForm}</h3>
                <p className="assistant-subtitle">{t.assistantText}</p>

                <form
                  className="search-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setAssistantGenerated(true);
                  }}
                >
                  <label>
                    {t.patientSpecies}
                    <select value={assistantSpecies} onChange={(event) => setAssistantSpecies(event.target.value)}>
                      <option value="">{t.all}</option>
                      {sortedSpeciesOptions.map((species) => (
                        <option key={species} value={species}>
                          {translateMedicalTerm(species, lang)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {t.suspectedPathology}
                    <select value={assistantPathology} onChange={(event) => setAssistantPathology(event.target.value)}>
                      <option value="">{t.all}</option>
                      {pathologyOptions.map((pathology) => (
                        <option key={pathology} value={pathology}>
                          {translateMedicalTerm(pathology, lang)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {t.weightKg}
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={assistantWeight}
                      onChange={(event) => setAssistantWeight(event.target.value)}
                      placeholder="4.5"
                      title="4.5"
                    />
                  </label>

                  <label>
                    {t.clinicalNotes}
                    <input
                      type="text"
                      value={assistantNotes}
                      onChange={(event) => setAssistantNotes(event.target.value)}
                      placeholder={lang === 'es' ? 'Ejemplo: insuficiencia renal, geriatrico...' : 'Example: renal disease, geriatric...'}
                      title={lang === 'es' ? 'Ejemplo: insuficiencia renal, geriatrico...' : 'Example: renal disease, geriatric...'}
                    />
                  </label>

                  <button type="submit" className="generate-button">
                    {t.generateGuide}
                  </button>
                </form>

                {assistantGenerated && (
                  <div className="assistant-result">
                    <h3>{t.suggestedGuide}</h3>
                    {assistantMatches.length === 0 ? (
                      <p>{t.noGuide}</p>
                    ) : (
                      <>
                        <p>
                          {assistantWeight
                            ? lang === 'es'
                              ? `Paciente de ${assistantWeight} kg. Ajustar siempre dosis final a ficha tecnica y criterio clinico.`
                              : `Patient weight: ${assistantWeight} kg. Always finalize dosage based on SmPC and clinical judgement.`
                            : lang === 'es'
                              ? 'Recomendacion preliminar: verificar dosis final segun ficha tecnica, especie y comorbilidades.'
                              : 'Preliminary recommendation: confirm final dosage based on SmPC, species and comorbidities.'}
                        </p>
                        {assistantNotes && <p className="assistant-notes">{assistantNotes}</p>}
                        <div className="assistant-list">
                          {assistantMatches.slice(0, 4).map((entry) => (
                            <article key={entry.id} className="assistant-item">
                              <h4>{entry.activeIngredient}</h4>
                              <p>
                                <strong>{t.tradeNames}:</strong> {entry.tradeNames.join(', ')}
                              </p>
                              <p>
                                <strong>{t.pathologies}:</strong> {translateMedicalTerms(entry.pathologies, lang).join(', ')}
                              </p>
                              <p>
                                <strong>{t.dosage}:</strong> {entry.dosage[lang]}
                              </p>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeToolkitView === 'management' && <ManagementToolkit lang={lang} />}
          </section>
        )}

        {activeTab === 'human' && (
          <section className="panel module-panel">
            <div className="module-header">
              <div>
                <p className="section-kicker">{lang === 'es' ? 'Busqueda oficial' : 'Official search'}</p>
                <h2>{t.humanHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Buscador de medicamentos de humana conectado a la API oficial de CIMA para contrastar presentaciones, principios activos y documentacion regulatoria.'
                    : 'Search for human medicines connected to the official CIMA API to cross-check presentations, active ingredients, and regulatory documents.'}
                </p>
              </div>
              <div className="module-note">
                <strong>{lang === 'es' ? 'Fuente regulatoria' : 'Regulatory source'}</strong>
                <p>CIMA / AEMPS</p>
              </div>
            </div>

            <div className="search-grid">
              <label>
                {t.search}
                <input
                  type="search"
                  placeholder={t.humanSearchPlaceholder}
                  title={t.humanSearchPlaceholder}
                  value={humanQuery}
                  onChange={(event) => setHumanQuery(event.target.value)}
                />
              </label>

              <label>
                {t.dose}
                <input
                  type="search"
                  placeholder={t.humanDosePlaceholder}
                  title={t.humanDosePlaceholder}
                  value={humanDoseFilter}
                  onChange={(event) => setHumanDoseFilter(event.target.value)}
                />
              </label>

              <label>
                {t.presentation}
                <input
                  type="search"
                  placeholder={t.humanPresentationPlaceholder}
                  title={t.humanPresentationPlaceholder}
                  value={humanPresentationFilter}
                  onChange={(event) => setHumanPresentationFilter(event.target.value)}
                />
              </label>
            </div>

            <div className="search-grid-checkboxes">
              <strong>{t.results}</strong>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={humanOnlyCommercialized}
                  onChange={(event) => setHumanOnlyCommercialized(event.target.checked)}
                />
                {t.commercializedOnly}
              </label>
            </div>

            <section className="live-panel">
              <div className="live-panel-header">
                <div>
                  <h3>{t.humanLiveResults}</h3>
                  <p className="live-hint">{t.humanLiveHint}</p>
                </div>
                <div className="live-panel-tools">
                  <div className="live-page-size" aria-label={t.visibleCards}>
                    <span>{t.visibleCards}</span>
                    {livePageSizeOptions.map((option) => {
                      const label = option === 'all' ? t.all : String(option);
                      return (
                        <button
                          key={`human-size-${option}`}
                          type="button"
                          className={humanPageSize === option ? 'active' : ''}
                          onClick={() => setHumanPageSize(option)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {humanLoading && <p>{t.humanLiveLoading}</p>}
              {!humanLoading && humanError && <p>{t.humanLiveError} ({humanError})</p>}
              {!humanLoading && !humanError && humanQuery.trim().length >= 2 && humanResults.length === 0 && (
                <p>{t.humanLiveEmpty}</p>
              )}
              {!humanLoading && !humanError && humanResults.length > 0 && filteredHumanResults.length === 0 && <p>{t.noResults}</p>}

              {!humanLoading && !humanError && filteredHumanResults.length > 0 && (
                <>
                  <p className="live-summary">
                    {t.humanLiveShowing}: <strong>{filteredHumanResults.length}</strong>
                    {filteredHumanResults.length !== humanResults.length ? ` / ${humanResults.length}` : ''}
                  </p>
                  {humanPageSize !== 'all' && filteredHumanResults.length > humanPageSize && (
                    <div className="live-pagination">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setHumanPage((page) => Math.max(1, page - 1))}
                        disabled={humanPage === 1}
                      >
                        {t.previousPage}
                      </button>
                      <p>
                        {humanPageBounds.start}-{humanPageBounds.end} {t.ofLabel} {filteredHumanResults.length}. {t.pageLabel}{' '}
                        {humanPage} {t.ofLabel} {humanTotalPages}
                      </p>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setHumanPage((page) => Math.min(humanTotalPages, page + 1))}
                        disabled={humanPage === humanTotalPages}
                      >
                        {t.nextPage}
                      </button>
                    </div>
                  )}
                  {filteredHumanResults.length > humanResultsForDetails.length && (
                    <p className="live-summary-note">
                      {lang === 'es'
                        ? 'Se cargan presentaciones ampliadas para los resultados visibles.'
                        : 'Expanded presentations are loaded for the visible results.'}
                    </p>
                  )}
                  <ul className="live-results-list">
                    {visibleHumanResults.map((medication) => {
                      const detail = humanDetails[medication.nregistro];
                      const activeIngredient =
                        detail?.principiosActivos
                          ?.map((item) =>
                            `${item.nombre}${item.cantidad ? ` ${item.cantidad}` : ''}${item.unidad ? ` ${item.unidad}` : ''}`.trim(),
                          )
                          .filter(Boolean)
                          .join(' + ') ||
                        detail?.pactivos ||
                        medication.pactivos ||
                        medication.vtm?.nombre ||
                        '-';
                      const technicalSheetUrl = getCimaDocumentUrl(detail ?? medication, 1);
                      const leafletUrl = getCimaDocumentUrl(detail ?? medication, 2);
                      const route = medication.viasAdministracion?.map((item) => item.nombre).join(', ') || '-';
                      const form =
                        medication.formaFarmaceuticaSimplificada?.nombre ||
                        medication.formaFarmaceutica?.nombre ||
                        '-';
                      const nationalCodeLabel = formatNationalCodeSummary(detail?.presentaciones);
                      const presentationCodeItems = getPresentationCodeItems(detail?.presentaciones);

                      return (
                        <li key={medication.nregistro}>
                          <article className="live-card">
                            <header className="live-card-header">
                              <h4>{medication.nombre}</h4>
                              <div className="live-badges">
                                {medication.comerc && <span className="live-badge live-badge-green">{t.commercialized}</span>}
                                {medication.receta && <span className="live-badge live-badge-amber">{t.prescriptionOnly}</span>}
                                {medication.generico && <span className="live-badge live-badge-blue">{t.generic}</span>}
                              </div>
                            </header>

                            <div className="live-meta-grid">
                              <p>
                                <span>{t.laboratory}</span>
                                <strong>{medication.labtitular || '-'}</strong>
                              </p>
                              <p>
                                <span>{t.pharmaceuticalForm}</span>
                                <strong>{form}</strong>
                              </p>
                              <p>
                                <span>{t.activeIngredient}</span>
                                <strong>{activeIngredient}</strong>
                              </p>
                              <p>
                                <span>{t.administrationRoute}</span>
                                <strong>{route}</strong>
                              </p>
                              <p>
                                <span>{t.dose}</span>
                                <strong>{medication.dosis || '-'}</strong>
                              </p>
                              <p>
                                <span>{lang === 'es' ? 'Dispensacion' : 'Dispensing'}</span>
                                <strong>{medication.cpresc || '-'}</strong>
                              </p>
                              <p>
                                <span>{t.nationalCode}</span>
                                <strong>{nationalCodeLabel}</strong>
                              </p>
                            </div>

                            {detail?.presentaciones?.length ? (
                              <section className="live-indications">
                                <h5>{t.presentation}</h5>
                                <ul>
                                  {detail.presentaciones.map((presentation) => (
                                    <li key={`${medication.nregistro}-${presentation.cn}`}>{presentation.nombre}</li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}

                            {presentationCodeItems.length > 0 ? (
                              <section className="live-indications">
                                <h5>{lang === 'es' ? 'Presentaciones y CN' : 'Presentations and national code'}</h5>
                                <ul>
                                  {presentationCodeItems.map((item, index) => (
                                    <li key={`${medication.nregistro}-human-presentation-cn-${index}`}>{formatPresentationCodeLine(item)}</li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}

                            <footer className="live-card-footer">
                              <div className="live-card-identifiers">
                                <span>
                                  {t.registration}: {medication.nregistro}
                                </span>
                              </div>
                              <div className="live-card-links">
                                {technicalSheetUrl && (
                                  <a href={technicalSheetUrl} target="_blank" rel="noreferrer">
                                    {t.technicalSheet}
                                  </a>
                                )}
                                {leafletUrl && (
                                  <a href={leafletUrl} target="_blank" rel="noreferrer">
                                    {t.leaflet}
                                  </a>
                                )}
                                <a href={buildCimaRecordUrl(CIMA_BASE_URL, medication.nregistro)} target="_blank" rel="noreferrer">
                                  {t.openRecord}
                                </a>
                              </div>
                            </footer>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

          </section>
        )}
      </main>

      {activeTab === 'toolkit' && activeToolkitView === 'overview' && (
        <footer className="footer-grid footer-grid-single">
          <section>
            <h3>{t.contribute}</h3>
            <p>{t.contributeText}</p>
          </section>
        </footer>
      )}

      <section className="app-signature">
        <img src={wairuaLogo} alt="WAIRUA" className="brand-logo brand-logo-signature" />
        <p>{lang === 'es' ? 'Desarrollado por' : 'Developed by'}</p>
        <strong>PhD LV MSc German Quintana Diez</strong>
        <span>WAIRUA Veterinary Precision Medicine</span>
      </section>

      <LegalCompliance lang={lang} contactEmail={SUPPORT_EMAIL} />

      {isAccountMenuOpen ? (
        <div className="account-menu-popover" role="dialog" aria-modal="true" aria-label={lang === 'es' ? 'Mi cuenta' : 'My account'}>
          <button
            type="button"
            className="account-menu-backdrop"
            aria-label={lang === 'es' ? 'Cerrar panel de cuenta' : 'Close account panel'}
            onClick={() => setIsAccountMenuOpen(false)}
          />
          <div className="account-menu-panel">
            <AuthAccessPanel
              lang={lang}
              service={supabaseAccessService}
              account={authAccount}
              onRefreshAccount={refreshAuthAccount}
              accessPreviewMode={accessPreviewMode}
              onChangeAccessPreviewMode={setAccessPreviewMode}
              onClose={() => setIsAccountMenuOpen(false)}
              supportEmail={SUPPORT_EMAIL}
            />
          </div>
        </div>
      ) : null}

      {isSupportFormOpen ? (
        <div className="support-modal" role="dialog" aria-modal="true" aria-label={lang === 'es' ? 'Formulario de incidencias' : 'Issue form'}>
          <button
            type="button"
            className="account-menu-backdrop"
            aria-label={lang === 'es' ? 'Cerrar formulario' : 'Close form'}
            onClick={() => setIsSupportFormOpen(false)}
          />
          <form
            className="support-form-panel"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitSupportIssue();
            }}
          >
            <div className="support-form-header">
              <div>
                <span className="section-kicker">{lang === 'es' ? 'Soporte' : 'Support'}</span>
                <h3>{lang === 'es' ? 'Enviar incidencia o propuesta' : 'Send an issue or proposal'}</h3>
                <p>
                  {lang === 'es'
                    ? 'Se guardará directamente en el panel de soporte de la app.'
                    : 'It will be saved directly in the app support queue.'}
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsSupportFormOpen(false)}>
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
            <label>
              {lang === 'es' ? 'Tipo' : 'Type'}
              <select value={supportIssueType} onChange={(event) => setSupportIssueType(event.target.value)}>
                {supportIssueOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {lang === 'es' ? 'Descripcion' : 'Description'}
              <textarea
                rows={7}
                value={supportIssueText}
                onChange={(event) => setSupportIssueText(event.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Qué estabas haciendo, qué esperabas ver y qué ha pasado.'
                    : 'What you were doing, what you expected, and what happened.'
                }
              />
            </label>
            <div className="support-form-actions">
              <a href={supportMailto} className="secondary-button">
                {lang === 'es' ? 'Enviar por email' : 'Send by email'}
              </a>
              <button type="submit" className="theme-button" disabled={!supportIssueText.trim() || supportIssueSubmitting}>
                {supportIssueSubmitting ? (lang === 'es' ? 'Enviando...' : 'Sending...') : lang === 'es' ? 'Enviar incidencia' : 'Send issue'}
              </button>
            </div>
            {supportIssueStatus ? <p className="form-message form-success">{supportIssueStatus}</p> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default App;
