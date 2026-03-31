import { useMemo, useState } from 'react';
import { Language, labels } from '../i18n';
import { translateMedicalTerm } from '../lib/terms';
import { DoseCalculatorEntry } from '../types';

interface Props {
  entries: DoseCalculatorEntry[];
  lang: Language;
  onOpenKnowledge: (entry: DoseCalculatorEntry) => void;
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
        { group: 'D', meaning: 'Prudencia', use: 'Uso prudente. Opcion con menor impacto relativo dentro de AMEG.', tone: 'd' },
        { group: 'C', meaning: 'Precaucion', use: 'Requiere mas cautela y justificacion clinica.', tone: 'c' },
        { group: 'B', meaning: 'Limitar', use: 'Reservar y limitar el uso a situaciones justificadas.', tone: 'b' },
        { group: 'A', meaning: 'Evitar', use: 'Evitar salvo situaciones excepcionales o de ultima reserva.', tone: 'a' },
      ]
    : [
        { group: 'D', meaning: 'Prudence', use: 'Prudent use. Lower relative impact option within AMEG.', tone: 'd' },
        { group: 'C', meaning: 'Caution', use: 'Needs more caution and clear clinical justification.', tone: 'c' },
        { group: 'B', meaning: 'Restrict', use: 'Reserve and limit use to justified situations.', tone: 'b' },
        { group: 'A', meaning: 'Avoid', use: 'Avoid unless the situation is exceptional or last-resort.', tone: 'a' },
      ];

export default function DoseCalculator({ entries, lang, onOpenKnowledge }: Props) {
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
    indication: true,
    dose: true,
    doseUnit: true,
    frequency: true,
    duration: true,
    selectedDose: true,
    calculatedDose: true,
    concentration: true,
    presentation: true,
    observations: true,
    bibliography: false,
    openKnowledge: true,
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

      <details className="toolkit-reference-table accordion-card ameg-reference-card">
        <summary className="accordion-summary">
          <div>
            <strong>{t.amegReferenceTitle}</strong>
            <p>{t.amegReferenceText}</p>
          </div>
        </summary>
        <div className="ameg-table-shell">
          <table className="ameg-table">
            <thead>
              <tr>
                <th>{t.amegGroupLabel}</th>
                <th>{t.amegMeaningLabel}</th>
                <th>{t.amegUseLabel}</th>
              </tr>
            </thead>
            <tbody>
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

      <div className="dose-table-shell">
        <table className="dose-table">
          <thead>
            <tr>
              {visibleColumns.activeIngredient ? <th>{t.activeIngredient}</th> : null}
              {visibleColumns.category ? <th>{t.doseCalculatorCategory}</th> : null}
              {visibleColumns.subcategory ? <th>{t.doseCalculatorSubcategory}</th> : null}
              {visibleColumns.antibioticCategory ? <th>{t.doseCalculatorAntibioticCategory}</th> : null}
              {visibleColumns.species ? <th>{t.species}</th> : null}
              {visibleColumns.route ? <th>{t.administrationRoute}</th> : null}
              {visibleColumns.indication ? <th>{t.indications}</th> : null}
              {visibleColumns.dose ? <th>{t.dose}</th> : null}
              {visibleColumns.doseUnit ? <th>{t.doseUnitLabel}</th> : null}
              {visibleColumns.frequency ? <th>{t.frequencyLabel}</th> : null}
              {visibleColumns.duration ? <th>{t.durationLabel}</th> : null}
              {visibleColumns.selectedDose ? <th>{t.selectedDose}</th> : null}
              {visibleColumns.calculatedDose ? <th>{t.calculatedDose}</th> : null}
              {visibleColumns.concentration ? <th>{t.concentrationLabel}</th> : null}
              {visibleColumns.presentation ? <th>{t.presentationResult}</th> : null}
              {visibleColumns.observations ? <th>{t.observationsLabel}</th> : null}
              {visibleColumns.bibliography ? <th>{t.bibliographyLabel}</th> : null}
              {visibleColumns.openKnowledge ? <th>{t.openKnowledgeRecord}</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
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
                <tr key={entry.id}>
                  {visibleColumns.activeIngredient ? (
                    <td>
                      <strong>{entry.activeIngredient}</strong>
                    </td>
                  ) : null}
                  {visibleColumns.category ? <td>{entry.category[lang]}</td> : null}
                  {visibleColumns.subcategory ? <td>{entry.subcategory?.[lang] ?? '--'}</td> : null}
                  {visibleColumns.antibioticCategory ? <td>{entry.antibioticCategory ?? '--'}</td> : null}
                  {visibleColumns.species ? (
                    <td>{entry.speciesLabel ?? entry.species.map((species) => translateMedicalTerm(species, lang)).join(', ')}</td>
                  ) : null}
                  {visibleColumns.route ? <td>{entry.route}</td> : null}
                  {visibleColumns.indication ? <td>{entry.indication[lang]}</td> : null}
                  {visibleColumns.dose ? <td>{rangeLabel}</td> : null}
                  {visibleColumns.doseUnit ? <td>{separateUnitLabel}</td> : null}
                  {visibleColumns.frequency ? <td>{entry.frequency ?? '--'}</td> : null}
                  {visibleColumns.duration ? <td>{entry.duration ?? '--'}</td> : null}
                  {visibleColumns.selectedDose ? (
                    <td>
                      <input
                        className="dose-inline-input"
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
                    <td>{calculatedDoseValue !== null ? `${doseFormatter.format(calculatedDoseValue)} ${computedDoseUnit}`.trim() : '--'}</td>
                  ) : null}
                  {visibleColumns.concentration ? <td>{entry.concentration[lang] || '--'}</td> : null}
                  {visibleColumns.presentation ? (
                    <td>
                      {mlValue !== null
                        ? `${mlValue.toFixed(2)} mL`
                        : tabletValue !== null
                          ? `${tabletValue.toFixed(2)} ${t.tabletUnits}`
                          : '--'}
                    </td>
                  ) : null}
                  {visibleColumns.observations ? <td>{entry.observations ?? '--'}</td> : null}
                  {visibleColumns.bibliography ? <td>{entry.bibliography ?? '--'}</td> : null}
                  {visibleColumns.openKnowledge ? (
                    <td>
                      <button className="secondary-button" type="button" onClick={() => onOpenKnowledge(entry)}>
                        {t.openKnowledgeRecord}
                      </button>
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
