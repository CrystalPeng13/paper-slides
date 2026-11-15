import { useRef, type MouseEvent, type ReactNode } from 'react';
import { gsap, isFinePointer, prefersReducedMotion } from '../../lib/motion.ts';

/** 磁吸效果：游標靠近時元素被吸過去，離開時彈回 */
export default function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = isFinePointer() && !prefersReducedMotion();

  const move = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.6, ease: 'power3.out' });
  };
  const leave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <span ref={ref} onMouseMove={move} onMouseLeave={leave} className="magnetic">
      {children}
    </span>
  );
}
