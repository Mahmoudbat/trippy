// A classic script can explain file:// restrictions even when modules cannot load.
(() => {
  const main = document.querySelector('#main');
  function showProblem(title, explanation) {
    if (!main.querySelector('.loading')) return;
    const panel = document.createElement('div');
    panel.className = 'empty';
    const heading = document.createElement('h1');
    heading.textContent = title;
    const message = document.createElement('p');
    message.textContent = explanation;
    panel.append(heading, message);
    if (location.protocol !== 'file:') {
      const retry = document.createElement('button');
      retry.className = 'button';
      retry.textContent = 'Reload page';
      retry.addEventListener('click', () => location.reload());
      panel.append(retry);
    }
    main.replaceChildren(panel);
  }
  if (location.protocol === 'file:') {
    showProblem(
      'Open the website through a web server.',
      'فتح index.html مباشرة لا يشغّل الموقع كاملًا. افتح مجلد public عبر سيرفر محلي أو استخدم رابط Firebase Hosting. راجع README لتعليمات التشغيل.'
    );
    return;
  }
  const timer = setTimeout(() => showProblem(
    'The guide is taking too long to load.',
    'Check your connection and reload. If this continues, check the browser console for a blocked or missing file.'
  ), 15000);
  import('./app.js').catch(error => {
    clearTimeout(timer);
    console.error('Discover Jordan startup failed:', error);
    showProblem('The website could not start.',
      'A JavaScript file could not load. Extract the complete project, serve its public folder over HTTP, then reload.');
  });
})();
