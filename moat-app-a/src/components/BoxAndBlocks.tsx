import { BoxAndBlocksData } from '../types';

interface Props {
  data: BoxAndBlocksData;
  onChange: (d: BoxAndBlocksData) => void;
  affectedHand: string;
}

export default function BoxAndBlocks({ data, onChange, affectedHand }: Props) {
  const unaffectedHand = affectedHand === 'Right' ? 'Left' : 'Right';

  const Section = ({ label, section, sectionKey }: {
    label: string;
    section: BoxAndBlocksData['withoutMyoPro'];
    sectionKey: 'withoutMyoPro' | 'withMyoPro';
  }) => (
    <div className="task-card">
      <div className="task-card-title">{label}</div>
      <table className="data-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th>Hand</th>
            <th>Trial</th>
            <th>Score (# blocks)</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{affectedHand} (affected)</td>
            <td>Standard 60s</td>
            <td>
              <input type="number" min={0} max={150}
                value={section.affected ?? ''}
                onChange={e => onChange({
                  ...data,
                  [sectionKey]: { ...section, affected: e.target.value ? parseInt(e.target.value) : null }
                })} />
            </td>
            <td>
              <input type="text" value={section.affectedNotes}
                onChange={e => onChange({
                  ...data,
                  [sectionKey]: { ...section, affectedNotes: e.target.value }
                })} />
            </td>
          </tr>
          <tr>
            <td>{unaffectedHand} (unaffected)</td>
            <td>Standard 60s</td>
            <td>
              <input type="number" min={0} max={150}
                value={section.unaffected ?? ''}
                onChange={e => onChange({
                  ...data,
                  [sectionKey]: { ...section, unaffected: e.target.value ? parseInt(e.target.value) : null }
                })} />
            </td>
            <td>
              <input type="text" value={section.unaffectedNotes}
                onChange={e => onChange({
                  ...data,
                  [sectionKey]: { ...section, unaffectedNotes: e.target.value }
                })} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h2 className="section-title">Box and Blocks Test</h2>
      <p className="section-subtitle">Number of blocks transported in 60 seconds (max 150)</p>
      <Section label="WITHOUT MyoPro" section={data.withoutMyoPro} sectionKey="withoutMyoPro" />
      <Section label="WITH MyoPro" section={data.withMyoPro} sectionKey="withMyoPro" />
    </div>
  );
}
