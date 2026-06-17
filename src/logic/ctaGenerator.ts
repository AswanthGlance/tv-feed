/**
 * ctaGenerator.ts — conversational CTA copy for L0 glances.
 *
 * Principle: the CTA is the agent inviting the user into the next step.
 * It should feel like a natural continuation of the conversation.
 * No em dashes. No "Explore." No "Learn More." No generic labels.
 */

import type { FeedItem } from '../data/types';

type CTAPool = string[];

const CATEGORY_POOLS: Record<string, CTAPool> = {
  food: [
    'Show me what makes this special',
    'Take me to the recipe',
    'Tell me the story behind this',
    'Show me how this is made',
    'I want to try this',
    'Take me to the full recipe',
  ],
  fashion: [
    'Show me the full look',
    'Help me explore this style',
    'Show me what goes with this',
    'Take me into this edit',
    'Let me see more of this',
  ],
  travel: [
    'Show me where this leads',
    'Take me there',
    'Tell me more about this place',
    'Let me see what is waiting there',
    'I want to explore this',
    'Show me the full story',
  ],
  wellness: [
    'Show me how to start',
    'Take me through the ritual',
    'Tell me more about this',
    'Show me the full practice',
    'I want to try this',
  ],
  home: [
    'Show me how to get this look',
    'Take me through the space',
    'Help me recreate this',
    'Show me the details',
    'I want this feeling at home',
  ],
  sports: [
    'Show me the highlights',
    'Take me to the action',
    'Tell me how this works',
    'Show me the full match',
    'I want to see more of this',
  ],
  entertainment: [
    'Show me something like this',
    'Take me deeper into this',
    'Tell me the full story',
    'I want to explore this',
    'Show me more',
  ],
  luxury: [
    'Show me what makes this worth it',
    'Take me into this world',
    'Tell me the full story',
    'I want to see this up close',
    'Show me the details',
  ],
  beauty: [
    'Show me the full routine',
    'Take me through the ritual',
    'Tell me how to recreate this',
    'Show me the steps',
    'I want to try this',
  ],
  hobbies: [
    'Show me how to get started',
    'Take me through this',
    'Tell me more about this craft',
    'I want to try this',
    'Show me the full guide',
  ],
};

const FALLBACK_POOL: CTAPool = [
  'Show me more',
  'Tell me the full story',
  'Take me there',
  'I want to explore this',
  'Show me what is next',
];

function deterministicIndex(id: string, poolLength: number): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % poolLength;
}

// Per-item CTA overrides — used when the content requires a specific label
// (e.g. cold-start cards where copy comes directly from the content document)
const ITEM_CTA_OVERRIDES: Record<string, string> = {
  'cs-balcony-escape':   'Browse rain-friendly balcony picks',
  'cs-gond-art':         "Open this Sunday's studio schedule",
  'cs-gold-stack':       'Browse the everyday-stack edit',
  'cs-monsoon-football': 'Find a turf open this morning',
  'cs-mysore-bonda':     'Map the bonda spots open now',
  'cs-shivanasamudra':   'Plan the morning day-trip',
  'cs-vidhana-soudha':   'See the sunrise photo route',
  'cs-sunnys':           "Check this morning's seating",
  'cs-pour-over':        'Discover the bars pouring near you',
  'cs-therpup':          'Reserve a morning visit',
  'cs-vinyasa-cubbon':   'Map the route to the lawn',

  // Warm start — warm_profile_1 (Akshay) agentic CTAs
  'ws-india-afg':    'Set a reminder for first ball?',
  'ws-nandi-hills':  'Add me to Sunday?',
  'ws-om-beach':     'Plan the Gokarna weekend?',
  'ws-coorg':        'Want me to shortlist estate stays?',
  'ws-amalfi':       'Save it for the longer trip?',
  'ws-wind-down':    'Cue the wind-down for tonight?',
  'ws-vinyl-ritual': 'Hold a Saturday seat?',
  'ws-gehra-hua':    "Queue this week's playlist?",
};

/**
 * Returns a conversational CTA label for the given feed item.
 */
export function getConversationalCTA(item: FeedItem): string {
  if (ITEM_CTA_OVERRIDES[item.id]) return ITEM_CTA_OVERRIDES[item.id];
  const pool = CATEGORY_POOLS[item.category] ?? FALLBACK_POOL;
  return pool[deterministicIndex(item.id, pool.length)];
}
