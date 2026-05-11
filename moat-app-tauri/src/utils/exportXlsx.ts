import * as XLSX from 'xlsx';
import { AssessmentState } from '../types';
import { sisDomains } from '../data/sisItems';
import { fmaSections } from '../data/fmaItems';
import { cahaiTasks } from '../data/assessmentData';
import { myomoTasks } from '../data/assessmentData';

/**
 * Set a cell value in an existing worksheet, preserving formatting.
 * Creates the cell if it doesn't exist in the template.
 */
function sc(ws: XLSX.WorkSheet, ref: string, value: string | number | null | undefined) {
  if (value === null || value === undefined) return;
  if (ws[ref]) {
    ws[ref].v = value;
    ws[ref].t = typeof value === 'number' ? 'n' : 's';
    delete ws[ref].w;
    delete ws[ref].f;
  } else {
    ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      const cell = XLSX.utils.decode_cell(ref);
      if (cell.r > range.e.r) range.e.r = cell.r;
      if (cell.c > range.e.c) range.e.c = cell.c;
      ws['!ref'] = XLSX.utils.encode_range(range);
    }
  }
}

function formatDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

/**
 * Load the template xlsx from public/, clone it, and fill in assessment data.
 */
export async function exportAssessment(state: AssessmentState): Promise<XLSX.WorkBook> {
  const resp = await fetch('/template_assessment.xlsx');
  const buf = await resp.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  // ========== 1. Patient Info ==========
  const ws1 = wb.Sheets['1_patient_info'];
  if (ws1) {
    sc(ws1, 'B3', state.patientInfo.id);
    sc(ws1, 'B4', formatDate(state.patientInfo.date));
    sc(ws1, 'B5', formatDate(state.patientInfo.date2));
    sc(ws1, 'B6', state.patientInfo.affectedHand);
    sc(ws1, 'B7', state.patientInfo.assessmentPhase);
    sc(ws1, 'B11', state.patientInfo.notes);
  }

  // ========== 2. Stroke Impact Scale ==========
  const ws2 = wb.Sheets['2_StrokeImpactScale'];
  if (ws2) {
    sc(ws2, 'B3', state.patientInfo.id);
    sc(ws2, 'D3', formatDate(state.patientInfo.date));

    for (const domain of sisDomains) {
      const items = state.sis.domains[domain.key];
      const filled = items.filter((v): v is number => v !== null);

      domain.items.forEach((item, idx) => {
        const val = items[idx];
        if (val !== null) sc(ws2, `G${item.gRow}`, val);
      });

      if (filled.length > 0) {
        const scaled = ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100;
        sc(ws2, domain.scaledCell, Math.round(scaled * 100) / 100);
      }
    }

    const allScaled = sisDomains.map(d => {
      const items = state.sis.domains[d.key];
      const filled = items.filter((v): v is number => v !== null);
      if (filled.length === 0) return null;
      return ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100;
    }).filter((v): v is number => v !== null);

    if (allScaled.length > 0) {
      sc(ws2, 'J9', Math.round(allScaled.reduce((a, b) => a + b, 0) / allScaled.length * 100) / 100);
    }

    if (state.sis.recoveryScore !== null) sc(ws2, 'B84', state.sis.recoveryScore);
  }

  // ========== 3. COPM ==========
  const ws3 = wb.Sheets['3_COPM'];
  if (ws3) {
    sc(ws3, 'B3', state.patientInfo.id);
    sc(ws3, 'D3', formatDate(state.patientInfo.date));
    sc(ws3, 'B5', formatDate(state.copm.dates.initial));
    sc(ws3, 'D5', formatDate(state.copm.dates.t2));

    state.copm.problems.forEach((p, i) => {
      const row = 10 + i;
      if (p.description) sc(ws3, `B${row}`, p.description);
      if (p.importance !== null) sc(ws3, `C${row}`, p.importance);
      if (p.perfT1 !== null) sc(ws3, `D${row}`, p.perfT1);
      if (p.satT1 !== null) sc(ws3, `E${row}`, p.satT1);
      if (p.perfT2 !== null) sc(ws3, `F${row}`, p.perfT2);
      if (p.satT2 !== null) sc(ws3, `G${row}`, p.satT2);
    });

    (['D', 'E', 'F', 'G'] as const).forEach((col, ci) => {
      const field = (['perfT1', 'satT1', 'perfT2', 'satT2'] as const)[ci];
      const vals = state.copm.problems.slice(0, 5).map(p => p[field]).filter((v): v is number => v !== null);
      const total = vals.reduce((a, b) => a + b, 0);
      sc(ws3, `${col}16`, total);
      sc(ws3, `${col}17`, vals.length > 0 ? Math.round(total / vals.length * 100) / 100 : 0);
    });
  }

  // ========== 4. Modified Ashworth Scale ==========
  const ws4 = wb.Sheets['4_ModifiedAshworthScale'];
  if (ws4) {
    sc(ws4, 'B3', state.patientInfo.id);
    sc(ws4, 'D3', formatDate(state.patientInfo.date));
    sc(ws4, 'F3', state.patientInfo.affectedHand);

    state.mas.rows.forEach((row, i) => {
      const r = 14 + i;
      sc(ws4, `C${r}`, row.mas);
      sc(ws4, `D${r}`, row.mmt);
      sc(ws4, `E${r}`, row.arom);
    });
  }

  // ========== 5. Fugl-Meyer ==========
  const ws5 = wb.Sheets['5_Fugl-Meyer'];
  if (ws5) {
    sc(ws5, 'B3', state.patientInfo.id);
    sc(ws5, 'D3', formatDate(state.patientInfo.date));
    sc(ws5, 'F3', state.patientInfo.affectedHand);

    let totalFMA = 0;
    for (const section of fmaSections) {
      for (const item of section.items) {
        const score = state.fma.scores[item.id];
        if (score !== null && score !== undefined && score >= 0) {
          sc(ws5, `F${item.fRow}`, score);
          totalFMA += score;
        }
      }
    }
    sc(ws5, 'I13', totalFMA);
  }

  // ========== 6. Box and Blocks ==========
  const ws6 = wb.Sheets['6_box_and_blocks'];
  if (ws6) {
    sc(ws6, 'B3', state.patientInfo.id);
    sc(ws6, 'D3', formatDate(state.patientInfo.date));
    sc(ws6, 'B4', state.patientInfo.affectedHand);
    sc(ws6, 'A10', formatDate(state.patientInfo.date));
    sc(ws6, 'B10', state.patientInfo.affectedHand);
    if (state.boxAndBlocks.withoutMyoPro.affected !== null) sc(ws6, 'D10', state.boxAndBlocks.withoutMyoPro.affected);
    if (state.boxAndBlocks.withoutMyoPro.affectedNotes) sc(ws6, 'E10', state.boxAndBlocks.withoutMyoPro.affectedNotes);
    sc(ws6, 'A11', formatDate(state.patientInfo.date));
    sc(ws6, 'B11', state.patientInfo.affectedHand === 'Right' ? 'Left' : 'Right');
    if (state.boxAndBlocks.withoutMyoPro.unaffected !== null) sc(ws6, 'D11', state.boxAndBlocks.withoutMyoPro.unaffected);
    if (state.boxAndBlocks.withoutMyoPro.unaffectedNotes) sc(ws6, 'E11', state.boxAndBlocks.withoutMyoPro.unaffectedNotes);
    sc(ws6, 'A15', formatDate(state.patientInfo.date));
    sc(ws6, 'B15', state.patientInfo.affectedHand);
    if (state.boxAndBlocks.withMyoPro.affected !== null) sc(ws6, 'D15', state.boxAndBlocks.withMyoPro.affected);
    if (state.boxAndBlocks.withMyoPro.affectedNotes) sc(ws6, 'E15', state.boxAndBlocks.withMyoPro.affectedNotes);
    sc(ws6, 'A16', formatDate(state.patientInfo.date));
    sc(ws6, 'B16', state.patientInfo.affectedHand === 'Right' ? 'Left' : 'Right');
    if (state.boxAndBlocks.withMyoPro.unaffected !== null) sc(ws6, 'D16', state.boxAndBlocks.withMyoPro.unaffected);
    if (state.boxAndBlocks.withMyoPro.unaffectedNotes) sc(ws6, 'E16', state.boxAndBlocks.withMyoPro.unaffectedNotes);
  }

  // ========== 7a/7b. Myomo Tasks ==========
  function writeMyomoSheet(sheetName: string, taskData: typeof state.myomoWithout) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    sc(ws, 'B3', state.patientInfo.id);
    sc(ws, 'D3', formatDate(state.patientInfo.date));

    const taskStartRows = [6, 15, 23, 31];
    myomoTasks.forEach((taskDef, ti) => {
      const startRow = taskStartRows[ti];
      let achieveSum = 0;
      let timeSum = 0;

      taskDef.components.forEach((_, ci) => {
        const r = startRow + 2 + ci;
        const comp = taskData.tasks[ti].components[ci];
        sc(ws, `C${r}`, comp.achieve);
        if (comp.time !== null) sc(ws, `D${r}`, comp.time);
        achieveSum += comp.achieve;
        timeSum += comp.time ?? 0;
      });

      const sumRow = startRow + 2 + taskDef.components.length;
      sc(ws, `C${sumRow}`, achieveSum);
      sc(ws, `D${sumRow}`, timeSum);
    });
  }

  writeMyomoSheet('7a_MyomoTasks_WITHOUT_MYOPRO', state.myomoWithout);
  writeMyomoSheet('7b_MyomoTasks_WITH_MYOPRO', state.myomoWith);

  // ========== 8a/8b. CAHAI ==========
  function writeCAHAISheet(sheetName: string, cahaiData: typeof state.cahaiWithout) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    sc(ws, 'B3', state.patientInfo.id);
    sc(ws, 'D3', formatDate(state.patientInfo.date));
    sc(ws, 'F3', state.patientInfo.affectedHand);

    let total = 0;
    cahaiTasks.forEach((_, i) => {
      const r = 15 + i;
      sc(ws, `C${r}`, cahaiData.tasks[i].role);
      sc(ws, `D${r}`, cahaiData.tasks[i].score);
      if (cahaiData.tasks[i].comment) sc(ws, `E${r}`, cahaiData.tasks[i].comment);
      total += cahaiData.tasks[i].score;
    });

    sc(ws, 'D29', total);
    if (cahaiData.generalComment) sc(ws, 'G15', cahaiData.generalComment);
  }

  writeCAHAISheet('8a_CAHAI_WITHOUT_MYOPRO', state.cahaiWithout);
  writeCAHAISheet('8b_CAHAI_WITH_MYOPRO', state.cahaiWith);

  // ========== 9a/9b. NASA TLX ==========
  function writeNASASheet(sheetName: string, tlxData: typeof state.nasaWithout) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    sc(ws, 'B4', state.patientInfo.id);
    sc(ws, 'D4', formatDate(state.patientInfo.date));
    if (tlxData.mentalDemand !== null) sc(ws, 'B10', tlxData.mentalDemand);
    if (tlxData.physicalDemand !== null) sc(ws, 'B12', tlxData.physicalDemand);
    if (tlxData.temporalDemand !== null) sc(ws, 'B14', tlxData.temporalDemand);
    if (tlxData.performance !== null) sc(ws, 'B16', tlxData.performance);
    if (tlxData.effort !== null) sc(ws, 'B18', tlxData.effort);
    if (tlxData.frustration !== null) sc(ws, 'B20', tlxData.frustration);
  }

  writeNASASheet('9a_NASA_TLX_WITHOUT_MYOPRO', state.nasaWithout);
  writeNASASheet('9b_NASA_TLX_WITH_MYOPRO', state.nasaWith);

  return wb;
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}
