import type { Language } from "../i18n";
import { CRI_PRESENTATIONS } from "../data/criProtocols";
import CriInfo from "./CriInfo";

export type ProductChoice = { value: string; presentationId: string };
export const number = (value: string) => (value.trim() ? Number(value) : NaN);
export function productFor(
  drugId: string,
  selected?: ProductChoice,
): ProductChoice {
  const first = CRI_PRESENTATIONS[drugId]?.[0];
  return (
    selected ?? {
      value: first ? String(first.mgMl) : "",
      presentationId: first?.id ?? "custom",
    }
  );
}
export default function ProductConcentration({
  lang,
  drugId,
  selected,
  onChange,
  seizureContext = false,
}: {
  lang: Language;
  drugId: string;
  selected: ProductChoice;
  onChange: (choice: ProductChoice) => void;
  seizureContext?: boolean;
}) {
  const es = lang === "es";
  const options = CRI_PRESENTATIONS[drugId] ?? [];
  const presentation = options.find(
    (item) => item.id === selected.presentationId,
  );
  const source = presentation?.source;
  const fmt = (value: number) => new Intl.NumberFormat(es ? "es" : "en").format(value);
  return (
    <div className="cri-product-field">
      <label>
        {es
          ? "Producto / concentración utilizada"
          : "Product / concentration used"}
        <select
          value={selected.presentationId}
          onChange={(event) => {
            const next = options.find((item) => item.id === event.target.value);
            onChange({
              presentationId: event.target.value,
              value: next ? String(next.mgMl) : "",
            });
          }}
        >
          {options.map((item) => (
            <option value={item.id} key={item.id}>
              {es
                ? item.label
                : item.labelEn ?? item.label
                    .replace(/Ketamina/g, "Ketamine")
                    .replace(/Dexmedetomidina/g, "Dexmedetomidine")
                    .replace("0,5", "0.5")}
            </option>
          ))}
          <option value="custom">
            {es
              ? "Otra concentración / solución ya diluida"
              : "Other concentration / prediluted solution"}
          </option>
        </select>
      </label>
      <label>
        <span className="cri-inline-label">
          {es ? "Concentración (mg/mL)" : "Concentration (mg/mL)"}
          <CriInfo
            label={
              es ? "Información sobre concentración" : "About concentration"
            }
            text={
              es
                ? "Introduce mg por mL, no mg totales del vial. Ej.: 15 mg/3 mL = 5 mg/mL; 500 µg/mL = 0,5 mg/mL. Confirma si el etiquetado expresa base o sal."
                : "Enter mg per mL, not total mg in the vial. E.g. 15 mg/3 mL = 5 mg/mL; 500 µg/mL = 0.5 mg/mL. Check whether the label states base or salt."
            }
          />
        </span>
        <input
          type="number"
          aria-label={es ? "Concentración (mg/mL)" : "Concentration (mg/mL)"}
          min="0"
          step="any"
          value={selected.value}
          readOnly={selected.presentationId !== "custom"}
          aria-invalid={!!selected.value && !(number(selected.value) > 0)}
          onChange={(event) =>
            onChange({ presentationId: "custom", value: event.target.value })
          }
        />
      </label>
      {presentation?.vialMl && (
        <p className="cri-product-help cri-inline-label">
          {es ? "Frasco" : "Vial"}: {fmt(presentation.vialMl)} mL · {fmt(presentation.vialMl * presentation.mgMl)} mg
          <CriInfo
            label={es ? "Información sobre el frasco" : "About vial volume"}
            text={es
              ? "Es el contenido total del frasco, no la cantidad que debes añadir al suero. Utiliza los mL de fármaco calculados en la preparación. El formato autorizado no garantiza disponibilidad comercial."
              : "This is the full vial content, not the amount to add to the fluid. Use the stock volume calculated in the preparation. An authorized pack size does not guarantee commercial availability."}
          />
        </p>
      )}
      {seizureContext && presentation?.seizureRestriction && (
        <p className="cri-warning">
          {presentation.label.split(" · ")[0]}: {presentation.seizureRestriction === "contraindicated"
            ? es ? "su ficha contraindica los trastornos convulsivos. La pauta de rescate ACVIM requiere justificación individual de uso fuera de ficha."
              : "the label contraindicates seizure disorders. The ACVIM rescue protocol requires individual off-label justification."
            : es ? "su ficha exige precaución en trastornos convulsivos. El rescate del status no es una indicación autorizada del producto."
              : "the label requires caution in seizure disorders. Status rescue is not an authorized product indication."}
        </p>
      )}
      {source && (
        <a
          className="cri-product-source"
          href={source}
          target="_blank"
          rel="noreferrer"
        >
          {es
            ? "Ficha del producto · comprobar envase"
            : "Product information · check container"}{" "}
          ↗
        </a>
      )}
    </div>
  );
}
