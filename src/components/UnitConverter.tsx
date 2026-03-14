import { useEffect, useMemo, useState } from 'react';
import { Language, labels } from '../i18n';

interface Props {
  lang: Language;
}

type UnitGroupKey = 'mass' | 'volume' | 'concentration';

interface UnitDefinition {
  id: string;
  label: string;
  factorToBase: number;
}

const UNIT_GROUPS: Record<
  UnitGroupKey,
  {
    units: UnitDefinition[];
    examples: {
      es: string;
      en: string;
    };
  }
> = {
  mass: {
    units: [
      { id: 'kg', label: 'kg', factorToBase: 1000 },
      { id: 'g', label: 'g', factorToBase: 1 },
      { id: 'mg', label: 'mg', factorToBase: 0.001 },
      { id: 'mcg', label: 'mcg', factorToBase: 0.000001 },
      { id: 'ng', label: 'ng', factorToBase: 0.000000001 },
    ],
    examples: {
      es: 'Ejemplos: mg a g, mcg a mg, g a mcg.',
      en: 'Examples: mg to g, mcg to mg, g to mcg.',
    },
  },
  volume: {
    units: [
      { id: 'L', label: 'L', factorToBase: 1 },
      { id: 'mL', label: 'mL', factorToBase: 0.001 },
      { id: 'uL', label: 'uL', factorToBase: 0.000001 },
    ],
    examples: {
      es: 'Ejemplos: mL a L, L a mL, uL a mL.',
      en: 'Examples: mL to L, L to mL, uL to mL.',
    },
  },
  concentration: {
    units: [
      { id: '%', label: '% (p/v)', factorToBase: 10 },
      { id: 'g/mL', label: 'g/mL', factorToBase: 1000 },
      { id: 'mg/mL', label: 'mg/mL', factorToBase: 1 },
      { id: 'mcg/mL', label: 'mcg/mL', factorToBase: 0.001 },
      { id: 'ng/mL', label: 'ng/mL', factorToBase: 0.000001 },
      { id: 'g/L', label: 'g/L', factorToBase: 1 },
      { id: 'mg/L', label: 'mg/L', factorToBase: 0.001 },
      { id: 'mcg/L', label: 'mcg/L', factorToBase: 0.000001 },
    ],
    examples: {
      es: 'Ejemplos: 5% a mg/mL, g/mL a mcg/mL, mg/L a mg/mL.',
      en: 'Examples: 5% to mg/mL, g/mL to mcg/mL, mg/L to mg/mL.',
    },
  },
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '--';
  if (value === 0) return '0';
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return Number(value.toFixed(6)).toString();
};

export default function UnitConverter({ lang }: Props) {
  const t = labels[lang];
  const [group, setGroup] = useState<UnitGroupKey>('concentration');
  const [inputValue, setInputValue] = useState('5');
  const [fromUnit, setFromUnit] = useState(UNIT_GROUPS.concentration.units[0].id);
  const [toUnit, setToUnit] = useState(UNIT_GROUPS.concentration.units[2].id);

  const activeGroup = UNIT_GROUPS[group];

  useEffect(() => {
    const [first, second] = activeGroup.units;
    setFromUnit(first.id);
    setToUnit((second ?? first).id);
  }, [activeGroup]);

  const result = useMemo(() => {
    const numericValue = Number.parseFloat(inputValue);
    const origin = activeGroup.units.find((unit) => unit.id === fromUnit);
    const target = activeGroup.units.find((unit) => unit.id === toUnit);

    if (!origin || !target || !Number.isFinite(numericValue)) {
      return null;
    }

    const baseValue = numericValue * origin.factorToBase;
    return baseValue / target.factorToBase;
  }, [activeGroup.units, fromUnit, inputValue, toUnit]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{t.unitConverterKicker}</p>
          <h3>{t.unitConverterTitle}</h3>
          <p>{t.unitConverterText}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{t.unitConverterFormulaTitle}</strong>
          <p>{activeGroup.examples[lang]}</p>
        </div>
      </div>

      <div className="toolkit-utility-grid">
        <section className="toolkit-utility-card">
          <div className="toolkit-utility-form">
            <label>
              {t.unitConverterGroup}
              <select value={group} onChange={(event) => setGroup(event.target.value as UnitGroupKey)}>
                <option value="mass">{t.unitGroupMass}</option>
                <option value="volume">{t.unitGroupVolume}</option>
                <option value="concentration">{t.unitGroupConcentration}</option>
              </select>
            </label>

            <label>
              {t.unitConverterValue}
              <input type="number" step="any" value={inputValue} onChange={(event) => setInputValue(event.target.value)} />
            </label>

            <label>
              {t.unitConverterFrom}
              <select value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
                {activeGroup.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.unitConverterTo}
              <select value={toUnit} onChange={(event) => setToUnit(event.target.value)}>
                {activeGroup.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="toolkit-utility-card result-card">
          <p className="section-kicker">{t.unitConverterResult}</p>
          <div className="toolkit-utility-result">
            <strong>{result !== null ? formatNumber(result) : '--'}</strong>
            <span>{toUnit}</span>
          </div>
          <p className="toolkit-utility-equation">
            {inputValue || '--'} {fromUnit} = {result !== null ? formatNumber(result) : '--'} {toUnit}
          </p>
          <div className="toolkit-utility-help">
            <p>{t.unitConverterHint}</p>
          </div>
        </section>
      </div>
    </section>
  );
}
