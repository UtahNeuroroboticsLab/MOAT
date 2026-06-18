export interface PatientInfo {
  id: string;
  date: string;
  date2: string;
  affectedHand: 'Left' | 'Right';
  assessmentPhase: 'baseline' | '2m' | '4m' | '6m' | '9m' | '1y';
  notes: string;
}

export interface MASData {
  // 8 muscle groups: shoulder_flex, shoulder_ext, shoulder_abd, elbow_flex, elbow_ext, wrist_flex, wrist_ext, finger_flex
  // Each has MAS score, MMT score, AROM value
  rows: {
    joint: string;
    muscle: string;
    mas: string;   // 0,1,1+,2,3,4 or NT
    mmt: string;   // 0/5..5/5 or NA or NT
    arom: string;  // degrees or NA or NT
    notes: string;
  }[];
}

export interface SISData {
  // 8 domains + recovery score
  // Each domain item is scored 1-5
  domains: { [domainKey: string]: (number | null)[] };
  recoveryScore: number | null;  // 0-100
}

export interface COPMData {
  problems: {
    description: string;
    importance: number | null;   // 1-10
    perfT1: number | null;       // 1-10
    satT1: number | null;        // 1-10
    perfT2: number | null;       // 1-10
    satT2: number | null;        // 1-10
    notes: string;
  }[];
  identificationNotes: {
    selfCare: { personalCare: string[]; functionalMobility: string[]; communityMgmt: string[] };
    productivity: { paidWork: string[]; householdMgmt: string[]; play: string[] };
    leisure: { quietRec: string[]; activeRec: string[]; socialization: string[] };
  };
  importanceRatings: {
    selfCare: { personalCare: (number|null)[]; functionalMobility: (number|null)[]; communityMgmt: (number|null)[] };
    productivity: { paidWork: (number|null)[]; householdMgmt: (number|null)[]; play: (number|null)[] };
    leisure: { quietRec: (number|null)[]; activeRec: (number|null)[]; socialization: (number|null)[] };
  };
  dates: { initial: string; t2: string };
}

export interface FMAData {
  // Each item keyed by ID (A1..A18, B1..B5, C1..C7, D1..D3)
  scores: { [itemId: string]: number | null };
  sectionNotes: { [sectionTitle: string]: string };
}

export interface MyomoTaskComponent {
  achieve: number;  // 0 or 1
  time: number | null;
}

export interface MyomoTasksData {
  tasks: {
    components: MyomoTaskComponent[];
    notes: string;
  }[];
}

export interface CAHAITask {
  role: string;
  score: number | null;  // 1-7, null = not recorded
  comment: string;
}

export interface CAHAIData {
  tasks: CAHAITask[];
  generalComment: string;
}

export interface NasaTLXData {
  mentalDemand: number | null;     // 0-20
  physicalDemand: number | null;
  temporalDemand: number | null;
  performance: number | null;
  effort: number | null;
  frustration: number | null;
  dimensionNotes: { [key: string]: string };
}

export interface AssessmentState {
  patientInfo: PatientInfo;
  mas: MASData;
  fma: FMAData;
  sis: SISData;
  copm: COPMData;
  // boxAndBlocks: BoxAndBlocksData;
  myomoWithout: MyomoTasksData;
  myomoWith: MyomoTasksData;
  cahaiWithout: CAHAIData;
  cahaiWith: CAHAIData;
  nasaWithout: NasaTLXData;
  nasaWith: NasaTLXData;
  sectionNotes: { [section: string]: string };
  notRecorded: { [key: string]: boolean };
}

export type SectionId =
  | 'patient_info'
  | 'mas'
  | 'fugl_meyer'
  | 'sis'
  | 'copm'
  | 'box_and_blocks'
  | 'myomo_without'
  | 'myomo_with'
  | 'cahai_without'
  | 'cahai_with'
  | 'nasa_without'
  | 'nasa_with'
  | 'notes'
  | 'export';
