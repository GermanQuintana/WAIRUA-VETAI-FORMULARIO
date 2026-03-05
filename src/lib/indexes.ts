import { TherapeuticEntry } from '../types';

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

export const getSpeciesOptions = (entries: TherapeuticEntry[]) =>
  uniqueSorted(entries.flatMap((entry) => entry.species));

export const getSystemOptions = (entries: TherapeuticEntry[]) =>
  uniqueSorted(entries.flatMap((entry) => entry.systems));

export const getIndicationOptions = (entries: TherapeuticEntry[]) =>
  uniqueSorted(entries.flatMap((entry) => entry.pathologies));

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
