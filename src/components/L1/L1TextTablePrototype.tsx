/**
 * Text-First TV Chat — multi-turn conversation with 4 threads.
 *
 * Three static history turns (0–2) + one live latest turn (3, variant-controlled).
 *
 * Navigation:
 *   · In history turns: UP/DOWN moves between turns; latest turn is one focus stop.
 *   · In latest turn: block-level UP/DOWN (text ▸ points ▸ table ▸ prompts).
 *   · UP from first block of latest turn → goes back into history.
 *   · DOWN DOWN quickly → ↓ Go to Latest pill  (jumps to latest turn + prompts)
 *   · UP UP   quickly → ↑ Go to Top    pill  (jumps to turn 0)
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ─── data types ─────────────────────────────────────────── */
interface Row   { rank: string; name: string; price: string; chip: string; rating: string; }
interface Point { title: string; body: string; }

/* ─── table rows ─────────────────────────────────────────── */
const ROWS: Row[] = [
  { rank: '1',  name: 'OnePlus Nord 4',       price: '₹32,999', chip: 'Snapdragon 7+ Gen 3',   rating: '4.5 ★' },
  { rank: '2',  name: 'Google Pixel 8a',      price: '₹38,999', chip: 'Tensor G3',             rating: '4.5 ★' },
  { rank: '3',  name: 'iQOO Neo 9 Pro',       price: '₹36,999', chip: 'Snapdragon 8 Gen 2',    rating: '4.4 ★' },
  { rank: '4',  name: 'Samsung Galaxy A55',   price: '₹39,999', chip: 'Exynos 1480',           rating: '4.3 ★' },
  { rank: '5',  name: 'Nothing Phone (2a)',   price: '₹27,999', chip: 'Dimensity 7200 Pro',    rating: '4.3 ★' },
  { rank: '6',  name: 'Motorola Edge 50 Pro', price: '₹31,999', chip: 'Snapdragon 7 Gen 3',    rating: '4.2 ★' },
  { rank: '7',  name: 'Realme GT 6T',         price: '₹30,999', chip: 'Snapdragon 7+ Gen 3',   rating: '4.2 ★' },
  { rank: '8',  name: 'Poco F6',              price: '₹29,999', chip: 'Snapdragon 8s Gen 3',   rating: '4.2 ★' },
  { rank: '9',  name: 'Vivo V30',             price: '₹33,999', chip: 'Snapdragon 7 Gen 3',    rating: '4.1 ★' },
  { rank: '10', name: 'Redmi Note 13 Pro+',   price: '₹31,999', chip: 'Dimensity 7200 Ultra',  rating: '4.1 ★' },
  { rank: '11', name: 'iQOO Z9 Turbo',        price: '₹24,999', chip: 'Snapdragon 8s Gen 3',   rating: '4.1 ★' },
  { rank: '12', name: 'Samsung Galaxy M55',   price: '₹28,999', chip: 'Snapdragon 7 Gen 1',    rating: '4.0 ★' },
  { rank: '13', name: 'Oppo Reno 12',         price: '₹34,999', chip: 'Dimensity 7300 Energy', rating: '4.0 ★' },
  { rank: '14', name: 'Lava Agni 3',          price: '₹22,999', chip: 'Dimensity 7300X',       rating: '3.9 ★' },
  { rank: '15', name: 'Infinix GT 20 Pro',    price: '₹24,999', chip: 'Dimensity 8200 Ultra',  rating: '3.9 ★' },
];

/* ─── points data for latest turn ───────────────────────── */
const POINTS: Point[] = [
  { title: 'OnePlus Nord 4',  body: 'Best all-round value — cheapest of the top picks with the biggest battery and 100 W fast charging.' },
  { title: 'Google Pixel 8a', body: 'Best camera and software — 7 years of updates, but the smallest battery and slowest charging.' },
  { title: 'iQOO Neo 9 Pro',  body: 'Best for gaming — fastest chip, 144 Hz display, and 120 W charging.' },
];

