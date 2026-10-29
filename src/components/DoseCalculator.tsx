import { useMemo, useState } from 'react';
import { Language, labels } from '../i18n';
import { translateMedicalTerm } from '../lib/terms';
import { DoseCalculatorEntry } from '../types';
import CriProtocolLinks from './CriProtocolLinks';
import './dose-records.css';

interface Props {
  entries: DoseCalculatorEntry[];
  lang: Language;
  onOpenKnowledge: (entry: DoseCalculatorEntry) => void;
  onReviewEntry?: (entry: DoseCalculatorEntry, approvalLevel: number) => void;
  onPublicationChange?: (entry: DoseCalculatorEntry, status: 'active' | 'rejected') => void;
  canReview?: boolean;
  canActivate?: boolean;
  onOpenCri?: (id?: string) => void;
}

const KG_TO_LB = 2.2046226218;

const roundValue = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const hasEmbeddedDoseUnit = (value?: string) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ/%]/.test(value ?? '');
const isWeightBasedDoseUnit = (value?: string) => (value ?? '').toLowerCase().includes('/kg');
const getResolvedDoseUnit = (value?: string) => (value && value.trim() ? value : 'mg/kg');

const getAmegReferenceRows = (lang: Language) =>
  lang === 'es'
    ? [
        { group: 'D', meaning: 'Prudencia', use: 'Priorizar si es clínicamente eficaz; usar solo cuando esté indicado.', tone: 'd' },
        { group: 'C', meaning: 'Cautela', use: 'Considerar si no existe una opción eficaz de categoría D.', tone: 'c' },
        { group: 'B', meaning: 'Restringir', use: 'Si C/D no son eficaces; basar en sensibilidad siempre que sea posible.', tone: 'b' },
        { group: 'A', meaning: 'Evitar', use: 'Evitar; comprobar prohibiciones y normativa. AMEG no autoriza una prescripción.', tone: 'a' },
      ]
    : [
        { group: 'D', meaning: 'Prudence', use: 'Prefer when clinically effective; use only when indicated.', tone: 'd' },
        { group: 'C', meaning: 'Caution', use: 'Consider if no effective category D option is available.', tone: 'c' },
        { group: 'B', meaning: 'Restrict', use: 'If C/D are not effective; base on susceptibility testing wherever possible.', tone: 'b' },
        { group: 'A', meaning: 'Avoid', use: 'Avoid; check prohibitions and legislation. AMEG does not authorise prescribing.', tone: 'a' },
      ];

const renderReviewBadge = (entry: DoseCalculatorEntry, lang: Language) => {
  const review = entry.reviewSummary;
  if (!review?.approvalCount) return lang === 'es' ? 'Pendiente' : 'Pending';
  const icon = review.approvalScore / review.approvalCount >= 2.5 ? '⭐⭐⭐' : '👍';
  return `${icon} x${review.approvalCount}`;
};

