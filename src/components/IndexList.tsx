import { useRef, useState, type MouseEvent } from 'react';
import type { Paper } from '../lib/content.ts';
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion.ts';
import { TLink } from './motion/Transition.tsx';
import StatusBadge from './StatusBadge.tsx';

/** 首頁論文目錄：期刊目錄式的列表，滑過時代表圖跟著游標浮出 */
export default function IndexList({ papers, numbering }: { papers: Paper[]; numbering: Map<string, number> }) {
  const floatRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | undefined>();
  const last = useRef({ x: 0 });
  const enabled = isFinePointer() && !prefersReducedMotion();

  const onMove = (e: MouseEvent) => {
    if (!enabled || !floatRef.current) return;
    const vx = e.clientX - last.current.x;
    last.current.x = e.clientX;
    gsap.to(floatRef.current, { x: e.clientX + 40, y: e.clientY, rotate: gsap.utils.clamp(-12, 12, vx * 0.6), duration: 0.7, ease: 'power3.out' });
  };
  const show = (url?: string) => {
    if (!enabled || !floatRef.current) return;
    setSrc(url);
    gsap.to(floatRef.current, { autoAlpha: url ? 1 : 0, scale: url ? 1 : 0.6, duration: 0.5, ease: 'power3.out' });
  };

  return (
    <>
      <ol className="index-list" onMouseMove={onMove} onMouseLeave={() => show(undefined)} data-anim="stagger">
        {papers.map((p) => {
          const m = p.meta;
          const no = String(numbering.get(p.slug) ?? 0).padStart(2, '0');
          return (
            <li className="index-row" key={p.slug} onMouseEnter={() => show(p.coverUrl)}>
              <TLink to={`/papers/${p.slug}`} label={m.short_name ?? m.title_zh} data-cursor="閱讀">
                <span className="row-no">{no}</span>
                <div className="row-title">
                  <h3>
                    {m.short_name && <span className="short">{m.short_name}　</span>}
                    {m.title_zh}
                  </h3>
                  <p>{m.title}</p>
                </div>
                <span className="row-venue">
                  {m.venue} {m.year}
                  <br />
                  <span className="meta">{m.tags.join(' / ')}</span>
                </span>
                <span className="row-date">
                  <small>報告日期</small>
                  {m.report_date.replaceAll('-', '.')}
                </span>
                <span className="row-status">
                  <StatusBadge status={m.status} />
                </span>
                <span className="row-arrow" aria-hidden="true">
                  →
                </span>
              </TLink>
            </li>
          );
        })}
      </ol>
      {enabled && (
        <div className="hover-image" ref={floatRef} aria-hidden="true">
          {src && <img src={src} alt="" />}
        </div>
      )}
    </>
  );
}
