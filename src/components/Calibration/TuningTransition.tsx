import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { GlanceProfileDraft } from '../../logic/profileDraft';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';

/* ─────────────────────────────────────────────────────────────────────────────
   TuningTransition — "Building your feed" redesign

   Agentic assembly experience. Not a loading screen.

   GSAP sequence:
   1. Background settles (already on mount)
   2. Headline word-stagger reveal
   3. Mascot springs in
   4. Agent narration reveals (CinematicText)
   5. Checklist items appear one-by-one with check animation + glow
   6. Brief pause → everything fades → onDone()

   Personalization:
   - Headline uses time-of-day context
   - Narration references location
   - Checklist items driven by profileDraft categories + discovery appetite
   ───────────────────────────────────────────────────────────────────────────── */

type Props = { profileDraft: GlanceProfileDraft; onDone: () => void };

/* Category → checklist copy */
const CAT_COPY: Record<string, string> = {
  food:       'Finding local food discoveries',
  Food:       'Finding local food discoveries',
  fashion:    'Curating style picks for tonight',
  Fashion:    'Curating style picks for tonight',
  travel:     'Matching weekend escape ideas',
  Travel:     'Matching weekend escape ideas',
  wellness:   'Surfacing calm routines and mindful picks',
  Wellness:   'Surfacing calm routines and mindful picks',
  home:       'Pulling home and living inspiration',
  Home:       'Pulling home and living inspiration',
  sport:      'Bringing in sports and game highlights',
  Sport:      'Bringing in sports and game highlights',
  sports:     'Bringing in sports and game highlights',
  culture:    'Adding local culture and discovery',
  Culture:    'Adding local culture and discovery',
  Tech:       'Queuing up tech and gadget stories',
  tech:       'Queuing up tech and gadget stories',
};

const DISCOVERY_COPY: Record<string, string> = {
  familiar:    'Keeping things close to what you know',
  medium:      'Mixing familiar favourites with nearby finds',
  medium_high: 'Adding fresh perspectives alongside the familiar',
  high:        'Going bold — expect the unexpected',
};

