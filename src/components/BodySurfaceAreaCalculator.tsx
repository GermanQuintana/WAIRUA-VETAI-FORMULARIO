import { Fragment, useMemo, useState } from 'react';
import { Language, labels } from '../i18n';

interface Props {
  lang: Language;
}

type BsaSpeciesKey = 'dog' | 'cat' | 'rabbit' | 'ferret';

interface SpeciesDefinition {
  label: {
    es: string;
    en: string;
  };
  coefficient: number;
  formulaLabel: string;
  weightOptions: number[];
  source: {
    label: string;
    url: string;
    note: {
      es: string;
      en: string;
    };
  };
}

const buildWeightRange = (start: number, end: number, step: number) => {
  const values: number[] = [];
  for (let current = start; current <= end + step / 10; current += step) {
    values.push(Number(current.toFixed(2)));
  }
  return values;
};

const SPECIES_CONFIG: Record<BsaSpeciesKey, SpeciesDefinition> = {
  dog: {
    label: { es: 'Perro', en: 'Dog' },
    coefficient: 0.101,
    formulaLabel: 'BSA = 0.101 x kg^(2/3)',
    weightOptions: [...buildWeightRange(0.5, 5, 0.5), ...buildWeightRange(6, 56, 2)],
    source: {
      label: 'Merck Veterinary Manual',
      url: 'https://www.merckvetmanual.com/multimedia/table/weight-to-body-surface-area-conversion-for-dogs',
      note: {
        es: 'Tabla y formula de referencia para perro.',
        en: 'Reference table and formula for dogs.',
      },
    },
  },
  cat: {
    label: { es: 'Gato', en: 'Cat' },
    coefficient: 0.1,
    formulaLabel: 'BSA = 0.1 x kg^(2/3)',
    weightOptions: buildWeightRange(0.5, 10, 0.5),
    source: {
      label: 'Merck Veterinary Manual',
      url: 'https://www.merckvetmanual.com/multimedia/table/weight-to-body-surface-area-conversion-for-cats',
      note: {
        es: 'Tabla y formula de referencia para gato.',
        en: 'Reference table and formula for cats.',
      },
    },
  },
  rabbit: {
    label: { es: 'Conejo', en: 'Rabbit' },
    coefficient: 0.099,
    formulaLabel: 'BSA = 0.099 x kg^(2/3)',
    weightOptions: buildWeightRange(0.5, 10, 0.5),
    source: {
      label: 'PubMed 23176410',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23176410/',
      note: {
        es: 'Coeficiente de Meeh publicado para conejo (Km = 9.9).',
        en: 'Published Meeh coefficient for rabbit (Km = 9.9).',
      },
    },
  },
  ferret: {
    label: { es: 'Huron', en: 'Ferret' },
    coefficient: 0.0994,
    formulaLabel: 'BSA = 0.0994 x kg^(2/3)',
    weightOptions: buildWeightRange(0.25, 2, 0.25),
    source: {
      label: 'PubMed 25629911',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25629911/',
      note: {
        es: 'Coeficiente de Meeh publicado para huron; la forma en kg a m² se obtiene por conversion directa.',
        en: 'Published Meeh coefficient for ferret; the kg to m² form is obtained by direct conversion.',
      },
    },
  },
};

const calculateBodySurfaceArea = (weight: number, coefficient: number) => coefficient * Math.pow(weight, 2 / 3);

const formatNumber = (value: number, decimals = 3) => Number(value.toFixed(decimals)).toString();

const buildColumnRows = <T,>(values: T[], columns: number) => {
  const rowCount = Math.ceil(values.length / columns);
  const rows: T[][] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row: T[] = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const valueIndex = columnIndex * rowCount + rowIndex;
      if (valueIndex < values.length) {
        row.push(values[valueIndex]);
      }
    }
    rows.push(row);
  }
  return rows;
};

