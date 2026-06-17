export type GenOption = {
  label: string;
  boost?: string[];
  cut?: string[];
  discover?: boolean;
  reinforce?: boolean;
  tuned: string;
};

export type GenQuestion = {
  id: string;
  question: string;
  options: [GenOption, GenOption];
};

export const GENQ: GenQuestion[] = [
  {
    id: 'mood',
    question: 'How should your screen feel?',
    options: [
      { label: 'Calm and slow', boost: ['calm', 'slow', 'cozy', 'mindful'], cut: ['high-energy'], tuned: 'Bringing in calmer picks.' },
      { label: 'Bright and lively', boost: ['high-energy', 'vibrant', 'energetic', 'neon'], cut: ['slow'], tuned: 'Bringing in more energy.' },
    ],
  },
  {
    id: 'world',
    question: 'Stay close to home, or wander further?',
    options: [
      { label: 'Closer to home', boost: ['india-travel', 'india', 'regional', 'south-indian'], tuned: 'Keeping it closer to home.' },
      { label: 'Further away', boost: ['travel', 'japan', 'korea', 'asia', 'europe-travel', 'mediterranean'], tuned: 'Adding a few farther escapes.' },
    ],
  },
  {
    id: 'tone',
    question: 'Everyday and real, or more aspirational?',
    options: [
      { label: 'Everyday and real', boost: ['cozy', 'comfort', 'warm', 'interiors', 'calm'], tuned: 'Leaning everyday and real.' },
      { label: 'More aspirational', boost: ['luxury', 'aspirational', 'escape', 'premium'], tuned: 'Bringing in more aspiration.' },
    ],
  },
  {
    id: 'discover',
    question: 'Should Glance surprise you sometimes?',
    options: [
      { label: 'Yes, surprise me', discover: true, tuned: 'Mixing in something new.' },
      { label: 'Stay close to my taste', reinforce: true, tuned: 'Staying closer to your taste.' },
    ],
  },
];
