import AntibioticToolkit from './components/AntibioticToolkit';
import { therapeuticEntries } from './data/entries';
import { buildDoseCalculatorEntries } from './lib/indexes';
import { type ReactNode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WritingAssistantToolkit from './components/WritingAssistantToolkit';
import VitalConstantsToolkit from './components/VitalConstantsToolkit';
import EndocrineToolkit from './components/EndocrineToolkit';
import GeneticsToolkit from './components/GeneticsToolkit';
import ContinuousInfusionToolkit from './components/ContinuousInfusionToolkit';
import InfusionCalculator from './components/InfusionCalculator';
import FluidTherapyToolkit from './components/FluidTherapyToolkit';
import AnesthesiaToolkit from './components/AnesthesiaToolkit';
import BodySurfaceAreaCalculator from './components/BodySurfaceAreaCalculator';
import ManagementToolkit from './components/ManagementToolkit';
import HaemotherapyCalculator from './components/HaemotherapyCalculator';
import { ChillProtocolToolkit, FipProtocolToolkit } from './components/ClinicalProtocolToolkits';
import DoseCalculator from './components/DoseCalculator';
import DrugInteractionChecker from './components/DrugInteractionChecker';
import UnitConverter from './components/UnitConverter';
import ClinicalNutritionToolkit from './components/ClinicalNutritionToolkit';
import './styles.css';
import './design.css';
import './toolkit-contrast.css';

type PreviewTool = 'antibiotics' | 'cri' | 'endocrine' | 'writing' | 'constants' | 'dose' | 'genetics' | 'interactions' | 'infusion' | 'fluid' | 'anesthesia' | 'converter' | 'surface' | 'nutrition' | 'management' | 'haemotherapy' | 'chill' | 'fip';

const toolNames: Record<PreviewTool, { es: string; en: string }> = {
  antibiotics: { es: 'Antibióticos', en: 'Antibiotics' },
  endocrine: { es: 'Endocrino', en: 'Endocrinology' },
  writing: { es: 'Redacción', en: 'Writing' },
  constants: { es: 'Constantes', en: 'Vitals' },
  dose: { es: 'Dosis', en: 'Dose' },
  genetics: { es: 'Genética', en: 'Genetics' },
  interactions: { es: 'Interacciones', en: 'Interactions' },
  cri: { es: 'Infusión continua · CRI', en: 'Continuous infusion · CRI' },
  infusion: { es: 'Infusión', en: 'Infusion' },
  fluid: { es: 'Fluidoterapia', en: 'Fluid therapy' },
  anesthesia: { es: 'Anestesia', en: 'Anesthesia' },
  converter: { es: 'Conversor', en: 'Converter' },
  surface: { es: 'Superficie corporal', en: 'Body surface area' },
  nutrition: { es: 'Nutrición', en: 'Nutrition' },
  management: { es: 'Gestión', en: 'Management' },
  haemotherapy: { es: 'Hemoterapia', en: 'Haemotherapy' },
  chill: { es: 'Chill', en: 'Chill' },
  fip: { es: 'PIF', en: 'FIP' },
};

const previewDoseEntries = buildDoseCalculatorEntries(therapeuticEntries);

function ToolkitPreview() {
  const [criProtocolId, setCriProtocolId] = useState<string | undefined>();
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [tool, setTool] = useState<PreviewTool | 'overview'>(() => {
    const requested = new URLSearchParams(window.location.search).get('tool');
    return requested && Object.prototype.hasOwnProperty.call(toolNames, requested) ? requested as PreviewTool : 'overview';
  });
  const content: Record<PreviewTool, ReactNode> = {
    antibiotics: <AntibioticToolkit lang={lang} />,
    endocrine: <EndocrineToolkit lang={lang} />,
    writing: <WritingAssistantToolkit lang={lang} />,
    constants: <VitalConstantsToolkit lang={lang} />,
    dose: <DoseCalculator lang={lang} entries={previewDoseEntries} onOpenKnowledge={() => {}} onOpenCri={(id) => { setCriProtocolId(id); setTool("cri"); }} />,
    genetics: <GeneticsToolkit lang={lang} />,
    interactions: <DrugInteractionChecker lang={lang} entries={[]} />,
    cri: <ContinuousInfusionToolkit key={criProtocolId ?? "default"} lang={lang} initialProtocolId={criProtocolId} />,
    infusion: <InfusionCalculator lang={lang} />,
    fluid: <FluidTherapyToolkit lang={lang} />,
    anesthesia: <AnesthesiaToolkit lang={lang} />,
    converter: <UnitConverter lang={lang} />,
    surface: <BodySurfaceAreaCalculator lang={lang} />,
    nutrition: <ClinicalNutritionToolkit lang={lang} service={null} />,
    management: <ManagementToolkit lang={lang} />,
    haemotherapy: <HaemotherapyCalculator lang={lang} />,
    chill: <ChillProtocolToolkit lang={lang} />,
    fip: <FipProtocolToolkit lang={lang} />,
  };

  return (
    <div className={`app toolkit-preview ${dark ? 'dark' : ''}`}>
      <header className="toolkit-preview-controls" aria-label={lang === 'es' ? 'Controles de vista previa' : 'Preview controls'}>
        <div className="toolkit-preview-brand"><strong>WAIRUA · Toolkit</strong><small>{lang === 'es' ? 'Vista previa local' : 'Local preview'}</small></div>
        <div>
          {tool !== 'overview' && <button type="button" onClick={() => setTool('overview')}>{lang === 'es' ? '← Volver al toolkit' : '← Back to toolkit'}</button>}
          <a className="toolkit-preview-app-link" href={`${import.meta.env.BASE_URL}?view=toolkit&tool=${tool === 'overview' ? 'overview' : tool}`}>{lang === 'es' ? 'Abrir aplicación' : 'Open application'}</a>
          <select aria-label={lang === 'es' ? 'Herramienta' : 'Tool'} value={tool} onChange={(event) => setTool(event.target.value as PreviewTool | 'overview')}>
            <option value="overview">{lang === 'es' ? 'Resumen del toolkit' : 'Toolkit overview'}</option>
            {(Object.keys(toolNames) as PreviewTool[]).map((id) => <option key={id} value={id}>{toolNames[id][lang]}</option>)}
          </select>
          <button type="button" onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button type="button" onClick={() => setDark(!dark)}>
            {dark ? (lang === 'es' ? 'Claro' : 'Light') : (lang === 'es' ? 'Oscuro' : 'Dark')}
          </button>
        </div>
      </header>
      <main className={`clinical-content toolkit-preview-content toolkit-module-panel toolkit-view-${tool}`}>
        {(tool === 'dose' || tool === 'interactions') && <p className="toolkit-preview-hint">{lang === 'es' ? 'Vista local con referencias terapéuticas, sin datos de pacientes.' : 'Local preview with therapeutic references, without patient data.'}</p>}
        {tool === 'overview' ? <section className="toolkit-preview-overview"><h2>{lang === 'es' ? 'Toolkit · vista previa' : 'Toolkit · preview'}</h2><p>{lang === 'es' ? 'Muestra local de herramientas. Para tu cuenta y navegación completa, abre la aplicación.' : 'Local tool preview. Open the application for your account and full navigation.'}</p><nav aria-label={lang === 'es' ? 'Herramientas del toolkit' : 'Toolkit tools'}>{(Object.keys(toolNames) as PreviewTool[]).map((id) => <button type="button" key={id} onClick={() => setTool(id)}>{toolNames[id][lang]} <span aria-hidden="true">→</span></button>)}</nav></section> : content[tool]}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ToolkitPreview />);
