// Темы оформления презентации. Цвета без «#» — так их ждёт pptxgenjs.
export const THEMES = {
  classic: {
    name: 'Классическая',
    background: 'FFFFFF',
    surface: 'EEF3F9',
    text: '1F2933',
    muted: '52606D',
    accent: '2C5282',
    accentText: 'FFFFFF',
  },
  sage: {
    name: 'Спокойная',
    background: 'FBFBF7',
    surface: 'E9F0E6',
    text: '22301F',
    muted: '56644F',
    accent: '4A6B3F',
    accentText: 'FFFFFF',
  },
  warm: {
    name: 'Тёплая',
    background: 'FFFAF3',
    surface: 'F7E8D8',
    text: '3A2A1E',
    muted: '76604D',
    accent: 'B4532A',
    accentText: 'FFFFFF',
  },
  graphite: {
    name: 'Строгая',
    background: 'F7F7F8',
    surface: 'E4E5E9',
    text: '1C1D21',
    muted: '595C66',
    accent: '33363F',
    accentText: 'FFFFFF',
  },
};

export const DEFAULT_THEME = 'classic';
