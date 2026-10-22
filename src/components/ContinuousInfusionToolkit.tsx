import { useState } from "react";
import type { Language } from "../i18n";
import {
  CRI_PROTOCOLS,
  LUMINAL_SOURCE,
  type CriSpecies,
  type CriProtocol,
} from "../data/criProtocols";
import { calculateLoadingFraction } from "../lib/criMath";
import CriBagPlanner from "./CriBagPlanner";
import CriDirectCalculator from "./CriDirectCalculator";
import ProductConcentration, { number, productFor, type ProductChoice } from "./CriProductConcentration";
import { matchesCriProtocol } from "../lib/criSearch";
import "./continuous-infusion.css";

export default function ContinuousInfusionToolkit({
  lang, initialProtocolId,
}: {
  lang: Language;
  initialProtocolId?: string;
}) {
  const initial = CRI_PROTOCOLS.find((item) => item.id === initialProtocolId) ?? CRI_PROTOCOLS.find((item) => item.id === "propofol-status")!;
  const es = lang === "es";
  const [species, setSpecies] = useState<CriSpecies>("dog");
  const [protocolId, setProtocolId] = useState(initial.id);
  const [category, setCategory] = useState<string>(initial.category);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState("");
  const [mode, setMode] = useState<"direct" | "prepare">("prepare");
  const [doses, setDoses] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Record<string, ProductChoice>>({});
  const [patientRevision, setPatientRevision] = useState(0);
  const [priorPhenobarbital, setPriorPhenobarbital] = useState(false);
  const protocol = CRI_PROTOCOLS.find((item) => item.id === protocolId)!;
  const loading = protocol.administration === "loading";
  const eligible = CRI_PROTOCOLS.filter(
    (item) =>
      item.species.includes(species) &&
      (category === "all" || item.category === category) &&
      matchesCriProtocol(item, query),
  ).sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));
  const fmt = (value: number) =>
    new Intl.NumberFormat(es ? "es" : "en", {
      maximumSignificantDigits: 5,
    }).format(value);
  const clearPreparation = () => {
    setDoses({});
    setProducts({});
    setPriorPhenobarbital(false);
  };
  const choose = (item: CriProtocol) => {
    setProtocolId(item.id);
    setMode("prepare");
    clearPreparation();
  };
  const changeCategory = (value: string) => {
    setCategory(value);
    setQuery("");
    const next = CRI_PROTOCOLS.find(
      (item) =>
        item.species.includes(species) &&
        (value === "all" || item.category === value),
    );
    if (next) choose(next);
  };
  const categories = es
    ? [
        ["status", "Status epiléptico"],
        ["anesthesia", "Anestesia"],
        ["analgesia", "Analgesia"],
        ["critical", "Otros cuidados críticos"],
        ["all", "Todas las pautas"],
      ]
    : [
        ["status", "Status epilepticus"],
        ["anesthesia", "Anesthesia"],
        ["analgesia", "Analgesia"],
        ["critical", "Other critical care"],
        ["all", "All protocols"],
      ];
  const phenoProduct = productFor("pheno", products.pheno);
  const phenoDose = number(doses.pheno ?? "");
  const phenoOutside = Number.isFinite(phenoDose) && phenoDose !== 4;
  const phenoResult =
    priorPhenobarbital || phenoOutside
      ? null
      : calculateLoadingFraction(
          number(weight),
          phenoDose,
          number(phenoProduct.value),
        );

  return (
    <section className="cri-toolkit">
      <header className="cri-heading">
        <div>
          <p className="section-kicker">Toolkit · IV</p>
          <h3>
            {es ? "Infusión continua · CRI" : "Continuous infusion · CRI"}
          </h3>
          <p>
            {es
              ? "Indicación, producto y preparación. Dosis y fuentes en el mismo sitio."
              : "Indication, product and preparation. Doses and sources in one place."}
          </p>
        </div>
        <span className="cri-scope">
          {es ? "Perros y gatos" : "Dogs and cats"}
        </span>
      </header>
      <div className="cri-search">
        <label htmlFor="cri-search">{es ? "Buscar fármaco o indicación" : "Search drug or indication"}</label>
        <div className="cri-search-input">
          <span aria-hidden="true">⌕</span>
          <input id="cri-search" type="search" value={query}
            placeholder={es ? "Propofol convulsiones, ketamina, epilepsia, TIVA…" : "Propofol seizures, ketamine, epilepsy, TIVA…"}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value); setCategory("all");
              if (!matchesCriProtocol(protocol, value)) {
                const next = CRI_PROTOCOLS.find((item) => item.species.includes(species) && matchesCriProtocol(item, value));
                if (next) choose(next);
              }
            }} />
          {query && <button type="button" aria-label={es ? "Limpiar búsqueda CRI" : "Clear CRI search"} onClick={() => setQuery("")}>×</button>}
        </div>
        <p className="cri-search-hint">{es ? "Combina conceptos y palabras parciales: «propofol convuls» busca ambos." : "Combine concepts and partial words: “propofol seiz” matches both."}</p>
      </div>
      <div className="cri-patient">
        <label>
          {es ? "Especie" : "Species"}
          <select
            value={species}
            onChange={(event) => {
              const next = event.target.value as CriSpecies;
              setSpecies(next);
              setWeight("");
              setQuery("");
              setCategory("all");
              choose(
                CRI_PROTOCOLS.find(
                  (item) =>
                    item.species.includes(next) && item.category === "status",
                )!,
              );
            }}
          >
            <option value="dog">{es ? "Perro" : "Dog"}</option>
            <option value="cat">{es ? "Gato" : "Cat"}</option>
          </select>
        </label>
        <label>
          {es ? "Peso (kg)" : "Weight (kg)"}
          <input
            type="number"
            min="0.01"
            step="any"
            placeholder="kg"
            value={weight}
            aria-invalid={weight !== "" && !(number(weight) > 0)}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setWeight("");
            setPatientRevision((value) => value + 1);
            clearPreparation();
          }}
        >
          {es ? "Vaciar paciente" : "Clear patient"}
        </button>
      </div>
      <div
        className="cri-categories"
        role="group"
        aria-label={es ? "Indicaciones" : "Indications"}
      >
        {categories.map(([key, title]) => (
          <button
            type="button"
            key={key}
            aria-pressed={category === key}
            disabled={
              !CRI_PROTOCOLS.some(
                (item) =>
                  item.species.includes(species) &&
                  (key === "all" || item.category === key),
              )
            }
            onClick={() => changeCategory(key)}
          >
            {title}
          </button>
        ))}
      </div>
      <div className={`cri-layout ${mode === "prepare" && !loading ? "cri-layout-bags" : ""}`}>
        <aside className="cri-picker">
          <p className="cri-result-count" role="status">{eligible.length} {es ? (eligible.length === 1 ? "pauta disponible" : "pautas disponibles") : (eligible.length === 1 ? "protocol available" : "protocols available")}</p>
          <label className="cri-protocol-picker">
            {es ? "Fármaco / pauta" : "Drug / protocol"}
            <select
              aria-label={es ? "Fármaco / pauta" : "Drug / protocol"}
              value={protocolId}
              onChange={(event) => {
                const next = eligible.find(
                  (item) => item.id === event.target.value,
                );
                if (next) choose(next);
              }}
            >
              {eligible.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name[lang]}
                </option>
              ))}
            </select>
          </label>
          {eligible.length > 1 && <nav
            aria-label={
              es
                ? "Pautas de infusión y carga"
                : "Infusion and loading protocols"
            }
          >
            {eligible.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={protocolId === item.id}
                onClick={() => choose(item)}
              >
                <strong>{item.name[lang]}</strong>
                <span>{item.indication[lang]}</span>
              </button>
            ))}
          </nav>}
          {eligible.length === 0 && <p className="cri-muted">{es ? "Sin coincidencias para esta especie. Prueba otro término o cambia la especie." : "No matches for this species. Try another term or change species."}</p>}
        </aside>
        {eligible.length > 0 && <div className="cri-workspace">
          <div className="cri-protocol-heading">
            <h4>{protocol.name[lang]}</h4>
            <p>{protocol.indication[lang]}</p>
          </div>
          <p className="cri-warning">{protocol.caution[lang]}</p>
          {loading ? (
            <section className="cri-loading-workspace">
              <p className="cri-loading-kind">
                {es
                  ? "Carga IV fraccionada · se prepara cada fracción, no una bolsa de CRI."
                  : "Divided IV loading · prepare each fraction, not a CRI bag."}
              </p>
              <div className="cri-drug-inputs">
                <label>
                  {es
                    ? "Dosis de cada fracción (mg/kg)"
                    : "Dose per fraction (mg/kg)"}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={doses.pheno ?? ""}
                    aria-invalid={phenoOutside}
                    onChange={(event) =>
                      setDoses((current) => ({
                        ...current,
                        pheno: event.target.value,
                      }))
                    }
                  />
                </label>
                <ProductConcentration
                  lang={lang}
                  drugId="pheno"
                  selected={phenoProduct}
                  onChange={(choice) =>
                    setProducts((current) => ({ ...current, pheno: choice }))
                  }
                />
              </div>
              <button
                type="button"
                className="cri-reference-button"
                onClick={() =>
                  setDoses((current) => ({ ...current, pheno: "4" }))
                }
              >
                {es
                  ? "Usar referencia: 4 mg/kg por fracción"
                  : "Use reference: 4 mg/kg per fraction"}
              </button>
              <label className="cri-checkbox">
                <input
                  type="checkbox"
                  checked={priorPhenobarbital}
                  onChange={(event) =>
                    setPriorPhenobarbital(event.target.checked)
                  }
                />
                {es
                  ? "Ya recibe fenobarbital o ha recibido carga"
                  : "Already on phenobarbital or loading doses given"}
              </label>
              {priorPhenobarbital && (
                <p className="cri-warning" role="alert">
                  {es
                    ? "Revisar dosis acumuladas y niveles antes de calcular una nueva carga."
                    : "Review cumulative doses and levels before calculating a new load."}
                </p>
              )}
              {phenoOutside && (
                <p className="cri-warning" role="alert">
                  {es
                    ? "Fuera de la pauta citada de 4 mg/kg por fracción."
                    : "Outside the cited 4 mg/kg per-fraction protocol."}
                </p>
              )}
              <div className="cri-output" aria-live="polite">
                <div>
                  <span>{es ? "Una fracción" : "One fraction"}</span>
                  <strong>
                    {phenoResult ? fmt(phenoResult.mg) : "—"} <small>mg</small>
                  </strong>
                </div>
                <div>
                  <span>
                    {es
                      ? "Extraer del producto · antes de diluir"
                      : "Withdraw from product · before dilution"}
                  </span>
                  <strong>
                    {phenoResult ? fmt(phenoResult.stockMl) : "—"}{" "}
                    <small>mL</small>
                  </strong>
                </div>
              </div>
              <p className="cri-muted">
                {es
                  ? "Luminal 200 mg/mL: la ficha humana exige dilución IV en agua para inyectables (0,25–1 mL de producto en 10 mL de agua) y uso en 30 min. No trasladar la velocidad humana al paciente veterinario. Confirmar preparación individual."
                  : "Luminal 200 mg/mL: human product label requires IV dilution in water for injections (0.25–1 mL of product in 10 mL water) and use within 30 min. Do not apply human administration rates to veterinary patients. Confirm individual preparation."}
              </p>
              <a href={LUMINAL_SOURCE} target="_blank" rel="noreferrer">
                {es
                  ? "CIMA · preparación de Luminal"
                  : "CIMA · Luminal preparation"}{" "}
                ↗
              </a>
            </section>
          ) : (
            <>
              <div className="cri-modes" role="group" aria-label={es ? "Modo de cálculo" : "Calculation mode"}>
                <button type="button" aria-pressed={mode === "prepare"} onClick={() => setMode("prepare")}>{es ? "Preparar bolsa / jeringa" : "Prepare bag / syringe"}</button>
                <button type="button" aria-pressed={mode === "direct"} disabled={protocol.requiresDilution} onClick={() => setMode("direct")}>{es ? "Producto sin diluir → bomba" : "Undiluted product → pump"}</button>
              </div>
              {mode === "prepare"
                ? <CriBagPlanner key={`${protocol.id}-${species}-${patientRevision}`} lang={lang} protocol={protocol} species={species} weight={weight} />
                : <CriDirectCalculator key={`${protocol.id}-${species}-${patientRevision}`} lang={lang} protocol={protocol} species={species} weight={weight} />}
            </>
          )}
          <dl className="cri-guidance">
            <div>
              <dt>{es ? "Carga / inducción" : "Loading / induction"}</dt>
              <dd>{protocol.loading[lang]}</dd>
            </div>
            <div>
              <dt>{es ? "Monitorizar" : "Monitor"}</dt>
              <dd>{protocol.monitor[lang]}</dd>
            </div>
          </dl>
          <section className="cri-evidence">
            <h5>
              {es ? "Evidencia y citas" : "Evidence and citations"}
            </h5>
            <p>{protocol.evidence[lang]}</p>
            {protocol.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.label} ↗
              </a>
            ))}
          </section>
        </div>}
      </div>
      <footer className="cri-footer">
        {es
          ? "Apoyo al veterinario. Pautas de estudios potencialmente fuera de ficha: verificar producto, especie y normativa. Bolos separados de las CRI. Referencias revisadas: 22/10/2026."
          : "Veterinary decision support. Study protocols may be off-label: check product, species and regulations. Boluses separate from CRIs. References reviewed: 22 Oct 2026."}
      </footer>
    </section>
  );
}
