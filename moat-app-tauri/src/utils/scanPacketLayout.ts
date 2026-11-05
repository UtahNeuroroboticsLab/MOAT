import { AssessmentState } from '../types';
import { fmaSections } from '../data/fmaItems';

export type ScanMark =
  | { kind: 'text'; x: number; y: number; width: number; height: number; text: string; size: number; label: string }
  | { kind: 'circle'; x: number; y: number; rx: number; ry: number }
  | { kind: 'line'; x: number; y: number; x2: number; y2: number }
  | { kind: 'erase'; x: number; y: number; width: number; height: number };
export interface ScanPage { marks: ScanMark[]; width: number; height: number }
export interface ScanNote { label: string; text: string }
export const scanPhases = ['baseline', '2m', '4m', '6m', '1y'] as const;

const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  ? `${value.slice(5, 7)}/${value.slice(8)}/${value.slice(0, 4)}` : value;

/** Coordinates are PDF points, measured against the bundled 15-page packet. */
export function buildScanLayout(state: AssessmentState, assessor = '') {
  const pages: ScanPage[] = Array.from({ length: 15 }, (_, i) => ({
    marks: [], width: i === 8 ? 792 : 612, height: i === 8 ? 612 : 792,
  }));
  const notes: ScanNote[] = [];
  const note = (label: string, value: unknown) => {
    if (value !== null && value !== undefined && String(value).trim()) notes.push({ label, text: String(value) });
  };
  const text = (p: number, x: number, y: number, width: number, value: unknown, label: string, height = 16, size = 10) => {
    if (value === null || value === undefined || value === '') return;
    pages[p - 1].marks.push({ kind: 'text', x, y, width, height, text: String(value), size, label });
  };
  const circle = (p: number, x: number, y: number, rx = 9, ry = 7) => pages[p - 1].marks.push({ kind: 'circle', x, y, rx, ry });
  const line = (p: number, x: number, y: number, x2: number, y2: number) => pages[p - 1].marks.push({ kind: 'line', x, y, x2, y2 });
  const erase = (p: number, x: number, y: number, width: number, height: number) => pages[p - 1].marks.push({ kind: 'erase', x, y, width, height });
  const valid = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= min && value <= max;
  const skip = (p: number, key: string) => {
    if (!state.notRecorded[key]) return false;
    text(p, 390, 34, 185, 'Not recorded', `${key} status`, 15, 10);
    return true;
  };
  const phase = scanPhases.indexOf(state.patientInfo.assessmentPhase);
  for (let p = 1; p <= 15; p++) {
    // Repaint the shared header so all pages have legible, consistent identifiers.
    erase(p, 32, 9, 546, 22);
    text(p, 36, 13, 65, 'Participant #:', 'Header label', 14, 8);
    text(p, 102, 13, 33, state.patientInfo.id, 'Patient ID', 14, 8);
    text(p, 138, 13, 25, 'Date:', 'Header label', 14, 8);
    text(p, 164, 13, 71, date(state.patientInfo.date), 'Assessment date', 14, 8);
    text(p, 240, 13, 40, 'MyoPro:', 'Header label', 14, 8);
    text(p, 282, 13, 25, 'With', 'Header label', 14, 8);
    text(p, 313, 13, 42, 'Without', 'Header label', 14, 8);
    text(p, 359, 13, 20, 'NA', 'Header label', 14, 8);
    text(p, 391, 13, 42, 'Assess:', 'Header label', 14, 8);
    ['Initial', '2m', '4m', '6m', '1yr'].forEach((v, i) => text(p, [434, 472, 500, 528, 555][i], 13, 32, v, 'Header label', 14, 8));
    if (phase >= 0) circle(p, [446, 479, 507, 535, 563][phase], 20, phase === 0 ? 17 : 11, 8);
    circle(p, p >= 13 ? 292 : p >= 10 ? 331 : 366, 20, p >= 10 && p <= 12 ? 23 : 14, 8);
    text(p, 36, pages[p - 1].height - 24, 540, 'Experimental generated scan from MOAT data', 'Export provenance', 12, 8);
  }
  text(1, 116, 180, 160, state.patientInfo.id, 'Participant ID');
  text(1, 98, 204, 200, assessor, 'Assessor');
  text(1, 85, 228, 86, date(state.patientInfo.date), 'Assessment date', 14, 9);
  text(1, 178, 228, 92, date(state.patientInfo.date2), 'Second assessment date', 14, 9);
  if (phase >= 0) circle(1, [87, 153, 225, 297, 370][phase], 285, 22, 10);
  circle(1, state.patientInfo.affectedHand === 'Left' ? 227 : 339, 309, 24, 10);
  note('Patient information', state.patientInfo.notes);

  if (!skip(2, 'mas_mmt_arom')) {
    const rows = [['Shoulder', 'Flexors'], ['Shoulder', 'Abductors'], ['Elbow', 'Flexors'], ['Elbow', 'Extensors'], ['Finger', 'Finger Flexors']];
    rows.forEach(([joint, muscle], i) => {
      const row = state.mas.rows.find(r => r.joint === joint && r.muscle === muscle);
      if (!row) return;
      (['mas', 'mmt', 'arom'] as const).forEach((field, col) => {
        const x = [264, 354, 439][col];
        // These five cells contain preprinted NT values. Replace them with the actual entered value.
        if ((i < 2 && col < 2) || (i === 4 && col > 0)) erase(2, x + 1, 161 + i * 27, [86, 80, 94][col], 23);
        text(2, x + 5, 165 + i * 27, [78, 70, 82][col], row[field], `${joint} ${muscle} ${field.toUpperCase()}`);
      });
      note(`${joint} ${muscle} notes`, row.notes);
    });
  }

  const fmaPositions: Record<string, [number, number[], number[]]> = {};
  const pos = (id: string, p: number, ys: number[], xs = p === 3 ? [439, 479, 519] : [414, 450, 486]) => { fmaPositions[id] = [p, xs, ys]; };
  pos('A1', 3, [99, 99, 99], [439, 498, 498]); pos('A2', 3, [110, 110, 110], [439, 498, 498]);
  [166, 178, 189, 201, 213, 225, 241, 254, 265].forEach((y, i) => pos(`A${i + 3}`, 3, [y, y, y]));
  [[317,329,340], [350,362,374], [387,399,411], [459,471,483], [494,506,518], [529,541,553], [614,627,638]].forEach((ys,i) => pos(`A${i + 12}`, 3, ys));
  [[69,79,90], [101,112,124], [134,145,157], [167,179,190], [201,211,223]].forEach((ys,i) => pos(`B${i + 1}`,4,ys));
  [[295,295,295], [317,317,317], [346,357,368], [379,390,401], [412,423,434], [445,456,467], [489,499,510]].forEach((ys,i) => pos(`C${i + 1}`,4,ys));
  pos('D1',4,[579,579,579],[400,444,483]); pos('D2',4,[592,603,614],[400,444,483]); pos('D3',4,[637,648,659],[400,444,483]);
  if (!skip(3, 'fugl_meyer')) {
    fmaSections.forEach(section => {
      section.items.forEach(item => {
        const value = state.fma.scores[item.id];
        if (value === null || value === undefined) return;
        if (value === -1 && item.id === 'A18') { text(3, 430, 622, 100, 'NT', 'A18 not tested', 16, 10); return; }
        if (!item.options.some(o => o.value === value) || !valid(value, 0, 2)) { note(`FMA ${item.id} (unmapped value)`, value); return; }
        const [p, xs, ys] = fmaPositions[item.id];
        circle(p, xs[value], ys[value], 7, 6);
      });
      note(`FMA ${section.title}`, state.fma.sectionNotes[section.title]);
    });
    const subtotal = (ids: string[], p: number, x: number, y: number, width = 75) => {
      const values = ids.map(id => state.fma.scores[id]);
      if (values.every(v => v !== null && v !== undefined && Number.isInteger(v) && v >= -1 && v <= 2))
        text(p, x, y, width, values.reduce<number>((sum, v) => sum + Math.max(0, v!), 0), 'FMA subtotal');
    };
    const ids = (prefix: string, n: number) => Array.from({length:n}, (_,i) => `${prefix}${i+1}`);
    subtotal(['A1','A2'],3,460,117); subtotal(ids('A',11).slice(2),3,460,271);
    subtotal(['A12','A13','A14'],3,460,416); subtotal(['A15','A16','A17'],3,460,559);
    subtotal(['A18'],3,460,643); subtotal(ids('A',18),3,460,673);
    subtotal(ids('B',5),4,430,231); subtotal(ids('C',7),4,430,519); subtotal(ids('D',3),4,410,668);
    subtotal(fmaSections.flatMap(s => s.items.map(i => i.id)),4,395,698,100);
  } else skip(4, 'fugl_meyer');

  if (!skip(5, 'sis')) {
    const domains: [string, number, number[], number[]][] = [
      ['strength',5,[203,233,263,292],[262,332,402,471,541]],
      ['adl',5,[413,442,472,501,530,560,589,619,648,678],[262,332,402,471,541]],
      ['mobility',6,[135,164,194,223,253,282,312,341,371],[255,326,397,468,540]],
      ['hand',6,[485,515,544,574,603],[273,340,407,474,542]],
    ];
    domains.forEach(([key,p,ys,xs]) => state.sis.domains[key]?.forEach((value,i) => {
      if (valid(value,1,5) && i < ys.length) circle(p,xs[5-value!],ys[i],10,9);
      else if (value !== null && value !== undefined) note(`SIS ${key} item ${i+1} (unmapped value)`,value);
    }));
    // Retain stored domains even when their UI definitions are disabled.
    const domainNames: Record<string,string> = {memory:'Memory and thinking',emotion:'Emotion',communication:'Communication',participation:'Participation'};
    Object.entries(state.sis.domains).filter(([key]) => !domains.some(([mapped]) => mapped === key)).forEach(([key,values]) =>
      values.forEach((value,i) => note(`SIS ${domainNames[key] || key}, item ${i+1}`,value)));
    const recovery = state.sis.recoveryScore;
    if (typeof recovery === 'number' && Number.isFinite(recovery) && recovery >= 0 && recovery <= 100) {
      const y = 654 - recovery * 5.31;
      line(7,190,y,257,y); circle(7,224,y,36,8); text(7,310,y-8,100,`${recovery}%`,'Stroke recovery');
    } else note('SIS recovery (unmapped value)',recovery);
  } else { skip(6,'sis'); skip(7,'sis'); }

  if (!skip(8,'copm')) {
    const groups: [keyof typeof state.copm.identificationNotes, string, number[]][] = [
      ['selfCare','personalCare',[117,138,159]], ['selfCare','functionalMobility',[183,204,225]], ['selfCare','communityMgmt',[248,270,292]],
      ['productivity','paidWork',[338,359,380]], ['productivity','householdMgmt',[403,421,439]], ['productivity','play',[457,475]],
      ['leisure','quietRec',[518,536,553]], ['leisure','activeRec',[571,589,606]], ['leisure','socialization',[624,646,667]],
    ];
    groups.forEach(([group,key,ys]) => {
      const entries = state.copm.identificationNotes[group] as unknown as Record<string,string[]>;
      const ratings = state.copm.importanceRatings[group] as unknown as Record<string,(number|null)[]>;
      entries[key]?.forEach((value,i) => {
        if (i >= ys.length) { note(`COPM ${key} ${i+1}`,value); note(`COPM ${key} ${i+1} importance`,ratings[key]?.[i]); return; }
        text(8,138,ys[i],323,value,`COPM ${key} ${i+1}`,16,9);
        text(8,496,ys[i],68,ratings[key]?.[i],`COPM ${key} importance`,16,10);
      });
    });
    text(9,237,96,90,date(state.copm.dates.initial),'COPM initial date',15,8);
    if (phase > 0) text(9,[0,338,440,542,644][phase],103,90,date(state.copm.dates.t2),'COPM reassessment date',10,8);
    else note('COPM reassessment date (no follow-up visit selected)',date(state.copm.dates.t2));
    state.copm.problems.forEach((problem,i) => {
      if (i >= 7) { note(`COPM problem ${i+1}`,JSON.stringify(problem)); return; }
      const y = 193+i*42;
      text(9,55,y,137,problem.description,`COPM problem ${i+1}`,32,9);
      text(9,205,y+8,22,problem.importance,`COPM importance ${i+1}`);
      text(9,244,y+8,33,problem.perfT1,`COPM T1 performance ${i+1}`);
      text(9,294,y+8,33,problem.satT1,`COPM T1 satisfaction ${i+1}`);
      if (phase > 0) {
        text(9,346+(phase-1)*102,y+8,33,problem.perfT2,`COPM T2 performance ${i+1}`);
        text(9,397+(phase-1)*102,y+8,33,problem.satT2,`COPM T2 satisfaction ${i+1}`);
      } else {
        note(`COPM problem ${i+1} reassessment performance (no follow-up visit selected)`,problem.perfT2);
        note(`COPM problem ${i+1} reassessment satisfaction (no follow-up visit selected)`,problem.satT2);
      }
      note(`COPM problem ${i+1} notes`,problem.notes);
    });
    (['perfT1','satT1','perfT2','satT2'] as const).forEach((key,i) => {
      if (i > 1 && phase <= 0) return;
      const values = state.copm.problems.slice(0,5).filter(p=>p.description.trim()).map(p=>p[key]);
      if (values.length && values.every(v=>typeof v === 'number' && Number.isFinite(v)))
        text(9,i < 2 ? 244+i*50 : 346+(phase-1)*102+(i-2)*51,490,35,(values.reduce<number>((s,v)=>s+v!,0)/values.length).toFixed(1),`COPM ${key} average`);
    });
    note('COPM notes',state.copm.notes);
  } else skip(9,'copm');

  (['without','with'] as const).forEach((variant,vi) => {
    const p = 10+vi*3;
    const cahai = vi ? state.cahaiWith : state.cahaiWithout;
    if (!skip(p,`cahai_${variant}`)) {
      const ys = [196,225,254,285,313,342,373,400,430,458,488,517,546];
      const leftRoles = ['holds jar','holds receiver','holds ruler','holds glass','','','reaches for towel','holds toothpaste','holds knife','holds zipper','holds glasses'];
      const rightRoles = ['holds lid','dials phone','holds pen','holds pitcher','','','grasps towel end','holds brush','holds fork','holds zipper pull','wipes lens'];
      const checkboxYs = [201,230,258,287,0,0,375,405,434,463,491];
      cahai.tasks.forEach((task,i) => {
        if (i >= 13) { note(`CAHAI ${variant} extra task ${i+1}`,JSON.stringify(task)); return; }
        text(p,490,ys[i]-7,20,task.score,`CAHAI ${variant} task ${i+1}`,16,11);
        // Roles in the app are free text; only mark exact equivalents on the printed form.
        const role = task.role.trim().toLowerCase();
        const left = role === leftRoles[i] || (i === 1 && role === 'holds receiver and dials phone');
        const right = role === rightRoles[i] || (i === 1 && role === 'holds receiver and dials phone');
        if (left || right) {
          for (const x of [...(left ? [291] : []), ...(right ? [379] : [])]) { line(p,x-3,checkboxYs[i]-3,x+3,checkboxYs[i]+3); line(p,x+3,checkboxYs[i]-3,x-3,checkboxYs[i]+3); }
        } else if (role && !['bilateral task','unilateral task'].includes(role)) note(`CAHAI ${variant} task ${i+1} role`,task.role);
        note(`CAHAI ${variant} task ${i+1} comment`,task.comment);
      });
      if (cahai.tasks.length === 13 && cahai.tasks.every(t=>valid(t.score,1,7))) text(p,486,569,28,cahai.tasks.reduce((s,t)=>s+t.score!,0),`CAHAI ${variant} total`);
      text(p,55,610,495,cahai.generalComment,`CAHAI ${variant} comments`,48,10);
    }
    const myomo = vi ? state.myomoWith : state.myomoWithout;
    if (!skip(p+1,`myomo_${variant}`)) myomo.tasks.forEach((task,i) => {
      if (i >= 4) { note(`Myomo ${variant} extra task ${i+1}`,JSON.stringify(task)); return; }
      const y = [127,295,440,589][i];
      task.components.forEach((c,j) => {
        text(p+1,250,y+j*21.6,38,c.achieve,`Myomo ${variant} task ${i+1} component ${j+1} achieve`);
        text(p+1,312,y+j*21.6,55,c.time,`Myomo ${variant} task ${i+1} component ${j+1} time`);
      });
      const sumY = [235,382,530,676][i];
      text(p+1,250,sumY,38,task.components.reduce((s,c)=>s+c.achieve,0),'Myomo achieved total');
      if (task.components.every(c=>c.time !== null)) text(p+1,312,sumY,55,Number(task.components.reduce((s,c)=>s+c.time!,0).toFixed(2)),'Myomo time total');
      note(`Myomo ${variant} task ${i+1} notes`,task.notes);
    });
    const nasa = vi ? state.nasaWith : state.nasaWithout;
    if (!skip(p+2,`nasa_${variant}`)) {
      text(p+2,52,vi ? 156 : 199,120,state.patientInfo.id,'NASA participant ID',16,9);
      text(p+2,vi ? 327 : 318,vi ? 156 : 199,100,date(state.patientInfo.date),'NASA date',16,9);
      (['mentalDemand','physicalDemand','temporalDemand','performance','effort','frustration'] as const).forEach((key,i) => {
        const value = nasa[key];
        // The paper has 21 graduations, representing 0 through 20. Do not clamp the app's possible value 21.
        if (valid(value,0,20)) {
          const x = 70 + value!*(vi ? 359 : 346)/20;
          const y = (vi ? [230,316,388,469,555,643] : [271,353,423,501,584,669])[i];
          line(p+2,x,y-14,x,y+4); circle(p+2,x,y-5,5,9);
        } else note(`NASA ${variant} ${key} (outside the printed 0-20 scale)`,value);
        note(`NASA ${variant} ${key} notes`,nasa.dimensionNotes[key]);
      });
    }
  });
  Object.entries(state.sectionNotes).forEach(([key,value])=>note(`Assessment notes: ${key}`,value));
  Object.entries(state.notRecorded).filter(([,value])=>value).forEach(([key])=>note('Marked not recorded',key));
  return { pages, notes };
}
