(() => {
  'use strict';
  const config = window.PRIVORA_CONFIG || {};
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    nav?.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Menü öffnen');
  };
  toggle?.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(opened));
    toggle.setAttribute('aria-label', opened ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('menu-open', opened);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
  const backTop = document.querySelector('.back-top');
  const updateScroll = () => backTop?.classList.toggle('show', window.scrollY > 650);
  window.addEventListener('scroll', updateScroll, {passive:true});
  updateScroll();

  const form = document.getElementById('request-form');
  if (!form) return;
  const steps = [...form.querySelectorAll('.form-step')];
  const progress = [...form.querySelectorAll('.form-progress li')];
  const result = document.getElementById('request-result');
  const summaryElement = document.getElementById('request-summary');
  const copyStatus = document.getElementById('copy-status');
  let current = 0;
  let summary = '';
  const serviceNames = {bueroreinigung:'Büroreinigung',privathaushalte:'Privathaushalte',treppenhausreinigung:'Treppenhausreinigung',hausmeisterservice:'Hausmeisterservice',gartenpflege:'Gartenpflege','weitere-dienstleistungen':'Weitere Dienstleistungen',glasreinigung:'Glasreinigung',grundreinigung:'Grundreinigung'};
  const selected = new URLSearchParams(window.location.search).get('leistung');
  if (Object.prototype.hasOwnProperty.call(serviceNames, selected)) {
    const input = form.querySelector(`input[name="leistung"][value="${selected}"]`);
    if (input) input.checked = true;
  }
  if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    document.getElementById('email-detail').hidden = false;
    const email = document.getElementById('company-email');
    email.textContent = config.email;
    email.href = `mailto:${config.email}`;
    document.getElementById('delivery-note').textContent = 'Sie prüfen Ihre Anfrage zunächst. Anschließend können Sie Ihr E-Mail-Programm öffnen und die Nachricht selbst versenden.';
  }
  if (config.phone && /^[+\d()\s/-]+$/.test(config.phone)) {
    document.getElementById('phone-detail').hidden = false;
    const phone = document.getElementById('company-phone');
    phone.textContent = config.phone;
    phone.href = 'tel:' + config.phone.replace(/[^\d+]/g, '');
  }
  if (config.address) {
    document.getElementById('address-detail').hidden = false;
    document.getElementById('company-address').textContent = config.address;
  }
  function showStep(index) {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; step.disabled = i !== index; });
    progress.forEach((item, i) => {
      item.classList.toggle('current', i === index);
      item.classList.toggle('complete', i < index);
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    steps[index].querySelector('.form-heading').focus({preventScroll:true});
    if (window.innerWidth < 701) form.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function validateStep(index) {
    const controls = [...steps[index].querySelectorAll('input,select,textarea')];
    if (index === 0) {
      const valid = !!form.querySelector('input[name="leistung"]:checked');
      const error = steps[0].querySelector('.form-error');
      error.hidden = valid;
      if (!valid) controls[0].focus();
      return valid;
    }
    for (const field of controls) {
      if (field.required && !field.value.trim()) {
        field.setCustomValidity('Bitte füllen Sie dieses Feld aus.');
      } else field.setCustomValidity('');
      if (!field.checkValidity()) { field.reportValidity(); return false; }
    }
    return true;
  }
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    if (event.target.name === 'leistung') steps[0].querySelector('.form-error').hidden = true;
  });
  form.querySelectorAll('.next-step').forEach(button => button.addEventListener('click', () => {
    if (validateStep(current)) showStep(current + 1);
  }));
  form.querySelectorAll('.prev-step').forEach(button => button.addEventListener('click', () => showStep(current - 1)));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (current < 2) { if (validateStep(current)) showStep(current + 1); return; }
    if (!validateStep(current)) return;
    // Only the visible fieldset participates in browser validation. Enable all
    // fieldsets briefly to collect the entire request, then restore their state.
    steps.forEach(step => { step.disabled = false; });
    const data = new FormData(form);
    steps.forEach((step, i) => { step.disabled = i !== current; });
    const value = name => String(data.get(name) || '').trim();
    const lines = [
      'Reinigungsanfrage an PRIVORA', '',
      'Leistung: ' + (serviceNames[value('leistung')] || value('leistung')),
      'Anfrage als: ' + value('kundentyp'),
      'Rhythmus: ' + value('rhythmus'),
      'PLZ / Ort: ' + value('ort'),
      ...(value('flaeche') ? ['Fläche: ' + value('flaeche') + ' m²'] : []),
      ...(value('zeitraum') ? ['Zeitraum: ' + value('zeitraum')] : []),
      '', 'Name: ' + value('name'),
      ...(value('firma') ? ['Firma: ' + value('firma')] : []),
      'E-Mail: ' + value('email'),
      ...(value('telefon') ? ['Telefon: ' + value('telefon')] : []),
      ...(value('nachricht') ? ['', 'Meine Wünsche:', value('nachricht')] : []),
    ];
    summary = lines.join('\n');
    summaryElement.textContent = summary;
    const emailLink = document.getElementById('send-request');
    if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
      emailLink.hidden = false;
      emailLink.href = 'mailto:' + encodeURIComponent(config.email) + '?subject=' + encodeURIComponent('Reinigungsanfrage – ' + serviceNames[value('leistung')]) + '&body=' + encodeURIComponent(summary);
      document.getElementById('result-description').textContent = 'Prüfen Sie Ihre Angaben. Öffnen Sie anschließend Ihr E-Mail-Programm, um die Anfrage selbst abzusenden. Bisher wurde keine Nachricht versendet.';
    }
    copyStatus.textContent = '';
    form.hidden = true;
    result.hidden = false;
    result.focus({preventScroll:true});
    result.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  document.getElementById('edit-request').addEventListener('click', () => {
    form.hidden = false;
    result.hidden = true;
    showStep(2);
  });
  document.getElementById('download-request').addEventListener('click', () => {
    const blob = new Blob(['\uFEFF' + summary], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PRIVORA-Reinigungsanfrage.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    copyStatus.textContent = 'Der Download wurde gestartet. Es wurde keine Nachricht versendet.';
  });
  document.getElementById('copy-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summary);
      copyStatus.textContent = 'Anfragetext kopiert.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(summaryElement);
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Bitte kopieren Sie den markierten Text manuell.';
    }
  });
})();

