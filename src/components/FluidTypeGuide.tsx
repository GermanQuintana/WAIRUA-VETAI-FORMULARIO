import { useState } from 'react';
import { Language } from '../i18n';
import { FLUID_GUIDE, FLUID_SOURCES } from '../data/fluidGuide';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const englishSources: Record<string, string> = {
  [FLUID_SOURCES.replacement]: 'AAHA · replacement, maintenance, and routes',
  [FLUID_SOURCES.anesthesia]: 'AAHA · anesthesia',
  [FLUID_SOURCES.illness]: 'AAHA · ill patients and electrolytes',
  [FLUID_SOURCES.colloids]: 'AAHA · colloid controversies',
};
export default function FluidTypeGuide({ lang, companionSpecies }: { lang: Language; companionSpecies: boolean }) {
  const es = lang === 'es';
  const [query, setQuery] = useState('');
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const entries = FLUID_GUIDE.filter((item) => tokens.every((token) => normalize([item.title[lang], item.examples[lang], item.purpose[lang], item.uses[lang], item.precautions[lang], item.monitor[lang]].join(' ')).includes(token)));
  return <section className="fluid-guide">
    <header className="fluid-section-heading"><div><h4>{es ? 'Tipos de fluidos y usos' : 'Fluid types and uses'}</h4><p>{es ? 'Selecciona por objetivo, composición y estado del paciente.' : 'Select by goal, composition, and patient status.'}</p></div><span className="fluid-scope">{es ? 'Perros y gatos · AAHA 2024' : 'Dogs and cats · AAHA 2024'}</span></header>
    {!companionSpecies && <p className="fluid-notice">{es ? 'Esta guía se refiere a perros y gatos. No extrapolar indicaciones ni pautas a conejo, caballo o bovino; utiliza las referencias de la especie.' : 'This guide applies to dogs and cats. Do not extrapolate indications or regimens to rabbits, horses, or cattle; use species-specific references.'}</p>}
    <label className="fluid-guide-search">{es ? 'Buscar fluido o uso' : 'Search fluid or use'}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={es ? 'Balanceado, sodio, glucosa, shock…' : 'Balanced, sodium, glucose, shock…'} /></label>
    <p className="fluid-muted" aria-live="polite">{entries.length} {es ? (entries.length === 1 ? 'tipo / vía' : 'tipos y vías') : (entries.length === 1 ? 'type / route' : 'types and routes')}</p>
    <div className="fluid-guide-list">{entries.map((item) => <details key={item.id} className={`fluid-disclosure fluid-tone-${item.tone}`}>
      <summary><span className="fluid-guide-mark" aria-hidden="true">{item.id === 'routes' ? '→' : '◇'}</span><span><strong>{item.title[lang]}</strong><small>{item.examples[lang]}</small></span><span className="fluid-purpose-tag">{item.purpose[lang]}</span></summary>
      <div className="fluid-disclosure-body"><dl className="fluid-guide-detail"><div><dt>{es ? 'Cuándo considerarlo' : 'When to consider it'}</dt><dd>{item.uses[lang]}</dd></div><div className="fluid-guide-caution"><dt>{es ? 'Precauciones y límites' : 'Precautions and limitations'}</dt><dd>{item.precautions[lang]}</dd></div><div><dt>{es ? 'Qué monitorizar' : 'What to monitor'}</dt><dd>{item.monitor[lang]}</dd></div></dl><footer className="fluid-evidence"><p>{item.evidence[lang]}</p><ul>{item.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{es ? source.label : englishSources[source.url] ?? source.label} ↗</a></li>)}</ul></footer></div>
    </details>)}</div>
    {!entries.length && <p>{es ? 'No hay tipos de fluido para esta búsqueda.' : 'No fluid types match this search.'}</p>}
  </section>;
}
