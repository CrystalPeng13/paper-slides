import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../../lib/motion.ts';

/** 跑馬燈：持續橫向捲動；頁面捲動時會加速，往上捲時反向 */
export default function Marquee({ items }: { items: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!track.current || prefersReducedMotion()) return;
      const loop = gsap.to(track.current, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      let direction = 1;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (self.direction !== direction) direction = self.direction;
          const boost = Math.min(Math.abs(self.getVelocity()) / 300, 6);
          gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.3, overwrite: true });
          gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.3, overwrite: false });
        },
      });
    },
    { scope: root },
  );

  const row = (copy: number) =>
    items.map((t, i) => (
      <span className="marquee-item" key={`${copy}-${i}`} aria-hidden={copy > 0}>
        <span className={i % 2 ? 'outline' : undefined}>{t}</span>
        <span className="star">✳</span>
      </span>
    ));

  return (
    <div className="marquee" ref={root}>
      <div className="marquee-track" ref={track}>
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
