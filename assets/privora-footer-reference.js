document.addEventListener('DOMContentLoaded', function () {
  var cfg = window.PRIVORA_CONFIG || {};
  var nodes = document.querySelectorAll('[data-footer-contact-data]');
  nodes.forEach(function (container) {
    var items = [];
    if (typeof cfg.phone === 'string' && cfg.phone.trim()) {
      var tel = document.createElement('a');
      tel.href = 'tel:' + cfg.phone.replace(/[^+\d]/g, '');
      tel.textContent = cfg.phone.trim();
      items.push(tel);
    }
    if (typeof cfg.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email.trim())) {
      var mail = document.createElement('a');
      mail.href = 'mailto:' + cfg.email.trim();
      mail.textContent = cfg.email.trim();
      items.push(mail);
    }
    if (typeof cfg.address === 'string' && cfg.address.trim()) {
      var addr = document.createElement('span');
      addr.textContent = cfg.address.trim();
      items.push(addr);
    }
    items.forEach(function (item) { container.appendChild(item); });
    if (items.length) container.hidden = false;
  });
});
