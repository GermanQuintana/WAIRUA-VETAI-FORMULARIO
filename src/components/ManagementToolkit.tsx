import { useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type ManagementTool = 'billing' | 'quick';

const copy = {
  es: {
    kicker: 'Herramienta de gestion',
    title: 'Gestion',
    text:
      'Utilidades de operativa y negocio dentro del toolkit. Esta primera version calcula descuentos comerciales en cascada con desglose por bases de IVA.',
    status: 'Gratuita',
    tabBilling: 'Facturacion',
    tabQuick: 'Dto. equivalente',
    baseSuperReduced: 'Base superreducida',
    baseReduced: 'Base reducida',
    baseGeneral: 'Base general',
    discountOne: 'Dto. comercial 1 (%)',
    discountTwo: 'Dto. comercial 2 (%)',
    helper:
      'Aplicamos ambos descuentos en cascada y luego recalculamos las bases netas y el IVA de cada bloque. Asi puedes comparar el resultado real de una oferta.',
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
      'Convierte dos descuentos sucesivos en un unico porcentaje equivalente. Muy util para validar propuestas comerciales sin hacer cuentas manuales.',
    equivalentResult: 'Descuento unico equivalente',
  },
  en: {
    kicker: 'Management tool',
    title: 'Management',
    text:
      'Operational and business utilities inside the toolkit. This first version calculates cascading commercial discounts with VAT-base breakdown.',
    status: 'Free',
    tabBilling: 'Billing',
    tabQuick: 'Equivalent discount',
    baseSuperReduced: 'Super-reduced base',
    baseReduced: 'Reduced base',
    baseGeneral: 'General base',
    discountOne: 'Commercial discount 1 (%)',
    discountTwo: 'Commercial discount 2 (%)',
    helper:
      'Both discounts are applied in sequence and then the net taxable bases and VAT are recalculated per block. This gives the real outcome of a commercial offer.',
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
      'Convert two sequential discounts into one equivalent percentage. Useful to validate commercial proposals without manual calculations.',
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

export default function ManagementToolkit({ lang }: Props) {
  const t = copy[lang];
  const [activeTool, setActiveTool] = useState<ManagementTool>('billing');
  const [base4, setBase4] = useState('0');
  const [base10, setBase10] = useState('0');
  const [base21, setBase21] = useState('0');
  const [discountOne, setDiscountOne] = useState('0');
  const [discountTwo, setDiscountTwo] = useState('0');
  const [quickDiscountOne, setQuickDiscountOne] = useState('14');
  const [quickDiscountTwo, setQuickDiscountTwo] = useState('18');

  const billingScenario = useMemo(() => {
    const b4 = Math.max(0, parseNumber(base4));
    const b10 = Math.max(0, parseNumber(base10));
    const b21 = Math.max(0, parseNumber(base21));
    const d1 = Math.max(0, parseNumber(discountOne)) / 100;
    const d2 = Math.max(0, parseNumber(discountTwo)) / 100;
    const factor = (1 - d1) * (1 - d2);

    const net4 = b4 * factor;
    const net10 = b10 * factor;
    const net21 = b21 * factor;

    const vat4 = net4 * VAT_RATES.superReduced;
    const vat10 = net10 * VAT_RATES.reduced;
    const vat21 = net21 * VAT_RATES.general;

    const totalNetBases = net4 + net10 + net21;
    const totalVat = vat4 + vat10 + vat21;
    const invoiceTotal = totalNetBases + totalVat;

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
    };
  }, [base10, base21, base4, discountOne, discountTwo]);

  const equivalentDiscount = useMemo(() => {
    const d1 = Math.max(0, parseNumber(quickDiscountOne, 14)) / 100;
    const d2 = Math.max(0, parseNumber(quickDiscountTwo, 18)) / 100;
    return (1 - (1 - d1) * (1 - d2)) * 100;
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
          <p>{t.helper}</p>
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
                <input type="number" min="0" step="0.01" value={base4} onChange={(event) => setBase4(event.target.value)} />
              </label>

              <label className="management-base-row">
                <span className="management-tax-badge tax-10">10%</span>
                <span>{t.baseReduced}</span>
                <input type="number" min="0" step="0.01" value={base10} onChange={(event) => setBase10(event.target.value)} />
              </label>

              <label className="management-base-row">
                <span className="management-tax-badge tax-21">21%</span>
                <span>{t.baseGeneral}</span>
                <input type="number" min="0" step="0.01" value={base21} onChange={(event) => setBase21(event.target.value)} />
              </label>
            </div>

            <div className="toolkit-utility-form management-discount-grid">
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
            </div>
          </section>

          <section className="toolkit-utility-card result-card">
            <p className="section-kicker">{t.activeSummary}</p>

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
            <p className="section-kicker">{t.quickTitle}</p>
            <div className="toolkit-utility-result management-equivalent">
              <strong>{formatPercent(lang, equivalentDiscount)}%</strong>
              <span>{t.equivalentResult}</span>
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
