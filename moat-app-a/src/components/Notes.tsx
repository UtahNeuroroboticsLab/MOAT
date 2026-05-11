interface Props {
  notes: { [section: string]: string };
  onChange: (notes: { [section: string]: string }) => void;
}

const sections = [
  { key: 'patient_info', label: 'Patient Info / General' },
  { key: 'mas', label: 'MAS / MMT / AROM' },
  { key: 'fugl_meyer', label: 'Fugl-Meyer' },
  { key: 'sis', label: 'Stroke Impact Scale' },
  { key: 'copm', label: 'COPM' },
  { key: 'box_and_blocks', label: 'Box & Blocks' },
  { key: 'myomo_tasks', label: 'Myomo Functional Tasks' },
  { key: 'cahai', label: 'CAHAI' },
  { key: 'nasa_tlx', label: 'NASA TLX' },
  { key: 'other', label: 'Other / Miscellaneous' },
];

export default function Notes({ notes, onChange }: Props) {
  return (
    <div>
      <h2 className="section-title">Assessment Notes</h2>
      <p className="section-subtitle">Free-text notes for each assessment section</p>

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
