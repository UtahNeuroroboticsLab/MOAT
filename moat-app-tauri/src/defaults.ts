import { AssessmentState } from './types';
import { cahaiTasks } from './data/assessmentData';
import { myomoTasks } from './data/assessmentData';

export function createDefaultState(): AssessmentState {
  return {
    patientInfo: {
      id: '',
      date: '',
      date2: '',
      affectedHand: 'Right',
      assessmentPhase: 'baseline',
      notes: '',
    },
    mas: {
      rows: [
        { joint: 'Shoulder', muscle: 'Flexors', mas: 'NT', mmt: 'NT', arom: '' },
        { joint: 'Shoulder', muscle: 'Extensors', mas: 'NT', mmt: 'NT', arom: '' },
        { joint: 'Shoulder', muscle: 'Abductors', mas: 'NT', mmt: 'NT', arom: '' },
        { joint: 'Elbow', muscle: 'Flexors', mas: '', mmt: '', arom: '' },
        { joint: 'Elbow', muscle: 'Extensors', mas: '', mmt: '', arom: '' },
        { joint: 'Wrist', muscle: 'Wrist Flexors', mas: '', mmt: '', arom: '' },
        { joint: 'Wrist', muscle: 'Wrist Extensors', mas: '', mmt: '', arom: '' },
        { joint: 'Finger', muscle: 'Finger Flexors', mas: '', mmt: 'NT', arom: 'NT' },
      ],
    },
    fma: {
      scores: {},
    },
    sis: {
      domains: {
        strength: [null, null, null, null],
        memory: [null, null, null, null, null, null, null],
        emotion: [null, null, null, null, null, null, null, null, null],
        communication: [null, null, null, null, null, null, null],
        adl: [null, null, null, null, null, null, null, null, null, null],
        mobility: [null, null, null, null, null, null, null, null, null],
        hand: [null, null, null, null, null],
        participation: [null, null, null, null, null, null, null, null],
      },
      recoveryScore: null,
    },
    copm: {
      problems: Array.from({ length: 7 }, () => ({
        description: '',
        importance: null,
        perfT1: null,
        satT1: null,
        perfT2: null,
        satT2: null,
      })),
      identificationNotes: {
        selfCare: { personalCare: ['', '', ''], functionalMobility: ['', '', ''], communityMgmt: ['', '', ''] },
        productivity: { paidWork: ['', '', ''], householdMgmt: ['', '', ''], play: ['', ''] },
        leisure: { quietRec: ['', '', ''], activeRec: ['', '', ''], socialization: ['', '', ''] },
      },
      importanceRatings: {
        selfCare: { personalCare: [null, null, null], functionalMobility: [null, null, null], communityMgmt: [null, null, null] },
        productivity: { paidWork: [null, null, null], householdMgmt: [null, null, null], play: [null, null] },
        leisure: { quietRec: [null, null, null], activeRec: [null, null, null], socialization: [null, null, null] },
      },
      dates: { initial: '', t2: '' },
    },
    myomoWithout: {
      tasks: myomoTasks.map(t => ({
        components: t.components.map(() => ({ achieve: 0, time: null })),
      })),
    },
    myomoWith: {
      tasks: myomoTasks.map(t => ({
        components: t.components.map(() => ({ achieve: 0, time: null })),
      })),
    },
    cahaiWithout: {
      tasks: cahaiTasks.map(t => ({ role: t.defaultRole, score: 1, comment: '' })),
      generalComment: '',
    },
    cahaiWith: {
      tasks: cahaiTasks.map(t => ({ role: t.defaultRole, score: 1, comment: '' })),
      generalComment: '',
    },
    nasaWithout: { mentalDemand: null, physicalDemand: null, temporalDemand: null, performance: null, effort: null, frustration: null },
    nasaWith: { mentalDemand: null, physicalDemand: null, temporalDemand: null, performance: null, effort: null, frustration: null },
    sectionNotes: {},
  };
}
