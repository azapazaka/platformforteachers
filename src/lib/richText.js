// Разбивает строку с **выделениями** на фрагменты: [{ text, bold }].
export function parseRich(value) {
  const parts = String(value ?? '').split('**');
  // Нечётное число маркеров — выделение не закрыто, показываем текст как есть.
  if (parts.length % 2 === 0) return [{ text: parts.join(''), bold: false }];
  return parts.map((text, i) => ({ text, bold: i % 2 === 1 })).filter((p) => p.text);
}

export function plain(value) {
  return parseRich(value).map((p) => p.text).join('');
}
