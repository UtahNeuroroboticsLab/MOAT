export interface SISDomain {
  key: string;
  number: number;
  title: string;
  prompt: string;
  labels: string[]; // 5 labels, index 0 = score 5, index 4 = score 1
  items: { letter: string; text: string; gRow: number }[];
  scaledCell: string; // H column row
}

export const sisDomains: SISDomain[] = [
  {
    key: 'strength', number: 1,
    title: 'Strength',
    prompt: 'In the past week, how would you rate the strength of your...',
    labels: ['A lot of strength', 'Quite a bit', 'Some', 'A little', 'No strength at all'],
    items: [
      { letter: 'a', text: 'Arm that was most affected by your stroke?', gRow: 9 },
      { letter: 'b', text: 'Grip of your hand that was most affected by your stroke?', gRow: 10 },
      { letter: 'c', text: 'Leg that was most affected by your stroke?', gRow: 11 },
      { letter: 'd', text: 'Foot/ankle that was most affected by your stroke?', gRow: 12 },
    ],
    scaledCell: 'H9',
  },
  {
    key: 'memory', number: 2,
    title: 'Memory & Thinking',
    prompt: 'In the past week, how difficult was it for you to...',
    labels: ['Not difficult at all', 'A little difficult', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'],
    items: [
      { letter: 'a', text: 'Remember things that people just told you?', gRow: 15 },
      { letter: 'b', text: 'Remember things that happened the day before?', gRow: 16 },
      { letter: 'c', text: 'Remember to do things (e.g. keep appointments or take medication)?', gRow: 17 },
      { letter: 'd', text: 'Remember the day of the week?', gRow: 18 },
      { letter: 'e', text: 'Concentrate?', gRow: 19 },
      { letter: 'f', text: 'Think quickly?', gRow: 20 },
      { letter: 'g', text: 'Solve everyday problems?', gRow: 21 },
    ],
    scaledCell: 'H15',
  },
  {
    key: 'emotion', number: 3,
    title: 'Emotion',
    prompt: 'In the past week, how often did you...',
    labels: ['None of the time', 'A little of the time', 'Some of the time', 'Most of the time', 'All of the time'],
    items: [
      { letter: 'a', text: 'Feel sad?', gRow: 24 },
      { letter: 'b', text: 'Feel that there is nobody you are close to?', gRow: 25 },
      { letter: 'c', text: 'Feel that you are a burden to others?', gRow: 26 },
      { letter: 'd', text: 'Feel that you have nothing to look forward to?', gRow: 27 },
      { letter: 'e', text: 'Blame yourself for mistakes that you made?', gRow: 28 },
      { letter: 'f', text: 'Enjoy things as much as ever?', gRow: 29 },
      { letter: 'g', text: 'Feel quite nervous?', gRow: 30 },
      { letter: 'h', text: 'Feel that life is worth living?', gRow: 31 },
      { letter: 'i', text: 'Smile and laugh at least once a day?', gRow: 32 },
    ],
    scaledCell: 'H24',
  },
  {
    key: 'communication', number: 4,
    title: 'Communication',
    prompt: 'In the past week, how difficult was it to...',
    labels: ['Not difficult at all', 'A little difficult', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'],
    items: [
      { letter: 'a', text: 'Say the name of someone who was in front of you?', gRow: 35 },
      { letter: 'b', text: 'Understand what was being said to you in a conversation?', gRow: 36 },
      { letter: 'c', text: 'Reply to questions?', gRow: 37 },
      { letter: 'd', text: 'Correctly name objects?', gRow: 38 },
      { letter: 'e', text: 'Participate in a conversation with a group of people?', gRow: 39 },
      { letter: 'f', text: 'Have a conversation on the telephone?', gRow: 40 },
      { letter: 'g', text: 'Call another person on the telephone, including selecting the correct number and dialing?', gRow: 41 },
    ],
    scaledCell: 'H35',
  },
  {
    key: 'adl', number: 5,
    title: 'Activities of Daily Living',
    prompt: 'In the past 2 weeks, how difficult was it to...',
    labels: ['Not difficult at all', 'A little difficult', 'Somewhat difficult', 'Very difficult', 'Could not do at all'],
    items: [
      { letter: 'a', text: 'Cut your food with a knife and fork?', gRow: 44 },
      { letter: 'b', text: 'Dress the top part of your body?', gRow: 45 },
      { letter: 'c', text: 'Bathe yourself?', gRow: 46 },
      { letter: 'd', text: 'Clip your toenails?', gRow: 47 },
      { letter: 'e', text: 'Get to the toilet on time?', gRow: 48 },
      { letter: 'f', text: 'Control your bladder (not have an accident)?', gRow: 49 },
      { letter: 'g', text: 'Control your bowels (not have an accident)?', gRow: 50 },
      { letter: 'h', text: 'Do light household tasks/chores (e.g. dust, make a bed, take out garbage)?', gRow: 51 },
      { letter: 'i', text: 'Go shopping?', gRow: 52 },
      { letter: 'j', text: 'Do heavy household chores (e.g. vacuum, laundry or yard work)?', gRow: 53 },
    ],
    scaledCell: 'H44',
  },
  {
    key: 'mobility', number: 6,
    title: 'Mobility',
    prompt: 'In the past 2 weeks, how difficult was it to...',
    labels: ['Not difficult at all', 'A little difficult', 'Somewhat difficult', 'Very difficult', 'Could not do at all'],
    items: [
      { letter: 'a', text: 'Stay sitting without losing your balance?', gRow: 56 },
      { letter: 'b', text: 'Stay standing without losing your balance?', gRow: 57 },
      { letter: 'c', text: 'Walk without losing your balance?', gRow: 58 },
      { letter: 'd', text: 'Move from a bed to a chair?', gRow: 59 },
      { letter: 'e', text: 'Walk one block?', gRow: 60 },
      { letter: 'f', text: 'Walk fast?', gRow: 61 },
      { letter: 'g', text: 'Climb one flight of stairs?', gRow: 62 },
      { letter: 'h', text: 'Climb several flights of stairs?', gRow: 63 },
      { letter: 'i', text: 'Get in and out of a car?', gRow: 64 },
    ],
    scaledCell: 'H56',
  },
  {
    key: 'hand', number: 7,
    title: 'Hand Function',
    prompt: 'In the past 2 weeks, how difficult was it to use your hand that was most affected by your stroke to...',
    labels: ['Not difficult at all', 'A little difficult', 'Somewhat difficult', 'Very difficult', 'Could not do at all'],
    items: [
      { letter: 'a', text: 'Carry heavy objects (e.g. bag of groceries)?', gRow: 67 },
      { letter: 'b', text: 'Turn a doorknob?', gRow: 68 },
      { letter: 'c', text: 'Open a can or jar?', gRow: 69 },
      { letter: 'd', text: 'Tie a shoe lace?', gRow: 70 },
      { letter: 'e', text: 'Pick up a dime?', gRow: 71 },
    ],
    scaledCell: 'H67',
  },
  {
    key: 'participation', number: 8,
    title: 'Participation',
    prompt: 'During the past 4 weeks, how much of the time have you been limited in...',
    labels: ['None of the time', 'A little of the time', 'Some of the time', 'Most of the time', 'All of the time'],
    items: [
      { letter: 'a', text: 'Your work (paid, voluntary or other)?', gRow: 74 },
      { letter: 'b', text: 'Your social activities?', gRow: 75 },
      { letter: 'c', text: 'Quiet recreation (crafts, reading)?', gRow: 76 },
      { letter: 'd', text: 'Active recreation (sports, outings, travel)?', gRow: 77 },
      { letter: 'e', text: 'Your role as a family member and/or friend?', gRow: 78 },
      { letter: 'f', text: 'Your participation in spiritual or religious activities?', gRow: 79 },
      { letter: 'g', text: 'Your ability to control your life as you wish?', gRow: 80 },
      { letter: 'h', text: 'Your ability to help others?', gRow: 81 },
    ],
    scaledCell: 'H74',
  },
];
