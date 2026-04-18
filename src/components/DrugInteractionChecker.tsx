import { FormEvent, useMemo, useState } from 'react';
import { indexedActiveIngredientNames } from '../data/indexedActiveIngredients';
import {
  interactionProfiles,
  interactionRules,
  normalizeInteractionName,
  type InteractionCheckerProfile,
  type InteractionRule,
  type InteractionSeverity,
} from '../data/drugInteractionChecker';
import { Language } from '../i18n';
import { TherapeuticEntry } from '../types';

interface Props {
  lang: Language;
  entries: TherapeuticEntry[];
}

const copy = {
  es: {
    title: 'Interacciones farmacologicas',
    subtitle: 'Revisa combinaciones clinicamente relevantes y, debajo, metabolismo y excrecion de los activos elegidos.',
    searchDrug: 'A\u00f1adir medicamento o principio activo',
    searchPlaceholder: 'Ejemplo: meloxicam, prednisolona, ciclosporina...',
    add: 'A\u00f1adir',
    selected: 'Medicamentos seleccionados',
    clear: 'Limpiar',
    noSelected: 'A\u00f1ade al menos dos medicamentos para revisar combinaciones.',
    noInteractions: 'No se ha detectado una regla curada para esta combinacion en la version actual.',
    severity: 'Severidad',
    summary: 'Resumen',
    management: 'Manejo',
    remove: 'Quitar',
    pharmacokinetics: 'Metabolizacion y excrecion',
    editorialNotes: 'Notas editoriales',
    noProfile: 'Sin ficha farmacocinetica resumida aun.',
    noNotes: 'Sin nota editorial cargada para este activo.',
    metabolism: 'Metabolizacion',
    excretion: 'Excrecion',
    cautions: 'Puntos de vigilancia',
    major: 'Mayor',
    moderate: 'Moderada',
    minor: 'Menor',
    unknown: 'Desconocida',
  },
  en: {
    title: 'Drug interactions',
    subtitle: 'Review clinically relevant combinations and, below, metabolism and excretion for the selected actives.',
    searchDrug: 'Add drug or active ingredient',
    searchPlaceholder: 'Example: meloxicam, prednisolone, cyclosporine...',
    add: 'Add',
    selected: 'Selected drugs',
    clear: 'Clear',
    noSelected: 'Add at least two drugs to review combinations.',
    noInteractions: 'No curated rule was detected for this combination in the current version.',
    severity: 'Severity',
    summary: 'Summary',
    management: 'Management',
    remove: 'Remove',
    pharmacokinetics: 'Metabolism and excretion',
    editorialNotes: 'Editorial notes',
    noProfile: 'No short pharmacokinetic summary yet.',
    noNotes: 'No editorial note loaded for this active.',
    metabolism: 'Metabolism',
    excretion: 'Excretion',
    cautions: 'Watch points',
    major: 'Major',
    moderate: 'Moderate',
    minor: 'Minor',
    unknown: 'Unknown',
  },
} as const;

const severityRank: Record<InteractionSeverity, number> = {
  major: 0,
  moderate: 1,
  minor: 2,
  unknown: 3,
};

const resolveSeverityLabel = (lang: Language, severity: InteractionSeverity) => {
  const t = copy[lang];
  if (severity === 'major') return t.major;
  if (severity === 'moderate') return t.moderate;
  if (severity === 'minor') return t.minor;
  return t.unknown;
};

const buildProfileMap = () => {
  const map = new Map<string, InteractionCheckerProfile>();

  interactionProfiles.forEach((profile) => {
    map.set(normalizeInteractionName(profile.name), profile);
    profile.aliases?.forEach((alias) => map.set(normalizeInteractionName(alias), profile));
  });

  return map;
};

const profileMap = buildProfileMap();

