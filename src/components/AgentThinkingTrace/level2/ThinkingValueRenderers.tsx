import type {
  AvailabilityPayload,
  ClusterPayload,
  ComparisonSignalPayload,
  CountPayload,
  EntityPreviewPayload,
  GenericPayload,
  IntentPayload,
  MemorySignalsPayload,
  RoutePayload,
  SourcesPayload,
  SynthesisStructurePayload,
  TextPayload,
  TimelinePayload,
} from '../../../level2/types/pass';
import type { ThinkingRendererProps } from '../../../level2/types/renderer';
import SourceIcon from './SourceIcon';
import ThinkingEntityTile, { tileFact } from './ThinkingEntityTile';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Thinking value renderers.

   Visual layer for the thinking evidence language (the original engineering
   baseline, now art-directed — see level2Scenario.css for the design notes).
   Data handling is unchanged: each renders its typed payload completely and
   invents nothing.

   Two rules every renderer here follows, because they are product rules, not
   style rules:

     1. THINKING IS LIGHTER THAN THE FINAL RESPONSE. These show a partial,
        in-flight view — a count, a signal, a few entities. None of them
        renders the finished answer early.
     2. NO IMAGE IS ASSUMED. Nothing reserves space for an image; entities
        render as text-first, and an image is used only if one exists.

   `--i` on repeated children drives the shared .att-l2v-stagger line-reveal
   (progressive disclosure within one pass — presentation only).
   ───────────────────────────────────────────────────────────────────────────── */

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

/** A count is CONTEXT, not the answer — one quiet line ("8 sources checked ·
 *  across 5 searches"), never a giant numeral. */
export function CountValue({ payload }: ThinkingRendererProps<CountPayload>) {
  return (
    <div className="att-l2v-count">
      <div className="att-l2v-count-line att-l2v-stagger" style={stagger(0)}>
        <span className="att-l2v-count-value">{payload.value}</span> {payload.label}
      </div>
      {payload.qualifier && (
        <div className="att-l2v-count-qualifier att-l2v-stagger" style={stagger(1)}>{payload.qualifier}</div>
      )}
    </div>
  );
}

export function TextValue({ payload }: ThinkingRendererProps<TextPayload>) {
  return (
    <ul className="att-l2v-text">
      {payload.lines.map((line, i) => (
        <li key={i} className="att-l2v-text-line att-l2v-stagger" style={stagger(i)}>
          {line}
        </li>
      ))}
    </ul>
  );
}

/** The acknowledgement beat — "I understood what you're asking," never a
 *  repeat of the prompt. See userValue/intentChips.ts for where the chips
 *  come from. Small, centered, easy to scan — never a card row. */
export function IntentSummaryValue({ payload }: ThinkingRendererProps<IntentPayload>) {
  if (!payload.chips.length) return null;
  return (
    <div className="att-l2v-intent">
      {payload.chips.map((chip, i) => (
        <span key={chip} className="att-l2v-intent-chip att-l2v-stagger" style={stagger(i)}>
          {chip}
        </span>
      ))}
    </div>
  );
}

/** The SYNTHESIS beat's visual (see harnessStream/synthesisBeat.ts) — real
 *  section/dimension labels, revealed one at a time while the model is
 *  genuinely composing the answer. Paced to the pass's own HOLD window
 *  (real or demo — schedule.ts already resolved which), never a fixed
 *  ~130ms stagger that would dump every label in the first second of a
 *  15-second real hold. Labels only, by contract of the payload itself —
 *  this component never has access to the answer's actual content. */
export function SynthesisStructureValue({ payload, pass, runtime }: ThinkingRendererProps<SynthesisStructurePayload>) {
  if (!payload.sections.length) return null;

  const scheduled = runtime.schedule.find((s) => s.pass.id === pass.id);
  const holdMs = scheduled ? Math.max(0, scheduled.holdEnd - scheduled.enterEnd) : 0;
  // Spread reveals across the real hold, leaving headroom at the end so the
  // last label isn't still arriving as the pass exits. Clamped to a range
  // that reads as deliberate pacing on TV, never a flicker and never a
  // multi-second dead pause between labels.
  const perItemMs = holdMs > 0 ? Math.min(1800, Math.max(260, (holdMs * 0.75) / payload.sections.length)) : 220;

  return (
    <div className="att-l2v-synthesis">
      {payload.sections.map((section, i) => (
        <span
          key={section}
          className="att-l2v-synthesis-chip att-l2v-stagger"
          style={{ '--i': i, animationDelay: `${i * perItemMs + 120}ms` } as React.CSSProperties}
        >
          {section}
        </span>
      ))}
    </div>
  );
}

