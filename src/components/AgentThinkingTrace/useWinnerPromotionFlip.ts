import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* ─────────────────────────────────────────────────────────────────────────────
   WINNER PROMOTION FLIP — the promoted card visibly flies from wherever it
   sits in the analysis grid (could be #2, #7, anywhere) to the rail's
   position-#1 slot, instead of the instant array-reorder + layout-mode
   switch that used to make it look like a teleport.

   Modeled directly on the codebase's own established manual-FLIP convention
   (src/components/Calibration/useSetupFlip.ts / flipCenterStage.ts): clone a
   ghost at the captured source rect, `gsap.to()` its box (left/top/width/
   height only — never `transform`/`scale`, which stay free for the real
   card's own state-driven CSS emphasis and would otherwise fight a
   transform-based tween), then hand off to the real node once it lands. Not
   the gsap/Flip plugin — no prior use of it exists in this codebase to stay
   consistent with, and this is a single node moving to one known
   destination, not a multi-item shared-layout recompose.

   The destination (rail position #1) is computed analytically from the
   canvas/rail layout constants Level2Experience already owns, rather than
   read from the real DOM post-render — avoids any dependency on exactly
   when React has committed the reordered layout.
   ───────────────────────────────────────────────────────────────────────────── */

const FLIGHT_DURATION = 0.85;
const FLIGHT_EASE = 'power3.inOut';

export function useWinnerPromotionFlip(params: {
  promotedId: string | undefined;
  isResolved: boolean;
  /** Rail card footprint (matches .att-l2-card--crystallized). Position is
   *  read from `canvasRef` at flight time instead of hardcoded, since the
   *  rail's first slot sits flush at the canvas's own top-left — measuring
   *  it live is robust to any future layout/viewport change instead of
   *  duplicating CSS constants that could drift out of sync. */
  railCardWidth: number;
  railCardHeight: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  flyLayerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { promotedId, isResolved, railCardWidth, railCardHeight, canvasRef, flyLayerRef } = params;

  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastRectRef = useRef<DOMRect | null>(null);
  const wasResolvedRef = useRef(false);

  const registerCardNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  // Continuously refresh "last known position of the currently-promoted
  // card while still in analysis mode" on every relevant commit, so the
  // instant isResolved flips true there's already a valid, fresh "before"
  // rect to fly from — no risk of reading stale/missing layout.
  useEffect(() => {
    if (isResolved || !promotedId) return;
    const el = nodeRefs.current.get(promotedId);
    if (el) lastRectRef.current = el.getBoundingClientRect();
  });

  useLayoutEffect(() => {
    const justResolved = isResolved && !wasResolvedRef.current;
    wasResolvedRef.current = isResolved;
    if (!justResolved || !promotedId) return;

    const realEl = nodeRefs.current.get(promotedId);
    const before = lastRectRef.current;
    const flyLayer = flyLayerRef.current;
    const canvas = canvasRef.current;
    if (!realEl || !before || !flyLayer || !canvas) return; // graceful no-op: real card just renders in place

    const canvasRect = canvas.getBoundingClientRect();
    const destination = { left: canvasRect.left, top: canvasRect.top, width: railCardWidth, height: railCardHeight };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      // Minimal motion per spec: no large movement, just a soft fade-in at
      // the real (already-laid-out) position.
      gsap.fromTo(realEl, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
      return;
    }

    const ghost = realEl.cloneNode(true) as HTMLDivElement;
    ghost.style.cssText = [
      'position:fixed',
      `left:${before.left}px`,
      `top:${before.top}px`,
      `width:${before.width}px`,
      `height:${before.height}px`,
      'margin:0',
      'scale:1',
      'translate:0',
      'transform:none',
      'transition:none',
      'animation:none',
      'pointer-events:none',
      'z-index:60',
    ].join(';');
    flyLayer.appendChild(ghost);

    realEl.style.opacity = '0';

    gsap.to(ghost, {
      left: destination.left,
      top: destination.top,
      width: destination.width,
      height: destination.height,
      duration: FLIGHT_DURATION,
      ease: FLIGHT_EASE,
      onComplete: () => {
        ghost.remove();
        gsap.to(realEl, { opacity: 1, duration: 0.25, ease: 'power1.out' });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResolved, promotedId]);

  return { registerCardNode };
}
