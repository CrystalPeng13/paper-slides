import { useEffect, useState, type MouseEvent } from 'react';
import { ScrollTrigger, scrollToElement } from '../lib/motion.ts';

interface Props {
  items: Array<{ id: string; title: string }>;
  /** 用來計算閱讀進度的文章容器 id */
  articleId: string;
}

/** 側邊目錄：捲動時標示目前章節，底部顯示本文閱讀進度 */
export default function Toc({ items, articleId }: Props) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const triggers = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el)
      .map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 40%',
          end: 'bottom 40%',
          onToggle: (self) => self.isActive && setActive(el.id),
        }),
      );
    const article = document.getElementById(articleId);
    const prog = article
      ? ScrollTrigger.create({ trigger: article, start: 'top 40%', end: 'bottom 60%', onUpdate: (s) => setProgress(s.progress) })
      : null;
    return () => {
      triggers.forEach((t) => t.kill());
      prog?.kill();
    };
  }, [items, articleId]);

  // HashRouter 佔用了網址的 #，所以用平滑捲動取代錨點連結
  const jump = (e: MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) scrollToElement(el);
  };

  return (
    <nav className="toc" aria-label="本頁目錄">
      <div className="meta">目錄 · Contents</div>
      <ol>
        {items.map((i, n) => (
          <li key={i.id}>
            <a href={`#${i.id}`} onClick={(e) => jump(e, i.id)} className={active === i.id ? 'is-active' : undefined}>
              <span className="n">{String(n + 1).padStart(2, '0')}</span>
              {i.title}
            </a>
          </li>
        ))}
      </ol>
      <div className="toc-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </nav>
  );
}
