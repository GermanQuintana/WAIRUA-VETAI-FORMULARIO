import {
  ChangeEvent,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import DentalChart, { DentalPerspective } from "./DentalChart";
import {
  DentalLang,
  DentalMark,
  DentalRecord,
  DentalStore,
  DentalTooth,
  emptyTooth,
  MARKS,
  markLabel,
  maximumDepth,
  meaningful,
  mergeRecords,
  newRecord,
  parseImport,
  revisionOf,
  setPeriodontal,
  SITES,
  storageKey,
  toggleMark,
  toothIds,
  unavailable,
} from "../lib/dental/model";
import {
  anesthesiaFields,
  blocks,
  clinicalFields,
  Field,
  fractureOptions,
  patientFields,
  procedures,
  reportText,
  views,
} from "../lib/dental/fields";
import "./dental-toolkit.css";

function initialStore(userId?: string): {
  store: DentalStore;
  healthy: boolean;
} {
  const fresh = newRecord();
  const fallback = { records: [fresh], currentId: fresh.id };
  if (!userId) return { store: fallback, healthy: true };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { store: fallback, healthy: true };
    const data = JSON.parse(raw);
    const { records } = parseImport(data);
    return {
      store: {
        records: records.length ? records : [fresh],
        currentId: records.some((r) => r.id === data.currentId)
          ? data.currentId
          : (records[0]?.id ?? fresh.id),
      },
      healthy: true,
    };
  } catch {
    return { store: fallback, healthy: false };
  }
}
function FieldInput({
  field,
  value,
  onChange,
  lang,
}: {
  field: Field;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  lang: DentalLang;
}) {
  const name = field[lang];
  return (
    <label
      className={
        field.type === "checkbox"
          ? "dental-check"
          : field.type === "textarea"
            ? "dental-long"
            : ""
      }
    >
      {field.type === "checkbox" ? (
        <>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          {name}
        </>
      ) : (
        <>
          {name}
          {field.options ? (
            <select
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">—</option>
              {field.options.map((o) => (
                <option key={o[0]} value={o[0]}>
                  {o[lang === "es" ? 1 : 2]}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              rows={3}
              value={String(value ?? "")}
              maxLength={12000}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              type={field.type ?? "text"}
              value={String(value ?? "")}
              maxLength={1000}
              min={field.type === "number" ? 0 : undefined}
              step={field.type === "number" ? "any" : undefined}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </>
      )}
    </label>
  );
}
export default function DentalToolkit({
  lang,
  userId,
  clinicName,
}: {
  lang: DentalLang;
  userId?: string;
  clinicName?: string;
}) {
  // Parent key remounts the workspace on account changes. Preview has no persistent patient store.
  return (
    <DentalWorkspace
      key={userId ?? "volatile-demo"}
      lang={lang}
      userId={userId}
      clinicName={clinicName}
    />
  );
}
function DentalWorkspace({
  lang,
  userId,
  clinicName,
}: {
  lang: DentalLang;
  userId?: string;
  clinicName?: string;
}) {
  const [initial] = useState(() => initialStore(userId));
  const [store, setStore] = useState(initial.store);
  const state = useRef(store);
  const healthy = useRef(initial.healthy);
  const conflict = useRef(false);
  const [saveError, setSaveError] = useState(!initial.healthy);
  const [externalChange, setExternalChange] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<keyof typeof views>("all");
  const [brush, setBrush] = useState<DentalMark | "select" | "erase" | "color">(
    "select",
  );
  const [color, setColor] = useState("#d35088");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [undoStack, setUndo] = useState<DentalRecord["teeth"][]>([]);
  const [redoStack, setRedo] = useState<DentalRecord["teeth"][]>([]);
  const upload = useRef<HTMLInputElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const stroke = useRef<{ done: Set<number>; add: boolean } | null>(null);
  const es = lang === "es";
  const t = (a: string, b: string) => (es ? a : b);
  const record =
    store.records.find((r) => r.id === store.currentId) ?? store.records[0];
  const current = () =>
    state.current.records.find((r) => r.id === state.current.currentId) ??
    state.current.records[0];
  const tooth =
    selected === null ? emptyTooth() : (record.teeth[selected] ?? emptyTooth());
  const ids = toothIds(record.species);
  const blocked = unavailable(tooth);
  function persist(next: DentalStore) {
    state.current = next;
    setStore(next);
    if (!userId || !healthy.current || conflict.current) return;
    try {
      localStorage.setItem(
        storageKey(userId),
        JSON.stringify({ app: "wairua-dental", version: 5, ...next }),
      );
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }
  function changeRecord(next: DentalRecord, timestamp = true) {
    const r = timestamp ? { ...next, updated: Date.now() } : next;
    persist({
      ...state.current,
      records: state.current.records.map((old) => (old.id === r.id ? r : old)),
    });
  }
  function resetHistory() {
    setUndo([]);
    setRedo([]);
    setSelected(null);
    setDeleteId(null);
  }
  function open(id: string) {
    persist({ ...state.current, currentId: id });
    resetHistory();
    setRecordsOpen(false);
  }
  function addRecord(r: DentalRecord) {
    persist({ records: [...state.current.records, r], currentId: r.id });
    resetHistory();
    setRecordsOpen(false);
  }
  function checkpoint() {
    const before = structuredClone(current().teeth);
    setUndo((old) => [...old.slice(-79), before]);
    setRedo([]);
  }
  function editTooth(id: number, next: DentalTooth, history = true) {
    if (history) checkpoint();
    const r = current();
    const teeth = { ...r.teeth };
    if (meaningful(next)) teeth[id] = next;
    else delete teeth[id];
    changeRecord({ ...r, teeth });
  }
  function setTooth(
    key: keyof Omit<DentalTooth, "findings" | "treatments" | "sites">,
    value: string,
  ) {
    if (selected === null) return;
    editTooth(
      selected,
      key === "pd" ? setPeriodontal(tooth, value) : { ...tooth, [key]: value },
    );
  }
  function undo() {
    if (!undoStack.length) return;
    const before = structuredClone(current().teeth);
    setRedo((old) => [...old, before]);
    changeRecord({ ...current(), teeth: undoStack[undoStack.length - 1] });
    setUndo((old) => old.slice(0, -1));
  }
  function redo() {
    if (!redoStack.length) return;
    const before = structuredClone(current().teeth);
    setUndo((old) => [...old, before]);
    changeRecord({ ...current(), teeth: redoStack[redoStack.length - 1] });
    setRedo((old) => old.slice(0, -1));
  }
  function fieldChange(key: string, value: string | boolean) {
    const r = current();
    changeRecord({ ...r, fields: { ...r.fields, [key]: value } });
  }
  useEffect(() => {
    if (!userId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(userId) || e.key === null) {
        conflict.current = true;
        setExternalChange(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add("dental-printing");
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        try {
          window.print();
        } catch {
          setPrinting(false);
        }
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      document.body.classList.remove("dental-printing");
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);
  function reloadSaved() {
    const loaded = initialStore(userId);
    healthy.current = loaded.healthy;
    conflict.current = false;
    setExternalChange(false);
    setSaveError(!loaded.healthy);
    state.current = loaded.store;
    setStore(loaded.store);
    resetHistory();
  }
  function download(all = false) {
    const payload = {
      app: "wairua-dental",
      version: 5,
      ...(all ? { records: state.current.records } : { record: current() }),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = all
      ? "wairua-dental-backup.json"
      : `wairua-dental-${current().fields.fecha || "record"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 20_000_000) throw Error();
      // Validate every record before changing anything; an invalid backup cannot partially mutate the store.
      const parsed = parseImport(JSON.parse(await file.text()));
      const incoming = parsed.single
        ? parsed.records.map((r) => ({
            ...r,
            id: crypto.randomUUID(),
            updated: Date.now(),
          }))
        : parsed.records;
      const previous = state.current;
      const records = mergeRecords(previous.records, incoming);
      persist({
        records,
        currentId: parsed.single
          ? incoming[0].id
          : records.some((r) => r.id === previous.currentId)
            ? previous.currentId
            : records[0].id,
      });
      resetHistory();
      setMessage(
        t(
          "Importación completada. Las fichas individuales se abren como copia.",
          "Import completed. Individual records open as copies.",
        ),
      );
    } catch {
      setMessage(
        t(
          "Archivo no válido o demasiado grande (máx. 20 MB). No se han modificado las fichas.",
          "Invalid or oversized file (max 20 MB). Records have not been changed.",
        ),
      );
    }
  }
  function brushTooth(id: number, add: boolean) {
    const before = current().teeth[id] ?? emptyTooth();
    const next =
      brush === "erase"
        ? emptyTooth()
        : brush === "color"
          ? { ...before, color: add ? color : "" }
          : brush === "select"
            ? before
            : toggleMark(before, brush, add);
    editTooth(id, next, false);
  }
  function targetId(target: EventTarget | null) {
    const el =
      target instanceof Element
        ? target.closest<HTMLElement>("[data-tooth],[data-pick]")
        : null;
    const id = Number(el?.dataset.tooth ?? el?.dataset.pick);
    return ids.includes(id) ? id : null;
  }
  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const id = targetId(e.target);
    if (id === null) return;
    setSelected(id);
    if (brush === "select") return;
    e.preventDefault();
    checkpoint();
    const before = current().teeth[id] ?? emptyTooth();
    const add =
      brush === "color"
        ? before.color !== color
        : brush === "erase"
          ? true
          : ![...before.findings, ...before.treatments].includes(brush);
    stroke.current = { done: new Set([id]), add };
    e.currentTarget.setPointerCapture(e.pointerId);
    brushTooth(id, add);
  }
  function pointerMove(e: PointerEvent<HTMLDivElement>) {
    const active = stroke.current;
    if (!active) return;
    const id = targetId(document.elementFromPoint(e.clientX, e.clientY));
    if (id === null || active.done.has(id)) return;
    active.done.add(id);
    setSelected(id);
    brushTooth(id, active.add);
  }
  function chartKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!["Enter", " "].includes(e.key)) return;
    const id = targetId(e.target);
    if (id === null) return;
    e.preventDefault();
    setSelected(id);
    if (brush !== "select") {
      checkpoint();
      const before = current().teeth[id] ?? emptyTooth();
      brushTooth(
        id,
        brush === "color"
          ? before.color !== color
          : brush === "erase"
            ? true
            : ![...before.findings, ...before.treatments].includes(brush),
      );
    }
  }
  function selectSpecies(species: "dog" | "cat") {
    if (species === record.species) return;
    const r = newRecord(species);
    for (const key of [
      "paciente",
      "historia",
      "tutor",
      "telefono",
      "veterinario",
      "clinica",
    ])
      if (record.fields[key]) r.fields[key] = record.fields[key];
    addRecord(r);
    setMessage(
      t(
        "Nueva ficha de la otra especie. La anterior se conserva.",
        "New record for the other species. The previous one is retained.",
      ),
    );
  }
  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText(record, lang));
      setMessage(t("Informe copiado.", "Report copied."));
    } catch {
      setMessage(
        t(
          "No se pudo acceder al portapapeles. Puedes imprimir el informe.",
          "Clipboard unavailable. You can print the report.",
        ),
      );
    }
  }
  const formFields = (fields: Field[]) => (
    <div className="dental-fields">
      {fields.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          value={record.fields[f.key]}
          onChange={(v) => fieldChange(f.key, v)}
          lang={lang}
        />
      ))}
    </div>
  );
  const toothSelect = (
    key: "pd" | "mobility" | "furca" | "fx" | "tr" | "trtipo",
    label: string,
    values: readonly (readonly [string, string, string])[],
    disabled = false,
  ) => (
    <label>
      {label}
      <select
        value={tooth[key]}
        disabled={disabled}
        onChange={(e) => setTooth(key, e.target.value)}
      >
        <option value="">—</option>
        {values.map((o) => (
          <option key={o[0]} value={o[0]}>
            {o[lang === "es" ? 1 : 2]}
          </option>
        ))}
      </select>
    </label>
  );
  const numbered = (
    values: string[],
    prefix: string,
  ): [string, string, string][] =>
    values.map((v) => [v, prefix + v, prefix + v]);
  const mmInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    disabled = false,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min="0"
        max="30"
        step="0.5"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || (Number.isFinite(+v) && +v >= 0 && +v <= 30))
            onChange(v);
        }}
      />
    </label>
  );
  const filtered = [...store.records]
    .sort((a, b) => b.updated - a.updated)
    .filter((r) =>
      [r.fields.paciente, r.fields.tutor, r.fields.historia].some((v) =>
        String(v ?? "")
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
      ),
    );
  return (
    <section
      className="dental-toolkit"
      aria-label={t("Ficha dental", "Dental chart")}
      onKeyDown={(e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === "z" &&
          !(
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
          )
        ) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
      }}
    >
      <header className="dental-heading">
        <div>
          <span className="eyebrow">{t("ODONTOLOGÍA", "DENTISTRY")}</span>
          <h3>{t("Ficha dental", "Dental chart")}</h3>
          <p>
            {t(
              "Odontograma, periodonto y seguimiento de perros y gatos.",
              "Dental charting, periodontal records and follow-up for dogs and cats.",
            )}
          </p>
        </div>
        <div className="dental-actions">
          <button
            onClick={() => setRecordsOpen(!recordsOpen)}
            aria-expanded={recordsOpen}
          >
            {t("Mis fichas", "My records")} ({store.records.length})
          </button>
          <button onClick={() => addRecord(newRecord(record.species))}>
            {t("Nueva ficha", "New record")}
          </button>
          <button onClick={() => addRecord(revisionOf(record))}>
            {t("Nueva revisión", "New review")}
          </button>
        </div>
      </header>
      <p className="dental-storage" role="status">
        {externalChange
          ? t(
              "Otra pestaña ha cambiado las fichas. Exporta los cambios locales antes de recargar.",
              "Another tab changed the records. Export local changes before reloading.",
            )
          : saveError
            ? t(
                "No se pudo guardar. Exporta una copia; el almacenamiento anterior se conserva.",
                "Saving failed. Export a backup; previous storage is preserved.",
              )
            : userId
              ? t(
                  "Guardado local por usuario · solo en este navegador. Exporta una copia para conservarla o trasladarla.",
                  "Saved locally per user · this browser only. Export a backup to retain or transfer records.",
                )
              : t(
                  "Vista de demostración · cambios en memoria, sin guardado al cerrar la herramienta.",
                  "Demo view · changes stay in memory and are not saved when the tool closes.",
                )}{" "}
        {externalChange && (
          <button onClick={reloadSaved}>
            {t("Recargar fichas guardadas", "Reload saved records")}
          </button>
        )}
      </p>
      <div className="dental-actions dental-file-actions">
        <button onClick={copyReport}>
          {t("Copiar informe", "Copy report")}
        </button>
        <button onClick={() => upload.current?.click()}>
          {t("Importar JSON", "Import JSON")}
        </button>
        <button onClick={() => download()}>
          {t("Exportar ficha", "Export record")}
        </button>
        <button onClick={() => download(true)}>
          {t("Copia de todas", "Back up all")}
        </button>
        <button onClick={() => setPrinting(true)}>
          {t("Imprimir / PDF", "Print / PDF")}
        </button>
        <input
          ref={upload}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label={t("Archivo de fichas dentales", "Dental records file")}
          onChange={importFile}
        />
      </div>
      <div role="status" className="dental-message">
        {message}
      </div>
      {recordsOpen && (
        <section
          className="dental-records"
          aria-label={t("Fichas guardadas", "Saved records")}
        >
          <label>
            {t(
              "Buscar paciente, tutor o historia",
              "Search patient, owner or record",
            )}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {filtered.map((r) => (
            <article key={r.id}>
              <div>
                <strong>
                  {r.fields.paciente || t("Sin nombre", "Unnamed")}
                </strong>
                <small>
                  {r.fields.fecha} ·{" "}
                  {r.species === "dog" ? t("Perro", "Dog") : t("Gato", "Cat")} ·{" "}
                  {r.fields.historia} · {r.fields.tutor}
                </small>
              </div>
              <button onClick={() => open(r.id)}>{t("Abrir", "Open")}</button>
              <button onClick={() => addRecord(revisionOf(r))}>
                {t("Revisión", "Review")}
              </button>
              {deleteId === r.id ? (
                <>
                  <button
                    onClick={() => {
                      const remaining = state.current.records.filter(
                        (row) => row.id !== r.id,
                      );
                      if (!remaining.length) remaining.push(newRecord());
                      persist({
                        records: remaining,
                        currentId:
                          store.currentId === r.id
                            ? remaining[0].id
                            : store.currentId,
                      });
                      resetHistory();
                    }}
                  >
                    {t("Confirmar eliminación", "Confirm deletion")}
                  </button>
                  <button onClick={() => setDeleteId(null)}>
                    {t("Cancelar", "Cancel")}
                  </button>
                </>
              ) : (
                <button onClick={() => setDeleteId(r.id)}>
                  {t("Eliminar", "Delete")}
                </button>
              )}
            </article>
          ))}
          {!filtered.length && (
            <p>{t("No hay coincidencias.", "No matching records.")}</p>
          )}
        </section>
      )}
      <details open className="dental-section">
        <summary>
          {t("Paciente", "Patient")} ·{" "}
          {record.fields.paciente || t("Sin nombre", "Unnamed")}
        </summary>
        {formFields(patientFields)}
      </details>
      <section className="dental-section">
        <div className="dental-section-heading">
          <h4>{t("Odontograma", "Odontogram")}</h4>
          <div
            className="dental-actions"
            role="group"
            aria-label={t("Especie", "Species")}
          >
            <button
              aria-pressed={record.species === "dog"}
              onClick={() => selectSpecies("dog")}
            >
              {t("Perro", "Dog")}
            </button>
            <button
              aria-pressed={record.species === "cat"}
              onClick={() => selectSpecies("cat")}
            >
              {t("Gato", "Cat")}
            </button>
          </div>
        </div>
        <p className="dental-help">
          {ids.length}{" "}
          {t(
            "piezas permanentes · Triadan modificado. Derecha e izquierda corresponden al paciente.",
            "permanent teeth · Modified Triadan. Right and left refer to the patient.",
          )}
        </p>
        <div
          className="dental-actions"
          role="group"
          aria-label={t("Vista dental", "Dental view")}
        >
          {(Object.keys(views) as (keyof typeof views)[]).map((k) => (
            <button
              key={k}
              aria-pressed={view === k}
              onClick={() => setView(k)}
            >
              {views[k][es ? 0 : 1]}
            </button>
          ))}
          <button disabled={!undoStack.length} onClick={undo}>
            {t("Deshacer", "Undo")}
          </button>
          <button disabled={!redoStack.length} onClick={redo}>
            {t("Rehacer", "Redo")}
          </button>
        </div>
        <div
          className="dental-palette"
          role="group"
          aria-label={t("Pinceles", "Marking tools")}
        >
          <button
            aria-pressed={brush === "select"}
            onClick={() => setBrush("select")}
          >
            {t("Seleccionar", "Select")}
          </button>
          <button
            aria-pressed={brush === "erase"}
            onClick={() => setBrush("erase")}
          >
            {t("Borrar pieza", "Clear tooth")}
          </button>
          {(Object.keys(MARKS) as DentalMark[]).map((k) => (
            <button
              key={k}
              aria-pressed={brush === k}
              onClick={() => setBrush(k)}
            >
              <i style={{ background: MARKS[k][2] }} />
              {markLabel(k, lang)}
            </button>
          ))}
          <button
            aria-pressed={brush === "color"}
            onClick={() => setBrush("color")}
          >
            {t("Color libre", "Custom colour")}
          </button>
          <input
            type="color"
            value={color}
            aria-label={t("Color de marcado", "Marking colour")}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <p className="dental-help">
          {brush === "select"
            ? t(
                "Selecciona una pieza para editarla.",
                "Select a tooth to edit it.",
              )
            : t(
                "Pulsa o arrastra para aplicar el pincel. Borrar pieza elimina todo su registro; puedes deshacer.",
                "Click or drag to apply the tool. Clear tooth removes its entire record; you can undo.",
              )}{" "}
          <button
            className="dental-jump"
            disabled={selected === null}
            onClick={() => {
              inspector.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              inspector.current?.focus();
            }}
          >
            {t("Editar pieza seleccionada", "Edit selected tooth")} {selected}
          </button>
        </p>
        <div className="dental-workspace">
          <div className="dental-diagrams">
            {view === "perio" ? (
              <div
                className="dental-table-scroll"
                tabIndex={0}
                aria-label={t("Tabla periodontal", "Periodontal table")}
              >
                <table>
                  <caption>
                    {t(
                      "Registro periodontal por pieza. Pulsa un número para editar.",
                      "Periodontal record by tooth. Select a number to edit.",
                    )}
                  </caption>
                  <thead>
                    <tr>
                      {[
                        t("Pieza", "Tooth"),
                        "PD",
                        "M",
                        "F",
                        t("Máx. mm", "Max mm"),
                        ...SITES,
                      ].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ids.map((n) => {
                      const d = record.teeth[n] ?? emptyTooth();
                      return (
                        <tr
                          key={n}
                          className={
                            n === selected ? "dental-row-selected" : ""
                          }
                        >
                          <th scope="row">
                            <button
                              aria-pressed={n === selected}
                              onClick={() => setSelected(n)}
                            >
                              {n}
                            </button>
                          </th>
                          {unavailable(d) ? (
                            <td colSpan={10}>
                              {d.treatments.includes("extraccion")
                                ? t("Exodoncia", "Extraction")
                                : t("Ausente", "Missing")}
                            </td>
                          ) : (
                            <>
                              {[
                                d.pd,
                                d.mobility,
                                d.furca,
                                maximumDepth(d),
                                ...SITES.map((s) => d.sites[s]),
                              ].map((v, i) => (
                                <td key={i}>{v || "—"}</td>
                              ))}
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={`dental-charts ${view === "all" ? "dental-multiview" : ""} ${brush !== "select" ? "dental-brushing" : ""}`}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={() => {
                  stroke.current = null;
                }}
                onPointerCancel={() => {
                  stroke.current = null;
                }}
                onLostPointerCapture={() => {
                  stroke.current = null;
                }}
                onKeyDown={chartKey}
              >
                {(
                  [
                    "occlusal",
                    "right",
                    "left",
                    "rostral",
                  ] as DentalPerspective[]
                )
                  .filter((p) => view === "all" || view === p)
                  .map((p) => (
                    <DentalChart
                      key={p}
                      record={record}
                      perspective={p}
                      selected={selected}
                      lang={lang}
                    />
                  ))}
              </div>
            )}
            <details className="dental-number-picker">
              <summary>
                {t(
                  "Seleccionar por número Triadan",
                  "Select by Triadan number",
                )}
              </summary>
              {[1, 2, 3, 4].map((q) => (
                <div key={q} className="dental-actions">
                  {toothIds(record.species, q).map((n) => (
                    <button
                      key={n}
                      aria-pressed={selected === n}
                      onClick={() => setSelected(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ))}
            </details>
          </div>
          <aside
            ref={inspector}
            tabIndex={-1}
            className="dental-inspector"
            aria-label={t("Registro por pieza", "Tooth record")}
          >
            <h4>
              {selected === null
                ? t("Registro por pieza", "Tooth record")
                : t("Pieza ", "Tooth ") + selected}
            </h4>
            {selected === null ? (
              <p>
                {t(
                  "Selecciona una pieza del dibujo o de la lista Triadan.",
                  "Select a tooth in the diagram or Triadan list.",
                )}
              </p>
            ) : (
              <>
                <div className="dental-actions">
                  <button
                    disabled={ids.indexOf(selected) === 0}
                    aria-label={t("Pieza anterior", "Previous tooth")}
                    onClick={() => setSelected(ids[ids.indexOf(selected) - 1])}
                  >
                    ←
                  </button>
                  <button
                    disabled={ids.indexOf(selected) === ids.length - 1}
                    aria-label={t("Pieza siguiente", "Next tooth")}
                    onClick={() => setSelected(ids[ids.indexOf(selected) + 1])}
                  >
                    →
                  </button>
                </div>
                {(["f", "t"] as const).map((group) => (
                  <fieldset key={group}>
                    <legend>
                      {group === "f"
                        ? t("Hallazgos", "Findings")
                        : t("Tratamientos", "Treatments")}
                    </legend>
                    <div className="dental-mark-list">
                      {(Object.keys(MARKS) as DentalMark[])
                        .filter((k) => MARKS[k][3] === group)
                        .map((k) => (
                          <label key={k} className="dental-check">
                            <input
                              type="checkbox"
                              checked={[
                                ...tooth.findings,
                                ...tooth.treatments,
                              ].includes(k)}
                              onChange={() =>
                                editTooth(selected, toggleMark(tooth, k))
                              }
                            />
                            <i style={{ background: MARKS[k][2] }} />
                            {markLabel(k, lang)}
                          </label>
                        ))}
                    </div>
                  </fieldset>
                ))}
                {tooth.findings.includes("fractura") &&
                  toothSelect(
                    "fx",
                    t("Fractura (AVDC)", "Fracture (AVDC)"),
                    fractureOptions,
                  )}
                {tooth.findings.includes("reabsorcion") && (
                  <div className="dental-tooth-grid">
                    {toothSelect(
                      "tr",
                      t("Estadio reabsorción", "Resorption stage"),
                      numbered(
                        ["1", "2", "3", "4", "4a", "4b", "4c", "5"],
                        "TR",
                      ),
                    )}
                    {toothSelect(
                      "trtipo",
                      t("Tipo radiográfico", "Radiographic type"),
                      numbered(["1", "2", "3"], "T"),
                    )}
                  </div>
                )}
                <fieldset disabled={blocked}>
                  <legend>{t("Periodonto", "Periodontium")}</legend>
                  <div className="dental-tooth-grid">
                    {toothSelect(
                      "pd",
                      t("Estadio periodontal", "Periodontal stage"),
                      numbered(["0", "1", "2", "3", "4"], "PD"),
                    )}
                    {toothSelect(
                      "mobility",
                      t("Movilidad", "Mobility"),
                      numbered(["0", "1", "2", "3"], "M"),
                    )}
                    {toothSelect(
                      "furca",
                      t("Furca", "Furcation"),
                      numbered(["1", "2", "3"], "F"),
                    )}
                    {mmInput(
                      t(
                        "Sondaje máx. previo (mm)",
                        "Previous max probing (mm)",
                      ),
                      tooth.depth,
                      (v) => setTooth("depth", v),
                    )}
                    {mmInput(
                      t("Recesión (mm)", "Recession (mm)"),
                      tooth.recesion,
                      (v) => setTooth("recesion", v),
                    )}
                  </div>
                  <p className="dental-help">
                    {t(
                      "Sondaje en seis puntos (mm): mesial, central y distal, vestibular y lingual/palatino.",
                      "Six-site probing (mm): mesial, central and distal, buccal and lingual/palatal.",
                    )}
                  </p>
                  <div className="dental-sites">
                    {SITES.map((site) => (
                      <span key={site}>
                        {mmInput(site, tooth.sites[site], (v) =>
                          editTooth(selected, {
                            ...tooth,
                            sites: { ...tooth.sites, [site]: v },
                          }),
                        )}
                      </span>
                    ))}
                  </div>
                  <label>
                    {t(
                      "Sondaje previo / notas de superficies",
                      "Previous probing / surface notes",
                    )}
                    <input
                      value={tooth.probing}
                      maxLength={12000}
                      onChange={(e) => setTooth("probing", e.target.value)}
                    />
                  </label>
                </fieldset>
                {blocked && (
                  <p className="dental-help">
                    {t(
                      "Pieza ausente o extraída: periodonto desactivado; los datos previos se conservan.",
                      "Missing or extracted tooth: periodontal editing disabled; previous data is retained.",
                    )}
                  </p>
                )}
                <label>
                  {t("Notas de la pieza", "Tooth notes")}
                  <textarea
                    value={tooth.notes}
                    rows={3}
                    maxLength={12000}
                    onChange={(e) => setTooth("notes", e.target.value)}
                  />
                </label>
                <label>
                  {t("Color de la pieza", "Tooth colour")}
                  <input
                    type="color"
                    value={tooth.color || color}
                    onChange={(e) => setTooth("color", e.target.value)}
                  />
                </label>
                <div className="dental-actions">
                  <button onClick={() => setTooth("color", "")}>
                    {t("Quitar color", "Remove colour")}
                  </button>
                  <button onClick={() => editTooth(selected, emptyTooth())}>
                    {t("Borrar registro de pieza", "Clear tooth record")}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
      <section className="dental-section">
        <h4>
          {t("Resumen de la exploración", "Examination summary")} ·{" "}
          {Object.keys(record.teeth).length}/{ids.length}
        </h4>
        {Object.entries(record.teeth).length ? (
          <ul className="dental-summary">
            {Object.entries(record.teeth)
              .sort(([a], [b]) => +a - +b)
              .map(([n, d]) => (
                <li key={n}>
                  <button
                    onClick={() => {
                      setSelected(+n);
                      inspector.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {n}
                  </button>
                  <span>
                    {[...d.findings, ...d.treatments]
                      .map((k) => markLabel(k, lang))
                      .join(" · ")}
                    {d.pd !== "" && ` · PD${d.pd}`}
                    {maximumDepth(d) !== "" && ` · ${maximumDepth(d)} mm`}
                    {d.fx && ` · ${d.fx}`}
                    {d.tr && ` · TR${d.tr}`}
                    {d.trtipo && ` · T${d.trtipo}`}
                    <small>{d.notes}</small>
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p>{t("Sin piezas registradas.", "No teeth recorded.")}</p>
        )}
      </section>
      <details className="dental-section">
        <summary>
          {t(
            "Diagnóstico, procedimientos y seguimiento",
            "Diagnosis, procedures and follow-up",
          )}
        </summary>
        {formFields(clinicalFields)}
        <h4>{t("Procedimientos realizados", "Procedures performed")}</h4>
        {formFields(procedures)}
      </details>
      <details className="dental-section">
        <summary>
          {t("Parte anestésico y cierre", "Anaesthetic record and closure")}
        </summary>
        {formFields(anesthesiaFields)}
        <h4>{t("Bloqueos locorregionales", "Locoregional blocks")}</h4>
        {formFields(blocks)}
      </details>
      <details className="dental-section">
        <summary>
          {t("Referencia clínica y alcance", "Clinical reference and scope")}
        </summary>
        <p>
          {t(
            "Registro de dentición permanente. Los dibujos son esquemáticos. El estadio periodontal lo asigna el veterinario por pieza; el sondaje por sí solo no determina el estadio.",
            "Permanent dentition recording. Illustrations are schematic. Periodontal stage is assigned by the veterinarian for each tooth; probing depth alone does not determine the stage.",
          )}
        </p>
        <p>
          PD0: {t("sin enfermedad evidente", "no evident disease")} · PD1:{" "}
          {t(
            "gingivitis sin pérdida de inserción",
            "gingivitis without attachment loss",
          )}{" "}
          · PD2: &lt;25% · PD3: 25–50% · PD4: &gt;50%{" "}
          {t("de pérdida de inserción.", "attachment loss.")}
        </p>
        <p>
          {t(
            "Las radiografías se documentan como texto o referencia externa. La identificación veterinaria es un campo de texto, sin firma digital.",
            "Radiographs are recorded as text or external references. Veterinarian identification is a text field, without a digital signature.",
          )}
        </p>
        <a
          href="https://avdc.org/avdc-nomenclature/"
          target="_blank"
          rel="noreferrer"
        >
          AVDC ·{" "}
          {t("Nomenclatura y clasificación", "Nomenclature and classification")}
        </a>
      </details>
      {printing &&
        createPortal(
          <div className="dental-print-root">
            <style>
              {"@media print { @page { size: 210mm 297mm; margin: 12mm; } }"}
            </style>
            <header>
              <img
                src={`${import.meta.env.BASE_URL}favicon-wairua-128.png`}
                alt=""
              />
              <div>
                <strong>
                  WAIRUA VetAI · {t("Ficha dental", "Dental chart")}
                </strong>
                <p>
                  {record.fields.paciente || t("Sin nombre", "Unnamed")} ·{" "}
                  {record.fields.fecha} · {record.fields.historia || ""}
                </p>
                <p>{record.fields.clinica || clinicName || ""}</p>
              </div>
            </header>
            <div className="dental-print-diagrams">
              {(
                ["occlusal", "right", "left", "rostral"] as DentalPerspective[]
              ).map((p) => (
                <DentalChart
                  key={p}
                  record={record}
                  perspective={p}
                  selected={null}
                  lang={lang}
                  interactive={false}
                />
              ))}
            </div>
            <pre>{reportText(record, lang)}</pre>
          </div>,
          document.body,
        )}
    </section>
  );
}
