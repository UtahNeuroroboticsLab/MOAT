import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { COPMData } from '../types';

/**
 * COPM PDF export.
 *
 * Produces a two-page PDF straight from the existing COPMData model:
 *   Page 1 – Re-Assessment form view (the occupational-performance-problem
 *            scoring table: Importance + Performance/Satisfaction at T1 & T2).
 *            T1 = baseline, T2 = current re-assessment.
 *   Page 2 – "Reformatted" view (Step 1A/1B/1C identification of occupational
 *            performance issues + importance ratings).
 *
 * Only the top-5 problems count toward the average; #6 and #7 are backups,
 * mirroring the paper form.
 */

export interface CopmPdfOptions {
  /** Participant / patient identifier printed in the header. */
  participantId?: string;
  /** Assessment date printed in the header (YYYY-MM-DD). Defaults to today. */
  assessmentDate?: string;
}

const BRAND = '#0f766e'; // teal-700, neutral accent for headers
const ROW_ALT = '#f1f5f9';

function formatDate(d?: string): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${m}/${day}/${y}`;
}

function num(v: number | null | undefined): string {
  return v === null || v === undefined ? '' : String(v);
}

/** Average of a T1/T2 performance/satisfaction field over the top-5 problems. */
function avg(copm: COPMData, field: 'perfT1' | 'satT1' | 'perfT2' | 'satT2'): string {
  const vals = copm.problems
    .slice(0, 5)
    .map(p => p[field])
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

// ---------------------------------------------------------------------------
// Page 1 – Re-Assessment problem-scoring table
// ---------------------------------------------------------------------------
function drawReassessmentPage(doc: jsPDF, copm: COPMData, opts: CopmPdfOptions): void {
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('COPM Re-Assessment', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text('**Only use top 5 — #6 and #7 are backups in case any of 1–5 are deemed inappropriate.', margin, y);
  doc.setTextColor(0);
  y += 16;

  // Header line: participant + dates
  doc.setFontSize(10);
  const headerBits = [
    `Participant #: ${opts.participantId || '________'}`,
    `Initial (T1): ${formatDate(copm.dates.initial) || '________'}`,
    `Re-Assessment (T2): ${formatDate(copm.dates.t2) || '________'}`,
  ];
  doc.text(headerBits.join('        '), margin, y);
  y += 10;

  const head: RowInput[] = [
    [
      { content: '#', rowSpan: 2 },
      { content: 'Occupational Performance Problem', rowSpan: 2 },
      { content: 'Importance', rowSpan: 2 },
      { content: 'Initial (T1)', colSpan: 2 },
      { content: 'Current (T2)', colSpan: 2 },
      { content: 'Notes', rowSpan: 2 },
    ],
    ['Perf.', 'Sat.', 'Perf.', 'Sat.'],
  ];

  const body: RowInput[] = copm.problems.map((p, i) => {
    const label = i >= 5 ? `**${i + 1}` : `${i + 1}`;
    return [
      label,
      p.description || '',
      num(p.importance),
      num(p.perfT1),
      num(p.satT1),
      num(p.perfT2),
      num(p.satT2),
      p.notes || '',
    ];
  });

  body.push([
    { content: 'Total Scores (average, top 5):', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: avg(copm, 'perfT1'), styles: { fontStyle: 'bold' } },
    { content: avg(copm, 'satT1'), styles: { fontStyle: 'bold' } },
    { content: avg(copm, 'perfT2'), styles: { fontStyle: 'bold' } },
    { content: avg(copm, 'satT2'), styles: { fontStyle: 'bold' } },
    { content: '', styles: {} },
  ]);

  autoTable(doc, {
    startY: y + 6,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'middle', lineColor: [203, 213, 225], textColor: 30 },
    headStyles: { fillColor: BRAND, textColor: 255, halign: 'center', fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 52 },
      3: { halign: 'center', cellWidth: 34 },
      4: { halign: 'center', cellWidth: 34 },
      5: { halign: 'center', cellWidth: 34 },
      6: { halign: 'center', cellWidth: 34 },
      7: { cellWidth: 120 },
    },
    margin: { left: margin, right: margin },
  });
}

// ---------------------------------------------------------------------------
// Page 2 – Reformatted identification / importance view
// ---------------------------------------------------------------------------
interface CategoryDef {
  label: string;
  notes: string[];
  ratings: (number | null)[];
}

