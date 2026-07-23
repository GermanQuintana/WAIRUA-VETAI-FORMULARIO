import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type ManagementTool = 'billing' | 'quick';

const copy = {
  es: {
    kicker: 'Herramienta de gestión',
    title: 'Gestión',
    text:
      'Calcula descuentos comerciales en cascada y revisa el resultado final con desglose por bases de IVA.',
    tabBilling: 'Facturación',
    tabQuick: 'Dto. equivalente',
    baseSuperReduced: 'Base superreducida',
    baseReduced: 'Base reducida',
    baseGeneral: 'Base general',
    discountLabels: ['Descuento 1', 'Descuento 2', 'Descuento 3', 'Descuento 4'],
    discountSequence: 'Descuentos en cascada',
    discountSequenceHint: 'Añade hasta cuatro descuentos sucesivos. Deja en 0 los que no necesites.',
    equivalentShort: 'Descuento equivalente',
    totalSavings: 'Ahorro total',
    netBase4: 'Neta 4%',
    netBase10: 'Neta 10%',
    netBase21: 'Neta 21%',
    totalNetBases: 'Suma bases netas',
    vat4: 'IVA 4%',
    vat10: 'IVA 10%',
    vat21: 'IVA 21%',
    totalVat: 'Suma total IVA',
    invoiceTotal: 'Total factura',
    activeSummary: 'Desglose completo',
    quickTitle: 'Descuento equivalente',
    quickText:
      'Convierte hasta cuatro descuentos sucesivos en un único porcentaje equivalente para validar una propuesta comercial.',
    equivalentResult: 'Descuento único equivalente',
  },
  en: {
    kicker: 'Management tool',
    title: 'Management',
    text:
      'Calculate cascading commercial discounts and review the final result with a VAT-base breakdown.',
    tabBilling: 'Billing',
    tabQuick: 'Equivalent discount',
    baseSuperReduced: 'Super-reduced base',
    baseReduced: 'Reduced base',
    baseGeneral: 'General base',
    discountLabels: ['Discount 1', 'Discount 2', 'Discount 3', 'Discount 4'],
    discountSequence: 'Cascading discounts',
    discountSequenceHint: 'Add up to four sequential discounts. Leave unused discounts at 0.',
    equivalentShort: 'Equivalent discount',
    totalSavings: 'Total savings',
    netBase4: 'Net 4%',
    netBase10: 'Net 10%',
    netBase21: 'Net 21%',
    totalNetBases: 'Total net bases',
    vat4: 'VAT 4%',
    vat10: 'VAT 10%',
    vat21: 'VAT 21%',
    totalVat: 'Total VAT',
    invoiceTotal: 'Invoice total',
    activeSummary: 'Full breakdown',
    quickTitle: 'Equivalent discount',
    quickText:
      'Convert up to four sequential discounts into one equivalent percentage to validate a commercial proposal.',
    equivalentResult: 'Single equivalent discount',
  },
} as const;

const VAT_RATES = {
  superReduced: 0.04,
  reduced: 0.1,
  general: 0.21,
} as const;

