import { useEffect, useMemo, useState } from 'react';
import { labels, Language } from '../i18n';
import { translateEvidenceLevel, translateMedicalTerms } from '../lib/terms';
import { buildCimavetListUrl, buildCimavetRecordUrl, resolveCimavetBaseUrl } from '../services/cimavet';
import { TherapeuticEntry } from '../types';

interface Props {
  entry: TherapeuticEntry;
  lang: Language;
}

const CIMAVET_API_BASE = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);

export default function EntryCard({ entry, lang }: Props) {
  const t = labels[lang];
  const [resolvedCimavetUrl, setResolvedCimavetUrl] = useState<string | null>(entry.cimavet?.url ?? null);
  const [isResolvingCimavet, setIsResolvingCimavet] = useState(false);
  const validatedReferences = useMemo(() => entry.references.filter((reference) => Boolean(reference.url)), [entry.references]);

  const speciesLabel = useMemo(() => translateMedicalTerms(entry.species, lang).join(', '), [entry.species, lang]);
  const systemsLabel = useMemo(() => translateMedicalTerms(entry.systems, lang).join(', '), [entry.systems, lang]);
  const pathologiesLabel = useMemo(
    () => translateMedicalTerms(entry.pathologies, lang).join(', '),
    [entry.pathologies, lang],
  );

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      if (entry.cimavet?.url) {
        setResolvedCimavetUrl(entry.cimavet.url);
        return;
      }

      if (entry.cimavet?.nregistro) {
        setResolvedCimavetUrl(buildCimavetRecordUrl(CIMAVET_API_BASE, entry.cimavet.nregistro));
        return;
      }

      const query = entry.cimavet?.nameQuery ?? entry.tradeNames[0] ?? entry.activeIngredient;
      if (!query) return;

      setIsResolvingCimavet(true);
      try {
        const response = await fetch(
          buildCimavetListUrl(CIMAVET_API_BASE, {
            pagina: '1',
            tamanioPagina: '25',
            nombre: query,
          }),
        );
        if (!response.ok) return;

        const data = (await response.json()) as {
          resultados?: Array<{ nregistro: string; nombre: string }>;
        };

        const bestMatch = data.resultados?.[0];
        if (isMounted && bestMatch?.nregistro) {
          setResolvedCimavetUrl(buildCimavetRecordUrl(CIMAVET_API_BASE, bestMatch.nregistro));
        }
      } catch {
        // Optional enhancement: failing CIMAVet lookup should never break card rendering.
      } finally {
        if (isMounted) setIsResolvingCimavet(false);
      }
    };

    resolve();

    return () => {
      isMounted = false;
    };
  }, [entry.activeIngredient, entry.cimavet?.nameQuery, entry.cimavet?.nregistro, entry.cimavet?.url, entry.tradeNames]);

  return (
    <article className="entry-card">
      <h3>{entry.activeIngredient}</h3>
      <p>
        <strong>{t.tradeNames}:</strong> {entry.tradeNames.join(', ')}
      </p>
      <p>
        <strong>{t.species}:</strong> {speciesLabel}
      </p>
      <p>
        <strong>{t.systems}:</strong> {systemsLabel}
      </p>
      <p>
        <strong>{t.pathologies}:</strong> {pathologiesLabel}
      </p>
      <p>
        <strong>{t.indications}:</strong> {entry.indications[lang]}
      </p>
      <p className="multiline-text">
        <strong>{t.dosage}:</strong> {entry.dosage[lang]}
      </p>
      <p>
        <strong>{t.contraindications}:</strong> {entry.contraindications[lang]}
      </p>
      {entry.notes && (
        <p>
          <strong>{t.notes}:</strong> {entry.notes[lang]}
        </p>
      )}
      <p>
        <strong>{t.evidence}:</strong> {translateEvidenceLevel(entry.evidenceLevel, lang)}
      </p>

      {(resolvedCimavetUrl || isResolvingCimavet) && (
        <p className="record-link">
          <strong>{t.sourceLinks}:</strong>{' '}
          {resolvedCimavetUrl ? (
            <a className="cimavet-link" href={resolvedCimavetUrl} target="_blank" rel="noreferrer">
              {t.cimavetLink}
            </a>
          ) : (
            <span>{t.resolvingCimavet}</span>
          )}
        </p>
      )}

      <div className="reference-list">
        <strong>{t.references}:</strong>
        <p className="reference-note">{t.validatedReferencesOnly}</p>
        {validatedReferences.length > 0 ? (
          <ul>
            {validatedReferences.map((reference) => (
              <li key={reference.id}>
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
