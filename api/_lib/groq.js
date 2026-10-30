import { HttpError } from './http.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const ATTEMPTS = 2;

// Запрашивает у Groq ответ в режиме JSON и возвращает разобранный объект.
// Ключ берётся только из переменных окружения сервера и никогда не попадает в браузер.
export async function generateJson({ system, user, maxTokens = 8000, temperature = 0.6 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, 'На сервере не задан ключ GROQ_API_KEY. Обратитесь к администратору сайта.');
  }

  let lastError = new HttpError(502, 'Сервис генерации временно недоступен. Попробуйте ещё раз.');

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Groq error ${response.status} (attempt ${attempt}):`, details.slice(0, 500));
      if (response.status === 401 || response.status === 403) {
        throw new HttpError(500, 'Ключ Groq API не принят. Проверьте GROQ_API_KEY в настройках сервера.');
      }
      if (response.status === 429) {
        throw new HttpError(429, 'Слишком много запросов. Подождите минуту и попробуйте снова.');
      }
      // 400 у Groq чаще всего означает json_validate_failed — модель выдала невалидный JSON.
      if (response.status === 400 || response.status >= 500) continue;
      throw lastError;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason === 'length') {
      lastError = new HttpError(502, 'Ответ получился слишком длинным. Сократите пожелания или уменьшите объём.');
      continue;
    }
    try {
      return JSON.parse(choice?.message?.content ?? '');
    } catch {
      console.error(`Groq returned invalid JSON (attempt ${attempt})`);
    }
  }

  throw lastError;
}
