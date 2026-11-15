import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { SITE } from '../config.ts';
import { applyTheme, getEffectiveTheme, type ThemeMode } from '../lib/theme.ts';
import { getLenis } from '../lib/motion.ts';
import { TLink } from './motion/Transition.tsx';

const NAV = [
  { to: '/', label: '目錄', no: '01', match: (p: string) => p === '/' || p.startsWith('/papers') },
  { to: '/glossary', label: '術語', no: '02', match: (p: string) => p.startsWith('/glossary') },
  { to: '/about', label: '關於', no: '03', match: (p: string) => p.startsWith('/about') },
];

/** 刊頭：往下捲動時隱藏、往上捲動時出現 */
export default function Header() {
  const { pathname } = useLocation();
  const [mode, setMode] = useState<ThemeMode>(getEffectiveTheme);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = (y: number) => {
      setScrolled(y > 20);
      if (Math.abs(y - last.current) > 6) {
        setHidden(y > last.current && y > 240);
        last.current = y;
      }
    };
    const lenis = getLenis();
    if (lenis) {
      const handler = ({ scroll }: { scroll: number }) => onScroll(scroll);
      lenis.on('scroll', handler);
      return () => lenis.off('scroll', handler);
    }
    const native = () => onScroll(window.scrollY);
    window.addEventListener('scroll', native, { passive: true });
    return () => window.removeEventListener('scroll', native);
  }, []);

  useEffect(() => setHidden(false), [pathname]);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setMode(next);
  };

  return (
    <header className={`masthead${hidden ? ' is-hidden' : ''}${scrolled ? ' is-scrolled' : ''}`}>
      <div className="masthead-issue">
        <span>第一卷</span>
        <span>二〇二六</span>
        <span>碩班論文報告</span>
      </div>
      <TLink to="/" className="masthead-brand" aria-label={`${SITE.name}：回到目錄`}>
        <span className="seal" aria-hidden="true">
          論
        </span>
        <span className="brand-name">{SITE.name}</span>
      </TLink>
      <nav className="masthead-nav" aria-label="主要導覽">
        {NAV.map((n) => (
          <TLink key={n.to} to={n.to} label={n.label} className={`nav-link${n.match(pathname) ? ' is-active' : ''}`}>
            <span className="nav-no">{n.no}</span>
            {n.label}
          </TLink>
        ))}
        <button className="theme-toggle" onClick={toggle} aria-label={mode === 'dark' ? '切換為淺色模式' : '切換為深色模式'} title="切換深淺色">
          {mode === 'dark' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}
