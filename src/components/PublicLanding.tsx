import { useState } from 'react';
import publicHero from '../assets/wairua-public-hero.jpg';
import { Language } from '../i18n';
import LegalCompliance from './LegalCompliance';
import ThemeIcon from './ThemeIcon';

const wairuaMark = '/favicon-wairua-128.png';
const contactEmail = 'gerqd79@gmail.com';

type PublicLandingProps = {
  lang: Language;
  theme: 'light' | 'dark';
  onChangeLanguage: (lang: Language) => void;
  onToggleTheme: () => void;
  onEnter: () => void;
};

const copy = {
  es: {
    nav: ['Qué resuelve', 'Cómo funciona', 'Herramientas'],
    login: 'Entrar',
    eyebrow: 'Decisiones clínicas con mejor contexto',
    title: 'La consulta veterinaria, más clara y más rápida.',
    lead:
      'Medicamentos oficiales, cálculos clínicos y conocimiento terapéutico reunidos en un único espacio de trabajo.',
    primary: 'Conocer WAIRUA',
    secondary: 'Iniciar sesión',
    trust: 'Fuentes oficiales y herramientas para la práctica diaria',
    sources: ['CIMAVET', 'CIMA', 'AEMPS'],
    problemKicker: 'Una herramienta, menos fricción',
    problemTitle: 'De la pregunta clínica a una respuesta útil sin saltar entre pestañas.',
    problemBody:
      'WAIRUA VetAI organiza la información que necesitas durante la consulta para que puedas buscar, calcular y contrastar con menos interrupciones.',
    benefits: [
      ['Buscar', 'Localiza medicamentos veterinarios y humanos por principio activo, especie, indicación o presentación.'],
      ['Calcular', 'Resuelve dosis, infusiones, fluidoterapia, superficie corporal y conversiones desde el mismo entorno.'],
      ['Contrastar', 'Consulta fichas oficiales, tiempos de espera, interacciones y referencias clínicas con su contexto.'],
    ],
    workflowKicker: 'Así se utiliza',
    workflowTitle: 'Pensada para acompañar el razonamiento clínico.',
    workflow: [
      ['01', 'Define el contexto', 'Empieza por el paciente, la especie, la indicación o el principio activo.'],
      ['02', 'Filtra lo relevante', 'Reduce resultados con criterios clínicos y accede al detalle sin perder la búsqueda.'],
      ['03', 'Actúa con contexto', 'Calcula, compara y abre la fuente regulatoria cuando necesites confirmar.'],
    ],
    toolkitKicker: 'Espacio clínico conectado',
    toolkitTitle: 'Todo lo esencial, organizado por tarea.',
    toolkitBody:
      'La navegación separa medicamentos, conocimiento terapéutico, productos sin receta y herramientas clínicas. Siempre sabes dónde estás y qué puedes hacer después.',
    toolkitItems: ['Dosis e infusión', 'Anestesia', 'Fluidoterapia', 'Nutrición clínica', 'Constantes', 'Gestión'],
    finalKicker: 'Empieza cuando quieras',
    finalTitle: 'Conoce la herramienta por dentro.',
    finalBody: 'Crea tu acceso o entra con tu cuenta para abrir el espacio clínico completo.',
    finalAction: 'Acceder a WAIRUA',
    footer: 'WAIRUA Veterinary Precision Medicine',
  },
  en: {
    nav: ['What it solves', 'How it works', 'Tools'],
    login: 'Sign in',
    eyebrow: 'Clinical decisions with better context',
    title: 'Veterinary reference, clearer and faster.',
    lead: 'Official medicines, clinical calculators, and therapeutic knowledge in one focused workspace.',
    primary: 'Discover WAIRUA',
    secondary: 'Sign in',
    trust: 'Official sources and tools for everyday practice',
    sources: ['CIMAVET', 'CIMA', 'AEMPS'],
    problemKicker: 'One tool, less friction',
    problemTitle: 'From a clinical question to a useful answer without jumping between tabs.',
    problemBody:
      'WAIRUA VetAI organizes the information you need during a consultation so you can search, calculate, and verify with fewer interruptions.',
    benefits: [
      ['Search', 'Find veterinary and human medicines by active ingredient, species, indication, or presentation.'],
      ['Calculate', 'Solve doses, infusions, fluids, body surface area, and conversions in the same environment.'],
      ['Verify', 'Review official records, withdrawal times, interactions, and clinical references in context.'],
    ],
    workflowKicker: 'How it works',
    workflowTitle: 'Designed to support clinical reasoning.',
    workflow: [
      ['01', 'Set the context', 'Start with the patient, species, indication, or active ingredient.'],
      ['02', 'Filter what matters', 'Narrow results with clinical criteria and open details without losing your search.'],
      ['03', 'Act with context', 'Calculate, compare, and open the regulatory source whenever you need confirmation.'],
    ],
    toolkitKicker: 'A connected clinical workspace',
    toolkitTitle: 'Everything essential, organized by task.',
    toolkitBody:
      'Navigation separates medicines, therapeutic knowledge, OTC products, and clinical tools. You always know where you are and what to do next.',
    toolkitItems: ['Dose & infusion', 'Anesthesia', 'Fluid therapy', 'Clinical nutrition', 'Vitals', 'Management'],
    finalKicker: 'Start when you are ready',
    finalTitle: 'See the complete workspace.',
    finalBody: 'Create your access or sign in to open the full clinical application.',
    finalAction: 'Access WAIRUA',
    footer: 'WAIRUA Veterinary Precision Medicine',
  },
} as const;

