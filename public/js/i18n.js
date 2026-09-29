let current = 'en', messages = {}, placeMessages = {};
export const language = () => current;
export const isRTL = () => current === 'ar';
export const t = (key, fallback = key) => messages[key] ?? fallback;
export const placeText = (place, field) => current === 'ar' ? (placeMessages[place.id]?.[field] ?? (field === 'name' ? place.arabicName : place[field])) : place[field];
export function translateRendered(root = document) {
  if (current !== 'ar') return;
  const phrases = messages.phrases || {}, walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const trimmed = node.nodeValue.trim();
    if (phrases[trimmed]) node.nodeValue = node.nodeValue.replace(trimmed, phrases[trimmed]);
    else if (trimmed.startsWith('Guest journal ·')) node.nodeValue = 'سجل ضيف محفوظ في هذا المتصفح فقط. سجّل الدخول للمزامنة بين الأجهزة. ';
    else if (/^\d+ destinations on your map$/.test(trimmed)) node.nodeValue = node.nodeValue.replace(trimmed, `${trimmed.match(/^\d+/)[0]} وجهة على الخريطة`);
    else if (/^\d+ destinations to discover/.test(trimmed)) node.nodeValue = node.nodeValue.replace(trimmed, `${trimmed.match(/^\d+/)[0]} وجهة للاكتشاف`);
    else if (/^More (culture|religion|adventure|nature|wellness) ↗$/i.test(trimmed)) {
      const category = trimmed.match(/^More (culture|religion|adventure|nature|wellness) ↗$/i)[1];
      const normalized = category[0].toUpperCase() + category.slice(1).toLowerCase();
      node.nodeValue = `المزيد من ${t(`category.${normalized}`, normalized)} ↖`;
    }
    else if (/^[⌂☼△❋≈] (Culture|Religion|Adventure|Nature|Wellness)( · Hidden gem)?$/.test(trimmed)) {
      const match = trimmed.match(/^([⌂☼△❋≈]) (Culture|Religion|Adventure|Nature|Wellness)( · Hidden gem)?$/);
      node.nodeValue = `${match[1]} ${t(`category.${match[2]}`, match[2])}${match[3] ? ' · جوهرة خفية' : ''}`;
    }
    else if (/^\d+% explored$/.test(trimmed)) node.nodeValue = `${trimmed.match(/^\d+/)[0]}٪ تم استكشافه`;
    else if (/^(North|Central|South) Jordan · \d+\/\d+$/.test(trimmed)) {
      const [, region, amount] = trimmed.match(/^(North|Central|South) Jordan · (\d+\/\d+)$/);
      node.nodeValue = `${{North:'شمال',Central:'وسط',South:'جنوب'}[region]} الأردن · ${amount}`;
    }
    else if (/^\d+-day trip ·/.test(trimmed)) node.nodeValue = trimmed.replace(/^(\d+)-day trip · (Relaxed|Balanced|Full) pace · (Any region|North Jordan|Central Jordan|South Jordan)$/, (_, days, pace, region) => `رحلة ${days} أيام · إيقاع ${{Relaxed:'هادئ',Balanced:'متوازن',Full:'مكثف'}[pace]} · ${{'Any region':'أي إقليم','North Jordan':'شمال الأردن','Central Jordan':'وسط الأردن','South Jordan':'جنوب الأردن'}[region]}`);
  }
  root.querySelectorAll?.('[placeholder]').forEach(el => {
    const value = el.getAttribute('placeholder'); if (phrases[value]) el.setAttribute('placeholder', phrases[value]);
  });
}
export async function initI18n() {
  let saved = null;
  try { saved = localStorage.getItem('discover-jordan-language'); } catch {}
  current = saved === 'ar' || saved === 'en' ? saved : (navigator.language?.startsWith('ar') ? 'ar' : 'en');
  const [ui, places] = await Promise.all([
    fetch(`data/i18n/${current}.json`).then(r => r.json()),
    current === 'ar' ? fetch('data/i18n/places-ar.json').then(r => r.json()) : Promise.resolve({}),
  ]);
  messages = ui; placeMessages = places;
  document.documentElement.lang = current; document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', isRTL());
  translateStatic();
  translateRendered(document);
}
export function setLanguage(lang) {
  if (!['en','ar'].includes(lang)) return;
  try { localStorage.setItem('discover-jordan-language', lang); } catch {}
  location.reload();
}
export function translateStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n, el.textContent));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria, el.getAttribute('aria-label'))));
  const button = document.querySelector('#language-toggle');
  if (button) { button.textContent = current === 'ar' ? 'EN' : 'AR'; button.setAttribute('aria-label', t('switchLanguage')); }
}
