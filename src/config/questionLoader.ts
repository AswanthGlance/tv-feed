// Runtime question config loader.
// Fetches /config/questions.json; falls back to the baked-in default if unavailable.
// Production: swap the URL for a remote CMS endpoint.

export type TokenDelta = { token: string; delta: number };

export type QuestionOptionCfg = {
  id: string;
  label: string;
  sublabel?: string;
  image?: string;
  confirmationText: string;
  mapping: TokenDelta[];
};

export type QuestionCfg = {
  id: string;
  surface: 'setup' | 'interstitial';
  select: 'single' | 'multi';
  maxSelect?: number;
  prompt: string;
  subtext?: string;
  gapAxis?: string;           // interstitial: fill this axis gap first
  triggerAfterCards?: number;
  autoDismissMs?: number;
  options: QuestionOptionCfg[];
};

export type QuestionsConfig = {
  version: string;
  setup: QuestionCfg[];
  interstitials: QuestionCfg[];
  tagLabels: Record<string, string>;
};

let _cached: QuestionsConfig | null = null;

// Baked-in minimal fallback so the app works with no network
import FALLBACK from './questionsFallback.json';

export async function loadQuestionsConfig(): Promise<QuestionsConfig> {
  if (_cached) return _cached;
  try {
    const res = await fetch('/config/questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _cached = await res.json() as QuestionsConfig;
    return _cached;
  } catch (e) {
    console.warn('[QuestionLoader] Failed to load /config/questions.json, using fallback.', e);
    _cached = FALLBACK as QuestionsConfig;
    return _cached;
  }
}

export function getTagLabel(token: string, config: QuestionsConfig): string {
  return config.tagLabels[token] ?? token.split(':').pop()?.replace(/-/g, ' ') ?? token;
}

// Singleton promise so multiple callers share one fetch
let _promise: Promise<QuestionsConfig> | null = null;
export function getQuestionsConfig(): Promise<QuestionsConfig> {
  if (!_promise) _promise = loadQuestionsConfig();
  return _promise;
}