export default function DoseCalculator({
  entries,
  lang,
  onOpenKnowledge,
  onReviewEntry,
  onPublicationChange,
  canReview = false,
  canActivate = false,
  onOpenCri,
}: Props) {
  const t = labels[lang];
  const [weightKg, setWeightKg] = useState('');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [doseOverrides, setDoseOverrides] = useState<Record<string, number>>({});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    activeIngredient: true,
    category: true,
    subcategory: true,
    antibioticCategory: true,
    species: true,
    route: true,
    indication: false,
    dose: true,
    doseUnit: true,
    frequency: true,
    duration: false,
    selectedDose: true,
    calculatedDose: true,
    concentration: false,
    presentation: false,
    observations: false,
    bibliography: false,
    openKnowledge: false,
  });

  const speciesOptions = useMemo(() => {
    return Array.from(new Set(entries.flatMap((entry) => entry.species))).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.category[lang]))).sort((a, b) => a.localeCompare(b));
  }, [entries, lang]);

  const doseFormatter = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [lang],
  );
  const amegReferenceRows = useMemo(() => getAmegReferenceRows(lang), [lang]);
  const columnOptions = useMemo(
    () => [
      { key: 'activeIngredient', label: t.activeIngredient },
      { key: 'category', label: t.doseCalculatorCategory },
      { key: 'subcategory', label: t.doseCalculatorSubcategory },
      { key: 'antibioticCategory', label: t.doseCalculatorAntibioticCategory },
      { key: 'species', label: t.species },
      { key: 'route', label: t.administrationRoute },
      { key: 'indication', label: t.indications },
      { key: 'dose', label: t.dose },
      { key: 'doseUnit', label: t.doseUnitLabel },
      { key: 'frequency', label: t.frequencyLabel },
      { key: 'duration', label: t.durationLabel },
      { key: 'selectedDose', label: t.selectedDose },
      { key: 'calculatedDose', label: t.calculatedDose },
      { key: 'concentration', label: t.concentrationLabel },
      { key: 'presentation', label: t.presentationResult },
      { key: 'observations', label: t.observationsLabel },
      { key: 'bibliography', label: t.bibliographyLabel },
      { key: 'openKnowledge', label: t.openKnowledgeRecord },
    ],
    [t],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSpecies = speciesFilter ? entry.species.includes(speciesFilter as DoseCalculatorEntry['species'][number]) : true;
      const matchesCategory = categoryFilter ? entry.category[lang] === categoryFilter : true;

      if (!normalizedQuery) return matchesSpecies && matchesCategory;

      const haystack = [
        entry.activeIngredient,
        entry.category.es,
        entry.category.en,
        entry.subcategory?.es ?? '',
        entry.subcategory?.en ?? '',
        entry.antibioticCategory ?? '',
        entry.indication.es,
        entry.indication.en,
        entry.route,
        entry.speciesLabel ?? '',
        entry.frequency ?? '',
        entry.duration ?? '',
        entry.observations ?? '',
        entry.bibliography ?? '',
        ...entry.species,
      ]
        .join(' ')
        .toLowerCase();

      return matchesSpecies && matchesCategory && haystack.includes(normalizedQuery);
    });
  }, [categoryFilter, entries, lang, search, speciesFilter]);

  const numericWeightKg = Number(weightKg);
  const weightLb = Number.isFinite(numericWeightKg) && numericWeightKg > 0 ? roundValue(numericWeightKg * KG_TO_LB, 2) : null;

  return (
    <section className="dose-calculator">
      <div className="dose-calculator-header">
        <div>
          <p className="section-kicker">{t.doseCalculatorKicker}</p>
          <h3>{t.doseCalculatorTitle}</h3>
          <p>{t.doseCalculatorText}</p>
        </div>
        <div className="dose-weight-card">
          <label>
            {t.weightKg}
            <input
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              placeholder="4.5"
              title="4.5"
            />
          </label>
          <div>
            <span>{t.weightLb}</span>
            <strong>{weightLb !== null ? weightLb.toFixed(2) : '--'}</strong>
          </div>
        </div>
      </div>

      <div className="dose-filter-grid">
        <label>
          {t.search}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.doseCalculatorSearchPlaceholder}
            title={t.doseCalculatorSearchPlaceholder}
          />
        </label>
        <label>
          {t.species}
          <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value)}>
            <option value="">{t.all}</option>
            {speciesOptions.map((species) => (
              <option key={species} value={species}>
                {translateMedicalTerm(species, lang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.doseCalculatorCategory}
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">{t.all}</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {onOpenCri && <CriProtocolLinks lang={lang} query={search} onOpen={onOpenCri} />}

      <details className="toolkit-reference-table accordion-card ameg-reference-card">
        <summary className="accordion-summary">
          <div>
            <strong>{t.amegReferenceTitle}</strong>
            <p>{t.amegReferenceText}</p>
          </div>
        </summary>
        <div className="ameg-table-shell">
          <table className="ameg-table">
            <thead className="dose-records-head">
              <tr>
                <th scope="col">{t.amegGroupLabel}</th>
                <th scope="col">{t.amegMeaningLabel}</th>
                <th scope="col">{t.amegUseLabel}</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {amegReferenceRows.map((row) => (
                <tr key={row.group} className={`ameg-row ameg-row-${row.tone}`}>
                  <td>
                    <span className={`ameg-badge ameg-badge-${row.tone}`}>AMEG {row.group}</span>
                  </td>
                  <td>{row.meaning}</td>
                  <td>{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dose-disclaimer"><a href="https://www.ema.europa.eu/en/partners-networks/animal-health-practitioners" target="_blank" rel="noopener noreferrer">{lang === 'es' ? 'Fuente oficial: EMA · AMEG' : 'Official source: EMA · AMEG'} ↗</a></p>
      </details>

      <section className="dose-columns-bar" aria-label={lang === 'es' ? 'Columnas visibles' : 'Visible columns'}>
        <div className="dose-columns-heading">
          <strong>{lang === 'es' ? 'Columnas visibles' : 'Visible columns'}</strong>
          <span>{lang === 'es' ? 'Marca o desmarca lo que quieres ver en la tabla.' : 'Toggle the fields you want to keep on screen.'}</span>
        </div>
        <div className="dose-columns-list">
          {columnOptions.map((column) => (
            <label key={column.key} className="checkbox-inline dose-column-toggle">
              <input
                type="checkbox"
                checked={visibleColumns[column.key]}
                onChange={() =>
                  setVisibleColumns((current) => ({
                    ...current,
                    [column.key]: !current[column.key],
                  }))
                }
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      </section>

      {!Object.values(visibleColumns).some(Boolean) && <p role="status">{lang === 'es' ? 'Activa al menos una columna para ver los datos.' : 'Enable at least one column to see the data.'}</p>}
      {filteredEntries.length === 0 && <p role="status">{lang === 'es' ? 'No hay pautas para estos filtros.' : 'No dosing records match these filters.'}</p>}
      <div className="dose-table-shell dose-records-shell">
        <table className="dose-table dose-records" role="table">
          <thead className="dose-records-head">
            <tr>
              {visibleColumns.activeIngredient ? <th scope="col">{t.activeIngredient}</th> : null}
              {visibleColumns.category ? <th scope="col">{t.doseCalculatorCategory}</th> : null}
              {visibleColumns.subcategory ? <th scope="col">{t.doseCalculatorSubcategory}</th> : null}
              {visibleColumns.antibioticCategory ? <th scope="col">{t.doseCalculatorAntibioticCategory}</th> : null}
              {visibleColumns.species ? <th scope="col">{t.species}</th> : null}
              {visibleColumns.route ? <th scope="col">{t.administrationRoute}</th> : null}
              {visibleColumns.indication ? <th scope="col">{t.indications}</th> : null}
              {visibleColumns.dose ? <th scope="col">{t.dose}</th> : null}
              {visibleColumns.doseUnit ? <th scope="col">{t.doseUnitLabel}</th> : null}
              {visibleColumns.frequency ? <th scope="col">{t.frequencyLabel}</th> : null}
              {visibleColumns.duration ? <th scope="col">{t.durationLabel}</th> : null}
              {visibleColumns.selectedDose ? <th scope="col">{t.selectedDose}</th> : null}
              {visibleColumns.calculatedDose ? <th scope="col">{t.calculatedDose}</th> : null}
              {visibleColumns.concentration ? <th scope="col">{t.concentrationLabel}</th> : null}
              {visibleColumns.presentation ? <th scope="col">{t.presentationResult}</th> : null}
              {visibleColumns.observations ? <th scope="col">{t.observationsLabel}</th> : null}
              {visibleColumns.bibliography ? <th scope="col">{t.bibliographyLabel}</th> : null}
              {visibleColumns.openKnowledge ? <th scope="col">{t.openKnowledgeRecord}</th> : null}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {filteredEntries.map((entry) => {
              const publicationStatus = entry.publicationStatus ?? 'active';
              const selectedDose = doseOverrides[entry.id] ?? entry.defaultDoseMgKg;
              const doseUnit = getResolvedDoseUnit(entry.doseUnit);
              const weightBasedDose = isWeightBasedDoseUnit(doseUnit);
              const computedDoseUnit = weightBasedDose ? doseUnit.replace(/\/kg/gi, '').replace(/\/+/g, '/').trim() : doseUnit;
              const hasNumericDose =
                Number.isFinite(selectedDose) &&
                Number.isFinite(entry.doseRangeMgKg.min) &&
                Number.isFinite(entry.doseRangeMgKg.max);
              const calculatedDoseValue =
                hasNumericDose && weightBasedDose && Number.isFinite(numericWeightKg) && numericWeightKg > 0
                  ? roundValue(selectedDose * numericWeightKg, 2)
                  : hasNumericDose && !weightBasedDose
                    ? roundValue(selectedDose, 2)
                    : null;
              const presentationDoseMg = calculatedDoseValue !== null && computedDoseUnit.toLowerCase() === 'mg' ? calculatedDoseValue : null;
              const mlValue =
                presentationDoseMg !== null && entry.concentration.mgPerMl
                  ? roundValue(presentationDoseMg / entry.concentration.mgPerMl, 2)
                  : null;
              const tabletValue =
                presentationDoseMg !== null && entry.concentration.mgPerTablet
                  ? roundValue(presentationDoseMg / entry.concentration.mgPerTablet, 2)
                  : null;
              const rangeLabel = entry.doseText
                ? hasEmbeddedDoseUnit(entry.doseText)
                  ? entry.doseText
                  : `${entry.doseText} ${doseUnit}`.trim()
                : Number.isFinite(entry.doseRangeMgKg.min) && Number.isFinite(entry.doseRangeMgKg.max)
                  ? entry.doseRangeMgKg.min === entry.doseRangeMgKg.max
                    ? doseFormatter.format(entry.doseRangeMgKg.min)
                    : `${doseFormatter.format(entry.doseRangeMgKg.min)}-${doseFormatter.format(entry.doseRangeMgKg.max)}`
                  : '--';
              const separateUnitLabel = entry.doseText && hasEmbeddedDoseUnit(entry.doseText) ? '--' : doseUnit;

              return (
                <tr key={entry.id} role="row">
                  {visibleColumns.activeIngredient ? (
                    <td role="cell" data-label={t.activeIngredient}>
                      <strong>{entry.activeIngredient}</strong>
                      {entry.dosePhase && <small className="dose-phase">{entry.indication[lang]}</small>}
                      <div className="dose-entry-review-meta">
                        <span>{renderReviewBadge(entry, lang)}</span>
                        {publicationStatus !== 'active' ? (
                          <span>{publicationStatus === 'pending_activation' ? t.pendingActivationOnly : t.rejectEntry}</span>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  {visibleColumns.category ? <td role="cell" data-label={t.doseCalculatorCategory}>{entry.category[lang]}</td> : null}
                  {visibleColumns.subcategory ? <td role="cell" data-label={t.doseCalculatorSubcategory}>{entry.subcategory?.[lang] ?? '--'}</td> : null}
                  {visibleColumns.antibioticCategory ? <td role="cell" data-label={t.doseCalculatorAntibioticCategory}>{entry.antibioticCategory ?? '--'}</td> : null}
                  {visibleColumns.species ? (
                    <td role="cell" data-label={t.species}>{(lang === 'es' ? entry.speciesLabel : undefined) ?? entry.species.map((species) => translateMedicalTerm(species, lang)).join(', ')}</td>
                  ) : null}
                  {visibleColumns.route ? <td role="cell" data-label={t.administrationRoute}>{lang === 'en' ? entry.route.replace(/VO/g, 'PO') : entry.route}</td> : null}
                  {visibleColumns.indication ? <td role="cell" data-label={t.indications}>{entry.indication[lang]}</td> : null}
                  {visibleColumns.dose ? <td role="cell" data-label={t.dose}>{rangeLabel}{entry.dosePhase && <small className="dose-phase">{entry.dosePhase[lang]}</small>}</td> : null}
                  {visibleColumns.doseUnit ? <td role="cell" data-label={t.doseUnitLabel}>{separateUnitLabel}</td> : null}
                  {visibleColumns.frequency ? <td role="cell" data-label={t.frequencyLabel}>{(lang === 'es' ? entry.frequency?.replace(/q(\d+)h/g, 'c$1h') : entry.frequency?.replace(/c(\d+)h/g, 'q$1h')) ?? '--'}</td> : null}
                  {visibleColumns.duration ? <td role="cell" data-label={t.durationLabel}>{entry.dosePhase?.[lang] ?? entry.duration ?? '--'}</td> : null}
                  {visibleColumns.selectedDose ? (
                    <td role="cell" data-label={t.selectedDose}>
                      <input
                        className="dose-inline-input"
                        aria-label={`${t.selectedDose} · ${entry.activeIngredient} · ${entry.species.join('/')} · ${entry.indication[lang]} · ${doseUnit}`}
                        type="number"
                        min={Number.isFinite(entry.doseRangeMgKg.min) ? entry.doseRangeMgKg.min : undefined}
                        max={Number.isFinite(entry.doseRangeMgKg.max) ? entry.doseRangeMgKg.max : undefined}
                        step="0.01"
                        value={Number.isFinite(selectedDose) ? selectedDose : ''}
                        disabled={!hasNumericDose}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!Number.isNaN(value)) {
                            setDoseOverrides((current) => ({ ...current, [entry.id]: value }));
                          }
                        }}
                      />
                    </td>
                  ) : null}
                  {visibleColumns.calculatedDose ? (
                    <td role="cell" data-label={t.calculatedDose}>{calculatedDoseValue !== null ? `${doseFormatter.format(calculatedDoseValue)} ${computedDoseUnit}`.trim() : '--'}</td>
                  ) : null}
                  {visibleColumns.concentration ? <td role="cell" data-label={t.concentrationLabel}>{entry.concentration[lang] || '--'}</td> : null}
                  {visibleColumns.presentation ? (
                    <td role="cell" data-label={t.presentationResult}>
                      {mlValue !== null
                        ? `${mlValue.toFixed(2)} mL`
                        : tabletValue !== null
                          ? `${tabletValue.toFixed(2)} ${t.tabletUnits}`
                          : '--'}
                    </td>
                  ) : null}
                  {visibleColumns.observations ? <td role="cell" data-label={t.observationsLabel}>{entry.clinicalNotes?.[lang] ?? entry.observations ?? '--'}</td> : null}
                  {visibleColumns.bibliography ? <td role="cell" data-label={t.bibliographyLabel}>{entry.bibliography ?? '--'}</td> : null}
                  {visibleColumns.openKnowledge ? (
                    <td role="cell" data-label={t.openKnowledgeRecord}>
                      <div className="dose-entry-actions">
                        <button className="secondary-button" type="button" onClick={() => onOpenKnowledge(entry)}>
                          {t.openKnowledgeRecord}
                        </button>
                        {canReview && onReviewEntry && entry.linkedEntryId ? (
                          <>
                            <button className="secondary-button" type="button" onClick={() => onReviewEntry(entry, 1)}>
                              👍
                            </button>
                            <button className="secondary-button" type="button" onClick={() => onReviewEntry(entry, 2)}>
                              👍👍
                            </button>
                          </>
                        ) : null}
                        {canActivate && onPublicationChange && entry.linkedEntryId && publicationStatus !== 'active' ? (
                          <button className="secondary-button" type="button" onClick={() => onPublicationChange(entry, 'active')}>
                            {t.activateEntry}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="dose-disclaimer">{t.doseCalculatorDisclaimer}</p>
    </section>
  );
}
