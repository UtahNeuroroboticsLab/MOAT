import { SISData } from '../types';
import { sisDomains } from '../data/sisItems';

interface Props {
  data: SISData;
  onChange: (d: SISData) => void;
}

export default function SIS({ data, onChange }: Props) {
  const setItem = (domainKey: string, idx: number, value: number) => {
    const domains = { ...data.domains };
    const arr = [...domains[domainKey]];
    arr[idx] = value;
    domains[domainKey] = arr;
    onChange({ ...data, domains });
  };

  const computeScaled = (domainKey: string): string => {
    const items = data.domains[domainKey];
    const filled = items.filter((v): v is number => v !== null);
    if (filled.length === 0) return '—';
    const mean = filled.reduce((a, b) => a + b, 0) / filled.length;
    const scaled = ((mean - 1) / 4) * 100;
    return scaled.toFixed(1);
  };

  return (
    <div>
      <h2 className="section-title">Stroke Impact Scale v3.0</h2>
      <p className="section-subtitle">Patient self-report of stroke impact across 8 domains</p>

      {sisDomains.map(domain => (
        <div className="sis-domain" key={domain.key}>
          <div className="sis-domain-header">
            {domain.number}. {domain.title}
            <span className="score-badge" style={{ marginLeft: 8 }}>
              Scaled: {computeScaled(domain.key)}
            </span>
          </div>
          <div className="sis-domain-prompt">{domain.prompt}</div>

          <div className="likert-header" style={{ paddingLeft: 'calc(100% - 224px)' }}>
            {[5, 4, 3, 2, 1].map(v => (
              <div className="likert-header-label" key={v}>{v}</div>
            ))}
          </div>

          {domain.items.map((item, idx) => (
            <div className="likert-item" key={item.letter}>
              <div className="likert-question">
                <span className="likert-letter">{item.letter}.</span>
                {item.text}
              </div>
              <div className="likert-options">
                {[5, 4, 3, 2, 1].map(v => (
                  <button key={v}
                    className={`likert-option ${data.domains[domain.key][idx] === v ? 'selected' : ''}`}
                    onClick={() => setItem(domain.key, idx, v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="sis-domain">
        <div className="sis-domain-header">9. Stroke Recovery</div>
        <div className="sis-domain-prompt">
          On a scale of 0 to 100, with 100 representing full recovery and 0 representing no recovery, how much have you recovered from your stroke?
        </div>
        <div className="slider-row">
          <span className="slider-label">Recovery: {data.recoveryScore ?? '—'}</span>
          <input type="range" className="slider-input" min={0} max={100} step={1}
            value={data.recoveryScore ?? 50}
            onChange={e => onChange({ ...data, recoveryScore: parseInt(e.target.value) })} />
          <span className="slider-value">{data.recoveryScore ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
