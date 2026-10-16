/* Staggered, single-play section reveals, keeping the page accessible and fast. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!main || reduced.matches || !('IntersectionObserver' in window)) return;

  // Handpicked heading/content blocks plus cards for consistent motion on every page.
  // Hero content already animates when its photograph changes, so it is excluded.
  const selectors = [
    '.trust-item',
    '.imported-services-head', '.imported-service-card',
    '.imported-values > .container > .eyebrow',
    '.imported-values > .container > h2', '.imported-values > .container > p',
    '.imported-value-card', '.about-copy', '.about-band .about-photo',
    '.section-head', '.process-heading', '.step', '.cta-inner',
    '.about-story > *', '.values .eyebrow', '.values h2', '.value-item',
    '.contact-aside', '.contact-panel',
    '.object-showcase-head', '.object-card', '.object-showcase-note',
    '.mn-services-shell > :is(h2,h3,p,.eyebrow)', '.mn-services-shell .mn-service-card',
    '.problem-copy', '.problem-card',
    '.service-comparison-head', '.comparison-table-shell',
    '.solution-title', '.solution-list > *', '.mn-solution-item',
    '.next-steps-reference-inner > :is(h2,h3,p)', '.next-step-reference-card',
    '.longform-head', '.longform-faq-list', '.faq-list > details',
    '.service-detail', '.service-detail-photo', '.service-detail-copy',
    '.story-image', '.intro-card', '.time-card', '.promise-card',
    '.area-card', '.service-card', '.next-card', '.other-service-card',
    '.cta-panel', '.cta-box'
  ];
  const targets = [...new Set([...main.querySelectorAll(selectors.join(','))])]
    .filter(el => !el.closest('.hero, .hero-slider, .page-hero, .prv-leistungen-hero, .service-detail-hero'))
    .filter(el => !el.closest('[hidden], [aria-hidden="true"]'));

  // For sections with their own unique composition, animate a few direct text elements.
  main.querySelectorAll('section').forEach(section => {
    if (section.matches('.hero, .page-hero, .prv-leistungen-hero, .service-detail-hero')) return;
    const container = section.querySelector(':scope > .container, :scope > .mn-solution-inner');
    if (!container) return;
    [...container.children].forEach(el => {
      if (el.matches(':is(.eyebrow, h2, h3, p, .imported-title, .imported-copy)')) {
        targets.push(el);
      }
    });
  });
  const unique = [...new Set(targets)]
    // Parent and child fading together causes unreadable delays. Prefer the outer card.
    .filter(el => !targets.some(other => other !== el && other.contains(el) &&
      other.matches('.imported-service-card, .imported-value-card, .contact-aside, .contact-panel, .about-copy, .service-detail-copy, .next-step-reference-card')));
  if (!unique.length) return;

  const visibleNow = element => {
    const rect = element.getBoundingClientRect();
    return rect.top < innerHeight - 12 && rect.bottom > 0;
  };
  // Elements already on screen must never become invisible during initialization.
  document.documentElement.classList.add('prv-motion-enabled');
  unique.forEach(el => {
    el.classList.add('prv-motion-item');
    if (el.matches('img, picture, .about-photo, .story-image, .service-detail-photo')) {
      el.classList.add('prv-motion-image');
    }
    if (visibleNow(el)) {
      el.classList.add('prv-motion-visible');
    }
  });

  let previousRow = -10000, rowIndex = 0;
  const observer = new IntersectionObserver(entries => {
    const arriving = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    arriving.forEach(entry => {
      const el = entry.target;
      const top = entry.boundingClientRect.top;
      if (Math.abs(previousRow - top) > 36) rowIndex = 0;
      previousRow = top;
      const delay = Math.min(rowIndex++ * 100, 260);
      el.style.setProperty('--prv-motion-delay', `${delay}ms`);
      el.classList.add('prv-motion-visible');
      observer.unobserve(el);
      // Drop the inline delay to keep hover interactions snappy.
      setTimeout(() => el.style.removeProperty('--prv-motion-delay'), 1500);
    });
  }, { rootMargin: '0px 0px -38px 0px', threshold: 0.06 });

  unique.forEach(el => {
    if (!el.classList.contains('prv-motion-visible')) observer.observe(el);
  });
  const revealAll = () => {
    observer.disconnect();
    unique.forEach(el => el.classList.add('prv-motion-visible'));
  };
  reduced.addEventListener('change', event => { if (event.matches) revealAll(); });
  document.addEventListener('focusin', event => {
    const el = event.target;
    if (!(el instanceof Element)) return;
    for (const target of unique) {
      if (target.contains(el) || target === el) {
        target.classList.add('prv-motion-visible');
        observer.unobserve(target);
      }
    }
  });
  // Anchor links stay usable even when a section has not entered the viewport yet.
  const revealAnchor = () => {
    if (!location.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return; }
    if (!target) return;
    for (const el of unique) {
      if (el === target || target.contains(el) || el.contains(target)) {
        el.classList.add('prv-motion-visible');
        observer.unobserve(el);
      }
    }
  };
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
  // Never let unvisited content remain hidden if the browser restores scroll history.
  window.addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
})();
