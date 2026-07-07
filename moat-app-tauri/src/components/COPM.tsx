import { COPMData } from '../types';
import { downloadCopmPdf } from '../utils/exportCopmPdf';

interface Props {
  data: COPMData;
  onChange: (d: COPMData) => void;
  /** Patient / participant id, used for the PDF header and filename. */
  participantId?: string;
}

// Identification-of-issues layout, mirroring the "COPM - reformatted" form.
// group + category keys match COPMData.identificationNotes / importanceRatings.
const ID_SECTIONS: {
  step: string;
  group: 'selfCare' | 'productivity' | 'leisure';
  rows: { key: string; label: string; hint: string }[];
}[] = [
  {
    step: 'Step 1A: Self-Care',
    group: 'selfCare',
    rows: [
      { key: 'personalCare', label: 'Personal Care', hint: 'dressing, bathing, feeding, hygiene' },
      { key: 'functionalMobility', label: 'Functional Mobility', hint: 'transfers, indoor, outdoor' },
      { key: 'communityMgmt', label: 'Community Management', hint: 'transportation, shopping, finances' },
    ],
  },
  {
    step: 'Step 1B: Productivity',
    group: 'productivity',
    rows: [
      { key: 'paidWork', label: 'Paid / Unpaid Work', hint: 'finding/keeping a job, volunteering' },
      { key: 'householdMgmt', label: 'Household Management', hint: 'cleaning, laundry, cooking' },
      { key: 'play', label: 'Play', hint: 'play skills, homework' },
    ],
  },
  {
    step: 'Step 1C: Leisure',
    group: 'leisure',
    rows: [
      { key: 'quietRec', label: 'Quiet Recreation', hint: 'hobbies, crafts, reading' },
      { key: 'activeRec', label: 'Active Recreation', hint: 'sports, outings, travel' },
      { key: 'socialization', label: 'Socialization', hint: 'visiting, phone calls, parties' },
    ],
  },
];

