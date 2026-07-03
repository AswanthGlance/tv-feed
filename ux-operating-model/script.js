/* ============================================================
   UX Operating Model — Interactions
============================================================ */

/* ---- Scroll-reveal via IntersectionObserver -------------- */
function initReveal() {
  const targets = document.querySelectorAll([
    '.product-card',
    '.cap-card',
    '.principle-card',
    '.hiring-card',
    '.flow-item',
    '.section-label',
    '.section-title',
    '.capacity-callout',
    '.leader-node',
    '.leader-connector',
    '.vp-node',
    '.manager-node',
  ].join(','));

  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Stagger cards inside the same grid
      const parent = entry.target.parentElement;
      const siblings = [...parent.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(entry.target);
      const delay = idx * 55;

      setTimeout(() => entry.target.classList.add('in'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => io.observe(el));
}

/* ---- Subtle hover tint on product cards ------------------ */
function initCardTint() {
  const map = {
    'product-blue':  'rgba(37,99,235,.025)',
    'product-green': 'rgba(22,163,74,.025)',
  };
  Object.entries(map).forEach(([cls, bg]) => {
    document.querySelectorAll('.' + cls).forEach(card => {
      card.addEventListener('mouseenter', () => card.style.background = bg);
      card.addEventListener('mouseleave', () => card.style.background = '');
    });
  });
}

/* ---- Smooth anchor navigation ---------------------------- */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ---- Init ------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCardTint();
  initAnchors();
});
