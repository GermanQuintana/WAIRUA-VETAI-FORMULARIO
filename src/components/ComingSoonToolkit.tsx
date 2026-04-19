import { Language } from '../i18n';
import { LocalizedText } from '../types';

interface ComingSoonToolkitLane {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
}

interface ComingSoonToolkitProps {
  lang: Language;
  title: LocalizedText;
  subtitle: LocalizedText;
  statusNote: LocalizedText;
  scopeTitle: LocalizedText;
  scopeLabel: LocalizedText;
  species: LocalizedText[];
  lanesTitle: LocalizedText;
  lanes: ComingSoonToolkitLane[];
  footerNote: LocalizedText;
}

export default function ComingSoonToolkit({
  lang,
  title,
  subtitle,
  statusNote,
  scopeTitle,
  scopeLabel,
  species,
  lanesTitle,
  lanes,
  footerNote,
}: ComingSoonToolkitProps) {
  return (
    <section className="toolkit-utility coming-soon-toolkit">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">Toolkit</p>
          <h3>{title[lang]}</h3>
          <p>{subtitle[lang]}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{lang === 'es' ? 'Pronto' : 'Soon'}</strong>
          <p>{statusNote[lang]}</p>
        </div>
      </div>

      <section className="toolkit-reference-table">
        <div className="toolkit-reference-header">
          <h4>{scopeTitle[lang]}</h4>
          <span>{scopeLabel[lang]}</span>
        </div>
        <div className="coming-soon-species-grid">
          {species.map((item) => (
            <span key={item.es} className="coming-soon-species-chip">
              {item[lang]}
            </span>
          ))}
        </div>
      </section>

      <section className="embedded-section">
        <h3>{lanesTitle[lang]}</h3>
        <div className="feature-grid feature-grid-three-up">
          {lanes.map((lane) => (
            <article key={lane.id} className="feature-card feature-card-soon">
              <h3>{lane.title[lang]}</h3>
              <p>{lane.description[lang]}</p>
              <span className="status-pill status-pill-soon">{lang === 'es' ? 'Pronto' : 'Soon'}</span>
            </article>
          ))}
        </div>
      </section>

      <article className="toolkit-source-note">
        <strong>{lang === 'es' ? 'Estructura inicial' : 'Initial structure'}</strong>
        <p>{footerNote[lang]}</p>
      </article>
    </section>
  );
}
