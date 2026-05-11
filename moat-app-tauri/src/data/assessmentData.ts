export const cahaiTasks = [
  { num: 1, task: 'Open jar of coffee', defaultRole: 'holds jar' },
  { num: 2, task: 'Call 911', defaultRole: 'holds receiver and dials phone' },
  { num: 3, task: 'Draw a line with a ruler', defaultRole: 'holds ruler' },
  { num: 4, task: 'Pour a glass of water', defaultRole: 'holds glass' },
  { num: 5, task: 'Wring out washcloth', defaultRole: 'Bilateral Task' },
  { num: 6, task: 'Do up five buttons', defaultRole: 'Bilateral Task' },
  { num: 7, task: 'Dry back with towel', defaultRole: 'grasps towel end' },
  { num: 8, task: 'Put toothpaste on toothbrush', defaultRole: 'holds toothpaste' },
  { num: 9, task: 'Cut medium resistance putty', defaultRole: 'holds fork' },
  { num: 10, task: 'Zip up the zipper', defaultRole: 'holds zipper pull' },
  { num: 11, task: 'Clean a pair of eyeglasses', defaultRole: 'holds glasses' },
  { num: 12, task: 'Place container on table', defaultRole: 'Unilateral Task' },
  { num: 13, task: 'Carry bag upstairs', defaultRole: 'Unilateral Task' },
];

export const cahaiScaleKey = [
  { score: 1, label: 'Total assist (weak U/L < 25%)' },
  { score: 2, label: 'Maximal assist (weak U/L = 25-49%)' },
  { score: 3, label: 'Moderate assist (weak U/L = 50-74%)' },
  { score: 4, label: 'Minimal assist (weak U/L > 75%)' },
  { score: 5, label: 'Supervision' },
  { score: 6, label: 'Modified independence (device)' },
  { score: 7, label: 'Complete independence (timely, safely)' },
];

export const myomoTasks = [
  {
    name: 'Task 1: Move Object to Mouth',
    components: ['Starting Position', 'Grasp', 'Cut Pickle', 'To Mouth', 'Ending Position'],
  },
  {
    name: 'Task 2: Hold Object in Space',
    components: ['Starting Position', 'Grasp', 'Lift Bag', 'Ending Position'],
  },
  {
    name: 'Task 3: Stabilize Object',
    components: ['Starting Position', 'Grasp', 'Stabilize Bowl', 'Ending Position'],
  },
  {
    name: 'Task 4: Move Object to New Location',
    components: ['Starting Position', 'Grasp', 'Move Towel', 'Ending Position'],
  },
];
