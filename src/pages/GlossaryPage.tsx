import { useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout.tsx';
import GlossaryTable from '../components/GlossaryTable.tsx';
import Chars from '../components/motion/Chars.tsx';
import { getGlossary, getPapers, type GlossaryEntry } from '../lib/content.ts';
import { usePageAnimations } from '../lib/usePageAnimations.ts';
import { scrollToElement } from '../lib/motion.ts';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const initialOf = (t: GlossaryEntry) => {
  const c = (t.en || t.zh).trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

export default function GlossaryPage() {
  const root = useRef<HTMLDivElement>(null);
  const all = getGlossary();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((t) => `${t.zh} ${t.en} ${t.description}`.toLowerCase().includes(q)) : all;
    const map = new Map<string, GlossaryEntry[]>();
    for (const t of filtered) {
      const k = initialOf(t);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return [...map.entries()].sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  }, [all, query]);

  usePageAnimations(root, []);
  const present = new Set(groups.map(([k]) => k));
  const jump = (k: string) => {
    const el = document.getElementById(`letter-${k}`);
    if (el) scrollToElement(el, -150);
  };

  return (
    <Layout>
      <div ref={root}>
        <section className="page-hero wrap">
          <span className="eyebrow" data-anim="up">
            Glossary · 附錄
          </span>
          <div className="page-hero-grid">
            <h1 className="page-title" data-anim="chars">
              <Chars text="術語表" />
            </h1>
            <p className="lead" data-anim="up" data-delay="0.3">
              自動彙整 {getPapers().length} 篇論文閱讀筆記中的 {all.length} 個術語。每一份投影片的中文翻譯都以此為準，整個投影片庫用詞一致。
            </p>
          </div>
        </section>

        <div className="wrap">
          <div className="gl-bar">
            <div className="gl-letters" aria-label="依字母跳轉">
              {LETTERS.map((l) => (
                <button key={l} className={present.has(l) ? 'has' : undefined} disabled={!present.has(l)} onClick={() => jump(l)}>
                  {l}
                </button>
              ))}
            </div>
            <label className="search-field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋中文、英文或說明" aria-label="搜尋術語" />
            </label>
          </div>

          {groups.length === 0 ? (
            <div className="index-empty">
              <h3>沒有符合的術語</h3>
              <p>換個關鍵字試試看。</p>
            </div>
          ) : (
            groups.map(([letter, terms]) => (
              <section className="gl-group" id={`letter-${letter}`} key={letter}>
                <div className="gl-letter" data-anim="up">
                  {letter}
                </div>
                <div data-anim="up">
                  <GlossaryTable terms={terms} showSources />
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
