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

export default function DoseCalculator({ entries, lang, onOpenKnowledge }: Props) {
  const t = labels[lang];
  const [weightKg, setWeightKg] = useState('');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [doseOverrides, setDoseOverrides] = useState<Record<string, number>>({});

  const speciesOptions = useMemo(() => {
    return Array.from(new Set(entries.flatMap((entry) => entry.species))).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.category[lang]))).sort((a, b) => a.localeCompare(b));
  }, [entries, lang]);

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
        entry.indication.es,
        entry.indication.en,
        entry.route,
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

      <div className="dose-table-shell">
        <table className="dose-table">
          <thead>
            <tr>
              <th>{t.activeIngredient}</th>
              <th>{t.doseCalculatorCategory}</th>
              <th>{t.species}</th>
              <th>{t.administrationRoute}</th>
              <th>{t.indications}</th>
              <th>{t.doseRange}</th>
              <th>{t.selectedDose}</th>
              <th>{t.calculatedDose}</th>
              <th>{t.concentrationLabel}</th>
              <th>{t.presentationResult}</th>
              <th>{t.openKnowledgeRecord}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const selectedDose = doseOverrides[entry.id] ?? entry.defaultDoseMgKg;
              const totalMg = Number.isFinite(numericWeightKg) && numericWeightKg > 0 ? roundValue(selectedDose * numericWeightKg, 2) : null;
              const mlValue = totalMg !== null && entry.concentration.mgPerMl ? roundValue(totalMg / entry.concentration.mgPerMl, 2) : null;
              const tabletValue = totalMg !== null && entry.concentration.mgPerTablet ? roundValue(totalMg / entry.concentration.mgPerTablet, 2) : null;

              return (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.activeIngredient}</strong>
                  </td>
                  <td>{entry.category[lang]}</td>
                  <td>{entry.species.map((species) => translateMedicalTerm(species, lang)).join(', ')}</td>
                  <td>{entry.route}</td>
                  <td>{entry.indication[lang]}</td>
                  <td>
                    {entry.doseRangeMgKg.min === entry.doseRangeMgKg.max
                      ? `${entry.doseRangeMgKg.min} mg/kg`
                      : `${entry.doseRangeMgKg.min}-${entry.doseRangeMgKg.max} mg/kg`}
                  </td>
                  <td>
                    <input
                      className="dose-inline-input"
                      type="number"
                      min={entry.doseRangeMgKg.min}
                      max={entry.doseRangeMgKg.max}
                      step="0.01"
                      value={selectedDose}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (!Number.isNaN(value)) {
                          setDoseOverrides((current) => ({ ...current, [entry.id]: value }));
                        }
                      }}
                    />
                  </td>
                  <td>{totalMg !== null ? `${totalMg.toFixed(2)} mg` : '--'}</td>
                  <td>{entry.concentration[lang]}</td>
                  <td>
                    {mlValue !== null
                      ? `${mlValue.toFixed(2)} mL`
                      : tabletValue !== null
                        ? `${tabletValue.toFixed(2)} ${t.tabletUnits}`
                        : '--'}
                  </td>
                  <td>
                    <button className="secondary-button" type="button" onClick={() => onOpenKnowledge(entry)}>
                      {t.openKnowledgeRecord}
                    </button>
                  </td>
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
