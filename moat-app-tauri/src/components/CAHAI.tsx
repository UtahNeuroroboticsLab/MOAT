import { CAHAIData } from '../types';
import { cahaiTasks, cahaiScaleKey } from '../data/assessmentData';

interface Props {
  data: CAHAIData;
  onChange: (d: CAHAIData) => void;
  variant: 'without' | 'with';
}

export default function CAHAI({ data, onChange, variant }: Props) {
  const label = variant === 'without' ? 'WITHOUT MyoPro' : 'WITH MyoPro';

  const updateTask = (idx: number, field: keyof CAHAIData['tasks'][0], value: string | number) => {
    const tasks = [...data.tasks];
    tasks[idx] = { ...tasks[idx], [field]: value };
    onChange({ ...data, tasks });
  };

  const totalScore = data.tasks.reduce((s, t) => s + t.score, 0);

  return (
    <div>
      <h2 className="section-title">CAHAI-13 ({label})</h2>
      <p className="section-subtitle">
        Chedoke Arm and Hand Activity Inventory
        <span className="score-badge" style={{ marginLeft: 8 }}>Total: {totalScore} / 91</span>
      </p>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        {cahaiScaleKey.map(s => (
          <span key={s.score} style={{ marginRight: 12 }}><strong>{s.score}</strong> = {s.label}</span>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Task</th>
            <th>Role of Affected Arm</th>
            <th>Score (1-7)</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {cahaiTasks.map((taskDef, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'center' }}>{taskDef.num}</td>
              <td>{taskDef.task}</td>
              <td>
                <input type="text" value={data.tasks[i].role}
                  onChange={e => updateTask(i, 'role', e.target.value)}
                  style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)' }} />
              </td>
              <td>
                <select value={data.tasks[i].score}
                  onChange={e => updateTask(i, 'score', parseInt(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </td>
              <td>
                <input type="text" value={data.tasks[i].comment}
                  onChange={e => updateTask(i, 'comment', e.target.value)} />
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 600, background: 'var(--bg-alt)' }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>Total Score:</td>
            <td>{totalScore} / 91</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">General Comment</label>
        <textarea value={data.generalComment}
          onChange={e => onChange({ ...data, generalComment: e.target.value })}
          rows={2} />
      </div>
    </div>
  );
}
