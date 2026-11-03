import { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { isTauri } from '@tauri-apps/api/core';
import { ensureDataDirs, openAssessmentsFolder } from '../utils/tauriCommands';
import { AssessmentState } from '../types';
import { fmaSections } from '../data/fmaItems';
import { exportAssessment, downloadWorkbook } from '../utils/exportXlsx';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { uploadAssessmentToSupabase, notifyAssessmentUploaded, UploadResult } from '../utils/supabaseUpload';

interface Props {
  state: AssessmentState;
  onSaveToDisk?: () => Promise<void>;
}

type CloudStatus = 'idle' | 'uploading' | 'notifying' | 'success' | 'error';

export default function ExportSection({ state, onSaveToDisk }: Props) {
  const [xlsxSavedAs, setXlsxSavedAs] = useState<string | null>(null);
  const [diskSaved, setDiskSaved] = useState(false);
  const [diskError, setDiskError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [cloudResult, setCloudResult] = useState<UploadResult | null>(null);
  const [showAssessorModal, setShowAssessorModal] = useState(false);
  const [assessorName, setAssessorName] = useState('');
  const [customAssessor, setCustomAssessor] = useState('');

  const phaseMap: Record<string, string> = {
    baseline: 'baseline',
    '2m': 'phase1_2m',
    '4m': 'phase2_4m',
    '6m': 'phase3_6m',
    '1y': 'phase4_12m',
  };
  const phaseLabel = phaseMap[state.patientInfo.assessmentPhase] ?? 'baseline';
  const xlsxFilename = `${state.patientInfo.id || '??'}_${phaseLabel}_assessment.xlsx`;

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
    if (!onSaveToDisk) return;
    setDiskError(null);
    try {
      await onSaveToDisk();
      setDiskSaved(true);
      setTimeout(() => setDiskSaved(false), 3000);

      const id = state.patientInfo.id || '??';
      const moatDataPath = await ensureDataDirs();
      const fullPath = `${moatDataPath}\\assessments\\${xlsxFilename}`;
      const subject = encodeURIComponent(`[MOAT] P${id} ${phaseLabel} assessment completed`);
      const body = encodeURIComponent(
        `Patient ${id} ${phaseLabel} assessment completed\n\nPatient data is saved to:\n${fullPath}`
      );
      const mailtoUrl = `mailto:Leonardo.Ferrisi@utah.edu?cc=caden.hamrick@utah.edu&subject=${subject}&body=${body}`;
      if (isTauri()) {
        await openUrl(mailtoUrl);
      } else {
        window.location.href = mailtoUrl;
      }
    } catch (e) {
      setDiskError(String(e));
    }
  };

  const handleBackupClick = () => {
    setAssessorName('');
    setCustomAssessor('');
    setShowAssessorModal(true);
  };

  const handleAssessorSelect = (name: string) => {
    setAssessorName(name);
    if (name !== 'other') setCustomAssessor('');
  };

  const handleAssessorConfirm = async () => {
    const finalName = assessorName === 'other' ? customAssessor.trim() : assessorName;
    setShowAssessorModal(false);

    setCloudStatus('idle');
    setCloudResult(null);
    setDiskError(null);

    const wb = await exportAssessment(state, finalName || undefined);

    // Local download always completes first
    await downloadWorkbook(wb, xlsxFilename);
    setXlsxSavedAs(xlsxFilename);

    // Save to disk if available
    if (onSaveToDisk) {
      try {
        await onSaveToDisk();
        setDiskSaved(true);
        setTimeout(() => setDiskSaved(false), 3000);
      } catch (e) {
        setDiskError(String(e));
      }
    }

    // Cloud backup
    setCloudStatus('uploading');
    const result = await uploadAssessmentToSupabase(wb, xlsxFilename, state.patientInfo.id);
    setCloudResult(result);

    if (!result.success) {
      setCloudStatus('error');
      return;
    }

    // Email notification via Edge Function
    setCloudStatus('notifying');
    await notifyAssessmentUploaded(state.patientInfo.id, phaseLabel, xlsxFilename, finalName || undefined);
    setCloudStatus('success');
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

  const cloudBusy = cloudStatus === 'uploading' || cloudStatus === 'notifying';
  const cloudStatusLabel: Record<CloudStatus, string> = {
    idle: '',
    uploading: 'Uploading to cloud...',
    notifying: 'Sending notification...',
    success: 'Backed up and notified',
    error: 'Cloud backup failed',
  };

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
          <span>{fmaFilled}/{fmaItems} items &rarr; <strong>{fmaTotal}/66</strong></span>
        </div>
      </div>

      <div className="export-filename-row">
        <strong>Output filename:</strong>{' '}
        <code className="export-filename-code">{xlsxFilename}</code>
      </div>

      <div className="export-btn-row">
        {isSupabaseConfigured() && (
          <button
            type="button"
            className="btn btn-primary export-btn-xl"
            onClick={handleBackupClick}
            disabled={cloudBusy}
          >
            {cloudBusy ? cloudStatusLabel[cloudStatus] : 'Export, Backup & Notify'}
          </button>
        )}
        <button
          type="button"
          className={`btn ${isSupabaseConfigured() ? 'btn-outline' : 'btn-primary'} export-btn-xl`}
          onClick={handleExport}
        >
          Export as .xlsx to Downloads
        </button>
        {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleSaveToDisk}>
            Save to BOX Drive (MOAT_data/assessments)
          </button>
        )}
        {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleNotify}>
            Notify Leonardo (email client)
          </button>
        )}
        {onSaveToDisk && (
          <button type="button" className="btn btn-outline export-btn-xl" onClick={handleOpenFolder}>
            Open Save Folder
          </button>
        )}
      </div>

      {xlsxSavedAs && (
        <div className="export-toast export-toast-success">
          <span>&#10003; Saved to Downloads: <strong>{xlsxSavedAs}</strong></span>
          <button type="button" className="export-toast-dismiss" onClick={() => setXlsxSavedAs(null)}>&times;</button>
        </div>
      )}

      {diskSaved && (
        <div className="export-toast export-toast-success">
          <span>&#10003; Saved to MOAT_data/assessments</span>
          <button type="button" className="export-toast-dismiss" onClick={() => setDiskSaved(false)}>&times;</button>
        </div>
      )}

      {cloudStatus === 'success' && cloudResult && (
        <div className="export-toast export-toast-success">
          <span>&#10003; {cloudResult.message} &mdash; notification sent</span>
          <button type="button" className="export-toast-dismiss" onClick={() => { setCloudStatus('idle'); setCloudResult(null); }}>&times;</button>
        </div>
      )}

      {cloudStatus === 'error' && cloudResult && (
        <div className="export-toast export-toast-error">
          <span>Cloud backup: {cloudResult.message}</span>
          <button type="button" className="export-toast-dismiss" onClick={() => { setCloudStatus('idle'); setCloudResult(null); }}>&times;</button>
        </div>
      )}

      {diskError && (
        <div className="export-toast export-toast-error">
          <span>Error saving: {diskError}</span>
          <button type="button" className="export-toast-dismiss" onClick={() => setDiskError(null)}>&times;</button>
        </div>
      )}

      {showAssessorModal && (
        <div className="assessor-modal-overlay" onClick={() => setShowAssessorModal(false)}>
          <div className="assessor-modal" onClick={e => e.stopPropagation()}>
            <h3 className="assessor-modal-title">Who are you?</h3>
            <div className="assessor-modal-options">
              {['Devyn', 'Leah'].map(name => (
                <button
                  key={name}
                  type="button"
                  className={`btn assessor-option ${assessorName === name ? 'assessor-option-selected' : 'btn-outline'}`}
                  onClick={() => handleAssessorSelect(name)}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                className={`btn assessor-option ${assessorName === 'other' ? 'assessor-option-selected' : 'btn-outline'}`}
                onClick={() => handleAssessorSelect('other')}
              >
                Other
              </button>
            </div>
            {assessorName === 'other' && (
              <input
                type="text"
                className="assessor-input"
                placeholder="Enter your name"
                value={customAssessor}
                onChange={e => setCustomAssessor(e.target.value)}
                autoFocus
              />
            )}
            <div className="assessor-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAssessorModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAssessorConfirm}
                disabled={!assessorName || (assessorName === 'other' && !customAssessor.trim())}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
