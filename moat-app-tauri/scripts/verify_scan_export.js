// Run with playwright-cli run-code --filename scripts/verify_scan_export.js
// against the local Vite app in an isolated browser session.
async (page) => {
  await page.goto('http://127.0.0.1:1421/MOAT/');
  await page.getByPlaceholder('e.g. P001').fill('QA001');
  await page.locator('input[type="date"]').first().fill('2026-11-04');
  await page.getByRole('button', { name: '6m', exact: true }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('Assessor name (optional)').fill('QA assessor');
  const button = page.getByRole('button', { name: 'Download generated scan PDF', exact: true });
  await page.locator('.scan-export').screenshot({path:'output/playwright/scan-export-ui.png'});
  const downloadPromise = page.waitForEvent('download');
  await button.click();
  const download = await downloadPromise;
  await download.saveAs('output/playwright/scan-ui.pdf');
  await page.getByRole('status').filter({hasText:'Download ready:'}).waitFor();
  if (download.suggestedFilename() !== 'QA001_6m_generated_scan.pdf') throw new Error('Wrong download filename');

  // A missing template must produce an error and allow retry.
  await page.route('**/assessment-packet/page-03.jpg', route => route.abort());
  await button.click();
  await page.getByRole('alert').filter({hasText:'Scan export failed:'}).waitFor();
  if (!await button.isEnabled()) throw new Error('Export stayed disabled after a failure');
  await page.unroute('**/assessment-packet/page-03.jpg');

  const fixtureDownload = page.waitForEvent('download', { timeout: 120000 });
  const result = await page.evaluate(async () => {
    const { createDefaultState } = await import('/MOAT/src/defaults.ts');
    const { buildScanLayout, scanPhases } = await import('/MOAT/src/utils/scanPacketLayout.ts');
    const { createScanPdf } = await import('/MOAT/src/utils/exportScanPdf.ts');
    const { fmaSections } = await import('/MOAT/src/data/fmaItems.ts');
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const state = createDefaultState();
    state.patientInfo = {...state.patientInfo,id:'QA001',date:'2026-11-04',date2:'2026-11-05',affectedHand:'Left',assessmentPhase:'6m'};
    const original = JSON.stringify(state);
    const blank = buildScanLayout(state);
    assert(blank.pages.length === 15,'Expected 15 original pages');
    assert(!blank.pages[2].marks.some(m=>m.label==='FMA subtotal'),'Blank FMA acquired a total');
    assert(!blank.pages[4].marks.some(m=>m.kind==='circle' && m.y>100),'Blank SIS acquired a response');
    assert(JSON.stringify(state)===original,'Layout mutated assessment data');
    for (const [i,phase] of scanPhases.entries()) {
      state.patientInfo.assessmentPhase = phase;
      const layout = buildScanLayout(state);
      assert(layout.pages.every(p=>p.marks.some(m=>m.kind==='circle' && m.y===20 && m.x===[446,479,507,535,563][i])),'Visit missing on a page');
      assert(layout.pages[8].width===792 && layout.pages[8].height===612,'COPM orientation changed');
    }
    state.patientInfo.assessmentPhase='6m';
    state.mas.rows.forEach((r,i)=>{r.mas=i===2?'1+':'0';r.mmt='3/5';r.arom=String(30+i*10);r.notes='Test muscle note';});
    fmaSections.flatMap(s=>s.items).forEach((item,i)=>{state.fma.scores[item.id]=item.options.filter(o=>o.value>=0)[i%item.options.filter(o=>o.value>=0).length].value;});
    state.fma.scores.A18=-1;
    Object.keys(state.sis.domains).forEach(key=>{state.sis.domains[key]=state.sis.domains[key].map((_,i)=>i%5+1);});
    state.sis.recoveryScore=65;
    for (const group of Object.keys(state.copm.identificationNotes)) for(const key of Object.keys(state.copm.identificationNotes[group])) {
      state.copm.identificationNotes[group][key]=state.copm.identificationNotes[group][key].map((_,i)=>`${key} activity ${i+1}`);
      state.copm.importanceRatings[group][key]=state.copm.importanceRatings[group][key].map((_,i)=>7+i);
    }
    state.copm.dates={initial:'2026-05-04',t2:'2026-11-04'};
    state.copm.problems.forEach((p,i)=>Object.assign(p,{description:`Goal ${i+1}: prepare a meal independently`,importance:8,perfT1:2,satT1:3,perfT2:6,satT2:7,notes:'Goal note.'}));
    for(const key of ['cahaiWithout','cahaiWith']) {state[key].tasks.forEach((t,i)=>{t.score=i%7+1;});state[key].generalComment='Assessment comments entered in MOAT.';}
    for(const key of ['myomoWithout','myomoWith']) state[key].tasks.forEach(t=>t.components.forEach((c,i)=>{c.achieve=i%2;c.time=i===0?0:4.5+i;}));
    for(const key of ['nasaWithout','nasaWith']) ['mentalDemand','physicalDemand','temporalDemand','performance','effort','frustration'].forEach((d,i)=>{state[key][d]=i*4;});
    state.sectionNotes.other='Full notes are retained. '.repeat(200);
    let layout=buildScanLayout(state);
    assert(layout.pages[8].marks.some(m=>m.label==='COPM T2 performance 1'&&m.x===550),'6m COPM values in wrong column');
    assert(!layout.pages[8].marks.some(m=>m.label==='COPM T2 performance 1'&&m.x===346),'6m COPM leaked into 2m');
    assert(layout.pages[10].marks.some(m=>m.label?.includes('component 1 time')&&m.text==='0'),'Zero time was dropped');
    assert(layout.notes.some(n=>n.label.startsWith('SIS Memory')),'Missing SIS supplement');
    state.nasaWith.mentalDemand=21;
    layout=buildScanLayout(state);
    assert(layout.notes.some(n=>n.label.includes('outside the printed')&&n.text==='21'),'Out of range NASA value was lost');
    state.nasaWith.mentalDemand=0;
    state.notRecorded={mas_mmt_arom:true,cahai_without:true,myomo_without:true,nasa_without:true};
    layout=buildScanLayout(state);
    assert(!layout.pages[9].marks.some(m=>m.label?.startsWith('CAHAI without task')),'Skipped CAHAI emitted scores');
    assert(!layout.pages[10].marks.some(m=>m.label?.startsWith('Myomo without')),'Skipped Myomo emitted scores');
    assert(!layout.pages[1].marks.some(m=>m.label?.includes('AROM')),'Skipped MAS emitted scores');
    state.notRecorded={};
    const doc=await createScanPdf(state,{assessor:'QA assessor'});
    await doc.save('scan-fixture.pdf',{returnPromise:true});
    return {pages:doc.getNumberOfPages(),assertions:'passed'};
  });
  const fixture = await fixtureDownload;
  await fixture.saveAs('output/playwright/scan-fixture.pdf');
  console.log(result);
}
