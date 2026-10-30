import { HttpError } from './http.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
// Сколько раз пробуем заново, если модель вернула невалидный ответ.
const OUTPUT_ATTEMPTS = 2;
const MAX_NUMBERED_KEYS = 10;

// Собирает ключи из GROQ_API_KEY (можно несколько через запятую)
// и из GROQ_API_KEY_1 … GROQ_API_KEY_10.
export function getApiKeys(env = process.env) {
  const values = [env.GROQ_API_KEY];
  for (let i = 1; i <= MAX_NUMBERED_KEYS; i++) values.push(env[`GROQ_API_KEY_${i}`]);
  const keys = values.flatMap((v) => (v ? v.split(',') : [])).map((k) => k.trim()).filter(Boolean);
  return [...new Set(keys)];
}

// Запрашивает у Groq ответ в режиме JSON и возвращает разобранный объект.
// Ключи берутся только из переменных окружения сервера и никогда не попадают в браузер.
// Если ключ упёрся в лимит или не принят, запрос повторяется со следующим ключом.
export async function generateJson({ system, user, maxTokens = 8000, temperature = 0.6 }) {
  const keys = getApiKeys();
  if (!keys.length) {
    throw new HttpError(500, 'На сервере не задан ключ GROQ_API_KEY. Обратитесь к администратору сайта.');
  }

  // Начинаем со случайного ключа, чтобы нагрузка распределялась между всеми.
  const start = Math.floor(Math.random() * keys.length);
  let keyOffset = 0;
  let badOutputs = 0;
  let rateLimitedKeys = 0;
  let rejectedKeys = 0;
  let lastError = new HttpError(502, 'Сервис генерации временно недоступен. Попробуйте ещё раз.');

  while (keyOffset < keys.length && badOutputs < OUTPUT_ATTEMPTS) {
    const keyNumber = ((start + keyOffset) % keys.length) + 1;
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keys[keyNumber - 1]}`,
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
      console.error(`Groq error ${response.status} (key #${keyNumber}):`, details.slice(0, 500));
      if (response.status === 401 || response.status === 403) {
        rejectedKeys++;
        keyOffset++;
      } else if (response.status === 429) {
        rateLimitedKeys++;
        keyOffset++;
      } else if (response.status === 400 || response.status >= 500) {
        // 400 у Groq чаще всего означает json_validate_failed — модель выдала невалидный JSON.
        badOutputs++;
      } else {
        break;
      }
      continue;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason === 'length') {
      lastError = new HttpError(502, 'Ответ получился слишком длинным. Сократите пожелания или уменьшите объём.');
      badOutputs++;
      continue;
    }
    try {
      return JSON.parse(choice?.message?.content ?? '');
    } catch {
      console.error(`Groq returned invalid JSON (key #${keyNumber})`);
      badOutputs++;
    }
  }

  if (rejectedKeys === keys.length) {
    throw new HttpError(500, 'Ключи Groq API не приняты. Проверьте GROQ_API_KEY в настройках сервера.');
  }
  if (rateLimitedKeys + rejectedKeys === keys.length) {
    throw new HttpError(429, 'Слишком много запросов. Подождите минуту и попробуйте снова.');
  }
  throw lastError;
}
