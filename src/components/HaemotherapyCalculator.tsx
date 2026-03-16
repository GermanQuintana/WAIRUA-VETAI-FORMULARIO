import { useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type SpeciesKey = 'dog' | 'cat';
type ProductKey = 'packedRbc' | 'wholeBlood' | 'plasma' | 'platelets' | 'cryoprecipitate';

interface SpeciesDefinition {
  label: Record<Language, string>;
  bloodVolumeMlKg: number;
  plasmaDoseMlKg: {
    min: number;
    max: number;
  };
}

interface ProductDefinition {
  label: Record<Language, string>;
  mode: 'hct' | 'range' | 'units';
  defaultUnitHct?: number;
  typicalDose: Record<SpeciesKey, string>;
  doseRangeMlKg?: Record<
    SpeciesKey,
    {
      min: number;
      max: number;
    }
  >;
  unitsPerKg?: number;
}

interface LocalizedRow {
  product: Record<Language, string>;
  when: Record<Language, string>;
  how: Record<Language, string>;
}

type CalculationResult =
  | { mode: 'hct'; totalVolumeMl: number; mlKg: number }
  | { mode: 'range'; minMl: number; maxMl: number; minMlKg: number; maxMlKg: number }
  | { mode: 'units'; units: number; unitsPerKg: number }
  | null;

const SOURCE_LINKS = {
  official: 'https://bsanimal.eu/vets/haemotherapy/',
  manual: 'https://bsanimal.eu/template/bsanimal/content/vets/haemotherapy/220203_ES.pdf',
};

const SPECIES: Record<SpeciesKey, SpeciesDefinition> = {
  dog: {
    label: { es: 'Perro', en: 'Dog' },
    bloodVolumeMlKg: 85,
    plasmaDoseMlKg: { min: 10, max: 20 },
  },
  cat: {
    label: { es: 'Gato', en: 'Cat' },
    bloodVolumeMlKg: 55,
    plasmaDoseMlKg: { min: 6, max: 10 },
  },
};

const PRODUCTS: Record<ProductKey, ProductDefinition> = {
  packedRbc: {
    label: { es: 'Concentrado de eritrocitos', en: 'Packed red cells' },
    mode: 'hct',
    defaultUnitHct: 60,
    typicalDose: {
      dog: '6-10 mL/kg',
      cat: '5-6 mL/kg',
    },
  },
  wholeBlood: {
    label: { es: 'Sangre total', en: 'Whole blood' },
    mode: 'hct',
    defaultUnitHct: 40,
    typicalDose: {
      dog: '10-20 mL/kg',
      cat: '6-10 mL/kg',
    },
  },
  plasma: {
    label: { es: 'Plasma', en: 'Plasma' },
    mode: 'range',
    typicalDose: {
      dog: '10-20 mL/kg',
      cat: '6-10 mL/kg',
    },
    doseRangeMlKg: {
      dog: { min: 10, max: 20 },
      cat: { min: 6, max: 10 },
    },
  },
  platelets: {
    label: { es: 'Plaquetas', en: 'Platelets' },
    mode: 'units',
    typicalDose: {
      dog: '1 unidad / 10 kg',
      cat: '1 unidad / 10 kg',
    },
    unitsPerKg: 0.1,
  },
  cryoprecipitate: {
    label: { es: 'Crioprecipitado', en: 'Cryoprecipitate' },
    mode: 'units',
    typicalDose: {
      dog: '1 unidad / 10 kg',
      cat: 'Consultar banco / volumen',
    },
    unitsPerKg: 0.1,
  },
};

const COMPONENT_ROWS: LocalizedRow[] = [
  {
    product: { es: 'Sangre total fresca', en: 'Fresh whole blood' },
    when: {
      es: 'Hemorragia aguda con anemia y necesidad simultanea de soporte de volumen.',
      en: 'Acute hemorrhage with anemia and a simultaneous need for volume support.',
    },
    how: {
      es: 'Aporta eritrocitos y volumen; si es fresca, tambien ofrece mejor soporte de factores y plaquetas.',
      en: 'Provides red cells and volume; when fresh, it also offers better factor and platelet support.',
    },
  },
  {
    product: { es: 'Concentrado de eritrocitos', en: 'Packed red cells' },
    when: {
      es: 'Anemia clinicamente relevante en paciente normovolemico o con riesgo de sobrecarga.',
      en: 'Clinically relevant anemia in a normovolemic patient or one at risk of volume overload.',
    },
    how: {
      es: 'Se administra como la sangre total, pero con mayor hematocrito y menor volumen total.',
      en: 'Administered like whole blood, but with a higher hematocrit and lower total volume.',
    },
  },
  {
    product: { es: 'Plasma fresco congelado', en: 'Fresh frozen plasma' },
    when: {
      es: 'Coagulopatias, deficit de multiples factores, anticoagulantes cumarinicos o sangrado asociado.',
      en: 'Coagulopathies, multiple factor deficiencies, coumarin anticoagulant exposure, or related bleeding.',
    },
    how: {
      es: 'No sustituye el soporte eritrocitario; se pauta por kg y por objetivo hemostatico.',
      en: 'It does not replace red-cell support; dose it per kg and hemostatic objective.',
    },
  },
  {
    product: { es: 'Plasma congelado', en: 'Frozen plasma' },
    when: {
      es: 'Cuando se busca soporte de factores estables y no es imprescindible maximizar los factores labiles.',
      en: 'When support for stable coagulation factors is needed and labile-factor support is less critical.',
    },
    how: {
      es: 'Puede ser util como alternativa al plasma fresco segun disponibilidad del banco.',
      en: 'May be useful as an alternative to fresh plasma depending on blood-bank availability.',
    },
  },
  {
    product: { es: 'Crioprecipitado', en: 'Cryoprecipitate' },
    when: {
      es: 'Enfermedad de von Willebrand, hemofilia A o hipofibrinogenemia cuando se busca alto contenido de factores.',
      en: 'Von Willebrand disease, hemophilia A, or hypofibrinogenemia when a high factor content is needed.',
    },
    how: {
      es: 'Componente concentrado; util cuando interesa aumentar factores con menos volumen.',
      en: 'A concentrated component that is useful when factor support is needed with less volume.',
    },
  },
  {
    product: { es: 'Plaquetas / PRP / concentrado plaquetario', en: 'Platelets / PRP / platelet concentrate' },
    when: {
      es: 'Trombocitopenia grave o trombocitopatia con sangrado clinicamente relevante.',
      en: 'Severe thrombocytopenia or thrombocytopathy with clinically relevant bleeding.',
    },
    how: {
      es: 'La dosificacion suele expresarse en unidades; confirma formato y rendimiento con el banco.',
      en: 'Dosing is usually expressed in units; confirm product format and expected yield with the blood bank.',
    },
  },
];

const CAT_COMPATIBILITY = {
  es: [
    ['Receptor A', 'Eritrocitos A'],
    ['Receptor B', 'Eritrocitos B'],
    ['Receptor AB', 'AB preferente; A solo si no hay alternativa y tras compatibilidad'],
  ],
  en: [
    ['Type A recipient', 'Type A red cells'],
    ['Type B recipient', 'Type B red cells'],
    ['Type AB recipient', 'AB preferred; A only if no better option exists and compatibility is checked'],
  ],
} satisfies Record<Language, [string, string][]>;

const roundValue = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatValue = (value: number, decimals = 1) => Number(value.toFixed(decimals)).toString();

export default function HaemotherapyCalculator({ lang }: Props) {
  const copy =
    lang === 'es'
      ? {
          kicker: 'Hemoderivados y compatibilidad',
          title: 'Calculadora de hemoterapia',
          text:
            'Calcula o estima dosis orientativas de hemoderivados para perro y gato, y deja a mano una guia de componentes, plaquetas, plasma, tipaje y compatibilidad.',
          formulaTitle: 'Logica del calculo',
          formulaText: 'Eritrocitos: peso x volemia x (Hto objetivo - Hto actual) / Hto de la unidad',
          species: 'Especie',
          product: 'Hemoderivado',
          weight: 'Peso (kg)',
          currentHct: 'Hto/PCV actual (%)',
          targetHct: 'Hto/PCV objetivo (%)',
          unitHct: 'Hto/PCV de la unidad (%)',
          resultKicker: 'Volumen orientativo',
          doseResultKicker: 'Dosis orientativa',
          resultHelp:
            'Para sangre total o concentrado de eritrocitos, ajusta el hematocrito de la unidad si tu banco trabaja con otros valores.',
          rangeHelp: 'En plasma la orientacion util se expresa como un rango en mL/kg.',
          unitsHelp: 'En plaquetas y crioprecipitado la referencia practica suele expresarse en unidades, no en mL.',
          bloodVolume: 'Volemia operativa',
          doseCheck: 'Chequeo rapido',
          dynamicMetric: 'Referencia dinamica',
          dynamicUnits: 'Unidades aproximadas',
          componentGuideTitle: 'Guia de componentes',
          compatibilityTitle: 'Grupos sanguineos y compatibilidad',
          practiceTitle: 'Recordatorios clinicos',
          usageKicker: 'Cuando usar cada componente',
          usageProduct: 'Componente',
          usageWhen: 'Cuando considerarlo',
          usageHow: 'Nota practica',
          compatibilityKicker: 'Compatibilidad y tipaje',
          dogGroupsTitle: 'Perro',
          catGroupsTitle: 'Gato',
          catTableTitle: 'Compatibilidad rapida de eritrocitos en gato',
          practiceKicker: 'Uso practico',
          dogBullets: [
            'DEA 1 es el grupo clinicamente mas relevante en transfusion canina.',
            'Idealmente tipa antes de la primera transfusion de eritrocitos.',
            'Haz crossmatch en transfusiones repetidas y, como regla practica, si han pasado mas de 72 h desde la anterior.',
          ],
          catBullets: [
            'Los gatos tienen grupos A, B y AB y presentan aloanticuerpos naturales.',
            'El tipaje es obligatorio antes de la primera transfusion de eritrocitos y muy recomendable antes de plasma.',
            'Si repites transfusion, el crossmatch sigue siendo recomendable.',
          ],
          practiceBullets: [
            'Empieza despacio durante los primeros 30 minutos y vigila reacciones transfusionales de cerca.',
            'No intentes normalizar automaticamente el hematocrito: prioriza estabilidad clinica, perfusion y control del sangrado.',
            'Confirma siempre el producto exacto, su volumen final y la pauta de tu banco si trabajas con plaquetas o crioprecipitado.',
          ],
          sourcesKicker: 'Referencias usadas en la herramienta',
          officialSite: 'Web oficial BSAVA / BS Animal',
          manual: 'Manual PDF de hemoterapia',
        }
      : {
          kicker: 'Blood products and compatibility',
          title: 'Haemotherapy calculator',
          text:
            'Calculate or estimate guidance doses for blood products in dogs and cats, while keeping component-use, plasma, platelets, typing, and compatibility notes visible.',
          formulaTitle: 'Calculation logic',
          formulaText: 'Red cells: weight x blood volume x (target Hct - current Hct) / unit Hct',
          species: 'Species',
          product: 'Blood product',
          weight: 'Weight (kg)',
          currentHct: 'Current Hct/PCV (%)',
          targetHct: 'Target Hct/PCV (%)',
          unitHct: 'Unit Hct/PCV (%)',
          resultKicker: 'Guidance volume',
          doseResultKicker: 'Guidance dose',
          resultHelp:
            'For whole blood or packed red cells, adjust the unit hematocrit if your blood bank uses different values.',
          rangeHelp: 'For plasma, useful guidance is expressed as an mL/kg range.',
          unitsHelp: 'For platelets and cryoprecipitate, practical guidance is usually expressed in units rather than mL.',
          bloodVolume: 'Working blood volume',
          doseCheck: 'Quick check',
          dynamicMetric: 'Dynamic reference',
          dynamicUnits: 'Approximate units',
          componentGuideTitle: 'Component guide',
          compatibilityTitle: 'Blood groups and compatibility',
          practiceTitle: 'Clinical reminders',
          usageKicker: 'When to use each component',
          usageProduct: 'Component',
          usageWhen: 'When to consider it',
          usageHow: 'Practical note',
          compatibilityKicker: 'Compatibility and typing',
          dogGroupsTitle: 'Dog',
          catGroupsTitle: 'Cat',
          catTableTitle: 'Quick feline red-cell compatibility',
          practiceKicker: 'Practical use',
          dogBullets: [
            'DEA 1 is the most clinically relevant canine blood group in transfusion practice.',
            'Ideally type before the first red-cell transfusion.',
            'Crossmatch repeated transfusions and, as a practical rule, when more than 72 h have passed since the prior one.',
          ],
          catBullets: [
            'Cats have A, B, and AB blood groups and naturally occurring alloantibodies.',
            'Typing is mandatory before the first red-cell transfusion and strongly advised before plasma.',
            'If transfusion is repeated, crossmatching remains advisable.',
          ],
          practiceBullets: [
            'Start slowly during the first 30 minutes and watch closely for transfusion reactions.',
            'Do not normalize hematocrit automatically: prioritize clinical stability, perfusion, and bleeding control.',
            'Always confirm the exact product, final volume, and blood-bank protocol when working with platelets or cryoprecipitate.',
          ],
          sourcesKicker: 'Sources referenced in this tool',
          officialSite: 'Official BSAVA / BS Animal page',
          manual: 'Haemotherapy PDF manual',
        };

  const [species, setSpecies] = useState<SpeciesKey>('dog');
  const [product, setProduct] = useState<ProductKey>('packedRbc');
  const [weight, setWeight] = useState('');
  const [currentHct, setCurrentHct] = useState('');
  const [targetHct, setTargetHct] = useState('');
  const [unitHct, setUnitHct] = useState('');

  const speciesData = SPECIES[species];
  const productData = PRODUCTS[product];

  const calculation = useMemo<CalculationResult>(() => {
    const numericWeight = Number.parseFloat(weight);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      return null;
    }

    if (productData.mode === 'hct') {
      const numericCurrentHct = Number.parseFloat(currentHct);
      const numericTargetHct = Number.parseFloat(targetHct);
      const numericUnitHct = Number.parseFloat(unitHct);

      const isValidHct =
        Number.isFinite(numericCurrentHct) &&
        numericCurrentHct >= 0 &&
        Number.isFinite(numericTargetHct) &&
        numericTargetHct >= 0 &&
        Number.isFinite(numericUnitHct) &&
        numericUnitHct > 0;

      if (!isValidHct) return null;

      const deltaHct = Math.max(numericTargetHct - numericCurrentHct, 0);
      const totalVolumeMl = (numericWeight * speciesData.bloodVolumeMlKg * deltaHct) / numericUnitHct;
      return {
        mode: 'hct',
        totalVolumeMl,
        mlKg: totalVolumeMl / numericWeight,
      };
    }

    if (productData.mode === 'range' && productData.doseRangeMlKg) {
      const range = productData.doseRangeMlKg[species];
      return {
        mode: 'range',
        minMl: numericWeight * range.min,
        maxMl: numericWeight * range.max,
        minMlKg: range.min,
        maxMlKg: range.max,
      };
    }

    if (productData.mode === 'units' && productData.unitsPerKg) {
      return {
        mode: 'units',
        units: Math.max(1, Math.ceil(numericWeight * productData.unitsPerKg)),
        unitsPerKg: productData.unitsPerKg,
      };
    }

    return null;
  }, [currentHct, productData, species, speciesData.bloodVolumeMlKg, targetHct, unitHct, weight]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
          <p>{copy.text}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{copy.formulaTitle}</strong>
          <p>{copy.formulaText}</p>
        </div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <div className="toolkit-utility-form">
            <label>
              {copy.species}
              <select value={species} onChange={(event) => setSpecies(event.target.value as SpeciesKey)}>
                {(Object.keys(SPECIES) as SpeciesKey[]).map((option) => (
                  <option key={option} value={option}>
                    {SPECIES[option].label[lang]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {copy.product}
              <select value={product} onChange={(event) => setProduct(event.target.value as ProductKey)}>
                {(Object.keys(PRODUCTS) as ProductKey[]).map((option) => (
                  <option key={option} value={option}>
                    {PRODUCTS[option].label[lang]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {copy.weight}
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={weight}
                placeholder={lang === 'es' ? 'Ej: 20' : 'Eg: 20'}
                onChange={(event) => setWeight(event.target.value)}
              />
            </label>

            {productData.mode === 'hct' && (
              <>
                <label>
                  {copy.currentHct}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentHct}
                    placeholder="15"
                    onChange={(event) => setCurrentHct(event.target.value)}
                  />
                </label>

                <label>
                  {copy.targetHct}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={targetHct}
                    placeholder="25"
                    onChange={(event) => setTargetHct(event.target.value)}
                  />
                </label>

                <label>
                  {copy.unitHct}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={unitHct}
                    placeholder={String(productData.defaultUnitHct)}
                    onChange={(event) => setUnitHct(event.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        <section className="toolkit-utility-card result-card">
          <p className="section-kicker">{productData.mode === 'units' ? copy.doseResultKicker : copy.resultKicker}</p>
          <div className="toolkit-utility-result">
            <strong>
              {calculation?.mode === 'hct'
                ? formatValue(roundValue(calculation.totalVolumeMl, 1), 1)
                : calculation?.mode === 'range'
                  ? `${formatValue(roundValue(calculation.minMl, 1), 1)}-${formatValue(roundValue(calculation.maxMl, 1), 1)}`
                  : calculation?.mode === 'units'
                    ? String(calculation.units)
                    : '--'}
            </strong>
            <span>{calculation?.mode === 'units' ? (lang === 'es' ? 'unid.' : 'units') : 'mL'}</span>
          </div>
          <p className="toolkit-utility-equation">
            {SPECIES[species].label[lang]} · {PRODUCTS[product].label[lang]} · {weight || '--'} kg
          </p>
          <div className="toolkit-utility-help">
            <p>{productData.mode === 'hct' ? copy.resultHelp : productData.mode === 'range' ? copy.rangeHelp : copy.unitsHelp}</p>
          </div>

          <div className="haemo-metrics">
            <article className="haemo-metric-card">
              <span>{copy.bloodVolume}</span>
              <strong>{speciesData.bloodVolumeMlKg} mL/kg</strong>
            </article>
            <article className="haemo-metric-card">
              <span>{copy.doseCheck}</span>
              <strong>{productData.typicalDose[species]}</strong>
            </article>
            <article className="haemo-metric-card">
              <span>{copy.dynamicMetric}</span>
              <strong>
                {calculation?.mode === 'range'
                  ? `${formatValue(roundValue(calculation.minMl, 1), 1)}-${formatValue(roundValue(calculation.maxMl, 1), 1)} mL`
                  : calculation?.mode === 'units'
                    ? `${calculation.units} ${lang === 'es' ? 'unid.' : 'units'}`
                    : `${speciesData.plasmaDoseMlKg.min}-${speciesData.plasmaDoseMlKg.max} mL/kg`}
              </strong>
              <p>{calculation?.mode === 'units' ? copy.unitsHelp : copy.rangeHelp}</p>
            </article>
            <article className="haemo-metric-card">
              <span>{calculation?.mode === 'units' ? copy.dynamicUnits : 'mL/kg'}</span>
              <strong>
                {calculation?.mode === 'hct'
                  ? formatValue(roundValue(calculation.mlKg, 1), 1)
                  : calculation?.mode === 'range'
                    ? `${formatValue(roundValue(calculation.minMlKg, 1), 1)}-${formatValue(roundValue(calculation.maxMlKg, 1), 1)}`
                    : calculation?.mode === 'units'
                      ? String(calculation.units)
                      : '--'}
              </strong>
            </article>
          </div>
        </section>
      </div>

      <details className="toolkit-reference-table accordion-card">
        <summary className="accordion-summary">
          <div>
            <p className="section-kicker">{copy.usageKicker}</p>
            <h4>{copy.componentGuideTitle}</h4>
          </div>
        </summary>

        <div className="toolkit-table-shell">
          <table className="toolkit-table">
            <thead>
              <tr>
                <th>{copy.usageProduct}</th>
                <th>{copy.usageWhen}</th>
                <th>{copy.usageHow}</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENT_ROWS.map((row) => (
                <tr key={row.product.en}>
                  <td>{row.product[lang]}</td>
                  <td>{row.when[lang]}</td>
                  <td>{row.how[lang]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="toolkit-reference-table accordion-card">
        <summary className="accordion-summary">
          <div>
            <p className="section-kicker">{copy.compatibilityKicker}</p>
            <h4>{copy.compatibilityTitle}</h4>
          </div>
        </summary>

        <div className="haemo-guidance-grid">
          <details className="toolkit-source-note accordion-card nested-accordion haemo-typing-card">
            <summary className="accordion-summary">
              <strong>{copy.dogGroupsTitle}</strong>
              <span>DEA 1</span>
            </summary>
            <ul className="haemo-list">
              {copy.dogBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>

          <details className="toolkit-source-note accordion-card nested-accordion haemo-typing-card">
            <summary className="accordion-summary">
              <strong>{copy.catGroupsTitle}</strong>
              <span>A / B / AB</span>
            </summary>
            <ul className="haemo-list">
              {copy.catBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="toolkit-table-shell">
              <table className="toolkit-table">
                <thead>
                  <tr>
                    <th>{copy.catTableTitle}</th>
                    <th>{lang === 'es' ? 'Compatibilidad recomendada' : 'Recommended compatibility'}</th>
                  </tr>
                </thead>
                <tbody>
                  {CAT_COMPATIBILITY[lang].map(([recipient, donor]) => (
                    <tr key={recipient}>
                      <td>{recipient}</td>
                      <td>{donor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </details>

      <details className="toolkit-reference-table accordion-card">
        <summary className="accordion-summary">
          <div>
            <p className="section-kicker">{copy.practiceKicker}</p>
            <h4>{copy.practiceTitle}</h4>
          </div>
        </summary>
        <ul className="haemo-list">
          {copy.practiceBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="toolkit-source-note">
          <strong>{copy.sourcesKicker}</strong>
          <div className="haemo-source-links">
            <a href={SOURCE_LINKS.official} target="_blank" rel="noreferrer">
              {copy.officialSite}
            </a>
            <a href={SOURCE_LINKS.manual} target="_blank" rel="noreferrer">
              {copy.manual}
            </a>
          </div>
        </div>
      </details>
    </section>
  );
}
