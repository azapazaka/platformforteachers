import { useEffect, useState } from 'react';

const PREFIX = 'pft:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// useState, который переживает перезагрузку страницы: учитель не потеряет
// заполненную форму и последний результат, если случайно обновит вкладку.
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Хранилище недоступно (приватный режим) — просто работаем без него.
    }
  }, [key, value]);
  return [value, setValue];
}
