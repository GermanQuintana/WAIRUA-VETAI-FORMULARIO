import { useEffect, useMemo, useState } from 'react';
import ActiveIngredientForm from './components/ActiveIngredientForm';
import DoseCalculator from './components/DoseCalculator';
import EntryCard from './components/EntryCard';
import GroupedIndex from './components/GroupedIndex';
import {
  activeIngredientWorkstreams,
  humanCimaCards,
  otcSubmissionFields,
  otcWorkflowCards,
  protocolFocusExamples,
  toolkitModules,
} from './data/platform';
import { therapeuticEntries } from './data/entries';
import { labels, Language } from './i18n';
import {
  buildDoseCalculatorEntries,
  buildGroupedIndex,
  byAlphabeticalKey,
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
  CimavetMedicationDetail,
  CimavetMedicationSummary,
  createCimavetServiceFromEnv,
  resolveCimavetBaseUrl,
} from './services/cimavet';
import { createSupabaseEditorialService } from './services/supabase';
import { TherapeuticEntry } from './types';

const productTabs = ['prescription', 'otc', 'active', 'toolkit', 'human'] as const;
const activeViews = ['records', 'systems', 'trade', 'pathology', 'create'] as const;
const toolkitViews = ['overview', 'dose', 'assistant'] as const;
const CIMA_BASE_URL = resolveCimaBaseUrl(import.meta.env.VITE_CIMA_BASE_URL);
const CIMAVET_BASE_URL = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);

type ProductTab = (typeof productTabs)[number];
type ActiveView = (typeof activeViews)[number];
type ToolkitView = (typeof toolkitViews)[number];

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

const filterTherapeuticEntries = (
  entries: TherapeuticEntry[],
  query: string,
  selectedSpecies: string,
  selectedSystem: string,
  selectedIndication: string,
  selectedTags: string[],
  concentrationQuery: string,
) => {
  const loweredQuery = query.trim().toLowerCase();
  const loweredConcentration = concentrationQuery.trim().toLowerCase();

  return entries.filter((entry) => {
    const inSpecies = selectedSpecies ? entry.species.some((value) => value === selectedSpecies) : true;
    const inSystem = selectedSystem ? entry.systems.includes(selectedSystem) : true;
    const inIndication = selectedIndication ? entry.pathologies.includes(selectedIndication) : true;
    const inTags = selectedTags.length > 0 ? entry.tags.some((tag) => selectedTags.includes(tag)) : true;
    const inConcentration = loweredConcentration
      ? entry.concentrations.some((value) => value.toLowerCase().includes(loweredConcentration))
      : true;

    if (!loweredQuery) return inSpecies && inSystem && inIndication && inTags && inConcentration;

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
      entry.notes?.es ?? '',
      entry.notes?.en ?? '',
      ...translatedAliases,
    ]
      .join(' ')
      .toLowerCase();

    return inSpecies && inSystem && inIndication && inTags && inConcentration && searchable.includes(loweredQuery);
  });
};

