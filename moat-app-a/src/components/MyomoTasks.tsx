import { MyomoTasksData } from '../types';
import { myomoTasks } from '../data/assessmentData';

interface Props {
  data: MyomoTasksData;
  onChange: (d: MyomoTasksData) => void;
  variant: 'without' | 'with';
}

export default function MyomoTasks({ data, onChange, variant }: Props) {
  const label = variant === 'without' ? 'WITHOUT MyoPro' : 'WITH MyoPro';

  const updateComponent = (taskIdx: number, compIdx: number, field: 'achieve' | 'time', value: number | null) => {
    const tasks = data.tasks.map((t, ti) => {
      if (ti !== taskIdx) return t;
      const components = t.components.map((c, ci) => {
        if (ci !== compIdx) return c;
        return { ...c, [field]: value };
      });
      return { ...t, components };
    });
    onChange({ ...data, tasks });
  };

  return (
    <div>
      <h2 className="section-title">Myomo Functional Tasks ({label})</h2>
      <p className="section-subtitle">Score each component: Achieve (0/1) and Time in seconds</p>

      {myomoTasks.map((taskDef, taskIdx) => {
        const task = data.tasks[taskIdx];
        const achieveSum = task.components.reduce((s, c) => s + c.achieve, 0);
        const timeSum = task.components.reduce((s, c) => s + (c.time ?? 0), 0);

        return (
          <div className="task-card" key={taskIdx}>
            <div className="task-card-title">{taskDef.name}</div>
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Component</th>
                  <th>Achieve?</th>
                  <th>Time (sec)</th>
                </tr>
              </thead>
              <tbody>
                {taskDef.components.map((compName, compIdx) => (
                  <tr key={compIdx}>
                    <td style={{ textAlign: 'center' }}>{compIdx + 1}</td>
                    <td>{compName}</td>
                    <td>
                      <select value={task.components[compIdx].achieve}
                        onChange={e => updateComponent(taskIdx, compIdx, 'achieve', parseInt(e.target.value))}>
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" min={0} step={0.1}
                        value={task.components[compIdx].time ?? ''}
                        onChange={e => updateComponent(taskIdx, compIdx, 'time', e.target.value ? parseFloat(e.target.value) : null)} />
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, background: 'var(--bg-alt)' }}>
                  <td></td>
                  <td>SUM</td>
                  <td>{achieveSum}</td>
                  <td>{timeSum || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
