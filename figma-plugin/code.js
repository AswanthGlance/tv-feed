/**
 * Glance L0 Templates — Figma Plugin
 *
 * Creates three editable 1920×1080 frames representing the final resting
 * state of each L0 layout variant (left / center / right).
 *
 * All layers are named for easy selection and editing in Figma.
 */

const W = 1920, H = 1080, FRAME_GAP = 120;

/* ── colour helpers ──────────────────────────────────────────────────────── */
function rgb(r, g, b, a) {
  if (a === undefined) a = 1;
  return [{ type: 'SOLID', color: { r: r / 255, g: g / 255, b: b / 255 }, opacity: a }];
}
function rgba_fill(r, g, b, a) { return rgb(r, g, b, a); }

function grad_linear(stops, transform) {
  return [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: transform || [[1, 0, 0], [0, 1, 0]],
    gradientStops: stops,
  }];
}

/* ── primitive builders ──────────────────────────────────────────────────── */
function rect(parent, name, x, y, w, h, fills, opts) {
  const n = figma.createRectangle();
  n.name = name;
  n.x = x; n.y = y;
  n.resize(Math.max(1, w), Math.max(1, h));
  n.fills = fills || [];
  if (opts && opts.cornerRadius) n.cornerRadius = opts.cornerRadius;
  if (opts && opts.opacity !== undefined) n.opacity = opts.opacity;
  if (opts && opts.effects) n.effects = opts.effects;
  parent.appendChild(n);
  return n;
}

function frame(parent, name, x, y, w, h, fills, opts) {
  const n = figma.createFrame();
  n.name = name;
  n.x = x; n.y = y;
  n.resize(Math.max(1, w), Math.max(1, h));
  n.fills = fills || [];
  n.clipsContent = true;
  if (opts && opts.cornerRadius) n.cornerRadius = opts.cornerRadius;
  if (opts && opts.opacity !== undefined) n.opacity = opts.opacity;
  if (opts && opts.effects) n.effects = opts.effects;
  if (opts && opts.strokes) { n.strokes = opts.strokes; n.strokeWeight = opts.strokeWeight || 1; n.strokeAlign = 'INSIDE'; }
  parent.appendChild(n);
  return n;
}

async function text(parent, name, content, x, y, w, h, fontSize, fontWeight, fills, opts) {
  const style = fontWeight >= 700 ? 'Bold' : fontWeight >= 500 ? 'Semi Bold' : 'Regular';
  await figma.loadFontAsync({ family: 'Inter', style });
  const n = figma.createText();
  n.name = name;
  n.x = x; n.y = y;
  n.resize(Math.max(1, w), Math.max(1, h));
  try { n.fontName = { family: 'Inter', style }; } catch (_) {}
  n.characters = String(content);
  n.fontSize = fontSize;
  n.fills = fills || rgb(255, 255, 255);
  if (opts && opts.letterSpacing) n.letterSpacing = { value: opts.letterSpacing, unit: 'PERCENT' };
  if (opts && opts.textAlignHorizontal) n.textAlignHorizontal = opts.textAlignHorizontal;
  if (opts && opts.textCase) n.textCase = opts.textCase;
  if (opts && opts.lineHeight) n.lineHeight = opts.lineHeight;
  parent.appendChild(n);
  return n;
}

function separator(parent, name, x, y, w) {
  return rect(parent, name, x, y, w, 1, rgb(255, 255, 255, 0.10));
}

/* ── image fill from raw bytes ───────────────────────────────────────────── */
function imageFill(bytes) {
  if (!bytes) return rgb(20, 12, 40); // fallback purple if image missing
  const hash = figma.createImage(new Uint8Array(bytes));
  return [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: hash.hash }];
}

