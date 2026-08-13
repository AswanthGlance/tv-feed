import { describe, it, expect } from 'vitest';
import { buildListPasses, deriveListThemes, listNounPhrase, trendSignalFor, MAX_VISIBLE_LIST_ITEMS } from './listPlan';
import { balancedRows } from '../../components/AgentThinkingTrace/level2/ListCanvasThinking';
import { checkDiscoveryInvariants } from './discoveryInvariants';
import { extractQueryRequirements } from '../classification/queryRequirements';
import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { NormalizedEntity } from '../types/entity';
import type { EntityPreviewPayload, ThinkingPass } from '../types/pass';

/* The list-without-winner arc's product guarantees, as assertions. The exact
   failures this iteration fixed are tests now:
     - "Found 10 promising options" + "10 options worth checking" (duplicate)
     - narration says 10, canvas shows 0 or 1
     - "109 promising options" (raw retrieval scale narrated as the finding)
     - forced "N stand out" shortlists on a list  */

const entity = (id: string, title: string, over: Partial<NormalizedEntity> = {}): NormalizedEntity => ({
  id,
  type: 'generic',
  title,
  ...over,
});

const entities = (n: number, over: (i: number) => Partial<NormalizedEntity> = () => ({})) =>
  Array.from({ length: n }, (_, i) => entity(`e${i}`, `Item ${i}`, over(i)));

const build = (items: NormalizedEntity[], over: Partial<Parameters<typeof buildListPasses>[0]> = {}) =>
  buildListPasses({
    events: [],
    entities: items,
    requirements: extractQueryRequirements(over.prompt ?? 'Show me documentaries to watch'),
    prompt: over.prompt ?? 'Show me documentaries to watch',
    sourceEvidence: { sources: [{ label: 'IMDb', kind: 'web' }, { label: 'Letterboxd', kind: 'web' }], sourceCount: 5, searchCount: 2 },
    ...over,
  });

const payloadOf = (pass: ThinkingPass | undefined) => pass?.payload as EntityPreviewPayload | undefined;
const foundPass = (passes: ThinkingPass[]) => passes.find((p) => p.id === 'list-found');
const addedCount = (passes: ThinkingPass[]) =>
  passes
    .flatMap((p) => payloadOf(p)?.canvas ?? [])
    .filter((m) => m.type === 'ADD_ITEMS')
    .flatMap((m) => (m.type === 'ADD_ITEMS' ? m.items : [])).length;

describe('list without winner — narration count === visible item count', () => {
  it.each([[4], [5], [6], [8], [10]])('with %i items, the found sentence and the canvas agree', (n) => {
    const { passes, meta } = build(entities(n));
    const found = foundPass(passes)!;
    expect(found.narration).toContain(String(n));
    expect(payloadOf(found)!.entities).toHaveLength(n);
    expect(addedCount(passes)).toBe(n);
    expect(meta.narrationCount).toBe(n);
    expect(meta.visibleListCount).toBe(n);
  });

  it('never emits the duplicate count payload ("N options worth checking")', () => {
    const { passes } = build(entities(10));
    expect(passes.some((p) => p.valueType === 'count')).toBe(false);
    // And never the ranking word the brief bans for lists.
    for (const pass of passes) expect(pass.narration).not.toMatch(/promising/i);
  });

  it('passes the shared discovery invariants (no claim over an empty canvas)', () => {
    const { passes } = build(entities(10));
    expect(checkDiscoveryInvariants(passes)).toEqual([]);
  });

  it('never shortlists, never promotes, never says "stand out"', () => {
    const { passes } = build(entities(10));
    const mutations = passes.flatMap((p) => payloadOf(p)?.canvas ?? []);
    expect(mutations.every((m) => m.type === 'ADD_ITEMS')).toBe(true);
    for (const pass of passes) expect(pass.narration).not.toMatch(/stand out|worth a closer look/i);
  });

  it('items without images still render — an image is never required', () => {
    const noImages = entities(8); // no image field at all
    const { passes, meta } = build(noImages);
    expect(payloadOf(foundPass(passes)!)!.entities).toHaveLength(8);
    expect(meta.imagesAvailable).toBe(0);
    expect(meta.visibleListCount).toBe(8);
  });

  it('drops nameless entries but keeps everything else', () => {
    const items = [...entities(5), entity('blank', '')];
    const { meta } = build(items);
    expect(meta.visibleListCount).toBe(5);
  });
});

describe('raw result count vs display count (the 109 case)', () => {
  const searchEvent = (id: string, resultCount: number, ents: NormalizedEntity[] = []): SemanticAgentEvent => ({
    id,
    type: 'search',
    sourceSpanIds: [],
    startTime: 0,
    endTime: 1,
    narration: '',
    metadata: { resultCount },
    entities: ents.map((e) => ({ id: e.id, type: 'generic', title: e.title! })),
  });

  it('narrates 109 as retrieval scale, then claims only the visible 10', () => {
    const { passes, meta } = build(entities(10), { events: [searchEvent('s1', 109)] });
    const scale = passes.find((p) => p.id === 'list-scale')!;
    expect(scale.visibility).toBe('status');
    expect(scale.narration).toContain('109');
    expect(scale.narration).not.toMatch(/promising|options worth/i);
    expect(foundPass(passes)!.narration).toContain('10');
    expect(meta.rawResultCount).toBe(109);
    expect(meta.visibleListCount).toBe(10);
  });

  it('skips the scale beat when retrieval was not meaningfully wider than the list', () => {
    const { passes } = build(entities(10), { events: [searchEvent('s1', 12)] });
    expect(passes.find((p) => p.id === 'list-scale')).toBeUndefined();
  });

  it('caps the display set at the TV limit and narrates the capped count', () => {
    const { passes, meta } = build(entities(14));
    expect(meta.resolvedListCount).toBe(14);
    expect(meta.visibleListCount).toBe(MAX_VISIBLE_LIST_ITEMS);
    expect(foundPass(passes)!.narration).toContain(String(MAX_VISIBLE_LIST_ITEMS));
    expect(addedCount(passes)).toBe(MAX_VISIBLE_LIST_ITEMS);
  });
});

