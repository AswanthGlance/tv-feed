/* ──────────────────────────────────────────────────────────────────────────
   Glance Setup Flow — Standalone JS
   Vanilla JS equivalent of all React+GSAP logic.
   Requires GSAP 3 loaded before this script.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Scale stage to fit viewport ─────────────────────────────────────────── */
function scaleStage() {
  const stage = document.getElementById('stage');
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  const scale  = Math.min(scaleX, scaleY);
  const offX   = (window.innerWidth  - 1920 * scale) / 2;
  const offY   = (window.innerHeight - 1080 * scale) / 2;
  stage.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
}
window.addEventListener('resize', scaleStage);
scaleStage();


/* ── CinematicText ───────────────────────────────────────────────────────── */

/**
 * Populates an element with .cr-char spans and animates them blur→sharp.
 * @param {HTMLElement} containerEl  — element with .cr-text class
 * @param {string}      text
 * @param {object}      opts
 * @param {number}      opts.speed    stagger between chars (default 0.028)
 * @param {number}      opts.duration per-char resolve duration (default 0.40)
 * @param {number}      opts.delay    initial delay (default 0)
 * @param {Function}    opts.onDone   fires when last char resolves
 * @returns {gsap.core.Timeline}
 */
function cinematicText(containerEl, text, opts) {
  if (!containerEl) return null;
  const speed    = opts.speed    ?? 0.028;
  const duration = opts.duration ?? 0.40;
  const delay    = opts.delay    ?? 0;
  const onDone   = opts.onDone   ?? null;

  // Build char spans
  containerEl.innerHTML = '';
  Array.from(text).forEach(ch => {
    const span = document.createElement('span');
    span.className = 'cr-char' + (ch === ' ' ? ' cr-space' : '');
    span.style.display = 'inline';
    if (ch === ' ') span.style.whiteSpace = 'pre';
    span.textContent = ch;
    containerEl.appendChild(span);
  });

  const chars = containerEl.querySelectorAll('.cr-char');
  gsap.set(chars, { opacity: 0, filter: 'blur(12px)' });

  const tl = gsap.timeline({ delay, onComplete: () => onDone && onDone() });
  tl.to(chars, {
    opacity: 1,
    filter: 'blur(0px)',
    duration,
    stagger: speed,
    ease: 'power2.out',
  });
  return tl;
}


/* ── SetupStructuredReply ────────────────────────────────────────────────── */

/**
 * Renders 3 lines of cinematic acknowledgement into replyEl.
 * @param {HTMLElement} replyEl
 * @param {string[]}    lines    [line0, line1, line2]
 * @param {Function}    onDone
 */
function setupStructuredReply(replyEl, lines, onDone) {
  replyEl.innerHTML = '';
  const SPEED    = [0.032, 0.040, 0.032];
  const DURATION = [0.36,  0.42,  0.36 ];
  const PAUSES   = [550,   450,   0    ];

  const lineEls = lines.map((text, i) => {
    const wrap = document.createElement('div');
    wrap.className = `reply-line reply-line-${i}`;
    const span = document.createElement('span');
    const textSpan = document.createElement('span');
    textSpan.className = 'cr-text';
    span.appendChild(textSpan);
    wrap.appendChild(span);
    replyEl.appendChild(wrap);
    return { wrap, textSpan, text };
  });

  let doneCount = 0;

  function playLine(i) {
    if (i >= lines.length) return;
    const { wrap, textSpan, text } = lineEls[i];

    // Reveal line container
    wrap.classList.add('visible');

    cinematicText(textSpan, text, {
      speed: SPEED[i],
      duration: DURATION[i],
      onDone: () => {
        doneCount++;
        if (i < 2) {
          setTimeout(() => playLine(i + 1), PAUSES[i]);
        } else {
          setTimeout(() => onDone && onDone(), 800);
        }
      },
    });
  }

  playLine(0);
}


/* ── flipCenterStage ─────────────────────────────────────────────────────── */

/**
 * FLIP animation: selected cards fly to center; unselected fade out.
 * Matches React flipCenterStage.ts exactly.
 */