/* ── header (logo + weather + date + time) ───────────────────────────────── */
async function addHeader(parent) {
  const hf = frame(parent, 'Header', 88, 32, W - 176, 48, []);
  hf.clipsContent = false;

  // Logo wordmark (text stand-in — replace with /glance-logo.png in Figma)
  await text(hf, 'Logo / glance', 'glance', 0, 8, 160, 32, 28, 700, rgb(255, 255, 255, 0.92));

  // Right: weather · date · time
  const rightW = 340;
  const rf = frame(hf, 'Header / Right', W - 176 - rightW, 0, rightW, 48, []);
  rf.clipsContent = false;
  rf.layoutMode = 'HORIZONTAL';
  rf.primaryAxisAlignItems = 'CENTER';
  rf.counterAxisAlignItems = 'CENTER';
  rf.itemSpacing = 12;
  rf.paddingLeft = 0;

  await text(rf, 'Weather', '☁ 65°', 0, 0, 64, 28, 16, 500, rgb(255, 255, 255, 0.45));

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  await text(rf, 'Date', dateStr, 0, 0, 120, 28, 16, 500, rgb(255, 255, 255, 0.45));

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  await text(rf, 'Time', timeStr, 0, 0, 110, 28, 16, 500, rgb(255, 255, 255));

  return hf;
}

/* ── overlay gradients ───────────────────────────────────────────────────── */
function addOverlay(parent, alignment) {
  // Bottom scrim
  rect(parent, 'Overlay / Bottom scrim', 0, 0, W, H, grad_linear([
    { color: { r: 0, g: 0, b: 0, a: 0.90 }, position: 0 },
    { color: { r: 0, g: 0, b: 0, a: 0.50 }, position: 0.28 },
    { color: { r: 0, g: 0, b: 0, a: 0.06 }, position: 0.55 },
    { color: { r: 0, g: 0, b: 0, a: 0 },    position: 0.70 },
  ], [[0, -1, 1], [1, 0, 0]])); // bottom → top

  // Top scrim
  rect(parent, 'Overlay / Top scrim', 0, 0, W, H, grad_linear([
    { color: { r: 0, g: 0, b: 0, a: 0.62 }, position: 0 },
    { color: { r: 0, g: 0, b: 0, a: 0.22 }, position: 0.18 },
    { color: { r: 0, g: 0, b: 0, a: 0 },    position: 0.38 },
  ], [[1, 0, 0], [0, 1, 0]])); // top → down

  // Side scrim
  if (alignment === 'right') {
    rect(parent, 'Overlay / Right side scrim', 0, 0, W, H, grad_linear([
      { color: { r: 0, g: 0, b: 0, a: 0.60 }, position: 0 },
      { color: { r: 0, g: 0, b: 0, a: 0.20 }, position: 0.40 },
      { color: { r: 0, g: 0, b: 0, a: 0 },    position: 0.65 },
    ], [[-1, 0, 1], [0, 1, 0]])); // right → left
  } else {
    rect(parent, 'Overlay / Left side scrim', 0, 0, W, H, grad_linear([
      { color: { r: 0, g: 0, b: 0, a: 0.55 }, position: 0 },
      { color: { r: 0, g: 0, b: 0, a: 0.15 }, position: 0.40 },
      { color: { r: 0, g: 0, b: 0, a: 0 },    position: 0.65 },
    ], [[1, 0, 0], [0, 1, 0]])); // left → right
  }
}

/* ── tag chip ────────────────────────────────────────────────────────────── */
async function addTag(parent, tagLabel, alignment, bottomY) {
  const tagW = tagLabel.length * 9 + 32;
  const tagH = 34;
  let tagX;
  if (alignment === 'center') tagX = W / 2 - tagW / 2;
  else if (alignment === 'right') tagX = W - 88 - tagW;
  else tagX = 88;

  const tagFrame = frame(parent, 'Tag', tagX, bottomY, tagW, tagH, rgb(255, 255, 255, 0.10), {
    cornerRadius: 999,
    strokes: rgb(255, 255, 255, 0.16),
    strokeWeight: 1,
  });
  await text(tagFrame, 'Tag / Label', tagLabel, 16, 9, tagW - 32, 16, 12, 700,
    rgb(255, 255, 255, 0.78), { letterSpacing: 11, textCase: 'UPPER', textAlignHorizontal: 'CENTER' });
  return tagFrame;
}

