import { FMAData } from '../types';
import { fmaSections } from '../data/fmaItems';

interface Props {
  data: FMAData;
  onChange: (d: FMAData) => void;
}

export default function FuglMeyer({ data, onChange }: Props) {
  const setScore = (itemId: string, value: number) => {
    onChange({ ...data, scores: { ...data.scores, [itemId]: value } });
  };

  const setSectionNote = (title: string, note: string) => {
    onChange({ ...data, sectionNotes: { ...data.sectionNotes, [title]: note } });
  };

  const totalScore = Object.values(data.scores).reduce<number>((sum, v) => {
    if (v === null || v === undefined || v < 0) return sum;
    return sum + v;
  }, 0);

  return (
    <div>
      <h2 className="section-title">Fugl-Meyer Assessment — Upper Extremity</h2>
      <p className="section-subtitle">
        Scoring: 0 = Cannot perform · 1 = Performs partially · 2 = Performs fully
        <span className="score-badge" style={{ marginLeft: 12 }}>Total: {totalScore} / 66</span>
      </p>

      {fmaSections.map(section => (
        <div className="fma-section" key={section.title}>
          <div className="fma-section-title">{section.title}</div>
          {section.items.map(item => {
            const current = data.scores[item.id] ?? null;
            return (
              <div className="fma-item" key={item.id}>
                <div className="fma-item-header">
                  <span className="fma-item-id">{item.id}</span>
                  <span className="fma-item-name">{item.name}</span>
                </div>
                <div className="fma-options">
                  {item.options.map(opt => (
                    <button key={opt.value}
                      className={`fma-opt ${current === opt.value ? 'selected' : ''}`}
                      onClick={() => setScore(item.id, opt.value)}>
                      <span className="fma-opt-score">{opt.value === -1 ? 'X' : opt.value}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <input
            type="text"
            value={data.sectionNotes?.[section.title] ?? ''}
            onChange={e => setSectionNote(section.title, e.target.value)}
            placeholder="Section notes..."
            style={{ width: '100%', marginTop: 4, fontSize: 12, fontStyle: 'italic' }}
          />
        </div>
      ))}
    </div>
  );
}
