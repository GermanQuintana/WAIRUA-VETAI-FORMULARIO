import { canonicalTagOptions } from '../data/taxonomy';
import { spreadsheetDoseEntries } from '../data/spreadsheetDoseTable';
import { DoseCalculatorEntry, Species, TherapeuticEntry } from '../types';
import { excludeEquivalentValues, normalizeStringList } from './entryNormalization';

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
const normalizeDoseSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const buildDoseRangeKey = (entry: DoseCalculatorEntry) => {
  if (hasFiniteDose(entry)) {
    return `${entry.doseRangeMgKg.min}-${entry.doseRangeMgKg.max}`;
  }

  return normalizeDoseSearch(entry.doseText ?? '');
};

const buildDoseEntryKey = (entry: DoseCalculatorEntry) =>
  [
    normalizeDoseSearch(entry.activeIngredient),
    normalizeDoseSearch([...entry.species].sort().join('/')),
    normalizeDoseSearch(entry.route),
    normalizeDoseSearch(entry.indication.es),
    buildDoseRangeKey(entry),
    normalizeDoseSearch(entry.doseUnit ?? 'mg/kg'),
  ].join('|');

const hasFiniteDose = (entry: DoseCalculatorEntry) =>
  Number.isFinite(entry.doseRangeMgKg.min) &&
  Number.isFinite(entry.doseRangeMgKg.max) &&
  Number.isFinite(entry.defaultDoseMgKg);

export const getSpeciesOptions = (entries: TherapeuticEntry[]) =>
  uniqueSorted(entries.flatMap((entry) => entry.species)) as Species[];

export const getSystemOptions = (entries: TherapeuticEntry[]) =>
  normalizeStringList(entries.flatMap((entry) => entry.systems), Array.from(canonicalTagOptions)).sort((a, b) => a.localeCompare(b));

export const getIndicationOptions = (entries: TherapeuticEntry[]) =>
  normalizeStringList(entries.flatMap((entry) => entry.pathologies)).sort((a, b) => a.localeCompare(b));

export const getTagOptions = (entries: TherapeuticEntry[]) =>
  normalizeStringList(
    [...canonicalTagOptions, ...entries.flatMap((entry) => excludeEquivalentValues(entry.tags, entry.systems))],
    Array.from(canonicalTagOptions),
  ).sort((a, b) => a.localeCompare(b));

export const buildDoseCalculatorEntries = (entries: TherapeuticEntry[]): DoseCalculatorEntry[] => {
  const editorialEntries: DoseCalculatorEntry[] = entries.flatMap((entry) =>
    (entry.calculatorPresets ?? []).map((preset) => ({
      ...preset,
      activeIngredient: entry.activeIngredient,
      linkedEntryId: entry.id,
      publicationStatus: entry.publicationStatus,
      reviewSummary: entry.reviewSummary,
    })),
  );

  const editorialEntryMap = new Map(editorialEntries.map((entry) => [buildDoseEntryKey(entry), entry]));

  const mergedSpreadsheetEntries = spreadsheetDoseEntries.map((spreadsheetEntry) => {
    const matchedEditorialEntry = editorialEntryMap.get(buildDoseEntryKey(spreadsheetEntry));
    if (!matchedEditorialEntry) return spreadsheetEntry;

    return {
      ...matchedEditorialEntry,
      category: spreadsheetEntry.category.es ? spreadsheetEntry.category : matchedEditorialEntry.category,
      subcategory: spreadsheetEntry.subcategory ?? matchedEditorialEntry.subcategory,
      antibioticCategory: spreadsheetEntry.antibioticCategory ?? matchedEditorialEntry.antibioticCategory,
      species: spreadsheetEntry.species.length > 0 ? spreadsheetEntry.species : matchedEditorialEntry.species,
      speciesLabel: spreadsheetEntry.speciesLabel ?? matchedEditorialEntry.speciesLabel,
      route: spreadsheetEntry.route || matchedEditorialEntry.route,
      indication: spreadsheetEntry.indication.es ? spreadsheetEntry.indication : matchedEditorialEntry.indication,
      doseRangeMgKg: hasFiniteDose(spreadsheetEntry) ? spreadsheetEntry.doseRangeMgKg : matchedEditorialEntry.doseRangeMgKg,
      defaultDoseMgKg: Number.isFinite(spreadsheetEntry.defaultDoseMgKg)
        ? spreadsheetEntry.defaultDoseMgKg
        : matchedEditorialEntry.defaultDoseMgKg,
      doseText: spreadsheetEntry.doseText || matchedEditorialEntry.doseText,
      doseUnit: spreadsheetEntry.doseUnit || matchedEditorialEntry.doseUnit,
      frequency: spreadsheetEntry.frequency ?? matchedEditorialEntry.frequency,
      duration: spreadsheetEntry.duration ?? matchedEditorialEntry.duration,
      observations: spreadsheetEntry.observations ?? matchedEditorialEntry.observations,
      bibliography: spreadsheetEntry.bibliography ?? matchedEditorialEntry.bibliography,
    };
  });

  const spreadsheetKeys = new Set(mergedSpreadsheetEntries.map(buildDoseEntryKey));
  const remainingEditorialEntries = editorialEntries.filter((entry) => !spreadsheetKeys.has(buildDoseEntryKey(entry)));

  return [...mergedSpreadsheetEntries, ...remainingEditorialEntries].sort((left, right) => {
    const ingredientComparison = left.activeIngredient.localeCompare(right.activeIngredient);
    if (ingredientComparison !== 0) return ingredientComparison;

    const speciesComparison = (left.speciesLabel ?? left.species.join(', ')).localeCompare(
      right.speciesLabel ?? right.species.join(', '),
    );
    if (speciesComparison !== 0) return speciesComparison;

    return left.indication.es.localeCompare(right.indication.es);
  });
};

export const byAlphabeticalKey = (entries: TherapeuticEntry[], key: keyof TherapeuticEntry) =>
  [...entries].sort((a, b) => String(a[key]).localeCompare(String(b[key])));

export const buildGroupedIndex = (entries: TherapeuticEntry[], field: 'systems' | 'pathologies' | 'tradeNames') => {
  const groupMap = new Map<string, TherapeuticEntry[]>();

  entries.forEach((entry) => {
    entry[field].forEach((value) => {
      if (!groupMap.has(value)) groupMap.set(value, []);
      groupMap.get(value)!.push(entry);
    });
  });

  return Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupedEntries]) => ({
      label,
      entries: groupedEntries.sort((a, b) => a.activeIngredient.localeCompare(b.activeIngredient)),
    }));
};
