import { expandMedicalTermAliases } from './terms';

const compactWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ');

export const normalizeComparableText = (value: string) =>
  compactWhitespace(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getEquivalenceKeys = (value: string) => {
  const trimmed = compactWhitespace(value);
  if (!trimmed) return [];

  return Array.from(new Set([trimmed, ...expandMedicalTermAliases(trimmed)].map(normalizeComparableText).filter(Boolean)));
};

export const areEquivalentValues = (left: string, right: string) => {
  const leftKeys = new Set(getEquivalenceKeys(left));
  return getEquivalenceKeys(right).some((key) => leftKeys.has(key));
};

export const buildCanonicalValueMap = (options: string[]) => {
  const canonicalMap = new Map<string, string>();

  options.forEach((option) => {
    const trimmed = compactWhitespace(option);
    if (!trimmed) return;

    getEquivalenceKeys(trimmed).forEach((key) => {
      if (!canonicalMap.has(key)) canonicalMap.set(key, trimmed);
    });
  });

  return canonicalMap;
};

export const normalizeStringList = (values: string[], canonicalOptions: string[] = []) => {
  const canonicalMap = buildCanonicalValueMap(canonicalOptions);
  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    const trimmed = compactWhitespace(value);
    if (!trimmed) return;

    const canonical =
      getEquivalenceKeys(trimmed).map((key) => canonicalMap.get(key)).find(Boolean) ??
      trimmed;
    const dedupeKey = normalizeComparableText(canonical);
    if (!dedupeKey || seen.has(dedupeKey)) return;

    seen.add(dedupeKey);
    normalized.push(canonical);
  });

  return normalized;
};

export const excludeEquivalentValues = (values: string[], excluded: string[]) =>
  values.filter((value) => !excluded.some((candidate) => areEquivalentValues(value, candidate)));
