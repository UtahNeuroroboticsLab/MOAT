import { COPMData } from '../types';

interface Props {
  data: COPMData;
  onChange: (d: COPMData) => void;
}

export default function COPM({ data, onChange }: Props) {
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

  return (
    <div>
      <h2 className="section-title">Canadian Occupational Performance Measure</h2>
      <p className="section-subtitle">Identify and rate up to 5 occupational performance problems (6-7 are backups)</p>

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
            </tr>
          ))}
          <tr style={{ fontWeight: 600, background: 'var(--bg-alt)' }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>Average (top 5):</td>
            <td>{avg('perfT1')}</td>
            <td>{avg('satT1')}</td>
            <td>{avg('perfT2')}</td>
            <td>{avg('satT2')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