function buildIdentificationRows(copm: COPMData): RowInput[] {
  const rows: RowInput[] = [];

  const stepHeader = (text: string) =>
    rows.push([
      {
        content: text,
        colSpan: 3,
        styles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
      },
    ]);

  const category = ({ label, notes, ratings }: CategoryDef) => {
    const count = Math.max(notes.length, ratings.length, 1);
    for (let i = 0; i < count; i++) {
      const row: RowInput = [];
      if (i === 0) {
        row.push({ content: label, rowSpan: count, styles: { valign: 'middle', fontStyle: 'bold' } });
      }
      row.push(notes[i] ?? '');
      row.push({ content: num(ratings[i]), styles: { halign: 'center' } });
      rows.push(row);
    }
  };

  const id = copm.identificationNotes;
  const imp = copm.importanceRatings;

  stepHeader('STEP 1A: Self-Care');
  category({ label: 'Personal Care\n(dressing, bathing, feeding, hygiene)', notes: id.selfCare.personalCare, ratings: imp.selfCare.personalCare });
  category({ label: 'Functional Mobility\n(transfers, indoor, outdoor)', notes: id.selfCare.functionalMobility, ratings: imp.selfCare.functionalMobility });
  category({ label: 'Community Management\n(transportation, shopping, finances)', notes: id.selfCare.communityMgmt, ratings: imp.selfCare.communityMgmt });

  stepHeader('STEP 1B: Productivity');
  category({ label: 'Paid / Unpaid Work\n(finding/keeping a job, volunteering)', notes: id.productivity.paidWork, ratings: imp.productivity.paidWork });
  category({ label: 'Household Management\n(cleaning, laundry, cooking)', notes: id.productivity.householdMgmt, ratings: imp.productivity.householdMgmt });
  category({ label: 'Play\n(play skills, homework)', notes: id.productivity.play, ratings: imp.productivity.play });

  stepHeader('STEP 1C: Leisure');
  category({ label: 'Quiet Recreation\n(hobbies, crafts, reading)', notes: id.leisure.quietRec, ratings: imp.leisure.quietRec });
  category({ label: 'Active Recreation\n(sports, outings, travel)', notes: id.leisure.activeRec, ratings: imp.leisure.activeRec });
  category({ label: 'Socialization\n(visiting, phone calls, parties)', notes: id.leisure.socialization, ratings: imp.leisure.socialization });

  return rows;
}

function drawReformattedPage(doc: jsPDF, copm: COPMData, opts: CopmPdfOptions): void {
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Canadian Occupational Performance Measure (COPM)', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Participant #: ${opts.participantId || '________'}        Assessment: Initial        Date: ${formatDate(opts.assessmentDate) || '________'}`,
    margin,
    y,
  );
  y += 6;

  autoTable(doc, {
    startY: y + 6,
    head: [
      [
        { content: 'Category', styles: { halign: 'left' } },
        { content: 'Identification of Occupational Performance Issues', styles: { halign: 'left' } },
        { content: 'Importance', styles: { halign: 'center' } },
      ],
    ],
    body: buildIdentificationRows(copm),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'middle', lineColor: [203, 213, 225], textColor: 30 },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 60, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  if (copm.notes) {
    const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes & Observations', margin, endY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(copm.notes, doc.internal.pageSize.getWidth() - margin * 2);
    doc.text(wrapped, margin, endY + 14);
  }
}

/** Build the two-page COPM PDF document. */
export function generateCopmPdf(copm: COPMData, opts: CopmPdfOptions = {}): jsPDF {
  const resolved: CopmPdfOptions = {
    ...opts,
    assessmentDate: opts.assessmentDate || copm.dates.initial,
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  drawReassessmentPage(doc, copm, resolved);
  doc.addPage();
  drawReformattedPage(doc, copm, resolved);

  return doc;
}

/**
 * Generate and trigger a browser download of the COPM PDF (goes to Downloads).
 * Mirrors the blob-download pattern used by exportXlsx.downloadWorkbook.
 */
export function downloadCopmPdf(copm: COPMData, filename: string, opts: CopmPdfOptions = {}): void {
  const doc = generateCopmPdf(copm, opts);
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Save the COPM PDF to disk under MOAT_data/assessments (via the Tauri backend)
 * and return the absolute path it was written to.
 *
 * Reuses the generic `save_xlsx_bytes` command, which writes raw bytes to
 * MOAT_data/assessments/<filename> regardless of extension.
 */
export async function saveCopmPdfToDisk(
  copm: COPMData,
  filename: string,
  opts: CopmPdfOptions = {},
): Promise<string> {
  const doc = generateCopmPdf(copm, opts);
  const fname = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const ab = doc.output('arraybuffer') as ArrayBuffer;
  const bytes = Array.from(new Uint8Array(ab));

  const { saveXlsxBytes, ensureDataDirs } = await import('./tauriCommands');
  await saveXlsxBytes(fname, bytes);
  const base = await ensureDataDirs();
  return `${base}\\assessments\\${fname}`;
}
