export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Некорректный запрос.');
  }
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json(
    { error: 'Что-то пошло не так. Попробуйте ещё раз через минуту.' },
    { status: 500 },
  );
}

// Приводит пользовательский ввод к строке разумной длины.
export function text(value, maxLength = 300) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().slice(0, maxLength);
}

export function required(value, message) {
  if (!value) throw new HttpError(400, message);
  return value;
}

export function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
