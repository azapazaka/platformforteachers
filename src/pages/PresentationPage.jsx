import { useRef, useState } from 'react';
import { CheckboxGroup, Select, TextArea, TextInput } from '../components/Form.jsx';
import { ErrorMessage, Loading } from '../components/Status.jsx';
import { SlidePreview } from '../components/SlidePreview.jsx';
import {
  DEFAULT_PRESENTATION_PARTS, GRADES, LESSON_TYPES, PRESENTATION_PARTS, PROGRAMS, PROGRAM_LABEL,
} from '../constants.js';
import { generate } from '../lib/api.js';
import { exportPresentation } from '../lib/exportPptx.js';
import { useStoredState } from '../lib/storage.js';
import { DEFAULT_THEME, THEMES } from '../lib/themes.js';

const INITIAL_FORM = {
  topic: '',
  grade: '5',
  program: 'ru',
  lessonType: LESSON_TYPES[0],
  slideCount: '12',
  include: DEFAULT_PRESENTATION_PARTS,
  wishes: '',
};

const LOADING_MESSAGES = [
  'Продумываем структуру урока…',
  'Подбираем примеры и упражнения…',
  'Оформляем слайды…',
  'Проверяем ответы…',
];

export function PresentationPage() {
  const [form, setForm] = useStoredState('presentation-form', INITIAL_FORM);
  const [result, setResult] = useStoredState('presentation-result', null);
  const [themeKey, setThemeKey] = useStoredState('presentation-theme', DEFAULT_THEME);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { presentation } = await generate('presentation', form);
      setResult({ presentation, grade: form.grade, program: form.program });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      await exportPresentation(result.presentation, { themeKey, footer });
    } catch (e) {
      console.error(e);
      setError('Не удалось создать файл PowerPoint. Попробуйте ещё раз.');
    } finally {
      setDownloading(false);
    }
  }

  const footer = result ? `${PROGRAM_LABEL[result.program]} · ${result.grade} класс` : '';

  return (
    <div className="page">
      <header className="page__header">
        <h1>Презентация к уроку</h1>
        <p className="lead">
          Укажите тему и пожелания. Вы получите готовые слайды с заметками и ответами для учителя, которые можно
          скачать в PowerPoint и изменить.
        </p>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <TextInput
          label="Тема урока"
          required
          wide
          value={form.topic}
          onChange={set('topic')}
          placeholder="Например: Правописание безударных гласных в корне слова"
        />
        <Select label="Класс" value={form.grade} onChange={set('grade')} options={GRADES} />
        <Select label="Тип урока" value={form.lessonType} onChange={set('lessonType')} options={LESSON_TYPES} />
        <Select label="Школа" value={form.program} onChange={set('program')} options={PROGRAMS} />
        <Select
          label="Количество слайдов"
          value={form.slideCount}
          onChange={set('slideCount')}
          options={['8', '10', '12', '15', '18', '20']}
        />
        <CheckboxGroup
          label="Что включить в презентацию"
          options={PRESENTATION_PARTS}
          value={form.include}
          onChange={set('include')}
        />
        <TextArea
          label="Ваши пожелания"
          hint="Необязательно. Чем подробнее, тем точнее результат."
          value={form.wishes}
          onChange={set('wishes')}
          placeholder="Например: класс слабый, нужно больше простых примеров; добавьте игру в начале урока; используйте слова о природе Казахстана."
        />
        <div className="form__actions">
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? 'Создаём презентацию…' : 'Создать презентацию'}
          </button>
        </div>
      </form>

      {loading && <Loading messages={LOADING_MESSAGES} />}
      <ErrorMessage message={error} />

      {result && !loading && (
        <section className="result" ref={resultRef} aria-labelledby="result-title">
          <div className="result__header">
            <div>
              <p className="eyebrow">Готово · {result.presentation.slides.length} слайдов</p>
              <h2 id="result-title">{result.presentation.title}</h2>
            </div>
            <div className="result__actions">
              <button type="button" className="button button--primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Готовим файл…' : 'Скачать PowerPoint'}
              </button>
              <button type="button" className="button" onClick={handleSubmit}>
                Создать другой вариант
              </button>
            </div>
          </div>

          <div className="themes" role="radiogroup" aria-label="Оформление">
            <span className="themes__label">Оформление:</span>
            {Object.entries(THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={themeKey === key}
                className={`theme-chip${themeKey === key ? ' theme-chip--active' : ''}`}
                onClick={() => setThemeKey(key)}
              >
                <span className="theme-chip__swatch" style={{ background: `#${theme.accent}` }} />
                {theme.name}
              </button>
            ))}
          </div>

          <div className="slides">
            {result.presentation.slides.map((slide, i) => (
              <SlidePreview
                key={i}
                slide={slide}
                index={i}
                themeKey={themeKey}
                footer={footer}
                fallbackTitle={result.presentation.title}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
