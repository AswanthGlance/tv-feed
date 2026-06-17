import type { Market } from './types';

export type MarketConfig = {
  market: Market;
  defaultLanguage: string;
  priorityCategories: string[];
  priorityRegions: string[];
  priorityVibes: string[];
  coldStartOrder: string[];
};

export const MARKET_CONFIGS: Record<Market, MarketConfig> = {
  india: {
    market: 'india',
    defaultLanguage: 'English',
    priorityCategories: ['food', 'travel', 'entertainment', 'sports', 'home'],
    priorityRegions: ['india', 'rajasthan', 'kerala', 'himalayas', 'mumbai', 'south-india'],
    priorityVibes: ['warm', 'cozy', 'festive', 'spiritual', 'social'],
    coldStartOrder: ['travel', 'food', 'home', 'sports', 'entertainment', 'wellness', 'luxury', 'fashion'],
  },
  us: {
    market: 'us',
    defaultLanguage: 'English',
    priorityCategories: ['sports', 'food', 'travel', 'entertainment', 'home'],
    priorityRegions: ['us', 'american-west', 'nordic', 'global'],
    priorityVibes: ['cinematic', 'open-sky', 'social', 'high-energy', 'premium'],
    coldStartOrder: ['travel', 'food', 'sports', 'home', 'entertainment', 'wellness', 'luxury', 'fashion'],
  },
  global: {
    market: 'global',
    defaultLanguage: 'English',
    priorityCategories: ['travel', 'food', 'home', 'wellness', 'entertainment'],
    priorityRegions: ['global', 'asia', 'europe'],
    priorityVibes: ['cinematic', 'calm', 'warm', 'social'],
    coldStartOrder: ['travel', 'food', 'home', 'entertainment', 'sports', 'wellness', 'luxury', 'fashion'],
  },
};

export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish'];

export const FEED_MIX = {
  familiar: { dominant: 0.70, adjacent: 0.20, exploration: 0.05, contextual: 0.05 },
  related:  { dominant: 0.55, adjacent: 0.30, exploration: 0.10, contextual: 0.05 },
  surprise: { dominant: 0.45, adjacent: 0.30, exploration: 0.20, contextual: 0.05 },
  new:      { dominant: 0.35, adjacent: 0.30, exploration: 0.25, contextual: 0.10 },
};
