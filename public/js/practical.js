import { escapeHTML as esc, safeURL } from './domain.js';
import { language, placeText } from './i18n.js';
export function practicalInfo(p) {
  const info = p.practical || {};
  const ar = language() === 'ar';
  const arabicPrice = () => {
    if (p.id === 'petra') return 'للزائر الدولي المقيم ليلة في الأردن: 50 د.أ ليوم واحد، و55 ليومين، و60 لثلاثة أيام. زائر اليوم الواحد من دون إقامة: 90 د.أ. تختلف الفئات الأخرى؛ تحقق قبل الشراء.';
    if (p.id === 'jerash') return 'بحسب القائمة المنشورة: 0.50 د.أ للأردني و10 د.أ للزائر الدولي، وتشمل تذكرة المدينة الأثرية المتحف. تحقق من السعر الحالي.';
    if (/Jordanian/i.test(info.entryPrice || '')) return info.entryPrice
      .replace(/Jordanian/gi,'الأردني').replace(/international/gi,'الزائر الدولي').replace(/resident/gi,'المقيم').replace(/foreigners?/gi,'الزائر الدولي').replace(/JOD/gi,'د.أ').replace(/plus 16% tax/gi,'إضافة إلى ضريبة 16%').replace(/Published ministry rate; reconfirm before visiting\./gi,'سعر منشور من الوزارة؛ تحقق منه قبل الزيارة.');
    return 'تحقق من رسوم الدخول الحالية بحسب الجنسية ونوع النشاط قبل الحجز؛ قد تتغير الأسعار.';
  };
  const arabicHours = () => {
    if (p.id === 'petra') return 'الجدول الرسمي لعام 2026: من 2 آذار إلى 1 تشرين الأول 06:00–18:00، ومن 2 تشرين الأول إلى 1 آذار 06:30–17:00. تحقق من موعد يوم زيارتك.';
    if (p.id === 'jerash') return 'يذكر دليل الزوار الرسمي 08:00–16:00 شتاءً و08:00–18:30 صيفًا، مع مواعيد مختلفة في الربيع ورمضان. تحقق من موعد يوم زيارتك.';
    return 'تحقق من ساعات العمل وآخر موعد للدخول والإغلاقات الموسمية قبل الانطلاق.';
  };
  const fields = [
    ['◈ Entry price', ar ? arabicPrice() : (info.entryPrice || 'Current fee not verified. Confirm with the destination before booking.')],
    ['◷ Opening hours', ar ? arabicHours() : (info.openingHours || 'Confirm opening times and last admission before departure.')],
    ['☀ Best time', placeText(p,'bestTime')],
    ['↔ Public transport', ar ? `استفسر من مشغّل نقل محلي عن الرحلات باتجاه ${placeText(p,'regionCity')}. رتّب مسبقًا وسيلة الوصول الأخيرة والعودة.` : (info.publicTransport || `Ask a local transport operator about services toward ${p.regionCity}. A direct service to the entrance is not verified; arrange the final transfer and return in advance.`)],
    ['⌖ Private car', ar ? 'استخدم الإحداثيات للاستدلال، وتحقق من مدخل الزوار وموقف السيارات قبل القيادة.' : (info.privateCar || 'Use the coordinates below for orientation. Confirm the visitor entrance and parking; the destination pin may be inside the site.')],
    ['✦ Travel tips', ar ? 'اترك وقتًا للمرور والمشي والاستراحة، وتحقق من الطقس وحالة الطرق أو المسارات، ورتّب العودة في المواقع البعيدة.' : (info.tips || 'Allow extra time for traffic and stops. Check weather and access restrictions; arrange a return transfer before heading to remote sites.')],
  ];
  return `<section class="practical"><h2>Plan your visit</h2><div class="practical-grid">${fields.map(([title, value]) => `<article class="facts"><h3>${title}</h3><p>${esc(value)}</p></article>`).join('')}</div><p class="small">${ar ? 'الإحداثيات' : 'Coordinates'}: ${p.coordinates.lat}, ${p.coordinates.lng}. ${ar ? 'المدة المقترحة' : 'Suggested visit'}: ${esc(placeText(p,'recommendedDuration'))}.</p><p class="small muted">${esc(ar ? 'معلومات تخطيطية؛ تحقّق من الأسعار والمواعيد وحالة الوصول قبل الزيارة.' : (info.verification || 'Confirm current conditions before departure.'))}</p><a class="text-link" href="${esc(safeURL(info.sourceUrl || p.sourceUrl))}" target="_blank" rel="noopener noreferrer">Check destination information ↗</a>${info.priceSourceUrl ? ` · <a href="${esc(safeURL(info.priceSourceUrl))}" target="_blank" rel="noopener noreferrer">Admission source ↗</a>` : ''}</section>`;
}
