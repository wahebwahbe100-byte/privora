(() => {
  'use strict';
  const header = document.querySelector('.prv-home-header');
  if (!header) return;
  const nav = header.querySelector('.prv-site-nav');
  const toggle = header.querySelector('.prv-header-toggle');
  const closeMenu = () => {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
  };
  toggle.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(opened));
    toggle.setAttribute('aria-label', opened ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('menu-open', opened);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); } });
  window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if(e.matches) closeMenu(); });
})();
