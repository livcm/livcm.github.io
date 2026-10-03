(() => {
  const root = document.documentElement;
  const control = document.querySelector('[data-theme-control]');
  const select = document.querySelector('[data-theme-select]');
  if (!control || !select) return;

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = root.dataset.themePreference || 'system';

  function applyTheme() {
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    select.value = preference;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = theme === 'dark' ? '#1E1A24' : '#FCF9F8';
    });
  }

  select.addEventListener('change', () => {
    preference = select.value;
    try { localStorage.setItem('aneko-theme', preference); } catch (_) {}
    applyTheme();
  });
  systemTheme.addEventListener('change', () => {
    if (preference === 'system') applyTheme();
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'aneko-theme' && event.key !== null) return;
    preference = ['system', 'light', 'dark'].includes(event.newValue) ? event.newValue : 'system';
    applyTheme();
  });
  applyTheme();
  control.hidden = false;
})();
