import type { ThinkingEvidence, ThinkingScenario } from '../types/thinking';
import { RESULT_TEMPLATE_CHROME, type ResultTemplateId } from './resultTemplate';

export interface ResolvedResultContent {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description: string;
  heroImage?: string;
  heroPlaceId?: string;
  ctaLabel: string;
  supporting: { title: string; subtitle?: string; image?: string; placeId?: string }[];
  /** Follow-up prompt pills for the bottom row — chrome text, not a claim
   *  about this trace's actual evidence (see RESULT_TEMPLATE_CHROME). */
  followUps: string[];
}

const FALLBACK_HERO_IMAGE = '/images/feed/feed_29-travel-goa-coastal-road.jpg';

function evidenceSubtitle(ev: ThinkingEvidence): string | undefined {
  if (ev.rating != null || ev.reviewCount != null) {
    const rating = ev.rating != null ? `${ev.rating.toFixed(1)}★` : '';
    const reviews = ev.reviewCount != null ? ` (${ev.reviewCount.toLocaleString()} reviews)` : '';
    return `${rating}${reviews}`.trim() || undefined;
  }
  return ev.subtitle ?? ev.travelTime ?? undefined;
}

/** Renders the result page from the trace's actual final-response evidence
 *  (the same place_card/card_template/plain-text content the real agent
 *  harness produced) — never authored placeholder content. Returns
 *  `undefined` when the trace genuinely has no usable evidence, so the
 *  caller can show an honest empty state instead of inventing a result. */
export function deriveResultContent(
  scenario: ThinkingScenario | undefined,
  template: ResultTemplateId
): ResolvedResultContent | undefined {
  const chrome = RESULT_TEMPLATE_CHROME[template];
  // Prefer the final "generating" step's own evidence (the agent's curated
  // place_card/card_template/plain-text answer) over a flatMap of every
  // step — otherwise an earlier search/tool step's raw candidate evidence
  // could outrank the real curated answer as the result page's hero card.
  const finalStep = [...(scenario?.steps ?? [])].reverse().find((s) => s.type === 'generating');
  const evidence = finalStep?.evidence.length ? finalStep.evidence : (scenario?.steps.flatMap((s) => s.evidence) ?? []);

  const titled = evidence.filter((e) => e.title);
  if (titled.length > 0) {
    const hero = titled[0];
    // Up to 4 supporting cards — enough for the rail to actually read as a
    // carousel rather than "hero + one or two afterthoughts."
    const rest = titled.slice(1, 5);
    return {
      eyebrow: chrome.eyebrow,
      title: hero.title!,
      subtitle: evidenceSubtitle(hero),
      description: hero.description ?? '',
      heroImage: hero.image ?? FALLBACK_HERO_IMAGE,
      heroPlaceId: hero.placeId,
      ctaLabel: chrome.ctaLabel,
      supporting: rest.map((ev) => ({
        title: ev.title!,
        subtitle: evidenceSubtitle(ev),
        image: ev.image,
        placeId: ev.placeId,
      })),
      followUps: chrome.followUps,
    };
  }

  // No titled (place/card) evidence — fall through to a plain-text final
  // response if that's what the trace actually produced (still 100% real
  // content, just untitled prose rather than structured cards).
  const textEvidence = evidence.find((e) => e.description);
  if (textEvidence?.description) {
    return {
      eyebrow: chrome.eyebrow,
      title: scenario?.request ?? 'Here’s what I found',
      description: textEvidence.description,
      ctaLabel: chrome.ctaLabel,
      supporting: [],
      followUps: chrome.followUps,
    };
  }

  return undefined;
}
