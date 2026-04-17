import { useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type ManagementTool = 'cascade' | 'quick';

const copy = {
  es: {
    kicker: 'Herramienta de gestion',
    title: 'Gestion',
    text:
      'Espacio para utilidades de negocio y operativa. Empezamos con una calculadora de descuentos en cascada adaptada al flujo comercial.',
    status: 'Gratuita',
    tabCascade: 'Descuentos en cascada',
    tabQuick: 'Calculo rapido',
    units: 'Unidades',
    basePrice: 'Precio base (€)',
    discountOne: 'Dto 1 (%)',
    discountTwo: 'Dto 2 (%)',
    vat: 'IVA (%)',
    calculate: 'Calcular',
    grossBase: 'Base bruta',
    afterDiscountOne: 'Tras dto 1',
    finalBase: 'Base final',
    vatAmount: 'IVA',
    total: 'Total',
    equivalentTitle: 'Equivalente total',
    equivalentText:
      'Calcula el descuento real equivalente cuando aplicas dos descuentos seguidos. Va bien para comparar condiciones comerciales rápidamente.',
    equivalentResult: 'Descuento equivalente',
    helper:
      'La segunda rebaja se calcula sobre la base ya descontada, no sobre el precio inicial. Asi evitamos sobreestimar el descuento real.',
    activeSummary: 'Escenario activo',
    activeSummaryText: 'Puedes ajustar unidades, precio, descuentos e IVA para ver el efecto completo.',
  },
  en: {
    kicker: 'Management tool',
    title: 'Management',
    text:
      'Area for business and operational utilities. We start with a cascading discount calculator adapted to commercial workflows.',
    status: 'Free',
    tabCascade: 'Cascading discounts',
    tabQuick: 'Quick equivalent',
    units: 'Units',
    basePrice: 'Base price (€)',
    discountOne: 'Discount 1 (%)',
    discountTwo: 'Discount 2 (%)',
    vat: 'VAT (%)',
    calculate: 'Calculate',
    grossBase: 'Gross base',
    afterDiscountOne: 'After discount 1',
    finalBase: 'Final base',
    vatAmount: 'VAT',
    total: 'Total',
    equivalentTitle: 'Combined equivalent',
    equivalentText:
      'Calculate the real equivalent discount when two discounts are applied in sequence. Useful to compare commercial terms quickly.',
    equivalentResult: 'Equivalent discount',
    helper:
      'The second discount is applied to the already discounted base, not to the starting price. This avoids overstating the real reduction.',
    activeSummary: 'Active scenario',
    activeSummaryText: 'Adjust units, base price, discounts, and VAT to see the full commercial impact.',
  },
} as const;

const formatMoney = (lang: Language, value: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const formatPercent = (lang: Language, value: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const parseNumber = (value: string, fallback: number) => {
  const normalized = value.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ManagementToolkit({ lang }: Props) {
  const t = copy[lang];
  const [activeTool, setActiveTool] = useState<ManagementTool>('cascade');
  const [units, setUnits] = useState('1');
  const [basePrice, setBasePrice] = useState('100');
  const [discountOne, setDiscountOne] = useState('0');
  const [discountTwo, setDiscountTwo] = useState('0');
  const [vat, setVat] = useState('21');
  const [quickDiscountOne, setQuickDiscountOne] = useState('14');
  const [quickDiscountTwo, setQuickDiscountTwo] = useState('18');

  const scenario = useMemo(() => {
    const numericUnits = Math.max(0, parseNumber(units, 1));
    const numericBasePrice = Math.max(0, parseNumber(basePrice, 100));
    const firstDiscount = Math.max(0, parseNumber(discountOne, 0)) / 100;
    const secondDiscount = Math.max(0, parseNumber(discountTwo, 0)) / 100;
    const vatRate = Math.max(0, parseNumber(vat, 21)) / 100;

    const grossBase = numericUnits * numericBasePrice;
    const afterFirstDiscount = grossBase * (1 - firstDiscount);
    const finalBase = afterFirstDiscount * (1 - secondDiscount);
    const vatAmount = finalBase * vatRate;
    const total = finalBase + vatAmount;

    return {
      grossBase,
      afterFirstDiscount,
      finalBase,
      vatAmount,
      total,
    };
  }, [basePrice, discountOne, discountTwo, units, vat]);

  const equivalentDiscount = useMemo(() => {
    const firstDiscount = Math.max(0, parseNumber(quickDiscountOne, 14)) / 100;
    const secondDiscount = Math.max(0, parseNumber(quickDiscountTwo, 18)) / 100;
    return (1 - (1 - firstDiscount) * (1 - secondDiscount)) * 100;
  }, [quickDiscountOne, quickDiscountTwo]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{t.status}</strong>
          <p>{t.activeSummaryText}</p>
        </div>
      </div>

      <div className="subtabs management-subtabs" role="tablist" aria-label={t.title}>
        <button type="button" className={activeTool === 'cascade' ? 'active' : ''} onClick={() => setActiveTool('cascade')}>
          {t.tabCascade}
        </button>
        <button type="button" className={activeTool === 'quick' ? 'active' : ''} onClick={() => setActiveTool('quick')}>
          {t.tabQuick}
        </button>
      </div>

      {activeTool === 'cascade' ? (
        <div className="toolkit-utility-grid management-grid">
          <section className="toolkit-utility-card">
            <div className="toolkit-utility-form">
              <label>
                {t.units}
                <input type="number" min="0" step="1" value={units} onChange={(event) => setUnits(event.target.value)} />
              </label>

              <label>
                {t.basePrice}
                <input type="number" min="0" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} />
              </label>

              <label>
                {t.discountOne}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountOne}
                  onChange={(event) => setDiscountOne(event.target.value)}
                />
              </label>

              <label>
                {t.discountTwo}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountTwo}
                  onChange={(event) => setDiscountTwo(event.target.value)}
                />
              </label>

              <label>
                {t.vat}
                <input type="number" min="0" step="0.01" value={vat} onChange={(event) => setVat(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="toolkit-utility-card result-card">
            <p className="section-kicker">{t.activeSummary}</p>
            <div className="management-result-list">
              <div className="toolkit-utility-result">
                <strong>{formatMoney(lang, scenario.grossBase)}</strong>
                <span>{t.grossBase}</span>
              </div>
              <div className="toolkit-utility-result">
                <strong>{formatMoney(lang, scenario.afterFirstDiscount)}</strong>
                <span>{t.afterDiscountOne}</span>
              </div>
              <div className="toolkit-utility-result">
                <strong>{formatMoney(lang, scenario.finalBase)}</strong>
                <span>{t.finalBase}</span>
              </div>
              <div className="toolkit-utility-result">
                <strong>{formatMoney(lang, scenario.vatAmount)}</strong>
                <span>{t.vatAmount}</span>
              </div>
              <div className="toolkit-utility-result management-total">
                <strong>{formatMoney(lang, scenario.total)}</strong>
                <span>{t.total}</span>
              </div>
            </div>
            <div className="toolkit-utility-help">
              <p>{t.helper}</p>
            </div>
          </section>
        </div>
      ) : (
        <div className="toolkit-utility-grid management-grid">
          <section className="toolkit-utility-card">
            <div className="toolkit-utility-form">
              <label>
                {t.discountOne}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickDiscountOne}
                  onChange={(event) => setQuickDiscountOne(event.target.value)}
                />
              </label>

              <label>
                {t.discountTwo}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickDiscountTwo}
                  onChange={(event) => setQuickDiscountTwo(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="toolkit-utility-card result-card">
            <p className="section-kicker">{t.equivalentTitle}</p>
            <div className="toolkit-utility-result management-equivalent">
              <strong>{formatPercent(lang, equivalentDiscount)}%</strong>
              <span>{t.equivalentResult}</span>
            </div>
            <div className="toolkit-utility-help">
              <p>{t.equivalentText}</p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