export default function PublicLanding({
  lang,
  theme,
  onChangeLanguage,
  onToggleTheme,
  onEnter,
}: PublicLandingProps) {
  const c = copy[lang];
  const [activeSlide, setActiveSlide] = useState(0);

  const openSlide = (index: number, shouldScroll = true) => {
    setActiveSlide(index);
    if (shouldScroll) {
      window.requestAnimationFrame(() =>
        document.getElementById('presentacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  };

  return (
    <div className={`public-landing ${theme}`}>
      <header className="public-nav">
        <a className="public-brand" href="#inicio" aria-label="WAIRUA VetAI">
          <img src={wairuaMark} alt="" />
          <span><strong>WAIRUA</strong><small>VetAI</small></span>
        </a>
        <nav aria-label={lang === 'es' ? 'Presentación' : 'Introduction'}>
          {c.nav.map((label, index) => (
            <button type="button" className={activeSlide === index ? 'active' : ''} onClick={() => openSlide(index)} key={label}>
              {label}
            </button>
          ))}
        </nav>
        <div className="public-nav-actions">
          <button type="button" className="public-utility" onClick={onToggleTheme} aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            <ThemeIcon theme={theme} />
          </button>
          <div className="public-language" role="group" aria-label="Language">
            <button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => onChangeLanguage('es')}>ES</button>
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => onChangeLanguage('en')}>EN</button>
          </div>
          <button type="button" className="public-login" onClick={onEnter}>{c.login}</button>
        </div>
      </header>

      <main>
        <section className="public-hero" id="inicio">
          <div className="public-hero-copy">
            <p className="public-kicker">{c.eyebrow}</p>
            <h1>{c.title}</h1>
            <p className="public-lead">{c.lead}</p>
            <div className="public-hero-actions">
              <button type="button" className="public-primary" onClick={() => openSlide(0)}>{c.primary}<span aria-hidden="true">↓</span></button>
              <button type="button" className="public-secondary" onClick={onEnter}>{c.secondary}<span aria-hidden="true">→</span></button>
            </div>
          </div>
          <figure className="public-hero-media">
            <img src={publicHero} alt={lang === 'es' ? 'Veterinario trabajando en consulta con un perro y un gato' : 'Veterinarian working with a dog and a cat'} />
            <figcaption><span aria-hidden="true" />{lang === 'es' ? 'Diseñada para la práctica veterinaria real' : 'Designed for real veterinary practice'}</figcaption>
          </figure>
        </section>

        <section className="public-trust" aria-label={c.trust}>
          <p>{c.trust}</p>
          <div>{c.sources.map((source) => <strong key={source}>{source}</strong>)}</div>
        </section>

        <section className={`public-presentation public-presentation-slide-${activeSlide}`} id="presentacion" aria-roledescription="carousel" aria-label={lang === 'es' ? 'Presentación de WAIRUA VetAI' : 'WAIRUA VetAI introduction'}>
          <div className="public-presentation-controls">
            <div className="public-slide-dots" role="group" aria-label={lang === 'es' ? 'Elegir pantalla' : 'Choose slide'}>
              {c.nav.map((label, index) => (
                <button type="button" className={activeSlide === index ? 'active' : ''} onClick={() => openSlide(index, false)} aria-label={label} aria-current={activeSlide === index ? 'true' : undefined} key={label} />
              ))}
            </div>
          </div>

          <div className="public-slide-stage" aria-live="polite">
            {activeSlide === 0 ? (
              <div className="public-slide public-slide-benefits" key="benefits">
                <div className="public-section-heading">
                  <p className="public-kicker">{c.problemKicker}</p>
                  <h2>{c.problemTitle}</h2>
                  <p>{c.problemBody}</p>
                </div>
                <div className="public-benefit-list">
                  {c.benefits.map(([title, body], index) => (
                    <article key={title}>
                      <span>0{index + 1}</span>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSlide === 1 ? (
              <div className="public-slide public-slide-workflow" key="workflow">
                <div className="public-section-heading">
                  <p className="public-kicker">{c.workflowKicker}</p>
                  <h2>{c.workflowTitle}</h2>
                </div>
                <ol>
                  {c.workflow.map(([number, title, body]) => (
                    <li key={number}>
                      <span>{number}</span>
                      <div><h3>{title}</h3><p>{body}</p></div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {activeSlide === 2 ? (
              <div className="public-slide public-slide-toolkit" key="toolkit">
                <div className="public-toolkit-copy">
                  <p className="public-kicker">{c.toolkitKicker}</p>
                  <h2>{c.toolkitTitle}</h2>
                  <p>{c.toolkitBody}</p>
                  <button type="button" className="public-text-action" onClick={onEnter}>{c.secondary}<span aria-hidden="true">↗</span></button>
                </div>
                <div className="public-toolkit-list">
                  {c.toolkitItems.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
                </div>
              </div>
            ) : null}
          </div>

        </section>
      </main>

      <button type="button" className="public-floating-login" onClick={onEnter}>{c.login}<span aria-hidden="true">→</span></button>

      <footer className="public-footer">
        <strong>WAIRUA VetAI</strong>
        <span>{c.footer}</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
      <LegalCompliance lang={lang} contactEmail={contactEmail} compact />
    </div>
  );
}
