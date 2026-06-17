// GTV Feed Intelligence — App

let CARDS = [];
let PROFILES = {};
let currentLayer = 'L1';
let signalsPanelOpen = false;

// ─── Bootstrap ────────────────────────────────

async function init() {
  try {
    const [cardsRes, profilesRes] = await Promise.all([
      fetch('data/cards.json'),
      fetch('data/profiles.json')
    ]);
    CARDS = await cardsRes.json();
    PROFILES = await profilesRes.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    return;
  }

  renderGrid();
  updateContext();
  updateSignalsPanel();
  bindControls();

  // Run validation
  const { allPassed, failures } = window.GTVValidate.runValidation(CARDS);
  renderValidationBanner(allPassed, failures.length);
}

// ─── Controls ─────────────────────────────────

function bindControls() {
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => setLayer(btn.dataset.layer));
  });

  const sigBtn = document.getElementById('signals-toggle-btn');
  sigBtn.addEventListener('click', toggleSignalsPanel);
}

function setLayer(layer) {
  currentLayer = layer;

  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layer === layer);
  });

  updateContext();
  updateSignalsPanel();
  updateCardReasoning();
  updateWordmarkColor();
}

// ─── Context Bar ──────────────────────────────

const CONTEXT_META = {
  L1: {
    badgeClass: 'l1',
    badgeText: 'L1',
    desc: 'Context-only reasoning — Bangalore, weekday morning, 27°C partly cloudy. No user signals available.'
  },
  L2: {
    badgeClass: 'l2',
    badgeText: 'L2',
    desc: 'Interaction-led reasoning — open, view, and dwell patterns observed. No NP save signal. Fashion wishlist only for fashion cards.'
  },
  L3: {
    badgeClass: 'l3',
    badgeText: 'L3',
    desc: 'Household-fit reasoning — interaction history plus safe derived household signals: family-oriented, vegetarian-friendly, premium-but-practical, home upgrade intent.'
  }
};

function updateContext() {
  const meta = CONTEXT_META[currentLayer];
  document.getElementById('context-badge').textContent = meta.badgeText;
  document.getElementById('context-badge').className = `context-badge ${meta.badgeClass}`;
  document.getElementById('context-desc').textContent = meta.desc;
}

// ─── Signals Panel ────────────────────────────

function toggleSignalsPanel() {
  signalsPanelOpen = !signalsPanelOpen;
  const panel = document.getElementById('signals-panel');
  const btn = document.getElementById('signals-toggle-btn');
  panel.classList.toggle('visible', signalsPanelOpen);
  btn.classList.toggle('active', signalsPanelOpen);
}

function updateSignalsPanel() {
  const profile = PROFILES[currentLayer];
  const container = document.getElementById('signals-panel-inner');
  container.innerHTML = '';

  // Context signals
  if (profile.context) {
    const group = makeSignalGroup('Context', [
      profile.context.location,
      profile.context.time,
      profile.context.weather
    ].filter(Boolean), '');

    if (profile.context.localSignals) {
      const localGroup = makeSignalGroup('Local Signals', profile.context.localSignals, '');
      container.appendChild(group);
      container.appendChild(localGroup);
    } else {
      container.appendChild(group);
    }
  }

  // Interaction data
  if (profile.interactionData) {
    if (profile.interactionData.positivePatterns) {
      container.appendChild(makeSignalGroup('Positive Patterns', profile.interactionData.positivePatterns, 'positive'));
    }
    if (profile.interactionData.negativePatterns) {
      container.appendChild(makeSignalGroup('Negative Patterns', profile.interactionData.negativePatterns, 'negative'));
    }
    if (profile.interactionData.recentOpens) {
      const opens = profile.interactionData.recentOpens.map(o => {
        const card = CARDS.find(c => c.id === o.cardId);
        return card ? `${card.headline} (${o.signal} ×${o.count})` : null;
      }).filter(Boolean);
      container.appendChild(makeSignalGroup('Recent Engagement', opens, ''));
    }
  } else {
    const div = document.createElement('div');
    div.innerHTML = `<div class="signal-group-title">Interaction Data</div><p class="signal-none">No interaction history available at this start level.</p>`;
    container.appendChild(div);
  }

  // Household data
  if (profile.householdData) {
    container.appendChild(makeSignalGroup('Derived Household Signals', profile.householdData.derivedSignals, 'household'));
    const note = document.createElement('div');
    note.style.cssText = 'font-size:11px; color: var(--text-muted); font-style: italic; padding-top: 2px;';
    note.textContent = profile.householdData.note;
    container.appendChild(note);
  } else {
    const div = document.createElement('div');
    div.innerHTML = `<div class="signal-group-title">Household Data</div><p class="signal-none">No household signals available at this start level.</p>`;
    container.appendChild(div);
  }
}

