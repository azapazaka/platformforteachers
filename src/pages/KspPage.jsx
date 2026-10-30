import { useRef, useState } from 'react';
import { Select, TextArea, TextInput, Toggle } from '../components/Form.jsx';
import { ErrorMessage, Loading } from '../components/Status.jsx';
import { KspDocument } from '../components/KspDocument.jsx';
import { GRADES, LESSON_TYPES, PROGRAMS } from '../constants.js';
import { generate } from '../lib/api.js';
import { exportKsp } from '../lib/exportDocx.js';
import { useStoredState } from '../lib/storage.js';

const INITIAL_FORM = {
  topic: '',
  section: '',
  grade: '5',
  letter: '',
  program: 'ru',
  lessonType: LESSON_TYPES[0],
  duration: '45',
  teacher: '',
  date: '',
  learningObjectives: '',
  wishes: '',
  extended: true,
};

const LOADING_MESSAGES = [
  'Формулируем цели урока…',
  'Расписываем этапы урока…',
  'Подбираем задания и дескрипторы…',
  'Сверяем время по этапам…',
];

export function KspPage() {
  const [form, setForm] = useStoredState('ksp-form', INITIAL_FORM);
  const [result, setResult] = useStoredState('ksp-result', null);
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
      const { ksp } = await generate('ksp', form);
      setResult({ ksp, grade: form.grade });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ФИО, дату и литеру можно поменять и после генерации — документ обновится сразу.
  const meta = {
    teacher: form.teacher,
    date: form.date,
    letter: form.letter,
    grade: result?.grade,
    extended: form.extended,
  };

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      await exportKsp(result.ksp, meta);
    } catch (e) {
      console.error(e);
      setError('Не удалось создать файл Word. Попробуйте ещё раз.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header no-print">
        <h1>Краткосрочный план урока (КСП)</h1>
        <p className="lead">
          План по форме обновлённого содержания: цели, этапы урока с действиями педагога и учеников, оценивание с
          дескрипторами и ресурсы. Готовый КСП можно скачать в Word и распечатать.
        </p>
      </header>

      <form className="card form no-print" onSubmit={handleSubmit}>
        <TextInput
          label="Тема урока"
          required
          wide
          value={form.topic}
          onChange={set('topic')}
          placeholder="Например: Имя прилагательное как часть речи"
        />
        <TextInput
          label="Раздел (сквозная тема)"
          wide
          value={form.section}
          onChange={set('section')}
          placeholder="Например: Мир профессий"
          hint="Если оставить пустым, раздел предложит помощник."
        />
        <Select label="Класс" value={form.grade} onChange={set('grade')} options={GRADES} />
        <TextInput label="Литера класса" value={form.letter} onChange={set('letter')} placeholder="А" />
        <Select label="Тип урока" value={form.lessonType} onChange={set('lessonType')} options={LESSON_TYPES} />
        <Select
          label="Длительность урока"
          value={form.duration}
          onChange={set('duration')}
          options={[
            { value: '45', label: '45 минут' },
            { value: '40', label: '40 минут' },
            { value: '35', label: '35 минут' },
            { value: '90', label: '90 минут (спаренный урок)' },
          ]}
        />
        <Select label="Школа" value={form.program} onChange={set('program')} options={PROGRAMS} wide />
        <TextInput label="ФИО педагога" value={form.teacher} onChange={set('teacher')} placeholder="Иванова Анна Сергеевна" />
        <TextInput label="Дата урока" type="date" value={form.date} onChange={set('date')} />
        <TextArea
          label="Цели обучения по учебной программе"
          hint="Рекомендуем вставить цели с кодами из учебной программы — так КСП будет точно соответствовать программе. Если оставить пустым, цели будут сформулированы без кодов."
          value={form.learningObjectives}
          onChange={set('learningObjectives')}
          rows={3}
          placeholder="Например: 5.3.1.1 – использовать имена прилагательные в речи…"
        />
        <TextArea
          label="Ваши пожелания"
          hint="Необязательно: методы и приёмы, формы работы, особенности класса, что обязательно включить."
          value={form.wishes}
          onChange={set('wishes')}
          placeholder="Например: работа в группах, приём «Кластер», в классе много учеников с трудностями в письме, нужна физминутка."
        />
        <Toggle
          label="Расширенный КСП"
          hint="Добавить критерии оценивания, языковые цели, ценности, межпредметные связи, дифференциацию и рефлексию."
          checked={form.extended}
          onChange={set('extended')}
        />
        <div className="form__actions">
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? 'Составляем КСП…' : 'Составить КСП'}
          </button>
        </div>
      </form>

      {loading && <Loading messages={LOADING_MESSAGES} />}
      <ErrorMessage message={error} />

      {result && !loading && (
        <section className="result" ref={resultRef} aria-labelledby="ksp-title">
          <div className="result__header no-print">
            <div>
              <p className="eyebrow">Готово</p>
              <h2 id="ksp-title">{result.ksp.topic}</h2>
            </div>
            <div className="result__actions">
              <button type="button" className="button button--primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Готовим файл…' : 'Скачать Word'}
              </button>
              <button type="button" className="button" onClick={() => window.print()}>
                Печать
              </button>
              <button type="button" className="button" onClick={handleSubmit}>
                Создать другой вариант
              </button>
            </div>
          </div>
          <p className="note no-print">
            Проверьте план перед уроком: помощник может ошибаться, а вы лучше знаете свой класс. В Word документ можно
            свободно редактировать.
          </p>
          <div className="card card--doc">
            <KspDocument ksp={result.ksp} meta={meta} />
          </div>
        </section>
      )}
    </div>
  );
}
