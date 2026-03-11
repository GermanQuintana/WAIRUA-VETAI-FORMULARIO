import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';
import { translateMedicalTerm } from '../lib/terms';
import { DoseCalculatorPreset, EditorialStatus, EvidenceLevel, Species, TherapeuticEntry } from '../types';

interface SubmitResult {
  persisted: boolean;
  message: string;
  entry?: TherapeuticEntry;
}

interface Props {
  lang: Language;
  speciesOptions: Species[];
  systemOptions: string[];
  tagOptions: string[];
  initialEntry?: TherapeuticEntry | null;
  onSubmit: (entry: TherapeuticEntry, mode: 'create' | 'edit') => Promise<SubmitResult>;
  onCancelEdit?: () => void;
}

interface PresetDraft {
  id: string;
  categoryEs: string;
  categoryEn: string;
  species: Species | '';
  route: string;
  indicationEs: string;
  indicationEn: string;
  minDose: string;
  maxDose: string;
  defaultDose: string;
  concentrationEs: string;
  concentrationEn: string;
  mgPerMl: string;
  mgPerTablet: string;
  referencesInput: string;
}

const evidenceOptions: EvidenceLevel[] = ['High', 'Moderate', 'Low', 'Expert Consensus'];
const editorialStatusOptions: EditorialStatus[] = ['draft', 'under_review', 'approved'];

const editorialStatusLabel = (status: EditorialStatus, lang: Language) => {
  if (lang === 'es') {
    if (status === 'draft') return 'Borrador';
    if (status === 'under_review') return 'En revision';
    return 'Aprobado';
  }

  if (status === 'draft') return 'Draft';
  if (status === 'under_review') return 'Under review';
  return 'Approved';
};

const emptyPreset = (): PresetDraft => ({
  id: crypto.randomUUID(),
  categoryEs: '',
  categoryEn: '',
  species: '',
  route: 'PO',
  indicationEs: '',
  indicationEn: '',
  minDose: '',
  maxDose: '',
  defaultDose: '',
  concentrationEs: '',
  concentrationEn: '',
  mgPerMl: '',
  mgPerTablet: '',
  referencesInput: '',
});

const presetToDraft = (preset: DoseCalculatorPreset): PresetDraft => ({
  id: preset.id,
  categoryEs: preset.category.es,
  categoryEn: preset.category.en,
  species: preset.species[0] ?? '',
  route: preset.route,
  indicationEs: preset.indication.es,
  indicationEn: preset.indication.en,
  minDose: String(preset.doseRangeMgKg.min),
  maxDose: String(preset.doseRangeMgKg.max),
  defaultDose: String(preset.defaultDoseMgKg),
  concentrationEs: preset.concentration.es,
  concentrationEn: preset.concentration.en,
  mgPerMl: preset.concentration.mgPerMl?.toString() ?? '',
  mgPerTablet: preset.concentration.mgPerTablet?.toString() ?? '',
  referencesInput: (preset.references ?? []).map((reference) => [reference.title, reference.url].filter(Boolean).join(' | ')).join('\n'),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const splitList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseReferences = (value: string, prefix: string) =>
  value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
    const [title, url] = line.split('|').map((item) => item.trim());
    return {
      id: `${prefix}-ref-${index + 1}`,
      title: title || `Reference ${index + 1}`,
      authors: 'Contributor submission',
      year: new Date().getFullYear(),
      source: 'WAIRUA VetAI',
      url: url || undefined,
    };
  });

