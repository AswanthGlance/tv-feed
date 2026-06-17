/**
 * flipCenterStage — reusable FLIP animation for setup question screens.
 * Mirrors InterstitialQuestion's FLIP technique exactly.
 *
 * The `el` on each FlipCard must be the outer wrapper div (column flex).
 * We capture the FIRST CHILD (image container) for the rect and border-radius
 * so the ghost matches the visible card image — not the full column wrapper.
 */
import { gsap } from 'gsap';

export type FlipCard = {
  id: string;
  label: string;
  image?: string;
  el: HTMLDivElement;
};

type FlipOptions = {
  selectedCards: FlipCard[];
  unselectedEls: HTMLDivElement[];
  flyLayer: HTMLDivElement;
  root: HTMLDivElement;
  questionEl: HTMLElement | null;
  actionsEl: HTMLElement | null;
  subtitleEl: HTMLElement | null;
  onAgentReady: (agentTop: number) => void;
};

const DECK_OFFSETS = [
  { rotate: -2, x:  0, y:  0, scale: 1.00, opacity: 1.00, zIndex: 53 },
  { rotate:  5, x: 10, y: 10, scale: 0.97, opacity: 0.90, zIndex: 52 },
  { rotate: -7, x: -8, y: 18, scale: 0.94, opacity: 0.75, zIndex: 51 },
];

export function flipCenterStage(opts: FlipOptions): void {
  const { selectedCards, unselectedEls, flyLayer, root, questionEl, actionsEl, subtitleEl, onAgentReady } = opts;

  const rootRect = root.getBoundingClientRect();

  // For each selected card, capture the IMAGE CONTAINER (first child div), not the outer wrapper.
  // This is the element with overflow:hidden and border-radius that visually represents the card.
  const imgContainers = selectedCards.map(c => {
    const imgBox = c.el.firstElementChild as HTMLDivElement | null;
    return imgBox ?? c.el;
  });

  const srcRects = imgContainers.map(box => {
    const r = box.getBoundingClientRect();
    return { left: r.left - rootRect.left, top: r.top - rootRect.top, width: r.width, height: r.height };
  });

  const cardW = srcRects[0].width;
  const cardH = srcRects[0].height;

  const SW = root.offsetWidth;
  const SH = root.offsetHeight;
  const AGENT_BLOCK = 200;
  const HEADER_H    = 72;
  const available   = SH - HEADER_H - AGENT_BLOCK - 32;
  const sc    = cardH > available ? available / cardH : 1.0;
  const tW    = cardW * sc;
  const tH    = cardH * sc;
  const tTop  = HEADER_H + Math.max(24, (available - tH) / 2);
  const tLeft = (SW - tW) / 2;

  // Exit question UI
  if (questionEl) gsap.to(questionEl, { opacity: 0, duration: 0.28, ease: 'power2.in' });
  const otherEls = [actionsEl, subtitleEl].filter(Boolean);
  if (otherEls.length) gsap.to(otherEls, { opacity: 0, duration: 0.28, ease: 'power2.in' });

  // Fade unselected — target the full wrapper div of each unselected card
  if (unselectedEls.length) {
    gsap.to(unselectedEls, { opacity: 0, scale: 0.82, y: 10, duration: 0.3, ease: 'power2.in', stagger: 0.06 });
  }

  // Hide originals (the outer wrapper hides the whole column)
  selectedCards.forEach(c => gsap.set(c.el, { opacity: 0 }));

  // Create ghost clones — one per selected card, based on image container rect
  const renderOrder = selectedCards.map((_, i) => i).reverse();
  const ghosts: HTMLDivElement[] = [];

  for (const i of renderOrder) {
    const card    = selectedCards[i];
    const imgBox  = imgContainers[i];
    const src     = srcRects[i];
    const deck    = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
    const br      = getComputedStyle(imgBox).borderRadius;
    const ghost   = document.createElement('div');

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

    if (card.image) {
      ghost.style.backgroundImage    = `url(${card.image})`;
      ghost.style.backgroundSize     = 'cover';
      ghost.style.backgroundPosition = 'center';
    }

    const grad = document.createElement('div');
    grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(4,2,14,0.85) 0%,rgba(4,2,14,0.2) 55%,transparent 75%)';
    ghost.appendChild(grad);

    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border:2px solid rgba(255,255,255,0.9);font-size:13px;font-weight:800;color:#111;z-index:3';
    badge.textContent = '✓';
    ghost.appendChild(badge);

    const lbl = document.createElement('div');
    lbl.style.cssText = 'position:absolute;bottom:16px;left:18px;right:18px;z-index:2;font-size:18px;font-weight:700;color:#fff;font-family:"Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-0.01em;text-shadow:0 1px 8px rgba(0,0,0,0.8)';
    lbl.textContent = card.label;
    ghost.appendChild(lbl);

    flyLayer.appendChild(ghost);
    ghosts[i] = ghost;
  }

  const FLIGHT      = 0.62;
  const EASE_FLIGHT = 'power3.inOut';
  const SETTLE      = 0.38;
  const EASE_SETTLE = 'back.out(1.3)';
  const isMultiSel  = selectedCards.length > 1;

  selectedCards.forEach((_, i) => {
    const ghost = ghosts[i];
    const deck  = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
    const flightDelay = isMultiSel ? (selectedCards.length - 1 - i) * 0.06 : 0;
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
  const totalFlightMs = (FLIGHT + Math.max(0, (selectedCards.length - 1) * 0.06) + (isMultiSel ? SETTLE : 0) + 0.18) * 1000;
  setTimeout(() => onAgentReady(agentTop), totalFlightMs);
}
