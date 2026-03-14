import { useMemo, useState } from 'react';
import { Language, labels } from '../i18n';

interface Props {
  lang: Language;
}

type ProtocolKey = 'MLK' | 'FLK';
type DrugKey = 'morfina' | 'fentanilo' | 'lidocaina' | 'ketamina';

interface DrugConcentration {
  label: string;
  value: number;
  unit: string;
  ampDesc?: string;
}

interface DrugDefinition {
  rate: number;
  rateUnit?: string;
  concentrations: DrugConcentration[];
}

interface ProtocolDefinition {
  label: ProtocolKey;
  fullName: {
    es: string;
    en: string;
  };
  drugs: Record<DrugKey, DrugDefinition | undefined>;
}

interface DrugPreparationResult {
  drugKey: DrugKey;
  concentration: DrugConcentration;
  mgNeeded: number;
  mlNeeded: number;
  rate: number;
  rateUnit: string;
}

const DRUG_DATA: Record<ProtocolKey, ProtocolDefinition> = {
  MLK: {
    label: 'MLK',
    fullName: {
      es: 'Morfina + Lidocaina + Ketamina',
      en: 'Morphine + Lidocaine + Ketamine',
    },
    drugs: {
      morfina: {
        rate: 0.24,
        concentrations: [
          { label: '1%', value: 10, unit: 'mg/mL', ampDesc: 'amp. 1 mL' },
          { label: '2%', value: 20, unit: 'mg/mL', ampDesc: 'amp. 2 mL' },
        ],
      },
      fentanilo: undefined,
      lidocaina: {
        rate: 3,
        concentrations: [
          { label: '1%', value: 10, unit: 'mg/mL', ampDesc: 'amp. 10 mL' },
          { label: '2%', value: 20, unit: 'mg/mL', ampDesc: 'amp. 5 mL' },
          { label: '5%', value: 50, unit: 'mg/mL', ampDesc: 'amp. 10 mL' },
        ],
      },
      ketamina: {
        rate: 0.6,
        concentrations: [
          { label: '50 mg/mL', value: 50, unit: 'mg/mL' },
          { label: '100 mg/mL', value: 100, unit: 'mg/mL' },
        ],
      },
    },
  },
  FLK: {
    label: 'FLK',
    fullName: {
      es: 'Fentanilo + Lidocaina + Ketamina',
      en: 'Fentanyl + Lidocaine + Ketamine',
    },
    drugs: {
      morfina: undefined,
      fentanilo: {
        rate: 3.6,
        rateUnit: 'mcg/kg/h',
        concentrations: [{ label: '0.15 mg / 3 mL', value: 0.05, unit: 'mg/mL', ampDesc: 'amp. 3 mL' }],
      },
      lidocaina: {
        rate: 3,
        concentrations: [
          { label: '1%', value: 10, unit: 'mg/mL', ampDesc: 'amp. 10 mL' },
          { label: '2%', value: 20, unit: 'mg/mL', ampDesc: 'amp. 5 mL' },
          { label: '5%', value: 50, unit: 'mg/mL', ampDesc: 'amp. 10 mL' },
        ],
      },
      ketamina: {
        rate: 0.6,
        concentrations: [
          { label: '50 mg/mL', value: 50, unit: 'mg/mL' },
          { label: '100 mg/mL', value: 100, unit: 'mg/mL' },
        ],
      },
    },
  },
};

const VOLUMES = [500, 250, 100] as const;

const REFERENCE: Record<(typeof VOLUMES)[number], Partial<Record<DrugKey, number>>> = {
  500: { morfina: 40, fentanilo: 0.6, lidocaina: 500, ketamina: 100 },
  250: { morfina: 20, fentanilo: 0.3, lidocaina: 250, ketamina: 50 },
  100: { morfina: 8, fentanilo: 0.12, lidocaina: 100, ketamina: 20 },
};

const DRUG_TONE: Record<Exclude<DrugKey, never>, string> = {
  morfina: 'morphine',
  fentanilo: 'fentanyl',
  lidocaina: 'lidocaine',
  ketamina: 'ketamine',
};

