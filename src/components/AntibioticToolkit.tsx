import { useState } from 'react';
import { Language } from '../i18n';
import { antibioticCoverage, antibioticCombinations, antibioticSources, amegGroups, Coverage } from '../data/antibioticCoverage';
import './antibiotic-toolkit.css';

const coverageLabels = {
  good: { es: 'Actividad habitual en cepas sensibles', en: 'Usual activity in susceptible strains', symbol: '+++' },
  variable: { es: 'Actividad variable o limitada', en: 'Variable or limited activity', symbol: '+' },
  poor: { es: 'Sin cobertura clínica fiable', en: 'No reliable clinical coverage', symbol: '0' },
};
function Activity({ value, lang }: { value: Coverage; lang: Language }) {
  const item = coverageLabels[value];
  return <span className={`abx-activity abx-${value}`} title={item[lang]} aria-label={item[lang]}>{item.symbol}</span>;
}
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function AntibioticToolkit({ lang }: { lang: Language }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const es = lang === 'es';
  const headings = es ? ['Grupo y ejemplos', 'AMEG', 'Aerobios Gram+¹', 'Staphylococcus', 'Aerobios Gram−²', 'Pseudomonas', 'Anaerobios estrictos', 'Otros objetivos y límites'] : ['Group and examples', 'AMEG', 'Gram+ aerobes¹', 'Staphylococcus', 'Gram− aerobes²', 'Pseudomonas', 'Strict anaerobes', 'Other targets and limits'];
  const rows = antibioticCoverage.filter((row) => (!category || row.ameg === category) && normalize([row.group[lang], row.examples[lang], row.note[lang]].join(' ')).includes(normalize(query.trim())));
  return <section className="toolkit-utility antibiotic-toolkit">
    <div className="toolkit-utility-header"><div>
      <p className="section-kicker">{es ? 'Perros y gatos · uso prudente' : 'Dogs and cats · prudent use'}</p>
      <h3>{es ? 'Antibióticos: cobertura y grupos' : 'Antibiotics: coverage and groups'}</h3>
      <p>{es ? 'Compara el espectro orientativo, la categoría AMEG y las limitaciones de las familias más utilizadas.' : 'Compare indicative spectrum, AMEG category and limitations of commonly used antibiotic groups.'}</p>
    </div></div>
    <nav className="abx-section-nav" aria-label={es ? 'Secciones de antibióticos' : 'Antibiotic sections'}>
      <a href="#abx-spectrum">{es ? 'Cobertura' : 'Coverage'}</a><a href="#abx-groups">{es ? 'Clasificación AMEG' : 'AMEG classification'}</a><a href="#abx-combinations">{es ? 'Combinaciones' : 'Combinations'}</a><a href="#abx-sources">{es ? 'Fuentes' : 'Sources'}</a>
    </nav>
    <p className="abx-caution">{es ? 'Matriz cualitativa para perros y gatos, no un antibiograma: la actividad depende de la molécula, patógeno, foco, exposición y resistencia local. Elegir el espectro más estrecho eficaz; obtener cultivo cuando esté indicado. AMEG expresa prioridad de uso, no eficacia ni autorización.' : 'Qualitative matrix for dogs and cats, not an antibiogram: activity depends on the agent, pathogen, site, exposure and local resistance. Choose the narrowest effective spectrum; obtain culture when indicated. AMEG expresses stewardship priority, not efficacy or authorisation.'}</p>
    <section id="abx-spectrum" className="abx-section">
      <h4>{es ? 'Tabla de cobertura' : 'Coverage table'}</h4>
      <div className="abx-filters">
        <label>{es ? 'Buscar grupo, fármaco o microorganismo' : 'Search group, drug or organism'}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={es ? 'Ej.: doxiciclina, anaerobios…' : 'E.g. doxycycline, anaerobes…'} /></label>
        <label>{es ? 'Categoría AMEG' : 'AMEG category'}<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">{es ? 'Todas' : 'All'}</option>{amegGroups.map((group) => <option key={group.category} value={group.category}>{group.category} · {group.title[lang]}</option>)}</select></label>
      </div>
      <div className="abx-legend">{(Object.keys(coverageLabels) as Coverage[]).map((key) => <span key={key}><Activity value={key} lang={lang} />{coverageLabels[key][lang]}</span>)}</div>
      <p className="abx-help">{es ? '¹ Excluye Staphylococcus (columna propia). ² Excluye Pseudomonas. +++ no significa sensibilidad de todas las cepas. Desliza la tabla para comparar todas las columnas.' : '¹ Excludes Staphylococcus (separate column). ² Excludes Pseudomonas. +++ does not imply susceptibility of all strains. Scroll the table to compare all columns.'}</p>
      <p className="abx-help abx-row-count"><strong>{rows.length} / {antibioticCoverage.length} {es ? 'grupos y perfiles' : 'groups and profiles'}</strong> · {es ? 'Todas las filas están desplegadas; consulta las excepciones por molécula.' : 'All rows are expanded; check agent-specific exceptions.'}</p>
      <div className="abx-table-shell" tabIndex={0} role="region" aria-label={es ? 'Cobertura antibiótica, tabla desplazable' : 'Antibiotic coverage, scrollable table'}>
        <table className="abx-table"><caption>{es ? 'Actividad orientativa por familia y grupo bacteriano' : 'Indicative activity by antibiotic and bacterial group'}</caption><thead><tr>{headings.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><th scope="row"><strong>{row.group[lang]}</strong><small>{row.examples[lang]}</small></th><td><span className={`abx-ameg abx-ameg-${row.ameg.toLowerCase()}`}>{row.ameg}</span></td>{row.coverage.map((value, i) => <td key={i}><Activity value={value} lang={lang} /></td>)}<td className="abx-notes">{row.note[lang]} <a href={antibioticSources[row.source].url} target="_blank" rel="noopener noreferrer" aria-label={`${es ? 'Fuente' : 'Source'}: ${row.group[lang]}`}>↗</a></td></tr>)}
        </tbody></table>
      </div>
      <p role="status" className="abx-help">{rows.length} {es ? 'grupos mostrados' : 'groups shown'}{rows.length === 0 ? (es ? ' · No hay coincidencias. Cambia los filtros.' : ' · No matches. Change the filters.') : ''}</p>
    </section>
    <aside className="abx-caution" aria-label={es ? 'Rifampicina: restricciones de uso' : 'Rifampicin: use restrictions'}><strong>{es ? 'Rifampicina · AMEG A (evitar)' : 'Rifampicin · AMEG A (avoid)'}</strong><p>{es ? 'La fila describe actividad farmacológica; no es una opción empírica de ampliación de espectro. En uso en cascada, el Reglamento (UE) 2024/1973, aplicable desde el 8 de agosto de 2026, limita las rifamicinas excepto rifaximina al tratamiento de animales individuales con micobacterias o estafilococos multirresistentes, en combinación con otro antimicrobiano probablemente eficaz. Exige identificación y sensibilidad previas cuando sea posible, y justificar que las alternativas preferibles no serían eficaces. Revisar función hepática e interacciones.' : 'The row describes pharmacological activity; it is not an empirical spectrum-broadening option. For cascade use, Regulation (EU) 2024/1973, applicable from 8 August 2026, restricts rifamycins except rifaximin to individual animals with mycobacteria or multidrug-resistant staphylococci, in combination with another antimicrobial likely to be effective. Prior identification and susceptibility testing are required where possible, with justification that preferable alternatives would not be effective. Review liver function and interactions.'}</p><a href={antibioticSources.cascade.url} target="_blank" rel="noopener noreferrer">{es ? 'Consultar condiciones oficiales' : 'Read official conditions'} ↗</a></aside>
    <section id="abx-groups" className="abx-section"><h4>{es ? 'Clasificación AMEG por grupos' : 'AMEG classification by group'}</h4><p>{es ? 'EMA · referencia actualizada en 2025. Confirmar siempre la molécula concreta y las restricciones legales aplicables.' : 'EMA · reference updated in 2025. Always verify the specific agent and applicable legal restrictions.'}</p>
      <dl className="abx-group-list">{amegGroups.map((group) => <div key={group.category}><dt><span className={`abx-ameg abx-ameg-${group.category.toLowerCase()}`}>{group.category}</span>{group.title[lang]}</dt><dd><p>{group.text[lang]}</p><small>{group.examples[lang]}</small></dd></div>)}</dl>
    </section>
    <section id="abx-combinations" className="abx-section"><h4>{es ? 'Combinaciones para ampliar el espectro' : 'Combinations to broaden coverage'}</h4><p>{es ? 'Opciones de contexto, no pautas automáticas. Evidencia: guía de consenso ISCAID para neumonía y farmacología para betalactámico + aminoglucósido. No se demuestra superioridad para cualquier infección. Tomar muestras, controlar el foco y desescalar con el resultado.' : 'Context-specific options, not automatic regimens. Evidence: ISCAID consensus for pneumonia and pharmacology for beta-lactam + aminoglycoside. Superiority is not established for every infection. Collect samples, control the source and de-escalate with results.'}</p>
      <div className="abx-combinations">{antibioticCombinations.map((item) => <article key={item.ameg}><div className="abx-combination-title"><h5>{item.drugs[lang]}</h5><span>AMEG {item.ameg}</span></div><dl><div><dt>{es ? 'Qué añade' : 'Added coverage'}</dt><dd>{item.benefit[lang]}</dd></div><div><dt>{es ? 'Cuándo valorar' : 'When to consider'}</dt><dd>{item.context[lang]}</dd></div><div><dt>{es ? 'Límites y precauciones' : 'Limits and cautions'}</dt><dd>{item.limit[lang]}</dd></div></dl><a href={antibioticSources[item.source].url} target="_blank" rel="noopener noreferrer">{es ? 'Consultar fuente' : 'View source'} ↗</a></article>)}</div>
      <p className="abx-caution">{es ? 'Evitar duplicación innecesaria de anaerobios (p. ej., amoxicilina/clavulánico + metronidazol) y doble betalactámico sin indicación específica. La suma de espectros no garantiza sinergia. Confirmar especie, ficha técnica, contraindicaciones, dosis y uso en cascada cuando proceda.' : 'Avoid unnecessary duplicate anaerobic coverage (e.g. amoxicillin/clavulanate + metronidazole) and dual beta-lactams without a specific indication. Adding spectra does not guarantee synergy. Verify species, product information, contraindications, dosing and cascade use where applicable.'}</p>
    </section>
    <section id="abx-sources" className="abx-section"><h4>{es ? 'Fuentes y alcance' : 'Sources and scope'}</h4><p>{es ? 'Síntesis editorial cualitativa · revisión 29/10/2026. AMEG: fuente oficial EMA. Cobertura: capítulos de farmacología revisados por expertos (MSD). Combinaciones: consenso ISCAID y farmacología. No sustituye ficha técnica ni decisión veterinaria.' : 'Qualitative editorial synthesis · reviewed 29 Oct 2026. AMEG: official EMA source. Coverage: peer-reviewed pharmacology chapters (MSD). Combinations: ISCAID consensus and pharmacology. Does not replace product information or veterinary judgement.'}</p><ul className="abx-sources">{Object.values(antibioticSources).map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
  </section>;
}
