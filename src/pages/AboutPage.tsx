import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.tsx';
import SlideDeck from '../components/SlideDeck.tsx';
import Chars from '../components/motion/Chars.tsx';
import { loadSlideTypesDemo, resolveTemplateAsset } from '../lib/content.ts';
import { usePageAnimations } from '../lib/usePageAnimations.ts';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion.ts';
import { SITE } from '../config.ts';

/** CLAUDE.md §4 新論文標準流程 */
const STEPS = [
  { title: '收件', desc: 'PDF 放進 papers/，確認報告日期，複製範本建立論文資料夾。' },
  { title: '精讀論文', desc: '擷取全文，寫成 brief.md。每一個重點都標註原文頁碼。' },
  { title: '擬大綱', desc: '依標準章節列出每一頁的類型與結論句標題，停下來等使用者確認。', checkpoint: true },
  { title: '擷取圖表', desc: '用 pdf_figures.py 找出圖說位置，從 PDF 高解析度裁切原圖。' },
  { title: '寫投影片', desc: '以十二種頁面類型撰寫 slides.md，每頁附一分鐘的講者備註。' },
  { title: '自動檢查', desc: 'npm run check 驗證規範，npm run build 確認網站可以建置。' },
  { title: '交件', desc: '逐項完成檢查清單，回報所有待確認與待填寫的位置。' },
];

const PILLARS = [
  { k: '構', title: '結構', items: ['三十分鐘、十四個固定章節', '總頁數 26～32 頁', '一篇論文一個資料夾'] },
  { k: '文', title: '寫作', items: ['標題寫結論句', '條列 ≤ 5 點、每點 ≤ 25 字', '繁體中文＋英文術語'] },
  { k: '誠', title: '學術誠信', items: ['數字都能對應原文頁碼', '圖表必附來源', '個人評論留給報告人'] },
  { k: '驗', title: '自動檢查', items: ['欄位缺漏 → 建置失敗', '條列過長 → 警告', '規範寫在程式裡'] },
];

const STACK = [
  { k: '框架', v: 'React + TypeScript', d: '以元件組織頁面，型別即規範' },
  { k: '建置', v: 'Vite', d: '建置時自動掃描 content/，新增論文免改程式' },
  { k: '投影片', v: 'reveal.js', d: '全螢幕、講者模式、匯出 PDF' },
  { k: '內容', v: 'Markdown + KaTeX', d: '投影片與筆記共用同一套解析規則' },
  { k: '動態', v: 'GSAP + Lenis', d: '平滑捲動、逐字浮現、換頁布幕' },
  { k: '驗證', v: 'zod + PyMuPDF', d: '內容格式檢查、PDF 圖表裁切' },
];

export default function AboutPage() {
  const root = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [demo, setDemo] = useState<string | null>(null);

  useEffect(() => {
    loadSlideTypesDemo().then(setDemo);
  }, []);

  usePageAnimations(root, []);

  // 七個步驟：捲動時把區塊釘住，卡片橫向移動
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 821px)', () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: steps.current,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(el, { x: () => -distance(), ease: 'none' }, 0)
          .to(bar.current, { scaleX: 1, ease: 'none' }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Layout>
      <div ref={root}>
        <section className="page-hero about-hero wrap">
          <span className="eyebrow" data-anim="up">
            About · 關於這套規範
          </span>
          <div className="page-hero-grid">
            <h1 className="page-title" data-anim="chars">
              <Chars text="不只是網站，" />
              <span className="split-line">
                <Chars text="是一套" inline />
                <Chars text="規則" className="accent" inline />
                <Chars text="。" inline />
              </span>
            </h1>
            <p className="lead" data-anim="up" data-delay="0.4">
              專案根目錄的 CLAUDE.md 定義了論文報告的結構、頁面類型、寫作原則與檢查方式。每次拿到新論文，AI 只要讀過這份規範，就能照同一套流程，產出風格一致、忠於原文的報告。
            </p>
          </div>
        </section>

        <section className="steps" ref={steps}>
          <div className="steps-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="七個步驟" />
            </h2>
            <span className="meta">從 PDF 到上台 · 捲動瀏覽 →</span>
          </div>
          <div className="steps-track" ref={track}>
            {STEPS.map((s, i) => (
              <article className={`step-card${s.checkpoint ? ' is-check' : ''}`} key={s.title}>
                <span className="no">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {s.checkpoint && <span className="flag">⛔ 檢查點 · 必須等使用者確認</span>}
              </article>
            ))}
          </div>
          <div className="steps-progress" aria-hidden="true">
            <span ref={bar} />
          </div>
        </section>

        <section className="section wrap">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="規範管什麼" />
            </h2>
            <span className="meta">四個面向</span>
          </div>
          <div className="pillars" data-anim="stagger">
            {PILLARS.map((p) => (
              <div className="pillar" key={p.title}>
                <span className="k">{p.k}</span>
                <h3>{p.title}</h3>
                <ul>
                  {p.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section wrap">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="十二種頁面" />
            </h2>
            <span className="meta">templates/slide-types.md 實際渲染</span>
          </div>
          <div className="demo-wrap">
            <div className="demo-deck" data-anim="clip" data-cursor="翻頁">
              {demo && <SlideDeck markdown={demo} resolveAsset={resolveTemplateAsset} embedded />}
            </div>
            <aside className="demo-side" data-anim="up">
              <p>每一種頁面都有固定的用途與寫法：封面、章節分隔、條列、圖片、表格、公式、左右比較、重點結論、個人評論、Q&amp;A、參考文獻。</p>
              <p>
                點一下投影片，用 <span className="kbd">←</span> <span className="kbd">→</span> 翻頁。
              </p>
              <p>AI 新增論文時只能使用這十二種類型；需要新類型時，必須先提議並同步更新規範。</p>
            </aside>
          </div>
        </section>

        <section className="section wrap">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars">
              <Chars text="技術架構" />
            </h2>
            {SITE.REPO_URL && (
              <a href={`${SITE.REPO_URL}/blob/main/CLAUDE.md`} target="_blank" rel="noreferrer" className="btn btn-sm">
                閱讀 CLAUDE.md <span className="arrow">↗</span>
              </a>
            )}
          </div>
          <div className="stack" data-anim="stagger">
            {STACK.map((s) => (
              <div key={s.k}>
                <span className="meta">{s.k}</span>
                <h4>{s.v}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
