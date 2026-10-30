// Приводит ответ модели к ожидаемой структуре, чтобы интерфейс и экспорт
// не ломались из-за пропущенных полей или неверных типов.

const str = (value) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');
const strList = (value) => (Array.isArray(value) ? value.map(str).filter(Boolean) : []);

const SLIDE_TYPES = new Set([
  'title', 'bullets', 'rule', 'examples', 'columns', 'table',
  'task', 'quiz', 'quote', 'summary', 'reflection', 'homework',
]);

function sanitizeSlide(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const slide = {
    type: SLIDE_TYPES.has(raw.type) ? raw.type : 'bullets',
    title: str(raw.title),
    notes: str(raw.notes),
  };

  switch (slide.type) {
    case 'title':
      slide.subtitle = str(raw.subtitle);
      break;
    case 'rule':
      slide.rule = str(raw.rule);
      slide.bullets = strList(raw.bullets);
      break;
    case 'examples':
      slide.examples = (Array.isArray(raw.examples) ? raw.examples : [])
        .map((e) => (typeof e === 'string' ? { text: str(e), comment: '' } : { text: str(e?.text), comment: str(e?.comment) }))
        .filter((e) => e.text);
      break;
    case 'columns':
      slide.columns = (Array.isArray(raw.columns) ? raw.columns : [])
        .slice(0, 2)
        .map((c) => ({ heading: str(c?.heading), items: strList(c?.items) }));
      break;
    case 'table': {
      const headers = strList(raw.table?.headers);
      const width = headers.length;
      const rows = (Array.isArray(raw.table?.rows) ? raw.table.rows : [])
        .filter(Array.isArray)
        .map((row) => Array.from({ length: width }, (_, i) => str(row[i])));
      slide.table = { headers, rows };
      break;
    }
    case 'task':
      slide.task = {
        instruction: str(raw.task?.instruction),
        items: strList(raw.task?.items),
        answers: strList(raw.task?.answers),
      };
      break;
    case 'quiz': {
      const options = strList(raw.quiz?.options);
      const correct = Number.parseInt(raw.quiz?.correct, 10);
      slide.quiz = {
        question: str(raw.quiz?.question),
        options,
        correct: correct >= 0 && correct < options.length ? correct : -1,
      };
      break;
    }
    case 'quote':
      slide.quote = { text: str(raw.quote?.text), author: str(raw.quote?.author) };
      break;
    default:
      slide.bullets = strList(raw.bullets);
  }
  return slide;
}

export function sanitizePresentation(raw) {
  const slides = (Array.isArray(raw?.slides) ? raw.slides : []).map(sanitizeSlide).filter(Boolean);
  if (!slides.length) return null;
  return { title: str(raw.title), subtitle: str(raw.subtitle), slides };
}

const PHASES = ['Начало урока', 'Середина урока', 'Конец урока'];

export function sanitizeKsp(raw) {
  const stages = (Array.isArray(raw?.stages) ? raw.stages : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      phase: PHASES.includes(str(s.phase)) ? str(s.phase) : 'Середина урока',
      name: str(s.name),
      time: str(s.time),
      teacher: str(s.teacher),
      students: str(s.students),
      assessment: str(s.assessment),
      resources: str(s.resources),
    }));
  if (!stages.length) return null;

  return {
    section: str(raw.section),
    topic: str(raw.topic),
    learningObjectives: strList(raw.learningObjectives),
    lessonObjectives: strList(raw.lessonObjectives),
    assessmentCriteria: strList(raw.assessmentCriteria),
    languageObjectives: str(raw.languageObjectives),
    values: str(raw.values),
    crossCurricular: str(raw.crossCurricular),
    priorKnowledge: str(raw.priorKnowledge),
    stages,
    differentiation: str(raw.differentiation),
    homework: str(raw.homework),
    reflection: str(raw.reflection),
  };
}
