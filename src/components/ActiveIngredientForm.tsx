import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';
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
              'Crea una ficha base con tags, concentraciones y presets para que la calculadora y los filtros la usen inmediatamente.',
            editSubtitle:
              'Actualiza la ficha, sus presets y sus referencias. Los cambios se reflejan en filtros, fichas y calculadora.',
            activeIngredient: 'Principio activo',
            tradeNames: 'Nombres comerciales',
            tradeHint: 'Separados por coma',
            species: 'Especies',
            systems: 'Sistemas',
            tags: 'Tags clinicas',
            customTags: 'Tags personalizadas',
            customTagsHint: 'Ejemplo: Neurologia, UCI, Anestesia',
            pathologies: 'Indicaciones/patologias',
            concentrations: 'Concentraciones/presentaciones',
            concentrationsHint: 'Una por linea o separadas por coma',
            indicationsEs: 'Indicaciones (ES)',
            indicationsEn: 'Indications (EN)',
            dosageEs: 'Dosis (ES)',
            dosageEn: 'Dosage (EN)',
            administrationConditionsEs: 'Condiciones de administracion (ES)',
            administrationConditionsEn: 'Administration conditions (EN)',
            adverseEffectsEs: 'Efectos adversos (ES)',
            adverseEffectsEn: 'Adverse effects (EN)',
            contraindicationsEs: 'Contraindicaciones (ES)',
            contraindicationsEn: 'Contraindications (EN)',
            notesEs: 'Notas (ES)',
            notesEn: 'Notes (EN)',
            evidence: 'Nivel de evidencia',
            editorialStatus: 'Estado editorial',
            references: 'Referencias',
            referencesHint: 'Formato por linea: Titulo | URL',
            presets: 'Presets de calculadora',
            addPreset: 'Añadir preset',
            removePreset: 'Eliminar',
            saveCreate: 'Crear ficha',
            saveEdit: 'Guardar cambios',
            cancelEdit: 'Cancelar edicion',
            successCreate: 'Ficha creada.',
            successEdit: 'Ficha actualizada.',
            categoryEs: 'Categoria (ES)',
            categoryEn: 'Category (EN)',
            route: 'Via',
            indicationPresetEs: 'Indicacion del preset (ES)',
            indicationPresetEn: 'Preset indication (EN)',
            minDose: 'Min mg/kg',
            maxDose: 'Max mg/kg',
            defaultDose: 'Dosis por defecto',
            concentrationEs: 'Concentracion preset (ES)',
            concentrationEn: 'Preset concentration (EN)',
            mgPerMl: 'mg/mL',
            mgPerTablet: 'mg/comprimido',
            required: 'Completa al menos principio activo, una especie y un sistema.',
          }
        : {
            createKicker: 'Editorial intake',
            editKicker: 'Editorial edit',
            createTitle: 'New active ingredient record',
            editTitle: 'Edit active ingredient record',
            createSubtitle:
              'Create a base record with tags, concentrations, and calculator presets so filters and toolkit can use it immediately.',
            editSubtitle:
              'Update the record, its calculator presets, and references. Changes propagate to filters, records, and the calculator.',
            activeIngredient: 'Active ingredient',
            tradeNames: 'Trade names',
            tradeHint: 'Comma-separated',
            species: 'Species',
            systems: 'Systems',
            tags: 'Clinical tags',
            customTags: 'Custom tags',
            customTagsHint: 'Example: Neurology, ICU, Anesthesia',
            pathologies: 'Indications/pathologies',
            concentrations: 'Concentrations/presentations',
            concentrationsHint: 'One per line or comma-separated',
            indicationsEs: 'Indications (ES)',
            indicationsEn: 'Indications (EN)',
            dosageEs: 'Dosage (ES)',
            dosageEn: 'Dosage (EN)',
            administrationConditionsEs: 'Administration conditions (ES)',
            administrationConditionsEn: 'Administration conditions (EN)',
            adverseEffectsEs: 'Adverse effects (ES)',
            adverseEffectsEn: 'Adverse effects (EN)',
            contraindicationsEs: 'Contraindications (ES)',
            contraindicationsEn: 'Contraindications (EN)',
            notesEs: 'Notes (ES)',
            notesEn: 'Notes (EN)',
            evidence: 'Evidence level',
            editorialStatus: 'Editorial status',
            references: 'References',
            referencesHint: 'Line format: Title | URL',
            presets: 'Calculator presets',
            addPreset: 'Add preset',
            removePreset: 'Remove',
            saveCreate: 'Create record',
            saveEdit: 'Save changes',
            cancelEdit: 'Cancel edit',
            successCreate: 'Record created.',
            successEdit: 'Record updated.',
            categoryEs: 'Category (ES)',
            categoryEn: 'Category (EN)',
            route: 'Route',
            indicationPresetEs: 'Preset indication (ES)',
            indicationPresetEn: 'Preset indication (EN)',
            minDose: 'Min mg/kg',
            maxDose: 'Max mg/kg',
            defaultDose: 'Default dose',
            concentrationEs: 'Preset concentration (ES)',
            concentrationEn: 'Preset concentration (EN)',
            mgPerMl: 'mg/mL',
            mgPerTablet: 'mg/tablet',
            required: 'Complete at least active ingredient, one species, and one system.',
          },
    [lang],
  );

  const [activeIngredient, setActiveIngredient] = useState('');
  const [tradeNames, setTradeNames] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
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
  const [notesEs, setNotesEs] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [evidenceLevel, setEvidenceLevel] = useState<EvidenceLevel>('Moderate');
  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>('draft');
  const [referencesInput, setReferencesInput] = useState('');
  const [presets, setPresets] = useState<PresetDraft[]>([emptyPreset()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(initialEntry);

  const toggleArrayValue = <T,>(current: T[], value: T) =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const populateForm = (entry?: TherapeuticEntry | null) => {
    if (!entry) {
      setActiveIngredient('');
      setTradeNames('');
      setSelectedSpecies([]);
      setSelectedSystems([]);
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
    setSelectedSystems(entry.systems);
    setSelectedTags(tagOptions.filter((tag) => entry.tags.includes(tag)));
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

    if (!activeIngredient.trim() || selectedSpecies.length === 0 || selectedSystems.length === 0) {
      setError(text.required);
      return;
    }

    const mergedTags = Array.from(new Set([...selectedTags, ...splitList(customTags)]));
    const concentrationList = splitList(concentrations);
    const references = splitList(referencesInput).map((line, index) => {
      const [title, url] = line.split('|').map((value) => value.trim());
      return {
        id: `${slugify(activeIngredient)}-ref-${index + 1}`,
        title: title || `Reference ${index + 1}`,
        authors: 'Contributor submission',
        year: new Date().getFullYear(),
        source: 'WAIRUA VetAI',
        url: url || undefined,
      };
    });

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
      }));

    const entry: TherapeuticEntry = {
      id: initialEntry?.id ?? `${slugify(activeIngredient)}-${Date.now().toString().slice(-6)}`,
      activeIngredient: activeIngredient.trim(),
      tradeNames: splitList(tradeNames),
      species: selectedSpecies,
      tags: mergedTags,
      systems: selectedSystems,
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
            <input value={tradeNames} onChange={(event) => setTradeNames(event.target.value)} placeholder={text.tradeHint} />
          </label>
          <label>
            {text.pathologies}
            <input value={pathologies} onChange={(event) => setPathologies(event.target.value)} placeholder={text.tradeHint} />
          </label>
          <label>
            {text.concentrations}
            <input value={concentrations} onChange={(event) => setConcentrations(event.target.value)} placeholder={text.concentrationsHint} />
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
                {species}
              </button>
            ))}
          </div>
        </section>

        <section className="entry-form-block">
          <h4>{text.systems}</h4>
          <div className="tag-chip-list">
            {systemOptions.map((system) => (
              <button
                key={system}
                type="button"
                className={selectedSystems.includes(system) ? 'active' : ''}
                onClick={() => setSelectedSystems((current) => toggleArrayValue(current, system))}
              >
                {system}
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
                {tag}
              </button>
            ))}
          </div>
          <label>
            {text.customTags}
            <input value={customTags} onChange={(event) => setCustomTags(event.target.value)} placeholder={text.customTagsHint} />
          </label>
        </section>

        <div className="entry-form-grid-2">
          <label>
            {text.indicationsEs}
            <textarea value={indicationsEs} onChange={(event) => setIndicationsEs(event.target.value)} rows={4} />
          </label>
          <label>
            {text.indicationsEn}
            <textarea value={indicationsEn} onChange={(event) => setIndicationsEn(event.target.value)} rows={4} />
          </label>
          <label>
            {text.dosageEs}
            <textarea value={dosageEs} onChange={(event) => setDosageEs(event.target.value)} rows={4} />
          </label>
          <label>
            {text.dosageEn}
            <textarea value={dosageEn} onChange={(event) => setDosageEn(event.target.value)} rows={4} />
          </label>
          <label>
            {text.administrationConditionsEs}
            <textarea value={administrationConditionsEs} onChange={(event) => setAdministrationConditionsEs(event.target.value)} rows={4} />
          </label>
          <label>
            {text.administrationConditionsEn}
            <textarea value={administrationConditionsEn} onChange={(event) => setAdministrationConditionsEn(event.target.value)} rows={4} />
          </label>
          <label>
            {text.adverseEffectsEs}
            <textarea value={adverseEffectsEs} onChange={(event) => setAdverseEffectsEs(event.target.value)} rows={4} />
          </label>
          <label>
            {text.adverseEffectsEn}
            <textarea value={adverseEffectsEn} onChange={(event) => setAdverseEffectsEn(event.target.value)} rows={4} />
          </label>
          <label>
            {text.contraindicationsEs}
            <textarea value={contraindicationsEs} onChange={(event) => setContraindicationsEs(event.target.value)} rows={4} />
          </label>
          <label>
            {text.contraindicationsEn}
            <textarea value={contraindicationsEn} onChange={(event) => setContraindicationsEn(event.target.value)} rows={4} />
          </label>
          <label>
            {text.notesEs}
            <textarea value={notesEs} onChange={(event) => setNotesEs(event.target.value)} rows={3} />
          </label>
          <label>
            {text.notesEn}
            <textarea value={notesEn} onChange={(event) => setNotesEn(event.target.value)} rows={3} />
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
            <textarea value={referencesInput} onChange={(event) => setReferencesInput(event.target.value)} rows={3} placeholder={text.referencesHint} />
          </label>
        </div>

        <section className="entry-form-block">
          <div className="entry-form-inline-header">
            <h4>{text.presets}</h4>
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
                    {text.categoryEs}
                    <input
                      value={preset.categoryEs}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, categoryEs: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.categoryEn}
                    <input
                      value={preset.categoryEn}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, categoryEn: event.target.value } : item)),
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
                          {species}
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
                    {text.indicationPresetEs}
                    <input
                      value={preset.indicationEs}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, indicationEs: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.indicationPresetEn}
                    <input
                      value={preset.indicationEn}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, indicationEn: event.target.value } : item)),
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
                    {text.concentrationEs}
                    <input
                      value={preset.concentrationEs}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, concentrationEs: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text.concentrationEn}
                    <input
                      value={preset.concentrationEn}
                      onChange={(event) =>
                        setPresets((current) =>
                          current.map((item) => (item.id === preset.id ? { ...item, concentrationEn: event.target.value } : item)),
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