const DRUG_NAMES = {
  es: {
    morfina: 'Morfina',
    fentanilo: 'Fentanilo',
    lidocaina: 'Lidocaina',
    ketamina: 'Ketamina',
  },
  en: {
    morfina: 'Morphine',
    fentanilo: 'Fentanyl',
    lidocaina: 'Lidocaine',
    ketamina: 'Ketamine',
  },
} satisfies Record<Language, Record<DrugKey, string>>;

const roundValue = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export default function InfusionCalculator({ lang }: Props) {
  const t = labels[lang];
  const [protocol, setProtocol] = useState<ProtocolKey>('MLK');
  const [volume, setVolume] = useState<(typeof VOLUMES)[number]>(500);
  const [weight, setWeight] = useState('');
  const [concentrationSelection, setConcentrationSelection] = useState<Record<DrugKey, number>>({
    morfina: 0,
    fentanilo: 0,
    lidocaina: 0,
    ketamina: 0,
  });

  const protocolData = DRUG_DATA[protocol];
  const activeDrugKeys = useMemo(
    () => (Object.entries(protocolData.drugs).filter(([, drug]) => drug) as [DrugKey, DrugDefinition][]).map(([drug]) => drug),
    [protocolData],
  );

  const calculations = useMemo(() => {
    const results = activeDrugKeys.map((drugKey): DrugPreparationResult | null => {
      const drug = protocolData.drugs[drugKey];
      if (!drug) return null;

      const concentration = drug.concentrations[concentrationSelection[drugKey]] ?? drug.concentrations[0];
      const mgNeeded = REFERENCE[volume][drugKey] ?? 0;
      const mlNeeded = concentration.value > 0 ? roundValue(mgNeeded / concentration.value) : 0;

      return {
        drugKey,
        concentration,
        mgNeeded,
        mlNeeded,
        rate: drug.rate,
        rateUnit: drug.rateUnit ?? 'mg/kg/h',
      };
    });

    const parsedWeight = Number.parseFloat(weight);
    const patient =
      Number.isFinite(parsedWeight) && parsedWeight > 0
        ? {
            weight: parsedWeight,
            bolusTotal: roundValue(parsedWeight * 3),
            bolusPerMinute: roundValue((parsedWeight * 3) / 5),
            infusionPerHour: roundValue(parsedWeight * 3),
            infusionPerMinute: roundValue((parsedWeight * 3) / 60),
            durationHours: roundValue(Math.max(volume - parsedWeight * 3, 0) / (parsedWeight * 3)),
          }
        : null;

    return {
      results: results.filter((result): result is DrugPreparationResult => result !== null),
      patient,
    };
  }, [activeDrugKeys, concentrationSelection, protocolData, volume, weight]);

  return (
    <section className="infusion-calculator">
      <div className="infusion-header">
        <div>
          <p className="section-kicker">{t.infusionCalculatorKicker}</p>
          <h3>{t.infusionCalculatorTitle}</h3>
          <p>{t.infusionCalculatorText}</p>
        </div>
        <div className="infusion-summary-card">
          <span>{t.infusionSummaryLabel}</span>
          <strong>{protocolData.label}</strong>
          <p>{protocolData.fullName[lang]}</p>
        </div>
      </div>

      <div className="infusion-layout">
        <div className="infusion-config-panel">
          <div className="infusion-block">
            <div className="infusion-block-header">
              <h4>{t.infusionProtocolLabel}</h4>
              <p>{t.infusionProtocolHelp}</p>
            </div>
            <div className="infusion-toggle-row">
              {(Object.keys(DRUG_DATA) as ProtocolKey[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={protocol === option ? 'active' : ''}
                  onClick={() => setProtocol(option)}
                >
                  <strong>{option}</strong>
                  <span>{DRUG_DATA[option].fullName[lang]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="infusion-block">
            <div className="infusion-block-header">
              <h4>{t.infusionBagLabel}</h4>
              <p>{t.infusionBagHelp}</p>
            </div>
            <div className="infusion-volume-grid">
              {VOLUMES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={volume === option ? 'active' : ''}
                  onClick={() => setVolume(option)}
                >
                  {option} mL
                </button>
              ))}
            </div>
          </div>

          <div className="infusion-block">
            <div className="infusion-block-header">
              <h4>{t.weightKg}</h4>
              <p>{t.infusionWeightHelp}</p>
            </div>
            <label className="infusion-weight-input">
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder={lang === 'es' ? 'Ej: 25' : 'Example: 25'}
              />
              <span>kg</span>
            </label>
          </div>

          <div className="infusion-block">
            <div className="infusion-block-header">
              <h4>{t.infusionConcentrationLabel}</h4>
              <p>{t.infusionConcentrationHelp}</p>
            </div>
            <div className="infusion-drug-list">
              {activeDrugKeys.map((drugKey) => {
                const drug = protocolData.drugs[drugKey];
                if (!drug) return null;

                return (
                  <article key={drugKey} className={`infusion-drug-card tone-${DRUG_TONE[drugKey]}`}>
                    <div className="infusion-drug-heading">
                      <div>
                        <strong>{DRUG_NAMES[lang][drugKey]}</strong>
                        <span>
                          {drug.rate} {drug.rateUnit ?? 'mg/kg/h'}
                        </span>
                      </div>
                    </div>
                    <div className="infusion-chip-row">
                      {drug.concentrations.map((concentration, index) => (
                        <button
                          key={`${drugKey}-${concentration.label}`}
                          type="button"
                          className={concentrationSelection[drugKey] === index ? 'active' : ''}
                          onClick={() =>
                            setConcentrationSelection((current) => ({
                              ...current,
                              [drugKey]: index,
                            }))
                          }
                        >
                          {concentration.label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="infusion-results-panel">
          <section className="infusion-result-card">
            <div className="infusion-card-header">
              <div>
                <p className="section-kicker">{t.infusionPreparationLabel}</p>
                <h4>
                  {protocol} · {volume} mL
                </h4>
              </div>
              <span>{t.infusionPreparationCaption}</span>
            </div>

            <div className="infusion-prep-list">
              {calculations.results.map((result) => (
                <article key={result.drugKey} className={`infusion-prep-row tone-${DRUG_TONE[result.drugKey]}`}>
                  <div>
                    <strong>{DRUG_NAMES[lang][result.drugKey]}</strong>
                    <p>
                      {result.mgNeeded} mg · {result.concentration.label} ({result.concentration.unit})
                    </p>
                  </div>
                  <div className="infusion-prep-amount">
                    <strong>{result.mlNeeded} mL</strong>
                    {result.concentration.ampDesc ? <span>{result.concentration.ampDesc}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="infusion-result-card">
            <div className="infusion-card-header">
              <div>
                <p className="section-kicker">{t.infusionRateLabel}</p>
                <h4>{t.infusionRateTitle}</h4>
              </div>
              <span>{calculations.patient ? `${calculations.patient.weight} kg` : t.infusionAwaitingWeight}</span>
            </div>

            {calculations.patient ? (
              <div className="infusion-rate-grid">
                <article className="infusion-metric-card tone-bolus">
                  <span>{t.infusionBolusLabel}</span>
                  <strong>{calculations.patient.bolusTotal} mL</strong>
                  <p>{calculations.patient.bolusPerMinute} mL/min · 5 min</p>
                </article>
                <article className="infusion-metric-card tone-maintenance">
                  <span>{t.infusionMaintenanceLabel}</span>
                  <strong>{calculations.patient.infusionPerHour} mL/h</strong>
                  <p>{calculations.patient.infusionPerMinute} mL/min</p>
                </article>
                <article className="infusion-metric-card tone-duration">
                  <span>{t.infusionDurationLabel}</span>
                  <strong>~{calculations.patient.durationHours} h</strong>
                  <p>{t.infusionDurationHelp}</p>
                </article>
              </div>
            ) : (
              <div className="infusion-empty-state">{t.infusionAwaitingWeightHelp}</div>
            )}
          </section>
        </div>
      </div>

      <div className="infusion-reference-strip">
        <p>{t.infusionReference}</p>
        <p>{t.infusionDisclaimer}</p>
      </div>
    </section>
  );
}
