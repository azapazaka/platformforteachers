const TOOLS = [
  {
    href: '#/presentation',
    title: 'Презентация к уроку',
    text: 'Слайды с правилами, примерами, упражнениями и тестом. С заметками и ответами для учителя. Скачивается в PowerPoint.',
    action: 'Создать презентацию',
  },
  {
    href: '#/ksp',
    title: 'Краткосрочный план (КСП)',
    text: 'Цели, этапы урока, действия педагога и учеников, оценивание с дескрипторами и ресурсы. Скачивается в Word.',
    action: 'Составить КСП',
  },
];

const STEPS = [
  'Выберите, что нужно подготовить.',
  'Укажите тему, класс и свои пожелания.',
  'Проверьте результат и скачайте файл.',
];

export function HomePage() {
  return (
    <div className="page">
      <header className="page__header page__header--home">
        <h1>Подготовка к уроку русского языка — за пару минут</h1>
        <p className="lead">
          Помощник составит презентацию и краткосрочный план урока по вашей теме. Вам останется проверить и при
          необходимости поправить.
        </p>
      </header>

      <div className="tools">
        {TOOLS.map((tool) => (
          <a key={tool.href} href={tool.href} className="card tool">
            <h2>{tool.title}</h2>
            <p>{tool.text}</p>
            <span className="tool__action">{tool.action} →</span>
          </a>
        ))}
      </div>

      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title">Как это работает</h2>
        <ol>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