/* ── title ───────────────────────────────────────────────────────────────── */
async function addTitle(parent, titleText, alignment, bottomY) {
  // Final small size at 1920px wide
  const sizes = { left: 58, center: 46, right: 44 };
  const fs = sizes[alignment];
  const maxWidths = { left: 860, center: 1100, right: 1100 };
  const mw = maxWidths[alignment];

  let x;
  if (alignment === 'center') x = W / 2 - mw / 2;
  else if (alignment === 'right') x = W - 88 - mw;
  else x = 88;

  const align = alignment === 'center' ? 'CENTER' : alignment === 'right' ? 'RIGHT' : 'LEFT';
  const h = Math.ceil(fs * 1.1);

  const n = await text(parent, 'Title', titleText, x, bottomY, mw, h, fs, 800,
    rgb(255, 255, 255, 0.95), { textAlignHorizontal: align, letterSpacing: -2.8 });
  return n;
}

/* ── reasoning text ──────────────────────────────────────────────────────── */
async function addReasoning(parent, reasoningText, alignment, bottomY) {
  const maxWidths = { left: 680, center: 620, right: 860 };
  const mw = maxWidths[alignment];
  const lines = reasoningText.includes('. ') ? 2 : 1;
  const fs = 20;

  let x;
  if (alignment === 'center') x = W / 2 - mw / 2;
  else if (alignment === 'right') x = W - 88 - mw;
  else x = 88;

  const align = alignment === 'center' ? 'CENTER' : alignment === 'right' ? 'RIGHT' : 'LEFT';

  const n = await text(parent, 'Reasoning', reasoningText, x, bottomY, mw, lines * 36, fs, 400,
    rgb(255, 255, 255, 0.78), { textAlignHorizontal: align, lineHeight: { value: 175, unit: 'PERCENT' } });
  return n;
}

/* ── mascot circle (CTA pill icon) ───────────────────────────────────────── */
function addMascotCircle(parent, x, y, size) {
  const c = rect(parent, 'Mascot (replace with Rive PNG)', x, y, size, size, [
    {
      type: 'GRADIENT_RADIAL',
      gradientTransform: [[0.6, 0, 0.2], [0, 0.6, 0.2]],
      gradientStops: [
        { color: { r: 0.608, g: 0.431, b: 0.910, a: 1 }, position: 0 },
        { color: { r: 0.353, g: 0.180, b: 0.733, a: 1 }, position: 1 },
      ],
    },
  ]);
  c.cornerRadius = size / 2;
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.44, g: 0.278, b: 0.886, a: 0.45 }, offset: { x: 0, y: 0 }, radius: 18, spread: 0, visible: true, blendMode: 'NORMAL' }];
  return c;
}

/* ── CTA pill ────────────────────────────────────────────────────────────── */
async function addCTA(parent, ctaLabel, alignment, bottomY) {
  const labelW = ctaLabel.length * 11 + 16;
  const pillW = 52 + 10 + labelW + 24; // mascot + gap + label + right-pad
  const pillH = 64;

  let pillX;
  if (alignment === 'center') pillX = W / 2 - pillW / 2;
  else if (alignment === 'right') pillX = W - 88 - pillW;
  else pillX = 88;

  const pill = frame(parent, 'CTA Pill', pillX, bottomY, pillW, pillH,
    rgb(255, 255, 255, 0.95), {
      cornerRadius: 999,
      effects: [{
        type: 'DROP_SHADOW',
        color: { r: 0.44, g: 0.278, b: 0.886, a: 0.38 },
        offset: { x: 0, y: 0 }, radius: 32, spread: 8,
        visible: true, blendMode: 'NORMAL',
      }],
    });

  addMascotCircle(pill, 6, 6, 52);

  await text(pill, 'CTA / Label', ctaLabel, 68, 20, labelW, 26, 20, 600, rgb(17, 17, 17));

  return pill;
}