export default function ActiveIngredientForm({
  lang,
  speciesOptions,
  systemOptions,
  tagOptions,
  initialEntry,
  onSubmit,
  onCancelEdit,
}: Props) {
  const text = useMemo(
    () =>
      lang === 'es'
        ? {
            createKicker: 'Alta editorial',
            editKicker: 'Edicion editorial',
            createTitle: 'Nueva ficha de principio activo',
            editTitle: 'Editar ficha de principio activo',
            createSubtitle:
              'Crea una ficha simple por principio activo. Puedes dejar listas varias presentaciones y varios presets de dosis por especie e indicacion para reutilizarlos luego en el toolkit.',
            editSubtitle:
              'Actualiza la ficha, sus presentaciones y sus presets de dosis. Los cambios se reflejan en consulta, edicion y calculadora.',
            activeIngredient: 'Principio activo',
            tradeNames: 'Nombres comerciales',
            tradeHint: 'Separados por coma',
            species: 'Especies',
            tags: 'Tags clinicas',
            customTags: 'Tags personalizadas',
            customTagsHint: 'Ejemplo: Vomito, Digestivo, UCI, Dermatologia',
            pathologies: 'Indicaciones/patologias',
            concentrations: 'Presentaciones disponibles',
            concentrationsHint: 'Una por linea o separadas por coma. Ejemplo: oral 50 mg, inyectable 10 mg/mL, topico 1%',
            indications: 'Indicaciones resumidas',
            dosage: 'Dosis resumidas',
            administrationConditions: 'Condiciones de administracion',
            adverseEffects: 'Efectos adversos',
            contraindications: 'Contraindicaciones',
            interactions: 'Interacciones',
            notes: 'Notas',
            languageNote: 'La ficha se completa en el idioma que estes usando ahora mismo.',
            evidence: 'Nivel de evidencia',
            editorialStatus: 'Estado editorial',
            references: 'Referencias',
            referencesHint: 'Formato por linea: Titulo | URL',
            presets: 'Dosis y presentaciones para toolkit',
            presetsHint:
              'Añade una fila por especie/indicacion/via. El mismo principio activo puede tener varias presentaciones y varias dosis.',
            addPreset: 'Añadir preset',
            removePreset: 'Eliminar',
            saveCreate: 'Crear ficha',
            saveEdit: 'Guardar cambios',
            cancelEdit: 'Cancelar edicion',
            successCreate: 'Ficha creada.',
            successEdit: 'Ficha actualizada.',
            category: 'Categoria',
            route: 'Via',
            indicationPreset: 'Indicacion del preset',
            minDose: 'Min mg/kg',
            maxDose: 'Max mg/kg',
            defaultDose: 'Dosis por defecto',
            concentration: 'Presentacion para el preset',
            mgPerMl: 'mg/mL',
            mgPerTablet: 'mg/comprimido',
            required: 'Completa al menos principio activo y una especie.',
          }
        : {
            createKicker: 'Editorial intake',
            editKicker: 'Editorial edit',
            createTitle: 'New active ingredient record',
            editTitle: 'Edit active ingredient record',
            createSubtitle:
              'Create a simple active-ingredient record. You can add several presentations and several dosing presets by species and indication so the toolkit can reuse them later.',
            editSubtitle:
              'Update the record, its presentations, and its dosing presets. Changes propagate to lookup, editing, and the calculator.',
            activeIngredient: 'Active ingredient',
            tradeNames: 'Trade names',
            tradeHint: 'Comma-separated',
            species: 'Species',
            tags: 'Clinical tags',
            customTags: 'Custom tags',
            customTagsHint: 'Example: Vomiting, Digestive, ICU, Dermatology',
            pathologies: 'Indications/pathologies',
            concentrations: 'Available presentations',
            concentrationsHint: 'One per line or comma-separated. Example: oral 50 mg, injectable 10 mg/mL, topical 1%',
            indications: 'Indications summary',
            dosage: 'Dose summary',
            administrationConditions: 'Administration conditions',
            adverseEffects: 'Adverse effects',
            contraindications: 'Contraindications',
            interactions: 'Interactions',
            notes: 'Notes',
            languageNote: 'The record is edited in the language currently selected in the app.',
            evidence: 'Evidence level',
            editorialStatus: 'Editorial status',
            references: 'References',
            referencesHint: 'Line format: Title | URL',
            presets: 'Dose and presentation presets for toolkit',
            presetsHint:
              'Add one row per species/indication/route. The same active ingredient can have multiple presentations and multiple doses.',
            addPreset: 'Add preset',
            removePreset: 'Remove',
            saveCreate: 'Create record',
            saveEdit: 'Save changes',
            cancelEdit: 'Cancel edit',
            successCreate: 'Record created.',
            successEdit: 'Record updated.',
            category: 'Category',
            route: 'Route',
            indicationPreset: 'Preset indication',
            minDose: 'Min mg/kg',
            maxDose: 'Max mg/kg',
            defaultDose: 'Default dose',
            concentration: 'Preset presentation',
            mgPerMl: 'mg/mL',
            mgPerTablet: 'mg/tablet',
            required: 'Complete at least active ingredient and one species.',
          },
    [lang],
  );

  const [activeIngredient, setActiveIngredient] = useState('');
  const [tradeNames, setTradeNames] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState('');
  const [pathologies, setPathologies] = useState('');
  const [concentrations, setConcentrations] = useState('');
  const [indicationsEs, setIndicationsEs] = useState('');
  const [indicationsEn, setIndicationsEn] = useState('');
  const [dosageEs, setDosageEs] = useState('');
  const [dosageEn, setDosageEn] = useState('');
  const [administrationConditionsEs, setAdministrationConditionsEs] = useState('');
  const [administrationConditionsEn, setAdministrationConditionsEn] = useState('');
  const [adverseEffectsEs, setAdverseEffectsEs] = useState('');
  const [adverseEffectsEn, setAdverseEffectsEn] = useState('');
  const [contraindicationsEs, setContraindicationsEs] = useState('');
  const [contraindicationsEn, setContraindicationsEn] = useState('');
  const [interactionsEs, setInteractionsEs] = useState('');
  const [interactionsEn, setInteractionsEn] = useState('');
  const [notesEs, setNotesEs] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [evidenceLevel, setEvidenceLevel] = useState<EvidenceLevel>('Moderate');
  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>('draft');
  const [referencesInput, setReferencesInput] = useState('');
  const [presets, setPresets] = useState<PresetDraft[]>([emptyPreset()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(initialEntry);
  const isSpanish = lang === 'es';

  const toggleArrayValue = <T,>(current: T[], value: T) =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const localizedValue = (es: string, en: string) => (isSpanish ? es : en);
  const setLocalizedValue = (
    value: string,
    setEs: (next: string) => void,
    setEn: (next: string) => void,
  ) => {
    if (isSpanish) {
      setEs(value);
      if (!indicationsEn && setEn === setIndicationsEn) setEn(value);
      if (!dosageEn && setEn === setDosageEn) setEn(value);
      if (!administrationConditionsEn && setEn === setAdministrationConditionsEn) setEn(value);
      if (!adverseEffectsEn && setEn === setAdverseEffectsEn) setEn(value);
      if (!contraindicationsEn && setEn === setContraindicationsEn) setEn(value);
      if (!interactionsEn && setEn === setInteractionsEn) setEn(value);
      if (!notesEn && setEn === setNotesEn) setEn(value);
    } else {
      setEn(value);
      if (!indicationsEs && setEs === setIndicationsEs) setEs(value);
      if (!dosageEs && setEs === setDosageEs) setEs(value);
      if (!administrationConditionsEs && setEs === setAdministrationConditionsEs) setEs(value);
      if (!adverseEffectsEs && setEs === setAdverseEffectsEs) setEs(value);
      if (!contraindicationsEs && setEs === setContraindicationsEs) setEs(value);
      if (!interactionsEs && setEs === setInteractionsEs) setEs(value);
      if (!notesEs && setEs === setNotesEs) setEs(value);
    }
  };

  const populateForm = (entry?: TherapeuticEntry | null) => {
    if (!entry) {
      setActiveIngredient('');
      setTradeNames('');
      setSelectedSpecies([]);
      setSelectedTags([]);
      setCustomTags('');
      setPathologies('');
      setConcentrations('');
      setIndicationsEs('');
      setIndicationsEn('');
      setDosageEs('');
      setDosageEn('');
      setAdministrationConditionsEs('');
      setAdministrationConditionsEn('');
      setAdverseEffectsEs('');
      setAdverseEffectsEn('');
      setContraindicationsEs('');
      setContraindicationsEn('');
      setInteractionsEs('');
      setInteractionsEn('');
      setNotesEs('');
      setNotesEn('');
      setEvidenceLevel('Moderate');
      setEditorialStatus('draft');
      setReferencesInput('');
      setPresets([emptyPreset()]);
      return;
    }

    setActiveIngredient(entry.activeIngredient);
    setTradeNames(entry.tradeNames.join(', '));
    setSelectedSpecies(entry.species);
    setSelectedTags(tagOptions.filter((tag) => [...entry.tags, ...entry.systems].includes(tag)));
    setCustomTags(entry.tags.filter((tag) => !tagOptions.includes(tag)).join(', '));
    setPathologies(entry.pathologies.join(', '));
    setConcentrations(entry.concentrations.join(', '));
    setIndicationsEs(entry.indications.es);
    setIndicationsEn(entry.indications.en);
    setDosageEs(entry.dosage.es);
    setDosageEn(entry.dosage.en);
    setAdministrationConditionsEs(entry.administrationConditions.es);
    setAdministrationConditionsEn(entry.administrationConditions.en);
    setAdverseEffectsEs(entry.adverseEffects.es);
    setAdverseEffectsEn(entry.adverseEffects.en);
    setContraindicationsEs(entry.contraindications.es);
    setContraindicationsEn(entry.contraindications.en);
    setInteractionsEs(entry.interactions.es);
    setInteractionsEn(entry.interactions.en);
    setNotesEs(entry.notes?.es ?? '');
    setNotesEn(entry.notes?.en ?? '');
    setEvidenceLevel(entry.evidenceLevel);
    setEditorialStatus(entry.editorialStatus);
    setReferencesInput(
      entry.references
        .map((reference) => [reference.title, reference.url].filter(Boolean).join(' | '))
        .join('\n'),
    );
    setPresets(entry.calculatorPresets?.length ? entry.calculatorPresets.map(presetToDraft) : [emptyPreset()]);
  };

  useEffect(() => {
    populateForm(initialEntry);
    setError('');
    setSuccess('');
  }, [initialEntry, tagOptions]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!activeIngredient.trim() || selectedSpecies.length === 0) {
      setError(text.required);
      return;
    }

    const mergedTags = Array.from(new Set([...selectedTags, ...splitList(customTags)]));
    const derivedSystems = mergedTags.filter((tag) => systemOptions.includes(tag));
    const concentrationList = splitList(concentrations);
    const references = parseReferences(referencesInput, slugify(activeIngredient));

    const calculatorPresets = presets
      .filter((preset) => preset.species && preset.route && preset.indicationEs && preset.minDose && preset.maxDose && preset.defaultDose)
      .map((preset) => ({
        id: preset.id,
        category: { es: preset.categoryEs || 'General', en: preset.categoryEn || 'General' },
        species: [preset.species as Species],
        route: preset.route,
        indication: {
          es: preset.indicationEs,
          en: preset.indicationEn || preset.indicationEs,
        },
        doseRangeMgKg: {
          min: Number(preset.minDose),
          max: Number(preset.maxDose),
        },
        defaultDoseMgKg: Number(preset.defaultDose),
        concentration: {
          es: preset.concentrationEs || concentrationList[0] || '',
          en: preset.concentrationEn || preset.concentrationEs || concentrationList[0] || '',
          mgPerMl: preset.mgPerMl ? Number(preset.mgPerMl) : undefined,
          mgPerTablet: preset.mgPerTablet ? Number(preset.mgPerTablet) : undefined,
        },
        references: parseReferences(preset.referencesInput, `${slugify(activeIngredient)}-${preset.id}`),
      }));

    const entry: TherapeuticEntry = {
      id: initialEntry?.id ?? `${slugify(activeIngredient)}-${Date.now().toString().slice(-6)}`,
      activeIngredient: activeIngredient.trim(),
      tradeNames: splitList(tradeNames),
      species: selectedSpecies,
      tags: mergedTags,
      systems: derivedSystems,
      pathologies: splitList(pathologies),
      concentrations: concentrationList,
      indications: {
        es: indicationsEs.trim(),
        en: indicationsEn.trim() || indicationsEs.trim(),
      },
      dosage: {
        es: dosageEs.trim(),
        en: dosageEn.trim() || dosageEs.trim(),
      },
      administrationConditions: {
        es: administrationConditionsEs.trim(),
        en: administrationConditionsEn.trim() || administrationConditionsEs.trim(),
      },
      adverseEffects: {
        es: adverseEffectsEs.trim(),
        en: adverseEffectsEn.trim() || adverseEffectsEs.trim(),
      },
      contraindications: {
        es: contraindicationsEs.trim(),
        en: contraindicationsEn.trim() || contraindicationsEs.trim(),
      },
      interactions: {
        es: interactionsEs.trim(),
        en: interactionsEn.trim() || interactionsEs.trim(),
      },
      notes:
        notesEs.trim() || notesEn.trim()
          ? {
              es: notesEs.trim(),
              en: notesEn.trim() || notesEs.trim(),
            }
          : undefined,
      evidenceLevel,
      editorialStatus,
      calculatorPresets,
      references,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    try {
      const result = await onSubmit(entry, isEditing ? 'edit' : 'create');
      if (isEditing) {
        populateForm(result.entry ?? entry);
      } else {
        populateForm(null);
      }
      setSuccess(result.message || (isEditing ? text.successEdit : text.successCreate));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unknown error');
    }
  };

  return (
    <section className="entry-form-shell">
      <div className="entry-form-header">
        <div>
          <p className="section-kicker">{isEditing ? text.editKicker : text.createKicker}</p>
          <h3>{isEditing ? text.editTitle : text.createTitle}</h3>
          <p>{isEditing ? text.editSubtitle : text.createSubtitle}</p>
          <p className="entry-form-language-note">{text.languageNote}</p>
        </div>
        {isEditing && onCancelEdit && (
          <button type="button" className="secondary-button" onClick={onCancelEdit}>
            {text.cancelEdit}
          </button>
        )}
      </div>

      <form className="entry-form" onSubmit={submit}>
        <div className="search-grid">
          <label>
            {text.activeIngredient}
            <input value={activeIngredient} onChange={(event) => setActiveIngredient(event.target.value)} />
          </label>
          <label>
            {text.tradeNames}
            <input value={tradeNames} onChange={(event) => setTradeNames(event.target.value)} placeholder={text.tradeHint} title={text.tradeHint} />
          </label>
          <label>
            {text.pathologies}
            <input value={pathologies} onChange={(event) => setPathologies(event.target.value)} placeholder={text.tradeHint} title={text.tradeHint} />
          </label>
          <label>
            {text.concentrations}
            <input
              value={concentrations}
              onChange={(event) => setConcentrations(event.target.value)}
              placeholder={text.concentrationsHint}
              title={text.concentrationsHint}
            />
          </label>
        </div>

        <section className="entry-form-block">
          <h4>{text.species}</h4>
          <div className="tag-chip-list">
            {speciesOptions.map((species) => (
              <button
                key={species}
                type="button"
                className={selectedSpecies.includes(species) ? 'active' : ''}
                onClick={() => setSelectedSpecies((current) => toggleArrayValue(current, species))}
              >
                {translateMedicalTerm(species, lang)}
              </button>
            ))}
          </div>
        </section>

        <section className="entry-form-block">
          <h4>{text.tags}</h4>
          <div className="tag-chip-list">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={selectedTags.includes(tag) ? 'active' : ''}
                onClick={() => setSelectedTags((current) => toggleArrayValue(current, tag))}
              >
                {translateMedicalTerm(tag, lang)}
              </button>
            ))}
          </div>
          <label>
            {text.customTags}
            <input value={customTags} onChange={(event) => setCustomTags(event.target.value)} placeholder={text.customTagsHint} title={text.customTagsHint} />
          </label>
        </section>

        <div className="entry-form-grid-2">
          <label>
            {text.indications}
            <textarea
              value={localizedValue(indicationsEs, indicationsEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setIndicationsEs, setIndicationsEn)}
              rows={4}
            />
          </label>
          <label>
            {text.dosage}
            <textarea
              value={localizedValue(dosageEs, dosageEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setDosageEs, setDosageEn)}
              rows={4}
            />
          </label>
          <label>
            {text.administrationConditions}
            <textarea
              value={localizedValue(administrationConditionsEs, administrationConditionsEn)}
              onChange={(event) =>
                setLocalizedValue(event.target.value, setAdministrationConditionsEs, setAdministrationConditionsEn)
              }
              rows={4}
            />
          </label>
          <label>
            {text.adverseEffects}
            <textarea
              value={localizedValue(adverseEffectsEs, adverseEffectsEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setAdverseEffectsEs, setAdverseEffectsEn)}
              rows={4}
            />
          </label>
          <label>
            {text.contraindications}
            <textarea
              value={localizedValue(contraindicationsEs, contraindicationsEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setContraindicationsEs, setContraindicationsEn)}
              rows={4}
            />
          </label>
          <label>
            {text.interactions}
            <textarea
              value={localizedValue(interactionsEs, interactionsEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setInteractionsEs, setInteractionsEn)}
              rows={4}
            />
          </label>
          <label>
            {text.notes}
            <textarea
              value={localizedValue(notesEs, notesEn)}
              onChange={(event) => setLocalizedValue(event.target.value, setNotesEs, setNotesEn)}
              rows={3}
            />
          </label>
        </div>

        <div className="search-grid">
          <label>
            {text.evidence}
            <select value={evidenceLevel} onChange={(event) => setEvidenceLevel(event.target.value as EvidenceLevel)}>
              {evidenceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.editorialStatus}
            <select value={editorialStatus} onChange={(event) => setEditorialStatus(event.target.value as EditorialStatus)}>
              {editorialStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {editorialStatusLabel(option, lang)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.references}
            <textarea
              value={referencesInput}
              onChange={(event) => setReferencesInput(event.target.value)}
              rows={3}
              placeholder={text.referencesHint}
              title={text.referencesHint}
            />
          </label>
        </div>

        <section className="entry-form-block">
          <div className="entry-form-inline-header">
            <div>
              <h4>{text.presets}</h4>
              <p className="entry-form-block-hint">{text.presetsHint}</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => setPresets((current) => [...current, emptyPreset()])}>
              {text.addPreset}
            </button>
          </div>
          <div className="preset-grid">
            {presets.map((preset, index) => (
              <article key={preset.id} className="preset-card">
                <div className="entry-form-inline-header">
                  <strong>Preset {index + 1}</strong>
                  {presets.length > 1 && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setPresets((current) => current.filter((item) => item.id !== preset.id))}
                    >
                      {text.removePreset}
                    </button>
                  )}
                </div>
                <div className="search-grid">
                  <label>
                    {text.category}
                    <input
                      value={localizedValue(preset.categoryEs, preset.categoryEn)}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) =>
                            item.id === preset.id
                              ? isSpanish
                                ? { ...item, categoryEs: event.target.value, categoryEn: item.categoryEn || event.target.value }
                                : { ...item, categoryEn: event.target.value, categoryEs: item.categoryEs || event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.species}
                    <select
                      value={preset.species}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, species: event.target.value as Species } : item)),
                        )
                      }
                    >
                      <option value=""></option>
                      {speciesOptions.map((species) => (
                        <option key={species} value={species}>
                          {translateMedicalTerm(species, lang)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {text.route}
                    <input
                      value={preset.route}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, route: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.indicationPreset}
                    <input
                      value={localizedValue(preset.indicationEs, preset.indicationEn)}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) =>
                            item.id === preset.id
                              ? isSpanish
                                ? { ...item, indicationEs: event.target.value, indicationEn: item.indicationEn || event.target.value }
                                : { ...item, indicationEn: event.target.value, indicationEs: item.indicationEs || event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.minDose}
                    <input
                      type="number"
                      step="0.01"
                      value={preset.minDose}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, minDose: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.maxDose}
                    <input
                      type="number"
                      step="0.01"
                      value={preset.maxDose}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, maxDose: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.defaultDose}
                    <input
                      type="number"
                      step="0.01"
                      value={preset.defaultDose}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, defaultDose: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.concentration}
                    <input
                      value={localizedValue(preset.concentrationEs, preset.concentrationEn)}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) =>
                            item.id === preset.id
                              ? isSpanish
                                ? {
                                    ...item,
                                    concentrationEs: event.target.value,
                                    concentrationEn: item.concentrationEn || event.target.value,
                                  }
                                : {
                                    ...item,
                                    concentrationEn: event.target.value,
                                    concentrationEs: item.concentrationEs || event.target.value,
                                  }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.mgPerMl}
                    <input
                      type="number"
                      step="0.01"
                      value={preset.mgPerMl}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, mgPerMl: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.mgPerTablet}
                    <input
                      type="number"
                      step="0.01"
                      value={preset.mgPerTablet}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, mgPerTablet: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label className="preset-reference-field">
                    {text.references}
                    <textarea
                      value={preset.referencesInput}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, referencesInput: event.target.value } : item)),
                        )
                      }
                      rows={3}
                      placeholder={text.referencesHint}
                      title={text.referencesHint}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        {error && <p className="form-message form-error">{error}</p>}
        {success && <p className="form-message form-success">{success}</p>}

        <button type="submit" className="primary-button">
          {isEditing ? text.saveEdit : text.saveCreate}
        </button>
      </form>
    </section>
  );
}
