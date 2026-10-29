import type { DentalSpecies } from "./model";
declare const atlas: {
  occlusal(species: DentalSpecies): SVGSVGElement;
  finishOcclusal(svg: SVGSVGElement): void;
  lateral(side: "right" | "left", species: DentalSpecies): SVGSVGElement;
  rostral(species: DentalSpecies): SVGSVGElement;
};
export default atlas;
