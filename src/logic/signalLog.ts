// Live signal log — every preference event recorded as it happens.
// This is what the "Data Collected" tab displays.
// Structured for ML consumption: source, surface, attributes, weights, shelf life.

export type SignalLogEntry = {
  id: string;
  timestamp_ms: number;
  timestamp_iso: string;
  session_id: string;

  // What triggered this signal
  source: 'setup' | 'interstitial' | 'l1-exit' | 'thumbs-up' | 'thumbs-down' | 'contextual' | 'passive-dwell' | 'skip-fast' | 'settings' | 'reset';
  surface: 'onboarding' | 'feed' | 'deep-dive' | 'settings';

  // What the user did
  action_label: string;     // human-readable: "Selected: Slow Morning", "Thumbs up: More calm nature"
  card_id?: string;
  card_title?: string;
  card_category?: string;

  // What it means for the model
  boosted_attributes: string[];
  decayed_attributes: string[];
  strength: 'weak' | 'medium' | 'strong';
  shelf_life: 'session' | 'medium' | 'long';
  durable: boolean;         // false = session-only, no ML write

  // Weight delta (snapshot of what changed)
  weight_deltas: Record<string, number>;
};

// Module-level log — persists for the session lifetime
const _log: SignalLogEntry[] = [];
let _sessionId = 'sess_' + Math.random().toString(36).slice(2, 10);
let _entryCounter = 0;

export function getSessionId() { return _sessionId; }
export function getSignalLog(): SignalLogEntry[] { return [..._log]; }
export function clearSignalLog() { _log.length = 0; _sessionId = 'sess_' + Math.random().toString(36).slice(2, 10); }

export function logSignal(entry: Omit<SignalLogEntry, 'id' | 'timestamp_ms' | 'timestamp_iso' | 'session_id'>): SignalLogEntry {
  const now = Date.now();
  const full: SignalLogEntry = {
    ...entry,
    id: `sig_${++_entryCounter}_${now.toString(36)}`,
    timestamp_ms: now,
    timestamp_iso: new Date(now).toISOString(),
    session_id: _sessionId,
  };
  _log.push(full);
  return full;
}

// Helpers for common signal types
export function logOnboarding(actionLabel: string, boosted: string[], weightDeltas: Record<string, number>) {
  return logSignal({ source: 'setup', surface: 'onboarding', action_label: actionLabel, boosted_attributes: boosted, decayed_attributes: [], strength: 'medium', shelf_life: 'long', durable: true, weight_deltas: weightDeltas });
}

export function logInterstitial(actionLabel: string, boosted: string[], weightDeltas: Record<string, number>) {
  return logSignal({ source: 'interstitial', surface: 'feed', action_label: actionLabel, boosted_attributes: boosted, decayed_attributes: [], strength: 'medium', shelf_life: 'long', durable: true, weight_deltas: weightDeltas });
}

export function logL1Exit(cardId: string, cardTitle: string, category: string, label: string, key: string, weightDeltas: Record<string, number>) {
  return logSignal({ source: 'l1-exit', surface: 'deep-dive', action_label: `L1 exit: ${label}`, card_id: cardId, card_title: cardTitle, card_category: category, boosted_attributes: key ? [key] : [], decayed_attributes: [], strength: 'strong', shelf_life: 'long', durable: true, weight_deltas: weightDeltas });
}

export function logThumbsUp(cardId: string, cardTitle: string, category: string, label: string, boosted: string[], weightDeltas: Record<string, number>) {
  return logSignal({ source: 'thumbs-up', surface: 'feed', action_label: `Thumbs up: ${label}`, card_id: cardId, card_title: cardTitle, card_category: category, boosted_attributes: boosted, decayed_attributes: [], strength: 'strong', shelf_life: 'long', durable: true, weight_deltas: weightDeltas });
}

export function logThumbsDown(cardId: string, cardTitle: string, category: string, label: string, decayed: string[], sessionOnly: boolean, weightDeltas: Record<string, number>) {
  return logSignal({ source: 'thumbs-down', surface: 'feed', action_label: `Thumbs down: ${label}`, card_id: cardId, card_title: cardTitle, card_category: category, boosted_attributes: [], decayed_attributes: decayed, strength: sessionOnly ? 'weak' : 'strong', shelf_life: sessionOnly ? 'session' : 'long', durable: !sessionOnly, weight_deltas: weightDeltas });
}

export function logPassiveDwell(cardId: string, cardTitle: string, category: string, isRepeat: boolean, weightDeltas: Record<string, number>) {
  return logSignal({ source: 'passive-dwell', surface: 'feed', action_label: `Dwell: ${cardTitle}${isRepeat ? ' (repeat)' : ''}`, card_id: cardId, card_title: cardTitle, card_category: category, boosted_attributes: [category], decayed_attributes: [], strength: isRepeat ? 'medium' : 'weak', shelf_life: isRepeat ? 'medium' : 'session', durable: isRepeat, weight_deltas: weightDeltas });
}

export function logSkipFast(cardId: string, cardTitle: string, category: string, weightDeltas: Record<string, number>) {
  return logSignal({ source: 'skip-fast', surface: 'feed', action_label: `Fast skip: ${cardTitle}`, card_id: cardId, card_title: cardTitle, card_category: category, boosted_attributes: [], decayed_attributes: [category], strength: 'weak', shelf_life: 'session', durable: false, weight_deltas: weightDeltas });
}

export function logContextual(cardId: string, cardTitle: string, topic: string, answer: 'yes' | 'dismissed', weightDeltas: Record<string, number>) {
  return logSignal({ source: 'contextual', surface: 'feed', action_label: `Contextual ${answer}: ${topic}`, card_id: cardId, card_title: cardTitle, boosted_attributes: answer === 'yes' ? [topic] : [], decayed_attributes: [], strength: answer === 'yes' ? 'strong' : 'weak', shelf_life: answer === 'yes' ? 'long' : 'session', durable: answer === 'yes', weight_deltas: weightDeltas });
}
