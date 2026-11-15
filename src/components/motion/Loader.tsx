import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../../lib/motion.ts';
import Chars from './Chars.tsx';

export const LOADER_DURATION = 2.4; // 秒；頁面的進場動畫會等這段時間

/** 開場動畫：每次開啟網站（同一個分頁只播一次）時，計數到 100 後墨色幕向上收起 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useGSAP(
    () => {
      const counter = { v: 0 };
      const tl = gsap.timeline({ onComplete: onDone });
      tl.from('.split-char', { yPercent: 115, duration: 1.1, stagger: 0.04, ease: 'expo.out' }, 0)
        .to(counter, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => setCount(Math.round(counter.v)) }, 0)
        .to('.loader-bar', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
        .to('.loader-title, .loader-foot', { y: -40, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 1.75)
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 1.85);
    },
    { scope: root },
  );

  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader-title">
        <Chars text="把論文，" />
        <Chars text="讀成一場報告。" className="accent" />
      </div>
      <div className="loader-foot">
        <span>論文報告投影片庫 · 第一卷</span>
        <span className="loader-count">{String(count).padStart(3, '0')}</span>
      </div>
      <div className="loader-bar" />
    </div>
  );
}
