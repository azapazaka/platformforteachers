import { parseRich, plain } from './richText.js';
import { THEMES } from './themes.js';

// Размеры широкоформатного слайда 16:9 в дюймах.
const W = 13.333;
const H = 7.5;
const PAD = 0.7;
const BODY_Y = 1.85;
const BODY_H = 4.95;
const FONT = 'Calibri';
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

export function fileNameFor(topic, extension) {
  const base = String(topic || 'Урок').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'Урок';
  return `${base}.${extension}`;
}

// Подбирает размер шрифта так, чтобы текст поместился в блок.
function fitSize(texts, base, min, capacity) {
  const length = texts.map(plain).join(' ').length + texts.length * 25;
  if (length <= capacity) return base;
  return Math.max(min, Math.floor(base * Math.sqrt(capacity / length)));
}

// Превращает строки в абзацы pptxgenjs с поддержкой **выделения**.
function paragraphs(lines, t, { bullet, color = t.text, boldColor = t.accent } = {}) {
  const out = [];
  lines.forEach((line, li) => {
    const runs = parseRich(line);
    if (!runs.length) runs.push({ text: ' ', bold: false });
    runs.forEach((run, ri) => {
      const options = { bold: run.bold, color: run.bold ? boldColor : color };
      if (ri === 0 && bullet) options.bullet = bullet;
      if (ri === runs.length - 1 && li < lines.length - 1) options.breakLine = true;
      out.push({ text: run.text, options });
    });
  });
  return out;
}

function addTitle(slide, title, t) {
  slide.addText(paragraphs([title], t, { color: t.accent }), {
    x: PAD, y: 0.45, w: W - PAD * 2, h: 1.05,
    fontFace: FONT, fontSize: title.length > 60 ? 26 : 32, bold: true,
    valign: 'bottom', margin: 0, fit: 'shrink',
  });
  slide.addShape('rect', { x: PAD, y: 1.58, w: 1.2, h: 0.07, fill: { color: t.accent }, line: { type: 'none' } });
}

function addBullets(slide, lines, t, box, { marker = true, base = 28 } = {}) {
  if (!lines.length) return;
  // Примерно 13 символов на квадратный дюйм при 24 pt.
  const size = fitSize(lines, base, 14, Math.round(box.w * box.h * 13 * (24 / base) ** 2));
  slide.addText(paragraphs(lines, t, { bullet: marker ? { indent: 24 } : undefined }), {
    ...box, fontFace: FONT, fontSize: size, valign: 'top',
    paraSpaceAfter: Math.round(size * 0.45), margin: 0.05, fit: 'shrink',
  });
}

function addPanel(slide, t, box, { fill = t.surface } = {}) {
  slide.addShape('roundRect', { ...box, fill: { color: fill }, line: { type: 'none' }, rectRadius: 0.12 });
}

function renderTitleSlide(slide, s, t, meta) {
  slide.addShape('rect', { x: 0, y: 0, w: 0.35, h: H, fill: { color: t.accent }, line: { type: 'none' } });
  slide.addText(paragraphs([s.title || meta.title], t, { color: t.text }), {
    x: 1.2, y: 1.8, w: W - 2.4, h: 2.4, fontFace: FONT, fontSize: 44, bold: true,
    valign: 'bottom', margin: 0, fit: 'shrink',
  });
  slide.addShape('rect', { x: 1.2, y: 4.45, w: 1.6, h: 0.08, fill: { color: t.accent }, line: { type: 'none' } });
  slide.addText(s.subtitle || meta.subtitle, {
    x: 1.2, y: 4.75, w: W - 2.4, h: 0.9, fontFace: FONT, fontSize: 24, color: t.muted, valign: 'top', margin: 0,
  });
}

function renderRule(slide, s, t) {
  const hasBullets = s.bullets.length > 0;
  const boxH = hasBullets ? 2.1 : BODY_H;
  addPanel(slide, t, { x: PAD, y: BODY_Y, w: W - PAD * 2, h: boxH });
  slide.addShape('rect', { x: PAD, y: BODY_Y, w: 0.12, h: boxH, fill: { color: t.accent }, line: { type: 'none' } });
  slide.addText(paragraphs([s.rule], t), {
    x: PAD + 0.4, y: BODY_Y + 0.15, w: W - PAD * 2 - 0.7, h: boxH - 0.3,
    fontFace: FONT, fontSize: fitSize([s.rule], hasBullets ? 26 : 32, 16, hasBullets ? 220 : 500),
    valign: 'middle', margin: 0, fit: 'shrink',
  });
  if (hasBullets) {
    addBullets(slide, s.bullets, t, { x: PAD, y: BODY_Y + boxH + 0.3, w: W - PAD * 2, h: BODY_H - boxH - 0.3 }, { base: 24 });
  }
}