const POINTS_MANY: Point[] = [
  { title: 'OnePlus Nord 4',       body: 'Best all-round value; biggest battery, 100 W charging.' },
  { title: 'Google Pixel 8a',      body: 'Best camera and 7 years of software updates.' },
  { title: 'iQOO Neo 9 Pro',       body: 'Fastest chip and 144 Hz display for gaming.' },
  { title: 'Samsung Galaxy A55',   body: 'Premium build and the best display calibration.' },
  { title: 'Nothing Phone (2a)',   body: 'Most distinctive design at the lowest price.' },
  { title: 'Motorola Edge 50 Pro', body: 'Cleanest software and fast 125 W charging.' },
  { title: 'Realme GT 6T',         body: 'Brightest display in the segment.' },
  { title: 'Poco F6',              body: 'Best raw performance per rupee.' },
  { title: 'Vivo V30',             body: 'Best selfie and portrait cameras.' },
  { title: 'Redmi Note 13 Pro+',   body: 'Highest-resolution 200 MP main sensor.' },
];

/* ─── static conversation history (turns 0–2) ───────────── */
interface HistoryTurn {
  id: number;
  userMsg: string;
  agentText: string;
  agentSecondary: string;
  points?: Point[];
}

const HISTORY: HistoryTurn[] = [
  {
    id: 0,
    userMsg: "I'm looking for a new phone around ₹30,000. Any suggestions?",
    agentText: "Great timing — this segment is unusually competitive right now.",
    agentSecondary: "For ₹30,000 you get flagship-class performance from last year's top-end chipsets, or very solid current-gen mid-range. The Nothing Phone (2a) at ₹27,999 and the iQOO Z9 Turbo at ₹24,999 are the two I'd start with — both punch well above their price.",
  },
  {
    id: 1,
    userMsg: "Camera quality is the most important thing for me.",
    agentText: "Understood. Camera quality in this range has improved a lot, but there's still a real gap between the leaders and the rest.",
    agentSecondary: "Three that genuinely stand out for photography:",
    points: [
      { title: 'Google Pixel 8a',  body: 'Best computational photography and night mode. Tensor G3 handles post-processing on-device.' },
      { title: 'Vivo V30',         body: 'Dedicated portrait lens and Zeiss optics. Best for selfies and natural skin tones.' },
      { title: 'OnePlus Nord 4',   body: '50 MP Sony sensor with OIS. Excellent in daylight, solid low-light with AI processing.' },
    ],
  },
  {
    id: 2,
    userMsg: "What about battery? I travel a lot and can't always charge.",
    agentText: "Battery life varies wildly in this segment. The ones with 5000+ mAh cells and efficient chips easily last two full days.",
    agentSecondary: "Top picks for battery stamina and fast charging:",
    points: [
      { title: 'OnePlus Nord 4',      body: '5500 mAh with 100 W charging — 0 to full in 28 min. Best overall stamina.' },
      { title: 'iQOO Neo 9 Pro',      body: '5160 mAh with 120 W charging. Fastest charger in the segment.' },
      { title: 'Redmi Note 13 Pro+',  body: '5100 mAh with 120 W. Solid two-day battery, widely available chargers.' },
    ],
  },
];

const LATEST_ID = 3; // dynamic turn index

/* ─── layout constants ───────────────────────────────────── */
const GRID        = '0.5fr 2fr 1fr 1.8fr 0.9fr';
const PREVIEW_ROWS = 5;
const W           = 1920;
const H           = 1080;
const LEFT_PAD    = 120;
const BOTTOM_H    = 108;
const MODAL_ROW_H  = 64;
const MODAL_VIEW_H = 560;

const DOUBLE_PRESS_MS = 350;
const PILL_TTL_MS     = 3500;

/* ─── zone / block types ─────────────────────────────────── */
type Block   = 'text' | 'points' | 'table';
type Zone    = Block | 'prompts' | 'inputs' | 'modal' | 'jump-top' | 'jump-bottom';
type Variant = 1 | 2 | 3 | 4;

const BLOCKS: Record<Variant, Block[]> = {
  1: ['text', 'table'],
  2: ['text', 'points'],
  3: ['text', 'points', 'table'],
  4: ['text', 'points', 'table'],
};

const VARIANTS: { id: Variant; label: string }[] = [
  { id: 1, label: '1 · Text + Table' },
  { id: 2, label: '2 · Text + Points' },
  { id: 3, label: '3 · Text + Points + Table (heavy)' },
  { id: 4, label: '4 · Horizontal (→ → →)' },
];

const PROMPTS = [
  'Only phones with the best camera',
  'Sort by battery life',
  'Under ₹30,000 only',
  'Compare Nord 4 vs Pixel 8a',
];

