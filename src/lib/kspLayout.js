// Общая раскладка КСП: используется и на странице, и при выгрузке в Word,
// чтобы документ выглядел одинаково везде.

export const STAGE_COLUMNS = [
  { key: 'stage', label: 'Этап урока / Время' },
  { key: 'teacher', label: 'Действия педагога' },
  { key: 'students', label: 'Действия ученика' },
  { key: 'assessment', label: 'Оценивание' },
  { key: 'resources', label: 'Ресурсы' },
];

function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}.${m}.${y}` : value;
}

function numbered(list) {
  return list.length > 1 ? list.map((item, i) => `${i + 1}) ${item}`) : list;
}

// Строки шапки: [подпись, значение]. Значение — строка или массив строк (абзацы).
export function headerRows(ksp, meta) {
  const grade = meta.grade ? `${meta.grade}${meta.letter ? ` «${meta.letter}»` : ''} класс. ` : '';
  const classLine = `${grade}Количество присутствующих: ____, отсутствующих: ____`;

  const rows = [
    ['Раздел (сквозная тема)', ksp.section],
    ['ФИО педагога', meta.teacher || ''],
    ['Дата', formatDate(meta.date)],
    ['Класс', classLine],
    ['Тема урока', ksp.topic],
    ['Цели обучения в соответствии с учебной программой', numbered(ksp.learningObjectives)],
    ['Цели урока', numbered(ksp.lessonObjectives)],
  ];

  if (meta.extended) {
    rows.push(
      ['Критерии оценивания', numbered(ksp.assessmentCriteria)],
      ['Языковые цели', ksp.languageObjectives],
      ['Привитие ценностей', ksp.values],
      ['Межпредметные связи', ksp.crossCurricular],
      ['Предварительные знания', ksp.priorKnowledge],
    );
  }
  return rows.filter(([, value]) => (Array.isArray(value) ? value.length : value !== undefined));
}

// Строки хода урока. Название этапа («Начало урока»…) выводится только
// в первой строке этапа, как в бумажных КСП.
export function stageRows(ksp) {
  return ksp.stages.map((stage, i) => ({
    ...stage,
    showPhase: i === 0 || ksp.stages[i - 1].phase !== stage.phase,
  }));
}

export function footerRows(ksp, meta) {
  const rows = [];
  if (meta.extended) rows.push(['Дифференциация', ksp.differentiation]);
  rows.push(['Домашнее задание', ksp.homework]);
  if (meta.extended) rows.push(['Рефлексия по уроку', ksp.reflection]);
  return rows.filter(([, value]) => value);
}

export function toLines(value) {
  const list = Array.isArray(value) ? value : [value ?? ''];
  return list.flatMap((item) => String(item).split('\n'));
}