function renderExamples(slide, s, t) {
  const lines = s.examples;
  const size = fitSize(lines.map((e) => `${e.text} ${e.comment}`), 28, 16, 650);
  const text = [];
  lines.forEach((e, i) => {
    text.push(...paragraphs([e.text], t, { bullet: { indent: 22 } }));
    const last = text[text.length - 1];
    if (e.comment) {
      last.options.breakLine = false;
      text.push({ text: ` — ${plain(e.comment)}`, options: { color: t.muted, fontSize: Math.round(size * 0.85) } });
    }
    if (i < lines.length - 1) text[text.length - 1].options.breakLine = true;
  });
  slide.addText(text, {
    x: PAD, y: BODY_Y, w: W - PAD * 2, h: BODY_H, fontFace: FONT, fontSize: size,
    valign: 'top', paraSpaceAfter: Math.round(size * 0.55), margin: 0.05, fit: 'shrink',
  });
}

function renderColumns(slide, s, t) {
  const gap = 0.4;
  const colW = (W - PAD * 2 - gap) / 2;
  s.columns.forEach((col, i) => {
    const x = PAD + i * (colW + gap);
    addPanel(slide, t, { x, y: BODY_Y, w: colW, h: BODY_H });
    slide.addText(col.heading, {
      x: x + 0.3, y: BODY_Y + 0.2, w: colW - 0.6, h: 0.7, fontFace: FONT, fontSize: 24, bold: true,
      color: t.accent, valign: 'middle', margin: 0, fit: 'shrink',
    });
    addBullets(slide, col.items, t, { x: x + 0.3, y: BODY_Y + 1.05, w: colW - 0.6, h: BODY_H - 1.25 }, { base: 24 });
  });
}

function renderTable(slide, s, t) {
  const { headers, rows } = s.table;
  if (!headers.length) return;
  const size = rows.length > 5 || headers.length > 3 ? 16 : 20;
  const cell = (value, header, i) => ({
    text: paragraphs([value], t, {
      color: header ? t.accentText : t.text,
      boldColor: header ? t.accentText : t.accent,
    }).map((r) => ({ ...r, options: { ...r.options, bold: header || r.options.bold } })),
    options: { fill: { color: header ? t.accent : i % 2 ? t.background : t.surface } },
  });
  slide.addTable(
    [headers.map((h) => cell(h, true, 0)), ...rows.map((row, i) => row.map((c) => cell(c, false, i)))],
    {
      x: PAD, y: BODY_Y, w: W - PAD * 2, colW: Array(headers.length).fill((W - PAD * 2) / headers.length),
      fontFace: FONT, fontSize: size, color: t.text, valign: 'middle', margin: 0.1,
      border: { type: 'solid', pt: 1, color: t.surface }, autoPage: false,
    },
  );
}

function renderTask(slide, s, t) {
  const { instruction, items } = s.task;
  let y = BODY_Y;
  if (instruction) {
    slide.addText(paragraphs([instruction], t, { color: t.muted }), {
      x: PAD, y, w: W - PAD * 2, h: 0.85, fontFace: FONT, fontSize: 22, italic: true,
      valign: 'top', margin: 0, fit: 'shrink',
    });
    y += 1.0;
  }
  const h = BODY_Y + BODY_H - y;
  const short = items.every((i) => plain(i).length <= 40);
  if (items.length > 5 && short) {
    const half = Math.ceil(items.length / 2);
    const colW = (W - PAD * 2) / 2;
    [items.slice(0, half), items.slice(half)].forEach((part, i) => {
      const numbered = part.map((item, j) => `${i * half + j + 1}) ${item}`);
      addBullets(slide, numbered, t, { x: PAD + i * colW, y, w: colW - 0.2, h }, { base: 30, marker: false });
    });
  } else {
    addBullets(slide, items.map((item, i) => `${i + 1}) ${item}`), t, { x: PAD, y, w: W - PAD * 2, h }, { base: 30, marker: false });
  }
}

