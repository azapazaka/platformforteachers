import { generateJson } from './_lib/groq.js';
import { HttpError, clampInt, errorResponse, readJson, required, text } from './_lib/http.js';
import { PRESENTATION_SYSTEM_PROMPT, buildPresentationUserPrompt } from './_lib/prompts.js';
import { sanitizePresentation } from './_lib/sanitize.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    const input = {
      topic: required(text(body.topic), 'Укажите тему урока.'),
      grade: text(body.grade, 20),
      program: body.program === 'nonru' ? 'nonru' : 'ru',
      lessonType: text(body.lessonType, 100),
      slideCount: clampInt(body.slideCount, 5, 25, 12),
      include: (Array.isArray(body.include) ? body.include : []).map((i) => text(i, 100)).filter(Boolean).slice(0, 12),
      wishes: text(body.wishes, 2000),
    };

    const raw = await generateJson({
      system: PRESENTATION_SYSTEM_PROMPT,
      user: buildPresentationUserPrompt(input),
      temperature: 0.6,
    });

    const presentation = sanitizePresentation(raw);
    if (!presentation) throw new HttpError(502, 'Не удалось составить презентацию. Попробуйте ещё раз.');
    return Response.json({ presentation });
  } catch (error) {
    return errorResponse(error);
  }
}
