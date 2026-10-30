import { useEffect, useState } from 'react';
import { HomePage } from './pages/HomePage.jsx';
import { KspPage } from './pages/KspPage.jsx';
import { PresentationPage } from './pages/PresentationPage.jsx';

const ROUTES = {
  '': { component: HomePage, title: 'Помощник учителя' },
  presentation: { component: PresentationPage, title: 'Презентация к уроку — Помощник учителя' },
  ksp: { component: KspPage, title: 'КСП — Помощник учителя' },
};

function currentRoute() {
  const key = window.location.hash.replace(/^#\/?/, '');
  return ROUTES[key] ? key : '';
}

export function App() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    document.title = ROUTES[route].title;
  }, [route]);

  const Page = ROUTES[route].component;
  const link = (key, label) => (
    <a href={`#/${key}`} className={`nav__link${route === key ? ' nav__link--active' : ''}`} aria-current={route === key ? 'page' : undefined}>
      {label}
    </a>
  );

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar__inner">
          <a href="#/" className="brand">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Помощник учителя
          </a>
          <nav className="nav" aria-label="Разделы">
            {link('presentation', 'Презентация')}
            {link('ksp', 'КСП')}
          </nav>
        </div>
      </header>
      <main className="container">
        <Page />
      </main>
      <footer className="site-footer no-print">
        <div className="container">Помощник учителя русского языка. Материалы создаются с помощью ИИ — проверяйте их перед уроком.</div>
      </footer>
    </>
  );
}
