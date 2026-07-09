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
        { joint: 'Shoulder', muscle: 'Flexors', mas: 'NT', mmt: 'NT', arom: '', notes: '' },
        // { joint: 'Shoulder', muscle: 'Extensors', mas: 'NT', mmt: 'NT', arom: '', notes: '' },
        { joint: 'Shoulder', muscle: 'Abductors', mas: 'NT', mmt: 'NT', arom: '', notes: '' },
        { joint: 'Elbow', muscle: 'Flexors', mas: '', mmt: '', arom: '', notes: '' },
        { joint: 'Elbow', muscle: 'Extensors', mas: '', mmt: '', arom: '', notes: '' },
        // { joint: 'Wrist', muscle: 'Wrist Flexors', mas: '', mmt: '', arom: '', notes: '' },
        // { joint: 'Wrist', muscle: 'Wrist Extensors', mas: '', mmt: '', arom: '', notes: '' },
        { joint: 'Finger', muscle: 'Finger Flexors', mas: '', mmt: 'NT', arom: 'NT', notes: '' },
      ],
    },
    fma: {
      scores: {},
      sectionNotes: {},
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
        notes: '',
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
      notes: '',
    },
    myomoWithout: {
      tasks: myomoTasks.map(t => ({
        components: t.components.map(() => ({ achieve: 0, time: null })),
        notes: '',
      })),
    },
    myomoWith: {
      tasks: myomoTasks.map(t => ({
        components: t.components.map(() => ({ achieve: 0, time: null })),
        notes: '',
      })),
    },
    cahaiWithout: {
      tasks: cahaiTasks.map(t => ({ role: t.defaultRole, score: null, comment: '' })),
      generalComment: '',
    },
    cahaiWith: {
      tasks: cahaiTasks.map(t => ({ role: t.defaultRole, score: null, comment: '' })),
      generalComment: '',
    },
    nasaWithout: { mentalDemand: null, physicalDemand: null, temporalDemand: null, performance: null, effort: null, frustration: null, dimensionNotes: {} },
    nasaWith: { mentalDemand: null, physicalDemand: null, temporalDemand: null, performance: null, effort: null, frustration: null, dimensionNotes: {} },
    sectionNotes: {},
    notRecorded: {},
  };
}