/** Generic entity preview — the shared ThinkingEntityTile, at most title +
 *  one key fact each. The candidate-ranking archetype overrides this with its
 *  continuous evolving canvas (see the registry), which renders the SAME
 *  tile; the evidence language never forks. */
export function EntityPreviewValue({ payload }: ThinkingRendererProps<EntityPreviewPayload>) {
  const emphasis = new Set(payload.emphasisIds ?? []);
  return (
    <div className="att-l2v-entities">
      {payload.entities.slice(0, 6).map((entity, i) => (
        <ThinkingEntityTile
          key={entity.id}
          index={i}
          state={emphasis.has(entity.id) ? 'strong' : 'neutral'}
          tile={{
            id: entity.id,
            title: entity.title ?? 'Untitled',
            image: entity.image,
            fact: tileFact(entity),
          }}
        />
      ))}
    </div>
  );
}

export function ComparisonSignalValue({ payload }: ThinkingRendererProps<ComparisonSignalPayload>) {
  return (
    <div className="att-l2v-compare">
      <div className="att-l2v-compare-row att-l2v-compare-row--head">
        <div className="att-l2v-compare-dim" />
        {payload.subjects.map((s) => (
          <div key={s.id} className="att-l2v-compare-cell">
            {s.label}
          </div>
        ))}
      </div>
      {payload.dimensions.map((dim, i) => {
        // When a dimension resolves to the SAME text for every subject
        // (typically a `__all` row-level answer), render it once across the
        // row — five identical copies read as a rendering bug, not data.
        const cells = payload.subjects.map((s) => dim.values[s.id] ?? dim.values.__all ?? '—');
        const uniform = cells.every((c) => c === cells[0]);
        return (
          <div key={dim.key} className="att-l2v-compare-row att-l2v-stagger" style={stagger(i)}>
            <div className="att-l2v-compare-dim">{dim.label}</div>
            {uniform ? (
              <div className="att-l2v-compare-cell att-l2v-compare-cell--span">{cells[0]}</div>
            ) : (
              payload.subjects.map((s, j) => (
                <div
                  key={s.id}
                  className={`att-l2v-compare-cell${dim.leaderId === s.id ? ' att-l2v-compare-cell--leader' : ''}`}
                >
                  {cells[j]}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Renders a route with NO map imagery — by contract. Real traces carry no
 *  map tiles and no coordinates, only text (origin, destination, ETA,
 *  distance, savings), so the renderer expresses the route as a sequence. */
export function RouteValue({ payload }: ThinkingRendererProps<RoutePayload>) {
  return (
    <div className="att-l2v-route">
      <div className="att-l2v-route-headline">
        {payload.savings ? (
          <span className="att-l2v-route-savings">{payload.savings}</span>
        ) : (
          <span>{[payload.eta, payload.distance].filter(Boolean).join(' · ') || 'Route'}</span>
        )}
      </div>
      {(payload.origin || payload.destination) && (
        <div className="att-l2v-route-ends">
          {payload.origin ?? 'Here'} <span className="att-l2v-route-arrow">→</span> {payload.destination ?? 'there'}
        </div>
      )}
      {!!payload.stops.length && (
        <ol className="att-l2v-route-stops">
          {payload.stops.map((stop, i) => (
            <li key={stop.id} className="att-l2v-route-stop att-l2v-stagger" style={stagger(i)}>
              <span className="att-l2v-route-stop-label">{stop.label}</span>
              {stop.eta && <span className="att-l2v-route-stop-eta">{stop.eta}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AvailabilityValue({ payload }: ThinkingRendererProps<AvailabilityPayload>) {
  return (
    <div className="att-l2v-avail">
      {payload.summary && <div className="att-l2v-avail-summary">{payload.summary}</div>}
      <div className="att-l2v-avail-slots">
        {payload.slots.map((slot, i) => (
          <div key={i} className={`att-l2v-slot att-l2v-stagger att-l2v-slot--${slot.state}`} style={stagger(i)}>
            <span className="att-l2v-slot-label">{slot.label}</span>
            {slot.detail && <span className="att-l2v-slot-detail">{slot.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineValue({ payload }: ThinkingRendererProps<TimelinePayload>) {
  return (
    <ol className="att-l2v-timeline">
      {payload.items.map((item, i) => (
        <li key={i} className="att-l2v-timeline-item att-l2v-stagger" style={stagger(i)}>
          {item.time && <span className="att-l2v-timeline-time">{item.time}</span>}
          <span className="att-l2v-timeline-label">{item.label}</span>
          {item.detail && <span className="att-l2v-timeline-detail">{item.detail}</span>}
        </li>
      ))}
    </ol>
  );
}

export function ClusterValue({ payload }: ThinkingRendererProps<ClusterPayload>) {
  return (
    <div className="att-l2v-clusters">
      {payload.clusters.map((cluster, i) => (
        <div key={i} className="att-l2v-cluster att-l2v-stagger" style={stagger(i)}>
          <span className="att-l2v-cluster-count">{cluster.count}</span>
          <span className="att-l2v-cluster-label">{cluster.label}</span>
        </div>
      ))}
    </div>
  );
}

export { ThinkingEntityTile };

export function GenericValue({ payload }: ThinkingRendererProps<GenericPayload>) {
  return (
    <div className="att-l2v-generic">
      <div className="att-l2v-generic-label">{payload.label}</div>
      {payload.detail && <div className="att-l2v-generic-detail">{payload.detail}</div>}
    </div>
  );
}

/** Recalled personal context — small pill chips, never a result card. This is
 *  RECALL, not a finding: no icons that imply a source was consulted this
 *  turn (contrast SourcesValue), just the phrase itself. Already filtered to
 *  1-3 relevant signals by the time it reaches here (see
 *  phoenix/memoryRetrieval.ts) — this renders exactly what it is given and
 *  invents no additional chips. */
export function MemorySignalsValue({ payload }: ThinkingRendererProps<MemorySignalsPayload>) {
  return (
    <div className="att-l2v-memory">
      {payload.signals.map((signal, i) => (
        <span key={`${signal.type}-${i}`} className="att-l2v-memory-chip att-l2v-stagger" style={stagger(i)}>
          {signal.label}
        </span>
      ))}
    </div>
  );
}

/** Evidence for "reading up on this from a few angles".
 *
 *  Deliberately SECONDARY to the narration: small chips, no giant statistic.
 *  The message is "the agent is checking multiple perspectives", not "here are
 *  websites you should read", so these are never full cards and never raw URLs
 *  (see level2/phoenix/sources.ts, which resolves readable identity).
 *
 *  Counts stay credible: when more distinct sources exist than fit, the
 *  overflow is stated as "+N" rather than letting the visible chips imply they
 *  are all of them. */
export function SourcesValue({ payload }: ThinkingRendererProps<SourcesPayload>) {
  const VISIBLE = 5;
  const shown = payload.sources.slice(0, VISIBLE);
  const overflow = Math.max(0, payload.sourceCount - shown.length);

  return (
    <div className="att-l2v-sources">
      <div className="att-l2v-source-strip">
        {shown.map((source, i) => (
          <span
            // Stable identity (real domain, or the label when a source has
            // none — maps-kind sources) — not the array index. Sources
            // accumulate across cumulative research sub-beats (see
            // subBeats.ts); an index key would remount every existing chip
            // each time a new one is appended, instead of just mounting the
            // new one.
            key={source.domain ?? source.label}
            className={`att-l2v-source att-l2v-source--${source.kind} att-l2v-stagger`}
            style={stagger(i)}
          >
            <SourceIcon domain={source.domain} kind={source.kind} />
            <span className="att-l2v-source-label">{source.label}</span>
          </span>
        ))}
        {/* The overflow marker is what keeps the count honest: four icons must
            never imply four sources when six were consulted. */}
        {overflow > 0 && (
          <span className="att-l2v-source att-l2v-source--more att-l2v-stagger" style={stagger(shown.length)}>
            +{overflow}
          </span>
        )}
      </div>
      <div className="att-l2v-source-count att-l2v-stagger" style={stagger(shown.length + 1)}>
        {payload.sourceCount} {payload.sourceCount === 1 ? 'source' : 'sources'}
        {payload.searchCount > 0 && ` · ${payload.searchCount} ${payload.searchCount === 1 ? 'search' : 'searches'}`}
      </div>
    </div>
  );
}
