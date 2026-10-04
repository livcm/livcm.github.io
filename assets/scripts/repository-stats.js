(() => {
  const section = document.querySelector('[data-repository-stats]');
  if (!section) return;

  const source = new URL(section.dataset.repositoryUrl);
  if (source.hostname !== 'github.com') return;
  const parts = source.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return;
  const repository = parts.map(encodeURIComponent).join('/');
  const api = 'https://api.github.com/repos/' + repository;
  const cacheKey = 'aneko-repository-stats:' + repository;
  const freshFor = 15 * 60 * 1000;
  const retainFor = 7 * 24 * 60 * 60 * 1000;
  const status = section.querySelector('[data-stats-status]');
  const number = new Intl.NumberFormat('zh-CN');
  const date = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const validCount = value => Number.isSafeInteger(value) && value >= 0;
  const valid = {
    stars: validCount,
    commit: value => value && typeof value.date === 'string' && Number.isFinite(Date.parse(value.date)) && /^[a-f0-9]{40}$/.test(value.sha),
    activity: value => Array.isArray(value) && value.length > 0 && value.length <= 52 && value.every(validCount)
  };
  let cache = {};
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) cache = saved;
  } catch (_) {}

  function cachedEntry(key) {
    const entry = cache[key];
    const age = entry && Date.now() - entry.updated;
    return entry && Number.isFinite(entry.updated) && Number.isFinite(age) && age >= 0 && age < retainFor && valid[key](entry.value) ? entry : null;
  }

  function save(key, value) {
    cache[key] = { value, updated: Date.now() };
    try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (_) {}
  }

  async function request(endpoint, retryPending = false) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(api + endpoint, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
        if (response.status === 202 && retryPending && attempt < 2) {
          clearTimeout(timeout);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        if (!response.ok || response.status === 202 || response.status === 204) throw new Error('Data unavailable');
        return await response.json();
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  function render(key, value, stale = false, updated = null) {
    const element = section.querySelector('[data-stat-value="' + key + '"]');
    const caption = section.querySelector('[data-stat-caption="' + key + '"]');
    if (key === 'stars') {
      element.textContent = number.format(value);
      caption.textContent = '仓库收藏';
    } else if (key === 'commit') {
      const committed = new Date(value.date);
      const committedTime = document.createElement('time');
      committedTime.textContent = date.format(committed).replaceAll('/', '.');
      committedTime.dateTime = value.date;
      element.replaceChildren(committedTime);
      caption.textContent = time.format(committed) + ' · UTC+8';
      section.querySelector('[data-stat-link="commit"]').href = source.origin + source.pathname.replace(/\/$/, '') + '/commit/' + value.sha;
    } else {
      element.textContent = number.format(value[value.length - 1]) + ' 次';
      const chart = section.querySelector('[data-stat-chart]');
      const weeks = value.slice(-12);
      caption.textContent = '最近 7 天（UTC）· 近 ' + weeks.length + ' 周趋势';
      const maximum = Math.max(1, ...weeks);
      chart.replaceChildren();
      weeks.forEach((count, index) => {
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const height = count === 0 ? 1 : Math.max(2, Math.round(count / maximum * 28));
        bar.setAttribute('x', String(index * 12));
        bar.setAttribute('y', String(28 - height));
        bar.setAttribute('width', '8');
        bar.setAttribute('height', String(height));
        bar.setAttribute('rx', '2');
        bar.setAttribute('opacity', index === weeks.length - 1 ? '1' : '.4');
        chart.append(bar);
      });
      chart.removeAttribute('hidden');
    }
    if (stale) caption.textContent += ' · 缓存 ' + date.format(new Date(updated)).replaceAll('/', '.') + ' ' + time.format(new Date(updated));
  }

  const jobs = [
    ['stars', '', data => data.stargazers_count],
    ['commit', '/commits?per_page=1', data => ({ date: data[0]?.commit?.committer?.date, sha: data[0]?.sha })],
    ['activity', '/stats/participation', data => data.all]
  ];
  status.hidden = false;
  status.textContent = '正在读取仓库动态…';

  Promise.all(jobs.map(async ([key, endpoint, normalize]) => {
    const entry = cachedEntry(key);
    if (entry) {
      render(key, entry.value, Date.now() - entry.updated >= freshFor, entry.updated);
      if (Date.now() - entry.updated < freshFor) return { state: 'ready', updated: entry.updated };
    } else {
      section.querySelector('[data-stat-value="' + key + '"]').textContent = '—';
      section.querySelector('[data-stat-caption="' + key + '"]').textContent = '读取中…';
    }
    try {
      const value = normalize(await request(endpoint, key === 'activity'));
      if (!valid[key](value)) throw new Error('Invalid data');
      save(key, value);
      render(key, value);
      return { state: 'ready', updated: cache[key].updated };
    } catch (_) {
      if (entry) return { state: 'cached', updated: entry.updated };
      section.querySelector('[data-stat-caption="' + key + '"]').textContent = '暂不可用 · 点此查看';
      return { state: 'unavailable' };
    }
  })).then(results => {
    if (results.some(result => result.state === 'unavailable')) {
      status.textContent = '部分数据暂时无法读取，可点击对应项目在 GitHub 查看。';
    } else if (results.some(result => result.state === 'cached')) {
      status.textContent = '暂时无法更新，显示上次获取的数据。';
    } else {
      const updated = Math.min(...results.map(result => result.updated));
      status.textContent = '数据来自 GitHub · 更新于 ' + date.format(new Date(updated)).replaceAll('/', '.') + ' ' + time.format(new Date(updated)) + '（UTC+8）';
    }
  });
})();
