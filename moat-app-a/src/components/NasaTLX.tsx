import { NasaTLXData } from '../types';

interface Props {
  data: NasaTLXData;
  onChange: (d: NasaTLXData) => void;
  variant: 'without' | 'with';
}

const dimensions: { key: keyof NasaTLXData; label: string; description: string }[] = [
  { key: 'mentalDemand', label: 'Mental Demand', description: 'How much mental and perceptual activity was required?' },
  { key: 'physicalDemand', label: 'Physical Demand', description: 'How much physical activity was required?' },
  { key: 'temporalDemand', label: 'Temporal Demand', description: 'How much time pressure did you feel?' },
  { key: 'performance', label: 'Performance', description: 'How successful were you in accomplishing the task?' },
  { key: 'effort', label: 'Effort', description: 'How hard did you have to work to accomplish your level of performance?' },
  { key: 'frustration', label: 'Frustration', description: 'How insecure, discouraged, irritated, stressed, and annoyed were you?' },
];

export default function NasaTLX({ data, onChange, variant }: Props) {
  const label = variant === 'without' ? 'WITHOUT MyoPro' : 'WITH MyoPro';

  return (
    <div>
      <h2 className="section-title">NASA Task Load Index ({label})</h2>
      <p className="section-subtitle">Rate each dimension on a scale of 0-20</p>

      {dimensions.map(dim => (
        <div className="slider-row" key={dim.key} style={{ marginBottom: 16 }}>
          <div style={{ minWidth: 180 }}>
            <div className="slider-label" style={{ fontWeight: 600 }}>{dim.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dim.description}</div>
          </div>
          <input type="range" className="slider-input" min={0} max={20} step={1}
            value={data[dim.key] ?? 0}
            onChange={e => onChange({ ...data, [dim.key]: parseInt(e.target.value) })} />
          <input type="number" min={0} max={20}
            value={data[dim.key] ?? ''}
            onChange={e => onChange({ ...data, [dim.key]: e.target.value ? parseInt(e.target.value) : null })}
            style={{ width: 60 }} />
        </div>
      ))}
    </div>
  );
}
