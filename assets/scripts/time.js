(() => {
  const clock = document.getElementById('currentTime');
  const wrapper = document.querySelector('[data-clock-wrapper]');
  if (!clock || !wrapper) return;

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  function updateClock() {
    const now = new Date();
    clock.textContent = formatter.format(now);
    clock.dateTime = now.toISOString();
  }
  let interval;
  function resumeClock() {
    updateClock();
    clearInterval(interval);
    interval = setInterval(updateClock, 1000);
  }
  resumeClock();
  wrapper.hidden = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(interval);
    else resumeClock();
  });
})();
