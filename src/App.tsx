import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ActiveIngredientForm from './components/ActiveIngredientForm';
import AuthAccessPanel from './components/AuthAccessPanel';
import BodySurfaceAreaCalculator from './components/BodySurfaceAreaCalculator';
import ClinicalNutritionToolkit from './components/ClinicalNutritionToolkit';
import DoseCalculator from './components/DoseCalculator';
import EndocrineToolkit from './components/EndocrineToolkit';
import EntryCard from './components/EntryCard';
import HaemotherapyCalculator from './components/HaemotherapyCalculator';
import InfusionCalculator from './components/InfusionCalculator';
import UnitConverter from './components/UnitConverter';
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
import { expandMedicalTermAliases, translateMedicalTerm, translateMedicalTerms } from './lib/terms';
import {
  buildCimaRecordUrl,
  CimaMedicationDetail,
  CimaMedicationSummary,
  createCimaServiceFromEnv,
  resolveCimaBaseUrl,
} from './services/cima';
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
import { createClinicalNutritionService } from './services/clinicalNutrition';
import { createSupabaseAccessService, createSupabaseEditorialService } from './services/supabase';
import { AuthAccountSnapshot, OtcProductRecord, TherapeuticEntry } from './types';

gsap.registerPlugin(ScrollTrigger);

const productTabs = ['prescription', 'human', 'active', 'otc', 'toolkit'] as const;
const premiumTabs = ['active', 'toolkit'] as const;
const activeViews = ['records', 'create'] as const;
const toolkitViews = ['overview', 'dose', 'infusion', 'haemotherapy', 'endocrine', 'converter', 'surface', 'assistant', 'nutrition'] as const;
const CIMA_BASE_URL = resolveCimaBaseUrl(import.meta.env.VITE_CIMA_BASE_URL);
const CIMAVET_BASE_URL = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);

type ProductTab = (typeof productTabs)[number];
type ActiveView = (typeof activeViews)[number];
type ToolkitView = (typeof toolkitViews)[number];

const premiumTabSet = new Set<ProductTab>(premiumTabs);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }
  return 'Unknown error';
};