export default function BodySurfaceAreaCalculator({ lang }: Props) {
  const t = labels[lang];
  const [species, setSpecies] = useState<BsaSpeciesKey>('dog');
  const [weight, setWeight] = useState('10');
  const [showTable, setShowTable] = useState(false);

  const activeSpecies = SPECIES_CONFIG[species];
  const numericWeight = Number.parseFloat(weight);
  const calculatedBsa =
    Number.isFinite(numericWeight) && numericWeight > 0 ? calculateBodySurfaceArea(numericWeight, activeSpecies.coefficient) : null;

  const referenceTable = useMemo(
    () =>
      activeSpecies.weightOptions.map((value) => ({
        weight: value,
        bsa: calculateBodySurfaceArea(value, activeSpecies.coefficient),
      })),
    [activeSpecies],
  );
  const referenceColumns = species === 'dog' || species === 'cat' ? 3 : 2;
  const referenceRows = useMemo(() => buildColumnRows(referenceTable, referenceColumns), [referenceColumns, referenceTable]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{t.bodySurfaceKicker}</p>
          <h3>{t.bodySurfaceTitle}</h3>
          <p>{t.bodySurfaceText}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{activeSpecies.label[lang]}</strong>
          <p>{activeSpecies.formulaLabel}</p>
        </div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <div className="toolkit-utility-form">
            <label>
              {t.bodySurfaceSpecies}
              <select value={species} onChange={(event) => setSpecies(event.target.value as BsaSpeciesKey)}>
                {(Object.keys(SPECIES_CONFIG) as BsaSpeciesKey[]).map((option) => (
                  <option key={option} value={option}>
                    {SPECIES_CONFIG[option].label[lang]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.weightKg}
              <input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>

            <button type="button" className="secondary-button toolkit-table-toggle" onClick={() => setShowTable((current) => !current)}>
              {showTable ? t.bodySurfaceHideTable : t.bodySurfaceShowTable}
            </button>
          </div>
        </section>

        <section className="toolkit-utility-card result-card">
          <p className="section-kicker">{t.bodySurfaceResult}</p>
          <div className="toolkit-utility-result">
            <strong>{calculatedBsa !== null ? formatNumber(calculatedBsa) : '--'}</strong>
            <span>m²</span>
          </div>
          <p className="toolkit-utility-equation">
            {activeSpecies.formulaLabel} · {t.weightKg}: {weight || '--'} kg
          </p>
          <div className="toolkit-utility-help">
            <p>{t.bodySurfaceHint}</p>
          </div>
        </section>
      </div>

      {showTable && (
        <section className="toolkit-reference-table">
          <div className="toolkit-reference-header">
            <div>
              <p className="section-kicker">{t.bodySurfaceReferenceTable}</p>
              <h4>{activeSpecies.label[lang]}</h4>
            </div>
            <span>{activeSpecies.formulaLabel}</span>
          </div>

          <div className="toolkit-source-note">
            <strong>{activeSpecies.source.label}</strong>
            <p>{activeSpecies.source.note[lang]}</p>
            <a href={activeSpecies.source.url} target="_blank" rel="noreferrer">
              {activeSpecies.source.url}
            </a>
          </div>

          <div className="toolkit-table-shell">
            <table className="toolkit-table">
              <thead>
                <tr>
                  {Array.from({ length: referenceColumns }, (_, columnIndex) => (
                    <Fragment key={`${species}-head-${columnIndex}`}>
                      <th>{t.weightKg}</th>
                      <th>{t.bodySurfaceResult}</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referenceRows.map((row, rowIndex) => (
                  <tr key={`${species}-row-${rowIndex}`}>
                    {Array.from({ length: referenceColumns }, (_, columnIndex) => {
                      const cell = row[columnIndex];
                      return cell ? (
                        <Fragment key={`${species}-${rowIndex}-${cell.weight}`}>
                          <td>{cell.weight}</td>
                          <td>{formatNumber(cell.bsa)}</td>
                        </Fragment>
                      ) : (
                        <Fragment key={`${species}-${rowIndex}-empty-${columnIndex}`}>
                          <td />
                          <td />
                        </Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
