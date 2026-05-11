export interface FMAItem {
  id: string;
  name: string;
  options: { label: string; value: number }[];
  fRow: number; // Row in F column for xlsx export
}

export interface FMASection {
  title: string;
  items: FMAItem[];
}

const opt012 = (d0: string, d1: string, d2: string) => [
  { label: d0, value: 0 },
  { label: d1, value: 1 },
  { label: d2, value: 2 },
];

const opt02 = (d0: string, d2: string) => [
  { label: d0, value: 0 },
  { label: d2, value: 2 },
];

export const fmaSections: FMASection[] = [
  {
    title: 'I. Reflex Activity',
    items: [
      { id: 'A1', name: 'Flexors: Biceps or finger reflex', options: opt02('No Reflex', 'Reflex Elicitable'), fRow: 9 },
      { id: 'A2', name: 'Extensors: Triceps reflex', options: opt02('No Reflex', 'Reflex Elicitable'), fRow: 11 },
    ],
  },
  {
    title: 'II. Flexor Synergy',
    items: [
      { id: 'A3', name: 'Shoulder girdle retraction', options: opt012('No visible or palpable retraction', 'Partly done', 'Faultless'), fRow: 14 },
      { id: 'A4', name: 'Shoulder girdle elevation', options: opt012('No visible or palpable elevation', 'Partly done', 'Faultless'), fRow: 17 },
      { id: 'A5', name: 'Shoulder abduction', options: opt012('No visible or palpable abduction', 'Partly done', 'Faultless'), fRow: 20 },
      { id: 'A6', name: 'Shoulder external rotation', options: opt012('No visible or palpable rotation', 'Partly done', 'Faultless'), fRow: 23 },
      { id: 'A7', name: 'Elbow flexion', options: opt012('No visible or palpable flexion', 'Partly done', 'Faultless'), fRow: 26 },
      { id: 'A8', name: 'Forearm supination', options: opt012('No visible or palpable supination', 'Partly done', 'Faultless'), fRow: 29 },
    ],
  },
  {
    title: 'III. Extensor Synergy',
    items: [
      { id: 'A9', name: 'Shoulder adduction / internal rotation', options: opt012('Not done at all', 'Partly done', 'Faultless'), fRow: 33 },
      { id: 'A10', name: 'Elbow extension', options: opt012('Not done at all', 'Partly done', 'Faultless'), fRow: 36 },
      { id: 'A11', name: 'Forearm pronation', options: opt012('Not done at all', 'Partly done', 'Faultless'), fRow: 39 },
    ],
  },
  {
    title: 'IV. Movement Combining Synergy',
    items: [
      { id: 'A12', name: 'Hand to lumbar spine', options: opt012('Not done at all', 'Partly done (≥ IP joint passes ASIS)', 'Faultless'), fRow: 43 },
      { id: 'A13', name: 'Shoulder flexion 0-90°, elbow straight', options: opt012('Not done at all, or can\'t achieve start position', 'Partly done, or shoulder abduction / elbow flexion occurs', 'Faultless'), fRow: 46 },
      { id: 'A14', name: 'Forearm pro/supination, elbow at 90°, shoulder at 0°', options: opt012('Not done at all, or can\'t achieve start position', 'Partly done, any pro/supination in correct position', 'Faultless'), fRow: 49 },
    ],
  },
  {
    title: 'V. Movement Out of Synergy',
    items: [
      { id: 'A15', name: 'Shoulder abduction to 90°, elbow straight, forearm pronated', options: opt012('Not done at all, or elbow flexion/supination at start', 'Partly done, or elbow flexion/supination during movement', 'Faultless'), fRow: 53 },
      { id: 'A16', name: 'Shoulder flexion 90°-180°, elbow straight', options: opt012('Not done at all, or shoulder abd/elbow flex at start', 'Partly done, or shoulder abd/elbow flex during movement', 'Faultless'), fRow: 56 },
      { id: 'A17', name: 'Forearm pro/supination, elbow straight, shoulder flexed 30-90°', options: opt012('Not done at all, or can\'t achieve start position', 'Partly done, any pro/supination in correct position', 'Faultless'), fRow: 59 },
    ],
  },
  {
    title: 'VI. Normal Reflex Activity',
    items: [
      {
        id: 'A18',
        name: 'Biceps, triceps, and finger flexor reflexes (only if A15-A17 all scored 2)',
        options: [
          { label: 'Not tested (A15-A17 not all 2)', value: -1 },
          { label: '≥ 2 reflexes markedly hyperactive', value: 0 },
          { label: '1 reflex markedly hyperactive or ≥ 2 lively', value: 1 },
          { label: 'All 3 present, none hyperactive', value: 2 },
        ],
        fRow: 63,
      },
    ],
  },
  {
    title: 'VII. Wrist',
    items: [
      { id: 'B1', name: 'Wrist stability, elbow at 90°', options: opt012('Can\'t achieve position or extend wrist to 15°', 'Can extend to 15° but not against resistance', 'Faultless'), fRow: 68 },
      { id: 'B2', name: 'Wrist flexion/extension, elbow at 90°', options: opt012('Not done at all or can\'t achieve position', 'Partly done, AROM < PROM', 'Faultless, smooth through full cycle'), fRow: 71 },
      { id: 'B3', name: 'Wrist stability, elbow straight, shoulder 30-90°', options: opt012('Can\'t extend wrist to 15° or can\'t maintain position', 'Can extend to 15° but not against resistance', 'Faultless'), fRow: 74 },
      { id: 'B4', name: 'Wrist flexion/extension, elbow straight, shoulder 30-90°', options: opt012('Not done or can\'t achieve position', 'Partly done, AROM < PROM or elbow flexes', 'Faultless, smooth through full cycle'), fRow: 77 },
      { id: 'B5', name: 'Wrist circumduction, elbow straight, shoulder 30-90°', options: opt012('Not done at all or can\'t achieve position', 'Partly done, jerky/incomplete or elbow flexes', 'Faultless and smooth'), fRow: 80 },
    ],
  },
  {
    title: 'VIII. Hand',
    items: [
      { id: 'C1', name: 'Fingers mass flexion', options: opt012('Not done at all', 'Partly done, not full active flexion', 'Full active flexion'), fRow: 84 },
      { id: 'C2', name: 'Finger mass extension', options: opt012('Not done at all', 'Partly done, can release but not fully extend', 'Full active extension'), fRow: 87 },
      { id: 'C3', name: 'Grasp A: Hook grasp (5-finger claw)', options: opt012('Cannot achieve grasp', 'Weak grasp', 'Grasp maintained against great resistance'), fRow: 90 },
      { id: 'C4', name: 'Grasp B: Thumb adduction grasp', options: opt012('Cannot achieve grasp', 'Weak grasp, paper not held against tug', 'Paper held well against tug'), fRow: 93 },
      { id: 'C5', name: 'Grasp C: Pincer grasp (pencil)', options: opt012('Not done at all', 'Pencil held but not against tug', 'Pencil held well against tug'), fRow: 96 },
      { id: 'C6', name: 'Grasp D: Cylinder grasp', options: opt012('Not done at all', 'Cylinder held but not against tug', 'Cylinder held well against tug'), fRow: 99 },
      { id: 'C7', name: 'Grasp E: Spherical grasp (tennis ball)', options: opt012('Not done at all', 'Ball held but not against tug', 'Ball held well against tug'), fRow: 102 },
    ],
  },
  {
    title: 'IX. Coordination / Speed',
    items: [
      { id: 'D1', name: 'Tremor', options: opt012('Marked tremor', 'Slight tremor', 'No tremor'), fRow: 106 },
      { id: 'D2', name: 'Dysmetria', options: opt012('Pronounced or unsystematic', 'Slight or systematic', 'No dysmetria'), fRow: 109 },
      { id: 'D3', name: 'Speed (finger-to-nose, 5 reps)', options: opt012('≥ 6s slower than unaffected, or unable', '2-5.99s slower than unaffected', '< 2s slower than unaffected'), fRow: 112 },
    ],
  },
];
