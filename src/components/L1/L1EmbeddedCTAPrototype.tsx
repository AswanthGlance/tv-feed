/**
 * Option 1 v5 — Conversation-Thread Navigation
 *
 * TWO clearly separated focus states:
 *
 *   (A) CARD focus       — navigating step cards inside one conversation.
 *                          The focused card is EXPANDED: wider, more info,
 *                          strong selected treatment.
 *   (B) GROUP focus      — navigating between whole conversations. Each
 *                          conversation is one object; the selected group
 *                          shows its FIRST card as an expanded preview, and
 *                          non-selected groups collapse/stack.
 *
 * Grouped mode persists for BOTH up and down — once grouped, UP/DOWN only move
 * between conversation groups. It never dives into cards; only OK/ENTER does.
 *
 *   cards  ──UP──▶ grouped mode (stays on current conversation)
 *          ──←/→─ browse cards (focused = expanded) · left edge → rail
 *          ──DOWN▶ recommendations (latest) / grouped (older)
 *   group  ──UP──▶ previous group      ──DOWN──▶ next group
 *          ──OK──▶ enter cards, first card focused + expanded
 *          ──←──▶ action rail (👍 👎 🔖, whole response)
 *
 * No borders in any default state — depth is scale / opacity / elevation.
 * Recommendations exist ONLY for the latest conversation.
 */
import { useEffect, useRef, useState } from 'react';

type Zone = 'group' | 'cards' | 'rail' | 'prompts' | 'inputs';

interface StepCard { step: string; caption: string; desc: string; }
interface Conversation {
  query: string;
  intro: string;
  tabs: string[];
  activeTab: number;
  cards: StepCard[];
  footer: string;
}

/* Oldest → newest. Latest conversation is the LAST item (rendered at bottom). */
const CONVERSATIONS: Conversation[] = [
  {
    query: 'How do I register my Missouri business?',
    intro: 'Here are the core steps to register a business in Missouri, from entity choice to state filing:',
    tabs: ['Overview', 'Steps to Follow', 'Fees', 'Resources'],
    activeTab: 1,
    cards: [
      { step: 'STEP 1', caption: 'Pick a business structure', desc: 'Choose an LLC, corporation, or sole proprietorship. Most small businesses pick an LLC for liability protection.' },
      { step: 'STEP 2', caption: 'Search & reserve a name',   desc: 'Check name availability on the Secretary of State portal, then reserve it for up to 60 days.' },
      { step: 'STEP 3', caption: 'File with the state',        desc: 'Submit Articles of Organization online. The standard filing fee for an LLC is $50.' },
      { step: 'STEP 4', caption: 'Get an EIN from the IRS',    desc: 'Apply free on irs.gov. You need this for taxes, hiring, and opening a bank account.' },
      { step: 'STEP 5', caption: 'Register for state taxes',  desc: 'Register with the Missouri Department of Revenue for sales and employer withholding tax.' },
    ],
    footer: 'Most LLC filings are processed online within 1–2 business days.',
  },
  {
    query: 'What documents do I need to open a business bank account?',
    intro: 'You will typically need these documents to open a business bank account:',
    tabs: ['Checklist', 'By Entity Type', 'Tips'],
    activeTab: 0,
    cards: [
      { step: 'DOC 1', caption: 'EIN confirmation letter', desc: 'The IRS-issued CP 575 or 147C letter proving your federal tax ID.' },
      { step: 'DOC 2', caption: 'Articles of organization', desc: 'Your state-filed formation document showing the business legally exists.' },
      { step: 'DOC 3', caption: 'Operating agreement',      desc: 'Defines ownership and who is authorized to act on the account.' },
      { step: 'DOC 4', caption: 'Government-issued ID',     desc: 'A passport or driver’s license for each signer on the account.' },
    ],
    footer: 'Some banks also ask for an initial deposit to activate the account.',
  },
  {
    query: 'Check out the recipe of Miso Ramen',
    intro: 'Here’s a homemade Vegetarian Miso Ramen recipe, broken down into broth, noodles, and toppings:',
    tabs: ['Ingredients', 'Steps to Follow', 'Cookbook', 'Shop Ingredients'],
    activeTab: 1,
    cards: [
      { step: 'STEP 1', caption: 'Simmer broth with soy',    desc: 'Combine dashi, soy, and mirin. Simmer gently for 15 minutes to build a savory base.' },
      { step: 'STEP 2', caption: 'Cook noodles until tender', desc: 'Boil fresh ramen noodles for 2–3 minutes, then drain and rinse briefly.' },
      { step: 'STEP 3', caption: 'Assemble bowl with toppings', desc: 'Layer noodles, broth, corn, scallions, and nori into a warmed bowl.' },
      { step: 'STEP 4', caption: 'Add miso paste to taste',  desc: 'Whisk in 1–2 tbsp of red or white miso off the heat to keep it aromatic.' },
      { step: 'STEP 5', caption: 'Drizzle chili oil',        desc: 'Finish with chili oil and toasted sesame for warmth and depth.' },
      { step: 'STEP 6', caption: 'Garnish & serve hot',      desc: 'Top with a soft-boiled egg and fresh scallions, then serve immediately.' },
    ],
    footer: 'A soft-boiled egg and fresh scallions elevate the whole bowl.',
  },
];