/* ─── component ──────────────────────────────────────────── */
export default function L1TextTablePrototype() {
  const [variant,    setVariant]    = useState<Variant>(1);
  const [focusTurn,  setFocusTurn]  = useState<number>(LATEST_ID);
  const [zone,       setZone]       = useState<Zone>('text');
  const [scrollY,    setScrollY]    = useState(0);      // modal scroll
  const [promptIdx,  setPromptIdx]  = useState(0);
  const [inputIdx,   setInputIdx]   = useState(0);
  const [jumpPill,   setJumpPill]   = useState<'top' | 'bottom' | null>(null);
  const [convOffset, setConvOffset] = useState(0);      // conversation translateY (px)

  const lastUpRef   = useRef(0);
  const lastDownRef = useRef(0);
  const jumpTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevZoneRef = useRef<Zone>('text');
  const prevTurnRef = useRef<number>(LATEST_ID);

  const convContRef = useRef<HTMLDivElement>(null);   // outer clip
  const convInnerRef = useRef<HTMLDivElement>(null);  // inner scroll target
  const turnRefs    = useRef<(HTMLDivElement | null)[]>([]);

  const blocks    = BLOCKS[variant];
  const maxScroll = Math.max(0, ROWS.length * MODAL_ROW_H - MODAL_VIEW_H);

  /* scroll conversation to show active turn */
  const scrollToTurn = (turnId: number) => {
    const el   = turnRefs.current[turnId];
    const cont = convContRef.current;
    if (!el || !cont) return;
    const target = Math.max(0, el.offsetTop - 32);
    setConvOffset(target);
  };

  /* on mount: scroll to latest turn */
  useLayoutEffect(() => { scrollToTurn(LATEST_ID); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollToTurn(focusTurn); }, [focusTurn]);

  /* ── pill helpers ─────────────────────────────────────── */
  const dismissPill = (restoreZone?: Zone, restoreTurn?: number) => {
    if (jumpTimer.current) { clearTimeout(jumpTimer.current); jumpTimer.current = null; }
    setJumpPill(null);
    if (restoreZone  !== undefined) setZone(restoreZone);
    if (restoreTurn  !== undefined) setFocusTurn(restoreTurn);
  };

  const showPill = (dir: 'top' | 'bottom', fromZone: Zone, fromTurn: number) => {
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    prevZoneRef.current = fromZone;
    prevTurnRef.current = fromTurn;
    setJumpPill(dir);
    setZone(dir === 'top' ? 'jump-top' : 'jump-bottom');
    jumpTimer.current = setTimeout(() => {
      setJumpPill(null);
      setZone(prevZoneRef.current);
      setFocusTurn(prevTurnRef.current);
      jumpTimer.current = null;
    }, PILL_TTL_MS);
  };

  useEffect(() => () => { if (jumpTimer.current) clearTimeout(jumpTimer.current); }, []);

  /* ── keyboard handler ─────────────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;

      /* variant switch */
      if (k === '1' || k === '2' || k === '3' || k === '4') {
        e.preventDefault();
        dismissPill();
        setVariant(Number(k) as Variant);
        setFocusTurn(LATEST_ID);
        setZone('text');
        setScrollY(0); setPromptIdx(0);
        return;
      }

      /* ── jump-pill zone ─────────────────────────────── */
      if (zone === 'jump-top' || zone === 'jump-bottom') {
        e.preventDefault();
        if (k === 'Enter') {
          if (zone === 'jump-top') {
            if (jumpTimer.current) { clearTimeout(jumpTimer.current); jumpTimer.current = null; }
            setJumpPill(null);
            setFocusTurn(0); setZone('text');
          } else {
            if (jumpTimer.current) { clearTimeout(jumpTimer.current); jumpTimer.current = null; }
            setJumpPill(null);
            setFocusTurn(LATEST_ID); setZone('prompts'); setPromptIdx(0);
          }
          return;
        }
        dismissPill(prevZoneRef.current, prevTurnRef.current);
        return;
      }

      /* ── modal zone ─────────────────────────────────── */
      if (zone === 'modal') {
        if (k === 'ArrowDown') { e.preventDefault(); setScrollY(y => Math.min(maxScroll, y + MODAL_ROW_H)); }
        if (k === 'ArrowUp')   { e.preventDefault(); setScrollY(y => Math.max(0, y - MODAL_ROW_H)); }
        if (k === 'Enter' || k === 'Escape' || k === 'Backspace') { e.preventDefault(); setZone('table'); setScrollY(0); }
        return;
      }

      /* ── history turn (focusTurn < LATEST_ID) ─────── */
      if (focusTurn < LATEST_ID) {
        if (k === 'ArrowDown') {
          e.preventDefault();
          const now = performance.now();
          const gap = now - lastDownRef.current;
          lastDownRef.current = now;
          if (gap < DOUBLE_PRESS_MS && focusTurn < LATEST_ID) {
            showPill('bottom', zone, focusTurn); return;
          }
          setFocusTurn(t => Math.min(LATEST_ID, t + 1));
          setZone('text');
          return;
        }
        if (k === 'ArrowUp') {
          e.preventDefault();
          const now = performance.now();
          const gap = now - lastUpRef.current;
          lastUpRef.current = now;
          if (gap < DOUBLE_PRESS_MS && focusTurn > 0) {
            showPill('top', zone, focusTurn); return;
          }
          if (focusTurn > 0) { setFocusTurn(t => t - 1); setZone('text'); }
          return;
        }
        return; // ignore other keys in history
      }

      /* ── latest turn (focusTurn === LATEST_ID) ────── */
      const horizontal = variant === 4;
      const idx        = blocks.indexOf(zone as Block);

      if (k === 'ArrowRight') {
        e.preventDefault();
        if (horizontal && idx !== -1) {
          if (idx < blocks.length - 1) setZone(blocks[idx + 1]);
        } else if (zone === 'prompts') setPromptIdx(i => Math.min(PROMPTS.length - 1, i + 1));
        else if (zone === 'inputs') {
          if (inputIdx === 0) setInputIdx(1);
          else { setZone('prompts'); setPromptIdx(0); }
        }
        return;
      }

      if (k === 'ArrowLeft') {
        e.preventDefault();
        if (horizontal && idx !== -1) {
          if (idx > 0) setZone(blocks[idx - 1]);
        } else if (zone === 'prompts') {
          if (promptIdx === 0) { setZone('inputs'); setInputIdx(1); }
          else setPromptIdx(i => i - 1);
        } else if (zone === 'inputs') {
          if (inputIdx === 1) setInputIdx(0);
        }
        return;
      }

      if (k === 'ArrowDown') {
        const now = performance.now();
        const gap = now - lastDownRef.current;
        lastDownRef.current = now;

        /* double DOWN — only when not already at prompts */
        const atBottom = zone === 'prompts' || zone === 'inputs';
        if (gap < DOUBLE_PRESS_MS && blocks.length > 1 && !atBottom) {
          e.preventDefault();
          showPill('bottom', zone, LATEST_ID); return;
        }

        e.preventDefault();
        if (horizontal) {
          if (idx !== -1) { setZone('prompts'); setPromptIdx(0); }
        } else if (idx !== -1) {
          if (idx < blocks.length - 1) setZone(blocks[idx + 1]);
          else { setZone('prompts'); setPromptIdx(0); }
        }
        return;
      }

      if (k === 'ArrowUp') {
        const now = performance.now();
        const gap = now - lastUpRef.current;
        lastUpRef.current = now;

        /* double UP — only when not at first block of latest turn */
        const atTop = !horizontal && idx === 0;
        if (gap < DOUBLE_PRESS_MS && !atTop) {
          e.preventDefault();
          showPill('top', zone, LATEST_ID); return;
        }

        e.preventDefault();
        if (zone === 'prompts' || zone === 'inputs') {
          setZone(horizontal ? 'text' : blocks[blocks.length - 1]);
        } else if (!horizontal && idx === 0) {
          /* first block of latest — move back into history */
          setFocusTurn(LATEST_ID - 1); setZone('text');
        } else if (!horizontal && idx > 0) {
          setZone(blocks[idx - 1]);
        }
        return;
      }

      if (k === 'Enter') {
        e.preventDefault();
        if (zone === 'table') { setZone('modal'); setScrollY(0); }
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [zone, focusTurn, maxScroll, promptIdx, inputIdx, blocks, variant]);

  /* ── derived values ───────────────────────────────────── */
  const modalOpen    = zone === 'modal';
  const inputFocused = (i: number) => zone === 'inputs' && inputIdx === i;

  const hasPoints    = blocks.includes('points');
  const hasTable     = blocks.includes('table');
  const pointsData   = variant === 3 ? POINTS_MANY : POINTS;
  const pointsTwoCol = pointsData.length > 5;

  const introSecondary = variant === 2
    ? 'I ranked them by sustained performance, low-light camera, and battery life. Here are the three that stand out:'
    : variant === 3
    ? 'I ranked every model by sustained performance, low-light camera, and battery life, then cross-checked against real owner reviews and repair reliability. I left out phones about to be replaced by a refresh, and any with known throttling or overheating issues.'
    : "I ranked them by sustained performance, low-light camera, and battery life — leaving out models about to be replaced. The OnePlus Nord 4 and Pixel 8a lead the list. Here's the comparison:";

  /* ── style helpers ────────────────────────────────────── */
  const focusRing = (on: boolean, pad = 16): React.CSSProperties => ({
    borderRadius: 14,
    padding: pad,
    margin: -pad,
    background: on ? 'rgba(255,255,255,0.05)' : 'transparent',
    boxShadow: on ? '0 0 0 2px rgba(255,255,255,0.55)' : 'none',
    transition: 'all 0.16s ease',
  });

  const PANEL_H = 540;
  const panelBase = (on: boolean): React.CSSProperties => ({
    height: PANEL_H, borderRadius: 16, padding: '26px 28px',
    background: on ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
    boxShadow: on ? '0 0 0 3px rgba(255,255,255,0.85), 0 18px 50px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.4)',
    transform: on ? 'translateY(-2px)' : 'none',
    transition: 'all 0.18s ease',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  });

  const pillFocused = jumpPill === 'top' ? zone === 'jump-top' : zone === 'jump-bottom';

  /* ── latest-turn content blocks ─────────────────────── */
  const isHorizontal = variant === 4;
  const previewN     = variant === 3 ? 2 : PREVIEW_ROWS;
  const tableFocused = focusTurn === LATEST_ID && zone === 'table';
  const latestActive = focusTurn === LATEST_ID;

  const textPanel = (
    <div key="text" style={ isHorizontal
      ? { ...panelBase(latestActive && zone === 'text'), width: 560, flexShrink: 0 }
      : { display: 'flex', gap: 16, alignItems: 'flex-start', flexShrink: 0 } }>
      {!isHorizontal && (
        <div style={{ width: 42, height: 42, borderRadius: 21, background: 'linear-gradient(135deg,#3a3a3a,#1e1e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
      )}
      <div style={ isHorizontal ? {} : { ...focusRing(latestActive && zone === 'text'), flex: 1 } }>
        {isHorizontal && <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#777', marginBottom: 12 }}>✦ Summary</div>}
        <div style={{ fontSize: 22, lineHeight: '32px', color: '#f0f0f0', maxWidth: 1200, fontWeight: 500 }}>
          Great question — this price bracket is unusually competitive right now.
          I looked at every phone launched in the last year and scored them on real-world use.
        </div>
        <div style={{ fontSize: 18, lineHeight: '27px', color: '#a8a8a8', maxWidth: 1160, marginTop: 10 }}>
          {introSecondary}
        </div>
      </div>
    </div>
  );

  const pointsInner = (
    <div style={{
      display: (pointsTwoCol && !isHorizontal) ? 'grid' : 'flex', flexDirection: 'column',
      ...((pointsTwoCol && !isHorizontal)
        ? { gridTemplateColumns: '1fr 1fr', columnGap: 56, rowGap: 12 }
        : { gap: 13 }),
    }}>
      {pointsData.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.7)', marginTop: 9, flexShrink: 0 }} />
          <div style={{ fontSize: 16, lineHeight: '23px' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>{p.title}</span>
            <span style={{ color: '#9a9a9a' }}> — {p.body}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const pointsPanel = hasPoints && (
    isHorizontal ? (
      <div key="points" style={{ ...panelBase(latestActive && zone === 'points'), width: 620, flexShrink: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#777', marginBottom: 14 }}>◆ Key picks</div>
        {pointsInner}
      </div>
    ) : (
      <div key="points" style={{ marginLeft: 58, flexShrink: 0 }}>
        <div style={focusRing(latestActive && zone === 'points')}>{pointsInner}</div>
      </div>
    )
  );

  const tblPreview = isHorizontal ? 6 : previewN;
  const tablePanel = hasTable && (
    <div key="table" style={{
      ...(isHorizontal
        ? { width: 640, flexShrink: 0, height: PANEL_H, display: 'flex', flexDirection: 'column' }
        : { marginLeft: 58, maxWidth: 1420, flexShrink: 0 }),
      position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: 'rgba(255,255,255,0.028)',
      boxShadow: tableFocused
        ? '0 0 0 3px rgba(255,255,255,0.9), 0 18px 50px rgba(0,0,0,0.6)'
        : '0 8px 24px rgba(0,0,0,0.4)',
      transform: tableFocused ? 'translateY(-2px)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 22px', background: 'rgba(255,255,255,0.05)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a8a8a', fontWeight: 600, flexShrink: 0 }}>
        <div>#</div><div>Phone</div><div>Price</div><div>Chipset</div><div>Rating</div>
      </div>
      <div style={{ position: 'relative', flex: isHorizontal ? 1 : undefined, overflow: 'hidden' }}>
        {ROWS.slice(0, tblPreview).map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', fontSize: 16, alignItems: 'center', color: '#d6d6d6', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#7a7a7a' }}>{r.rank}</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{r.name}</div>
            <div>{r.price}</div><div style={{ color: '#a8a8a8' }}>{r.chip}</div><div>{r.rating}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(rgba(13,13,13,0), rgba(13,13,13,0.96))', pointerEvents: 'none' }} />
      </div>
      <div style={{ padding: '11px 22px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: tableFocused ? '#ddd' : '#666', flexShrink: 0 }}>
        <span>+{ROWS.length - tblPreview} more</span>
        <span style={{ fontWeight: 600 }}>{tableFocused ? 'OK to open ▸' : ''}</span>
      </div>
    </div>
  );

  /* ── render ───────────────────────────────────────────── */
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', overflow: 'hidden' }}>
      <style>{`
        @keyframes pillSlideDown { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes pillSlideUp   { from { opacity:0; transform:translateX(-50%) translateY(12px);  } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
      <div style={{ width: W, height: H, transformOrigin: 'top left', transform: 'scale(var(--tv-scale4,1))', position: 'relative', background: '#0d0d0d', color: '#fff', fontFamily: "'Inter','Plus Jakarta Sans',sans-serif", overflow: 'hidden' }}>
        <ScaleSync cssVar="--tv-scale4" />

        {/* Logo */}
        <div style={{ position: 'absolute', top: 40, left: LEFT_PAD, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#e8e8e8', zIndex: 5 }}>
          glance ✦
        </div>

        {/* ── Variant switcher ──────────────────────────────── */}
        <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 60 }}>
          {VARIANTS.map(v => {
            const active = variant === v.id;
            return (
              <div key={v.id}
                onClick={() => { dismissPill(); setVariant(v.id); setFocusTurn(LATEST_ID); setZone('text'); setScrollY(0); setPromptIdx(0); }}
                style={{
                  padding: '9px 18px', borderRadius: 999, fontSize: 14, cursor: 'pointer',
                  color: active ? '#111' : '#999',
                  background: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)',
                  fontWeight: active ? 700 : 500,
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                }}>{v.label}</div>
            );
          })}
        </div>

        {/* ── Jump pill ─────────────────────────────────────── */}
        {jumpPill && (
          <div style={{
            position: 'absolute',
            ...(jumpPill === 'top'
              ? { top: 168, left: '50%', animation: 'pillSlideDown 0.22s ease forwards' }
              : { bottom: 144, left: '50%', animation: 'pillSlideUp 0.22s ease forwards' }),
            zIndex: 55, display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 999,
            background: pillFocused ? 'rgba(255,255,255,0.94)' : 'rgba(18,18,18,0.88)',
            color: pillFocused ? '#111' : '#e8e8e8',
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
            boxShadow: pillFocused
              ? '0 0 0 3px rgba(255,255,255,0.85), 0 16px 48px rgba(0,0,0,0.65)'
              : '0 0 0 1px rgba(255,255,255,0.12), 0 10px 36px rgba(0,0,0,0.65)',
            backdropFilter: 'blur(16px)', whiteSpace: 'nowrap', pointerEvents: 'none',
            transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
          }}>
            {jumpPill === 'top' ? '↑ Go to Top' : '↓ Go to Latest'}
            {pillFocused && <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.55, marginLeft: 4 }}>ENTER</span>}
          </div>
        )}

        {/* ── Conversation area ─────────────────────────────── */}
        <div ref={convContRef} style={{ position: 'absolute', top: 116, left: LEFT_PAD, right: LEFT_PAD, bottom: 130, overflow: 'hidden' }}>
          <div ref={convInnerRef} style={{ display: 'flex', flexDirection: 'column', gap: 0, transform: `translateY(-${convOffset}px)`, transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* ── history turns 0–2 ─────────────────────── */}
            {HISTORY.map(turn => {
              const isFocused = focusTurn === turn.id;
              const dimmed = focusTurn === LATEST_ID; // latest active → history dims
              return (
                <div key={turn.id}
                  ref={el => { turnRefs.current[turn.id] = el; }}
                  style={{
                    paddingBottom: 40,
                    opacity: dimmed ? 0.55 : isFocused ? 1 : 0.75,
                    transition: 'opacity 0.25s ease',
                  }}>

                  {/* user bubble */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ background: 'rgba(255,255,255,0.09)', borderRadius: '18px 18px 4px 18px', padding: '12px 22px', fontSize: 19, color: '#e8e8e8' }}>
                        {turn.userMsg}
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888', flexShrink: 0 }}>You</div>
                    </div>
                  </div>

                  {/* agent response */}
                  <div style={{
                    borderRadius: 16, padding: '20px 24px',
                    background: isFocused ? 'rgba(255,255,255,0.04)' : 'transparent',
                    boxShadow: isFocused ? '0 0 0 1.5px rgba(255,255,255,0.18)' : 'none',
                    transition: 'all 0.2s ease',
                    marginLeft: 0,
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 21, background: 'linear-gradient(135deg,#3a3a3a,#1e1e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 21, lineHeight: '31px', color: '#f0f0f0', fontWeight: 500, marginBottom: 8 }}>{turn.agentText}</div>
                        <div style={{ fontSize: 17, lineHeight: '26px', color: '#a0a0a0', marginBottom: turn.points ? 16 : 0 }}>{turn.agentSecondary}</div>
                        {turn.points && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {turn.points.map((p, i) => (
                              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.5)', marginTop: 10, flexShrink: 0 }} />
                                <div style={{ fontSize: 15, lineHeight: '22px', color: '#b0b0b0' }}>
                                  <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{p.title}</span>
                                  <span> — {p.body}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* thread separator */}
                    {isFocused && (
                      <div style={{ marginTop: 16, fontSize: 12, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>↓ continue</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── separator line between history and latest ─ */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 32, flexShrink: 0 }} />

            {/* ── latest turn (LATEST_ID = 3) ─────────────── */}
            <div ref={el => { turnRefs.current[LATEST_ID] = el; }} style={{ flexShrink: 0 }}>

              {/* user query */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.09)', borderRadius: '18px 18px 4px 18px', padding: '12px 22px', fontSize: 19, color: '#e8e8e8' }}>
                    Compare the top smartphones under ₹40,000
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888', flexShrink: 0 }}>You</div>
                </div>
              </div>

              {/* agent response — full variant content */}
              {isHorizontal ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 21, background: 'linear-gradient(135deg,#3a3a3a,#1e1e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
                    <div style={{ fontSize: 22, lineHeight: '32px', color: '#f0f0f0', maxWidth: 1300, fontWeight: 500 }}>
                      Here are the top three smartphones under ₹40,000, ranked by performance, camera, and battery.
                      Move right to explore the summary, key picks, and full comparison.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', overflow: 'hidden', flexShrink: 0, marginLeft: 58 }}>
                    {[textPanel, pointsPanel, tablePanel]}
                    <div style={{ display: 'flex', alignItems: 'center', height: 540, color: '#3a3a3a', fontSize: 40, flexShrink: 0 }}>→</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {textPanel}{pointsPanel}{tablePanel}
                </div>
              )}
            </div>

            {/* bottom spacer so last turn isn't flush against clip edge */}
            <div style={{ height: 60, flexShrink: 0 }} />
          </div>
        </div>

        {/* ── Bottom prompt bar ─────────────────────────────── */}
        {!modalOpen && (
          <>
            <div style={{ position: 'absolute', bottom: BOTTOM_H, left: 0, right: 0, height: 80, background: 'linear-gradient(rgba(13,13,13,0), #0d0d0d)', zIndex: 15, pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_H,
              borderTop: '1px solid #1e1e1e', background: '#0d0d0d',
              display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${LEFT_PAD}px`, zIndex: 16,
            }}>
              {[{ icon: '⌨️', idx: 0 }, { icon: '🎤', idx: 1 }].map(({ icon, idx }) => {
                const focused = inputFocused(idx);
                return (
                  <div key={idx} style={{
                    width: 54, height: 54, borderRadius: 27, flexShrink: 0,
                    background: focused ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
                    boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.6)' : 'none',
                    transform: focused ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.15s ease',
                  }}>{icon}</div>
                );
              })}
              {PROMPTS.map((p, i) => {
                const focused = zone === 'prompts' && promptIdx === i;
                return (
                  <div key={i} style={{
                    padding: '15px 24px', borderRadius: 999, fontSize: 16,
                    color: focused ? '#111' : '#888',
                    background: focused ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)',
                    boxShadow: focused ? '0 6px 20px rgba(255,255,255,0.15)' : 'none',
                    transform: focused ? 'scale(1.03)' : 'scale(1)', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  }}>{p}</div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Modal — full scrollable table ─────────────────── */}
        {modalOpen && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)', zIndex: 50 }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 1360, background: '#161616', borderRadius: 20, zIndex: 51,
              boxShadow: '0 30px 90px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>All phones under ₹40,000</div>
                  <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{ROWS.length} results · ranked by rating</div>
                </div>
                <div style={{ padding: '10px 22px', borderRadius: 999, fontSize: 15, background: 'rgba(255,255,255,0.95)', color: '#111', fontWeight: 600, boxShadow: '0 0 0 3px rgba(255,255,255,0.3)' }}>
                  ✕ Close
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 32px', background: 'rgba(255,255,255,0.04)', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a8a8a', fontWeight: 600 }}>
                <div>#</div><div>Phone</div><div>Price</div><div>Chipset</div><div>Rating</div>
              </div>
              <div style={{ height: MODAL_VIEW_H, overflow: 'hidden', position: 'relative' }}>
                <div style={{ transform: `translateY(${-scrollY}px)`, transition: 'transform 0.18s ease' }}>
                  {ROWS.map((r, i) => (
                    <div key={i} style={{ height: MODAL_ROW_H, display: 'grid', gridTemplateColumns: GRID, padding: '0 32px', fontSize: 18, alignItems: 'center', color: '#d8d8d8', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ color: '#7a7a7a' }}>{r.rank}</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{r.name}</div>
                      <div>{r.price}</div><div style={{ color: '#a8a8a8' }}>{r.chip}</div><div>{r.rating}</div>
                    </div>
                  ))}
                </div>
                {scrollY > 0     && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(#161616, rgba(22,22,22,0))', pointerEvents: 'none' }} />}
                {scrollY < maxScroll && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(rgba(22,22,22,0), #161616)', pointerEvents: 'none' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, color: '#666' }}>↑ ↓ scroll · OK / BACK to close</div>
                <div style={{ width: 220, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: 0, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.6)',
                    width: `${Math.max(12, (MODAL_VIEW_H / (ROWS.length * MODAL_ROW_H)) * 100)}%`,
                    left: `${maxScroll ? (scrollY / maxScroll) * (100 - Math.max(12, (MODAL_VIEW_H / (ROWS.length * MODAL_ROW_H)) * 100)) : 0}%`,
                    transition: 'left 0.18s ease',
                  }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* State badge */}
        <div style={{ position: 'absolute', top: 84, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#555', background: '#161616', border: '1px solid #242424', padding: '6px 16px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 60 }}>
          turn <b style={{ color: '#999' }}>{focusTurn}</b> · focus <b style={{ color: '#999' }}>{zone}</b>
          {zone === 'prompts' && <>  ·  prompt {promptIdx + 1}</>}
          {modalOpen && <>  ·  scroll {Math.round(maxScroll ? (scrollY / maxScroll) * 100 : 0)}%</>}
          {jumpPill && <>  ·  <span style={{ color: '#f9a825' }}>jump {jumpPill}</span></>}
        </div>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 118, right: 20, fontSize: 12, color: '#484848', background: '#141414', border: '1px solid #222', padding: '12px 16px', borderRadius: 6, lineHeight: '22px', zIndex: 60 }}>
          {modalOpen
            ? <>↑ ↓ scroll the full table<br />OK / BACK to close</>
            : <>
                <b style={{ color: '#888' }}>1/2/3/4</b> switch format<br />
                ↑ ↓ navigate threads &amp; blocks<br />
                <span style={{ color: '#666' }}>↓↓ quickly → ↓ Go to Latest<br />↑↑ quickly → ↑ Go to Top</span>
              </>}
        </div>
      </div>
    </div>
  );
}

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
