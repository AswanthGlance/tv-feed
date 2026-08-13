import type {
  FinalComparisonResponse,
  FinalEntityRailResponse,
  FinalHybridResponse,
  FinalListResponse,
  FinalResponseModel,
  FinalRouteResponse,
  FinalStructuredResponse,
  FinalSummaryResponse,
  FinalTextResponse,
} from '../types/finalResponse';
import type { NonEntityBlock, NormalizedEntity } from '../types/entity';
import type {
  L1CardItem,
  L1CardsData,
  L1CardsTabsData,
  L1TextBlock,
  L1TextCarouselBlock,
  L1TextCarouselData,
  L1TextOnlyData,
} from '../../components/L1/L1Scenarios';
import type { TravelItem } from '../../components/L1/TravelL1';
import { pickLocalFallbackImage } from '../../adapters/localImageFallback';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Final response -> existing L1 template.

   The final response in Level 2 is NOT a Level 2-specific design. It is one
   of the four production-like response families that already exist on
   /l1-scenarios:

     cards           the /food-l1 expand-in-place card rail
     cards-tabs      the /travel-l1 tabbed card rail
     text-only       the long-form reading surface
     text-carousel   the reading surface with an inline card rail

   This module is the ONLY place that decides which family a
   FinalResponseModel lands in and converts the model into that family's data
   contract. The L1 components themselves are reused as-is (see
   src/components/L1/L1Scenarios.tsx) — no duplicate styling, no Level 2
   variant of a final card.

   Family choice depends on the PAYLOAD SHAPE, not just the archetype:
   a `list` with one usable entity reads better as text; a `comparison` only
   earns the tabbed rail when its subjects actually carry imagery.
   ───────────────────────────────────────────────────────────────────────────── */

export type L1Family = 'cards' | 'cards-tabs' | 'text-only' | 'text-carousel';

export type AdaptedL1Response =
  | { family: 'cards'; data: L1CardsData }
  | { family: 'cards-tabs'; data: L1CardsTabsData }
  | { family: 'text-only'; data: L1TextOnlyData }
  | { family: 'text-carousel'; data: L1TextCarouselData };

/* ── entity -> card ─────────────────────────────────────────────────────── */

