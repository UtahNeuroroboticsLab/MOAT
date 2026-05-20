interface Props {
  notes: { [section: string]: string };
  onChange: (notes: { [section: string]: string }) => void;
  notRecorded: { [key: string]: boolean };
  onNotRecordedChange: (v: { [key: string]: boolean }) => void;
}

const sections = [
  { key: 'patient_info', label: 'Patient Info / General' },
  { key: 'mas', label: 'MAS / MMT / AROM' },
  { key: 'fugl_meyer', label: 'Fugl-Meyer' },
  { key: 'sis', label: 'Stroke Impact Scale' },
  { key: 'copm', label: 'COPM' },
  { key: 'myomo_tasks', label: 'Myomo Functional Tasks' },
  { key: 'cahai', label: 'CAHAI' },
  { key: 'nasa_tlx', label: 'NASA TLX' },
  { key: 'other', label: 'Other / Miscellaneous' },
];

const notRecordedOptions = [
  { key: 'cahai_without', label: 'CAHAI (Without MyoPro)' },
  { key: 'myomo_without', label: 'Myomo Tasks (Without MyoPro)' },
  { key: 'nasa_without', label: 'NASA TLX (Without MyoPro)' },
  { key: 'nasa_with', label: 'NASA TLX (With MyoPro)' },
];

export default function Notes({ notes, onChange, notRecorded, onNotRecordedChange }: Props) {
  return (
    <div>
      <h2 className="section-title">Assessment Notes</h2>
      <p className="section-subtitle">Free-text notes for each assessment section</p>

      <div className="notes-block" style={{ marginBottom: 24 }}>
        <div className="notes-block-title">Not Recorded / Skipped</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Check any assessments that were not performed during this session.</p>
        {notRecordedOptions.map(opt => (
          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notRecorded[opt.key] ?? false}
              onChange={e => onNotRecordedChange({ ...notRecorded, [opt.key]: e.target.checked })}
            />
            <span style={notRecorded[opt.key] ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : {}}>{opt.label}</span>
          </label>
        ))}
      </div>

      {sections.map(s => (
        <div className="notes-block" key={s.key}>
          <div className="notes-block-title">{s.label}</div>
          <textarea rows={3} value={notes[s.key] || ''}
            onChange={e => onChange({ ...notes, [s.key]: e.target.value })}
            placeholder={`Notes for ${s.label}...`}
            style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
