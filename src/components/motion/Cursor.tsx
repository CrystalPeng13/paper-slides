import { useEffect, useRef } from 'react';
import { gsap, isFinePointer, prefersReducedMotion } from '../../lib/motion.ts';

/**
 * 自訂游標：小點即時跟隨、外圈延遲跟隨。
 * 滑到連結時外圈放大；滑到帶有 data-cursor="文字" 的元素時，外圈變成赤陶色圓並顯示文字。
 */
export default function Cursor({ enabled }: { enabled: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const active = enabled && isFinePointer() && !prefersReducedMotion();

  useEffect(() => {
    if (!active || !root.current || !dot.current || !ring.current) return;
    document.documentElement.classList.add('has-cursor');
    const el = root.current;
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' });

    const onMove = (e: MouseEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      el.classList.remove('is-hidden');
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const labelled = t.closest<HTMLElement>('[data-cursor]');
      const link = t.closest('a, button, input, select, label, [role="button"]');
      el.classList.toggle('is-label', !!labelled);
      el.classList.toggle('is-link', !labelled && !!link);
      if (label.current) label.current.textContent = labelled?.dataset.cursor ?? '';
    };
    const onLeave = () => el.classList.add('is-hidden');
    const onDown = () => el.classList.add('is-down');
    const onUp = () => el.classList.remove('is-down');

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className="cursor is-hidden" ref={root} aria-hidden="true">
      <div className="cursor-ring" ref={ring}>
        <span ref={label} />
      </div>
      <div className="cursor-dot" ref={dot} />
    </div>
  );
}