/* ── product cards (stacked) ─────────────────────────────────────────────── */
async function addProductCards(parent, labels) {
  const TILE = 96;
  const TILE_BR = 18;
  const BOTTOM = 56;
  const right = 60;

  // card 1 (back) — rotated 7°, offset (10, -3), scale 0.96
  const card1 = frame(parent, 'Product Card 2 (back) / ' + labels[1], W - right - TILE, H - BOTTOM - TILE, TILE, TILE,
    grad_linear([
      { color: { r: 0.102, g: 0.376, b: 0.271, a: 1 }, position: 0 },
      { color: { r: 0.165, g: 0.561, b: 0.384, a: 1 }, position: 0.55 },
      { color: { r: 0.239, g: 0.722, b: 0.510, a: 1 }, position: 1 },
    ], [[0.9, 0.3, 0], [-0.3, 0.9, 0]]),
    { cornerRadius: TILE_BR, strokes: rgb(255, 255, 255, 0.85), strokeWeight: 2.5 });
  card1.rotation = 7;
  card1.x = W - right - TILE + 10;
  card1.y = H - BOTTOM - TILE - 3;

  const label1Bg = frame(card1, 'Label bg', 0, TILE - 28, TILE, 28, grad_linear([
    { color: { r: 0, g: 0, b: 0, a: 0.72 }, position: 0 },
    { color: { r: 0, g: 0, b: 0, a: 0 }, position: 1 },
  ], [[0, -1, 1], [1, 0, 0]]));
  await text(label1Bg, 'Label', labels[1], 4, 6, TILE - 8, 16, 10, 700,
    rgb(255, 255, 255, 0.94), { textCase: 'UPPER', textAlignHorizontal: 'CENTER' });

  // card 0 (front) — upright, on top
  const card0 = frame(parent, 'Product Card 1 (front) / ' + labels[0], W - right - TILE, H - BOTTOM - TILE, TILE, TILE,
    grad_linear([
      { color: { r: 0.769, g: 0.369, b: 0.102, a: 1 }, position: 0 },
      { color: { r: 0.910, g: 0.525, b: 0.227, a: 1 }, position: 0.55 },
      { color: { r: 0.941, g: 0.627, b: 0.376, a: 1 }, position: 1 },
    ], [[0.9, 0.3, 0], [-0.3, 0.9, 0]]),
    { cornerRadius: TILE_BR, strokes: rgb(255, 255, 255, 0.96), strokeWeight: 2.5 });

  const label0Bg = frame(card0, 'Label bg', 0, TILE - 28, TILE, 28, grad_linear([
    { color: { r: 0, g: 0, b: 0, a: 0.72 }, position: 0 },
    { color: { r: 0, g: 0, b: 0, a: 0 }, position: 1 },
  ], [[0, -1, 1], [1, 0, 0]]));
  await text(label0Bg, 'Label', labels[0], 4, 6, TILE - 8, 16, 10, 700,
    rgb(255, 255, 255, 0.94), { textCase: 'UPPER', textAlignHorizontal: 'CENTER' });
}

/* ── per-template data ───────────────────────────────────────────────────── */
const TEMPLATES = {
  left: {
    frameName: '01 Left Template',
    tagLabel: 'BANGALORE',
    title: 'Eatly at dawn',
    reasoning: "Bangalore's South Indian breakfast culture ran through your local, comfort-first picks. That's what surfaced this.",
    ctaLabel: 'Show me what makes this special',
    alignment: 'left',
    showProducts: true,
    productLabels: ['Masala Dosa', 'Filter Coffee'],
    imageKey: 'left',
  },
  center: {
    frameName: '02 Center Template',
    tagLabel: 'STYLE PICK',
    title: 'Luxury Flatlay',
    reasoning: "Your recent style picks keep pointing toward luxury fashion. This edit caught that direction exactly.",
    ctaLabel: 'Show me the full look',
    alignment: 'center',
    showProducts: true,
    productLabels: ['Luxury Fashion', 'Accessories'],
    imageKey: 'center',
  },
  right: {
    frameName: '03 Right Template',
    tagLabel: 'WELLNESS PICK',
    title: 'Surf Morning',
    reasoning: "Your surf and outdoor wellness interest came through clearly in your picks. This surfaced because the signals aligned well.",
    ctaLabel: 'Tell me more about this',
    alignment: 'right',
    showProducts: false,
    productLabels: [],
    imageKey: 'right',
  },
};

