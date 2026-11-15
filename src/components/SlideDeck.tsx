import { useEffect, useMemo, useRef } from 'react';
import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import 'reveal.js/reveal.css';
import { parseSlides } from '../lib/slides.ts';
import { NO_SECTION_LABEL } from '../lib/rules.ts';
import MarkdownView from './MarkdownView.tsx';

interface Props {
  markdown: string;
  resolveAsset: (src: string | undefined) => string | undefined;
  /** 嵌入在頁面中（關於頁的示範）時為 true；全螢幕播放時為 false */
  embedded?: boolean;
  /** 列印／匯出 PDF 模式 */
  print?: boolean;
}

/** 包裝 reveal.js 的投影片元件（CLAUDE.md §12.4） */
export default function SlideDeck({ markdown, resolveAsset, embedded = false, print = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => parseSlides(markdown), [markdown]);

  useEffect(() => {
    if (!rootRef.current || slides.length === 0) return;
    const deck = new Reveal(rootRef.current, {
      embedded,
      width: 1280,
      height: 720,
      margin: 0.02,
      center: false,
      hash: false,
      history: false,
      transition: 'fade',
      transitionSpeed: 'fast',
      backgroundTransition: 'none',
      slideNumber: 'c/t',
      progress: true,
      controls: embedded,
      controlsTutorial: false,
      keyboardCondition: embedded ? 'focused' : null,
      view: print ? 'print' : null,
      plugins: [RevealNotes],
    });
    let alive = true;
    deck.initialize().then(() => {
      if (!alive) deck.destroy();
    });
    return () => {
      alive = false;
      try {
        deck.destroy();
      } catch {
        /* 尚未初始化完成時忽略 */
      }
    };
  }, [slides, embedded, print]);

  return (
    <div className="reveal reveal-paper" ref={rootRef}>
      <div className="slides">
        {slides.map((s) => (
          <section key={s.index} className={s.type} data-type={s.type}>
            {s.sectionLabel && !NO_SECTION_LABEL.includes(s.type) && <div className="slide-label">{s.sectionLabel}</div>}
            <MarkdownView markdown={s.body} resolveAsset={resolveAsset} className="slide-inner" />
            {s.notes && (
              <aside className="notes">
                <MarkdownView markdown={s.notes} />
              </aside>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
