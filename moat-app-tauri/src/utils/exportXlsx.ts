// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – xlsx-populate ships a browser bundle via its "browser" package.json field
import XlsxPopulate from 'xlsx-populate';
import { AssessmentState } from '../types';
import { sisDomains } from '../data/sisItems';
import { fmaSections } from '../data/fmaItems';
import { cahaiTasks, myomoTasks } from '../data/assessmentData';

// Helper: set a cell value only if non-empty; xlsx-populate preserves all other styling untouched
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sv(sheet: any, ref: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return;
  sheet.cell(ref).value(value);
}

function formatDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

/**
 * Load the template xlsx from public/, fill in assessment data via xlsx-populate
 * (which preserves ALL cell formatting / colors by operating at the ZIP level).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportAssessment(state: AssessmentState): Promise<any> {
  const resp = await fetch('/template_assessment.xlsx');
  const buf = await resp.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wb: any = await XlsxPopulate.fromDataAsync(buf);

  // Safe sheet accessor – returns null when sheet doesn't exist in the template
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws = (name: string): any => wb.sheet(name) ?? null;

  // ========== 1. Patient Info ==========
  const w1 = ws('1_patient_info');
  if (w1) {
    sv(w1, 'B3', state.patientInfo.id);
    sv(w1, 'B4', formatDate(state.patientInfo.date));
    sv(w1, 'B5', formatDate(state.patientInfo.date2));
    sv(w1, 'B6', state.patientInfo.affectedHand);
    sv(w1, 'B7', state.patientInfo.assessmentPhase);
    sv(w1, 'B11', state.patientInfo.notes);
  }

  // ========== 2. Stroke Impact Scale ==========
  const w2 = ws('2_StrokeImpactScale');
  if (w2) {
    sv(w2, 'B3', state.patientInfo.id);
    sv(w2, 'D3', formatDate(state.patientInfo.date));

    for (const domain of sisDomains) {
      const items = state.sis.domains[domain.key];
      const filled = items.filter((v): v is number => v !== null);

      domain.items.forEach((item, idx) => {
        const val = items[idx];
        if (val !== null) sv(w2, `G${item.gRow}`, val);
      });

      if (filled.length > 0) {
        const scaled = ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100;
        sv(w2, domain.scaledCell, Math.round(scaled * 100) / 100);
      }
    }

    const allScaled = sisDomains.map(d => {
      const items = state.sis.domains[d.key];
      const filled = items.filter((v): v is number => v !== null);
      if (filled.length === 0) return null;
      return ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100;
    }).filter((v): v is number => v !== null);

    if (allScaled.length > 0) {
      sv(w2, 'J9', Math.round(allScaled.reduce((a, b) => a + b, 0) / allScaled.length * 100) / 100);
    }

    if (state.sis.recoveryScore !== null) sv(w2, 'B84', state.sis.recoveryScore);
  }

  // ========== 3. COPM ==========
  const w3 = ws('3_COPM');
  if (w3) {
    sv(w3, 'B3', state.patientInfo.id);
    sv(w3, 'D3', formatDate(state.patientInfo.date));
    sv(w3, 'B5', formatDate(state.copm.dates.initial));
    sv(w3, 'D5', formatDate(state.copm.dates.t2));

    state.copm.problems.forEach((p, i) => {
      const row = 10 + i;
      sv(w3, `B${row}`, p.description);
      if (p.importance !== null) sv(w3, `C${row}`, p.importance);
      if (p.perfT1 !== null) sv(w3, `D${row}`, p.perfT1);
      if (p.satT1 !== null) sv(w3, `E${row}`, p.satT1);
      if (p.perfT2 !== null) sv(w3, `F${row}`, p.perfT2);
      if (p.satT2 !== null) sv(w3, `G${row}`, p.satT2);
      sv(w3, `H${row}`, p.notes);
    });

    (['D', 'E', 'F', 'G'] as const).forEach((col, ci) => {
      const field = (['perfT1', 'satT1', 'perfT2', 'satT2'] as const)[ci];
      const vals = state.copm.problems.slice(0, 5).map(p => p[field]).filter((v): v is number => v !== null);
      const total = vals.reduce((a, b) => a + b, 0);
      sv(w3, `${col}16`, total);
      sv(w3, `${col}17`, vals.length > 0 ? Math.round(total / vals.length * 100) / 100 : 0);
    });

    const notesCell = state.patientInfo.assessmentPhase === 'baseline' ? 'B54' : 'B57';
    sv(w3, notesCell, state.copm.notes);
  }

  // ========== 4. Modified Ashworth Scale ==========
  const w4 = ws('4_ModifiedAshworthScale');
  if (w4) {
    sv(w4, 'B3', state.patientInfo.id);
    sv(w4, 'D3', formatDate(state.patientInfo.date));
    sv(w4, 'F3', state.patientInfo.affectedHand);

    state.mas.rows.forEach((row, i) => {
      const r = 14 + i;
      sv(w4, `C${r}`, row.mas);
      sv(w4, `D${r}`, row.mmt);
      sv(w4, `E${r}`, row.arom);
      sv(w4, `F${r}`, row.notes);
    });
  }

  // ========== 5. Fugl-Meyer ==========
  const w5 = ws('5_Fugl-Meyer');
  if (w5) {
    sv(w5, 'B3', state.patientInfo.id);
    sv(w5, 'D3', formatDate(state.patientInfo.date));
    sv(w5, 'F3', state.patientInfo.affectedHand);

    let totalFMA = 0;
    for (const section of fmaSections) {
      for (const item of section.items) {
        const score = state.fma.scores[item.id];
        if (score !== null && score !== undefined && score >= 0) {
          sv(w5, `F${item.fRow}`, score);
          totalFMA += score;
        }
      }
      const sectionNote = state.fma.sectionNotes?.[section.title];
      if (sectionNote && section.items.length > 0) {
        sv(w5, `G${section.items[0].fRow}`, sectionNote);
      }
    }
    sv(w5, 'I13', totalFMA);
  }

  // ========== 7a/7b. Myomo Tasks ==========
  const writeMyomoSheet = (sheetName: string, taskData: typeof state.myomoWithout) => {
    const w = ws(sheetName);
    if (!w) return;
    sv(w, 'B3', state.patientInfo.id);
    sv(w, 'D3', formatDate(state.patientInfo.date));

    const taskStartRows = [6, 15, 23, 31];
    myomoTasks.forEach((taskDef, ti) => {
      const startRow = taskStartRows[ti];
      let achieveSum = 0;
      let timeSum = 0;

      taskDef.components.forEach((_, ci) => {
        const r = startRow + 2 + ci;
        const comp = taskData.tasks[ti].components[ci];
        sv(w, `C${r}`, comp.achieve);
        if (comp.time !== null) sv(w, `D${r}`, comp.time);
        achieveSum += comp.achieve;
        timeSum += comp.time ?? 0;
      });

      const sumRow = startRow + 2 + taskDef.components.length;
      sv(w, `C${sumRow}`, achieveSum);
      sv(w, `D${sumRow}`, timeSum);
      sv(w, `E${startRow + 2}`, taskData.tasks[ti].notes);
    });
  };

  writeMyomoSheet('7a_MyomoTasks_WITHOUT_MYOPRO', state.myomoWithout);
  writeMyomoSheet('7b_MyomoTasks_WITH_MYOPRO', state.myomoWith);

  // ========== 8a/8b. CAHAI ==========
  const writeCAHAISheet = (sheetName: string, cahaiData: typeof state.cahaiWithout) => {
    const w = ws(sheetName);
    if (!w) return;
    sv(w, 'B3', state.patientInfo.id);
    sv(w, 'D3', formatDate(state.patientInfo.date));
    sv(w, 'F3', state.patientInfo.affectedHand);

    let total = 0;
    cahaiTasks.forEach((_, i) => {
      const r = 15 + i;
      const score = cahaiData.tasks[i].score;
      sv(w, `C${r}`, cahaiData.tasks[i].role);
      if (score !== null) sv(w, `D${r}`, score);
      sv(w, `E${r}`, cahaiData.tasks[i].comment);
      total += score ?? 0;
    });

    sv(w, 'D29', total);
    sv(w, 'G15', cahaiData.generalComment);
  };

  writeCAHAISheet('8a_CAHAI_WITHOUT_MYOPRO', state.cahaiWithout);
  writeCAHAISheet('8b_CAHAI_WITH_MYOPRO', state.cahaiWith);

  // ========== 9a/9b. NASA TLX ==========
  const writeNASASheet = (sheetName: string, tlxData: typeof state.nasaWithout) => {
    const w = ws(sheetName);
    if (!w) return;
    sv(w, 'B4', state.patientInfo.id);
    sv(w, 'D4', formatDate(state.patientInfo.date));
    if (tlxData.mentalDemand !== null) sv(w, 'B10', tlxData.mentalDemand);
    if (tlxData.physicalDemand !== null) sv(w, 'B12', tlxData.physicalDemand);
    if (tlxData.temporalDemand !== null) sv(w, 'B14', tlxData.temporalDemand);
    if (tlxData.performance !== null) sv(w, 'B16', tlxData.performance);
    if (tlxData.effort !== null) sv(w, 'B18', tlxData.effort);
    if (tlxData.frustration !== null) sv(w, 'B20', tlxData.frustration);
    const noteRows: Record<string, number> = { mentalDemand: 10, physicalDemand: 12, temporalDemand: 14, performance: 16, effort: 18, frustration: 20 };
    Object.entries(noteRows).forEach(([key, row]) => {
      sv(w, `C${row}`, tlxData.dimensionNotes?.[key]);
    });
  };

  writeNASASheet('9a_NASA_TLX_WITHOUT_MYOPRO', state.nasaWithout);
  writeNASASheet('9b_NASA_TLX_WITH_MYOPRO', state.nasaWith);

  // ========== NOTES ==========
  const wNotes = ws('NOTES');
  if (wNotes) {
    // Dedicated extra cells
    sv(wNotes, 'E2', state.sectionNotes['patient_info']);
    sv(wNotes, 'E8', state.sectionNotes['other']);

    // Rows 2–11: col B = Completed (Yes/No), col C = section notes text
    const entries: Array<{ row: number; notesKey: string; recordedKey: string | null }> = [
      { row: 2,  notesKey: 'mas',         recordedKey: null },
      { row: 3,  notesKey: 'fugl_meyer',  recordedKey: null },
      { row: 4,  notesKey: 'sis',         recordedKey: null },
      { row: 5,  notesKey: 'copm',        recordedKey: null },
      { row: 6,  notesKey: 'myomo_tasks', recordedKey: 'myomo_without' },
      { row: 7,  notesKey: 'cahai',       recordedKey: 'cahai_without' },
      { row: 8,  notesKey: 'nasa_tlx',    recordedKey: 'nasa_without' },
      { row: 9,  notesKey: 'myomo_tasks', recordedKey: null },
      { row: 10, notesKey: 'cahai',       recordedKey: null },
      { row: 11, notesKey: 'nasa_tlx',    recordedKey: 'nasa_with' },
    ];

    for (const entry of entries) {
      const completed = entry.recordedKey && state.notRecorded[entry.recordedKey] ? 'No' : 'Yes';
      sv(wNotes, `B${entry.row}`, completed);
      sv(wNotes, `C${entry.row}`, state.sectionNotes[entry.notesKey]);
    }
  }

  return wb;
}

export async function downloadWorkbook(wb: unknown, filename: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (wb as any).outputAsync() as ArrayBuffer;
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function saveWorkbookToDisk(wb: unknown, filename: string): Promise<void> {
  const { saveXlsxBytes } = await import('../utils/tauriCommands');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (wb as any).outputAsync() as ArrayBuffer;
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const arrayBuffer = await blob.arrayBuffer();
  await saveXlsxBytes(filename, Array.from(new Uint8Array(arrayBuffer)));
}

