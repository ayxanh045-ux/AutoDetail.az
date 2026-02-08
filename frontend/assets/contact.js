(() => {
  const ensureToast = () => {
    let toastEl = document.getElementById('app-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'app-toast';
      toastEl.className = 'app-toast';
      document.body.appendChild(toastEl);
    }
    return toastEl;
  };

  const showToast = (text, type) => {
    const toastEl = ensureToast();
    toastEl.textContent = text;
    toastEl.className = `app-toast show ${type || ''}`.trim();
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toastEl.className = 'app-toast';
    }, 2000);
  };

  const init = () => {
    const container = document.querySelector('.footer-contact');
    if (!container) return;
    const label = container.querySelector('.footer-contact-label');
    const input = container.querySelector('.footer-contact-input');
    const messageEl = container.querySelector('.footer-contact-message');
    const sendBtn = container.querySelector('.footer-contact-send');
    if (!sendBtn) return;
    if (label) label.textContent = 'Əlaqə üçün:';
    if (input) input.placeholder = 'Emailinizi yazın';
    if (messageEl) messageEl.placeholder = 'Mesajınızı yazın';

    sendBtn.addEventListener('click', async () => {
      const emailOrPhone = input?.value.trim() || '';
      const message = messageEl?.value.trim() || '';
      if (!message) {
        showToast('Mesajınızı yazın', 'error');
        return;
      }
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone, message })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || 'Xəta baş verdi', 'error');
          return;
        }
        showToast('Mesaj göndərildi', 'success');
        if (input) input.value = '';
        if (messageEl) messageEl.value = '';
      } catch {
        showToast('Xəta baş verdi', 'error');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
