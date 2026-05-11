import { MASData } from '../types';

interface Props {
  data: MASData;
  onChange: (d: MASData) => void;
}

const masOptions = ['NT', '0', '1', '1+', '2', '3', '4'];
const mmtOptions = ['NT', 'NA', '0/5', '1/5', '2/5', '3/5', '4/5', '5/5'];

export default function MAS({ data, onChange }: Props) {
  const updateRow = (idx: number, field: keyof MASData['rows'][0], value: string) => {
    const rows = [...data.rows];
    rows[idx] = { ...rows[idx], [field]: value };
    onChange({ ...data, rows });
  };

  return (
    <div>
      <h2 className="section-title">Modified Ashworth Scale / MMT / AROM</h2>
      <p className="section-subtitle">Spasticity, manual muscle testing, and active range of motion</p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Joint</th>
            <th>Muscle Group</th>
            <th>MAS Score</th>
            <th>MMT Score</th>
            <th>AROM (degrees)</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td>{row.joint}</td>
              <td>{row.muscle}</td>
              <td>
                <select value={row.mas} onChange={e => updateRow(i, 'mas', e.target.value)}>
                  {masOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td>
                <select value={row.mmt} onChange={e => updateRow(i, 'mmt', e.target.value)}>
                  {mmtOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td>
                <input type="text" value={row.arom} onChange={e => updateRow(i, 'arom', e.target.value)}
                  placeholder={row.arom === 'NT' ? 'NT' : 'degrees or NA'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <p><strong>MAS:</strong> 0 = No increase · 1 = Catch and release · 1+ = Catch, minimal resistance {'<'} half ROM · 2 = Marked increase through most ROM · 3 = Considerable increase · 4 = Rigid</p>
        <p style={{ marginTop: 4 }}><strong>MMT:</strong> 0/5 = No contraction · 1/5 = Visible contraction, no ROM · 2/5 = Full ROM, gravity eliminated · 3/5 = Full ROM against gravity · 4/5 = Moderate resistance · 5/5 = Normal</p>
      </div>
    </div>
  );
}
