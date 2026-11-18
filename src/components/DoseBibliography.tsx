import type { Language } from '../i18n';

const contextPrefix = /^Contexto clínico \/ clinical context \(no valida todas las indicaciones ni la dosis exacta\):\s*/i;
const contextOrganisation = /^(ENOVAT\/WSAVA|ISCAID|ACVIM|ABCD|World Association for Veterinary Dermatology|ESCCAP|EMA|CDC)\b/;

function parseCitation(line: string, lang: Language) {
  const contextual = contextPrefix.test(line);
  const citation = line.replace(contextPrefix, '');
  const url = citation.match(/https?:\/\/[^\s<>"']+/i)?.[0].replace(/[.,;]+$/, '');
  const title = (url ? citation.replace(url, '').trim().replace(/[·:;,\s]+$/, '') : citation).trim();
  const year = title.match(/\b(?:19|20)\d{2}\b/)?.[0];
  const organisation = contextual ? title.match(contextOrganisation)?.[0] : undefined;
  const short = title.includes(' — ') ? title.split(' — ', 1)[0] : undefined;
  const fallback = lang === 'es' ? 'Abrir fuente' : 'Open source';
  const fullLabel = title || fallback;
  const shortenedTitle = title.length > 66 ? title.slice(0, 60).replace(/\s+\S*$/, '').trimEnd() : undefined;
  const label = short || (organisation && year ? `${organisation} (${year})` : undefined) ||
    (shortenedTitle ? `${shortenedTitle}…${year && !shortenedTitle.includes(year) ? ` (${year})` : ''}` : fullLabel);
  return { contextual, url, fullLabel, label };
}

export default function DoseBibliography({ value, lang }: { value?: string; lang: Language }) {
  const citations = (value ?? '').split(/\r?\n/).flatMap((line) =>
    line.replace(/(https?:\/\/[^\s;]+)\s*;\s*/gi, '$1\n').split('\n'))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseCitation(line, lang));

  if (!citations.length) return <span>--</span>;

  const es = lang === 'es';
  const hasContext = citations.some((citation) => citation.contextual);
  const hasShortLabels = citations.some(({ label, fullLabel }) => label !== fullLabel);

  const renderList = (full: boolean) => (
    <ul className="dose-citations">
      {citations.map(({ label, fullLabel, contextual, url }, index) => (
        <li key={index}>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" title={fullLabel}>
              {full ? fullLabel : label} <span aria-hidden="true">↗</span>
            </a>
          ) : (full ? fullLabel : label)}
          {contextual && <small>{es ? 'Contexto clínico' : 'Clinical context'}</small>}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="dose-bibliography">
      {renderList(false)}
      {hasContext && (
        <small className="dose-citation-scope">
          {es ? 'Las fuentes de contexto no validan todas las indicaciones ni la dosis exacta.'
            : 'Context sources do not validate every indication or the exact dose.'}
        </small>
      )}
      {hasShortLabels && (
        <details>
          <summary>{es ? 'Ver citas completas' : 'View full citations'}</summary>
          {renderList(true)}
        </details>
      )}
    </div>
  );
}
