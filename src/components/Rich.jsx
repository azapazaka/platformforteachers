import { parseRich } from '../lib/richText.js';

// Выводит текст, в котором **выделения** показываются акцентным цветом.
export function Rich({ text }) {
  return parseRich(text).map((part, i) => (part.bold ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>));
}
