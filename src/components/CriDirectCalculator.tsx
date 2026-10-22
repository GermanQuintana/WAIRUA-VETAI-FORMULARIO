import { useState } from "react";
import type { Language } from "../i18n";
import {
  criDrugsForSpecies,
  PROPOFOL_LIPURO_SOURCE,
  type CriProtocol,
  type CriSpecies,
} from "../data/criProtocols";
import { calculateCri, criMgKgHour } from "../lib/criMath";
import ProductConcentration, {
  number,
  productFor,
  type ProductChoice,
} from "./CriProductConcentration";

export default function CriDirectCalculator({
  lang,
  protocol,
  species,
  weight,
}: {
  lang: Language;
  protocol: CriProtocol;
  species: CriSpecies;
  weight: string;
}) {
  const es = lang === "es";
  const [doses, setDoses] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Record<string, ProductChoice>>({});
  const drugs = criDrugsForSpecies(protocol, species);
  const fmt = (value: number) =>
    new Intl.NumberFormat(es ? "es" : "en", {
      maximumSignificantDigits: 5,
    }).format(value);
  return (
    <div className="cri-drugs">
      {drugs.map((drug) => {
        const dose = number(doses[drug.id] ?? "");
        const product = productFor(drug.id, products[drug.id]);
        const outside =
          Number.isFinite(dose) && (dose < drug.min || dose > drug.max);
        const result = outside
          ? null
          : calculateCri(
              number(weight),
              dose,
              drug.unit,
              number(product.value),
            );
        return (
          <article
            className="cri-drug"
            key={drug.id}
            aria-label={drug.name[lang]}
          >
            <div className="cri-drug-heading">
              <strong>{drug.name[lang]}</strong>
              <span>
                {fmt(drug.min)}
                {drug.min !== drug.max ? `–${fmt(drug.max)}` : ""} {drug.unit}
              </span>
            </div>
            <div className="cri-drug-inputs">
              <label>
                {es ? "Dosis elegida" : "Selected dose"} ({drug.unit})
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={doses[drug.id] ?? ""}
                  aria-invalid={outside}
                  onChange={(event) =>
                    setDoses((current) => ({
                      ...current,
                      [drug.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <ProductConcentration
                lang={lang}
                drugId={drug.id}
                selected={product}
                seizureContext={protocol.category === "status"}
                onChange={(choice) =>
                  setProducts((current) => ({ ...current, [drug.id]: choice }))
                }
              />
            </div>
            <button
              type="button"
              className="cri-reference-button"
              onClick={() =>
                setDoses((current) => ({
                  ...current,
                  [drug.id]: String(drug.min),
                }))
              }
            >
              {es ? "Usar referencia" : "Use reference"}: {fmt(drug.min)}{" "}
              {drug.unit}
            </button>
            {dose > 0 && drug.unit !== "mg/kg/h" && (
              <p className="cri-muted">
                {fmt(dose)} {drug.unit} = {fmt(criMgKgHour(dose, drug.unit))}{" "}
                mg/kg/h
              </p>
            )}
            {outside && (
              <p className="cri-warning" role="alert">
                {es
                  ? "Fuera de la pauta citada: cálculo bloqueado. Revisar indicación y unidades."
                  : "Outside cited protocol: calculation blocked. Review indication and units."}
              </p>
            )}
            <div className="cri-output" aria-live="polite">
              <div>
                <span>{es ? "Bomba" : "Pump"}</span>
                <strong>
                  {result ? fmt(result.pumpMlHour) : "—"} <small>mL/h</small>
                </strong>
              </div>
              <div>
                <span>{es ? "Aporte" : "Delivery"}</span>
                <strong>
                  {result ? fmt(result.mgHour) : "—"} <small>mg/h</small>
                </strong>
              </div>
            </div>
            {result && (
              <p className="cri-volume-delivery">
                {es ? "Aporte de esta bomba" : "Volume from this pump"}:{" "}
                <strong>
                  {fmt(result.pumpMlHour / number(weight))} mL/kg/h
                </strong>
              </p>
            )}
            {result && result.pumpMlHour < 0.1 && (
              <p className="cri-warning">
                {es
                  ? "Ritmo inferior a 0,1 mL/h: comprobar precisión de bomba y dilución validada."
                  : "Rate below 0.1 mL/h: check pump accuracy and a validated dilution."}
              </p>
            )}
            {drug.id === "propofol" && (
              <p className="cri-muted">
                {es
                  ? "Lipuro sin diluir: renovar sistema y reservorio como máximo en 12 h. La duración clínica se decide aparte."
                  : "Undiluted Lipuro: replace line and reservoir within 12 h. Clinical duration is a separate decision."}
                <a
                  href={PROPOFOL_LIPURO_SOURCE}
                  target="_blank"
                  rel="noreferrer"
                >
                  CIMAVET · Propofol Lipuro ↗
                </a>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
