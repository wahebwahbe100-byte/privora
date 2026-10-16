(() => {
  'use strict';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const heroSelector = '.hero, .page-hero, .prv-leistungen-hero, .service-detail-hero';
  const heroes = [...document.querySelectorAll(heroSelector)];
  const animations = new Set();
  const heroRuns = new WeakMap();
  const ease = 'cubic-bezier(.22, 1, .36, 1)';

  function play(element, frames, options) {
    if (!element.animate || motionPreference.matches) return null;
    const animation = element.animate(frames, options);
    animations.add(animation);
    const release = () => animations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
    return animation;
  }

  function enterHero(hero, replay = false) {
    const content = hero.querySelector('.hero-content, .prv-lhero-content, .hero-inner, .container');
    if (!content) return;
    const items = [...content.children].filter(element =>
      !element.matches('.hero-slider-controls, .breadcrumbs, .back') &&
      getComputedStyle(element).display !== 'none');
    const previous = heroRuns.get(hero);
    previous?.forEach(animation => animation?.cancel());
    const run = [];
    heroRuns.set(hero, run);
    items.forEach((element, index) => {
      element.classList.add('prv-hero-item');
      if (motionPreference.matches) return;
      // A short fade-out joins each photograph change to a soft downward entrance.
      const delay = index * 65;
      const frames = replay ? [
        { opacity: 1, transform: 'translateY(0)', offset: 0, easing: 'ease-out' },
        { opacity: 0, transform: 'translateY(8px)', offset: .16 },
        { opacity: 0, transform: 'translateY(-20px)', offset: .17, easing: ease },
        { opacity: 1, transform: 'translateY(0)', offset: 1 }
      ] : [
        { opacity: 0, transform: 'translateY(-20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ];
      run.push(play(element, frames, { duration: replay ? 1040 : 820, delay, easing: replay ? 'linear' : ease, fill: 'backwards' }));
    });
  }

  function initReveals() {
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;
    const targets = new Set();
    const atomic = [
      '.imported-services-head', '.imported-service-card', '.imported-value-card',
      '.about-copy', '.about-photo', '.process-heading', '.step', '.trust-item',
      '.section-head', '.value-item', '.promise-note', '.contact-aside', '.contact-panel',
      '.story-image', '.about-story > div', '.object-showcase-head', '.object-card',
      '.object-showcase-note', '.service-comparison-head', '.comparison-table-shell',
      '.problem-card', '.problem-copy', '.intro-card', '.time-card', '.promise-card',
      '.area-card', '.service-card', '.next-card', '.next-steps-reference-card',
      '.longform-head', '.longform-faq-list', '.other-service-card',
      '.solution-title', '.solution-list > *', '.cta-panel', '.cta-box', '.cta-inner'
    ].join(',');
    const sections = document.querySelectorAll('main > section, main > .container > section, body > section');
    sections.forEach(section => {
      if (section.matches(heroSelector)) return;
      const elements = [...section.querySelectorAll(atomic)];
      const shell = section.querySelector(':scope > .container') || section;
      [...shell.children].forEach(child => {
        if (child.matches('h2, h3, p, .eyebrow') || !elements.some(el => child === el || child.contains(el))) {
          if (!child.matches('script, style') && !child.querySelector('script')) elements.push(child);
        }
      });
      elements.filter(el => !elements.some(parent => parent !== el && parent.contains(el)))
        .forEach(el => targets.add(el));
    });
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      let rowTop = -Infinity, rowIndex = 0;
      visible.forEach(({ target, boundingClientRect }) => {
        if (Math.abs(rowTop - boundingClientRect.top) > 24) rowIndex = 0;
        rowTop = boundingClientRect.top;
        target.style.setProperty('--prv-reveal-delay', Math.min(rowIndex++ * 70, 140) + 'ms');
        target.classList.add('prv-is-visible');
        observer.unobserve(target);
        // Restore existing hover transitions after the one-time entrance.
        setTimeout(() => {
          target.classList.remove('prv-reveal-pending');
          target.style.removeProperty('--prv-reveal-delay');
        }, 1100);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(element => {
      if (element.closest('[hidden], [aria-hidden="true"]')) return;
      element.classList.add('prv-reveal-pending');
      observer.observe(element);
    });
    // Keyboard and fragment navigation never land on invisible content.
    const revealContaining = element => {
      if (!(element instanceof Element)) return;
      for (const target of targets) {
        if (target === element || target.contains(element) || element.contains(target)) {
          target.classList.add('prv-is-visible'); observer.unobserve(target);
        }
      }
    };
    document.addEventListener('focusin', event => revealContaining(event.target));
    const revealHash = () => {
      try { revealContaining(document.getElementById(decodeURIComponent(location.hash.slice(1)))); } catch (_) {}
    };
    addEventListener('hashchange', revealHash);
    revealHash();
    motionPreference.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      targets.forEach(target => target.classList.add('prv-is-visible'));
    });
  }

  function initSlider(hero) {
    // The desktop hero keeps its three original panoramic images. On phones,
    // the three dedicated portrait photographs run as their own slideshow.
    const desktopSlides = [...hero.querySelectorAll('.hero-photo')];
    const mobileSlides = [...hero.querySelectorAll('.hero-mobile-photo')];
    const allSlides = [...desktopSlides, ...mobileSlides];
    const dots = [...hero.querySelectorAll('.hero-dot')];
    const pause = hero.querySelector('.hero-pause');
    if (desktopSlides.length < 2 || !pause) return;
    const mobileView = matchMedia('(max-width: 700px)');
    const activeSlides = () => mobileView.matches && mobileSlides.length ? mobileSlides : desktopSlides;
    let index = 0, timer = null, paused = false, inView = true;
    const stop = () => { clearTimeout(timer); timer = null; };

    const sync = () => {
      const slides = activeSlides();
      allSlides.forEach(slide => {
        const currentIndex = slides.indexOf(slide);
        const active = currentIndex !== -1 && currentIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, i) => {
        dot.hidden = i >= slides.length;
        dot.setAttribute('aria-pressed', String(i === index && i < slides.length));
      });
    };
    const update = () => {
      stop();
      const stopped = paused || motionPreference.matches;
      pause.textContent = motionPreference.matches ? 'Weiter' : stopped ? 'Start' : 'Pause';
      pause.setAttribute('aria-label', motionPreference.matches ? 'Nächstes Bild anzeigen' : stopped ? 'Bildwechsel starten' : 'Bildwechsel pausieren');
      // Every slide remains visible for four seconds before the next begins.
      if (!stopped && inView && !document.hidden) {
        timer = setTimeout(() => show((index + 1) % activeSlides().length), 4000);
      }
    };
    const show = next => {
      if (next !== index) {
        index = next;
        sync();
        enterHero(hero, true);
      }
      update();
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      if (i < activeSlides().length) show(i);
    }));
    pause.addEventListener('click', () => {
      if (motionPreference.matches) {
        show((index + 1) % activeSlides().length);
      } else { paused = !paused; update(); }
    });
    // Hover must not stop the four-second slideshow on desktop.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { inView = entries[0].isIntersecting; update(); }, { threshold: 0 })
        .observe(hero);
    }
    document.addEventListener('visibilitychange', update);
    motionPreference.addEventListener('change', update);
    mobileView.addEventListener('change', () => {
      index = 0;
      sync();
      update();
    });
    sync();
    update();
  }

  motionPreference.addEventListener('change', event => {
    if (event.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); }
  });
  // Tap outside the open mobile menu to close it smoothly. Reuse the
  // existing toggle listener to keep aria-expanded and body state in sync.
  document.addEventListener('pointerdown', event => {
    const header = document.querySelector('.site-header, .prv-home-header');
    if (!header || header.contains(event.target)) return;
    const toggle = header.querySelector('.menu-toggle, .prv-header-toggle');
    if (toggle?.getAttribute('aria-expanded') === 'true') toggle.click();
  });
  // Scroll reveals are managed by privora-smooth-motion.js across all pages.
  heroes.forEach(hero => { enterHero(hero); if (hero.matches('.hero-slider')) initSlider(hero); });
})();
