// GTV Feed Intelligence — Validation
// Runs automatically on page load and logs results to console.
// All checks must pass before the demo is considered complete.

const BANNED_L1 = ['you', 'your', 'history', 'profile', 'household', 'preference'];
const BANNED_CLICK = ['click'];
const BANNED_L3_RAW = ['income', 'revenue', 'provider', 'database', 'attribute', 'band', 'tier', 'segment id', 'user id'];
const ELLIPSIS_PATTERN = /\.{2,}|…/;
const BROKEN_SENTENCE_PATTERN = /[a-z],?\s*$/; // ends without punctuation

function validate(cards) {
  const results = [];
  const openers = { L1: [], L2: [], L3: [] };
  const headlines = [];
  let allPassed = true;

  function fail(id, layer, rule, detail) {
    allPassed = false;
    results.push({ pass: false, card: id, layer, rule, detail });
  }
  function pass(id, layer, rule) {
    results.push({ pass: true, card: id, layer, rule, detail: 'OK' });
  }

  cards.forEach(card => {
    const id = card.headline;

    // No duplicate headlines
    if (headlines.includes(id)) {
      fail(id, 'ALL', 'NO_DUPLICATE_HEADLINES', `Duplicate headline: "${id}"`);
    } else {
      headlines.push(id);
      pass(id, 'ALL', 'NO_DUPLICATE_HEADLINES');
    }

    // Exactly one CTA
    if (!card.cta || typeof card.cta !== 'string' || card.cta.trim() === '') {
      fail(id, 'ALL', 'ONE_CTA', 'Missing or empty CTA');
    } else {
      pass(id, 'ALL', 'ONE_CTA');
    }

    ['L1', 'L2', 'L3'].forEach(layer => {
      const text = card.reasoning[layer];
      const lower = text.toLowerCase();

      // No ellipses
      if (ELLIPSIS_PATTERN.test(text)) {
        fail(id, layer, 'NO_ELLIPSIS', `Ellipsis found: "${text}"`);
      } else {
        pass(id, layer, 'NO_ELLIPSIS');
      }

      // No broken/truncated sentences — must end with . ! or ?
      if (!/[.!?]$/.test(text.trim())) {
        fail(id, layer, 'COMPLETE_SENTENCE', `Does not end with punctuation: "${text}"`);
      } else {
        pass(id, layer, 'COMPLETE_SENTENCE');
      }

      // L1: no first-person or personal signal words
      if (layer === 'L1') {
        const found = BANNED_L1.filter(w => {
          const re = new RegExp(`\\b${w}\\b`, 'i');
          return re.test(text);
        });
        if (found.length > 0) {
          fail(id, layer, 'L1_NO_PERSONAL_WORDS', `Banned words found: ${found.join(', ')}`);
        } else {
          pass(id, layer, 'L1_NO_PERSONAL_WORDS');
        }
      }

      // L2: no "click"
      if (layer === 'L2') {
        const found = BANNED_CLICK.filter(w => {
          const re = new RegExp(`\\b${w}\\b`, 'i');
          return re.test(text);
        });
        if (found.length > 0) {
          fail(id, layer, 'L2_NO_CLICK', `Word "click" found`);
        } else {
          pass(id, layer, 'L2_NO_CLICK');
        }

        // L2: no hallucinated saves (only fashion can use wishlist)
        if (/wishlist|saved|nps|np save/i.test(text) && card.category.toLowerCase() !== 'fashion') {
          fail(id, layer, 'L2_NO_HALLUCINATED_SAVES', `Save/wishlist language in non-fashion card`);
        } else {
          pass(id, layer, 'L2_NO_HALLUCINATED_SAVES');
        }
      }

      // L3: no raw enriched data
      if (layer === 'L3') {
        const found = BANNED_L3_RAW.filter(w => lower.includes(w));
        if (found.length > 0) {
          fail(id, layer, 'L3_NO_RAW_DATA', `Raw data words found: ${found.join(', ')}`);
        } else {
          pass(id, layer, 'L3_NO_RAW_DATA');
        }
      }

      // Track openers for duplicate check
      const opener = text.split(' ').slice(0, 4).join(' ').toLowerCase();
      openers[layer].push({ id, opener });
    });
  });

  // No repeated reasoning openers within same layer
  ['L1', 'L2', 'L3'].forEach(layer => {
    const seen = {};
    openers[layer].forEach(({ id, opener }) => {
      if (seen[opener]) {
        fail(id, layer, 'NO_REPEATED_OPENERS', `Same opener as "${seen[opener]}": "${opener}"`);
      } else {
        seen[opener] = id;
        pass(id, layer, 'NO_REPEATED_OPENERS');
      }
    });
  });

  return { allPassed, results };
}

function runValidation(cards) {
  const { allPassed, results } = validate(cards);
  const failures = results.filter(r => !r.pass);
  const passes = results.filter(r => r.pass);

  console.group('%c GTV Feed Intelligence — Validation Report', 'font-weight:bold; font-size:14px;');
  console.log(`Total checks: ${results.length} | Passed: ${passes.length} | Failed: ${failures.length}`);

  if (failures.length === 0) {
    console.log('%c ALL CHECKS PASSED', 'color: #10b981; font-weight: bold; font-size: 13px;');
  } else {
    console.warn('%c FAILURES:', 'color: #f87171; font-weight: bold;');
    failures.forEach(f => {
      console.warn(`  [${f.layer}] Card "${f.card}" — ${f.rule}: ${f.detail}`);
    });
  }

  console.groupEnd();
  return { allPassed, failures };
}

window.GTVValidate = { validate, runValidation };
