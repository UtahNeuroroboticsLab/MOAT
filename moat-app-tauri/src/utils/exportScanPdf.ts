import { jsPDF } from 'jspdf';
import { AssessmentState } from '../types';
import { buildScanLayout, ScanMark, ScanNote } from './scanPacketLayout';

const SCALE = 2;
const BASE = `${import.meta.env.BASE_URL}assessment-packet/`;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the bundled assessment packet. Reload the app and try again.'));
    image.src = url;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = ''; }
      // Split long identifiers as well as ordinary words, without discarding characters.
      for (const char of (line ? ` ${word}` : word)) {
        if (line && ctx.measureText(line + char).width > width) { result.push(line); line = ''; }
        line += char;
      }
    }
    result.push(line);
  }
  return result;
}

function drawMark(ctx: CanvasRenderingContext2D, mark: ScanMark, overflow: ScanNote[]) {
  ctx.fillStyle = '#141414'; ctx.strokeStyle = '#141414'; ctx.lineWidth = 1.15;
  if (mark.kind === 'erase') { ctx.fillStyle = '#fff'; ctx.fillRect(mark.x,mark.y,mark.width,mark.height); return; }
  if (mark.kind === 'circle') {
    ctx.beginPath(); ctx.ellipse(mark.x,mark.y,mark.rx,mark.ry,-0.045,0,Math.PI*2); ctx.stroke(); return;
  }
  if (mark.kind === 'line') { ctx.beginPath(); ctx.moveTo(mark.x,mark.y); ctx.lineTo(mark.x2,mark.y2); ctx.stroke(); return; }
  let size = mark.size;
  ctx.font = `italic ${size}px Arial`;
  let lines = wrap(ctx,mark.text,mark.width);
  while (lines.length * size * 1.15 > mark.height && size > 7) {
    size -= 0.5; ctx.font = `italic ${size}px Arial`; lines = wrap(ctx,mark.text,mark.width);
  }
  if (lines.length * size * 1.15 > mark.height) {
    overflow.push({label:mark.label,text:mark.text});
    lines = wrap(ctx,'See supplement',mark.width);
    size = 6; ctx.font = `italic ${size}px Arial`;
    lines = wrap(ctx,'See supplement',mark.width);
  }
  ctx.textBaseline = 'top';
  lines.forEach((line,i)=>ctx.fillText(line,mark.x,mark.y+i*size*1.15));
}

export function scanFilename(state: AssessmentState) {
  const id = state.patientInfo.id.trim().replace(/[^a-zA-Z0-9_-]/g,'_') || 'assessment';
  return `${id}_${state.patientInfo.assessmentPhase}_generated_scan.pdf`;
}

/** Rasterize the completed forms, producing an image-only PDF like a flatbed scan. */
export async function createScanPdf(state: AssessmentState, options: {
  assessor?: string;
  onProgress?: (page: number, total: number) => void;
} = {}): Promise<jsPDF> {
  const { pages, notes } = buildScanLayout(state, options.assessor?.trim());
  const overflow: ScanNote[] = [...notes];
  const doc = new jsPDF({unit:'pt',format:'letter',compress:true});
  doc.setProperties({title:`Generated assessment scan - ${state.patientInfo.id}`,subject:'Experimental export from entered MOAT data',creator:'MOAT'});
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not create a scan image.');
  const reset = (width: number, height: number) => {
    canvas.width = width*SCALE; canvas.height = height*SCALE;
    ctx.setTransform(SCALE,0,0,SCALE,0,0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height);
  };
  const addImage = (width: number,height: number) => doc.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,width,height,undefined,'FAST');
  for (const [i,page] of pages.entries()) {
    options.onProgress?.(i+1,pages.length);
    const background = await loadImage(`${BASE}page-${String(i+1).padStart(2,'0')}.jpg`);
    reset(page.width,page.height);
    ctx.drawImage(background,0,0,page.width,page.height);
    page.marks.forEach(mark=>drawMark(ctx,mark,overflow));
    if (i) doc.addPage([page.width,page.height],page.width > page.height ? 'landscape' : 'portrait');
    addImage(page.width,page.height);
    // Yield between pages so export progress stays responsive in the webview.
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  const uniqueNotes = overflow.filter((n,i,all)=>all.findIndex(other=>other.label===n.label && other.text===n.text)===i);
  let y = 0;
  let supplement = 0;
  const startSupplement = () => {
    doc.addPage([612,792],'portrait'); reset(612,792); supplement++;
    ctx.fillStyle = '#0a0a0a'; ctx.textBaseline = 'top'; ctx.font = 'bold 18px Cambria, serif';
    ctx.fillText(`Assessment supplement ${supplement}`,36,36);
    ctx.font = '10px Arial';
    const header = wrap(ctx,`Participant: ${state.patientInfo.id || '(blank)'} | Date: ${state.patientInfo.date || '(blank)'} | Visit: ${state.patientInfo.assessmentPhase}`,540);
    header.forEach((line,i)=>ctx.fillText(line,36,64+i*13));
    ctx.font = '8px Arial'; ctx.fillText('Experimental generated scan from MOAT data',36,768);
    y = 86+header.length*13;
  };
  const flush = () => addImage(612,792);
  for (const note of uniqueNotes) {
    if (!supplement) startSupplement();
    ctx.font = 'bold 10px Arial';
    const labels = wrap(ctx,note.label,540);
    ctx.font = '11px Arial';
    const lines = wrap(ctx,note.text,540);
    if (y+(labels.length+1)*14 > 740) { flush(); startSupplement(); }
    ctx.font = 'bold 10px Arial';
    for (const label of labels) {
      if (y+14 > 740) { flush(); startSupplement(); ctx.font = 'bold 10px Arial'; }
      ctx.fillText(label,36,y); y+=14;
    }
    ctx.font = '11px Arial';
    for (const line of lines) {
      if (y+14 > 740) { flush(); startSupplement(); ctx.font = '11px Arial'; }
      ctx.fillText(line,36,y); y+=14;
    }
    y+=12;
  }
  if (supplement) flush();
  canvas.width = 0; canvas.height = 0;
  return doc;
}

export async function exportScanPdf(state: AssessmentState, options: Parameters<typeof createScanPdf>[1] = {}) {
  const doc = await createScanPdf(state,options);
  await doc.save(scanFilename(state),{returnPromise:true});
  return doc.getNumberOfPages();
}