function App() {
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
  const [rxSystem, setRxSystem] = useState('');
  const [rxIndication, setRxIndication] = useState('');

  const [activeQuery, setActiveQuery] = useState('');
  const [activeSpecies, setActiveSpecies] = useState('');
  const [activeSystem, setActiveSystem] = useState('');
  const [activeIndication, setActiveIndication] = useState('');
  const [activeConcentrationQuery, setActiveConcentrationQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const [humanQuery, setHumanQuery] = useState('');
  const [humanDoseFilter, setHumanDoseFilter] = useState('');
  const [humanPresentationFilter, setHumanPresentationFilter] = useState('');
  const [humanShowCommercialized, setHumanShowCommercialized] = useState(true);
  const [humanShowNonCommercialized, setHumanShowNonCommercialized] = useState(true);

  const [liveResults, setLiveResults] = useState<CimavetMedicationSummary[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveDetails, setLiveDetails] = useState<Record<string, CimavetMedicationDetail>>({});
  const [humanResults, setHumanResults] = useState<CimaMedicationSummary[]>([]);
  const [humanLoading, setHumanLoading] = useState(false);
  const [humanError, setHumanError] = useState<string | null>(null);
  const [humanDetails, setHumanDetails] = useState<Record<string, CimaMedicationDetail>>({});

  const [assistantSpecies, setAssistantSpecies] = useState('');
  const [assistantPathology, setAssistantPathology] = useState('');
  const [assistantWeight, setAssistantWeight] = useState('');
  const [assistantNotes, setAssistantNotes] = useState('');
  const [assistantGenerated, setAssistantGenerated] = useState(false);
  const [remoteSyncMessage, setRemoteSyncMessage] = useState('');

  const cimaService = useMemo(() => createCimaServiceFromEnv(), []);
  const cimavetService = useMemo(() => createCimavetServiceFromEnv(), []);
  const supabaseEditorialService = useMemo(() => createSupabaseEditorialService(), []);
  const t = labels[lang];

  const speciesOptions = useMemo(() => getSpeciesOptions(entryCatalog), [entryCatalog]);
  const systemOptions = useMemo(() => getSystemOptions(entryCatalog), [entryCatalog]);
  const localIndicationOptions = useMemo(() => getIndicationOptions(entryCatalog), [entryCatalog]);
  const tagOptions = useMemo(() => getTagOptions(entryCatalog), [entryCatalog]);
  const doseCalculatorEntries = useMemo(() => buildDoseCalculatorEntries(entryCatalog), [entryCatalog]);
  const pathologyOptions = useMemo(
    () => Array.from(new Set(entryCatalog.flatMap((entry) => entry.pathologies))).sort((a, b) => a.localeCompare(b)),
    [entryCatalog],
  );

  const openKnowledgeRecord = (entryId?: string, ingredientName?: string) => {
    setActiveTab('active');
    setActiveKnowledgeView('records');
    setActiveSpecies('');
    setActiveSystem('');
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
        activeSystem,
        activeIndication,
        activeTags,
        activeConcentrationQuery,
      ),
    [activeConcentrationQuery, activeIndication, activeQuery, activeSpecies, activeSystem, activeTags, entryCatalog],
  );

  const assistantMatches = useMemo(() => {
    return entryCatalog.filter((entry) => {
      const speciesMatch = assistantSpecies ? entry.species.some((value) => value === assistantSpecies) : true;
      const pathologyMatch = assistantPathology ? entry.pathologies.includes(assistantPathology) : true;
      return speciesMatch && pathologyMatch;
    });
  }, [assistantPathology, assistantSpecies, entryCatalog]);

  const systemsIndex = useMemo(() => buildGroupedIndex(entryCatalog, 'systems'), [entryCatalog]);
  const pathologyIndex = useMemo(() => buildGroupedIndex(entryCatalog, 'pathologies'), [entryCatalog]);
  const tradeGlossary = useMemo(() => buildGroupedIndex(entryCatalog, 'tradeNames'), [entryCatalog]);
  const activeGlossary = useMemo(() => byAlphabeticalKey(entryCatalog, 'activeIngredient'), [entryCatalog]);

  const rxIndicationOptions = useMemo(() => {
    const values = new Set<string>();

    Object.values(liveDetails).forEach((detail) => {
      detail.indicaciones?.forEach((item) => {
        values.add(item.nombre);
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [liveDetails]);

  const filteredLiveResults = useMemo(() => {
    const byIndication = rxIndication
      ? liveResults.filter((medication) => {
          const detail = liveDetails[medication.nregistro];
          if (!detail?.indicaciones?.length) return false;
          return detail.indicaciones.some((item) => item.nombre === rxIndication);
        })
      : liveResults;

    if (!rxSystem) return byIndication;

    const loweredSystem = rxSystem.toLowerCase();
    return byIndication.filter((medication) => {
      const detail = liveDetails[medication.nregistro];
      if (!detail?.atcs?.length) return true;
      return detail.atcs.some((atc) => atc.nombre.toLowerCase().includes(loweredSystem));
    });
  }, [liveDetails, liveResults, rxIndication, rxSystem]);

  const filteredHumanResults = useMemo(() => {
    const normalizedDose = normalizeFilterText(humanDoseFilter);
    const normalizedPresentation = normalizeFilterText(humanPresentationFilter);

    return humanResults.filter((medication) => {
      if (medication.comerc && !humanShowCommercialized) return false;
      if (!medication.comerc && !humanShowNonCommercialized) return false;

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
    humanShowCommercialized,
    humanShowNonCommercialized,
  ]);

  const humanResultsForDetails = useMemo(() => filteredHumanResults.slice(0, 24), [filteredHumanResults]);

  useEffect(() => {
    const warmup = window.setTimeout(() => {
      void cimavetService.loadCatalog().catch(() => undefined);
    }, 300);

    return () => window.clearTimeout(warmup);
  }, [cimavetService]);

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

  const renderLocalizedCards = (cards: typeof otcWorkflowCards) => (
    <div className="feature-grid">
      {cards.map((card) => (
        <article key={card.id} className="feature-card">
          <h3>{card.title[lang]}</h3>
          <p>{card.description[lang]}</p>
          {card.status && <span className="status-pill">{card.status[lang]}</span>}
          {card.bullets?.[lang]?.length ? (
            <ul>
              {card.bullets[lang].map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
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
    setRemoteSyncMessage('');

    if (mode === 'create') {
      if (!supabaseEditorialService) {
        replaceCatalogEntry(entry);
        setEditingEntry(null);
        return {
          persisted: false,
          entry,
          message:
            lang === 'es'
              ? 'Ficha creada en local. Para persistirla, configura Supabase y aplica el schema.'
              : 'Record created locally. Configure Supabase and apply the schema to persist it.',
        };
      }

      try {
        const savedEntry = await supabaseEditorialService.createTherapeuticEntry(entry);
        replaceCatalogEntry(savedEntry, entry.id);
        setEditingEntry(null);
        return {
          persisted: true,
          entry: savedEntry,
          message: lang === 'es' ? 'Ficha creada y guardada en Supabase.' : 'Record created and saved to Supabase.',
        };
      } catch (error) {
        const detail = getErrorMessage(error);
        setRemoteSyncMessage(detail);
        replaceCatalogEntry(entry);
        setEditingEntry(null);
        return {
          persisted: false,
          entry,
          message:
            lang === 'es'
              ? `Ficha creada en local, pero no se pudo guardar en Supabase (${detail}).`
              : `Record created locally, but could not be saved to Supabase (${detail}).`,
        };
      }
    }

    if (!supabaseEditorialService || !isUuid(entry.id)) {
      replaceCatalogEntry(entry);
      setEditingEntry(entry);
      return {
        persisted: false,
        entry,
        message:
          lang === 'es'
            ? 'Ficha actualizada en local. La edicion remota requiere un registro persistido en Supabase.'
            : 'Record updated locally. Remote editing requires a persisted Supabase record.',
      };
    }

    try {
      const savedEntry = await supabaseEditorialService.updateTherapeuticEntry(entry);
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
      replaceCatalogEntry(entry);
      setEditingEntry(entry);
      return {
        persisted: false,
        entry,
        message:
          lang === 'es'
            ? `Ficha actualizada en local, pero no se pudo sincronizar con Supabase (${detail}).`
            : `Record updated locally, but could not sync to Supabase (${detail}).`,
      };
    }
  };

  const handleDeleteEntry = async (entry: TherapeuticEntry) => {
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

  return (
    <div className={`app ${theme}`}>
      <header className="hero hero-shell">
        <div>
          <p className="badge">WAIRUA VetAI</p>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
          <div className="hero-actions">
            <button onClick={() => setActiveTab('prescription')}>{t.prescriptionHub}</button>
            <button onClick={() => setActiveTab('active')}>{t.activeHub}</button>
            <button onClick={() => setActiveTab('toolkit')}>{t.toolkitHub}</button>
          </div>
        </div>
        <div className="controls">
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
        </div>
      </header>

      <section className="product-strip">
        <article className="product-strip-card">
          <span>{lang === 'es' ? 'Medicacion regulada' : 'Regulated medicines'}</span>
          <strong>{liveResults.length > 0 ? liveResults.length : '-'}</strong>
          <p>{lang === 'es' ? 'Resultados CIMAVET del termino actual' : 'CIMAVET results for the current term'}</p>
        </article>
        <article className="product-strip-card">
          <span>{lang === 'es' ? 'Fichas colaborativas' : 'Collaborative records'}</span>
          <strong>{entryCatalog.length}</strong>
          <p>{lang === 'es' ? 'Principios activos estructurados para crecer con colaboradores' : 'Active ingredient records structured for collaborators'}</p>
        </article>
        <article className="product-strip-card">
          <span>{lang === 'es' ? 'Toolkit' : 'Toolkit'}</span>
          <strong>{toolkitModules.length}</strong>
          <p>{lang === 'es' ? 'Modulos previstos para calculo y soporte clinico' : 'Planned modules for calculations and clinical support'}</p>
        </article>
      </section>

      <nav className="tabs product-tabs" aria-label="Product selector">
        <button onClick={() => setActiveTab('prescription')} className={activeTab === 'prescription' ? 'active' : ''}>
          {t.prescriptionHub}
        </button>
        <button onClick={() => setActiveTab('otc')} className={activeTab === 'otc' ? 'active' : ''}>
          {t.otcHub}
        </button>
        <button onClick={() => setActiveTab('active')} className={activeTab === 'active' ? 'active' : ''}>
          {t.activeHub}
        </button>
        <button onClick={() => setActiveTab('toolkit')} className={activeTab === 'toolkit' ? 'active' : ''}>
          {t.toolkitHub}
        </button>
        <button onClick={() => setActiveTab('human')} className={activeTab === 'human' ? 'active' : ''}>
          {t.humanHub}
        </button>
      </nav>

      <main>
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
                  value={rxQuery}
                  onChange={(event) => setRxQuery(event.target.value)}
                />
              </label>

              <label>
                {t.species}
                <select value={rxSpecies} onChange={(event) => setRxSpecies(event.target.value)}>
                  <option value="">{t.all}</option>
                  {speciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {translateMedicalTerm(species, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.system}
                <select value={rxSystem} onChange={(event) => setRxSystem(event.target.value)}>
                  <option value="">{t.all}</option>
                  {systemOptions.map((system) => (
                    <option key={system} value={system}>
                      {translateMedicalTerm(system, lang)}
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
            </div>

            <section className="live-panel">
              <div className="live-panel-header">
                <div>
                  <h3>{t.liveResults}</h3>
                  <p className="live-hint">{t.liveHint}</p>
                </div>
                <button className="live-toggle" onClick={() => setIsLiveExpanded((value) => !value)} type="button">
                  {isLiveExpanded ? t.collapseLive : t.expandLive}
                </button>
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
                  <ul className="live-results-list">
                    {filteredLiveResults.map((medication) => (
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
                              <strong>{medication.forma?.nombre || '-'}</strong>
                            </p>
                            <p>
                              <span>{t.activeIngredient}</span>
                              <strong>{medication.pactivos || '-'}</strong>
                            </p>
                            <p>
                              <span>{t.administrationRoute}</span>
                              <strong>{medication.administracion?.nombre || '-'}</strong>
                            </p>
                          </div>

                          {liveDetails[medication.nregistro]?.indicaciones?.length ? (
                            <section className="live-indications">
                              <h5>{t.indications}</h5>
                              <ul>
                                {liveDetails[medication.nregistro].indicaciones!.slice(0, 4).map((indication, index) => (
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
                    ))}
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
                <p className="section-kicker">{lang === 'es' ? 'Catalogo OTC' : 'OTC catalog'}</p>
                <h2>{t.otcHub}</h2>
                <p>
                  {lang === 'es'
                    ? 'Espacio reservado para productos sin prescripcion que los laboratorios quieran incluir activamente bajo un formato comun y revisable.'
                    : 'Reserved space for non-prescription products that manufacturers proactively want to include under a shared, reviewable format.'}
                </p>
              </div>
              <div className="module-note pending-note">
                <strong>{lang === 'es' ? 'Estado actual' : 'Current state'}</strong>
                <p>{lang === 'es' ? 'Sin catalogo publico cargado todavia' : 'No public catalog loaded yet'}</p>
              </div>
            </div>

            <h3>{lang === 'es' ? 'Como entran los productos OTC' : 'How OTC products enter the catalog'}</h3>
            {renderLocalizedCards(otcWorkflowCards)}

            <h3>{lang === 'es' ? 'Formato minimo de entrega' : 'Minimum submission format'}</h3>
            {renderLocalizedCards(otcSubmissionFields)}

            <div className="feature-callout">
              <h3>{lang === 'es' ? 'Criterio editorial' : 'Editorial gate'}</h3>
              <p>
                {lang === 'es'
                  ? 'La app no publicara OTC por defecto ni por scraping. Solo se incorporaran si la marca los solicita, entrega documentacion verificable y acepta el mantenimiento conjunto del registro.'
                  : 'The app will not publish OTC products by default or by scraping. They will only be included if the brand requests it, provides verifiable documentation, and accepts shared maintenance of the record.'}
              </p>
            </div>
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
                  placeholder={t.searchPlaceholder}
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
                {t.system}
                <select value={activeSystem} onChange={(event) => setActiveSystem(event.target.value)}>
                  <option value="">{t.all}</option>
                  {systemOptions.map((system) => (
                    <option key={system} value={system}>
                      {translateMedicalTerm(system, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.indicationFilter}
                <select value={activeIndication} onChange={(event) => setActiveIndication(event.target.value)}>
                  <option value="">{t.all}</option>
                  {localIndicationOptions.map((indication) => (
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
                  placeholder={lang === 'es' ? 'Ejemplo: 10 mg/mL, 50 mg...' : 'Example: 10 mg/mL, 50 mg...'}
                />
              </label>
            </div>

            <section className="tag-filter-panel">
              <div className="tag-filter-header">
                <h3>{t.tagsLabel}</h3>
                <p>
                  {lang === 'es'
                    ? 'Marca una o varias tags para quedarte solo con los principios activos relevantes.'
                    : 'Select one or more tags to keep only the relevant active ingredients.'}
                </p>
              </div>
              <div className="tag-chip-list">
                {tagOptions.map((tag) => {
                  const isActive = activeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={isActive ? 'active' : ''}
                      onClick={() =>
                        setActiveTags((current) =>
                          current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag],
                        )
                      }
                    >
                      {translateMedicalTerm(tag, lang)}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="collaborative-callout">
              <h3>{t.collaborativeNoticeTitle}</h3>
              <p>{t.collaborativeNoticeText}</p>
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
              <button
                onClick={() => {
                  setActiveKnowledgeView('systems');
                  setEditingEntry(null);
                }}
                className={activeKnowledgeView === 'systems' ? 'active' : ''}
              >
                {t.systemsView}
              </button>
              <button
                onClick={() => {
                  setActiveKnowledgeView('trade');
                  setEditingEntry(null);
                }}
                className={activeKnowledgeView === 'trade' ? 'active' : ''}
              >
                {t.tradeView}
              </button>
              <button
                onClick={() => {
                  setActiveKnowledgeView('pathology');
                  setEditingEntry(null);
                }}
                className={activeKnowledgeView === 'pathology' ? 'active' : ''}
              >
                {t.pathologyView}
              </button>
              <button
                onClick={() => {
                  setActiveKnowledgeView('create');
                  if (!editingEntry) setEditingEntry(null);
                }}
                className={activeKnowledgeView === 'create' ? 'active' : ''}
              >
                {t.createRecordView}
              </button>
            </div>

            {activeKnowledgeView === 'records' && (
              <>
                <h3>
                  {t.activeIngredientSummaries}: {filteredEntries.length}
                </h3>
                {filteredEntries.length === 0 && <p>{t.noResults}</p>}
                <div className="entry-grid">
                  {filteredEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} lang={lang} onEdit={openEntryEditor} onDelete={handleDeleteEntry} />
                  ))}
                </div>
              </>
            )}

            {activeKnowledgeView === 'systems' && (
              <section className="embedded-section">
                <h3>{t.indexBySystem}</h3>
                <GroupedIndex groups={systemsIndex} formatLabel={(label) => translateMedicalTerm(label, lang)} />
              </section>
            )}

            {activeKnowledgeView === 'trade' && (
              <section className="embedded-section">
                <h3>{t.glossaryByTrade}</h3>
                <GroupedIndex groups={tradeGlossary} />
              </section>
            )}

            {activeKnowledgeView === 'pathology' && (
              <section className="embedded-section">
                <h3>{t.indexByPathology}</h3>
                <GroupedIndex groups={pathologyIndex} formatLabel={(label) => translateMedicalTerm(label, lang)} />
              </section>
            )}

            {activeKnowledgeView === 'create' && (
              <section className="embedded-section">
                <ActiveIngredientForm
                  lang={lang}
                  speciesOptions={speciesOptions}
                  systemOptions={systemOptions}
                  tagOptions={tagOptions}
                  initialEntry={editingEntry}
                  onSubmit={handleSaveEntry}
                  onCancelEdit={() => setEditingEntry(null)}
                />
              </section>
            )}

            <section className="embedded-section">
              <h3>{lang === 'es' ? 'Lineas de colaboracion' : 'Collaboration tracks'}</h3>
              {renderLocalizedCards(activeIngredientWorkstreams)}
            </section>

            <section className="embedded-section">
              <h3>{lang === 'es' ? 'Protocolos a desarrollar primero' : 'Protocols to develop first'}</h3>
              {renderLocalizedCards(protocolFocusExamples)}
            </section>

            <section className="embedded-section">
              <h3>{t.glossaryByActive}</h3>
              <div className="glossary-list">
                {activeGlossary.map((entry) => (
                  <p key={entry.id}>{entry.activeIngredient}</p>
                ))}
              </div>
            </section>
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
              <div className="module-note">
                <strong>{lang === 'es' ? 'Objetivo' : 'Goal'}</strong>
                <p>{lang === 'es' ? 'Unificar utilidades clinicas' : 'Unify clinical utilities'}</p>
              </div>
            </div>

            <div className="subtabs" role="tablist" aria-label="Toolkit views">
              <button onClick={() => setActiveToolkitView('overview')} className={activeToolkitView === 'overview' ? 'active' : ''}>
                {t.toolkitOverview}
              </button>
              <button onClick={() => setActiveToolkitView('dose')} className={activeToolkitView === 'dose' ? 'active' : ''}>
                {t.doseCalculatorTitle}
              </button>
              <button onClick={() => setActiveToolkitView('assistant')} className={activeToolkitView === 'assistant' ? 'active' : ''}>
                {t.assistantForm}
              </button>
            </div>

            {activeToolkitView === 'overview' && (
              <>
                {renderLocalizedCards(toolkitModules)}
                <div className="feature-callout">
                  <h3>{lang === 'es' ? 'Direccion del toolkit' : 'Toolkit direction'}</h3>
                  <p>
                    {lang === 'es'
                      ? 'La estructura ya queda pensada para integrar calculadoras propias, modulos heredados que ya tienes desarrollados y atajos hacia protocolos recurrentes.'
                      : 'The structure is already designed to integrate proprietary calculators, legacy modules you already built, and shortcuts to recurrent protocols.'}
                  </p>
                </div>
              </>
            )}

            {activeToolkitView === 'dose' && (
              <DoseCalculator
                entries={doseCalculatorEntries}
                lang={lang}
                onOpenKnowledge={(entry) => openKnowledgeRecord(entry.linkedEntryId, entry.activeIngredient)}
              />
            )}

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
                    />
                  </label>

                  <label>
                    {t.clinicalNotes}
                    <input
                      type="text"
                      value={assistantNotes}
                      onChange={(event) => setAssistantNotes(event.target.value)}
                      placeholder={
                        lang === 'es' ? 'Ejemplo: insuficiencia renal, geriatrico...' : 'Example: renal disease, geriatric...'
                      }
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
                  value={humanQuery}
                  onChange={(event) => setHumanQuery(event.target.value)}
                />
              </label>

              <label>
                {t.dose}
                <input
                  type="search"
                  placeholder={t.humanDosePlaceholder}
                  value={humanDoseFilter}
                  onChange={(event) => setHumanDoseFilter(event.target.value)}
                />
              </label>

              <label>
                {t.presentation}
                <input
                  type="search"
                  placeholder={t.humanPresentationPlaceholder}
                  value={humanPresentationFilter}
                  onChange={(event) => setHumanPresentationFilter(event.target.value)}
                />
              </label>

              <div className="search-grid-checkboxes">
                <span>{t.humanCommercialization}</span>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={humanShowCommercialized}
                    onChange={(event) => setHumanShowCommercialized(event.target.checked)}
                  />
                  {t.humanCommercializedOption}
                </label>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={humanShowNonCommercialized}
                    onChange={(event) => setHumanShowNonCommercialized(event.target.checked)}
                  />
                  {t.humanNonCommercializedOption}
                </label>
              </div>
            </div>

            <section className="live-panel">
              <div className="live-panel-header">
                <div>
                  <h3>{t.humanLiveResults}</h3>
                  <p className="live-hint">{t.humanLiveHint}</p>
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
                  {filteredHumanResults.length > humanResultsForDetails.length && (
                    <p className="live-summary-note">
                      {lang === 'es'
                        ? `Se cargan presentaciones ampliadas para los primeros ${humanResultsForDetails.length} resultados.`
                        : `Expanded presentations are loaded for the first ${humanResultsForDetails.length} results.`}
                    </p>
                  )}
                  <ul className="live-results-list">
                    {filteredHumanResults.map((medication) => {
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

            {renderLocalizedCards(humanCimaCards)}
          </section>
        )}
      </main>

      <footer className="footer-grid">
        <section>
          <h3>{t.contribute}</h3>
          <p>{t.contributeText}</p>
        </section>
        <section>
          <h3>{t.futureIntegrations}</h3>
          <p>{t.integrationText}</p>
        </section>
      </footer>
    </div>
  );
}

export default App;
