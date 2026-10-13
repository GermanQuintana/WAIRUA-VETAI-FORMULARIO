import { useState } from 'react';
import { Language } from '../i18n';

export default function ManagementPlanning({ lang }: { lang: Language }) {
  const es = lang === 'es';
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('');
  const [fixed, setFixed] = useState('');
  const [price, setPrice] = useState('');
  const [variable, setVariable] = useState('');
  const [activity, setActivity] = useState('');
  const c = Number(cost),
    m = Number(margin),
    f = Number(fixed),
    p = Number(price),
    v = Number(variable),
    a = Number(activity);
  const validPrice =
    cost !== '' &&
    margin !== '' &&
    [c, m].every(Number.isFinite) &&
    c >= 0 &&
    m >= 0 &&
    m < 100;
  const sale = validPrice ? c / (1 - m / 100) : null;
  const validBreakEven =
    fixed !== '' &&
    price !== '' &&
    variable !== '' &&
    [f, p, v].every(Number.isFinite) &&
    f >= 0 &&
    p > v &&
    v >= 0;
  const units = validBreakEven ? Math.ceil(f / (p - v)) : null;
  const validActivity = activity !== '' && a >= 0 && Number.isInteger(a);
  const money = (n: number) =>
    new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {
      style: 'currency',
      currency: 'EUR',
    }).format(n);
  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    max?: number,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min="0"
        max={max}
        step="any"
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
    </label>
  );
  return (
    <div className="planning-tools">
      <section className="planning-section">
        <header>
          <span className="clinical-step">01</span>
          <div>
            <h4>{es ? 'Precio y margen' : 'Price and margin'}</h4>
            <p>
              {es
                ? 'Calcula un precio a partir del coste y del margen sobre la venta.'
                : 'Calculate a price from cost and margin on sales.'}
            </p>
          </div>
        </header>
        <div className="clinical-workspace">
          <div className="toolkit-utility-form">
            {field(
              es ? 'Coste unitario sin IVA (€)' : 'Unit cost excluding VAT (€)',
              cost,
              setCost,
            )}
            {field(
              es
                ? 'Margen deseado sobre venta (%)'
                : 'Target margin on sales (%)',
              margin,
              setMargin,
              99.99,
            )}
            <p className="clinical-hint">
              {es
                ? 'Margen = beneficio / precio. Un margen del 20% no equivale a sumar un 20% al coste. Incluye en el coste los recursos que quieras cubrir.'
                : 'Margin = profit / price. A 20% margin is different from adding 20% to cost. Include the resources you need to cover in the cost.'}
            </p>
          </div>
          <div className="clinical-result" aria-live="polite">
            <span>{es ? 'Precio sin IVA' : 'Price excluding VAT'}</span>
            <strong>
              {sale !== null && Number.isFinite(sale) ? money(sale) : '—'}
            </strong>
            <p>
              {es
                ? 'Precio = coste / (1 − margen / 100)'
                : 'Price = cost / (1 − margin / 100)'}
            </p>
            {sale !== null && Number.isFinite(sale) && (
              <p>
                {es ? 'Beneficio unitario' : 'Unit profit'}:{' '}
                <b>{money(sale - c)}</b>
              </p>
            )}
          </div>
        </div>
        {margin !== '' && (m < 0 || m >= 100) && (
          <p role="alert">
            {es
              ? 'El margen debe ser de 0 a menos de 100%.'
              : 'Margin must be from 0 to less than 100%.'}
          </p>
        )}
      </section>
      <section className="planning-section">
        <header>
          <span className="clinical-step">02</span>
          <div>
            <h4>{es ? 'Punto de equilibrio' : 'Break-even point'}</h4>
            <p>
              {es
                ? 'Estima la actividad necesaria para cubrir los costes de un periodo.'
                : 'Estimate the activity needed to cover costs over a period.'}
            </p>
          </div>
        </header>
        <div className="clinical-workspace">
          <div className="toolkit-utility-form">
            {field(
              es
                ? 'Costes fijos del periodo (€)'
                : 'Fixed costs for the period (€)',
              fixed,
              setFixed,
            )}
            {field(
              es
                ? 'Ingreso por servicio sin IVA (€)'
                : 'Revenue per service excluding VAT (€)',
              price,
              setPrice,
            )}
            {field(
              es
                ? 'Coste variable por servicio (€)'
                : 'Variable cost per service (€)',
              variable,
              setVariable,
            )}
            {field(
              es
                ? 'Servicios previstos (opcional)'
                : 'Expected services (optional)',
              activity,
              setActivity,
            )}
            <p className="clinical-hint">
              {es
                ? 'Usa el mismo periodo y un servicio representativo. Modelo simplificado: ingreso y coste variable constantes, sin impuestos.'
                : 'Use the same period and a representative service. Simplified model: constant revenue and variable cost, excluding taxes.'}
            </p>
          </div>
          <div className="clinical-result planning-amber" aria-live="polite">
            <span>
              {es ? 'Servicios para cubrir costes' : 'Services to cover costs'}
            </span>
            <strong>
              {units !== null && Number.isFinite(units)
                ? units.toLocaleString(es ? 'es-ES' : 'en-GB')
                : '—'}
            </strong>
            <p>
              {es
                ? 'Redondeado hacia arriba · costes fijos / (ingreso − coste variable)'
                : 'Rounded up · fixed costs / (revenue − variable cost)'}
            </p>
            {units !== null && validActivity && (
              <p>
                {es
                  ? 'Resultado previsto del periodo'
                  : 'Expected period result'}
                : <b>{money(a * (p - v) - f)}</b>
              </p>
            )}
          </div>
        </div>
        {price !== '' && variable !== '' && p <= v && (
          <p role="alert">
            {es
              ? 'El ingreso debe superar el coste variable para cubrir costes fijos.'
              : 'Revenue must exceed variable cost to cover fixed costs.'}
          </p>
        )}
        {activity !== '' && !validActivity && (
          <p role="alert">
            {es
              ? 'Introduce un número entero de servicios igual o superior a cero.'
              : 'Enter a whole number of services of zero or more.'}
          </p>
        )}
      </section>
      <button
        type="button"
        onClick={() => {
          setCost('');
          setMargin('');
          setFixed('');
          setPrice('');
          setVariable('');
          setActivity('');
        }}
      >
        {es ? 'Limpiar cálculos' : 'Clear calculations'}
      </button>
    </div>
  );
}
