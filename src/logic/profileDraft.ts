// GlanceProfileDraft — sparse enriched profile built from onboarding answers.
// This is the "enriched JSON shape at low confidence" that proves cold→warm works.

export interface CategoryInterest {
  category: string;
  confidence_score: number;
  engagement_ratio: null;
  brand_preferences: [];
  price_range: null;
  subcategories?: string[];
}

export interface GlanceProfileDraft {
  demographics: {
    location: { value: string | null; confidence_score: number | null };
  };
  category_interests: {
    primary_category_interests: CategoryInterest[];
  };
  lifestyle_preferences: {
    food_and_dining: { cuisine_preferences: string[]; confidence_score: number | null };
    travel_patterns: { destination_types: string[]; confidence_score: number | null };
    health_and_fitness: { wellness_interests: string[]; confidence_score: number | null };
    hobbies_and_interests: { categories: string[]; confidence_score: number | null };
    social_life: { preferred_venues: string[]; confidence_score: number | null };
    entertainment_preferences: { event_attendance: Record<string, string>; confidence_score: number | null };
  };
  _derived_signals: {
    vibe: Record<string, number>;
  };
  discovery_appetite: 'familiar' | 'medium' | 'medium_high' | 'high' | null;
  chat_preferences: { user_intents: string[] };
  _metadata: {
    total_interactions: number;
    data_quality: 'cold' | 'sparse' | 'rich';
    primary_signal_source: 'onboarding' | 'interaction';
  };
}

export function createSparseEnrichedProfile(): GlanceProfileDraft {
  return {
    demographics: {
      location: { value: 'Bangalore', confidence_score: 0.97 },
    },
    category_interests: {
      primary_category_interests: [],
    },
    lifestyle_preferences: {
      food_and_dining: { cuisine_preferences: [], confidence_score: null },
      travel_patterns: { destination_types: [], confidence_score: null },
      health_and_fitness: { wellness_interests: [], confidence_score: null },
      hobbies_and_interests: { categories: [], confidence_score: null },
      social_life: { preferred_venues: [], confidence_score: null },
      entertainment_preferences: { event_attendance: {}, confidence_score: null },
    },
    _derived_signals: { vibe: {} },
    discovery_appetite: null,
    chat_preferences: { user_intents: [] },
    _metadata: {
      total_interactions: 0,
      data_quality: 'cold',
      primary_signal_source: 'onboarding',
    },
  };
}

// ── World → enriched profile mappings ─────────────────────────────────────

interface WorldMapping {
  category: string;
  subcategories?: string[];
  lifestyle?: Partial<GlanceProfileDraft['lifestyle_preferences']>;
  vibe?: Record<string, number>;
}

const WORLD_TO_PROFILE: Record<string, WorldMapping> = {
  'food-finds': {
    category: 'Food',
    lifestyle: { food_and_dining: { cuisine_preferences: ['local', 'street food'], confidence_score: 0.35 } },
  },
  'style-ideas': {
    category: 'Fashion',
    subcategories: ['topwear', 'outerwear'],
  },
  'weekend-escapes': {
    category: 'Travel',
    lifestyle: { travel_patterns: { destination_types: ['short trips', 'scenic'], confidence_score: 0.35 } },
  },
  'calm-routines': {
    category: 'Wellness',
    lifestyle: { health_and_fitness: { wellness_interests: ['calm routines', 'mindfulness', 'unwind'], confidence_score: 0.35 } },
    vibe: { calm: 0.3 },
  },
  'home-upgrades': {
    category: 'Home',
    lifestyle: { hobbies_and_interests: { categories: ['home', 'interiors'], confidence_score: 0.35 } },
  },
  'local-discoveries': {
    category: 'Culture',
    lifestyle: { social_life: { preferred_venues: ['local spots'], confidence_score: 0.35 } },
    vibe: { social: 0.3 },
  },
  'game-day-sport': {
    category: 'Sport',
    lifestyle: { entertainment_preferences: { event_attendance: { sports: 'likely' }, confidence_score: 0.35 } },
  },
  'tech-gadgets': {
    category: 'Tech',
    lifestyle: { hobbies_and_interests: { categories: ['technology'], confidence_score: 0.35 } },
  },
  // Legacy IDs from existing Q2 worlds — normalise to new IDs
  'local-markets': {
    category: 'Food',
    lifestyle: { food_and_dining: { cuisine_preferences: ['local', 'street food'], confidence_score: 0.35 } },
  },
  'game-day': {
    category: 'Sport',
    lifestyle: { entertainment_preferences: { event_attendance: { sports: 'likely' }, confidence_score: 0.35 } },
  },
  'beautiful-homes': {
    category: 'Home',
    lifestyle: { hobbies_and_interests: { categories: ['home', 'interiors'], confidence_score: 0.35 } },
  },
  'style-culture': {
    category: 'Fashion',
    subcategories: ['topwear', 'outerwear'],
  },
  'nature-escapes': {
    category: 'Travel',
    lifestyle: { travel_patterns: { destination_types: ['short trips', 'scenic'], confidence_score: 0.35 } },
  },
  'food-stories': {
    category: 'Food',
    lifestyle: { food_and_dining: { cuisine_preferences: ['local', 'street food'], confidence_score: 0.35 } },
  },
};