function makeSignalGroup(title, items, tagClass) {
  const wrap = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.className = 'signal-group-title';
  titleEl.textContent = title;
  wrap.appendChild(titleEl);

  const tags = document.createElement('div');
  tags.className = 'signal-tags';
  items.forEach(item => {
    const t = document.createElement('span');
    t.className = `signal-tag ${tagClass}`.trim();
    t.textContent = item;
    tags.appendChild(t);
  });
  wrap.appendChild(tags);
  return wrap;
}

// ─── Grid Render ──────────────────────────────

function renderGrid() {
  const grid = document.getElementById('feed-grid');
  grid.innerHTML = CARDS.map(card => buildCardHTML(card)).join('');
}

function buildCardHTML(card) {
  const reasoning = card.reasoning[currentLayer];
  const pill = card.evidencePill[currentLayer];
  const layerClass = `active-${currentLayer.toLowerCase()}`;
  const reasoningLabel = { L1: 'Why this card', L2: 'Why for you', L3: 'Household fit' }[currentLayer];

  return `
    <div class="card" id="card-${card.id}">
      <div class="card-image-wrap">
        <img src="${card.image}" alt="${escHtml(card.headline)}" loading="lazy">
        <span class="card-category-chip">${escHtml(card.category)}</span>
      </div>
      <div class="card-body">
        <div class="card-headline">${escHtml(card.headline)}</div>
        <div class="card-caption">${escHtml(card.caption)}</div>
        <div class="reasoning-box ${layerClass}">
          <div class="reasoning-header">
            <span class="reasoning-dot"></span>
            <span class="reasoning-label">${reasoningLabel}</span>
            <span class="evidence-pill">${escHtml(pill)}</span>
          </div>
          <div class="reasoning-text" id="rt-${card.id}">${escHtml(reasoning)}</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-sub-category">${escHtml(card.subCategory)}</span>
        <button class="cta-btn ${ctaClass(card.cta)}">${escHtml(card.cta)}</button>
      </div>
    </div>
  `;
}

// ─── In-place reasoning update (no re-render) ─

function updateCardReasoning() {
  const reasoningLabel = { L1: 'Why this card', L2: 'Why for you', L3: 'Household fit' }[currentLayer];
  const layerClass = `active-${currentLayer.toLowerCase()}`;

  CARDS.forEach(card => {
    const rtEl = document.getElementById(`rt-${card.id}`);
    if (!rtEl) return;

    const box = rtEl.closest('.reasoning-box');
    const labelEl = box.querySelector('.reasoning-label');
    const pillEl = box.querySelector('.evidence-pill');

    // Fade out
    rtEl.classList.add('fading');

    setTimeout(() => {
      rtEl.textContent = card.reasoning[currentLayer];
      if (labelEl) labelEl.textContent = reasoningLabel;
      if (pillEl) pillEl.textContent = card.evidencePill[currentLayer];

      // Update layer class on box
      box.className = `reasoning-box ${layerClass}`;

      rtEl.classList.remove('fading');
    }, 110);
  });
}

// ─── Wordmark ─────────────────────────────────

function updateWordmarkColor() {
  const colors = { L1: '#3b82f6', L2: '#8b5cf6', L3: '#10b981' };
  const icon = document.getElementById('wordmark-icon');
  if (icon) {
    icon.style.background = colors[currentLayer] + '22';
    icon.querySelector('circle').setAttribute('fill', colors[currentLayer]);
  }
  const dot = document.getElementById('signals-dot');
  if (dot) dot.style.background = colors[currentLayer];
}

// ─── Validation Banner ────────────────────────

function renderValidationBanner(allPassed, failCount) {
  const banner = document.getElementById('validation-banner');
  if (!banner) return;

  banner.className = `validation-banner ${allPassed ? 'pass' : 'fail'}`;
  banner.innerHTML = `
    <span class="validation-status-dot"></span>
    <span>${allPassed ? 'Validation: all checks passed' : `Validation: ${failCount} check${failCount !== 1 ? 's' : ''} failed — see console`}</span>
  `;
  banner.title = 'Open browser console to see full validation report';
  banner.addEventListener('click', () => {
    window.GTVValidate.runValidation(CARDS);
  });
}

// ─── Helpers ──────────────────────────────────

function ctaClass(cta) {
  if (cta === 'Find Near You') return 'cta-find';
  if (cta === 'Start This Routine') return 'cta-start';
  return 'cta-explore';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Start ────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
