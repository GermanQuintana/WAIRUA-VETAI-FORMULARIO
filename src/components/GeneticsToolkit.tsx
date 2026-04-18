import { useMemo, useState } from 'react';
import { GeneticsRiskTone, mdr1BreedProfiles, mdr1MedicationGuidance, metabolismAlerts } from '../data/geneticsToolkit';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type GeneticsView = 'mdr1' | 'metabolism';

const copy = {
  es: {
    title: 'Genetica clinica',
    subtitle: 'MDR1 y metabolismo farmacologico por raza, con enfoque directo para decidir mas rapido.',
    mdr1Tab: 'MDR1',
    metabolismTab: 'Metabolismo',
    breedSearch: 'Buscar raza o farmaco...',
    medicationSignal: 'Semaforo',
    allSignals: 'Todos',
    contraindicated: 'No usar',
    avoid: 'Evitar si es posible',
    caution: 'Precaucion',
    prevalence: 'Frecuencia',
    recommendation: 'Recomendacion',
    evidence: 'Evidencia',
    pathway: 'Metabolizacion / eliminacion',
    examples: 'Farmacos y ejemplos',
    summary: 'Resumen clinico',
    noResults: 'No hay coincidencias con ese filtro.',
    allSpecies: 'Todas las especies',
    species: 'Especie',
    mdr1BreedsTitle: 'Razas a vigilar',
    mdr1DrugsTitle: 'Farmacos a vigilar',
    metabolismTitle: 'Alertas de metabolismo y excrecion',
  },
  en: {
    title: 'Clinical genetics',
    subtitle: 'MDR1 and breed-linked drug metabolism, focused on fast practical decisions.',
    mdr1Tab: 'MDR1',
    metabolismTab: 'Metabolism',
    breedSearch: 'Search breed or drug...',
    medicationSignal: 'Severity',
    allSignals: 'All',
    contraindicated: 'Do not use',
    avoid: 'Avoid if possible',
    caution: 'Use caution',
    prevalence: 'Prevalence',
    recommendation: 'Recommendation',
    evidence: 'Evidence',
    pathway: 'Metabolism / excretion',
    examples: 'Drugs and examples',
    summary: 'Clinical summary',
    noResults: 'No matches for the current filter.',
    allSpecies: 'All species',
    species: 'Species',
    mdr1BreedsTitle: 'Breeds to watch',
    mdr1DrugsTitle: 'Drugs to watch',
    metabolismTitle: 'Metabolism and excretion alerts',
  },
} as const;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const signalToneMap = {
  contraindicated: 'red',
  avoid: 'amber',
  caution: 'yellow',
} as const;

const toneLabel = (lang: Language, tone: GeneticsRiskTone) => {
  if (lang === 'es') {
    if (tone === 'red') return 'Alta alerta';
    if (tone === 'amber') return 'Riesgo relevante';
    if (tone === 'yellow') return 'Vigilar';
    if (tone === 'green') return 'Bajo';
    return 'Info';
  }

  if (tone === 'red') return 'High alert';
  if (tone === 'amber') return 'Relevant risk';
  if (tone === 'yellow') return 'Monitor';
  if (tone === 'green') return 'Low';
  return 'Info';
};