const getCimaDocumentUrl = (medication: Pick<CimaMedicationSummary, 'docs'> | undefined, type: number) => {
  const doc = medication?.docs?.find((item) => item.tipo === type);
  return doc?.urlHtml ?? doc?.url ?? null;
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

const hasEquivalentMedicalTerm = (left: string, right: string) => {
  const leftAliases = new Set(expandMedicalTermAliases(left));
  return expandMedicalTermAliases(right).some((alias) => leftAliases.has(alias));
};

const toggleEquivalentTag = (current: string[], value: string) => {
  const exists = current.some((item) => hasEquivalentMedicalTerm(item, value));
  if (exists) {
    return current.filter((item) => !hasEquivalentMedicalTerm(item, value));
  }
  return [...current, value];
};

const productionSpeciesOptions = ['Bovine', 'Ovine', 'Caprine', 'Porcine', 'Poultry', 'Equine', 'Fish', 'Bee'] as const;

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

const getCimavetDetailFilterText = (medication: CimavetMedicationSummary, detail?: CimavetMedicationDetail | null) =>
  [
    medication.pactivos ?? '',
    detail?.principiosActivos
      ?.map((item) => `${item.nombre}${item.cantidad ? ` ${item.cantidad}` : ''}${item.unidad ? ` ${item.unidad}` : ''}`.trim())
      .join(' '),
    detail?.presentaciones?.map((item) => item.nombre).join(' '),
    detail?.indicaciones?.map((item) => `${item.especie?.nombre ?? ''} ${item.nombre}`.trim()).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

const getCimaDetailFilterText = (medication: CimaMedicationSummary, detail?: CimaMedicationDetail | null) =>
  [
    medication.pactivos ?? '',
    medication.dosis ?? '',
    medication.formaFarmaceuticaSimplificada?.nombre ?? '',
    medication.formaFarmaceutica?.nombre ?? '',
    detail?.principiosActivos
      ?.map((item) => `${item.nombre}${item.cantidad ? ` ${item.cantidad}` : ''}${item.unidad ? ` ${item.unidad}` : ''}`.trim())
      .join(' '),
    detail?.presentaciones?.map((item) => item.nombre).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

const filterTherapeuticEntries = (
  entries: TherapeuticEntry[],
  query: string,
  selectedSpecies: string,
  selectedIndication: string,
  selectedTags: string[],
  concentrationQuery: string,
) => {
  const loweredQuery = query.trim().toLowerCase();
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
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const accountMenuShellRef = useRef<HTMLDivElement | null>(null);
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
        };

  const speciesOptions = useMemo(() => getSpeciesOptions(entryCatalog), [entryCatalog]);
  const prescriptionSpeciesOptions = useMemo(
    () =>
      Array.from(new Set([...speciesOptions, ...productionSpeciesOptions])).sort((left, right) =>
        translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en'),
      ),
    [lang, speciesOptions],
  );
  const systemOptions = useMemo(() => getSystemOptions(entryCatalog), [entryCatalog]);
  const localIndicationOptions = useMemo(() => getIndicationOptions(entryCatalog), [entryCatalog]);
  const activeIndicationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...localIndicationOptions,
          ...Object.values(activeVetDetails).flatMap((detail) => detail.indicaciones?.map((item) => item.nombre) ?? []),
        ]),
      ).sort((left, right) => translateMedicalTerm(left, lang).localeCompare(translateMedicalTerm(right, lang), lang === 'es' ? 'es' : 'en')),
    [activeVetDetails, lang, localIndicationOptions],
  );
  const tagOptions = useMemo(() => getTagOptions(entryCatalog), [entryCatalog]);
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
  const doseCalculatorEntries = useMemo(() => buildDoseCalculatorEntries(entryCatalog), [entryCatalog]);
  const pathologyOptions = useMemo(
    () => Array.from(new Set(entryCatalog.flatMap((entry) => entry.pathologies))).sort((a, b) => a.localeCompare(b)),
    [entryCatalog],
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
      if (!ignore) setAuthLoading(true);

      try {
        const snapshot = await supabaseAccessService.getAccountSnapshot();
        if (!ignore) setAuthAccount(snapshot);
      } catch {
        if (!ignore) setAuthAccount({ profile: null, membership: null, email: null });
      } finally {
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
      setAuthAccount({ profile: null, membership: null, email: null });
    } finally {
      setAuthLoading(false);
    }
  };

  const membership = authAccount?.membership ?? null;
  const isAuthenticated = Boolean(authAccount?.profile);
  const trialEndsAtTime = membership?.trialEndsAt ? new Date(membership.trialEndsAt).getTime() : null;
  const isTrialExpired = Boolean(membership && membership.status !== 'active' && trialEndsAtTime && trialEndsAtTime < Date.now());
  const hasPremiumAccess = Boolean(membership && (membership.status === 'active' || (membership.status === 'trialing' && !isTrialExpired)));
  const accessStatusMessage = hasPremiumAccess
    ? membership?.status === 'active'
      ? accessText.statusPremium
      : `${accessText.statusTrial} ${formatAccessDate(lang, membership?.trialEndsAt ?? undefined)}`
    : membership
      ? accessText.statusLimited
      : accessText.statusNoPlan;
  const profileRoles = authAccount?.profile?.roles ?? [authAccount?.profile?.role ?? 'viewer'];
  const canCreateEditorial = profileRoles.some((role) => ['contributor', 'editor', 'reviewer', 'admin'].includes(role));
  const canManageEditorial = profileRoles.some((role) => ['editor', 'reviewer', 'admin'].includes(role));
  const canReviewEditorial = profileRoles.some((role) => ['reviewer', 'admin'].includes(role));
  const canActivateEditorial = profileRoles.includes('admin');
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

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (accountMenuShellRef.current?.contains(target)) return;
      setIsAccountMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
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

  const filteredEntries = useMemo(
    () =>
      filterTherapeuticEntries(
        entryCatalog,
        activeQuery,
        activeSpecies,
        activeIndication,
        activeTags,
        activeConcentrationQuery,
      ),
    [activeConcentrationQuery, activeIndication, activeQuery, activeSpecies, activeTags, entryCatalog],
  );
  const hasActiveSearchCriteria = Boolean(
    activeQuery.trim().length > 0 ||
      activeSpecies ||
      activeIndication ||
      activeConcentrationQuery.trim().length > 0 ||
      activeTags.length > 0,
  );
  const shouldShowActiveRecords = hasActiveSearchCriteria;
  const activeFilteredCount = filteredEntries.length;
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
    return entryCatalog.filter((entry) => {
      const speciesMatch = assistantSpecies ? entry.species.some((value) => value === assistantSpecies) : true;
      const pathologyMatch = assistantPathology ? entry.pathologies.includes(assistantPathology) : true;
      return speciesMatch && pathologyMatch;
    });
  }, [assistantPathology, assistantSpecies, entryCatalog]);

  const rxIndicationOptions = useMemo(() => {
    const values = new Set<string>();

    liveResults.forEach((medication) => {
      const detail = liveDetails[medication.nregistro];
      if (!detail) return;
      detail.indicaciones?.forEach((item) => {
        values.add(item.nombre);
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [liveDetails, liveResults]);

  const rxSpeciesLabel = useMemo(() => (rxSpecies ? translateMedicalTerm(rxSpecies, 'es') : undefined), [rxSpecies]);

  const filteredLiveResults = useMemo(() => {
    const normalizedDose = normalizeFilterText(rxDoseFilter);
    const normalizedPresentation = normalizeFilterText(rxPresentationFilter);
    let results = rxOnlyCommercialized ? liveResults.filter((medication) => medication.comerc) : liveResults;

    if (rxIndication) {
      results = results.filter((medication) => {
        const detail = liveDetails[medication.nregistro];
        if (!detail?.indicaciones?.length) return false;
        return detail.indicaciones.some((item) => item.nombre === rxIndication);
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
          ? matchesStructuredFilter(getCimavetDetailFilterText(medication, detail), activeConcentrationQuery)
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
        const detail = activeHumanDetails[medication.nregistro];
        return matchesStructuredFilter(getCimaDetailFilterText(medication, detail), activeConcentrationQuery);
      }),
    [activeConcentrationQuery, activeHumanDetails, activeHumanResults],
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
  }, [activeQuery, activeSpecies, activeIndication, activeTags, activeConcentrationQuery, activeRecordPageSize]);

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
    if (q.length < 2) {
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
        const fastResults = await cimavetService.searchMedications(q, {
          species: cimavetSpecies,
          includeActiveIngredientSearch: false,
        });

        if (!ignore) {
          setLiveResults(fastResults);
        }

        if (q.length >= 3) {
          try {
            const expanded = await cimavetService.searchMedications(q, {
              species: cimavetSpecies,
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
    if (activeTab !== 'prescription' || liveResults.length === 0) return;

    const missing = liveResults.filter((item) => !liveDetails[item.nregistro]).map((item) => item.nregistro);
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

        setLiveDetails((current) => {
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
  }, [activeTab, cimavetService, liveDetails, liveResults]);

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
    if (q.length < 2) {
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
        const results = await cimavetService.searchMedications(q, {
          species: activeSpecies ? translateMedicalTerm(activeSpecies, 'es') : undefined,
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

  const renderLocalizedCards = (cards: LocalizedCollectionCard[], gridClassName?: string) => (
    <div className={`feature-grid ${gridClassName ?? ''}`.trim()}>
      {cards.map((card) => (
        <article key={card.id} className="feature-card">
          <h3>{card.title[lang]}</h3>
          <p>{card.description[lang]}</p>
          {card.status && <span className={`status-pill ${card.statusTone ? `status-pill-${card.statusTone}` : ''}`}>{card.status[lang]}</span>}
          {card.bullets?.[lang]?.length ? (
            <ul>
              {card.bullets[lang].map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {card.toolkitView ? (
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
          ) : null}
        </article>
      ))}
    </div>
  );

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
    const normalizedEntry: TherapeuticEntry = {
      ...entry,
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

    if (!supabaseEditorialService || !isUuid(entry.id)) {
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

  if (authLoading) {
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
        />
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
            <button
              type="button"
              className={`topbar-trial-pill ${membership?.status === 'trialing' ? 'is-warning' : ''}`}
              onClick={() => setIsAccountMenuOpen((current) => !current)}
            >
              {membership?.status === 'trialing'
                ? lang === 'es'
                  ? `Prueba · ${formatAccessDate(lang, membership?.trialEndsAt ?? undefined)}`
                  : `Trial · ${formatAccessDate(lang, membership?.trialEndsAt ?? undefined)}`
                : hasPremiumAccess
                  ? accessText.premiumBadge
                  : accessText.freeBadge}
            </button>
          </div>

          <div className="topbar-actions">
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
            <button type="button" className="topbar-icon-button" onClick={() => setIsAccountMenuOpen((current) => !current)}>
              {lang === 'es' ? 'Settings' : 'Settings'}
            </button>
            <div className="account-menu-shell" ref={accountMenuShellRef}>
              <button type="button" className="topbar-account-button" onClick={() => setIsAccountMenuOpen((current) => !current)}>
                <span>{lang === 'es' ? 'Mi cuenta' : 'My account'}</span>
                <strong>{authAccount?.profile?.fullName || authAccount?.email || 'WAIRUA'}</strong>
              </button>
              {isAccountMenuOpen ? (
                <div className="account-menu-popover">
                  <AuthAccessPanel
                    lang={lang}
                    service={supabaseAccessService}
                    account={authAccount}
                    onRefreshAccount={refreshAuthAccount}
                  />
                </div>
              ) : null}
            </div>
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
                  placeholder={t.searchPlaceholder}
                  title={t.searchPlaceholder}
                  value={rxQuery}
                  onChange={(event) => setRxQuery(event.target.value)}
                />
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
              {isLiveExpanded && !liveLoading && !liveError && rxQuery.trim().length >= 2 && filteredLiveResults.length === 0 && (
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
                                <span>{t.withdrawalMax}</span>
                                <strong>{withdrawalMaxDays != null ? formatWithdrawalSummary(withdrawalMaxDays, lang) : '-'}</strong>
                              </p>
                            </div>

                            {withdrawalItems.length > 0 ? (
                              <section className="live-indications">
                                <h5>{t.withdrawalTimes}</h5>
                                <ul>
                                  {withdrawalItems.slice(0, 6).map((item, index) => (
                                    <li key={`${medication.nregistro}-withdrawal-${index}`}>{formatWithdrawalTimeItem(item)}</li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}

                            {detail?.indicaciones?.length ? (
                              <section className="live-indications">
                                <h5>{t.indications}</h5>
                                <ul>
                                  {detail.indicaciones.slice(0, 4).map((indication, index) => (
                                    <li key={`${medication.nregistro}-indication-${index}`}>
                                      {indication.especie?.nombre ? `${indication.especie.nombre}: ` : ''}
                                      {indication.nombre}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}

                            <footer className="live-card-footer">
                              <span>
                                {t.registration}: {medication.nregistro}
                              </span>
                              <a
                                href={buildCimavetRecordUrl(CIMAVET_BASE_URL, medication.nregistro)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t.openRecord}
                              </a>
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
              </label>

              <label>
                {t.species}
                <select value={activeSpecies} onChange={(event) => setActiveSpecies(event.target.value)}>
                  <option value="">{t.all}</option>
                  {speciesOptions.map((species) => (
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
                    {isActiveVetExpanded && !activeQuery.trim().length && (
                      <p>{lang === 'es' ? 'Escribe un principio activo para consultar CIMAVET.' : 'Type an active ingredient to query CIMAVET.'}</p>
                    )}
                    {isActiveVetExpanded && activeQuery.trim().length >= 2 && !activeVetLoading && !activeVetError && filteredActiveVetResults.length === 0 && <p>{t.liveEmpty}</p>}

                    {isActiveVetExpanded && activeQuery.trim().length >= 2 && !activeVetLoading && !activeVetError && filteredActiveVetResults.length > 0 && (
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
                          {activeVetResultsForDetails.map((medication) => (
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
                                </div>

                                {activeVetDetails[medication.nregistro]?.indicaciones?.length ? (
                                  <section className="live-indications">
                                    <h5>{t.indications}</h5>
                                    <ul>
                                      {activeVetDetails[medication.nregistro].indicaciones!.slice(0, 4).map((indication, index) => (
                                        <li key={`${medication.nregistro}-active-indication-${index}`}>
                                          {indication.especie?.nombre ? `${indication.especie.nombre}: ` : ''}
                                          {indication.nombre}
                                        </li>
                                      ))}
                                    </ul>
                                  </section>
                                ) : null}

                                <footer className="live-card-footer">
                                  <span>
                                    {t.registration}: {medication.nregistro}
                                  </span>
                                  <a
                                    href={buildCimavetRecordUrl(CIMAVET_BASE_URL, medication.nregistro)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {t.openRecord}
                                  </a>
                                </footer>
                              </article>
                            </li>
                          ))}
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
                    {isActiveHumanExpanded && !activeQuery.trim().length && (
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

                                  <footer className="live-card-footer">
                                    <span>
                                      {t.registration}: {medication.nregistro}
                                    </span>
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
                    <h3>{hasActiveSearchCriteria ? `${t.activeIngredientSummaries}: ${activeFilteredCount}` : t.activeIngredientSummaries}</h3>
                    {!hasActiveSearchCriteria && (
                      <p className="live-hint">
                        {lang === 'es'
                          ? 'Empieza escribiendo o aplicando filtros para mostrar principios activos.'
                          : 'Start typing or applying filters to display active ingredients.'}
                      </p>
                    )}
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
                  speciesOptions={speciesOptions}
                  systemOptions={systemOptions}
                  tagOptions={formTagOptions}
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
            </div>

            <div className="subtabs" role="tablist" aria-label="Toolkit views">
              <button onClick={() => setActiveToolkitView('dose')} className={activeToolkitView === 'dose' ? 'active' : ''}>
                {t.doseCalculatorTitle}
              </button>
              <button onClick={() => setActiveToolkitView('infusion')} className={activeToolkitView === 'infusion' ? 'active' : ''}>
                {t.infusionCalculatorNav}
              </button>
              <button
                onClick={() => setActiveToolkitView('haemotherapy')}
                className={activeToolkitView === 'haemotherapy' ? 'active' : ''}
              >
                {t.haemotherapyNav}
              </button>
              <button onClick={() => setActiveToolkitView('endocrine')} className={activeToolkitView === 'endocrine' ? 'active' : ''}>
                {t.endocrineNav}
              </button>
              <button onClick={() => setActiveToolkitView('converter')} className={activeToolkitView === 'converter' ? 'active' : ''}>
                {t.unitConverterNav}
              </button>
              <button onClick={() => setActiveToolkitView('surface')} className={activeToolkitView === 'surface' ? 'active' : ''}>
                {t.bodySurfaceNav}
              </button>
              <button onClick={() => setActiveToolkitView('nutrition')} className={activeToolkitView === 'nutrition' ? 'active' : ''}>
                {t.clinicalNutritionNav}
              </button>
              <button onClick={() => setActiveToolkitView('assistant')} className={activeToolkitView === 'assistant' ? 'active' : ''}>
                {t.assistantForm}
              </button>
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

            {activeToolkitView === 'haemotherapy' && <HaemotherapyCalculator lang={lang} />}

            {activeToolkitView === 'endocrine' && <EndocrineToolkit lang={lang} />}

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
                      {speciesOptions.map((species) => (
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
                            </div>

                            {detail?.presentaciones?.length ? (
                              <section className="live-indications">
                                <h5>{t.presentation}</h5>
                                <ul>
                                  {detail.presentaciones.slice(0, 4).map((presentation) => (
                                    <li key={`${medication.nregistro}-${presentation.cn}`}>{presentation.nombre}</li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}

                            <footer className="live-card-footer">
                              <span>
                                {t.registration}: {medication.nregistro}
                              </span>
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
    </div>
  );
}

export default App;
