import { useState } from "react";
import type { Language } from "../i18n";
import {
  criDrugsForSpecies,
  CRI_PRESENTATIONS,
  type CriProtocol,
  type CriSpecies,
} from "../data/criProtocols";
import {
  CRI_FLUIDS,
  CRI_MIXTURE_NOTES,
  CRI_PREPARATION_RULES,
  CRI_PRODUCT_PREPARATION_NOTES,
  criFluidStatus,
  type CriFluid,
} from "../data/criPreparation";
import { calculateCriBag, criDoseAtPump, criMgKgHour } from "../lib/criMath";
import CriInfo from "./CriInfo";
import ProductConcentration, {
  number,
  productFor,
  type ProductChoice,
} from "./CriProductConcentration";

export default function CriBagPlanner({
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
  const drugs = criDrugsForSpecies(protocol, species);
  const [volume, setVolume] = useState("100");
  const [fluid, setFluid] = useState<CriFluid>("saline");
  const [planBy, setPlanBy] = useState<"pump" | "duration" | "concentration">(
    "duration",
  );
  const [planValue, setPlanValue] = useState("");
  const [doses, setDoses] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Record<string, ProductChoice>>({});
  const [runningPumps, setRunningPumps] = useState<Record<string, string>>({});
  const fmt = (value: number) =>
    new Intl.NumberFormat(es ? "es" : "en", {
      maximumSignificantDigits: 5,
    }).format(value);
  const w = number(weight),
    finalMl = number(volume),
    value = number(planValue);
  const chosenFluid = CRI_FLUIDS.find((item) => item.id === fluid)!;
  const ingredients = drugs.map((drug) => ({
    id: drug.id,
    dose: number(doses[drug.id] ?? ""),
    unit: drug.unit,
    stockMgMl: number(productFor(drug.id, products[drug.id]).value),
  }));
  const dosesValid = ingredients.every(
    (item, index) =>
      item.dose >= drugs[index].min && item.dose <= drugs[index].max,
  );
  const referencePump =
    planBy === "duration"
      ? finalMl / value
      : planBy === "concentration"
        ? (w * criMgKgHour(ingredients[0].dose, ingredients[0].unit)) / value
        : value;
  const bag = dosesValid
    ? calculateCriBag(w, finalMl, referencePump, ingredients, false)
    : null;
  const clearRunning = () => setRunningPumps({});
  const mixture = CRI_MIXTURE_NOTES[protocol.id];
  const presentationId = productFor(
    drugs[0].id,
    products[drugs[0].id],
  ).presentationId;
  const concentrationPresets =
    drugs.length === 1
      ? ((
          {
            dex500: [0.001, 0.0025, 0.003, 0.005],
            lipuro10: [2, 4, 5],
            ket50: [1, 2],
            midazolam5: [0.03, 0.05, 0.1, 0.15],
          } as Record<string, number[]>
        )[presentationId] ?? [])
      : [];
  const attempted =
    w > 0 &&
    finalMl > 0 &&
    value > 0 &&
    ingredients.every((item) => item.dose > 0 && item.stockMgMl > 0);
  const totalPump = bag?.drugs.reduce((total, row) => {
    const rate =
      runningPumps[row.id] === undefined
        ? referencePump
        : number(runningPumps[row.id]);
    return total + rate;
  }, 0);

  return (
    <section
      className="cri-bag-planner"
      aria-label={
        es ? "Preparación de bolsas y jeringas" : "Bag and syringe preparation"
      }
    >
      <div className="cri-bag-step cri-bag-config-fluid">
        <h5>
          <span>1</span>
          {es ? "Elige la bolsa y el fluido" : "Choose bag and fluid"}
        </h5>
        <div
          className="cri-volume-presets"
          role="group"
          aria-label={es ? "Tamaño de bolsa o jeringa" : "Bag or syringe size"}
        >
          {[20, 50, 100, 250, 500, 1000].map((ml) => (
            <button
              type="button"
              key={ml}
              aria-pressed={volume === String(ml)}
              onClick={() => {
                setVolume(String(ml));
                clearRunning();
              }}
            >
              {fmt(ml)} mL
            </button>
          ))}
        </div>
        <div className="cri-preparation-fields">
          <label>
            <span className="cri-inline-label">
              {es ? "Volumen final (mL)" : "Final volume (mL)"}
              <CriInfo
                label={
                  es ? "Información sobre volumen de bolsa" : "About bag volume"
                }
                text={
                  es
                    ? "El volumen final incluye el fármaco. Retira de una bolsa llena el volumen de producto que vas a añadir, o completa una jeringa hasta el volumen final."
                    : "Final volume includes the drug. Withdraw the product volume from a full bag before adding it, or make up a syringe to the final volume."
                }
              />
            </span>
            <input
              aria-label={es ? "Volumen final (mL)" : "Final volume (mL)"}
              type="number"
              min="0"
              step="any"
              value={volume}
              onChange={(event) => {
                setVolume(event.target.value);
                clearRunning();
              }}
            />
          </label>
          <label>
            {es ? "Fluido de la bolsa" : "Bag fluid"}
            <select
              aria-label={es ? "Fluido de la bolsa" : "Bag fluid"}
              value={fluid}
              onChange={(event) => {
                setFluid(event.target.value as CriFluid);
                clearRunning();
              }}
            >
              {CRI_FLUIDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name[lang]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {drugs.length > 1 && (
          <p className="cri-bag-separate">
            {es
              ? `${drugs.length} preparaciones separadas de ${volume || "—"} mL, una por fármaco. El volumen y el ritmo indicados se aplican a cada bolsa.`
              : `${drugs.length} separate ${volume || "—"} mL preparations, one per drug. The selected volume and preparation rate apply to each bag.`}
          </p>
        )}
      </div>

      <div className="cri-bag-step cri-bag-config-dose">
        <h5>
          <span>2</span>
          {es
            ? "Dosis, concentración y ritmo para preparar"
            : "Dose, stock concentration and preparation rate"}
        </h5>
        <div className="cri-preparation-fields">
          <label>
            {es ? "Preparar a partir de" : "Plan from"}
            <select
              aria-label={es ? "Preparar a partir de" : "Plan from"}
              value={planBy}
              onChange={(event) => {
                setPlanBy(event.target.value as typeof planBy);
                setPlanValue("");
                clearRunning();
              }}
            >
              <option value="pump">
                {es
                  ? "Velocidad de referencia de la bomba"
                  : "Reference pump rate"}
              </option>
              <option value="duration">
                {es ? "Horas que debe durar la bolsa" : "Planned bag duration"}
              </option>
              {drugs.length === 1 && (
                <option value="concentration">
                  {es ? "Concentración final" : "Final concentration"}
                </option>
              )}
            </select>
          </label>
          <label>
            {planBy === "pump"
              ? es
                ? "Velocidad para preparar (mL/h por bolsa)"
                : "Preparation rate (mL/h per bag)"
              : planBy === "duration"
                ? es
                  ? "Duración prevista (h)"
                  : "Planned duration (h)"
                : es
                  ? "Concentración final (mg/mL)"
                  : "Final concentration (mg/mL)"}
            <input
              aria-label={
                planBy === "pump"
                  ? es
                    ? "Velocidad para preparar (mL/h por bolsa)"
                    : "Preparation rate (mL/h per bag)"
                  : planBy === "duration"
                    ? es
                      ? "Duración prevista (h)"
                      : "Planned duration (h)"
                    : es
                      ? "Concentración final (mg/mL)"
                      : "Final concentration (mg/mL)"
              }
              type="number"
              min="0"
              step="any"
              value={planValue}
              onChange={(event) => {
                setPlanValue(event.target.value);
                clearRunning();
              }}
            />
          </label>
        </div>
        {concentrationPresets.length > 0 && (
          <div
            className="cri-concentration-presets"
            role="group"
            aria-label={
              es ? "Elegir concentración final" : "Choose final concentration"
            }
          >
            <span>
              {es
                ? "O elige una concentración final"
                : "Or choose a final concentration"}
            </span>
            {concentrationPresets.map((concentration) => (
              <button
                type="button"
                key={concentration}
                aria-pressed={
                  planBy === "concentration" &&
                  planValue === String(concentration)
                }
                onClick={() => {
                  setPlanBy("concentration");
                  setPlanValue(String(concentration));
                  clearRunning();
                }}
              >
                {fmt(
                  concentration < 0.01 ? concentration * 1000 : concentration,
                )}{" "}
                {concentration < 0.01 ? "µg/mL" : "mg/mL"}
              </button>
            ))}
          </div>
        )}
        <p className="cri-muted">
          {es
            ? "Este ritmo fija la composición de la bolsa. Después puedes ajustar la velocidad en el paso 3 sin cambiar la cantidad preparada. La carga o el bolo se consultan aparte."
            : "This rate fixes the bag composition. Then adjust delivery in step 3 without changing the prepared amounts. Loading doses and boluses are shown separately."}
        </p>
        <button
          type="button"
          className="cri-reference-button"
          onClick={() => {
            setDoses(
              Object.fromEntries(
                drugs.map((drug) => [drug.id, String(drug.min)]),
              ),
            );
            clearRunning();
          }}
        >
          {es
            ? "Usar dosis mínima de la pauta citada"
            : "Use minimum dose from cited protocol"}
        </button>
        {drugs.map((drug) => {
          const product = productFor(drug.id, products[drug.id]);
          const rule = CRI_PREPARATION_RULES[product.presentationId];
          const dose = number(doses[drug.id] ?? "");
          const outside =
            Number.isFinite(dose) && (dose < drug.min || dose > drug.max);
          const fluidStatus = criFluidStatus(product.presentationId, fluid);
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
                  {es ? "Dosis para preparar" : "Preparation dose"} ({drug.unit}
                  )
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={doses[drug.id] ?? ""}
                    aria-invalid={outside}
                    onChange={(event) => {
                      setDoses((current) => ({
                        ...current,
                        [drug.id]: event.target.value,
                      }));
                      clearRunning();
                    }}
                  />
                </label>
                <ProductConcentration
                  lang={lang}
                  drugId={drug.id}
                  selected={product}
                  seizureContext={protocol.category === "status"}
                  onChange={(choice) => {
                    setProducts((current) => ({
                      ...current,
                      [drug.id]: choice,
                    }));
                    clearRunning();
                  }}
                />
              </div>
              {outside && (
                <p className="cri-warning" role="alert">
                  {es
                    ? "Dosis fuera del intervalo de esta pauta. Revisa la indicación y las unidades."
                    : "Dose outside this protocol interval. Review indication and units."}
                </p>
              )}
              <div
                className={`cri-fluid-advice ${fluidStatus === "documented" ? "is-documented" : "is-unverified"}`}
              >
                <strong>
                  {fluidStatus === "documented"
                    ? es
                      ? "Fluido documentado para esta presentación"
                      : "Fluid documented for this product"
                    : fluidStatus === "unsupported"
                      ? es
                        ? "Fluido fuera de los indicados en la ficha"
                        : "Fluid outside those listed in the label"
                      : es
                        ? "Dilución sin verificar para esta presentación"
                        : "Dilution unverified for this product"}
                </strong>
                <p>
                  {rule?.advice[lang] ?? CRI_PRODUCT_PREPARATION_NOTES[product.presentationId]?.[lang] ??
                    (es
                      ? "No hay una recomendación de diluyente verificada para este producto en la biblioteca. El cálculo de cantidades no confirma compatibilidad ni estabilidad."
                      : "No verified diluent recommendation for this product is available in the library. Amount calculations do not establish compatibility or stability.")}
                </p>
                {(rule || CRI_PRODUCT_PREPARATION_NOTES[product.presentationId]) && (
                  <a
                    href={rule?.source ?? CRI_PRESENTATIONS[drug.id]?.find(item => item.id === product.presentationId)?.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {es
                      ? "Consultar ficha de preparación ↗"
                      : "Check preparation information ↗"}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {mixture && (
        <section
          className="cri-mixture-note"
          aria-label={
            es ? "Compatibilidad de la mezcla" : "Mixture compatibility"
          }
        >
          <h5>{es ? "¿Pueden ir juntos?" : "Can they be mixed?"}</h5>
          <p>{mixture.text[lang]}</p>
          <a href={mixture.source} target="_blank" rel="noreferrer">
            {es
              ? "Evidencia de compatibilidad ↗"
              : "Compatibility evidence ↗"}
          </a>
        </section>
      )}

      <div className="cri-bag-step cri-bag-review">
        <h5>
          <span>3</span>
          {es
            ? "Prepara la bolsa y ajusta la velocidad"
            : "Prepare the bag and adjust delivery"}
        </h5>
        {!bag && (
          <p className={attempted ? "cri-warning" : "cri-muted"} role="status">
            {attempted
              ? es
                ? "Preparación imposible o dosis fuera de pauta. Revisa si el volumen de producto supera el de la bolsa."
                : "Impossible preparation or dose outside protocol. Check whether stock volume exceeds bag volume."
              : es
                ? "Introduce el peso, la dosis, la concentración y el ritmo o duración para obtener la preparación."
                : "Enter weight, dose, stock concentration and rate or duration to calculate the preparation."}
          </p>
        )}
        {bag?.drugs.map((row, index) => {
          const drug = drugs[index];
          const product = productFor(drug.id, products[drug.id]);
          const rule = CRI_PREPARATION_RULES[product.presentationId];
          const status =
            (protocol.requiresDilution ||
              product.presentationId === "dex500") &&
            row.diluentMl === 0
              ? "unsupported"
              : criFluidStatus(product.presentationId, fluid, row.finalMgMl);
          const unsupported = status === "unsupported";
          const currentPump =
            runningPumps[drug.id] === undefined
              ? referencePump
              : number(runningPumps[drug.id]);
          const actualDose = criDoseAtPump(
            w,
            row.finalMgMl,
            currentPump,
            drug.unit,
          );
          const doseOutside =
            actualDose !== null &&
            (actualDose < drug.min * (1 - 1e-9) ||
              actualDose > drug.max * (1 + 1e-9));
          const minimumPump =
            (w * criMgKgHour(drug.min, drug.unit)) / row.finalMgMl;
          const maximumPump =
            (w * criMgKgHour(drug.max, drug.unit)) / row.finalMgMl;
          const hours =
            currentPump > 0 && Number.isFinite(currentPump)
              ? finalMl / currentPump
              : null;
          const maxHours =
            status === "documented"
              ? product.presentationId === "lipuro10" && row.diluentMl === 0
                ? 12
                : rule?.maxHours
              : undefined;
          return (
            <article
              className="cri-bag-result"
              key={row.id}
              aria-label={`${es ? "Preparación" : "Preparation"} ${drug.name[lang]}`}
            >
              <div className="cri-drug-heading">
                <strong>
                  {drug.name[lang]} · {fmt(finalMl)} mL
                </strong>
                <span>
                  {status === "documented"
                    ? es
                      ? "Dilución documentada"
                      : "Documented dilution"
                    : es
                      ? "Compatibilidad no validada"
                      : "Compatibility not validated"}
                </span>
              </div>
              {unsupported ? (
                <p className="cri-warning" role="alert">
                  {es
                    ? `Esta preparación queda fuera de los diluyentes o concentraciones documentados para el producto ${rule?.minMgMl !== undefined && rule?.maxMgMl !== undefined ? ` (${rule.minMgMl}–${rule.maxMgMl} mg/mL)` : ""}. Revisa la ficha antes de preparar.`
                    : `This preparation is outside the documented fluids or concentrations for this product ${rule?.minMgMl !== undefined && rule?.maxMgMl !== undefined ? ` (${rule.minMgMl}–${rule.maxMgMl} mg/mL)` : ""}. Check the label before preparing.`}
                </p>
              ) : (
                <>
                  {status === "unverified" && (
                    <p className="cri-warning">
                      {es
                        ? "Cantidades matemáticas para revisión; esta mezcla no tiene compatibilidad y estabilidad verificadas. No se presenta como una preparación validada."
                        : "Calculated quantities for review; compatibility and stability of this admixture are unverified. This is not a validated preparation."}
                    </p>
                  )}
                  <div className="cri-output cri-bag-recipe" aria-live="polite">
                    <div>
                      <span>
                        {status === "documented"
                          ? es
                            ? "Extraer del fármaco"
                            : "Withdraw stock drug"
                          : es
                            ? "Volumen calculado de fármaco"
                            : "Calculated stock volume"}
                      </span>
                      <strong>
                        {fmt(row.drugMl)} <small>mL</small>
                      </strong>
                      <small>{fmt(row.drugMl * row.stockMgMl)} mg</small>
                    </div>
                    <div>
                      <span>{es ? "Volumen de suero" : "Fluid volume"}</span>
                      <strong>
                        {fmt(finalMl - row.drugMl)} <small>mL</small>
                      </strong>
                      <small>{chosenFluid.name[lang]}</small>
                    </div>
                  </div>
                  <p className="cri-preparation-recipe">
                    {es ? "Volumen final" : "Final volume"}:{" "}
                    <strong>{fmt(finalMl)} mL</strong> ·{" "}
                    {es ? "Concentración final" : "Final concentration"}:{" "}
                    <strong>
                      {fmt(row.finalMgMl)} mg/mL
                      {row.finalMgMl < 0.1
                        ? ` (${fmt(row.finalMgMl * 1000)} µg/mL)`
                        : ""}
                    </strong>
                  </p>
                  <p className="cri-muted">
                    {status === "documented"
                      ? es
                        ? `Si partes de una bolsa llena de ${fmt(finalMl)} mL, retira ${fmt(row.drugMl)} mL antes de añadir el fármaco. Mezcla e identifica la preparación.`
                        : `If starting with a full ${fmt(finalMl)} mL bag, withdraw ${fmt(row.drugMl)} mL before adding the drug. Mix and label the preparation.`
                      : es
                        ? `El cálculo usa ${fmt(row.drugMl)} mL de producto dentro de ${fmt(finalMl)} mL finales. Verificar compatibilidad y estabilidad antes de preparar.`
                        : `The calculation uses ${fmt(row.drugMl)} mL of stock within ${fmt(finalMl)} mL final volume. Verify compatibility and stability before preparing.`}
                  </p>
                  <div className="cri-rate-adjustment">
                    <div>
                      <span className="cri-inline-label">
                        {es
                          ? "Velocidad inicial de referencia"
                          : "Initial reference rate"}
                        <CriInfo
                          label={
                            es
                              ? "Información sobre velocidad inicial"
                              : "About initial rate"
                          }
                          text={
                            es
                              ? "Ritmo calculado a la dosis mínima de esta pauta y para esta concentración. No es un bolo ni una orden automática de inicio: ajustar al paciente y a la respuesta."
                              : "Rate calculated at the minimum dose in this protocol and at this concentration. This is not a bolus or automatic start instruction: adjust to the patient and response."
                          }
                        />
                      </span>
                      <strong>{fmt(minimumPump)} mL/h</strong>
                      <small>
                        {fmt(drug.min)} {drug.unit}
                      </small>
                    </div>
                    <label>
                      {es ? "Velocidad elegida (mL/h)" : "Selected rate (mL/h)"}
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`${es ? "Velocidad elegida" : "Selected rate"} ${drug.name[lang]} (mL/h)`}
                        aria-invalid={doseOutside || !(currentPump > 0)}
                        value={runningPumps[drug.id] ?? String(referencePump)}
                        onChange={(event) =>
                          setRunningPumps((current) => ({
                            ...current,
                            [drug.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <p className="cri-rate-range">
                    {es
                      ? "Intervalo de bomba para la pauta citada"
                      : "Pump interval for the cited protocol"}
                    : {fmt(minimumPump)}
                    {minimumPump !== maximumPump
                      ? `–${fmt(maximumPump)}`
                      : ""}{" "}
                    mL/h
                  </p>
                  <div
                    className="cri-output cri-bag-delivery"
                    aria-live="polite"
                  >
                    <div>
                      <span>
                        {es
                          ? "Dosis a esta velocidad"
                          : "Dose at selected rate"}
                      </span>
                      <strong>
                        {actualDose !== null ? fmt(actualDose) : "—"}{" "}
                        <small>{drug.unit}</small>
                      </strong>
                    </div>
                    <div>
                      <span>
                        {es
                          ? "La cantidad preparada duraría"
                          : "Prepared volume would last"}
                      </span>
                      <strong>
                        {hours !== null ? fmt(hours) : "—"} <small>h</small>
                      </strong>
                    </div>
                  </div>
                  {doseOutside && (
                    <p className="cri-warning" role="alert">
                      {es
                        ? "La velocidad elegida da una dosis fuera de esta pauta. Revisa el ajuste antes de administrar."
                        : "Selected rate delivers a dose outside this protocol. Review before administration."}
                    </p>
                  )}
                  <p className="cri-volume-delivery">
                    {es ? "Aporte de esta bomba" : "Volume from this pump"}:{" "}
                    <strong>
                      {currentPump > 0 ? fmt(currentPump / w) : "—"} mL/kg/h
                    </strong>
                  </p>
                  <p
                    className={
                      maxHours !== undefined &&
                      hours !== null &&
                      hours > maxHours
                        ? "cri-warning"
                        : "cri-stability"
                    }
                  >
                    {maxHours !== undefined
                      ? es
                        ? `Usar o renovar antes de ${fmt(maxHours)} h desde la preparación${hours !== null && hours > maxHours ? `: aunque quede volumen, la autonomía de ${fmt(hours)} h supera ese límite` : ""}. `
                        : `Use or replace within ${fmt(maxHours)} h of preparation${hours !== null && hours > maxHours ? `: even with fluid remaining, the ${fmt(hours)} h volume duration exceeds that limit` : ""}. `
                      : es
                        ? "Límite de uso de esta dilución no establecido aquí. "
                        : "Use limit for this dilution is not established here. "}
                    {rule?.handling[lang]}
                  </p>
                  {(row.drugMl < 0.1 ||
                    (currentPump > 0 && currentPump < 0.1)) && (
                    <p className="cri-warning">
                      {es
                        ? "Volumen de producto o ritmo inferior a 0,1: verificar precisión de jeringa y bomba."
                        : "Stock volume or rate below 0.1: check syringe and pump accuracy."}
                    </p>
                  )}
                </>
              )}
            </article>
          );
        })}
        {bag &&
          bag.drugs.every(
            (row) =>
              criFluidStatus(
                productFor(row.id, products[row.id]).presentationId,
                fluid,
                row.finalMgMl,
              ) !== "unsupported",
          ) &&
          drugs.length > 1 &&
          totalPump !== undefined &&
          Number.isFinite(totalPump) &&
          totalPump > 0 && (
            <p className="cri-bag-total">
              {es
                ? "Suma de las bombas separadas"
                : "Total from separate pumps"}
              :{" "}
              <strong>
                {fmt(totalPump)} mL/h · {fmt(totalPump / w)} mL/kg/h
              </strong>
              .{" "}
              {es
                ? "Contabilizarla dentro del aporte hídrico total."
                : "Include this in total fluid intake."}
            </p>
          )}
      </div>
    </section>
  );
}
