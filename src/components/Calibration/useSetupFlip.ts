/**
 * useSetupFlip — shared FLIP center-stage animation for setup question screens.
 *
 * Mirrors the InterstitialQuestion FLIP technique exactly:
 *  1. Capture selected card rects
 *  2. Clone them as ghost divs at source positions
 *  3. Fade originals + unselected cards
 *  4. Fly ghosts to center
 *  5. Agent + reply appear below settled deck
 *  6. Call onDone when reply finishes
 */

import { useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

export type FlipOption = {
  id: string;
  label: string;
  image?: string;
};

type UseSetupFlipReturn = {
  flyLayerRef: React.RefObject<HTMLDivElement>;
  celebAgentRef: React.RefObject<HTMLDivElement>;
  celebAgentTop: number;
  replyPlaying: boolean;
  triggerFlip: (
    selectedIds: Set<string>,
    options: FlipOption[],
    cardElsRef: React.RefObject<(HTMLDivElement | null)[]>,
    rootRef: React.RefObject<HTMLDivElement>,
    questionRef: React.RefObject<HTMLDivElement>,
    onDone: () => void
  ) => void;
  cleanup: () => void;
};

export function useSetupFlip(): UseSetupFlipReturn {
  const flyLayerRef     = useRef<HTMLDivElement>(null!);
  const celebAgentRef   = useRef<HTMLDivElement>(null!);
  const [celebAgentTop, setCelebAgentTop] = useState(0);
  const [replyPlaying, setReplyPlaying]   = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
  }, []);

  const triggerFlip = useCallback((
    selectedIds: Set<string>,
    options: FlipOption[],
    cardElsRef: React.RefObject<(HTMLDivElement | null)[]>,
    rootRef: React.RefObject<HTMLDivElement>,
    questionRef: React.RefObject<HTMLDivElement>,
    onDone: () => void
  ) => {
    const flyLayer = flyLayerRef.current;
    const root     = rootRef.current;
    if (!flyLayer || !root) return;

    const selEntries = options
      .map((opt, i) => ({ opt, el: cardElsRef.current![i]!, idx: i }))
      .filter(e => e.el != null && selectedIds.has(e.opt.id));

    const unselEls = options
      .map((_, i) => cardElsRef.current![i])
      .filter((el, i) => el != null && !selectedIds.has(options[i].id)) as HTMLDivElement[];

    if (!selEntries.length) { onDone(); return; }

    const rootRect = root.getBoundingClientRect();
    const srcRects = selEntries.map(e => {
      const r = e.el.getBoundingClientRect();
      return { left: r.left - rootRect.left, top: r.top - rootRect.top, width: r.width, height: r.height };
    });

    const cardW = srcRects[0].width;
    const cardH = srcRects[0].height;

    const SW = root.offsetWidth;
    const SH = root.offsetHeight;
    const AGENT_BLOCK = 200;
    const HEADER_H    = 72;
    const available   = SH - HEADER_H - AGENT_BLOCK - 32;
    const scale = cardH > available ? available / cardH : 1.0;
    const tW    = cardW * scale;
    const tH    = cardH * scale;
    const tTop  = HEADER_H + Math.max(24, (available - tH) / 2);
    const tLeft = (SW - tW) / 2;

    const DECK_OFFSETS = [
      { rotate: -2,  x:  0,  y:  0,   scale: 1.00, opacity: 1.00, zIndex: 53 },
      { rotate:  5,  x: 10,  y: 10,   scale: 0.97, opacity: 0.90, zIndex: 52 },
      { rotate: -7,  x: -8,  y: 18,   scale: 0.94, opacity: 0.75, zIndex: 51 },
    ];

    // Fade question UI
    if (questionRef.current) gsap.to(questionRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in' });

    // Fade unselected
    gsap.to(unselEls, { opacity: 0, scale: 0.82, y: 10, duration: 0.3, ease: 'power2.in', stagger: 0.06 });

    // Hide originals
    selEntries.forEach(e => gsap.set(e.el, { opacity: 0 }));

    // Create ghost clones
    const renderOrder = selEntries.map((_, i) => i).reverse();
    const ghosts: HTMLDivElement[] = [];

    for (const i of renderOrder) {
      const entry = selEntries[i];
      const src   = srcRects[i];
      const deck  = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
      const ghost = document.createElement('div');
      const br    = getComputedStyle(entry.el).borderRadius;

      ghost.style.cssText = [
        'position:absolute',
        `left:${src.left}px`, `top:${src.top}px`,
        `width:${src.width}px`, `height:${src.height}px`,
        `border-radius:${br}`,
        'overflow:hidden',
        `z-index:${deck.zIndex}`,
        'pointer-events:none',
        'background:#0d0820',
        'box-shadow:0 0 0 2px rgba(255,255,255,0.82),0 20px 60px rgba(0,0,0,0.65),0 0 48px 4px rgba(140,100,240,0.15)',
        'transform-origin:center center',
        'will-change:transform,left,top,opacity',
      ].join(';');

      if (entry.opt.image) {
        ghost.style.backgroundImage   = `url(${entry.opt.image})`;
        ghost.style.backgroundSize    = 'cover';
        ghost.style.backgroundPosition = 'center';
      }

      const grad = document.createElement('div');
      grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(4,2,14,0.85) 0%,rgba(4,2,14,0.2) 55%,transparent 75%)';
      ghost.appendChild(grad);

      const badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border:2px solid rgba(255,255,255,0.9);font-size:13px;font-weight:800;color:#111;z-index:3';
      badge.textContent = '✓';
      ghost.appendChild(badge);

      const label = document.createElement('div');
      label.style.cssText = 'position:absolute;bottom:16px;left:18px;right:18px;z-index:2;font-size:18px;font-weight:700;color:#fff;font-family:"Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-0.01em;text-shadow:0 1px 8px rgba(0,0,0,0.8)';
      label.textContent = entry.opt.label;
      ghost.appendChild(label);

      flyLayer.appendChild(ghost);
      ghosts[i] = ghost;
    }

    const FLIGHT      = 0.62;
    const EASE_FLIGHT = 'power3.inOut';
    const SETTLE      = 0.38;
    const EASE_SETTLE = 'back.out(1.3)';
    const isMultiSel  = selEntries.length > 1;

    selEntries.forEach((_, i) => {
      const ghost = ghosts[i];
      const deck  = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
      const flightDelay = isMultiSel ? (selEntries.length - 1 - i) * 0.06 : 0;

      gsap.to(ghost, {
        left: tLeft, top: tTop, width: tW, height: tH,
        duration: FLIGHT, ease: EASE_FLIGHT, delay: flightDelay,
        onComplete: () => {
          if (!isMultiSel) return;
          gsap.to(ghost, { x: deck.x, y: deck.y, rotate: deck.rotate, scale: deck.scale, opacity: deck.opacity, duration: SETTLE, ease: EASE_SETTLE });
        },
      });
    });

    const agentTop = tTop + tH + 32;
    setCelebAgentTop(agentTop);

    const totalFlightMs = (FLIGHT + Math.max(0, (selEntries.length - 1) * 0.06) + (isMultiSel ? SETTLE : 0) + 0.18) * 1000;
    const t1 = setTimeout(() => {
      if (!celebAgentRef.current) return;
      gsap.fromTo(celebAgentRef.current,
        { opacity: 0, y: 18, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0)',  duration: 0.48, ease: 'power3.out',
          onComplete: () => setReplyPlaying(true) }
      );
    }, totalFlightMs);
    timersRef.current.push(t1);

    // After reply finishes, call onDone (reply component calls back via onReplyDone → onDone)
    // Reset replyPlaying when cleanup is called
  }, []);

  return { flyLayerRef, celebAgentRef, celebAgentTop, replyPlaying, triggerFlip, cleanup };
}
