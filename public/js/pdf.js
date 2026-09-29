function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function bytes(value) { return new TextEncoder().encode(value); }
function join(parts) {
  const size = parts.reduce((n, part) => n + part.length, 0), out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function jpegBytes(dataURL) {
  const binary = atob(dataURL.split(',')[1]), out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
export function createPdfFromJpegs(images, width, height) {
  const objects = [null], pageIds = [], imageIds = [], contentIds = [];
  const catalogId = objects.push(null) - 1, pagesId = objects.push(null) - 1;
  images.forEach((image, index) => {
    const imageId = objects.push(join([bytes(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, bytes('\nendstream')])) - 1;
    const command = bytes('q 595 0 0 842 0 0 cm /Im0 Do Q');
    const contentId = objects.push(join([bytes(`<< /Length ${command.length} >>\nstream\n`), command, bytes('\nendstream')])) - 1;
    const pageId = objects.push(null) - 1;
    imageIds[index] = imageId; contentIds[index] = contentId; pageIds[index] = pageId;
  });
  objects[catalogId] = bytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  objects[pagesId] = bytes(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  pageIds.forEach((id, index) => objects[id] = bytes(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageIds[index]} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`));
  const output = [bytes('%PDF-1.4\n%âãÏÓ\n')], offsets = [0];
  let length = output[0].length;
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = length;
    const part = join([bytes(`${id} 0 obj\n`), objects[id], bytes('\nendobj\n')]);
    output.push(part); length += part.length;
  }
  const xref = length;
  let table = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  output.push(bytes(`${table}trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return new Blob(output, { type: 'application/pdf' });
}
export async function downloadItineraryPDF(days, { lang = 'en', placeText, labels }) {
  await document.fonts.ready;
  const rtl = lang === 'ar', W = 1240, H = 1754, margin = 96, canvases = [];
  const chunks = [];
  for (let i = 0; i < days.length; i += 2) chunks.push(days.slice(i, i + 2));
  for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H); ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.textAlign = rtl ? 'right' : 'left'; const x = rtl ? W - margin : margin;
    ctx.fillStyle = '#8a5c2e'; ctx.font = `600 28px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`;
    ctx.fillText(labels.site, x, 92);
    ctx.fillStyle = '#1b1711'; ctx.font = `700 56px ${rtl ? 'Cairo, Tajawal' : 'Georgia'}, serif`;
    ctx.fillText(labels.title, x, 170);
    ctx.font = `400 25px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`; ctx.fillStyle = '#665b4d';
    ctx.fillText(`${labels.length}: ${days.length} ${labels.days}`, x, 220);
    let y = 290;
    for (const day of chunks[pageIndex]) {
      ctx.fillStyle = '#8a5c2e'; ctx.font = `700 34px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`;
      ctx.fillText(`${labels.day} ${day.number}`, x, y); y += 55;
      for (const { place } of day.stops) {
        const text = placeText(place);
        ctx.fillStyle = '#1b1711'; ctx.font = `700 30px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`;
        ctx.fillText(text.name, x, y); y += 42;
        ctx.fillStyle = '#8a5c2e'; ctx.font = `500 21px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`;
        ctx.fillText(`${text.area} · ${text.region}`, x, y); y += 37;
        ctx.fillStyle = '#554c41'; ctx.font = `400 22px ${rtl ? 'Cairo, Tajawal' : 'Arial'}, sans-serif`;
        for (const line of wrap(ctx, text.description, W - margin * 2)) { ctx.fillText(line, x, y); y += 31; }
        y += 32;
      }
      y += 26;
    }
    ctx.fillStyle = '#8a5c2e'; ctx.font = '18px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
    ctx.fillText(`${pageIndex + 1} / ${chunks.length}`, W / 2, H - 55);
    canvases.push(jpegBytes(canvas.toDataURL('image/jpeg', 0.9)));
  }
  const url = URL.createObjectURL(createPdfFromJpegs(canvases, W, H));
  const a = document.createElement('a'); a.href = url; a.download = 'discover-jordan-itinerary.pdf';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
