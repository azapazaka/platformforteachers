import { generateJson } from './_lib/groq.js';
import { HttpError, clampInt, errorResponse, readJson, required, text } from './_lib/http.js';
import { KSP_SYSTEM_PROMPT, buildKspUserPrompt } from './_lib/prompts.js';
import { sanitizeKsp } from './_lib/sanitize.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    const input = {
      topic: required(text(body.topic), 'Укажите тему урока.'),
      section: text(body.section),
      grade: text(body.grade, 20),
      program: body.program === 'nonru' ? 'nonru' : 'ru',
      lessonType: text(body.lessonType, 100),
      duration: clampInt(body.duration, 20, 90, 45),
      learningObjectives: text(body.learningObjectives, 1500),
      wishes: text(body.wishes, 2000),
    };

    const raw = await generateJson({
      system: KSP_SYSTEM_PROMPT,
      user: buildKspUserPrompt(input),
      temperature: 0.5,
    });

    const ksp = sanitizeKsp(raw);
    if (!ksp) throw new HttpError(502, 'Не удалось составить КСП. Попробуйте ещё раз.');
    return Response.json({ ksp });
  } catch (error) {
    return errorResponse(error);
  }
}
