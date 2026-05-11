import { useState } from 'react';
import './App.css';
import { SectionId, AssessmentState } from './types';
import { createDefaultState } from './defaults';
import PatientInfo from './components/PatientInfo';
import MAS from './components/MAS';
import FuglMeyer from './components/FuglMeyer';
import SIS from './components/SIS';
import COPM from './components/COPM';
import BoxAndBlocks from './components/BoxAndBlocks';
import MyomoTasks from './components/MyomoTasks';
import CAHAI from './components/CAHAI';
import NasaTLX from './components/NasaTLX';
import Notes from './components/Notes';
import ExportSection from './components/ExportSection';

const sections: { id: SectionId; label: string; group?: string }[] = [
  { id: 'patient_info', label: 'Patient Info' },
  { id: 'mas', label: 'MAS / MMT / AROM', group: 'Assessments' },
  { id: 'fugl_meyer', label: 'Fugl-Meyer' },
  { id: 'sis', label: 'Stroke Impact Scale' },
  { id: 'copm', label: 'COPM' },
  { id: 'box_and_blocks', label: 'Box & Blocks' },
  { id: 'myomo_without', label: 'Myomo Tasks (W/O)', group: 'Without MyoPro' },
  { id: 'cahai_without', label: 'CAHAI (W/O)' },
  { id: 'nasa_without', label: 'NASA TLX (W/O)' },
  { id: 'myomo_with', label: 'Myomo Tasks (W/)', group: 'With MyoPro' },
  { id: 'cahai_with', label: 'CAHAI (W/)' },
  { id: 'nasa_with', label: 'NASA TLX (W/)' },
  { id: 'notes', label: 'Notes', group: 'Other' },
  { id: 'export', label: 'Export' },
];

function App() {
  const [state, setState] = useState<AssessmentState>(createDefaultState);
  const [activeSection, setActiveSection] = useState<SectionId>('patient_info');

  const update = <K extends keyof AssessmentState>(key: K, value: AssessmentState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
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
      case 'box_and_blocks': return <BoxAndBlocks data={state.boxAndBlocks} onChange={d => update('boxAndBlocks', d)} affectedHand={state.patientInfo.affectedHand} />;
      case 'myomo_without': return <MyomoTasks data={state.myomoWithout} onChange={d => update('myomoWithout', d)} variant="without" />;
      case 'myomo_with': return <MyomoTasks data={state.myomoWith} onChange={d => update('myomoWith', d)} variant="with" />;
      case 'cahai_without': return <CAHAI data={state.cahaiWithout} onChange={d => update('cahaiWithout', d)} variant="without" />;
      case 'cahai_with': return <CAHAI data={state.cahaiWith} onChange={d => update('cahaiWith', d)} variant="with" />;
      case 'nasa_without': return <NasaTLX data={state.nasaWithout} onChange={d => update('nasaWithout', d)} variant="without" />;
      case 'nasa_with': return <NasaTLX data={state.nasaWith} onChange={d => update('nasaWith', d)} variant="with" />;
      case 'notes': return <Notes notes={state.sectionNotes} onChange={n => update('sectionNotes', n)} />;
      case 'export': return <ExportSection state={state} />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">MOAT Assessment</div>
        <nav className="sidebar-nav">
          {sections.map((s, i) => (
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
  );
}

export default App;