function flipCenterStage(opts) {
  const {
    selectedCards,    // [{id, label, image, el}]
    unselectedEls,    // [HTMLDivElement, ...]
    flyLayer,
    root,
    questionEl,
    actionsEl,
    subtitleEl,
    onAgentReady,
  } = opts;

  const rootRect = root.getBoundingClientRect();

  // Capture image container (firstElementChild) rect
  const imgContainers = selectedCards.map(c => {
    const imgBox = c.el.firstElementChild;
    return imgBox || c.el;
  });

  const srcRects = imgContainers.map(box => {
    const r = box.getBoundingClientRect();
    return {
      left: r.left - rootRect.left,
      top:  r.top  - rootRect.top,
      width: r.width,
      height: r.height,
    };
  });

  const cardW = srcRects[0].width;
  const cardH = srcRects[0].height;

  const SW = root.offsetWidth;
  const SH = root.offsetHeight;
  const AGENT_BLOCK = 200;
  const HEADER_H    = 72;
  const available   = SH - HEADER_H - AGENT_BLOCK - 32;
  const sc   = cardH > available ? available / cardH : 1.0;
  const tW   = cardW * sc;
  const tH   = cardH * sc;
  const tTop  = HEADER_H + Math.max(24, (available - tH) / 2);
  const tLeft = (SW - tW) / 2;

  // Exit question UI
  if (questionEl) gsap.to(questionEl, { opacity: 0, duration: 0.28, ease: 'power2.in' });
  const others = [actionsEl, subtitleEl].filter(Boolean);
  if (others.length) gsap.to(others, { opacity: 0, duration: 0.28, ease: 'power2.in' });

  // Fade unselected
  if (unselectedEls.length) {
    gsap.to(unselectedEls, { opacity: 0, scale: 0.82, y: 10, duration: 0.3, ease: 'power2.in', stagger: 0.06 });
  }

  // Hide originals
  selectedCards.forEach(c => gsap.set(c.el, { opacity: 0 }));

  const DECK_OFFSETS = [
    { rotate: -2, x:  0, y:  0, scale: 1.00, opacity: 1.00, zIndex: 53 },
    { rotate:  5, x: 10, y: 10, scale: 0.97, opacity: 0.90, zIndex: 52 },
    { rotate: -7, x: -8, y: 18, scale: 0.94, opacity: 0.75, zIndex: 51 },
  ];

  const renderOrder  = selectedCards.map((_, i) => i).reverse();
  const ghosts       = [];
  const isMultiSel   = selectedCards.length > 1;

  for (const i of renderOrder) {
    const card   = selectedCards[i];
    const imgBox = imgContainers[i];
    const src    = srcRects[i];
    const deck   = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
    const br     = getComputedStyle(imgBox).borderRadius;
    const ghost  = document.createElement('div');

    Object.assign(ghost.style, {
      position:     'absolute',
      left:         src.left + 'px',
      top:          src.top  + 'px',
      width:        src.width  + 'px',
      height:       src.height + 'px',
      borderRadius: br,
      overflow:     'hidden',
      zIndex:       String(deck.zIndex),
      pointerEvents:'none',
      background:   '#0d0820',
      boxShadow:    '0 0 0 2px rgba(255,255,255,0.82),0 20px 60px rgba(0,0,0,0.65),0 0 48px 4px rgba(140,100,240,0.15)',
      transformOrigin: 'center center',
      willChange:   'transform,left,top,opacity',
    });

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


/* ══════════════════════════════════════════════════════════════════════════
   SCREEN STATE MACHINE
   currentScreen: string
   Screens: 'welcome' | 'bangalore' | 'tv-content' | 'audience' | 'show-more' | 'weekend' | 'style' | 'done'
═══════════════════════════════════════════════════════════════════════════ */

let currentScreen = 'welcome';
const SCREEN_IDS = {
  'welcome':     'screen-welcome',
  'bangalore':   'screen-bangalore',
  'tv-content':  'screen-tv-content',
  'audience':    'screen-audience',
  'show-more':   'screen-show-more',
  'weekend':     'screen-weekend',
  'style':       'screen-style',
  'done':        'screen-done',
};

function showScreen(name) {
  Object.entries(SCREEN_IDS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = key === name ? '' : 'none';
  });
  currentScreen = name;
}

function goToScreen(name) {
  // Fade out current
  const curId = SCREEN_IDS[currentScreen];
  const curEl = curId ? document.getElementById(curId) : null;
  if (curEl) {
    gsap.to(curEl, {
      opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        curEl.style.opacity = '';
        showScreen(name);
        initScreen(name);
      },
    });
  } else {
    showScreen(name);
    initScreen(name);
  }
}

function skipToEnd() {
  goToScreen('done');
}

