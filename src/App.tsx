import { useEffect, useMemo, useState } from 'react';
import EntryCard from './components/EntryCard';
import GroupedIndex from './components/GroupedIndex';
import { therapeuticEntries } from './data/entries';
import { labels, Language } from './i18n';
import { buildGroupedIndex, byAlphabeticalKey, getIndicationOptions, getSpeciesOptions, getSystemOptions } from './lib/indexes';
import { expandMedicalTermAliases, translateMedicalTerm, translateMedicalTerms } from './lib/terms';
import {
  buildCimavetRecordUrl,
  CimavetMedicationDetail,
  CimavetMedicationSummary,
  createCimavetServiceFromEnv,
  resolveCimavetBaseUrl,
} from './services/cimavet';

const tabs = ['search', 'systems', 'active', 'trade', 'pathology', 'assistant'] as const;
const CIMAVET_BASE_URL = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);

type Tab = (typeof tabs)[number];

function App() {
  const [lang, setLang] = useState<Language>('es');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [query, setQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedIndication, setSelectedIndication] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [isLiveExpanded, setIsLiveExpanded] = useState(true);

  const [liveResults, setLiveResults] = useState<CimavetMedicationSummary[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveDetails, setLiveDetails] = useState<Record<string, CimavetMedicationDetail>>({});

  const [assistantSpecies, setAssistantSpecies] = useState('');
  const [assistantPathology, setAssistantPathology] = useState('');
  const [assistantWeight, setAssistantWeight] = useState('');
  const [assistantNotes, setAssistantNotes] = useState('');
  const [assistantGenerated, setAssistantGenerated] = useState(false);

  const cimavetService = useMemo(() => createCimavetServiceFromEnv(), []);
  const t = labels[lang];

  const speciesOptions = useMemo(() => getSpeciesOptions(therapeuticEntries), []);
  const systemOptions = useMemo(() => getSystemOptions(therapeuticEntries), []);
  const localIndicationOptions = useMemo(() => getIndicationOptions(therapeuticEntries), []);
  const pathologyOptions = useMemo(
    () => Array.from(new Set(therapeuticEntries.flatMap((entry) => entry.pathologies))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const filteredEntries = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return therapeuticEntries.filter((entry) => {
      const inSpecies = selectedSpecies ? entry.species.some((value) => value === selectedSpecies) : true;
      const inSystem = selectedSystem ? entry.systems.includes(selectedSystem) : true;
      const inIndication = selectedIndication ? entry.pathologies.includes(selectedIndication) : true;

      if (!loweredQuery) return inSpecies && inSystem && inIndication;

      const translatedAliases = [...entry.pathologies, ...entry.systems, ...entry.species].flatMap((term) =>
        expandMedicalTermAliases(term),
      );

      const searchable = [
        entry.activeIngredient,
        ...entry.tradeNames,
        ...entry.pathologies,
        ...entry.systems,
        ...entry.species,
        entry.indications.es,
        entry.indications.en,
        entry.dosage.es,
        entry.dosage.en,
        entry.contraindications.es,
        entry.contraindications.en,
        ...translatedAliases,
      ]
        .join(' ')
        .toLowerCase();

      return inSpecies && inSystem && inIndication && searchable.includes(loweredQuery);
    });
  }, [query, selectedIndication, selectedSpecies, selectedSystem]);

  const assistantMatches = useMemo(() => {
    return therapeuticEntries.filter((entry) => {
      const speciesMatch = assistantSpecies ? entry.species.some((value) => value === assistantSpecies) : true;
      const pathologyMatch = assistantPathology ? entry.pathologies.includes(assistantPathology) : true;
      return speciesMatch && pathologyMatch;
    });
  }, [assistantPathology, assistantSpecies]);

  const systemsIndex = useMemo(() => buildGroupedIndex(therapeuticEntries, 'systems'), []);
  const pathologyIndex = useMemo(() => buildGroupedIndex(therapeuticEntries, 'pathologies'), []);
  const tradeGlossary = useMemo(() => buildGroupedIndex(therapeuticEntries, 'tradeNames'), []);
  const activeGlossary = useMemo(() => byAlphabeticalKey(therapeuticEntries, 'activeIngredient'), []);
  const liveIndicationOptions = useMemo(() => {
    const values = new Set<string>();

    Object.values(liveDetails).forEach((detail) => {
      detail.indicaciones?.forEach((item) => {
        values.add(item.nombre);
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [liveDetails]);

  const indicationOptions = useMemo(() => {
    if (liveIndicationOptions.length > 0) return liveIndicationOptions;
    return localIndicationOptions;
  }, [liveIndicationOptions, localIndicationOptions]);

  const filteredLiveResults = useMemo(() => {
    if (!selectedIndication) return liveResults;

    return liveResults.filter((medication) => {
      const detail = liveDetails[medication.nregistro];
      if (!detail?.indicaciones?.length) return false;
      return detail.indicaciones.some((item) => item.nombre === selectedIndication);
    });
  }, [liveDetails, liveResults, selectedIndication]);

  useEffect(() => {
    const warmup = window.setTimeout(() => {
      void cimavetService.loadCatalog().catch(() => undefined);
    }, 300);

    return () => window.clearTimeout(warmup);
  }, [cimavetService]);

  useEffect(() => {
    if (activeTab !== 'search') return;

    const q = query.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setLiveError(null);
      setLiveLoading(false);
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setLiveLoading(true);
      setLiveError(null);

      const cimavetSpecies = selectedSpecies ? translateMedicalTerm(selectedSpecies, 'es') : undefined;

      try {
        const fastResults = await cimavetService.searchMedications(q, {
          species: cimavetSpecies,
          includeActiveIngredientSearch: false,
        });

        if (!ignore) {
          setLiveResults(fastResults);
        }

        // Second pass: widen by active ingredient without blocking fast UI feedback.
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
            // Ignore expanded-pass errors to keep basic live search stable.
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
      clearTimeout(timer);
    };
  }, [activeTab, cimavetService, query, selectedSpecies]);

  useEffect(() => {
    if (activeTab !== 'search' || liveResults.length === 0) return;

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
            if (item) {
              next[item.nregistro] = item.detail;
            }
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

  return (
    <div className={`app ${theme}`}>
      <header className="hero">
        <div>
          <p className="badge">WAIRUA VetAI</p>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
          <div className="hero-actions">
            <button onClick={() => setActiveTab('search')}>{t.quickSearch}</button>
            <button onClick={() => setActiveTab('active')}>{t.quickActive}</button>
            <button onClick={() => setActiveTab('assistant')}>{t.quickAssistant}</button>
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

      <nav className="tabs" aria-label="View selector">
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'active' : ''}>
          {t.search}
        </button>
        <button onClick={() => setActiveTab('systems')} className={activeTab === 'systems' ? 'active' : ''}>
          {t.indexBySystem}
        </button>
        <button onClick={() => setActiveTab('active')} className={activeTab === 'active' ? 'active' : ''}>
          {t.glossaryByActive}
        </button>
        <button onClick={() => setActiveTab('trade')} className={activeTab === 'trade' ? 'active' : ''}>
          {t.glossaryByTrade}
        </button>
        <button onClick={() => setActiveTab('pathology')} className={activeTab === 'pathology' ? 'active' : ''}>
          {t.indexByPathology}
        </button>
        <button onClick={() => setActiveTab('assistant')} className={activeTab === 'assistant' ? 'active' : ''}>
          {t.assistantForm}
        </button>
      </nav>

      <main>
        {activeTab === 'search' && (
          <section className="panel">
            <div className="search-grid">
              <label>
                {t.search}
                <input
                  type="search"
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <label>
                {t.species}
                <select value={selectedSpecies} onChange={(event) => setSelectedSpecies(event.target.value)}>
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
                <select value={selectedSystem} onChange={(event) => setSelectedSystem(event.target.value)}>
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
                <select value={selectedIndication} onChange={(event) => setSelectedIndication(event.target.value)}>
                  <option value="">{t.all}</option>
                  {indicationOptions.map((indication) => (
                    <option key={indication} value={indication}>
                      {translateMedicalTerm(indication, lang)}
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
              {isLiveExpanded && !liveLoading && !liveError && query.trim().length >= 2 && filteredLiveResults.length === 0 && <p>{t.liveEmpty}</p>}

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
                            {medication.receta && (
                              <span className="live-badge live-badge-amber">{t.prescriptionOnly}</span>
                            )}
                            {medication.antibiotico && (
                              <span className="live-badge live-badge-red">{t.antibiotic}</span>
                            )}
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
                              {liveDetails[medication.nregistro].indicaciones!.slice(0, 3).map((indication, index) => (
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

            <div className="collaborative-callout">
              <h3>{t.collaborativeNoticeTitle}</h3>
              <p>{t.collaborativeNoticeText}</p>
            </div>

            <h2>
              {t.activeIngredientSummaries}: {filteredEntries.length}
            </h2>

            <p className="live-hint">
              {lang === 'es'
                ? 'Estas fichas estructuran la informacion terapeutica que se ira enriqueciendo con colaboradores.'
                : 'These records structure the therapeutic information that collaborators will continue enriching.'}
            </p>

            {filteredEntries.length === 0 && <p>{t.noResults}</p>}
            <div className="entry-grid">
              {filteredEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'systems' && (
          <section className="panel">
            <h2>{t.indexBySystem}</h2>
            <GroupedIndex groups={systemsIndex} formatLabel={(label) => translateMedicalTerm(label, lang)} />
          </section>
        )}

        {activeTab === 'active' && (
          <section className="panel">
            <h2>{t.glossaryByActive}</h2>
            <div className="glossary-list">
              {activeGlossary.map((entry) => (
                <p key={entry.id}>{entry.activeIngredient}</p>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'trade' && (
          <section className="panel">
            <h2>{t.glossaryByTrade}</h2>
            <GroupedIndex groups={tradeGlossary} />
          </section>
        )}

        {activeTab === 'pathology' && (
          <section className="panel">
            <h2>{t.indexByPathology}</h2>
            <GroupedIndex groups={pathologyIndex} formatLabel={(label) => translateMedicalTerm(label, lang)} />
          </section>
        )}

        {activeTab === 'assistant' && (
          <section className="panel">
            <h2>{t.assistantForm}</h2>
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