function renderQuiz(slide, s, t) {
  const { question, options } = s.quiz;
  slide.addText(paragraphs([question], t), {
    x: PAD, y: BODY_Y, w: W - PAD * 2, h: 1.3, fontFace: FONT, fontSize: fitSize([question], 28, 18, 160),
    valign: 'top', margin: 0, fit: 'shrink',
  });
  const gap = 0.3;
  const top = BODY_Y + 1.5;
  const cols = 2;
  const rowsCount = Math.ceil(options.length / cols);
  const boxW = (W - PAD * 2 - gap) / cols;
  const boxH = (BODY_Y + BODY_H - top - gap * (rowsCount - 1)) / rowsCount;
  options.forEach((option, i) => {
    const x = PAD + (i % cols) * (boxW + gap);
    const y = top + Math.floor(i / cols) * (boxH + gap);
    addPanel(slide, t, { x, y, w: boxW, h: boxH });
    slide.addText(
      [{ text: `${LETTERS[i]}) `, options: { bold: true, color: t.accent } }, ...paragraphs([option], t)],
      { x: x + 0.3, y, w: boxW - 0.6, h: boxH, fontFace: FONT, fontSize: 22, valign: 'middle', margin: 0, fit: 'shrink' },
    );
  });
}

function renderQuote(slide, s, t) {
  const { text, author } = s.quote;
  slide.addText('«', { x: PAD, y: BODY_Y - 0.2, w: 1.2, h: 1.4, fontFace: 'Georgia', fontSize: 110, color: t.surface, margin: 0 });
  slide.addText(paragraphs([text], t), {
    x: PAD + 0.9, y: BODY_Y + 0.3, w: W - PAD * 2 - 1.8, h: 3.2, fontFace: 'Georgia', italic: true,
    fontSize: fitSize([text], 32, 20, 260), valign: 'middle', margin: 0, fit: 'shrink',
  });
  if (author) {
    slide.addText(`— ${author}`, {
      x: PAD + 0.9, y: BODY_Y + 3.7, w: W - PAD * 2 - 1.8, h: 0.6, fontFace: FONT, fontSize: 22,
      color: t.muted, align: 'right', margin: 0,
    });
  }
}

function renderHomework(slide, s, t) {
  addPanel(slide, t, { x: PAD, y: BODY_Y, w: W - PAD * 2, h: BODY_H });
  addBullets(slide, s.bullets, t, { x: PAD + 0.4, y: BODY_Y + 0.35, w: W - PAD * 2 - 0.8, h: BODY_H - 0.7 }, { base: 28 });
}

function notesFor(s) {
  const parts = [s.notes];
  if (s.type === 'task' && s.task.answers.length) {
    parts.push(`Ответы:\n${s.task.answers.map((a, i) => `${i + 1}) ${plain(a)}`).join('\n')}`);
  }
  if (s.type === 'quiz' && s.quiz.correct >= 0) {
    parts.push(`Правильный ответ: ${LETTERS[s.quiz.correct]}) ${plain(s.quiz.options[s.quiz.correct])}`);
  }
  return parts.filter(Boolean).join('\n\n');
}

export async function exportPresentation(presentation, { themeKey, footer }) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const t = THEMES[themeKey] ?? THEMES.classic;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = presentation.title;
  pptx.lang = 'ru-RU';

  presentation.slides.forEach((s, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: t.background };

    if (s.type === 'title') {
      renderTitleSlide(slide, s, t, presentation);
    } else {
      addTitle(slide, s.title, t);
      const body = { x: PAD, y: BODY_Y, w: W - PAD * 2, h: BODY_H };
      switch (s.type) {
        case 'rule': renderRule(slide, s, t); break;
        case 'examples': renderExamples(slide, s, t); break;
        case 'columns': renderColumns(slide, s, t); break;
        case 'table': renderTable(slide, s, t); break;
        case 'task': renderTask(slide, s, t); break;
        case 'quiz': renderQuiz(slide, s, t); break;
        case 'quote': renderQuote(slide, s, t); break;
        case 'homework': renderHomework(slide, s, t); break;
        default: addBullets(slide, s.bullets, t, body);
      }
      slide.addText(footer, { x: PAD, y: 7.0, w: 8, h: 0.35, fontFace: FONT, fontSize: 12, color: t.muted, margin: 0 });
      slide.addText(String(index + 1), {
        x: W - PAD - 1, y: 7.0, w: 1, h: 0.35, fontFace: FONT, fontSize: 12, color: t.muted, align: 'right', margin: 0,
      });
    }

    const notes = notesFor(s);
    if (notes) slide.addNotes(notes);
  });

  await pptx.writeFile({ fileName: fileNameFor(presentation.title, 'pptx') });
}