function restartFlow() {
  // Reset all multi-select state
  ['tvc','sm','wkd','sty'].forEach(pfx => {
    resetMultiSelect(pfx);
  });
  smExpanded = false;
  document.querySelectorAll('.sm-extra').forEach(el => el.style.display = 'none');
  const exploreBtn = document.getElementById('sm-explore-btn');
  if (exploreBtn) {
    exploreBtn.style.display = '';
    exploreBtn.querySelector('span').textContent = 'Explore more';
  }
  goToScreen('welcome');
}

function initScreen(name) {
  switch (name) {
    case 'welcome':   initWelcome();    break;
    case 'bangalore': initBangalore();  break;
    case 'tv-content':initTVContent();  break;
    case 'audience':  initAudience();   break;
    case 'show-more': initShowMore();   break;
    case 'weekend':   initWeekend();    break;
    case 'style':     initStyle();      break;
    case 'done':      initDone();       break;
  }
}


/* ══════════════════════════════════════════════════════════════════════════
   WELCOME SCREEN
═══════════════════════════════════════════════════════════════════════════ */

let welcomeInteractive = false;

function initWelcome() {
  welcomeInteractive = false;

  const mascot      = document.getElementById('welcome-mascot');
  const line1El     = document.getElementById('welcome-line1-text');
  const line2aEl    = document.getElementById('welcome-line2a-text');
  const line2bEl    = document.getElementById('welcome-line2b-text');
  const ctaWrap     = document.getElementById('welcome-cta');
  const ctaBtn      = document.getElementById('welcome-cta-btn');
  const skipBtn     = document.getElementById('welcome-skip-btn');
  const responseEl  = document.getElementById('welcome-response');
  const responseText= document.getElementById('welcome-response-text');
  const line1Wrap   = document.getElementById('welcome-line1');
  const line2Wrap   = document.getElementById('welcome-line2');

  // Reset state
  gsap.set([mascot, ctaWrap, skipBtn, responseEl], { opacity: 0 });
  ctaWrap.style.pointerEvents = 'none';
  skipBtn.style.pointerEvents = 'none';

  const tl = gsap.timeline();

  // Mascot enters
  tl.fromTo(mascot,
    { opacity: 0, scale: 0.55, filter: 'blur(14px)', y: 20 },
    { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 1.0, ease: 'back.out(1.5)' }
  );

  // Line 1 cinematic
  tl.call(() => {
    cinematicText(line1El, "Hello, I'm Glance.", { speed: 0.055, duration: 0.50 });
  }, [], '+=0.2');

  // Line 2a cinematic
  tl.call(() => {
    cinematicText(line2aEl, "I turn your screensaver into a feed", {
      speed: 0.040, duration: 0.42,
      onDone: () => {
        cinematicText(line2bEl, "that helps you discover something new every day.", {
          speed: 0.038, duration: 0.42,
        });
      },
    });
  }, [], '+=0.15');

  // CTA appears after text reads
  tl.call(() => {
    ctaWrap.style.pointerEvents = 'auto';
    skipBtn.style.pointerEvents = 'auto';
    gsap.fromTo(ctaWrap,
      { opacity: 0, y: 28, scale: 0.91, filter: 'blur(10px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.75, ease: 'back.out(1.3)',
        onComplete: () => { welcomeInteractive = true; }
      }
    );
    gsap.fromTo(skipBtn,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.25 }
    );
  }, [], '+=2.2');
}

