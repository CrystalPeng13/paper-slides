import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { TLink } from '../components/motion/Transition.tsx';
import SlideDeck from '../components/SlideDeck.tsx';
import { getPaper, makeAssetResolver } from '../lib/content.ts';
import NotFoundPage from './NotFoundPage.tsx';

export default function SlidesPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const print = params.has('print');
  const paper = getPaper(slug);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let alive = true;
    paper?.loadSlides().then((md) => alive && setMarkdown(md));
    return () => {
      alive = false;
    };
  }, [paper]);

  useEffect(() => {
    if (paper) document.title = `${paper.meta.short_name ?? paper.meta.title}｜投影片`;
    document.documentElement.classList.add('slides-mode');
    return () => {
      document.documentElement.classList.remove('slides-mode');
      document.title = '論文報告投影片庫';
    };
  }, [paper]);

  if (!paper) return <NotFoundPage />;
  if (markdown === null) return <div className="slides-loading">載入投影片中…</div>;
  if (markdown.trim() === '') return <div className="slides-loading">這篇論文還沒有投影片（slides.md 是空的）。</div>;

  return (
    <div className={`slides-page${print ? ' is-print' : ''}`}>
      <SlideDeck markdown={markdown} resolveAsset={makeAssetResolver(`/content/${slug}`)} print={print} />
      {!print && (
        <div className="slides-chrome">
          <TLink to={`/papers/${slug}`} className="chrome-btn" title="回到閱讀筆記" label={paper.meta.short_name ?? paper.meta.title_zh}>
            ← 閱讀筆記
          </TLink>
          <span className="chrome-title">{paper.meta.short_name ?? paper.meta.title_zh}</span>
          <button className="chrome-btn" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
            快捷鍵 ?
          </button>
          <button
            className="chrome-btn"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
          >
            全螢幕 ⤢
          </button>
          {showHelp && (
            <div className="chrome-help" role="dialog" aria-label="快捷鍵說明">
              <div><kbd>→</kbd> <kbd>←</kbd> 翻頁</div>
              <div><kbd>F</kbd> 全螢幕</div>
              <div><kbd>S</kbd> 講者模式（開新視窗顯示講稿與計時）</div>
              <div><kbd>O</kbd> / <kbd>Esc</kbd> 總覽所有頁面</div>
              <div><kbd>B</kbd> 黑屏暫停</div>
              <div>
                <a href={`#/papers/${slug}/slides?print`} target="_blank" rel="noreferrer">
                  匯出 PDF ↗
                </a>
                <span>（開啟後按 Ctrl+P，選「另存為 PDF」）</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