const resolveDrugName = (rawValue: string) => {
  const normalized = normalizeInteractionName(rawValue);
  if (!normalized) return null;

  const direct = profileMap.get(normalized);
  if (direct) return direct.name;

  const fromIndex = indexedActiveIngredientNames.find((item) => normalizeInteractionName(item) === normalized);
  if (fromIndex) return fromIndex;

  return rawValue.trim();
};

const getDrugClasses = (name: string) => profileMap.get(normalizeInteractionName(name))?.classes ?? [];
const getDrugProfile = (name: string) => profileMap.get(normalizeInteractionName(name)) ?? null;

const ruleMatches = (rule: InteractionRule, selectedDrugs: string[]) => {
  const normalizedSelected = selectedDrugs.map((item) => normalizeInteractionName(item));

  if (rule.drugs?.length) {
    return rule.drugs.every((drug) => normalizedSelected.includes(normalizeInteractionName(drug)));
  }

  if (!rule.requiredClasses?.length) return false;

  const selectedClassCounts = selectedDrugs.reduce<Record<string, number>>((acc, drug) => {
    getDrugClasses(drug).forEach((itemClass) => {
      acc[itemClass] = (acc[itemClass] ?? 0) + 1;
    });
    return acc;
  }, {});

  const requiredCounts = rule.requiredClasses.reduce<Record<string, number>>((acc, itemClass) => {
    acc[itemClass] = (acc[itemClass] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(requiredCounts).every(([itemClass, count]) => (selectedClassCounts[itemClass] ?? 0) >= count);
};

const getRuleMatchesLabel = (rule: InteractionRule, selectedDrugs: string[]) => {
  if (rule.drugs?.length) return rule.drugs.join(' + ');

  const matched = selectedDrugs.filter((drug) => {
    const classes = getDrugClasses(drug);
    return rule.requiredClasses?.some((requiredClass) => classes.includes(requiredClass));
  });

  return matched.join(' + ');
};

export default function DrugInteractionChecker({ lang, entries }: Props) {
  const t = copy[lang];
  const [query, setQuery] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);

  const optionList = useMemo(() => {
    const merged = new Map<string, string>();

    interactionProfiles.forEach((profile) => merged.set(normalizeInteractionName(profile.name), profile.name));
    entries.forEach((entry) => merged.set(normalizeInteractionName(entry.activeIngredient), entry.activeIngredient));
    indexedActiveIngredientNames.forEach((name) => {
      const normalized = normalizeInteractionName(name);
      if (!merged.has(normalized)) merged.set(normalized, name);
    });

    return Array.from(merged.values()).sort((left, right) => left.localeCompare(right));
  }, [entries]);

  const selectedEntryNotes = useMemo(() => {
    const noteMap = new Map<string, string>();

    entries.forEach((entry) => {
      noteMap.set(normalizeInteractionName(entry.activeIngredient), entry.interactions[lang]);
    });

    return noteMap;
  }, [entries, lang]);

  const detectedInteractions = useMemo(
    () =>
      interactionRules
        .filter((rule) => ruleMatches(rule, selectedDrugs))
        .map((rule) => ({
          rule,
          matchesLabel: getRuleMatchesLabel(rule, selectedDrugs),
        }))
        .sort((left, right) => severityRank[left.rule.severity] - severityRank[right.rule.severity]),
    [selectedDrugs],
  );

  const selectedProfiles = useMemo(
    () =>
      selectedDrugs.map((drug) => ({
        drug,
        profile: getDrugProfile(drug),
        note: selectedEntryNotes.get(normalizeInteractionName(drug)) ?? '',
      })),
    [selectedDrugs, selectedEntryNotes],
  );

  const handleAddDrug = (event?: FormEvent) => {
    event?.preventDefault();
    const resolved = resolveDrugName(query);
    if (!resolved) return;

    setSelectedDrugs((current) => {
      if (current.some((item) => normalizeInteractionName(item) === normalizeInteractionName(resolved))) return current;
      return [...current, resolved];
    });
    setQuery('');
  };

  return (
    <section className="toolkit-utility interaction-toolkit">
      <div className="genetics-hero">
        <p className="section-kicker">Toolkit</p>
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>

      <form className="toolkit-utility-form interaction-add-form" onSubmit={handleAddDrug}>
        <label>
          {t.searchDrug}
          <input
            type="search"
            list="interaction-drug-options"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            title={t.searchPlaceholder}
          />
          <datalist id="interaction-drug-options">
            {optionList.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        <button type="submit" className="generate-button">
          {t.add}
        </button>
      </form>

      <section className="toolkit-utility-card interaction-chip-card">
        <div className="genetics-section-heading">
          <strong>{t.selected}</strong>
          {selectedDrugs.length > 0 ? (
            <button type="button" className="secondary-button" onClick={() => setSelectedDrugs([])}>
              {t.clear}
            </button>
          ) : null}
        </div>

        {selectedDrugs.length === 0 ? (
          <p>{t.noSelected}</p>
        ) : (
          <div className="interaction-chip-row">
            {selectedDrugs.map((drug) => (
              <button
                key={drug}
                type="button"
                className="interaction-chip"
                onClick={() =>
                  setSelectedDrugs((current) =>
                    current.filter((item) => normalizeInteractionName(item) !== normalizeInteractionName(drug)),
                  )
                }
              >
                <span>{drug}</span>
                <strong>{t.remove}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedDrugs.length >= 2 ? (
        <div className="toolkit-utility-grid interaction-grid">
          <section className="toolkit-utility-card genetics-section-card">
            <div className="genetics-section-heading">
              <strong>{t.title}</strong>
            </div>

            {detectedInteractions.length === 0 ? (
              <p>{t.noInteractions}</p>
            ) : (
              <div className="genetics-card-list">
                {detectedInteractions.map(({ rule, matchesLabel }) => (
                  <article key={rule.id} className="interaction-result-card">
                    <header className="genetics-card-header">
                      <div>
                        <h4>{rule.title[lang]}</h4>
                        <p>{matchesLabel}</p>
                      </div>
                      <span
                        className={`risk-badge is-${rule.severity === 'major' ? 'red' : rule.severity === 'moderate' ? 'amber' : 'yellow'}`}
                      >
                        {resolveSeverityLabel(lang, rule.severity)}
                      </span>
                    </header>

                    <div className="genetics-meta-grid">
                      <p>
                        <span>{t.severity}</span>
                        <strong>{resolveSeverityLabel(lang, rule.severity)}</strong>
                      </p>
                      <p>
                        <span>{t.summary}</span>
                        <strong>{rule.summary[lang]}</strong>
                      </p>
                      <p className="genetics-span-full">
                        <span>{t.management}</span>
                        <strong>{rule.management[lang]}</strong>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="toolkit-utility-card genetics-section-card">
            <div className="genetics-section-heading">
              <strong>{t.pharmacokinetics}</strong>
            </div>

            <div className="genetics-card-list">
              {selectedProfiles.map(({ drug, profile, note }) => (
                <article key={drug} className="genetics-breed-card">
                  <header className="genetics-card-header">
                    <div>
                      <h4>{drug}</h4>
                    </div>
                    <span className="risk-badge is-blue">{lang === 'es' ? 'PK' : 'PK'}</span>
                  </header>

                  <div className="genetics-meta-grid">
                    <p>
                      <span>{t.metabolism}</span>
                      <strong>{profile?.metabolism?.[lang] ?? t.noProfile}</strong>
                    </p>
                    <p>
                      <span>{t.excretion}</span>
                      <strong>{profile?.excretion?.[lang] ?? t.noProfile}</strong>
                    </p>
                    {profile?.cautions ? (
                      <p className="genetics-span-full">
                        <span>{t.cautions}</span>
                        <strong>{profile.cautions[lang]}</strong>
                      </p>
                    ) : null}
                    <p className="genetics-span-full">
                      <span>{t.editorialNotes}</span>
                      <strong>{note || t.noNotes}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
