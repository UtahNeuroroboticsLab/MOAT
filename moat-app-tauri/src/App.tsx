import { useState, useEffect, useRef } from 'react';
import './App.css';
import { SectionId, AssessmentState } from './types';
import { createDefaultState } from './defaults';
import { ensureDataDirs, loadPatientData, PatientData } from './utils/tauriCommands';
import { exportAssessment, saveWorkbookToDisk } from './utils/exportXlsx';
import PatientInfo from './components/PatientInfo';
import MAS from './components/MAS';
import FuglMeyer from './components/FuglMeyer';
import SIS from './components/SIS';
import COPM from './components/COPM';
import MyomoTasks from './components/MyomoTasks';
import CAHAI from './components/CAHAI';
import NasaTLX from './components/NasaTLX';
import Notes from './components/Notes';
import ExportSection from './components/ExportSection';

// This is what causes sections to render or not
const sections: { id: SectionId; label: string; group?: string }[] = [
  { id: 'patient_info', label: 'Patient Info' },
  { id: 'mas', label: 'MAS / MMT / AROM', group: 'Assessments' },
  { id: 'fugl_meyer', label: 'Fugl-Meyer' },
  { id: 'sis', label: 'Stroke Impact Scale' },
  { id: 'copm', label: 'COPM' },
  { id: 'cahai_without', label: 'CAHAI (W/O)', group: 'Without MyoPro'},
  { id: 'myomo_without', label: 'Myomo Tasks (W/O)' },
  { id: 'nasa_without', label: 'NASA TLX (W/O)'},
  { id: 'cahai_with', label: 'CAHAI (W/)', group: 'With MyoPro' },
  { id: 'myomo_with', label: 'Myomo Tasks (W/)' },
  { id: 'nasa_with', label: 'NASA TLX (W/)' },
  { id: 'notes', label: 'Notes', group: 'Other' },
  { id: 'export', label: 'Export' },
];

function App() {
  const [state, setState] = useState<AssessmentState>(createDefaultState);
  const [activeSection, setActiveSection] = useState<SectionId>('patient_info');
  const [foundPatientData, setFoundPatientData] = useState<PatientData | null>(null);
  const [showAutofillBanner, setShowAutofillBanner] = useState(false);
  const lastLoadedId = useRef<string>('');

  // Create MOAT_data dirs on startup
  useEffect(() => {
    ensureDataDirs().catch(err => console.warn('MOAT_data init failed:', err));
  }, []);

  // When patient ID changes, check for existing patient data
  useEffect(() => {
    const id = state.patientInfo.id.trim();
    if (!id || id === lastLoadedId.current) return;
    lastLoadedId.current = id;

    loadPatientData(id)
      .then(data => {
        if (!data) return;
        setFoundPatientData(data);
        const hasCopmData = data.copmProblems.some(p => p.description.trim() !== '');
        const copmIsEmpty = !state.copm.problems.some(p => p.description.trim() !== '');
        if (hasCopmData && copmIsEmpty) {
          setShowAutofillBanner(true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.patientInfo.id]);

  const update = <K extends keyof AssessmentState>(key: K, value: AssessmentState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadCopmFromPatientData = () => {
    if (!foundPatientData) return;
    const newProblems = state.copm.problems.map((existing, i) => {
      const saved = foundPatientData.copmProblems[i];
      return saved ? { ...existing, description: saved.description, importance: saved.importance } : existing;
    });
    update('copm', { ...state.copm, problems: newProblems });
    setShowAutofillBanner(false);
  };

  const handleSaveToDisk = async (): Promise<void> => {
    const phaseLabel = state.patientInfo.assessmentPhase === 'baseline'
      ? 'baseline'
      : `phase${state.patientInfo.assessmentPhase.replace('m', '').replace('y', '12')}`;
    const filename = `${state.patientInfo.id || '??'}__${phaseLabel}_assessment.xlsx`;

    const wb = await exportAssessment(state);
    await saveWorkbookToDisk(wb, filename);
  };

  const sectionIdx = sections.findIndex(s => s.id === activeSection);
  const goPrev = () => { if (sectionIdx > 0) setActiveSection(sections[sectionIdx - 1].id); };
  const goNext = () => { if (sectionIdx < sections.length - 1) setActiveSection(sections[sectionIdx + 1].id); };

  const renderSection = () => {
    switch (activeSection) {
      case 'patient_info': return <PatientInfo data={state.patientInfo} onChange={d => update('patientInfo', d)} />;
      case 'mas': return <MAS data={state.mas} onChange={d => update('mas', d)} />;
      case 'fugl_meyer': return <FuglMeyer data={state.fma} onChange={d => update('fma', d)} />;
      case 'sis': return <SIS data={state.sis} onChange={d => update('sis', d)} />;
      case 'copm': return <COPM data={state.copm} onChange={d => update('copm', d)} />;
      // case 'box_and_blocks': return <BoxAndBlocks data={state.boxAndBlocks} onChange={d => update('boxAndBlocks', d)} affectedHand={state.patientInfo.affectedHand} />;
      case 'myomo_without': return <MyomoTasks data={state.myomoWithout} onChange={d => update('myomoWithout', d)} variant="without" />;
      case 'myomo_with': return <MyomoTasks data={state.myomoWith} onChange={d => update('myomoWith', d)} variant="with" />;
      case 'cahai_without': return <CAHAI data={state.cahaiWithout} onChange={d => update('cahaiWithout', d)} variant="without" />;
      case 'cahai_with': return <CAHAI data={state.cahaiWith} onChange={d => update('cahaiWith', d)} variant="with" />;
      case 'nasa_without': return <NasaTLX data={state.nasaWithout} onChange={d => update('nasaWithout', d)} variant="without" />;
      case 'nasa_with': return <NasaTLX data={state.nasaWith} onChange={d => update('nasaWith', d)} variant="with" />;
      case 'notes': return <Notes notes={state.sectionNotes} onChange={n => update('sectionNotes', n)} notRecorded={state.notRecorded} onNotRecordedChange={v => update('notRecorded', v)} />;
      case 'export': return <ExportSection state={state} onSaveToDisk={handleSaveToDisk} />;
    }
  };

  return (
    <div className="app-root">
      <div className="app-banner">
        <span>MOAT: Myoelectric Orthosis Assessment Toolkit</span>
        <span>Leonardo Ferrisi 2026</span>
      </div>
      <div className="app-layout">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {sections.map((s) => (
            <div key={s.id}>
              {s.group && (
                <div className="sidebar-group">{s.group}</div>
              )}
              <button
                className={`sidebar-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}>
                {s.label}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {showAutofillBanner && (
          <div className="autofill-banner">
            <span>
              Previous COPM data found for <strong>{state.patientInfo.id}</strong>.
            </span>
            <div className="autofill-banner-actions">
              <button type="button" className="btn btn-primary autofill-btn" onClick={handleLoadCopmFromPatientData}>
                Load previous COPM problems
              </button>
              <button type="button" className="btn btn-outline autofill-btn" onClick={() => setShowAutofillBanner(false)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {renderSection()}
        <div className="nav-footer">
          <button className="btn btn-outline" onClick={goPrev} disabled={sectionIdx === 0}>
            ← Previous
          </button>
          <button className="btn btn-primary" onClick={goNext} disabled={sectionIdx === sections.length - 1}>
            Next →
          </button>
        </div>
      </main>
    </div>
    </div>
  );
}

export default App;
