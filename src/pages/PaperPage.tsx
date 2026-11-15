import { useMemo, useRef } from 'react';
import { useParams } from 'react-router';
import Layout from '../components/Layout.tsx';
import MarkdownView from '../components/MarkdownView.tsx';
import Toc from '../components/Toc.tsx';
import FigureGallery from '../components/FigureGallery.tsx';
import GlossaryTable from '../components/GlossaryTable.tsx';
import StatusBadge from '../components/StatusBadge.tsx';
import Chars from '../components/motion/Chars.tsx';
import Magnetic from '../components/motion/Magnetic.tsx';
import { TLink } from '../components/motion/Transition.tsx';
import { getPaper, getPapers, makeAssetResolver } from '../lib/content.ts';
import { BRIEF_HIDDEN } from '../lib/rules.ts';
import { usePageAnimations } from '../lib/usePageAnimations.ts';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion.ts';
import NotFoundPage from './NotFoundPage.tsx';

export default function PaperPage() {
  const { slug = '' } = useParams();
  const paper = getPaper(slug);
  if (!paper) return <NotFoundPage />;
  return <PaperView key={slug} slug={slug} />;
}

function PaperView({ slug }: { slug: string }) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const paper = getPaper(slug)!;
  const { meta, brief, glossary, figures, coverUrl } = paper;
  const resolve = makeAssetResolver(`/content/${slug}`);

  // 依報告日期排序的編號與「下一篇」
  const { no, next } = useMemo(() => {
    const ordered = [...getPapers()].sort((a, b) => a.meta.report_date.localeCompare(b.meta.report_date));
    const i = ordered.findIndex((p) => p.slug === slug);
    return { no: i + 1, next: ordered.length > 1 ? ordered[(i + 1) % ordered.length] : undefined };
  }, [slug]);

  const summary = brief.find((s) => s.title === '一句話摘要');
  const sections = brief.filter((s) => s.title !== '一句話摘要' && !(BRIEF_HIDDEN as readonly string[]).includes(s.title));
  const tocItems = useMemo(
    () => [...sections.map((s) => ({ id: s.id, title: s.title })), ...(figures.length ? [{ id: 'figures', title: '圖表一覽' }] : [])],
    [slug], // 內容在建置時就固定，slug 不變則目錄不變
  );

  usePageAnimations(root, [slug]);

  // 頁面頂端的閱讀進度條
  useGSAP(
    () => {
      if (!progress.current || prefersReducedMotion()) return;
      gsap.to(progress.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    },
    { dependencies: [slug] },
  );

  const titleLines = meta.title_zh.length > 14 ? splitTitle(meta.title_zh) : [meta.title_zh];

  return (
    <Layout>
      <div className="read-progress" ref={progress} aria-hidden="true" />
      <div ref={root}>
        <header className="paper-hero wrap">
          <div className="crumbs" data-anim="up">
            <span className="meta">
              <TLink to="/" label="目錄" className="link-u">
                目錄
              </TLink>{' '}
              ／ 閱讀筆記 ／ No.{String(no).padStart(2, '0')}
            </span>
            <StatusBadge status={meta.status} />
          </div>

          <div className="paper-hero-grid">
            <div>
              <span className="eyebrow" data-anim="up">
                {meta.short_name ?? '論文閱讀筆記'}
              </span>
              <h1 className="paper-title" data-anim="chars">
                {titleLines.map((t, i) => (
                  <Chars key={i} text={t} />
                ))}
              </h1>
              <p className="paper-title-en" data-anim="up" data-delay="0.3">
                {meta.title}
              </p>
            </div>
            <div className="paper-no" aria-hidden="true" data-anim="up" data-delay="0.2">
              {String(no).padStart(2, '0')}
            </div>
          </div>

          <dl className="paper-meta" data-anim="stagger">
            <div>
              <dt className="meta">作者</dt>
              <dd>{meta.authors.join('、')}</dd>
            </div>
            <div>
              <dt className="meta">發表</dt>
              <dd>{meta.venue}</dd>
            </div>
            <div>
              <dt className="meta">年份</dt>
              <dd className="mono">{meta.year}</dd>
            </div>
            <div>
              <dt className="meta">報告日期</dt>
              <dd className="mono">{meta.report_date.replaceAll('-', '.')}</dd>
            </div>
            <div>
              <dt className="meta">報告人</dt>
              <dd>{meta.presenter}</dd>
            </div>
          </dl>

          <div className="paper-actions" data-anim="up">
            <Magnetic>
              <TLink to={`/papers/${slug}/slides`} className="btn btn-accent" label="投影片">
                ▶　播放投影片 <span className="arrow">→</span>
              </TLink>
            </Magnetic>
            {meta.paper_url && (
              <Magnetic>
                <a href={meta.paper_url} className="btn" target="_blank" rel="noreferrer">
                  閱讀原文 <span className="arrow">↗</span>
                </a>
              </Magnetic>
            )}
            <div className="tags">
              {meta.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </header>

        {coverUrl && (
          <figure className="wrap paper-cover-figure">
            <div className="paper-cover" data-anim="clip">
              <img src={coverUrl} alt={`${meta.short_name ?? meta.title} 代表圖`} />
            </div>
            <figcaption className="paper-cover-cap">
              <span className="meta">代表圖 · {meta.cover.replace('fig/', '')}</span>
              <span className="meta">取自原文</span>
            </figcaption>
          </figure>
        )}

        {summary?.body && (
          <section className="pullquote wrap">
            <span className="eyebrow" data-anim="up">
              一句話摘要
            </span>
            <div data-anim="up">
              <MarkdownView markdown={summary.body} />
            </div>
          </section>
        )}

        <div className="paper-body wrap">
          <Toc items={tocItems} articleId="article" />
          <article className="article" id="article">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="article-section">
                <header data-anim="up">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <h2>{s.title}</h2>
                </header>
                <div data-anim="up">
                  {s.title === '術語表' ? (
                    <GlossaryTable terms={glossary} />
                  ) : (
                    <MarkdownView markdown={s.body || '_（尚未填寫）_'} resolveAsset={resolve} className="prose" />
                  )}
                </div>
              </section>
            ))}
            {figures.length > 0 && (
              <section id="figures" className="article-section">
                <header data-anim="up">
                  <span className="n">{String(sections.length + 1).padStart(2, '0')}</span>
                  <h2>圖表一覽</h2>
                </header>
                <FigureGallery figures={figures} />
              </section>
            )}
          </article>
        </div>

        {next && (
          <div className="wrap">
            <TLink to={`/papers/${next.slug}`} className="next-paper" label={next.meta.short_name ?? next.meta.title_zh} data-cursor="下一篇">
              <span className="eyebrow">下一篇</span>
              <h3>{next.meta.short_name ? `${next.meta.short_name}　${next.meta.title_zh}` : next.meta.title_zh}</h3>
              <span className="go" aria-hidden="true">
                →
              </span>
            </TLink>
          </div>
        )}
      </div>
    </Layout>
  );
}

/** 長標題在「：」或中間附近斷成兩行，讓逐字動畫的每一行都有遮罩 */
function splitTitle(t: string): string[] {
  const colon = t.search(/[：:，,]/);
  if (colon > 3 && colon < t.length - 3) return [t.slice(0, colon + 1), t.slice(colon + 1)];
  const mid = Math.ceil(t.length / 2);
  return [t.slice(0, mid), t.slice(mid)];
}