export default function TuningTransition({ profileDraft, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  /* ── Derive personalised content from draft ── */
  const location = profileDraft.demographics.location.value || 'your city';
  const cats = profileDraft.category_interests.primary_category_interests
    .map(c => c.category)
    .slice(0, 2);
  const discovery = profileDraft.discovery_appetite;

  /* Headline — time-of-day agnostic for prototype; feels editorial */
  const headline = 'Made for your evening.';

  /* Narration */
  const narration = `Reading your taste, pulling ${location} lifestyle picks, and finding what fits tonight.`;

  /* Build checklist: always start with location signal, then categories, then discovery, then final */
  const checklistItems: string[] = [
    `Reading your evening signals`,
    `Pulling ${location} lifestyle picks`,
    ...cats.map(c => CAT_COPY[c] || `Matching ${c.toLowerCase()} picks`),
    discovery ? DISCOVERY_COPY[discovery] : 'Calibrating your discovery range',
    'Building your first Glance',
  ].slice(0, 5); // max 5 items

  /* Refs */
  const containerRef    = useRef<HTMLDivElement>(null);
  const headlineRef     = useRef<HTMLDivElement>(null);
  const mascotRef       = useRef<HTMLDivElement>(null);
  const narrationRef    = useRef<HTMLDivElement>(null);
  const checklistRef    = useRef<HTMLDivElement>(null);
  const checkEls        = useRef<(HTMLDivElement | null)[]>([]);
  const checkIconEls    = useRef<(HTMLSpanElement | null)[]>([]);
  const flashRef        = useRef<HTMLDivElement>(null);

  /* Narration typing state */
  const [narrationPlaying, setNarrationPlaying] = useState(false);
  const [narrationDone, setNarrationDone]       = useState(false);

  /* ── Entrance: headline + mascot, then trigger narration ── */
  useEffect(() => {
    const tl = gsap.timeline();

    /* 1. Headline word stagger */
    tl.call(() => {
      const words = headlineRef.current?.querySelectorAll<HTMLSpanElement>('.bt-wrd');
      if (!words) return;
      gsap.fromTo(words,
        { opacity: 0, y: 32, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, stagger: 0.10, ease: 'power3.out' }
      );
    }, [], 0.2)

    /* 2. Mascot springs in */
    .fromTo(mascotRef.current,
      { opacity: 0, scale: 0.55, filter: 'blur(12px)', y: 12 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.75, ease: 'back.out(1.5)' },
      '+=0.6'
    )

    /* 3. Narration area fades in, then starts typing */
    .fromTo(narrationRef.current,
      { opacity: 0, y: 10, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out',
        onComplete: () => setNarrationPlaying(true),
      },
      '+=0.2'
    );

    return () => { tl.kill(); };
  }, []);

  /* ── After narration finishes → animate checklist ── */
  useEffect(() => {
    if (!narrationDone) return;

    // Show checklist container
    gsap.set(checklistRef.current, { opacity: 1 });

    const tl = gsap.timeline();

    checkEls.current.forEach((el, i) => {
      if (!el) return;
      const icon = checkIconEls.current[i];

      /* Item slides in */
      tl.fromTo(el,
        { opacity: 0, x: -28, filter: 'blur(6px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' },
        i === 0 ? '+=0.3' : '+=0.55'
      )
      /* Check icon activates with glow */
      .fromTo(icon,
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(2)',
          onComplete: () => {
            gsap.to(icon, {
              boxShadow: '0 0 0 6px rgba(160,100,255,0.25)',
              duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut',
            });
          },
        },
        '<+0.25'
      );
    });

    /* After last item — brief pause → fade out → done */
    tl.to(containerRef.current,
      { opacity: 0, duration: 0.55, ease: 'power2.in' },
      '+=1.2'
    )
    .call(() => onDoneRef.current());

    return () => { tl.kill(); };
  }, [narrationDone]);

  /* Word spans helper */
  function wordSpans(text: string) {
    return text.split(' ').map((w, i, arr) => (
      <span key={i} className="bt-wrd" style={{ display: 'inline-block', marginRight: i < arr.length - 1 ? '0.22em' : 0 }}>
        {w}
      </span>
    ));
  }

  return (
    <div ref={containerRef} className="fg-screen bt-screen" data-step="generation">
      <div className="fg-bg-glow fg-bg-glow--generation" />
      <div ref={flashRef} className="fg-tuning-flash" style={{ opacity: 0 }} />

      <GlanceLogo />

      <div className="bt-layout">

        {/* Headline */}
        <h1 ref={headlineRef} className="bt-headline">
          {wordSpans(headline)}
        </h1>

        {/* Agent row: mascot + narration side by side */}
        <div className="bt-agent-row">
          <div ref={mascotRef} className="bt-mascot" style={{ opacity: 0 }}>
            <AgentMascot agentMode="thinking" size={72} />
          </div>
          <div ref={narrationRef} className="bt-narration" style={{ opacity: 0 }}>
            {narrationPlaying && (
              <CinematicText
                text={narration}
                playing={true}
                speed={0.030}
                duration={0.38}
                onDone={() => setNarrationDone(true)}
                className="bt-narration-text"
              />
            )}
          </div>
        </div>

        {/* Checklist */}
        <div ref={checklistRef} className="bt-checklist" style={{ opacity: 0 }}>
          {checklistItems.map((item, i) => (
            <div
              key={i}
              ref={el => { checkEls.current[i] = el; }}
              className="bt-check-item"
              style={{ opacity: 0 }}
            >
              <span
                ref={el => { checkIconEls.current[i] = el; }}
                className="bt-check-icon"
                style={{ opacity: 0, transform: 'scale(0)' }}
              >
                ✓
              </span>
              <span className="bt-check-text">{item}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
