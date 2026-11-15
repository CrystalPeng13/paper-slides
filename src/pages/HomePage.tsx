import { useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout.tsx';
import IndexList from '../components/IndexList.tsx';
import Chars from '../components/motion/Chars.tsx';
import Marquee from '../components/motion/Marquee.tsx';
import Magnetic from '../components/motion/Magnetic.tsx';
import { TLink } from '../components/motion/Transition.tsx';
import { getAllTags, getContentErrors, getPapers } from '../lib/content.ts';
import { usePageAnimations } from '../lib/usePageAnimations.ts';
import { scrollToElement } from '../lib/motion.ts';
import { SLIDE_TYPES } from '../lib/rules.ts';

type SortKey = 'report' | 'year';

export default function HomePage() {
  const root = useRef<HTMLDivElement>(null);
  const papers = getPapers();
  const tags = getAllTags();
  const errors = getContentErrors();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('report');

  // 編號依報告順序固定（最早報告的是 01），不受篩選影響
  const numbering = useMemo(() => {
    const byDate = [...papers].sort((a, b) => a.meta.report_date.localeCompare(b.meta.report_date));
    return new Map(byDate.map((p, i) => [p.slug, i + 1]));
  }, [papers]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers
      .filter((p) => !tag || p.meta.tags.includes(tag))
      .filter((p) => {
        if (!q) return true;
        const m = p.meta;
        return [m.title, m.title_zh, m.short_name ?? '', m.venue, ...m.authors, ...m.tags].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => (sort === 'year' ? b.meta.year - a.meta.year : b.meta.report_date.localeCompare(a.meta.report_date)));
  }, [papers, query, tag, sort]);

  usePageAnimations(root, []);

  const latest = papers[0]?.meta.report_date.replaceAll('-', '.') ?? '—';
  const marqueeItems = [...new Set([...papers.map((p) => p.meta.short_name ?? p.meta.title_zh), ...tags, '碩班論文報告', '三十分鐘'])];

  const toIndex = () => {
    const el = document.getElementById('index');
    if (el) scrollToElement(el, -40);
  };

  return (
    <Layout>
      <div ref={root}>
        <section className="hero wrap">
          <div className="hero-top" data-anim="up">
            <span className="eyebrow">碩班論文報告 · 投影片與閱讀筆記</span>
            <span className="meta">No. {String(papers.length).padStart(3, '0')} — 最近更新 {latest}</span>
          </div>

          <h1 className="hero-title" data-anim="chars">
            <Chars text="把論文，" />
            <Chars text="讀成一場" className="indent" />
            <span className="split-line indent">
              <Chars text="報告" className="accent" inline />
              <Chars text="。" inline />
            </span>
          </h1>

          <div className="hero-foot" data-anim="stagger">
            <p className="hero-lead">一篇論文進來，一份三十分鐘的報告出去。每一份投影片與閱讀筆記，都依照同一套 CLAUDE.md 規範產出。</p>
            <div className="hero-stat">
              <span className="meta">已收錄</span>
              <span className="num">{String(papers.length).padStart(2, '0')}</span>
            </div>
            <div className="hero-stat">
              <span className="meta">研究主題</span>
              <span className="num">{String(tags.length).padStart(2, '0')}</span>
            </div>
            <div className="hero-stat">
              <span className="meta">頁面類型</span>
              <span className="num">{SLIDE_TYPES.length}</span>
            </div>
            <button className="scroll-cue" onClick={toIndex} aria-label="捲動到論文目錄">
              往下閱讀
            </button>
          </div>
        </section>

        <Marquee items={marqueeItems} />

        <section className="section wrap" id="index">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="目錄" />
            </h2>
            <span className="meta" data-anim="up">
              Index — 共 {papers.length} 篇
            </span>
          </div>

          {errors.length > 0 && (
            <div className="alert" role="alert">
              有 {errors.length} 篇論文的內容格式錯誤而未顯示：{errors.map((e) => e.slug).join('、')}。請執行 <code>npm run check</code> 查看原因。
            </div>
          )}

          <div className="index-tools">
            <div className="index-filters" role="group" aria-label="依主題篩選">
              <button className="chip" aria-pressed={tag === null} onClick={() => setTag(null)}>
                全部
              </button>
              {tags.map((t) => (
                <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="index-search">
              <label className="search-field">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋標題、作者、關鍵字" aria-label="搜尋論文" />
              </label>
              <button className="sort-toggle" onClick={() => setSort(sort === 'report' ? 'year' : 'report')} title="切換排序方式">
                排序：{sort === 'report' ? '報告日期 ↓' : '論文年份 ↓'}
              </button>
            </div>
          </div>

          {papers.length === 0 ? (
            <div className="index-empty">
              <h3>這一卷還沒有任何論文</h3>
              <p>把 PDF 放進 papers/，請 AI 依照 CLAUDE.md 的標準流程產出第一份報告。</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="index-empty">
              <h3>找不到符合的論文</h3>
              <p>換個關鍵字，或清除主題篩選。</p>
            </div>
          ) : (
            <IndexList key={`${tag}-${sort}-${query}`} papers={shown} numbering={numbering} />
          )}
        </section>

        <section className="section wrap">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="一套規則，" />
              <Chars text="反覆使用。" className="accent" />
            </h2>
          </div>
          <div className="how-grid" data-anim="stagger">
            <div className="how-item">
              <span className="big">01</span>
              <h3>精讀，留下出處</h3>
              <p>AI 先把論文寫成閱讀筆記，每一個重點都標註原文頁碼，不憑印象、不捏造數據。</p>
            </div>
            <div className="how-item">
              <span className="big">02</span>
              <h3>依結構，排成報告</h3>
              <p>固定的十四個章節、十二種頁面類型、標題寫結論句，三十分鐘剛好講完。</p>
            </div>
            <div className="how-item">
              <span className="big">03</span>
              <h3>由程式，檢查規範</h3>
              <p>欄位缺漏、圖片遺失、條列過長、大陸用語，都會在建置前被自動攔下。</p>
            </div>
          </div>
          <div className="how-cta" data-anim="up">
            <Magnetic>
              <TLink to="/about" className="btn" label="關於">
                了解整套規範 <span className="arrow">→</span>
              </TLink>
            </Magnetic>
          </div>
        </section>
      </div>
    </Layout>
  );
}
