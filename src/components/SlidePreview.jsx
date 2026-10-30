import { Rich } from './Rich.jsx';
import { THEMES } from '../lib/themes.js';

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

function List({ items, numbered }) {
  if (!items?.length) return null;
  const Tag = numbered ? 'ol' : 'ul';
  return (
    <Tag className="slide__list">
      {items.map((item, i) => (
        <li key={i}>
          <Rich text={item} />
        </li>
      ))}
    </Tag>
  );
}

function Body({ slide }) {
  switch (slide.type) {
    case 'rule':
      return (
        <>
          <div className="slide__rule">
            <Rich text={slide.rule} />
          </div>
          <List items={slide.bullets} />
        </>
      );
    case 'examples':
      return (
        <ul className="slide__list">
          {slide.examples.map((e, i) => (
            <li key={i}>
              <Rich text={e.text} />
              {e.comment && <span className="slide__muted"> — {e.comment}</span>}
            </li>
          ))}
        </ul>
      );
    case 'columns':
      return (
        <div className="slide__columns">
          {slide.columns.map((col, i) => (
            <div key={i} className="slide__panel">
              <p className="slide__panel-title">{col.heading}</p>
              <List items={col.items} />
            </div>
          ))}
        </div>
      );
    case 'table':
      return (
        <table className="slide__table">
          <thead>
            <tr>
              {slide.table.headers.map((h, i) => (
                <th key={i}>
                  <Rich text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slide.table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j}>
                    <Rich text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'task':
      return (
        <>
          {slide.task.instruction && (
            <p className="slide__instruction">
              <Rich text={slide.task.instruction} />
            </p>
          )}
          <List items={slide.task.items} numbered />
        </>
      );
    case 'quiz':
      return (
        <>
          <p className="slide__question">
            <Rich text={slide.quiz.question} />
          </p>
          <div className="slide__options">
            {slide.quiz.options.map((o, i) => (
              <div key={i} className="slide__panel">
                <b className="slide__accent">{LETTERS[i]})</b> <Rich text={o} />
              </div>
            ))}
          </div>
        </>
      );
    case 'quote':
      return (
        <blockquote className="slide__quote">
          <Rich text={slide.quote.text} />
          {slide.quote.author && <footer>— {slide.quote.author}</footer>}
        </blockquote>
      );
    case 'homework':
      return (
        <div className="slide__panel slide__panel--fill">
          <List items={slide.bullets} />
        </div>
      );
    default:
      return <List items={slide.bullets} />;
  }
}

export function SlidePreview({ slide, index, themeKey, footer, fallbackTitle }) {
  const t = THEMES[themeKey] ?? THEMES.classic;
  const style = {
    '--s-bg': `#${t.background}`,
    '--s-surface': `#${t.surface}`,
    '--s-text': `#${t.text}`,
    '--s-muted': `#${t.muted}`,
    '--s-accent': `#${t.accent}`,
    '--s-accent-text': `#${t.accentText}`,
  };

  const answers =
    slide.type === 'task'
      ? slide.task.answers
      : slide.type === 'quiz' && slide.quiz.correct >= 0
        ? [`${LETTERS[slide.quiz.correct]}) ${slide.quiz.options[slide.quiz.correct]}`]
        : [];

  return (
    <article className="slide-card">
      <div className="slide-frame">
        {slide.type === 'title' ? (
          <div className="slide slide--title" style={style}>
            <h3 className="slide__big">
              <Rich text={slide.title || fallbackTitle} />
            </h3>
            <span className="slide__bar" />
            <p className="slide__subtitle">{slide.subtitle}</p>
          </div>
        ) : (
          <div className="slide" style={style}>
            <h3 className="slide__title">
              <Rich text={slide.title} />
            </h3>
            <span className="slide__bar" />
            <div className="slide__body">
              <Body slide={slide} />
            </div>
            <div className="slide__footer">
              <span>{footer}</span>
              <span>{index + 1}</span>
            </div>
          </div>
        )}
      </div>

      {(slide.notes || answers.length > 0) && (
        <details className="slide-notes">
          <summary>Слайд {index + 1}: заметки для учителя{answers.length > 0 && ' и ответы'}</summary>
          {slide.notes && <p>{slide.notes}</p>}
          {answers.length > 0 && (
            <>
              <p className="slide-notes__label">{slide.type === 'quiz' ? 'Правильный ответ:' : 'Ответы:'}</p>
              <ol className="slide-notes__answers">
                {answers.map((a, i) => (
                  <li key={i}>
                    <Rich text={a} />
                  </li>
                ))}
              </ol>
            </>
          )}
        </details>
      )}
    </article>
  );
}
