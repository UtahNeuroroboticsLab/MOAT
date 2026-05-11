import { AssessmentState } from '../types';
import { sisDomains } from '../data/sisItems';
import { fmaSections } from '../data/fmaItems';
import { exportAssessment, downloadWorkbook } from '../utils/exportXlsx';

interface Props {
  state: AssessmentState;
}

function countFilled(obj: Record<string, unknown>): number {
  return Object.values(obj).filter(v => v !== null && v !== undefined && v !== '').length;
}

export default function ExportSection({ state }: Props) {
  const handleExport = async () => {
    const phase = state.patientInfo.assessmentPhase;
    const id = state.patientInfo.id || 'unknown';
    const filename = `${id}__${phase === 'baseline' ? 'baseline' : `phase${phase.replace('m', '').replace('y', '12')}`}_assessment.xlsx`;
    const wb = await exportAssessment(state);
    downloadWorkbook(wb, filename);
  };

  // Completion checks
  const checks = [
    {
      label: 'Patient Info',
      done: !!(state.patientInfo.id && state.patientInfo.date && state.patientInfo.assessmentPhase),
    },
    {
      label: 'MAS / MMT / AROM',
      done: state.mas.rows.some(r => r.mas !== '' && r.mas !== 'NT'),
    },
    {
      label: 'Fugl-Meyer',
      done: Object.keys(state.fma.scores).length > 0,
    },
    {
      label: 'Stroke Impact Scale',
      done: Object.values(state.sis.domains).some(arr => arr.some(v => v !== null)),
    },
    {
      label: 'COPM',
      done: state.copm.problems.some(p => p.description !== ''),
    },
    {
      label: 'Myomo Tasks (W/O)',
      done: state.myomoWithout.tasks.some(t => t.components.some(c => c.achieve > 0 || c.time !== null)),
    },
    {
      label: 'CAHAI (W/O)',
      done: state.cahaiWithout.tasks.some(t => t.score > 1),
    },
    {
      label: 'NASA TLX (W/O)',
      done: state.nasaWithout.mentalDemand !== null,
    },
  ];

  const fmaTotal = Object.values(state.fma.scores).reduce<number>((s, v) => s + ((v !== null && v !== undefined && v >= 0) ? v : 0), 0);
  const fmaItems = fmaSections.reduce((s, sec) => s + sec.items.length, 0);
  const fmaFilled = Object.values(state.fma.scores).filter(v => v !== null && v !== undefined).length;

  return (
    <div className="export-section">
      <h2 className="section-title">Export Assessment</h2>
      <p className="section-subtitle">
        Generate .xlsx file compatible with mapping.json parser
      </p>

      <div className="export-summary">
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Completion Summary</div>
        {checks.map(c => (
          <div className="export-row" key={c.label}>
            <span>{c.label}</span>
            <span className={c.done ? 'export-check' : 'export-empty'}>
              {c.done ? '✓ Has data' : '— Empty'}
            </span>
          </div>
        ))}
        <div className="export-row" style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          <span>FMA Score</span>
          <span>{fmaFilled}/{fmaItems} items → <strong>{fmaTotal}/66</strong></span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Output filename:</strong>{' '}
        <code style={{ background: 'var(--bg-alt)', padding: '2px 6px', borderRadius: 4 }}>
          {state.patientInfo.id || '??'}__
          {state.patientInfo.assessmentPhase === 'baseline' ? 'baseline' : `phase${state.patientInfo.assessmentPhase.replace('m', '').replace('y', '12')}`}
          _assessment.xlsx
        </code>
      </div>

      <button className="btn btn-primary" onClick={handleExport} style={{ fontSize: 16, padding: '12px 32px' }}>
        Export to .xlsx
      </button>
    </div>
  );
}
