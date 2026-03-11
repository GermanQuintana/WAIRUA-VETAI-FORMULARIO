import { useMemo } from 'react';
import { labels, Language } from '../i18n';
import { translateEditorialStatus, translateEvidenceLevel, translateMedicalTerm, translateMedicalTerms } from '../lib/terms';
import { TherapeuticEntry } from '../types';

interface Props {
  entry: TherapeuticEntry;
  lang: Language;
  onEdit?: (entry: TherapeuticEntry) => void;
  onDelete?: (entry: TherapeuticEntry) => void;
}

export default function EntryCard({ entry, lang, onEdit, onDelete }: Props) {
  const t = labels[lang];
  const validatedReferences = useMemo(() => {
    const aggregated = new Map<
      string,
      {
        id: string;
        title: string;
        authors: string;
        year: number;
        source: string;
        url?: string;
        context?: string;
      }
    >();

    entry.references
      .filter((reference) => Boolean(reference.url))
      .forEach((reference) => {
        aggregated.set(reference.url ?? reference.id, { ...reference });
      });

    (entry.calculatorPresets ?? []).forEach((preset) => {
      const context = `${translateMedicalTerm(preset.species[0] ?? '', lang)} | ${preset.indication[lang]}`;
      (preset.references ?? [])
        .filter((reference) => Boolean(reference.url))
        .forEach((reference) => {
          const key = `${reference.url ?? reference.id}-${context}`;
          aggregated.set(key, { ...reference, context });
        });
    });

    return Array.from(aggregated.values()).sort((left, right) => {
      if (right.year !== left.year) return right.year - left.year;
      return left.title.localeCompare(right.title);
    });
  }, [entry.calculatorPresets, entry.references, lang]);

  const speciesLabel = useMemo(() => translateMedicalTerms(entry.species, lang).join(', '), [entry.species, lang]);
  const pathologiesLabel = useMemo(
    () => translateMedicalTerms(entry.pathologies, lang).join(', '),
    [entry.pathologies, lang],
  );
  const tagsLabel = useMemo(
    () => translateMedicalTerms(Array.from(new Set([...entry.tags, ...entry.systems])), lang).join(', '),
    [entry.systems, entry.tags, lang],
  );
  const structuredDoseRows = useMemo(() => {
    return [...(entry.calculatorPresets ?? [])]
      .sort((left, right) => {
        const leftSpecies = translateMedicalTerm(left.species[0] ?? '', lang);
        const rightSpecies = translateMedicalTerm(right.species[0] ?? '', lang);
        return `${leftSpecies} ${left.indication[lang]}`.localeCompare(`${rightSpecies} ${right.indication[lang]}`);
      })
      .map((preset) => {
        const min = preset.doseRangeMgKg.min;
        const max = preset.doseRangeMgKg.max;
        const doseRange = min === max ? `${min} mg/kg` : `${min}-${max} mg/kg`;
        const concentration = preset.concentration[lang] || preset.concentration.es || preset.concentration.en;
        return {
          id: preset.id,
          species: translateMedicalTerm(preset.species[0] ?? '', lang),
          indication: preset.indication[lang],
          summary: `${doseRange} ${preset.route}`.trim(),
          concentration,
          referenceCount: preset.references?.filter((reference) => Boolean(reference.url)).length ?? 0,
        };
      });
  }, [entry.calculatorPresets, lang]);

  return (
    <article className="entry-card">
      <div className="entry-card-header">
        <div className="entry-card-title">
          <h3>{entry.activeIngredient}</h3>
          <span className={`editorial-status editorial-status-${entry.editorialStatus}`}>
            {translateEditorialStatus(entry.editorialStatus, lang)}
          </span>
        </div>
        {(onEdit || onDelete) && (
          <div className="entry-card-actions">
            {onEdit && (
              <button type="button" className="secondary-button entry-card-edit" onClick={() => onEdit(entry)}>
                {lang === 'es' ? 'Editar' : 'Edit'}
              </button>
            )}
            {onDelete && (
              <button type="button" className="secondary-button entry-card-delete" onClick={() => onDelete(entry)}>
                {t.deleteRecord}
              </button>
            )}
          </div>
        )}
      </div>
      <p>
        <strong>{t.species}:</strong> {speciesLabel}
      </p>
      <p>
        <strong>{t.pathologies}:</strong> {pathologiesLabel}
      </p>
      <p>
        <strong>{t.tagsLabel}:</strong> {tagsLabel}
      </p>
      <p>
        <strong>{t.concentrationsLabel}:</strong> {entry.concentrations.join(', ')}
      </p>
      <p>
        <strong>{t.indications}:</strong> {entry.indications[lang]}
      </p>
      <p className="multiline-text">
        <strong>{t.dosage}:</strong> {entry.dosage[lang]}
      </p>
      <p>
        <strong>{t.administrationConditions}:</strong> {entry.administrationConditions[lang]}
      </p>
      <p>
        <strong>{t.adverseEffects}:</strong> {entry.adverseEffects[lang]}
      </p>
      <p>
        <strong>{t.contraindications}:</strong> {entry.contraindications[lang]}
      </p>
      <p>
        <strong>{t.interactions}:</strong> {entry.interactions[lang]}
      </p>
      {structuredDoseRows.length > 0 && (
        <div className="entry-dose-summary">
          <strong>{t.doseBySpeciesIndication}:</strong>
          <ul>
            {structuredDoseRows.map((row) => (
              <li key={row.id}>
                <span>{row.species}</span>
                <span>{row.indication}</span>
                <span>{row.summary}</span>
                {row.concentration ? <span>{row.concentration}</span> : null}
                {row.referenceCount > 0 ? <span>{t.references}: {row.referenceCount}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {entry.notes && (
        <p>
          <strong>{t.notes}:</strong> {entry.notes[lang]}
        </p>
      )}
      <p>
        <strong>{t.evidence}:</strong> {translateEvidenceLevel(entry.evidenceLevel, lang)}
      </p>
      <p>
        <strong>{t.editorialStatus}:</strong> {translateEditorialStatus(entry.editorialStatus, lang)}
      </p>

      <div className="reference-list">
        <strong>{t.references}:</strong>
        <p className="reference-note">{t.validatedReferencesOnly}</p>
        {validatedReferences.length > 0 ? (
          <ul>
            {validatedReferences.map((reference) => (
              <li key={reference.id}>
                {reference.context ? `${reference.context}. ` : ''}
                {reference.authors} ({reference.year}). {reference.title}. {reference.source}{' '}
                <a href={reference.url} target="_blank" rel="noreferrer">
                  DOI/URL
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t.noValidatedReferences}</p>
        )}
      </div>
      <p className="updated-at">
        {t.updated}: {entry.lastUpdated}
      </p>
    </article>
  );
}