export default function GeneticsToolkit({ lang }: Props) {
  const t = copy[lang];
  const [activeView, setActiveView] = useState<GeneticsView>('mdr1');
  const [query, setQuery] = useState('');
  const [signalFilter, setSignalFilter] = useState<'all' | 'contraindicated' | 'avoid' | 'caution'>('all');
  const [speciesFilter, setSpeciesFilter] = useState('');

  const filteredBreedProfiles = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return mdr1BreedProfiles.filter((profile) => {
      if (!normalizedQuery) return true;
      return normalizeText([profile.breed, ...(profile.aliases ?? [])].join(' ')).includes(normalizedQuery);
    });
  }, [query]);

  const filteredMedicationGuidance = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return mdr1MedicationGuidance.filter((entry) => {
      const matchesSignal = signalFilter === 'all' ? true : entry.signal === signalFilter;
      if (!matchesSignal) return false;
      if (!normalizedQuery) return true;

      return normalizeText(`${entry.activeIngredient} ${entry.category.es} ${entry.notes.es}`).includes(normalizedQuery);
    });
  }, [query, signalFilter]);

  const filteredMetabolismAlerts = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return metabolismAlerts.filter((entry) => {
      const matchesSpecies = speciesFilter ? entry.species === speciesFilter : true;
      if (!matchesSpecies) return false;
      if (!normalizedQuery) return true;

      return normalizeText([entry.title, ...entry.breeds, ...entry.examples, entry.pathway.es].join(' ')).includes(normalizedQuery);
    });
  }, [query, speciesFilter]);

  return (
    <section className="toolkit-utility genetics-toolkit">
      <div className="genetics-hero">
        <p className="section-kicker">Toolkit</p>
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>

      <div className="subtabs genetics-subtabs" role="tablist" aria-label={t.title}>
        <button type="button" className={activeView === 'mdr1' ? 'active' : ''} onClick={() => setActiveView('mdr1')}>
          {t.mdr1Tab}
        </button>
        <button
          type="button"
          className={activeView === 'metabolism' ? 'active' : ''}
          onClick={() => setActiveView('metabolism')}
        >
          {t.metabolismTab}
        </button>
      </div>

      <div className="toolkit-utility-form genetics-filter-grid">
        <label>
          {t.breedSearch}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.breedSearch}
            title={t.breedSearch}
          />
        </label>

        {activeView === 'mdr1' ? (
          <label>
            {t.medicationSignal}
            <select value={signalFilter} onChange={(event) => setSignalFilter(event.target.value as typeof signalFilter)}>
              <option value="all">{t.allSignals}</option>
              <option value="contraindicated">{t.contraindicated}</option>
              <option value="avoid">{t.avoid}</option>
              <option value="caution">{t.caution}</option>
            </select>
          </label>
        ) : (
          <label>
            {t.species}
            <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value)}>
              <option value="">{t.allSpecies}</option>
              <option value="Dog">{lang === 'es' ? 'Perro' : 'Dog'}</option>
              <option value="Cat">{lang === 'es' ? 'Gato' : 'Cat'}</option>
            </select>
          </label>
        )}
      </div>

      {activeView === 'mdr1' ? (
        <div className="toolkit-utility-grid genetics-grid">
          <section className="toolkit-utility-card genetics-section-card">
            <div className="genetics-section-heading">
              <strong>{t.mdr1BreedsTitle}</strong>
            </div>

            {filteredBreedProfiles.length === 0 ? (
              <p>{t.noResults}</p>
            ) : (
              <div className="genetics-card-list">
                {filteredBreedProfiles.map((profile) => (
                  <article key={profile.breed} className="genetics-breed-card">
                    <header className="genetics-card-header">
                      <div>
                        <h4>{profile.breed}</h4>
                        {profile.aliases?.length ? <p>{profile.aliases.join(' · ')}</p> : null}
                      </div>
                      <span className={`risk-badge is-${profile.tone}`}>{toneLabel(lang, profile.tone)}</span>
                    </header>

                    <div className="genetics-meta-grid">
                      <p>
                        <span>{t.prevalence}</span>
                        <strong>{profile.prevalence[lang]}</strong>
                      </p>
                      <p>
                        <span>{t.recommendation}</span>
                        <strong>{profile.recommendation[lang]}</strong>
                      </p>
                    </div>

                    <p>{profile.summary[lang]}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="toolkit-utility-card genetics-section-card">
            <div className="genetics-section-heading">
              <strong>{t.mdr1DrugsTitle}</strong>
            </div>

            {filteredMedicationGuidance.length === 0 ? (
              <p>{t.noResults}</p>
            ) : (
              <div className="genetics-card-list">
                {filteredMedicationGuidance.map((entry) => (
                  <article key={entry.activeIngredient} className="genetics-med-card">
                    <header className="genetics-card-header">
                      <div>
                        <h4>{entry.activeIngredient}</h4>
                        <p>{entry.category[lang]}</p>
                      </div>
                      <span className={`risk-badge is-${signalToneMap[entry.signal]}`}>
                        {entry.signal === 'contraindicated'
                          ? t.contraindicated
                          : entry.signal === 'avoid'
                            ? t.avoid
                            : t.caution}
                      </span>
                    </header>

                    <div className="genetics-meta-grid">
                      <p>
                        <span>{t.evidence}</span>
                        <strong>{entry.evidence[lang]}</strong>
                      </p>
                      <p>
                        <span>{t.recommendation}</span>
                        <strong>{entry.recommendation[lang]}</strong>
                      </p>
                    </div>

                    <p>{entry.notes[lang]}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeView === 'metabolism' ? (
        <section className="toolkit-utility-card genetics-section-card">
          <div className="genetics-section-heading">
            <strong>{t.metabolismTitle}</strong>
          </div>

          {filteredMetabolismAlerts.length === 0 ? (
            <p>{t.noResults}</p>
          ) : (
            <div className="genetics-card-list">
              {filteredMetabolismAlerts.map((entry) => (
                <article key={entry.id} className="genetics-med-card">
                  <header className="genetics-card-header">
                    <div>
                      <h4>{entry.title}</h4>
                      <p>{entry.breeds.join(' · ')}</p>
                    </div>
                    <span className={`risk-badge is-${entry.tone}`}>{toneLabel(lang, entry.tone)}</span>
                  </header>

                  <div className="genetics-meta-grid">
                    <p>
                      <span>{t.pathway}</span>
                      <strong>{entry.pathway[lang]}</strong>
                    </p>
                    <p>
                      <span>{t.examples}</span>
                      <strong>{entry.examples.join(', ')}</strong>
                    </p>
                    <p>
                      <span>{t.summary}</span>
                      <strong>{entry.risk[lang]}</strong>
                    </p>
                    <p>
                      <span>{t.recommendation}</span>
                      <strong>{entry.recommendation[lang]}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