const RAIL = [
  { icon: '👍', id: 'like'     },
  { icon: '👎', id: 'dislike'  },
  { icon: '🔖', id: 'bookmark' },
];

const PROMPTS = [
  'Make this vegetarian',
  'Show me the ingredient list',
  'What toppings work best?',
  'Suggest a quick version',
];

/* ── Canvas ─────────────────────────────────────────────────────────── */
const W        = 1920;
const H        = 1080;
const LEFT_PAD = 90;
const BOTTOM_H = 104;

const RAIL_W      = 66;
const GAP         = 22;
const ACTIVE_H    = 600;   // expanded conversation slot
const COLLAPSED_H = 150;   // collapsed group slot
const TOP_ANCHOR  = 128;

/* card sizes */
const CARD_W_NORMAL   = 210;
const CARD_W_EXPANDED = 384;
const CARD_H          = 300;
const CARD_GAP        = 16;

const LATEST = CONVERSATIONS.length - 1;

export default function L1EmbeddedCTAPrototype() {
  /* DEFAULT: first card of the latest conversation (card focus state). */
  const [zone,      setZone]      = useState<Zone>('cards');
  const [convIdx,   setConvIdx]   = useState(LATEST);
  const [cardIdx,   setCardIdx]   = useState(0);
  const [railIdx,   setRailIdx]   = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [inputIdx,  setInputIdx]  = useState(0);
  const [toast,     setToast]     = useState<string | null>(null);
  const [saved,     setSaved]     = useState<Record<number, boolean>>({});

  const railFromRef = useRef<Zone>('cards');
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1600); };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;
      const conv = CONVERSATIONS[convIdx];

      /* ── UP ─────────────────────────────────────────────────────── */
      if (k === 'ArrowUp') {
        e.preventDefault();
        if (zone === 'rail') {
          setRailIdx(i => (i > 0 ? i - 1 : i));
        } else if (zone === 'cards') {
          setZone('group');                                  // exit cards → grouped (stay on current)
        } else if (zone === 'group') {
          if (convIdx > 0) setConvIdx(i => i - 1);           // previous group
        } else if (zone === 'prompts' || zone === 'inputs') {
          setConvIdx(LATEST); setZone('cards'); setCardIdx(0);
        }
      }

      /* ── DOWN ───────────────────────────────────────────────────── */
      if (k === 'ArrowDown') {
        e.preventDefault();
        if (zone === 'rail') {
          setRailIdx(i => (i < RAIL.length - 1 ? i + 1 : i));
        } else if (zone === 'group') {
          if (convIdx < LATEST) setConvIdx(i => i + 1);      // next group (stays grouped)
          else { setZone('prompts'); setPromptIdx(0); }      // latest group → recommendations
        } else if (zone === 'cards') {
          if (convIdx === LATEST) { setZone('prompts'); setPromptIdx(0); }
          else setZone('group');                             // older cards → back to grouped
        }
      }

      /* ── RIGHT ──────────────────────────────────────────────────── */
      if (k === 'ArrowRight') {
        e.preventDefault();
        if (zone === 'cards') {
          setCardIdx(i => Math.min(conv.cards.length - 1, i + 1));
        } else if (zone === 'rail') {
          const back = railFromRef.current;
          setZone(back);
          if (back === 'cards') setCardIdx(0);
        } else if (zone === 'prompts') {
          setPromptIdx(i => Math.min(PROMPTS.length - 1, i + 1));
        } else if (zone === 'inputs') {
          if (inputIdx === 0) setInputIdx(1);
          else { setZone('prompts'); setPromptIdx(0); }
        }
        /* group: RIGHT is a no-op — a group is one object */
      }

      /* ── LEFT ───────────────────────────────────────────────────── */
      if (k === 'ArrowLeft') {
        e.preventDefault();
        if (zone === 'cards') {
          if (cardIdx === 0) { railFromRef.current = 'cards'; setZone('rail'); setRailIdx(0); }
          else setCardIdx(i => i - 1);
        } else if (zone === 'group') {
          railFromRef.current = 'group'; setZone('rail'); setRailIdx(0);
        } else if (zone === 'prompts') {
          if (promptIdx === 0) { setZone('inputs'); setInputIdx(1); }
          else setPromptIdx(i => i - 1);
        } else if (zone === 'inputs') {
          if (inputIdx === 1) setInputIdx(0);
        }
      }

      /* ── ENTER / OK ─────────────────────────────────────────────── */
      if (k === 'Enter') {
        e.preventDefault();
        if (zone === 'group') { setZone('cards'); setCardIdx(0); }   // open → first card (expanded)
        else if (zone === 'cards') flash(`${conv.cards[cardIdx].step} · ${conv.cards[cardIdx].caption}`);
        else if (zone === 'rail') {
          const action = RAIL[railIdx];
          if (action.id === 'bookmark') {
            setSaved(s => ({ ...s, [convIdx]: !s[convIdx] }));
            flash(`${saved[convIdx] ? 'Removed bookmark' : 'Bookmarked'} · "${conv.query}"`);
          } else flash(`${action.id === 'like' ? '👍 Liked' : '👎 Disliked'} the whole response`);
        } else if (zone === 'prompts') flash(`Ask: "${PROMPTS[promptIdx]}"`);
      }

      /* ── BACK / ESC ─────────────────────────────────────────────── */
      if (k === 'Escape' || k === 'Backspace') {
        e.preventDefault();
        if (zone === 'cards') setZone('group');              // exit cards → grouped
        else if (zone === 'rail') setZone(railFromRef.current);
        else if (zone === 'prompts' || zone === 'inputs') { setConvIdx(LATEST); setZone('cards'); setCardIdx(0); }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [zone, convIdx, cardIdx, railIdx, promptIdx, inputIdx, saved]);

  const translateY = TOP_ANCHOR - convIdx * (COLLAPSED_H + GAP);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ width: W, height: H, transformOrigin: 'top left', transform: 'scale(var(--tv-scale,1))', position: 'relative', background: '#0d0d0d', color: '#fff', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
        <ScaleSync cssVar="--tv-scale" />

        <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 40, left: LEFT_PAD, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#e8e8e8', zIndex: 30 }}>
          glance ✦
        </div>

        {/* ── Top fade mask ────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 112, background: 'linear-gradient(#0d0d0d 44%, rgba(13,13,13,0))', zIndex: 20, pointerEvents: 'none' }} />

        {/* ── Conversation column ──────────────────────────────────── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          transform: `translateY(${translateY}px)`,
          transition: 'transform 0.36s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column', gap: GAP,
          padding: `0 ${LEFT_PAD}px`,
        }}>
          {CONVERSATIONS.map((conv, ci) => {
            const isSel     = convIdx === ci;
            const inCards   = isSel && (zone === 'cards' || zone === 'rail');
            const grouped   = isSel && zone === 'group';
            const railOn    = isSel && zone === 'rail';

            const slotH   = isSel ? ACTIVE_H : COLLAPSED_H;
            const opacity = isSel ? 1 : 0.4;
            const scale   = isSel ? 1 : 0.965;

            return (
              <div key={ci} style={{
                height: slotH,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                opacity, transform: `scale(${scale})`, transformOrigin: 'left top',
                transition: 'height 0.36s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease, transform 0.36s cubic-bezier(0.4,0,0.2,1)',
              }}>

                {/* ── Left action rail (whole-response actions) ────── */}
                <div style={{ width: RAIL_W, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 176, alignItems: 'center', opacity: isSel ? 1 : 0, pointerEvents: isSel ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
                  {RAIL.map((a, ri) => {
                    const focused = railOn && railIdx === ri;
                    const isSaved = a.id === 'bookmark' && saved[ci];
                    return (
                      <div key={a.id} style={{
                        width: 52, height: 52, borderRadius: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        background: focused ? 'rgba(255,255,255,0.18)' : isSaved ? 'rgba(255,214,120,0.14)' : 'rgba(255,255,255,0.05)',
                        boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.55), 0 6px 20px rgba(0,0,0,0.6)' : isSaved ? '0 0 0 2px rgba(255,214,120,0.5)' : 'none',
                        transform: focused ? 'scale(1.12)' : 'scale(1)',
                        transition: 'all 0.16s ease',
                      }}>{a.icon}</div>
                    );
                  })}
                </div>

                {/* ── Conversation block — NO border; depth via glow/scale ── */}
                <div style={{
                  flex: 1, minWidth: 0, height: slotH,
                  borderRadius: 22,
                  background: isSel ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.02)',
                  boxShadow: isSel ? '0 18px 60px rgba(0,0,0,0.6), 0 0 70px rgba(255,255,255,0.05)' : '0 6px 22px rgba(0,0,0,0.4)',
                  transition: 'all 0.36s cubic-bezier(0.4,0,0.2,1)',
                  padding: isSel ? '24px 34px' : '16px 26px',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>

                  {/* USER query bubble */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: isSel ? 14 : 8, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '74%' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.09)',
                        borderRadius: '16px 16px 4px 16px',
                        padding: isSel ? '10px 18px' : '7px 14px',
                        fontSize: isSel ? 18 : 14, color: '#e8e8e8', lineHeight: '24px',
                        transition: 'all 0.3s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{conv.query}</div>
                      <div style={{ width: isSel ? 38 : 30, height: isSel ? 38 : 30, borderRadius: 20, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888', flexShrink: 0, transition: 'all 0.3s ease' }}>You</div>
                    </div>
                  </div>

                  {/* ASSISTANT response intro */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexShrink: 0 }}>
                    <div style={{ width: isSel ? 40 : 30, height: isSel ? 40 : 30, borderRadius: 20, background: 'linear-gradient(135deg,#3a3a3a,#1e1e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSel ? 15 : 12, flexShrink: 0, marginTop: 2, transition: 'all 0.3s ease' }}>✦</div>
                    <div style={{
                      fontSize: isSel ? 24 : 16, fontWeight: 600, lineHeight: isSel ? '32px' : '22px', color: isSel ? '#f0f0f0' : '#a8a8a8', maxWidth: 980,
                      transition: 'all 0.3s ease', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: isSel ? 2 : 1, WebkitBoxOrient: 'vertical',
                    }}>{conv.intro}</div>
                  </div>

                  {/* Tabs — visual only (never a focus stop); collapse away when not selected */}
                  <div style={{
                    display: 'flex', gap: 30, marginLeft: 54,
                    height: isSel ? 46 : 0, opacity: isSel ? 1 : 0,
                    marginTop: isSel ? 16 : 0, marginBottom: isSel ? 16 : 0,
                    borderBottom: isSel ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    overflow: 'hidden', transition: 'all 0.32s ease', flexShrink: 0,
                  }}>
                    {conv.tabs.map((t, ti) => {
                      const active = ti === conv.activeTab;
                      return (
                        <div key={ti} style={{
                          fontSize: 18, padding: '2px 4px 12px',
                          color: active ? '#fff' : '#6a6a6a', fontWeight: active ? 600 : 400,
                          borderBottom: active ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
                          marginBottom: -1, whiteSpace: 'nowrap',
                        }}>{t}</div>
                      );
                    })}
                  </div>

                  {/* Step cards */}
                  <div style={{ display: 'flex', gap: isSel ? CARD_GAP : 8, marginLeft: 54, marginTop: isSel ? 0 : 6, overflow: 'hidden', alignItems: 'flex-start', flexShrink: 0 }}>
                    {conv.cards.map((card, cdi) => {
                      /* A card is EXPANDED when it's the focused card (card mode)
                         OR the first card of the selected group (grouped preview). */
                      const cardFocused = inCards && zone === 'cards' && cardIdx === cdi;
                      const groupPreview = grouped && cdi === 0;
                      const expanded = isSel && (cardFocused || groupPreview);

                      const cw = !isSel ? 104 : expanded ? CARD_W_EXPANDED : CARD_W_NORMAL;
                      const ch = !isSel ? 66 : CARD_H;

                      return (
                        <div key={cdi} style={{
                          width: cw, height: ch, flexShrink: 0,
                          borderRadius: isSel ? 16 : 10, overflow: 'hidden', position: 'relative', background: '#1c1c1c',
                          boxShadow: cardFocused
                            ? '0 0 0 4px rgba(255,255,255,0.9), 0 14px 40px rgba(0,0,0,0.75)'
                            : (expanded ? '0 10px 30px rgba(0,0,0,0.6)' : 'none'),
                          transform: cardFocused ? 'translateY(-6px)' : 'none',
                          transformOrigin: 'left center',
                          opacity: !isSel ? (cdi === 0 ? 0.9 : 0.55) : (inCards && zone === 'cards' && !cardFocused ? 0.82 : 1),
                          transition: 'width 0.34s cubic-bezier(0.4,0,0.2,1), height 0.34s cubic-bezier(0.4,0,0.2,1), transform 0.18s ease, box-shadow 0.18s ease, opacity 0.28s ease',
                          zIndex: expanded ? 2 : 1,
                        }}>
                          {/* image / gradient placeholder */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#2c2c2c,#161616)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: isSel ? 22 : 13 }}>▭</div>

                          {/* step label */}
                          <div style={{ position: 'absolute', top: isSel ? 16 : 8, left: isSel ? 16 : 8, fontSize: isSel ? 13 : 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>{card.step}</div>

                          {/* EXPANDED content: caption + description */}
                          {expanded ? (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '52px 20px 20px', background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.92))' }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: '26px', marginBottom: 8 }}>{card.caption}</div>
                              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: '20px' }}>{card.desc}</div>
                            </div>
                          ) : isSel ? (
                            /* collapsed-but-in-selected: caption only */
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 14px 14px', background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.85))', fontSize: 15, lineHeight: '20px', color: '#fff' }}>{card.caption}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer — selected only */}
                  {isSel && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, marginLeft: 54, fontSize: 15, fontStyle: 'italic', color: '#8a8a8a', flexShrink: 0 }}>
                      <span style={{ flexShrink: 0, color: '#6a6a6a' }}>✦</span>
                      <span>{conv.footer}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom recommendations — LATEST conversation only ─────── */}
        {convIdx === LATEST && (
          <>
            <div style={{ position: 'absolute', bottom: BOTTOM_H, left: 0, right: 0, height: 90, background: 'linear-gradient(rgba(13,13,13,0), #0d0d0d)', zIndex: 15, pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_H,
              borderTop: '1px solid #1e1e1e', background: '#0d0d0d',
              display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${LEFT_PAD}px`, zIndex: 16, animation: 'fadeIn 0.25s ease',
            }}>
              {[{ icon: '⌨️', idx: 0 }, { icon: '🎤', idx: 1 }].map(({ icon, idx }) => {
                const focused = zone === 'inputs' && inputIdx === idx;
                return (
                  <div key={idx} style={{
                    width: 52, height: 52, borderRadius: 26, flexShrink: 0,
                    background: focused ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    transition: 'all 0.15s ease',
                    boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.55)' : 'none',
                    transform: focused ? 'scale(1.08)' : 'scale(1)',
                  }}>{icon}</div>
                );
              })}
              {PROMPTS.map((p, i) => {
                const focused = zone === 'prompts' && promptIdx === i;
                return (
                  <div key={i} style={{
                    padding: '15px 24px',
                    borderRadius: 999, fontSize: 16,
                    color: focused ? '#111' : '#888',
                    background: focused ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)',
                    boxShadow: focused ? '0 6px 20px rgba(255,255,255,0.15)' : 'none',
                    transform: focused ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  }}>{p}</div>
                );
              })}
            </div>
          </>
        )}

        {/* ── State badge ──────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#555', background: '#161616', border: '1px solid #242424', padding: '7px 16px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 40 }}>
          <b style={{ color: '#999' }}>{zone === 'group' ? 'group' : zone}</b>
          {'  ·  conv '}{convIdx + 1}/{CONVERSATIONS.length}{convIdx === LATEST ? ' (latest)' : ''}
          {zone === 'cards'   && <>  ·  card {cardIdx + 1}/{CONVERSATIONS[convIdx].cards.length}</>}
          {zone === 'rail'    && <>  ·  {RAIL[railIdx].id}</>}
          {zone === 'prompts' && <>  ·  prompt {promptIdx + 1}</>}
          {zone === 'inputs'  && <>  ·  {inputIdx === 0 ? '⌨️' : '🎤'}</>}
        </div>

        {/* ── Key legend ───────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 118, right: 22, fontSize: 12, color: '#484848', background: '#141414', border: '1px solid #222', padding: '13px 18px', borderRadius: 6, lineHeight: '23px', zIndex: 40 }}>
          <b style={{ color: '#888' }}>Card focus (default)</b><br />
          ← →      browse cards (focused = expanded)<br />
          left edge → action rail · ↑ → grouped mode<br />
          <b style={{ color: '#888' }}>Grouped mode</b><br />
          ↑ ↓      move between conversations<br />
          OK       enter → first card (expanded)<br />
          ←        action rail (👍 👎 🔖)
        </div>

        {/* ── Toast ────────────────────────────────────────────────── */}
        {toast && (
          <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', background: '#1e1e1e', border: '2px solid rgba(255,255,255,0.7)', padding: '20px 40px', borderRadius: 12, fontSize: 19, zIndex: 100, boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
            ✓ {toast}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Scale 1920×1080 to viewport ─────────────────────────────────────── */
function ScaleSync({ cssVar }: { cssVar: string }) {
  useEffect(() => {
    const apply = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      document.documentElement.style.setProperty(cssVar, String(s));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [cssVar]);
  return null;
}
