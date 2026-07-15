import { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { isTauri } from '@tauri-apps/api/core';
import { ensureDataDirs, openAssessmentsFolder } from '../utils/tauriCommands';
import { AssessmentState } from '../types';
import { fmaSections } from '../data/fmaItems';
import { exportAssessment, downloadWorkbook } from '../utils/exportXlsx';

interface Props {
  state: AssessmentState;
  onSaveToDisk?: () => Promise<void>;
}

export default function ExportSection({ state, onSaveToDisk }: Props) {
  const [xlsxSavedAs, setXlsxSavedAs] = useState<string | null>(null);
  const [diskSaved, setDiskSaved] = useState(false);
  const [diskError, setDiskError] = useState<string | null>(null);

  const phaseLabel = state.patientInfo.assessmentPhase === 'baseline'
    ? 'baseline'
    : `phase${state.patientInfo.assessmentPhase.replace('m', '').replace('y', '12')}`;
  const xlsxFilename = `${state.patientInfo.id || '??'}__${phaseLabel}_assessment.xlsx`;

  const handleExport = async () => {
    const wb = await exportAssessment(state);
    await downloadWorkbook(wb, xlsxFilename);
    setXlsxSavedAs(xlsxFilename);
  };

  const handleSaveToDisk = async () => {
    if (!onSaveToDisk) return;
    setDiskError(null);
    try {
      await onSaveToDisk();
      setDiskSaved(true);
      setTimeout(() => setDiskSaved(false), 3000);
    } catch (e) {
      setDiskError(String(e));
      console.log(`disk save error: ${e}`);
    }
  };

  const handleOpenFolder = async () => {
    await openAssessmentsFolder();
  };

  const handleNotify = async () => {
    setDiskError(null);
    try {
      const wb = await exportAssessment(state);
      await downloadWorkbook(wb, xlsxFilename);
      setXlsxSavedAs(xlsxFilename);

      const id = state.patientInfo.id || '??';
      const subject = encodeURIComponent(`[MOAT] P${id} ${phaseLabel} assessment completed`);

      let body: string;
      if (isTauri() && onSaveToDisk) {
        await onSaveToDisk();
        setDiskSaved(true);
        setTimeout(() => setDiskSaved(false), 3000);

        const moatDataPath = await ensureDataDirs();
        const fullPath = `${moatDataPath}\\assessments\\${xlsxFilename}`;
        body = encodeURIComponent(
          `Patient ${id} ${phaseLabel} assessment completed\n\nPatient data is saved to:\n${fullPath}`
        );
      } else {
        body = encodeURIComponent(
          `Patient ${id} ${phaseLabel} assessment completed\n\n${xlsxFilename} was just downloaded — attach it from your Downloads folder.`
        );
      }

      const mailtoUrl = `mailto:Leonardo.Ferrisi@utah.edu?subject=${subject}&body=${body}`;
      if (isTauri()) {
        await openUrl(mailtoUrl);
      } else {
        window.location.href = mailtoUrl;
      }
    } catch (e) {
      setDiskError(String(e));
    }
  };

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
      done: state.cahaiWithout.tasks.some(t => t.score !== null && t.score > 0),
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
      <p className="section-subtitle">Generate .xlsx file compatible with mapping.json parser</p>

      <div className="export-summary">
        <div className="export-summary-header">Completion Summary</div>
        {checks.map(c => (
          <div className="export-row" key={c.label}>
            <span>{c.label}</span>
            <span className={c.done ? 'export-check' : 'export-empty'}>
              {c.done ? '✓ Has data' : '— Empty'}
            </span>
          </div>
        ))}
        <div className="export-row export-fma-row">
          <span>FMA Score</span>
          <span>{fmaFilled}/{fmaItems} items → <strong>{fmaTotal}/66</strong></span>
        </div>
      </div>

      <div className="export-filename-row">
        <strong>Output filename:</strong>{' '}
        <code className="export-filename-code">{xlsxFilename}</code>
      </div>

      <div className="export-btn-row">
        <button type="button" className="btn btn-primary export-btn-xl" onClick={handleExport}>
          Download .xlsx
        </button>
        {/* {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleSaveToDisk}>
            Save to BOX Drive (MOAT_data/assessments)
          </button>
        )} */}
        {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleNotify}>
            Notify Leonardo
          </button>
        )}
        {/* {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleOpenFolder}>
            Open Save Folder
          </button>
        )} */}
      </div>

      {xlsxSavedAs && (
        <div className="export-toast export-toast-success">
          <span>✓ Saved to Downloads: <strong>{xlsxSavedAs}</strong></span>
          <button type="button" className="export-toast-dismiss" onClick={() => setXlsxSavedAs(null)}>×</button>
        </div>
      )}

      {diskSaved && (
        <div className="export-toast export-toast-success">
          <span>✓ Saved to MOAT_data/assessments</span>
          <button type="button" className="export-toast-dismiss" onClick={() => setDiskSaved(false)}>×</button>
        </div>
      )}

      {diskError && (
        <div className="export-toast export-toast-error">
          <span>Error saving: {diskError}</span>
          <button type="button" className="export-toast-dismiss" onClick={() => setDiskError(null)}>×</button>
        </div>
      )}
    </div>
  );
}