export default function COPM({ data, onChange, participantId }: Props) {
  const updateProblem = (idx: number, field: keyof COPMData['problems'][0], value: string | number | null) => {
    const problems = [...data.problems];
    problems[idx] = { ...problems[idx], [field]: value };
    onChange({ ...data, problems });
  };

  const avg = (field: 'perfT1' | 'satT1' | 'perfT2' | 'satT2') => {
    const vals = data.problems.slice(0, 5)
      .map(p => p[field])
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return '—';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

  const updateIdNote = (group: string, category: string, idx: number, value: string) => {
    const identificationNotes = clone(data.identificationNotes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (identificationNotes as any)[group][category][idx] = value;
    onChange({ ...data, identificationNotes });
  };

  const updateImportance = (group: string, category: string, idx: number, value: number | null) => {
    const importanceRatings = clone(data.importanceRatings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (importanceRatings as any)[group][category][idx] = value;
    onChange({ ...data, importanceRatings });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idNotesFor = (group: string, category: string): string[] =>
    (data.identificationNotes as any)[group][category];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importanceFor = (group: string, category: string): (number | null)[] =>
    (data.importanceRatings as any)[group][category];

  const handleExportPdf = () => {
    const fname = `COPM_${participantId || 'participant'}.pdf`;
    downloadCopmPdf(data, fname, { participantId });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h2 className="section-title">Canadian Occupational Performance Measure</h2>
          <p className="section-subtitle">Identify and rate up to 5 occupational performance problems (6-7 are backups)</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleExportPdf} style={{ whiteSpace: 'nowrap' }}>
          Download COPM PDF
        </button>
      </div>

      <div className="form-row" style={{ marginBottom: 20 }}>
        <div className="form-group flex-1">
          <label className="form-label">Initial Assessment Date</label>
          <input type="date" value={data.dates.initial}
            onChange={e => onChange({ ...data, dates: { ...data.dates, initial: e.target.value } })} />
        </div>
        <div className="form-group flex-1">
          <label className="form-label">Re-Assessment Date</label>
          <input type="date" value={data.dates.t2}
            onChange={e => onChange({ ...data, dates: { ...data.dates, t2: e.target.value } })} />
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Occupational Performance Problem</th>
            <th>Importance (1-10)</th>
            <th>Perf T1</th>
            <th>Sat T1</th>
            <th>Perf T2</th>
            <th>Sat T2</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.problems.map((p, i) => (
            <tr key={i} style={i >= 5 ? { opacity: 0.6 } : undefined}>
              <td style={{ fontWeight: 600, textAlign: 'center' }}>{i + 1}</td>
              <td>
                <input type="text" value={p.description}
                  onChange={e => updateProblem(i, 'description', e.target.value)}
                  placeholder="Describe problem..." />
              </td>
              <td>
                <input type="number" min={1} max={10}
                  value={p.importance ?? ''}
                  onChange={e => updateProblem(i, 'importance', e.target.value ? parseInt(e.target.value) : null)} />
              </td>
              <td>
                <input type="number" min={1} max={10}
                  value={p.perfT1 ?? ''}
                  onChange={e => updateProblem(i, 'perfT1', e.target.value ? parseInt(e.target.value) : null)} />
              </td>
              <td>
                <input type="number" min={1} max={10}
                  value={p.satT1 ?? ''}
                  onChange={e => updateProblem(i, 'satT1', e.target.value ? parseInt(e.target.value) : null)} />
              </td>
              <td>
                <input type="number" min={1} max={10}
                  value={p.perfT2 ?? ''}
                  onChange={e => updateProblem(i, 'perfT2', e.target.value ? parseInt(e.target.value) : null)} />
              </td>
              <td>
                <input type="number" min={1} max={10}
                  value={p.satT2 ?? ''}
                  onChange={e => updateProblem(i, 'satT2', e.target.value ? parseInt(e.target.value) : null)} />
              </td>
              <td>
                <input type="text" value={p.notes ?? ''}
                  onChange={e => updateProblem(i, 'notes', e.target.value)}
                  placeholder="Notes..." />
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 600, background: 'var(--bg-alt)' }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>Average (top 5):</td>
            <td>{avg('perfT1')}</td>
            <td>{avg('satT1')}</td>
            <td>{avg('perfT2')}</td>
            <td>{avg('satT2')}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <h3 className="section-title" style={{ fontSize: '1.05rem', marginTop: 32 }}>
        Identification of Occupational Performance Issues
      </h3>
      <p className="section-subtitle">
        Step 1 — list problem areas the participant identifies, then rate importance (1-10).
      </p>

      {ID_SECTIONS.map(section => (
        <div key={section.group} style={{ marginBottom: 20 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th colSpan={3} style={{ textAlign: 'left' }}>{section.step}</th>
              </tr>
              <tr>
                <th style={{ width: '32%' }}>Category</th>
                <th>Occupational Performance Issue</th>
                <th style={{ width: 110 }}>Importance (1-10)</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.flatMap(cat => {
                const notes = idNotesFor(section.group, cat.key);
                const ratings = importanceFor(section.group, cat.key);
                return notes.map((noteVal, ri) => (
                  <tr key={`${cat.key}-${ri}`}>
                    {ri === 0 && (
                      <td rowSpan={notes.length} style={{ verticalAlign: 'middle', fontWeight: 600 }}>
                        {cat.label}
                        <div style={{ fontWeight: 400, fontSize: '0.8em', color: 'var(--text-muted, #64748b)' }}>
                          {cat.hint}
                        </div>
                      </td>
                    )}
                    <td>
                      <input type="text" value={noteVal}
                        onChange={e => updateIdNote(section.group, cat.key, ri, e.target.value)}
                        placeholder="Describe issue..." />
                    </td>
                    <td>
                      <input type="number" min={1} max={10}
                        value={ratings[ri] ?? ''}
                        onChange={e => updateImportance(section.group, cat.key, ri, e.target.value ? parseInt(e.target.value) : null)} />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="form-group" style={{ marginTop: 24 }}>
        <label className="form-label">Notes</label>
        <textarea
          rows={5}
          value={data.notes}
          onChange={e => onChange({ ...data, notes: e.target.value })}
          placeholder="General COPM notes..."
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
