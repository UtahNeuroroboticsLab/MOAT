import { PatientInfo as PatientInfoType } from '../types';

interface Props {
  data: PatientInfoType;
  onChange: (d: PatientInfoType) => void;
}

export default function PatientInfo({ data, onChange }: Props) {
  const set = <K extends keyof PatientInfoType>(key: K, val: PatientInfoType[K]) =>
    onChange({ ...data, [key]: val });

  return (
    <div>
      <h2 className="section-title">Patient Information</h2>
      <p className="section-subtitle">MOVES Trial — Utah Neurorobotics Lab</p>

      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label">Patient ID</label>
          <input type="text" value={data.id} onChange={e => set('id', e.target.value)} placeholder="e.g. P001" />
        </div>
        <div className="form-group flex-1">
          <label className="form-label">Affected Hand</label>
          <select value={data.affectedHand} onChange={e => set('affectedHand', e.target.value as 'Left' | 'Right')}>
            <option value="Right">Right</option>
            <option value="Left">Left</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label">Date of Assessment</label>
          <input type="date" value={data.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group flex-1">
          <label className="form-label">2nd Date of Assessment (optional)</label>
          <input type="date" value={data.date2} onChange={e => set('date2', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Assessment Phase</label>
          <div className="toggle-row">
            {(['baseline', '2m', '4m', '6m', '9m', '1y'] as const).map(phase => (
              <button key={phase} className={`toggle-btn ${data.assessmentPhase === phase ? 'active' : ''}`}
                onClick={() => set('assessmentPhase', phase)}>
                {phase === 'baseline' ? 'Initial' : phase}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label">Notes</label>
          <textarea rows={4} value={data.notes} onChange={e => set('notes', e.target.value)} placeholder="General notes about this assessment..." />
        </div>
      </div>
    </div>
  );
}
