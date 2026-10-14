import { type ReactNode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WritingAssistantToolkit from './components/WritingAssistantToolkit';
import VitalConstantsToolkit from './components/VitalConstantsToolkit';
import EndocrineToolkit from './components/EndocrineToolkit';
import GeneticsToolkit from './components/GeneticsToolkit';
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

type PreviewTool = 'endocrine' | 'writing' | 'constants' | 'dose' | 'genetics' | 'interactions' | 'infusion' | 'fluid' | 'anesthesia' | 'converter' | 'surface' | 'nutrition' | 'management' | 'haemotherapy' | 'chill' | 'fip';

const toolNames: Record<PreviewTool, { es: string; en: string }> = {
  endocrine: { es: 'Endocrino', en: 'Endocrinology' },
  writing: { es: 'Redacción', en: 'Writing' },
  constants: { es: 'Constantes', en: 'Vitals' },
  dose: { es: 'Dosis', en: 'Dose' },
  genetics: { es: 'Genética', en: 'Genetics' },
  interactions: { es: 'Interacciones', en: 'Interactions' },
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

function ToolkitPreview() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [tool, setTool] = useState<PreviewTool>('endocrine');
  const content: Record<PreviewTool, ReactNode> = {
    endocrine: <EndocrineToolkit lang={lang} />,
    writing: <WritingAssistantToolkit lang={lang} />,
    constants: <VitalConstantsToolkit lang={lang} />,
    dose: <DoseCalculator lang={lang} entries={[]} onOpenKnowledge={() => {}} />,
    genetics: <GeneticsToolkit lang={lang} />,
    interactions: <DrugInteractionChecker lang={lang} entries={[]} />,
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
        <strong>WAIRUA · Toolkit</strong>
        <div>
          <select aria-label={lang === 'es' ? 'Herramienta' : 'Tool'} value={tool} onChange={(event) => setTool(event.target.value as PreviewTool)}>
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
        {(tool === 'dose' || tool === 'interactions') && <p className="toolkit-preview-hint">{lang === 'es' ? 'Vista visual sin datos de pacientes ni fichas clínicas.' : 'Visual preview without patient data or clinical records.'}</p>}
        {content[tool]}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ToolkitPreview />);