function handleWelcomeCta() {
  if (!welcomeInteractive) return;
  welcomeInteractive = false;

  const ctaBtn      = document.getElementById('welcome-cta-btn');
  const line1Wrap   = document.getElementById('welcome-line1');
  const line2Wrap   = document.getElementById('welcome-line2');
  const mascot      = document.getElementById('welcome-mascot');
  const responseEl  = document.getElementById('welcome-response');
  const responseText= document.getElementById('welcome-response-text');

  const tl = gsap.timeline();

  // CTA dissolves up
  tl.to(ctaBtn, {
    background: 'rgba(255,255,255,0.10)',
    color: 'rgba(255,255,255,0.80)',
    borderRadius: '20px',
    boxShadow: 'none',
    duration: 0.2, ease: 'power2.inOut',
  }, 0)
  .to(ctaBtn, { y: -180, scale: 0.55, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0.08)

  // Intro lines fade
  .to([line1Wrap, line2Wrap],
    { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' }, 0.04
  )

  // Mascot pulse
  .to(mascot, { scale: 1.14, duration: 0.16, ease: 'power2.out' }, 0.48)
  .to(mascot, { scale: 1.0,  duration: 0.24, ease: 'back.out(2)' }, 0.64)

  // Response appears
  .fromTo(responseEl,
    { opacity: 0, y: 10, filter: 'blur(4px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out',
      onComplete: () => {
        cinematicText(responseText,
          "Let me ask you a few things to shape your feed.",
          {
            speed: 0.038, duration: 0.42,
            onDone: () => {
              setTimeout(() => {
                const exitTl = gsap.timeline({
                  onComplete: () => goToScreen('bangalore'),
                });
                exitTl.to([mascot, responseEl],
                  { opacity: 0, y: -28, scale: 0.8, duration: 0.44, ease: 'power3.in', stagger: 0.04 }, 0
                )
                .to(document.getElementById('screen-welcome'), { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.3);
              }, 500);
            },
          }
        );
      },
    }, 0.78
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   BANGALORE CONFIRM
═══════════════════════════════════════════════════════════════════════════ */

let blrInteractive = false;

function initBangalore() {
  blrInteractive = false;
  const mascot     = document.getElementById('blr-mascot');
  const questionEl = document.getElementById('blr-question');
  const questionText = document.getElementById('blr-question-text');
  const subtitleEl = document.getElementById('blr-subtitle');
  const cardsRow   = document.getElementById('blr-cards-row');
  const skipWrap   = document.getElementById('blr-skip-wrap');

  gsap.set([subtitleEl, cardsRow], { opacity: 0, y: 10 });
  gsap.set(mascot, { opacity: 0, y: -22, scale: 0.72 });
  skipWrap.style.display = 'none';

  gsap.fromTo(mascot,
    { opacity: 0, y: -22, scale: 0.72 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
      onComplete: () => {
        cinematicText(questionText, "I see you're in Bangalore — that right?", {
          speed: 0.030, duration: 0.42,
          onDone: () => {
            setTimeout(() => {
              gsap.to(subtitleEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
              gsap.fromTo(cardsRow,
                { opacity: 0, y: 36, filter: 'blur(8px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out',
                  onComplete: () => {
                    blrInteractive = true;
                    skipWrap.style.display = '';
                  }
                }
              );
            }, 280);
          },
        });
      }
    }
  );
}

const BLR_REPLIES = {
  0: ["Bengaluru.", "Good choice.", "The city's been buzzing lately."],
  1: ["Got it.", "I'll start broad.", "We can tune it as you explore."],
};

const BLR_NEXT_SCREENS = { 0: 'tv-content', 1: 'tv-content' };

function handleBangaloreSelect(idx) {
  if (!blrInteractive) return;
  blrInteractive = false;

  const root      = document.getElementById('screen-bangalore');
  const flyLayer  = document.getElementById('blr-fly-layer');
  const agentWrap = document.getElementById('blr-agent');
  const replyEl   = document.getElementById('blr-reply');
  const questionEl= document.getElementById('blr-question');
  const subtitleEl= document.getElementById('blr-subtitle');
  const cardEl    = document.getElementById(`blr-card-${idx}`);
  const otherIdx  = idx === 0 ? 1 : 0;
  const otherEl   = document.getElementById(`blr-card-${otherIdx}`);

  const cardImgs = ['assets/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg', 'assets/images/feed/feed_29-travel-goa-coastal-road.jpg'];
  const cardLabels = ['Yes, Bengaluru', 'Not quite'];

  flipCenterStage({
    selectedCards: [{ id: String(idx), label: cardLabels[idx], image: cardImgs[idx], el: cardEl }],
    unselectedEls: [otherEl],
    flyLayer,
    root,
    questionEl,
    actionsEl: null,
    subtitleEl,
    onAgentReady: (agentTop) => {
      agentWrap.style.top = agentTop + 'px';
      gsap.fromTo(agentWrap,
        { opacity: 0, y: 18, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out',
          onComplete: () => {
            setupStructuredReply(replyEl, BLR_REPLIES[idx], () => {
              setTimeout(() => {
                gsap.to(root, {
                  opacity: 0, duration: 0.5, ease: 'power2.in',
                  onComplete: () => {
                    flyLayer.innerHTML = '';
                    root.style.opacity = '';
                    goToScreen('tv-content');
                  }
                });
              }, 600);
            });
          }
        }
      );
    },
  });
}


/* ══════════════════════════════════════════════════════════════════════════
   MULTI-SELECT SCREENS (TV Content, Audience single, Show More, Weekend, Style)
   Shared logic via prefix key: 'tvc' | 'aud' | 'sm' | 'wkd' | 'sty'
═══════════════════════════════════════════════════════════════════════════ */

const MULTI_STATE = {};

function getMultiState(pfx) {
  if (!MULTI_STATE[pfx]) MULTI_STATE[pfx] = { selected: [], interactive: false };
  return MULTI_STATE[pfx];
}

function resetMultiSelect(pfx) {
  const state = getMultiState(pfx);
  state.selected = [];
  state.interactive = false;
  // Reset card visuals
  const i = document.getElementById(`${pfx}-cards-row`);
  if (!i) return;
  i.querySelectorAll('.setup-card-wrapper').forEach(el => {
    el.dataset.selected = 'false';
    el.style.transform = 'scale(0.94)';
  });
  // Reset next button
  const btn = document.getElementById(`${pfx}-next-btn`);
  if (btn) { btn.disabled = true; }
}

function initQuestionScreen(pfx, questionTextStr, mascotDelay, nextScreen, isSingle) {
  const state      = getMultiState(pfx);
  state.selected   = [];
  state.interactive= false;

  const mascot     = document.getElementById(`${pfx}-mascot`);
  const questionText = document.getElementById(`${pfx}-question-text`);
  const subtitleEl = document.getElementById(`${pfx}-subtitle`);
  const cardsRow   = document.getElementById(`${pfx}-cards-row`);
  const actionsEl  = document.getElementById(`${pfx}-actions`);
  const skipBtn    = document.getElementById(`${pfx}-skip-btn`);
  const nextBtn    = document.getElementById(`${pfx}-next-btn`);

  if (nextBtn) { nextBtn.disabled = true; }
  gsap.set([subtitleEl, cardsRow, actionsEl], { opacity: 0, y: 10 });
  gsap.set(mascot, { opacity: 0, y: -20, scale: 0.72 });
  if (skipBtn) skipBtn.style.display = 'none';

  gsap.fromTo(mascot,
    { opacity: 0, y: -20, scale: 0.72 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
      onComplete: () => {
        cinematicText(questionText, questionTextStr, {
          speed: 0.036, duration: 0.40,
          onDone: () => {
            setTimeout(() => {
              gsap.to(subtitleEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
              gsap.fromTo(cardsRow, { opacity: 0, y: 36, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' });
              if (actionsEl) {
                gsap.fromTo(actionsEl, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.18,
                  onComplete: () => {
                    state.interactive = true;
                    if (skipBtn) skipBtn.style.display = '';
                  }
                });
              } else {
                setTimeout(() => {
                  state.interactive = true;
                  if (skipBtn) skipBtn.style.display = '';
                }, 500);
              }
            }, 280);
          },
        });
      }
    }
  );
}

function toggleCard(pfx, idx) {
  const state = getMultiState(pfx);
  if (!state.interactive) return;

  const cardEl = document.getElementById(`${pfx}-card-${idx}`);
  if (!cardEl) return;

  const wasSelected = cardEl.dataset.selected === 'true';
  cardEl.dataset.selected = wasSelected ? 'false' : 'true';
  cardEl.style.transform = wasSelected ? 'scale(0.94)' : 'scale(1.06)';

  if (wasSelected) {
    state.selected = state.selected.filter(i => i !== idx);
  } else {
    state.selected.push(idx);
  }

  const nextBtn = document.getElementById(`${pfx}-next-btn`);
  if (nextBtn) {
    nextBtn.disabled = state.selected.length === 0;
  }
}

// Audience = single-select (auto-commits)
let audInteractive = false;

function initAudience() {
  audInteractive = false;
  initQuestionScreen('aud', 'Who watches this TV?', 0.6, 'show-more', true);

  // Override — audience is single-select, skip shows after question
  const state = getMultiState('aud');
  state.interactive = false; // Will be set by initQuestionScreen's inner callback
  // We need to hook into the inner completion, done via the state flag
  setTimeout(() => {
    const skipBtn = document.getElementById('aud-skip-btn');
    // The skip btn is shown by initQuestionScreen already
  }, 0);
}

function handleSingleSelect(pfx, idx) {
  const state = getMultiState(pfx);
  if (!state.interactive) return;
  state.interactive = false;
  state.selected = [idx];

  // Mark card
  const root = document.getElementById(`screen-${pfx === 'aud' ? 'audience' : pfx}`);
  const cardEl = document.getElementById(`${pfx}-card-${idx}`);
  if (cardEl) {
    cardEl.dataset.selected = 'true';
    cardEl.style.transform = 'scale(1.06)';
  }

  // Single select: immediately trigger done
  _doFlipAndReply(pfx, [idx]);
}

/* All reply line maps keyed by screen prefix */
const REPLY_MAPS = {
  tvc: {
    getLines: (sel) => {
      if (sel.length === 0) return ['All good.', 'Noted.', "I'll keep things varied and balanced."];
      if (sel.length > 1) return ['Great mix.', 'Noted.', "I'll balance all of those well."];
      const lines = {
        0: ['Sports & moments.', 'Got it.',    "I'll make sure live moments don't get buried."],
        1: ['Movies & series.',  'Got it.',    "Stories and series will have a strong presence here."],
        2: ['Music.',           'Love that.', "Performances and music will find their way in."],
        3: ['News.',            'Makes sense.',"I'll keep you in the loop without the noise."],
      };
      return lines[sel[0]] || ['All good.', 'Noted.', "I'll keep things varied."];
    },
    labels: ['Sports & big moments', 'Movies & series', 'Music & performances', 'News & infotainment'],
    images: ['assets/images/setup/setup_q1_sports.jpg','assets/images/setup/setup_q1_movies.jpg','assets/images/setup/setup_q1_music.jpg','assets/images/setup/setup_q1_news.jpg'],
    nextScreen: 'audience',
  },
  aud: {
    getLines: (sel) => {
      const lines = {
        0: ['Mostly you.',       'Got it.',     "I'll tune this closely to your personal taste."],
        1: ['You and partner.',  'Perfect.',    "I'll find content you'd both reach for."],
        2: ['Kids too.',         'Noted.',      "Family-friendly is built in from the start."],
        3: ['Friends & family.', 'Love it.',   "Great crowd-pleasing picks coming your way."],
      };
      return sel.length > 0 ? (lines[sel[0]] || lines[0]) : lines[0];
    },
    labels: ['Mostly me', 'My partner and I', 'Kids watch it too', 'Friends & family'],
    images: ['assets/images/setup/setup_q2_solo.jpg','assets/images/setup/setup_q2_pair.jpg','assets/images/setup/setup_q2_kids.jpg','assets/images/setup/setup_q2_friends.jpg'],
    nextScreen: 'show-more',
  },
  sm: {
    getLines: (sel) => {
      const allLabels = ['Travel & escapes','Health & wellness','Sports','Music & performances','Fashion & style','Home & interiors','Arts & culture','Tech & new things','Food & dining'];
      if (sel.length === 0) return ["Got it.", "Noted.", "I'll keep the feed well-balanced for you."];
      if (sel.length === 1) {
        const lbl = allLabels[sel[0]] ?? 'That';
        return [lbl, 'Noted.', `${lbl} will feature prominently.`];
      }
      return ['Great choices.', 'Love it.', "I'll make sure all of those come through clearly."];
    },
    labels: ['Travel & escapes','Health & wellness','Sports','Music & performances','Fashion & style','Home & interiors','Arts & culture','Tech & new things','Food & dining'],
    images: ['assets/images/setup/setup_q3_travel.jpg','assets/images/setup/setup_q3_fitness.jpg','assets/images/setup/setup_q3_sports.jpg','assets/images/setup/setup_q3_music.jpg','assets/images/setup/setup_q3_fashion.jpg','assets/images/setup/setup_q3_home.jpg','assets/images/setup/setup_q3_arts.jpg','assets/images/setup/setup_q3_tech.jpg','assets/images/setup/setup_q3_food.jpg'],
    nextScreen: 'weekend',
  },
  wkd: {
    getLines: (sel) => {
      if (sel.length === 0) return ["All good.", "Noted.", "I'll keep the weekend vibe balanced."];
      if (sel.length === 1 && sel[0] === 0) return ['Slow at home.', "That's my kind of weekend too.", "Slow, cozy content — well noted."];
      if (sel.length === 1 && sel[0] === 3) return ['Out of town.', "Love the spirit.", "Travel and escape content, dialed up."];
      if (sel.length === 1) {
        const lbl = ['Slow at home','Local experiences','A night out','Out of town'][sel[0]] ?? 'That';
        return [lbl, 'Noted.', "I'll factor that into how I pick content."];
      }
      return ['Great mix.', 'Noted.', "Your weekends sound well-rounded. I'll match that."];
    },
    labels: ['Slow at home','Local experiences','A night out','Out of town'],
    images: ['assets/images/setup/setup_q4_home.jpg','assets/images/setup/setup_q4_local.jpg','assets/images/setup/setup_q4_nightout.jpg','assets/images/setup/setup_q4_outoftown.jpg'],
    nextScreen: 'style',
  },
  sty: {
    getLines: (sel) => {
      if (sel.length === 0) return ["Got it.", "All good.", "I'll keep a well-rounded aesthetic."];
      if (sel.length === 1 && sel[0] === 1) return ['Classy.', 'Refined taste.', "I'll bring you content with that quality feel."];
      if (sel.length === 1 && sel[0] === 3) return ['Bold & statement.', 'Love the energy.', "Bold and expressive content, coming your way."];
      if (sel.length === 1 && sel[0] === 0) return ['Easy & casual.', 'Noted.', "Relaxed and laid-back — I'll match that energy."];
      if (sel.length === 1) {
        const lbl = ['Easy & casual','Classy','Trending','Bold & statement'][sel[0]] ?? 'That';
        return [lbl, 'Noted.', "I'll reflect that in what I surface."];
      }
      return ['Great combination.', 'Love it.', "Your feed will have real personality."];
    },
    labels: ['Easy & casual','Classy','Trending','Bold & statement'],
    images: ['assets/images/setup/setup_q5_casual.jpg','assets/images/setup/setup_q5_classy.jpg','assets/images/setup/setup_q5_trending.jpg','assets/images/setup/setup_q5_bold.jpg'],
    nextScreen: 'done',
  },
};

/* Shared: build selected card list from current card els */
function buildSelectedCards(pfx, selectedIdxs) {
  const map = REPLY_MAPS[pfx];
  return selectedIdxs
    .map(i => {
      const el = document.getElementById(`${pfx}-card-${i}`);
      if (!el) return null;
      return { id: String(i), label: map.labels[i] ?? '', image: map.images[i] ?? '', el };
    })
    .filter(Boolean);
}

function buildUnselectedEls(pfx, selectedIdxs, totalCount) {
  const all = [];
  for (let i = 0; i < totalCount; i++) {
    if (!selectedIdxs.includes(i)) {
      const el = document.getElementById(`${pfx}-card-${i}`);
      if (el) all.push(el);
    }
  }
  return all;
}

function _doFlipAndReply(pfx, selectedIdxs) {
  const map        = REPLY_MAPS[pfx];
  const screenMap  = { tvc: 'tv-content', aud: 'audience', sm: 'show-more', wkd: 'weekend', sty: 'style' };
  const screenId   = 'screen-' + screenMap[pfx];
  const root       = document.getElementById(screenId);
  const flyLayer   = document.getElementById(`${pfx}-fly-layer`);
  const agentWrap  = document.getElementById(`${pfx}-agent`);
  const replyEl    = document.getElementById(`${pfx}-reply`);
  const questionEl = document.getElementById(`${pfx}-question`);
  const actionsEl  = document.getElementById(`${pfx}-actions`);
  const subtitleEl = document.getElementById(`${pfx}-subtitle`);

  const replyLines  = map.getLines(selectedIdxs);
  const cardCount   = (pfx === 'sm') ? 9 : 4;
  const selCards    = buildSelectedCards(pfx, selectedIdxs);
  const unselEls    = buildUnselectedEls(pfx, selectedIdxs, cardCount);

  if (!selCards.length) {
    // No selection — skip card animation, just show reply
    gsap.to([actionsEl, document.getElementById(`${pfx}-cards-row`), subtitleEl, questionEl], { opacity: 0, duration: 0.3, ease: 'power2.in' });
    const fallbackTop = root.offsetHeight * 0.35;
    agentWrap.style.top = fallbackTop + 'px';
    setTimeout(() => {
      gsap.fromTo(agentWrap, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out',
        onComplete: () => {
          setupStructuredReply(replyEl, replyLines, () => _exitToNext(pfx, root, flyLayer, map.nextScreen));
        }
      });
    }, 400);
    return;
  }

  flipCenterStage({
    selectedCards: selCards,
    unselectedEls: unselEls,
    flyLayer,
    root,
    questionEl,
    actionsEl,
    subtitleEl,
    onAgentReady: (agentTop) => {
      agentWrap.style.top = agentTop + 'px';
      gsap.fromTo(agentWrap, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out',
        onComplete: () => {
          setupStructuredReply(replyEl, replyLines, () => _exitToNext(pfx, root, flyLayer, map.nextScreen));
        }
      });
    },
  });
}

function _exitToNext(pfx, root, flyLayer, nextScreenName) {
  setTimeout(() => {
    gsap.to(root, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
      onComplete: () => {
        flyLayer.innerHTML = '';
        root.style.opacity = '';
        resetMultiSelect(pfx);
        goToScreen(nextScreenName);
      }
    });
  }, 600);
}

function handleMultiSelectDone(pfx) {
  const state = getMultiState(pfx);
  if (!state.interactive || state.selected.length === 0) return;
  state.interactive = false;
  _doFlipAndReply(pfx, [...state.selected]);
}


/* ══════════════════════════════════════════════════════════════════════════
   TV CONTENT SCREEN
═══════════════════════════════════════════════════════════════════════════ */

function initTVContent() {
  initQuestionScreen('tvc', "What's this TV usually playing?", 0.6, 'audience', false);
}


/* ══════════════════════════════════════════════════════════════════════════
   SHOW MORE SCREEN
═══════════════════════════════════════════════════════════════════════════ */

let smExpanded = false;

function initShowMore() {
  smExpanded = false;

  // Hide extra cards
  document.querySelectorAll('.sm-extra').forEach(el => el.style.display = 'none');
  const scrollInner = document.getElementById('sm-scroll-inner');
  if (scrollInner) {
    scrollInner.style.justifyContent = 'center';
    scrollInner.style.minWidth = '';
  }

  const exploreBtn = document.getElementById('sm-explore-btn');
  if (exploreBtn) {
    exploreBtn.style.display = '';
    exploreBtn.querySelector('span').textContent = 'Explore more';
  }

  document.getElementById('sm-edge-left').style.display = 'none';
  document.getElementById('sm-edge-right').style.display = 'none';

  initQuestionScreen('sm', "What should this TV show more of?", 0.6, 'weekend', false);
}

function expandShowMore() {
  if (smExpanded) return;
  smExpanded = true;

  // Show extra cards
  document.querySelectorAll('.sm-extra').forEach(el => el.style.display = 'flex');

  // Switch scroll layout
  const scrollInner = document.getElementById('sm-scroll-inner');
  if (scrollInner) {
    scrollInner.style.justifyContent = 'flex-start';
    scrollInner.style.minWidth = 'max-content';
  }

  // Show edge gradients
  document.getElementById('sm-edge-left').style.display = 'block';
  document.getElementById('sm-edge-right').style.display = 'block';

  // Hide explore button
  const exploreBtn = document.getElementById('sm-explore-btn');
  if (exploreBtn) exploreBtn.style.display = 'none';

  // Animate extra cards in
  const extras = document.querySelectorAll('.sm-extra');
  gsap.fromTo(extras, { opacity: 0, scale: 0.88, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0)', duration: 0.5, ease: 'power3.out', stagger: 0.06 });

  // Scroll to show first new card
  requestAnimationFrame(() => {
    if (scrollInner) {
      scrollInner.scrollTo({ left: scrollInner.scrollLeft + 320, behavior: 'smooth' });
    }
  });
}


/* ══════════════════════════════════════════════════════════════════════════
   WEEKEND SCREEN
═══════════════════════════════════════════════════════════════════════════ */

function initWeekend() {
  initQuestionScreen('wkd', "What's your kind of weekend?", 0.6, 'style', false);
}


/* ══════════════════════════════════════════════════════════════════════════
   STYLE SCREEN
═══════════════════════════════════════════════════════════════════════════ */

function initStyle() {
  initQuestionScreen('sty', "What's your style?", 0.6, 'done', false);
}


/* ══════════════════════════════════════════════════════════════════════════
   DONE SCREEN
═══════════════════════════════════════════════════════════════════════════ */

function initDone() {
  const mascot  = document.getElementById('done-mascot');
  const text    = document.getElementById('done-text');
  const cta     = document.getElementById('done-cta');

  gsap.set([mascot, text, cta], { opacity: 0 });

  const tl = gsap.timeline();
  tl.fromTo(mascot,
    { opacity: 0, scale: 0.6, filter: 'blur(14px)', y: 20 },
    { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 1.0, ease: 'back.out(1.5)' }
  )
  .fromTo(text,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '+=0.2'
  )
  .fromTo(cta,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '+=0.3'
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════════════════ */

// Start on welcome screen
window.addEventListener('DOMContentLoaded', () => {
  showScreen('welcome');
  initScreen('welcome');
});