/* ── build one frame ─────────────────────────────────────────────────────── */
async function buildFrame(templateId, imageBytes, frameX) {
  const t = TEMPLATES[templateId];
  const mainFrame = frame(figma.currentPage, t.frameName, frameX, 0, W, H, []);
  mainFrame.clipsContent = true;

  // 1. Background image
  const bgFills = imageBytes ? imageFill(imageBytes) : rgb(8, 4, 20);
  rect(mainFrame, 'Background / Image', 0, 0, W, H, bgFills);

  // 2. Overlays
  addOverlay(mainFrame, t.alignment);

  // 3. Header
  await addHeader(mainFrame);

  // 4. Content group — positioned from bottom
  const BOTTOM = 56;
  const CTA_H = 64;
  const REASONING_H = 72;
  const TITLE_MARGIN = 18;
  const TAG_MARGIN = 12;
  const TAG_H = 34;
  const CTA_BOTTOM = H - BOTTOM;
  const REASONING_BOTTOM = CTA_BOTTOM - CTA_H - 32;
  const TITLE_BOTTOM = REASONING_BOTTOM - REASONING_H - TITLE_MARGIN;
  const TAG_BOTTOM = TITLE_BOTTOM - TAG_H - TAG_MARGIN;

  const titleSizes = { left: 58, center: 46, right: 44 };
  const TITLE_H_ACTUAL = titleSizes[t.alignment] + 4;
  const TITLE_Y = TITLE_BOTTOM - TITLE_H_ACTUAL;

  await addTag(mainFrame, t.tagLabel, t.alignment, TAG_BOTTOM - TAG_H);
  await addTitle(mainFrame, t.title, t.alignment, TITLE_Y);
  await addReasoning(mainFrame, t.reasoning, t.alignment, REASONING_BOTTOM - REASONING_H);
  await addCTA(mainFrame, t.ctaLabel, t.alignment, CTA_BOTTOM - CTA_H);

  // 5. Product cards
  if (t.showProducts) {
    await addProductCards(mainFrame, t.productLabels);
  }

  return mainFrame;
}

/* ── message handler ─────────────────────────────────────────────────────── */
figma.showUI(__html__, { width: 260, height: 420, title: 'Glance L0 Templates' });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'create-frames') return;

  try {
    // Load fonts up front
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    const order = ['left', 'center', 'right'].filter(id => msg.selected.includes(id));
    let xOffset = 0;

    // Remove existing frames with same names to allow re-running
    const existing = figma.currentPage.children.filter(
      c => order.map(id => TEMPLATES[id].frameName).includes(c.name)
    );
    existing.forEach(c => c.remove());

    for (const id of order) {
      figma.ui.postMessage({ type: 'progress', text: `Building ${TEMPLATES[id].frameName}…` });
      const bytes = msg.imageData[id] || null;
      await buildFrame(id, bytes, xOffset);
      xOffset += W + FRAME_GAP;
    }

    figma.viewport.scrollAndZoomIntoView(
      figma.currentPage.children.filter(c => order.map(id => TEMPLATES[id].frameName).includes(c.name))
    );

    const count = order.length;
    figma.ui.postMessage({ type: 'done', text: `${count} frame${count > 1 ? 's' : ''} created.` });
  } catch (e) {
    figma.ui.postMessage({ type: 'error', text: String(e) });
  }
};
