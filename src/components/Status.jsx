import { useEffect, useState } from 'react';

export function Loading({ messages }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 3500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="status" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <div>
        <p className="status__title">{messages[index]}</p>
        <p className="status__hint">Обычно это занимает 15–40 секунд. Не закрывайте страницу.</p>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="status status--error" role="alert">
      <p className="status__title">Не получилось</p>
      <p className="status__hint">{message}</p>
    </div>
  );
}