function mapsUrlFor(entity: NormalizedEntity): string {
  const ctaUrl = entity.attributes?.ctaUrl;
  if (typeof ctaUrl === 'string' && /^https?:/i.test(ctaUrl)) return ctaUrl;
  const query = [entity.title, entity.location ?? entity.subtitle].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'nearby')}`;
}

/** One key supporting line for the expanded card. The agent's own words when
 *  it wrote any; factual bullets otherwise; never fabricated. */
function noteFor(entity: NormalizedEntity): string {
  if (entity.reasoning) return entity.reasoning;
  if (entity.evidence?.length) return entity.evidence.slice(0, 2).join(' · ');
  return entity.subtitle ?? '';
}

function entityToCard(entity: NormalizedEntity): L1CardItem {
  const title = entity.title ?? 'Untitled';
  return {
    id: entity.id,
    name: title,
    area: entity.location ?? entity.subtitle ?? '',
    rating: entity.rating,
    ratingCount: entity.reviewCount != null ? String(entity.reviewCount) : undefined,
    price: entity.price,
    agentLabel: entity.judgment ?? entity.subtitle ?? entity.location ?? '',
    agentNote: noteFor(entity),
    mapsUrl: mapsUrlFor(entity),
    // The card template is image-led; a real image is used when the trace
    // carried one, a keyword-matched local stock image otherwise (same
    // fallback contract the Level 2 candidate cards already used).
    photo: entity.image ?? pickLocalFallbackImage(title, entity.id),
  };
}

function entityToTravelItem(entity: NormalizedEntity, note?: string): TravelItem {
  const card = entityToCard(entity);
  return {
    ...card,
    agentNote: note ?? card.agentNote,
    ctaLabel: 'View on Maps',
    ctaModalTitle: 'Scan to Open Maps',
    ctaModalSubtitle: 'You will be redirected to the location page',
  };
}

/* ── model fragments -> text blocks ─────────────────────────────────────── */

function supportingToBlocks(supporting?: NonEntityBlock[]): L1TextBlock[] {
  if (!supporting?.length) return [];
  const out: L1TextBlock[] = [];
  for (const block of supporting) {
    if (block.title) out.push({ kind: 'sub', text: block.title });
    for (const line of block.lines) out.push({ kind: 'bullet', text: line });
  }
  return out;
}

function textBlocks(response: FinalTextResponse): L1TextBlock[] {
  return [
    ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
    ...response.body.map((p): L1TextBlock => ({ kind: 'p', text: p })),
    ...supportingToBlocks(response.supporting),
  ];
}

function summaryBlocks(response: FinalSummaryResponse): L1TextBlock[] {
  const themes = (response.themes ?? []).map(
    (t): L1TextBlock => ({ kind: 'bullet', text: t.detail ? `${t.label} — ${t.detail}` : t.label })
  );
  return [
    ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
    ...response.takeaways.map((t): L1TextBlock => ({ kind: 'bullet', text: t })),
    ...themes,
    ...supportingToBlocks(response.supporting),
  ];
}

function structuredBlocks(response: FinalStructuredResponse): L1TextBlock[] {
  const rows = response.rows.map((row): L1TextBlock => {
    const [first, ...rest] = row.map((cell) => String(cell ?? '').trim());
    const tail = rest.filter(Boolean).join(' · ');
    return { kind: 'bullet', text: tail ? `${first}: ${tail}` : first };
  });
  const slots = (response.availability?.slots ?? []).map(
    (s): L1TextBlock => ({ kind: 'bullet', text: s.detail ? `${s.label} — ${s.detail}` : s.label })
  );
  return [
    ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
    ...rows,
    ...slots,
    ...supportingToBlocks(response.supporting),
  ];
}

function routeBlocks(response: FinalRouteResponse): L1TextBlock[] {
  const { route } = response;
  const summaryLine = [route.distance, route.eta, route.savings].filter(Boolean).join(' · ');
  const stops = route.stops.map((stop): L1TextBlock => {
    const detail = [stop.eta, stop.detail].filter(Boolean).join(' — ');
    return { kind: 'bullet', text: detail ? `${stop.label} (${detail})` : stop.label };
  });
  const alternates = (route.alternates ?? []).map((alt): L1TextBlock => {
    const detail = [alt.eta, alt.distance, alt.note].filter(Boolean).join(' · ');
    return { kind: 'bullet', text: detail ? `${alt.label} — ${detail}` : alt.label };
  });
  return [
    ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
    ...(summaryLine ? [{ kind: 'p', text: summaryLine } as L1TextBlock] : []),
    ...stops,
    ...alternates,
    ...(response.notes ?? []).map((n): L1TextBlock => ({ kind: 'p', text: n })),
    ...supportingToBlocks(response.supporting),
  ];
}

function comparisonBlocks(response: FinalComparisonResponse): L1TextBlock[] {
  const { subjects, dimensions } = response.comparison;
  const rows = dimensions.map((dim): L1TextBlock => {
    const cells = subjects.map((s) => {
      const value = dim.values[s.id] ?? dim.values.__all;
      return value ? `${s.label} — ${value}` : undefined;
    });
    const uniform = dim.values.__all && !subjects.some((s) => dim.values[s.id]);
    const text = uniform ? String(dim.values.__all) : cells.filter(Boolean).join(' · ');
    return { kind: 'bullet', text: text ? `${dim.label}: ${text}` : dim.label };
  });
  return [
    ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
    ...rows,
    ...(response.verdict ? [{ kind: 'p', text: response.verdict } as L1TextBlock] : []),
    ...supportingToBlocks(response.supporting),
  ];
}

/** Any final response reduced to reading-surface blocks — the closest
 *  compatible existing shell for models with no strong visual form. */
function blocksFor(response: FinalResponseModel): L1TextBlock[] {
  switch (response.kind) {
    case 'text':
      return textBlocks(response);
    case 'summary':
      return summaryBlocks(response);
    case 'structured':
      return structuredBlocks(response);
    case 'route':
      return routeBlocks(response);
    case 'comparison':
      return comparisonBlocks(response);
    case 'entity':
      return [
        ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
        ...response.facts.map((f): L1TextBlock => ({ kind: 'bullet', text: `${f.label}: ${f.value}` })),
        ...supportingToBlocks(response.supporting),
      ];
    case 'list':
      return [
        ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
        ...response.items.map((e): L1TextBlock => {
          const meta = [e.rating != null ? `${e.rating}★` : undefined, e.price].filter(Boolean).join(' · ');
          return { kind: 'bullet', text: meta ? `${e.title ?? e.id} — ${meta}` : (e.title ?? e.id) };
        }),
        ...supportingToBlocks(response.supporting),
      ];
    case 'entity_rail':
      return [
        ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
        ...(response.winnerRationale ? [{ kind: 'p', text: response.winnerRationale } as L1TextBlock] : []),
        ...supportingToBlocks(response.supporting),
      ];
    case 'hybrid':
      return [
        ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextBlock] : []),
        ...response.sections.flatMap((section) => [
          ...(section.title ? [{ kind: 'sub', text: section.title } as L1TextBlock] : []),
          ...blocksFor(section.response),
        ]),
        ...supportingToBlocks(response.supporting),
      ];
  }
}

/* ── family resolution — payload shape first, archetype only implicitly ─── */

function railEntities(response: FinalEntityRailResponse): NormalizedEntity[] {
  if (!response.winnerId) return response.entities;
  const winner = response.entities.find((e) => e.id === response.winnerId);
  return winner ? [winner, ...response.entities.filter((e) => e.id !== winner.id)] : response.entities;
}

function hybridRailSection(response: FinalHybridResponse): FinalEntityRailResponse | FinalListResponse | undefined {
  for (const section of response.sections) {
    if (section.response.kind === 'entity_rail' && section.response.entities.length) return section.response;
    if (section.response.kind === 'list' && section.response.items.length) return section.response;
  }
  return undefined;
}

export function resolveL1Family(response: FinalResponseModel): L1Family {
  switch (response.kind) {
    case 'entity_rail':
      return response.entities.length ? 'cards' : 'text-only';
    case 'entity':
      return 'cards';
    case 'list':
      return response.items.length >= 2 ? 'cards' : 'text-only';
    case 'comparison': {
      // The tabbed rail is image-led; only comparisons whose subjects carry
      // real entities WITH imagery earn it. Everything else reads as text.
      const entities = response.entities ?? [];
      const usable = entities.filter((e) => e.title);
      return usable.length >= 2 && usable.every((e) => !!e.image) ? 'cards-tabs' : 'text-only';
    }
    case 'hybrid': {
      const rails = response.sections.filter(
        (s) =>
          (s.response.kind === 'entity_rail' && s.response.entities.length) ||
          (s.response.kind === 'list' && s.response.items.length >= 2)
      );
      if (rails.length >= 2) return 'cards-tabs';
      if (rails.length === 1) {
        const hasProse = response.sections.some((s) => s.response.kind !== 'entity_rail' && s.response.kind !== 'list');
        return hasProse ? 'text-carousel' : 'cards';
      }
      return 'text-only';
    }
    case 'text':
    case 'summary':
    case 'structured':
    case 'route':
      return 'text-only';
  }
}

/* ── the adapter ────────────────────────────────────────────────────────── */

export function adaptFinalResponseToL1(response: FinalResponseModel): AdaptedL1Response {
  const family = resolveL1Family(response);
  const prompts = response.followUps ?? [];
  const agentLine = response.headline;

  switch (family) {
    case 'cards': {
      let entities: NormalizedEntity[] = [];
      if (response.kind === 'entity_rail') entities = railEntities(response);
      else if (response.kind === 'list') entities = response.items;
      else if (response.kind === 'entity') entities = [response.entity];
      else if (response.kind === 'hybrid') {
        const rail = hybridRailSection(response);
        entities = rail ? (rail.kind === 'entity_rail' ? railEntities(rail) : rail.items) : [];
      }
      return { family, data: { agentLine, places: entities.map(entityToCard), prompts } };
    }

    case 'cards-tabs': {
      if (response.kind === 'comparison') {
        const entities = response.entities ?? [];
        const tabs = entities.map((e) => ({ id: e.id, label: e.title ?? e.id }));
        const tabItems = Object.fromEntries(
          entities.map((e) => {
            const note = response.comparison.dimensions
              .map((dim) => (dim.values[e.id] ? `${dim.label}: ${dim.values[e.id]}` : undefined))
              .filter(Boolean)
              .slice(0, 3)
              .join(' · ');
            return [e.id, [entityToTravelItem(e, note || undefined)]];
          })
        );
        return { family, data: { agentLine, tabs, tabItems, prompts } };
      }
      // hybrid with 2+ rail sections
      const sections =
        response.kind === 'hybrid'
          ? response.sections.filter(
              (s) =>
                (s.response.kind === 'entity_rail' && s.response.entities.length) ||
                (s.response.kind === 'list' && s.response.items.length)
            )
          : [];
      const tabs = sections.map((s, i) => ({ id: `section-${i}`, label: s.title ?? `Set ${i + 1}` }));
      const tabItems = Object.fromEntries(
        sections.map((s, i) => {
          const entities =
            s.response.kind === 'entity_rail'
              ? railEntities(s.response)
              : s.response.kind === 'list'
                ? s.response.items
                : [];
          return [`section-${i}`, entities.map((e) => entityToTravelItem(e))];
        })
      );
      return { family, data: { agentLine, tabs, tabItems, prompts } };
    }

    case 'text-carousel': {
      // hybrid with one rail section plus prose: the prose composes as the
      // reading surface, the rail rides inline exactly like /l1-scenarios'
      // Text + Carousel.
      if (response.kind !== 'hybrid') {
        return { family: 'text-only', data: { heading: agentLine, blocks: blocksFor(response), prompts } };
      }
      const rail = hybridRailSection(response);
      const entities = rail ? (rail.kind === 'entity_rail' ? railEntities(rail) : rail.items) : [];
      const blocks: L1TextCarouselBlock[] = [
        ...(response.summary ? [{ kind: 'p', text: response.summary } as L1TextCarouselBlock] : []),
      ];
      for (const section of response.sections) {
        if (section.response === rail) {
          blocks.push({ kind: 'carousel' });
          continue;
        }
        if (section.title) blocks.push({ kind: 'sub', text: section.title });
        blocks.push(...blocksFor(section.response));
      }
      blocks.push(...supportingToBlocks(response.supporting));
      if (!blocks.some((b) => b.kind === 'carousel')) blocks.push({ kind: 'carousel' });
      return {
        family,
        data: { heading: agentLine, blocks, places: entities.map(entityToCard), prompts },
      };
    }

    case 'text-only':
      return { family, data: { heading: agentLine, blocks: blocksFor(response), prompts } };
  }
}
