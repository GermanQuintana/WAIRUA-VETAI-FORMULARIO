import type { Language } from '../i18n';
import { searchCriProtocols } from '../lib/criSearch';
import { criDrugsForSpecies } from '../data/criProtocols';
import './continuous-infusion.css';

export default function CriProtocolLinks({ lang, query = '', onOpen }: {
  lang: Language; query?: string; onOpen: (id?: string) => void;
}) {
  const es = lang === 'es';
  const matches = query.trim() ? searchCriProtocols(query) : [];
  return (
    <aside className="cri-related" aria-label={es ? 'Dosis e infusiones continuas' : 'Doses and continuous infusions'}>
      <div className="cri-related-heading">
        <strong>{es ? 'Infusión continua · CRI' : 'Continuous infusion · CRI'}</strong>
        <button type="button" onClick={() => onOpen()}>{es ? 'Abrir calculadora CRI →' : 'Open CRI calculator →'}</button>
      </div>
      <p>{es ? 'Busca un fármaco o una indicación: propofol convulsiones, ketamina, midazolam o TIVA.' : 'Search a drug or indication: propofol seizures, ketamine, midazolam or TIVA.'}</p>
      {matches.length > 0 && <ul className="cri-related-results">{matches.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => onOpen(item.id)}>
            <strong>{item.name[lang]}</strong><span>{item.indication[lang]}</span>
            <small>{item.administration === 'loading' ? (es ? 'Carga fraccionada · no CRI' : 'Divided loading · not CRI') : item.species.map((species) => `${species === 'dog' ? (es ? 'Perro' : 'Dog') : (es ? 'Gato' : 'Cat')}: ${criDrugsForSpecies(item, species).map((drug) => `${drug.min}${drug.max !== drug.min ? `–${drug.max}` : ''} ${drug.unit}`).join(' + ')}`).join(' · ')}</small>
          </button>
        </li>
      ))}</ul>}
    </aside>
  );
}
