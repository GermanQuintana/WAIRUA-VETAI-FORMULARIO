# Ficha dental / Dental chart

Native React/TypeScript Toolkit module with dog (42) and cat (30) permanent dentition, four linked schematic SVG views, per-tooth findings and treatments, six-site periodontal probing, reviews, clinical/anesthesia notes, JSON backups and browser print/PDF.

## Provenance and scope

- The vector atlas and legacy import conventions were adapted from the user-supplied `A_Marosa_Dental_v4.zip` (29 October 2026). `src/lib/dental/atlas.js` contains only the original schematic geometry, isolated as an ES module; it has no record storage or global application state.
- Clinical nomenclature reference: [American Veterinary Dental College](https://avdc.org/avdc-nomenclature/), consulted 29 October 2026. The diagrams are not represented as AVDC-authored images or clinically validated anatomical models.
- Stage selection is manual. A probing measurement or a manually selected periodontal finding does not automatically assign a disease stage. Selecting PD explicitly reconciles the gingivitis/periodontal marks, including removal of stale marks when changing to PD0.
- Permanent dentition only. Radiographs are text/external references, not uploaded image files. Veterinarian identification is text, not a digital signature. Copying the report provides a manual handoff to clinical software; there is no automatic ARK integration.

## Storage and account isolation

- Authenticated records are saved immediately to `wairua:dental:v1:user:<profile.id>` in this browser's local storage. Changing accounts remounts the workspace. There is no shared clinic database or cloud synchronization.
- The unauthenticated/local-preview workspace is memory-only and explains this in the interface. It never opens another account's records or automatically adopts the standalone app's shared local storage.
- Quota/access errors are visible. An invalid existing store is preserved, while the in-memory workspace remains exportable. Exports are the supported backup/transfer mechanism; clearing browser storage removes local records.
- Cross-tab storage changes stop subsequent local writes until the user reloads saved records. The interface prompts the user to export unsaved local changes first.

## Import and migration

The export format is `app: wairua-dental`, `version: 5`, with either `record` or `records`. Individual imports receive a new ID. Bulk restore retains IDs and replaces only older records, including the currently open record, without refreshing its imported timestamp.

Import supports standalone Marosa v2–v4 exports and its older `campos`/`dientes` or `odontograma` format. Legacy free-text probing is retained alongside the new six-site values. All records are validated before applying a bulk import; an invalid entry cannot partly change the store. Limits include a 20 MB input file, valid species/tooth IDs, known finding/treatment codes, bounded numeric measurements and hex colours. Unknown application identities or unsupported versions are rejected.

## Verification

- `npm run build`
- `node scripts/verify-dental.mjs`: PD transitions, atomic restore, current-record replacement, legacy migration, invalid measurements/colours, six-site roundtrip, review identity and account keys.
- Browser checks: ES/EN; light/dark; desktop and 390 px; input persistence; account switching; undo/redo and brush strokes; cat tooth count; extracted-to-missing review; backup download; print/PDF in A4 portrait.

The print portal mounts only while printing. Its temporary page rule isolates dental A4 portrait output from the application's existing anesthesia landscape print styles. Portal styles and the body print class are removed on completion/unmount.
