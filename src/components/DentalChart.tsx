import { useId, useLayoutEffect, useRef } from "react";
import atlas from "../lib/dental/atlas";
import {
  DentalLang,
  DentalRecord,
  DentalTooth,
  emptyTooth,
  MARKS,
  markLabel,
} from "../lib/dental/model";
import { views } from "../lib/dental/fields";

export type DentalPerspective = "occlusal" | "right" | "left" | "rostral";
export default function DentalChart({
  record,
  perspective,
  selected,
  lang,
  interactive = true,
}: {
  record: DentalRecord;
  perspective: DentalPerspective;
  selected: number | null;
  lang: DentalLang;
  interactive?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const prefix = useId().replace(/[^a-z0-9]/gi, "");
  useLayoutEffect(() => {
    const root = host.current;
    if (!root) return;
    const svg =
      perspective === "occlusal"
        ? atlas.occlusal(record.species)
        : perspective === "rostral"
          ? atlas.rostral(record.species)
          : atlas.lateral(perspective, record.species);
    root.replaceChildren(svg);
    if (perspective === "occlusal") atlas.finishOcclusal(svg);
    // Keep atlas paint servers local to this instance, including the separate print portal.
    for (const element of svg.querySelectorAll<SVGElement>("[id]")) {
      const old = element.id;
      const next = prefix + "-" + perspective + "-atlas-" + old;
      element.id = next;
      for (const target of svg.querySelectorAll("*"))
        for (const attr of [...target.attributes]) {
          if (attr.value.includes(`url(#${old})`))
            target.setAttribute(
              attr.name,
              attr.value.split(`url(#${old})`).join(`url(#${next})`),
            );
          else if (attr.value === `#${old}`)
            target.setAttribute(attr.name, `#${next}`);
        }
    }
    svg.setAttribute("aria-label", views[perspective][lang === "es" ? 0 : 1]);
    for (const text of svg.querySelectorAll("text")) {
      if (lang === "en")
        text.textContent = (text.textContent ?? "")
          .replace(
            "DERECHA  ·  PACIENTE  ·  IZQUIERDA",
            "RIGHT  ·  PATIENT  ·  LEFT",
          )
          .replace("DCHA.", "RIGHT")
          .replace("IZDA.", "LEFT");
    }
    return () => {
      root.replaceChildren();
    };
  }, [record.species, perspective, lang, prefix]);
  useLayoutEffect(() => {
    const svg = host.current?.querySelector("svg");
    if (!svg) return;
    svg.querySelector(".dental-marks-defs")?.remove();
    const ns = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(ns, "defs");
    defs.classList.add("dental-marks-defs");
    svg.prepend(defs);
    for (const el of svg.querySelectorAll<SVGElement>(
      "[data-tooth],[data-pick]",
    )) {
      const n = Number(el.dataset.tooth ?? el.dataset.pick);
      const t: DentalTooth = record.teeth[n] ?? emptyTooth();
      const marks = [...t.findings, ...t.treatments];
      el.classList.toggle("selected", n === selected);
      el.classList.toggle("is-absent", t.findings.includes("ausente"));
      el.classList.toggle("is-extracted", t.treatments.includes("extraccion"));
      el.classList.toggle("marked", marks.length > 0 || Boolean(t.color));
      const label =
        (lang === "es" ? "Pieza " : "Tooth ") +
        n +
        (marks.length
          ? ", " + marks.map((k) => markLabel(k, lang)).join(", ")
          : "");
      el.setAttribute("aria-label", label);
      el.setAttribute("aria-pressed", String(n === selected));
      const title = el.querySelector("title");
      if (title) title.textContent = label;
      if (!interactive) {
        el.removeAttribute("tabindex");
        el.removeAttribute("role");
      }
      let fill = t.color;
      const colors = marks.map((k) => MARKS[k][2]);
      if (!fill && colors.length === 1) fill = colors[0];
      if (!fill && colors.length > 1) {
        const id = prefix + "-" + perspective + "-" + n;
        let gradient = defs.querySelector("#" + id);
        if (!gradient) {
          gradient = document.createElementNS(ns, "linearGradient");
          gradient.id = id;
          gradient.setAttribute("x2", "0");
          gradient.setAttribute("y2", "1");
          for (const [i, color] of colors.entries())
            for (const offset of [i / colors.length, (i + 1) / colors.length]) {
              const stop = document.createElementNS(ns, "stop");
              stop.setAttribute("offset", String(offset));
              stop.setAttribute("stop-color", color);
              gradient.append(stop);
            }
          defs.append(gradient);
        }
        fill = `url(#${id})`;
      }
      for (const shape of el.querySelectorAll<SVGElement>(".crown")) {
        if (fill) shape.style.fill = fill;
        else shape.style.removeProperty("fill");
      }
    }
  }, [
    record.teeth,
    record.species,
    perspective,
    selected,
    lang,
    prefix,
    interactive,
  ]);
  return (
    <div className="dental-chart-panel">
      <h4>{views[perspective][lang === "es" ? 0 : 1]}</h4>
      <div ref={host} className="dental-svg-host" />
    </div>
  );
}
