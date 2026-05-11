import * as XLSX from 'xlsx';
import { AssessmentState } from '../types';
import { sisDomains } from '../data/sisItems';
import { fmaSections } from '../data/fmaItems';
import { cahaiTasks } from '../data/assessmentData';
import { myomoTasks } from '../data/assessmentData';

// Helper: set cell value
function sc(ws: XLSX.WorkSheet, ref: string, value: string | number | null | undefined) {
  if (value === null || value === undefined) return;
  const cell = XLSX.utils.decode_cell(ref.replace(/([A-Z]+)(\d+)/, (_, c, r) => c + r));
  if (!ws['!ref']) ws['!ref'] = ref + ':' + ref;
  ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
  // Expand range
  const range = XLSX.utils.decode_range(ws['!ref']);
  if (cell.r > range.e.r) range.e.r = cell.r;
  if (cell.c > range.e.c) range.e.c = cell.c;
  if (cell.r < range.s.r) range.s.r = cell.r;
  if (cell.c < range.s.c) range.s.c = cell.c;
  ws['!ref'] = XLSX.utils.encode_range(range);
}

function formatDate(d: string): string {
  if (!d) return '';
  // Convert from yyyy-mm-dd to MM/DD/YYYY
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

export function exportAssessment(state: AssessmentState): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ========== 1. Patient Info ==========
  const ws1: XLSX.WorkSheet = {};
  sc(ws1, 'A1', 'Patient Assessment Information');
  sc(ws1, 'A3', 'Patient ID:');
  sc(ws1, 'B3', state.patientInfo.id);
  sc(ws1, 'A4', 'Date of Assessment:');
  sc(ws1, 'B4', formatDate(state.patientInfo.date));
  sc(ws1, 'A5', '2nd Date of Assessment:');
  sc(ws1, 'B5', formatDate(state.patientInfo.date2));
  sc(ws1, 'A6', 'Affected Hand');
  sc(ws1, 'B6', state.patientInfo.affectedHand);
  sc(ws1, 'A7', 'Assessment_Phase');
  sc(ws1, 'B7', state.patientInfo.assessmentPhase);
  sc(ws1, 'A11', 'Notes:');
  sc(ws1, 'B11', state.patientInfo.notes);
  XLSX.utils.book_append_sheet(wb, ws1, '1_patient_info');

  // ========== 2. Stroke Impact Scale ==========
  const ws2: XLSX.WorkSheet = {};
  sc(ws2, 'A1', 'Stroke Impact Scale (SIS) v3.0');
  sc(ws2, 'A3', 'Patient ID:');
  sc(ws2, 'B3', state.patientInfo.id);
  sc(ws2, 'C3', 'Date:');
  sc(ws2, 'D3', formatDate(state.patientInfo.date));

  // Write headers and scores for each domain
  for (const domain of sisDomains) {
    const items = state.sis.domains[domain.key];
    const filled = items.filter((v): v is number => v !== null);
    const scaledScore = filled.length > 0
      ? ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100
      : null;

    // Write individual scores to G column
    domain.items.forEach((item, idx) => {
      const val = items[idx];
      if (val !== null) sc(ws2, `G${item.gRow}`, val);
    });

    // Write scaled score to H column
    const hRow = parseInt(domain.scaledCell.replace('H', ''));
    if (scaledScore !== null) sc(ws2, domain.scaledCell, Math.round(scaledScore * 100) / 100);
  }

  // Overall scaled score (J9) = average of all domain scaled scores
  const allDomainScaled = sisDomains.map(d => {
    const items = state.sis.domains[d.key];
    const filled = items.filter((v): v is number => v !== null);
    if (filled.length === 0) return null;
    return ((filled.reduce((a, b) => a + b, 0) / filled.length - 1) / 4) * 100;
  }).filter((v): v is number => v !== null);

  if (allDomainScaled.length > 0) {
    sc(ws2, 'J9', Math.round(allDomainScaled.reduce((a, b) => a + b, 0) / allDomainScaled.length * 100) / 100);
  }

  // Recovery score
  sc(ws2, 'A83', '9. Self Reported Stroke Recovery Measure');
  sc(ws2, 'B83', 'Score');
  if (state.sis.recoveryScore !== null) sc(ws2, 'B84', state.sis.recoveryScore);

  XLSX.utils.book_append_sheet(wb, ws2, '2_StrokeImpactScale');

  // ========== 3. COPM ==========
  const ws3: XLSX.WorkSheet = {};
  sc(ws3, 'A1', 'Canadian Occupational Performance Measure (COPM)');
  sc(ws3, 'A3', 'Patient ID:');
  sc(ws3, 'B3', state.patientInfo.id);
  sc(ws3, 'C3', 'Date:');
  sc(ws3, 'D3', formatDate(state.patientInfo.date));
  sc(ws3, 'A5', 'Time 1: Initial Assessment Date ');
  sc(ws3, 'B5', formatDate(state.copm.dates.initial));
  sc(ws3, 'C5', 'Time 2: Re-Assessment Date');
  sc(ws3, 'D5', formatDate(state.copm.dates.t2));

  // Headers
  sc(ws3, 'A9', 'Item');
  sc(ws3, 'B9', 'Ocupational Perfomance Problem (OPP)');
  sc(ws3, 'C9', 'Importance');
  sc(ws3, 'D9', 'Performance T1');
  sc(ws3, 'E9', 'Satisfaction T1');
  sc(ws3, 'F9', 'Performance T2');
  sc(ws3, 'G9', 'Satisfaction T2');

  state.copm.problems.forEach((p, i) => {
    const row = 10 + i;
    sc(ws3, `A${row}`, i + 1);
    if (p.description) sc(ws3, `B${row}`, p.description);
    if (p.importance !== null) sc(ws3, `C${row}`, p.importance);
    if (p.perfT1 !== null) sc(ws3, `D${row}`, p.perfT1);
    if (p.satT1 !== null) sc(ws3, `E${row}`, p.satT1);
    if (p.perfT2 !== null) sc(ws3, `F${row}`, p.perfT2);
    if (p.satT2 !== null) sc(ws3, `G${row}`, p.satT2);
  });

  // Totals and averages
  const computeAvg = (field: 'perfT1' | 'satT1' | 'perfT2' | 'satT2') => {
    const vals = state.copm.problems.slice(0, 5).map(p => p[field]).filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  sc(ws3, 'A16', 'Total Score');
  sc(ws3, 'A17', 'Average Score');
  ['D', 'E', 'F', 'G'].forEach((col, ci) => {
    const field = (['perfT1', 'satT1', 'perfT2', 'satT2'] as const)[ci];
    const vals = state.copm.problems.slice(0, 5).map(p => p[field]).filter((v): v is number => v !== null);
    const total = vals.reduce((a, b) => a + b, 0);
    sc(ws3, `${col}16`, total);
    sc(ws3, `${col}17`, vals.length > 0 ? Math.round(total / vals.length * 100) / 100 : 0);
  });

  XLSX.utils.book_append_sheet(wb, ws3, '3_COPM');

  // ========== 4. Modified Ashworth Scale ==========
  const ws4: XLSX.WorkSheet = {};
  sc(ws4, 'A1', 'Modified Ashworth Scale');
  sc(ws4, 'A3', 'Patient ID:');
  sc(ws4, 'B3', state.patientInfo.id);
  sc(ws4, 'C3', 'Date:');
  sc(ws4, 'D3', formatDate(state.patientInfo.date));
  sc(ws4, 'E3', 'Side Assessed:');
  sc(ws4, 'F3', state.patientInfo.affectedHand);

  sc(ws4, 'A13', 'Joint');
  sc(ws4, 'B13', 'Muscle Group');
  sc(ws4, 'C13', 'MAS Score');
  sc(ws4, 'D13', 'MMT Score');
  sc(ws4, 'E13', 'AROM');

  state.mas.rows.forEach((row, i) => {
    const r = 14 + i;
    sc(ws4, `A${r}`, row.joint);
    sc(ws4, `B${r}`, row.muscle);
    sc(ws4, `C${r}`, row.mas);
    sc(ws4, `D${r}`, row.mmt);
    sc(ws4, `E${r}`, row.arom);
  });

  XLSX.utils.book_append_sheet(wb, ws4, '4_ModifiedAshworthScale');

  // ========== 5. Fugl-Meyer ==========
  const ws5: XLSX.WorkSheet = {};
  sc(ws5, 'A1', 'Fugl-Meyer Assessment - Upper Extremity (FMA-UE)');
  sc(ws5, 'A3', 'Patient ID:');
  sc(ws5, 'B3', state.patientInfo.id);
  sc(ws5, 'C3', 'Date:');
  sc(ws5, 'D3', formatDate(state.patientInfo.date));
  sc(ws5, 'E3', 'Side Assessed:');
  sc(ws5, 'F3', state.patientInfo.affectedHand);

  sc(ws5, 'A7', 'Section');
  sc(ws5, 'B7', 'Item');
  sc(ws5, 'C7', 'Description');
  sc(ws5, 'D7', 'Score Option');
  sc(ws5, 'E7', 'Check Score');
  sc(ws5, 'F7', 'Score Value (0 - 2)');

  let totalFMA = 0;
  for (const section of fmaSections) {
    for (const item of section.items) {
      const score = state.fma.scores[item.id];
      if (score !== null && score !== undefined && score >= 0) {
        sc(ws5, `F${item.fRow}`, score);
        totalFMA += score;
      }
      // Write item ID and name
      sc(ws5, `A${item.fRow}`, item.id);
      sc(ws5, `B${item.fRow}`, item.name);
    }
  }

  sc(ws5, 'H13', 'TOTAL SCORE:');
  sc(ws5, 'I13', totalFMA);

  XLSX.utils.book_append_sheet(wb, ws5, '5_Fugl-Meyer');

  // ========== 6. Box and Blocks ==========
  const ws6: XLSX.WorkSheet = {};
  sc(ws6, 'A1', 'Box and Blocks Test');
  sc(ws6, 'A3', 'Patient ID:');
  sc(ws6, 'B3', state.patientInfo.id);
  sc(ws6, 'C3', 'Date:');
  sc(ws6, 'D3', formatDate(state.patientInfo.date));
  sc(ws6, 'A4', 'Affected Hand:');
  sc(ws6, 'B4', state.patientInfo.affectedHand);
  sc(ws6, 'A8', 'WITHOUT MYOPRO');
  sc(ws6, 'A10', formatDate(state.patientInfo.date));
  sc(ws6, 'B10', state.patientInfo.affectedHand);
  sc(ws6, 'C10', 'Standard 60s');
  if (state.boxAndBlocks.withoutMyoPro.affected !== null) sc(ws6, 'D10', state.boxAndBlocks.withoutMyoPro.affected);
  sc(ws6, 'E10', state.boxAndBlocks.withoutMyoPro.affectedNotes);
  sc(ws6, 'A11', formatDate(state.patientInfo.date));
  sc(ws6, 'B11', state.patientInfo.affectedHand === 'Right' ? 'Left' : 'Right');
  sc(ws6, 'C11', 'Standard 60s');
  if (state.boxAndBlocks.withoutMyoPro.unaffected !== null) sc(ws6, 'D11', state.boxAndBlocks.withoutMyoPro.unaffected);
  sc(ws6, 'E11', state.boxAndBlocks.withoutMyoPro.unaffectedNotes);
  sc(ws6, 'A13', 'WITH MYOPRO');
  sc(ws6, 'A15', formatDate(state.patientInfo.date));
  sc(ws6, 'B15', state.patientInfo.affectedHand);
  sc(ws6, 'C15', 'Standard 60s');
  if (state.boxAndBlocks.withMyoPro.affected !== null) sc(ws6, 'D15', state.boxAndBlocks.withMyoPro.affected);
  sc(ws6, 'E15', state.boxAndBlocks.withMyoPro.affectedNotes);
  sc(ws6, 'A16', formatDate(state.patientInfo.date));
  sc(ws6, 'B16', state.patientInfo.affectedHand === 'Right' ? 'Left' : 'Right');
  sc(ws6, 'C16', 'Standard 60s');
  if (state.boxAndBlocks.withMyoPro.unaffected !== null) sc(ws6, 'D16', state.boxAndBlocks.withMyoPro.unaffected);
  sc(ws6, 'E16', state.boxAndBlocks.withMyoPro.unaffectedNotes);

  XLSX.utils.book_append_sheet(wb, ws6, '6_box_and_blocks');

  // ========== 7a/7b. Myomo Tasks ==========
  function writeMyomoSheet(ws: XLSX.WorkSheet, taskData: typeof state.myomoWithout, label: string) {
    sc(ws, 'A1', `Myomo Functional Tasks (${label})`);
    sc(ws, 'A3', 'Patient ID:');
    sc(ws, 'B3', state.patientInfo.id);
    sc(ws, 'C3', 'Date:');
    sc(ws, 'D3', formatDate(state.patientInfo.date));

    // Task rows: Task1 starts at row 6, components at rows 8-12, SUM at 13
    // Task2: row 15, comps 17-20, SUM 21
    // Task3: row 23, comps 25-28, SUM 29
    // Task4: row 31, comps 33-36, SUM 37
    const taskStartRows = [6, 15, 23, 31];

    myomoTasks.forEach((taskDef, ti) => {
      const startRow = taskStartRows[ti];
      sc(ws, `A${startRow}`, taskDef.name);
      sc(ws, `C${startRow}`, label);
      sc(ws, `A${startRow + 1}`, 'Component #');
      sc(ws, `B${startRow + 1}`, 'Name');
      sc(ws, `C${startRow + 1}`, 'Achieve?');
      sc(ws, `D${startRow + 1}`, 'Time [sec]');

      let achieveSum = 0;
      let timeSum = 0;

      taskDef.components.forEach((compName, ci) => {
        const r = startRow + 2 + ci;
        sc(ws, `A${r}`, ci + 1);
        sc(ws, `B${r}`, compName);
        const comp = taskData.tasks[ti].components[ci];
        sc(ws, `C${r}`, comp.achieve);
        if (comp.time !== null) sc(ws, `D${r}`, comp.time);
        achieveSum += comp.achieve;
        timeSum += comp.time ?? 0;
      });

      const sumRow = startRow + 2 + taskDef.components.length;
      sc(ws, `B${sumRow}`, 'SUM');
      sc(ws, `C${sumRow}`, achieveSum);
      sc(ws, `D${sumRow}`, timeSum);
    });
  }

  const ws7a: XLSX.WorkSheet = {};
  writeMyomoSheet(ws7a, state.myomoWithout, 'WITHOUT MyoPro');
  XLSX.utils.book_append_sheet(wb, ws7a, '7a_MyomoTasks_WITHOUT_MYOPRO');

  const ws7b: XLSX.WorkSheet = {};
  writeMyomoSheet(ws7b, state.myomoWith, 'WITH MyoPro');
  XLSX.utils.book_append_sheet(wb, ws7b, '7b_MyomoTasks_WITH_MYOPRO');

  // ========== 8a/8b. CAHAI ==========
  function writeCAHAISheet(ws: XLSX.WorkSheet, cahaiData: typeof state.cahaiWithout, label: string) {
    sc(ws, 'A1', `Chedoke Arm and Hand Activity Inventory (CAHAI-13) (${label})`);
    sc(ws, 'A3', 'Patient ID:');
    sc(ws, 'B3', state.patientInfo.id);
    sc(ws, 'C3', 'Date:');
    sc(ws, 'D3', formatDate(state.patientInfo.date));
    sc(ws, 'E3', 'Affected Limb:');
    sc(ws, 'F3', state.patientInfo.affectedHand);

    sc(ws, 'A14', '#');
    sc(ws, 'B14', 'Task');
    sc(ws, 'C14', 'Role of Affected Arm');
    sc(ws, 'D14', 'Score (1-7)');
    sc(ws, 'E14', 'Comments');

    let total = 0;
    cahaiTasks.forEach((taskDef, i) => {
      const r = 15 + i;
      sc(ws, `A${r}`, taskDef.num);
      sc(ws, `B${r}`, taskDef.task);
      sc(ws, `C${r}`, cahaiData.tasks[i].role);
      sc(ws, `D${r}`, cahaiData.tasks[i].score);
      if (cahaiData.tasks[i].comment) sc(ws, `E${r}`, cahaiData.tasks[i].comment);
      total += cahaiData.tasks[i].score;
    });

    sc(ws, 'C29', 'Total Score (out of 91):');
    sc(ws, 'D29', total);
    sc(ws, 'E29', '/91');
    if (cahaiData.generalComment) sc(ws, 'G15', cahaiData.generalComment);
  }

  const ws8a: XLSX.WorkSheet = {};
  writeCAHAISheet(ws8a, state.cahaiWithout, 'WITHOUT MYOPRO');
  XLSX.utils.book_append_sheet(wb, ws8a, '8a_CAHAI_WITHOUT_MYOPRO');

  const ws8b: XLSX.WorkSheet = {};
  writeCAHAISheet(ws8b, state.cahaiWith, 'WITH MYOPRO');
  XLSX.utils.book_append_sheet(wb, ws8b, '8b_CAHAI_WITH_MYOPRO');

  // ========== 9a/9b. NASA TLX ==========
  function writeNASASheet(ws: XLSX.WorkSheet, tlxData: typeof state.nasaWithout, label: string) {
    sc(ws, 'A1', `NASA TASK LOAD INDEX Scoring  (${label})`);
    sc(ws, 'A4', 'Patient ID:');
    sc(ws, 'B4', state.patientInfo.id);
    sc(ws, 'C4', 'Date:');
    sc(ws, 'D4', formatDate(state.patientInfo.date));
    sc(ws, 'A8', 'Rate on a scale of 0-20');
    sc(ws, 'A10', 'Mental Demand');
    if (tlxData.mentalDemand !== null) sc(ws, 'B10', tlxData.mentalDemand);
    sc(ws, 'A12', 'Physical Demand');
    if (tlxData.physicalDemand !== null) sc(ws, 'B12', tlxData.physicalDemand);
    sc(ws, 'A14', 'Temporal Demand');
    if (tlxData.temporalDemand !== null) sc(ws, 'B14', tlxData.temporalDemand);
    sc(ws, 'A16', 'Performance');
    if (tlxData.performance !== null) sc(ws, 'B16', tlxData.performance);
    sc(ws, 'A18', 'Effort');
    if (tlxData.effort !== null) sc(ws, 'B18', tlxData.effort);
    sc(ws, 'A20', 'Frustration');
    if (tlxData.frustration !== null) sc(ws, 'B20', tlxData.frustration);
  }

  const ws9a: XLSX.WorkSheet = {};
  writeNASASheet(ws9a, state.nasaWithout, 'WITHOUT MYOPRO');
  XLSX.utils.book_append_sheet(wb, ws9a, '9a_NASA_TLX_WITHOUT_MYOPRO');

  const ws9b: XLSX.WorkSheet = {};
  writeNASASheet(ws9b, state.nasaWith, 'WITH MYOPRO');
  XLSX.utils.book_append_sheet(wb, ws9b, '9b_NASA_TLX_WITH_MYOPRO');

  return wb;
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}
