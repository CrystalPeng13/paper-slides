import { useEffect, useRef, useState } from 'react';
import type { Paper } from '../lib/content.ts';
import { gsap, setSmoothScroll } from '../lib/motion.ts';

/** 圖表一覽：點擊放大檢視（Esc 或點背景關閉，左右鍵切換） */
export default function FigureGallery({ figures }: { figures: Paper['figures'] }) {
  const [open, setOpen] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    setSmoothScroll(false);
    if (boxRef.current) gsap.fromTo(boxRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % figures.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + figures.length) % figures.length));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      setSmoothScroll(true);
    };
  }, [open, figures.length]);

  if (figures.length === 0) return <p className="muted">尚未擷取任何圖表。</p>;
  const current = open !== null ? figures[open] : null;

  return (
    <>
      <div className="gallery" data-anim="stagger">
        {figures.map((f, i) => (
          <button key={f.file} onClick={() => setOpen(i)} data-cursor="放大">
            <div className="frame">
              <img src={f.url} alt={f.label} loading="lazy" />
            </div>
            <div className="cap">
              <span className="meta">{f.label}</span>
              <span className="meta">{String(i + 1).padStart(2, '0')}</span>
            </div>
          </button>
        ))}
      </div>
      {current && (
        <div className="lightbox" ref={boxRef} role="dialog" aria-modal="true" aria-label={current.label} onClick={() => setOpen(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.label} />
            <figcaption>
              <span>{current.label}</span>
              <span>
                {(open ?? 0) + 1} / {figures.length} · ← → 切換 · Esc 關閉
              </span>
            </figcaption>
          </figure>
          <button className="lightbox-close" onClick={() => setOpen(null)} aria-label="關閉">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