const formatMoney = (lang: Language, value: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const formatPercent = (lang: Language, value: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

const parseNumber = (value: string, fallback = 0) => {
  const normalized = value.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDiscountFactor = (discounts: readonly string[]) =>
  discounts.reduce((factor, discount) => {
    const percentage = Math.min(100, Math.max(0, parseNumber(discount))) / 100;
    return factor * (1 - percentage);
  }, 1);

const createEmptyDiscounts = () => ['0', '0', '0', '0'];

export default function ManagementToolkit({ lang }: Props) {
  const t = copy[lang];
  const [activeTool, setActiveTool] = useState<ManagementTool>('billing');
  const [base4, setBase4] = useState('0');
  const [base10, setBase10] = useState('0');
  const [base21, setBase21] = useState('0');
  const [billingDiscounts, setBillingDiscounts] = useState(createEmptyDiscounts);
  const [quickDiscounts, setQuickDiscounts] = useState(createEmptyDiscounts);

  useEffect(() => {
    const resetCalculator = () => {
      setBase4('0');
      setBase10('0');
      setBase21('0');
      setBillingDiscounts(createEmptyDiscounts());
      setQuickDiscounts(createEmptyDiscounts());
    };

    resetCalculator();
    window.addEventListener('pageshow', resetCalculator);
    return () => window.removeEventListener('pageshow', resetCalculator);
  }, []);

  const updateDiscount = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => {
    setter((current) => current.map((discount, discountIndex) => (discountIndex === index ? value : discount)));
  };

  const billingScenario = useMemo(() => {
    const b4 = Math.max(0, parseNumber(base4));
    const b10 = Math.max(0, parseNumber(base10));
    const b21 = Math.max(0, parseNumber(base21));
    const factor = getDiscountFactor(billingDiscounts);

    const net4 = b4 * factor;
    const net10 = b10 * factor;
    const net21 = b21 * factor;

    const vat4 = net4 * VAT_RATES.superReduced;
    const vat10 = net10 * VAT_RATES.reduced;
    const vat21 = net21 * VAT_RATES.general;

    const totalNetBases = net4 + net10 + net21;
    const totalVat = vat4 + vat10 + vat21;
    const invoiceTotal = totalNetBases + totalVat;
    const grossInvoiceTotal =
      b4 * (1 + VAT_RATES.superReduced) +
      b10 * (1 + VAT_RATES.reduced) +
      b21 * (1 + VAT_RATES.general);

    return {
      net4,
      net10,
      net21,
      vat4,
      vat10,
      vat21,
      totalNetBases,
      totalVat,
      invoiceTotal,
      equivalentDiscount: (1 - factor) * 100,
      totalSavings: grossInvoiceTotal - invoiceTotal,
    };
  }, [base10, base21, base4, billingDiscounts]);

  const equivalentDiscount = useMemo(() => {
    return (1 - getDiscountFactor(quickDiscounts)) * 100;
  }, [quickDiscounts]);

  return (
    <section className="toolkit-utility">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </div>
      </div>

      <div className="subtabs management-subtabs" role="tablist" aria-label={t.title}>
        <button type="button" className={activeTool === 'billing' ? 'active' : ''} onClick={() => setActiveTool('billing')}>
          {t.tabBilling}
        </button>
        <button type="button" className={activeTool === 'quick' ? 'active' : ''} onClick={() => setActiveTool('quick')}>
          {t.tabQuick}
        </button>
      </div>

      {activeTool === 'billing' ? (
        <div className="toolkit-utility-grid management-grid">
          <section className="toolkit-utility-card">
            <div className="management-base-list">
              <label className="management-base-row">
                <span className="management-tax-badge tax-4">4%</span>
                <span>{t.baseSuperReduced}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  value={base4}
                  onChange={(event) => setBase4(event.target.value)}
                />
              </label>

              <label className="management-base-row">
                <span className="management-tax-badge tax-10">10%</span>
                <span>{t.baseReduced}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  value={base10}
                  onChange={(event) => setBase10(event.target.value)}
                />
              </label>

              <label className="management-base-row">
                <span className="management-tax-badge tax-21">21%</span>
                <span>{t.baseGeneral}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  value={base21}
                  onChange={(event) => setBase21(event.target.value)}
                />
              </label>
            </div>

            <div className="management-discount-section">
              <div className="management-section-heading">
                <strong>{t.discountSequence}</strong>
                <span>{t.discountSequenceHint}</span>
              </div>
              <div className="management-discount-grid">
                {billingDiscounts.map((discount, index) => (
                  <label className="management-discount-step" key={t.discountLabels[index]}>
                    <span className="management-discount-label">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {t.discountLabels[index]}
                    </span>
                    <span className="management-percent-input">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        autoComplete="off"
                        value={discount}
                        onChange={(event) => updateDiscount(setBillingDiscounts, index, event.target.value)}
                      />
                      <span aria-hidden="true">%</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="toolkit-utility-card result-card" aria-live="polite">
            <p className="section-kicker">{t.activeSummary}</p>

            <div className="management-summary-strip">
              <div>
                <span>{t.equivalentShort}</span>
                <strong>{formatPercent(lang, billingScenario.equivalentDiscount)}%</strong>
              </div>
              <div>
                <span>{t.totalSavings}</span>
                <strong>{formatMoney(lang, billingScenario.totalSavings)}</strong>
              </div>
            </div>

            <div className="management-breakdown-grid">
              <div className="management-breakdown-item">
                <span>{t.netBase4}</span>
                <strong>{formatMoney(lang, billingScenario.net4)}</strong>
              </div>
              <div className="management-breakdown-item">
                <span>{t.netBase10}</span>
                <strong>{formatMoney(lang, billingScenario.net10)}</strong>
              </div>
              <div className="management-breakdown-item">
                <span>{t.netBase21}</span>
                <strong>{formatMoney(lang, billingScenario.net21)}</strong>
              </div>

              <div className="management-breakdown-item management-breakdown-full">
                <span>{t.totalNetBases}</span>
                <strong>{formatMoney(lang, billingScenario.totalNetBases)}</strong>
              </div>

              <div className="management-breakdown-item">
                <span>{t.vat4}</span>
                <strong>{formatMoney(lang, billingScenario.vat4)}</strong>
              </div>
              <div className="management-breakdown-item">
                <span>{t.vat10}</span>
                <strong>{formatMoney(lang, billingScenario.vat10)}</strong>
              </div>
              <div className="management-breakdown-item">
                <span>{t.vat21}</span>
                <strong>{formatMoney(lang, billingScenario.vat21)}</strong>
              </div>

              <div className="management-breakdown-item management-breakdown-full">
                <span>{t.totalVat}</span>
                <strong>{formatMoney(lang, billingScenario.totalVat)}</strong>
              </div>
            </div>

            <div className="management-total-banner">
              <span>{t.invoiceTotal}</span>
              <strong>{formatMoney(lang, billingScenario.invoiceTotal)}</strong>
            </div>
          </section>
        </div>
      ) : (
        <div className="toolkit-utility-grid management-grid">
          <section className="toolkit-utility-card">
            <div className="management-discount-section">
              <div className="management-section-heading">
                <strong>{t.discountSequence}</strong>
                <span>{t.discountSequenceHint}</span>
              </div>
              <div className="management-discount-grid">
                {quickDiscounts.map((discount, index) => (
                  <label className="management-discount-step" key={t.discountLabels[index]}>
                    <span className="management-discount-label">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {t.discountLabels[index]}
                    </span>
                    <span className="management-percent-input">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        autoComplete="off"
                        value={discount}
                        onChange={(event) => updateDiscount(setQuickDiscounts, index, event.target.value)}
                      />
                      <span aria-hidden="true">%</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="toolkit-utility-card result-card management-quick-result" aria-live="polite">
            <p className="section-kicker">{t.quickTitle}</p>
            <div className="toolkit-utility-result management-equivalent">
              <strong>{formatPercent(lang, equivalentDiscount)}%</strong>
              <span>{t.equivalentResult}</span>
            </div>
            <div className="management-cascade-preview" aria-hidden="true">
              {quickDiscounts.map((discount, index) => (
                <span key={`${t.discountLabels[index]}-preview`}>
                  {formatPercent(lang, Math.min(100, Math.max(0, parseNumber(discount))))}%
                </span>
              ))}
            </div>
            <div className="toolkit-utility-help">
              <p>{t.quickText}</p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