describe('backfill from the final response', () => {
  it('marks items as final_response_backfill when discovery parsed nothing', () => {
    const { meta, passes } = build(entities(10), { isFixture: false, events: [] });
    expect(meta.itemSource).toBe('final_response_backfill');
    // Backfilled counts are honest but recovered — confidence reflects that.
    expect(foundPass(passes)!.confidence).toBe('medium');
  });

  it('marks items as discovery when the events themselves carried them', () => {
    const ents = entities(4);
    const events: SemanticAgentEvent[] = [
      {
        id: 's1',
        type: 'search',
        sourceSpanIds: [],
        startTime: 0,
        endTime: 1,
        narration: '',
        entities: ents.map((e) => ({ id: e.id, type: 'generic', title: e.title! })),
      },
    ];
    const { meta } = build(ents, { events });
    expect(meta.itemSource).toBe('discovery');
  });
});

describe('contextual narration', () => {
  it('"What\'s trending in sneakers?" → sneaker trends, not options', () => {
    const prompt = "What's trending in sneakers?";
    const noun = listNounPhrase(prompt, extractQueryRequirements(prompt));
    expect(noun.plural).toBe('sneaker trends');
    const { passes } = build(entities(10), { prompt, requirements: extractQueryRequirements(prompt) });
    const found = foundPass(passes)!;
    expect(found.narration).toContain('sneaker trends');
    expect(found.narration).not.toMatch(/option/i);
  });

  it('"Give me things to do this weekend" keeps the user\'s own phrase', () => {
    const prompt = 'Give me things to do this weekend';
    expect(listNounPhrase(prompt, extractQueryRequirements(prompt)).plural).toBe('things to do this weekend');
  });

  it('"healthy breakfast ideas" → breakfast ideas', () => {
    const prompt = 'Give me healthy breakfast ideas';
    expect(listNounPhrase(prompt, extractQueryRequirements(prompt)).plural).toBe('breakfast ideas');
  });

  it('falls back to the head noun, then to options — never a wrong guess', () => {
    const docs = 'Show me documentaries to watch';
    expect(listNounPhrase(docs, extractQueryRequirements(docs)).plural).toMatch(/documentar/);
    expect(listNounPhrase('random words', extractQueryRequirements('random words')).plural).toBe('options');
  });
});

describe('themes / clustering', () => {
  const themed = entities(10, (i) => ({ attributes: { category: ['Retro', 'Performance', 'Minimal'][i % 3] } }));

  it('emits a theme beat only when the items genuinely carry theme data', () => {
    const withThemes = build(themed);
    const themePass = withThemes.passes.find((p) => p.id === 'list-themes')!;
    expect(themePass).toBeDefined();
    const groups = payloadOf(themePass)!.groups!;
    expect(groups).toHaveLength(3);
    // Same identities, regrouped — nothing added, nothing dropped.
    expect(groups.flatMap((g) => g.ids).sort()).toEqual(themed.map((e) => e.id).sort());

    const without = build(entities(10));
    expect(without.passes.find((p) => p.id === 'list-themes')).toBeUndefined();
  });

  it('refuses partial or trivial groupings', () => {
    // Only some items themed → no grouping.
    expect(deriveListThemes(entities(6, (i) => (i < 3 ? { attributes: { category: 'Retro' } } : {})))).toEqual([]);
    // A single group → no grouping.
    expect(deriveListThemes(entities(6, () => ({ attributes: { category: 'Retro' } })))).toEqual([]);
    // A group of one → no grouping.
    expect(
      deriveListThemes(entities(3, (i) => ({ attributes: { category: i === 0 ? 'A' : 'B' } })))
    ).toEqual([]);
  });
});

describe('trend signals', () => {
  it('surfaces a signal only when the data carries one', () => {
    expect(trendSignalFor(entity('a', 'Retro runners', { judgment: 'Trending' }))).toBe('Trending');
    expect(trendSignalFor(entity('b', 'Silver metallics', { judgment: 'Rising fast this season' }))).toBe('Rising');
    expect(trendSignalFor(entity('c', 'Plain item'))).toBeUndefined();
  });
});

describe('balanced grid', () => {
  it('splits exactly as the brief specifies', () => {
    expect(balancedRows(10)).toEqual([5, 5]);
    expect(balancedRows(8)).toEqual([4, 4]);
    expect(balancedRows(6)).toEqual([3, 3]);
    expect(balancedRows(5)).toEqual([3, 2]);
    expect(balancedRows(4)).toEqual([4]);
    expect(balancedRows(9)).toEqual([5, 4]);
  });
});
