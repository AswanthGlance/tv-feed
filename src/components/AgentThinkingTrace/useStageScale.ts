import { useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   /agent_thinking_trace — fit the 1920×1080 stage to the viewport.

   Every coordinate, font size and card dimension in this route is authored
   against a fixed 1920×1080 canvas. Without a scale step the stage simply
   drew at those numbers inside whatever the window actually was, so on any
   display narrower than 1920 the composition overflowed: type looked
   oversized and the edges were cropped — which also made centred elements
   read as off-centre, because the visible area was not the centre of the
   canvas.

   This is the same fit that /l1-scenarios already does in its own ScaleSync
   (scale = min(vw/1920, vh/1080)), applied here so BOTH the thinking phase
   and the L1 final response — which is mounted inside this stage — are
   measured against the same canvas.

   `--l1s-hairline` is written for the same reason ScaleSync writes it: a 2px
   hairline inside a scaled stage would render thinner than a hairline, so it
   is pre-divided by the scale to come out at ~2 device px.
   ───────────────────────────────────────────────────────────────────────────── */

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function useStageScale() {
  useEffect(() => {
    const apply = () => {
      const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      const root = document.documentElement;
      root.style.setProperty('--att-scale', String(scale));
      root.style.setProperty('--l1s-hairline', `${2 / scale}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
}
