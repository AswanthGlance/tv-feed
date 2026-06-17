export type RendererType =
  | 'recommendation'
  | 'comparison'
  | 'collection'
  | 'facts'
  | 'guided-flow'
  | 'journey'
  | 'insights'
  | 'why-this';

export interface RendererConfig {
  id: RendererType;
  label: string;
  query: string;
  thinkingSteps: string[];
  agentMessage: string;
  prompts: string[];
  maxIdx: number; // highest focusIdx in middle zone
}

export const RENDERERS: RendererConfig[] = [
  {
    id: 'recommendation',
    label: 'Recommendation Renderer',
    query: 'Suggest jackets for extreme cold',
    thinkingSteps: [
      'searching catalog for extreme cold jackets…',
      'filtering by thermal rating and wind resistance…',
      'loading user preferences and style history…',
      'ranking results by personal style match…',
      'composing final recommendations…',
    ],
    agentMessage: "Here's my best picks for you. Which one would you prefer?",
    prompts: [
      'Show me jackets for early morning walks',
      'Suggest outerwear for mountain getaways',
      'Recommend jackets for outdoor dinner plans',
      'Show me outerwear for ski holidays',
      'Find jackets for late night strolls',
    ],
    maxIdx: 10, // 0-2: CTAs, 3-10: 8 pick cards
  },
  {
    id: 'comparison',
    label: 'Comparison Renderer',
    query: 'Compare Sony, Bose and AirPods headphones',
    thinkingSteps: [
      'loading specs for Sony WH-1000XM6, Bose QC Ultra, AirPods Max…',
      'comparing noise cancellation and comfort ratings…',
      'checking battery life and user review data…',
      'evaluating value against your typical spend…',
      'ranking by overall match to your use case…',
    ],
    agentMessage: "I've compared them based on comfort, noise cancellation, battery, reviews, and value.",
    prompts: [
      'Compare with cheaper alternatives',
      'Show best headphones under $300',
      'Explain the noise cancellation difference',
      'Find headphones for gym use',
      'Show open-ear options',
    ],
    maxIdx: 2,
  },
  {
    id: 'collection',
    label: 'Collection Renderer',
    query: 'Shop for my Italy trip',
    thinkingSteps: [
      'scanning trending styles in Italy this season…',
      'filtering by occasion and travel context…',
      'matching to your style and color preferences…',
      'checking brand availability and sizing…',
      'composing your curated Italy edit…',
    ],
    agentMessage: "Here are a few pieces trending in Italy this season.",
    prompts: [
      'Style this look with accessories',
      'Suggest leather footwear for men',
      'Show more linen shirts',
      'Discover Italian cafes',
      'Explore experiences in Greece',
    ],
    maxIdx: 3,
  },
  {
    id: 'facts',
    label: 'Facts Renderer',
    query: "What's in this spicy ramen bowl?",
    thinkingSteps: [
      'analyzing ramen bowl ingredients…',
      'calculating nutritional breakdown…',
      'checking allergen and sensitivity database…',
      'cross-referencing dietary guidelines…',
      'composing your nutrition summary…',
    ],
    agentMessage: "I broke it down into nutrition, ingredients, and allergens.",
    prompts: [
      'Compare this with a healthier option',
      'Show lower sodium alternatives',
      'Explain the ingredients',
      'Find similar ramen nearby',
      'Build a lighter dinner plan',
    ],
    maxIdx: 3,
  },
  {
    id: 'guided-flow',
    label: 'Guided Flow Renderer',
    query: 'How do I make a ramen bowl?',
    thinkingSteps: [
      'fetching authentic ramen bowl recipe…',
      'breaking into manageable cooking steps…',
      'estimating timing per phase…',
      'adapting for home cooking…',
      'finalizing your step-by-step guide…',
    ],
    agentMessage: "I'll walk you through it step by step, keeping it easy to follow.",
    prompts: [
      'Show ingredient list',
      'Make this vegetarian',
      'Suggest a quick version',
      'Pair this with a drink',
      'Save this recipe',
    ],
    maxIdx: 3,
  },
  {
    id: 'journey',
    label: 'Journey Renderer',
    query: 'Plan my USA vs Paraguay match day',
    thinkingSteps: [
      'checking real-time traffic to SoFi Stadium…',
      'mapping parking and entry points…',
      'identifying fan zone timings…',
      'optimizing your arrival window…',
      'composing your match-day timeline…',
    ],
    agentMessage: "I mapped a relaxed match-day flow so you reach SoFi with time to spare.",
    prompts: [
      'Plan parking near SoFi',
      'Find food before kickoff',
      'Show fan experiences nearby',
      'Add this plan to calendar',
      'Share route to my phone',
    ],
    maxIdx: 4,
  },
  {
    id: 'insights',
    label: 'Insights Renderer',
    query: 'How did my fitness look this week?',
    thinkingSteps: [
      'loading your fitness data from this week…',
      'comparing against your weekly baseline…',
      'analyzing workout distribution…',
      'evaluating recovery and sleep metrics…',
      'generating your weekly summary…',
    ],
    agentMessage: "Your week looks strong overall. Recovery is the main thing to watch.",
    prompts: [
      "Build next week's workout plan",
      'Explain my recovery score',
      'Suggest a lighter routine',
      'Compare with last month',
      'Show nutrition tips for recovery',
    ],
    maxIdx: 3,
  },
  {
    id: 'why-this',
    label: 'Why This Renderer',
    query: 'Why are you recommending this jacket?',
    thinkingSteps: [
      'reviewing your recent style saves and history…',
      'checking current weather forecast and conditions…',
      'matching against your activity context…',
      'verifying price against your usual spend…',
      'composing reasoning summary…',
    ],
    agentMessage: "Here's why this pick fits your weather, activity, and style context.",
    prompts: [
      'Show more like this',
      'Compare with the long coat',
      'Explain weather protection',
      'Find a warmer option',
      'Show budget alternatives',
    ],
    maxIdx: 3,
  },
];