const ONBOARDING_CONFIDENCE = 0.35;

export function applyWorldToDraft(draft: GlanceProfileDraft, worldId: string): GlanceProfileDraft {
  const mapping = WORLD_TO_PROFILE[worldId];
  if (!mapping) return draft;

  const next = JSON.parse(JSON.stringify(draft)) as GlanceProfileDraft;

  // Add or bump category interest
  const existing = next.category_interests.primary_category_interests.find(c => c.category === mapping.category);
  if (existing) {
    existing.confidence_score = Math.min(0.40, existing.confidence_score + 0.05);
    if (mapping.subcategories) existing.subcategories = [...(existing.subcategories || []), ...mapping.subcategories];
  } else {
    next.category_interests.primary_category_interests.push({
      category: mapping.category,
      confidence_score: ONBOARDING_CONFIDENCE,
      engagement_ratio: null,
      brand_preferences: [],
      price_range: null,
      ...(mapping.subcategories ? { subcategories: mapping.subcategories } : {}),
    });
  }

  // Apply lifestyle writes
  if (mapping.lifestyle) {
    const lp = next.lifestyle_preferences;
    const ml = mapping.lifestyle;
    if (ml.food_and_dining?.cuisine_preferences) {
      lp.food_and_dining.cuisine_preferences = [...new Set([...lp.food_and_dining.cuisine_preferences, ...ml.food_and_dining.cuisine_preferences])];
      lp.food_and_dining.confidence_score = ONBOARDING_CONFIDENCE;
    }
    if (ml.travel_patterns?.destination_types) {
      lp.travel_patterns.destination_types = [...new Set([...lp.travel_patterns.destination_types, ...ml.travel_patterns.destination_types])];
      lp.travel_patterns.confidence_score = ONBOARDING_CONFIDENCE;
    }
    if (ml.health_and_fitness?.wellness_interests) {
      lp.health_and_fitness.wellness_interests = [...new Set([...lp.health_and_fitness.wellness_interests, ...ml.health_and_fitness.wellness_interests])];
      lp.health_and_fitness.confidence_score = ONBOARDING_CONFIDENCE;
    }
    if (ml.hobbies_and_interests?.categories) {
      lp.hobbies_and_interests.categories = [...new Set([...lp.hobbies_and_interests.categories, ...ml.hobbies_and_interests.categories])];
      lp.hobbies_and_interests.confidence_score = ONBOARDING_CONFIDENCE;
    }
    if (ml.social_life?.preferred_venues) {
      lp.social_life.preferred_venues = [...new Set([...lp.social_life.preferred_venues, ...ml.social_life.preferred_venues])];
      lp.social_life.confidence_score = ONBOARDING_CONFIDENCE;
    }
    if (ml.entertainment_preferences?.event_attendance) {
      lp.entertainment_preferences.event_attendance = { ...lp.entertainment_preferences.event_attendance, ...ml.entertainment_preferences.event_attendance };
      lp.entertainment_preferences.confidence_score = ONBOARDING_CONFIDENCE;
    }
  }

  // Apply vibe hints
  if (mapping.vibe) {
    for (const [vibe, strength] of Object.entries(mapping.vibe)) {
      next._derived_signals.vibe[vibe] = Math.min(0.5, (next._derived_signals.vibe[vibe] || 0) + strength);
    }
  }

  next._metadata.data_quality = 'sparse';
  next._metadata.primary_signal_source = 'onboarding';

  return next;
}

const DISCOVERY_TO_INTENTS: Record<string, string[]> = {
  familiar:    ['OCCASION_CASUAL_DAILY'],
  medium:      ['OCCASION_CASUAL_DAILY', 'DISCOVER_RELATED'],
  medium_high: ['DISCOVER_RELATED', 'DISCOVER_NEW'],
  high:        ['DISCOVER_NEW', 'OCCASION_CASUAL_DAILY'],
};

export function applyDiscoveryToDraft(draft: GlanceProfileDraft, appetite: 'familiar' | 'medium' | 'medium_high' | 'high'): GlanceProfileDraft {
  const next = { ...draft };
  next.discovery_appetite = appetite;
  next.chat_preferences = { user_intents: DISCOVERY_TO_INTENTS[appetite] || [] };
  return next;
}

export function bumpInteractionCount(draft: GlanceProfileDraft): GlanceProfileDraft {
  const next = { ...draft, _metadata: { ...draft._metadata } };
  next._metadata.total_interactions += 1;
  if (next._metadata.total_interactions >= 5) {
    next._metadata.data_quality = 'sparse';
    next._metadata.primary_signal_source = 'interaction';
  }
  return next;
}
