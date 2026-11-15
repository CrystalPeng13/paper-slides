/**
 * 頁面動畫的統一入口（CLAUDE.md §13.5）。
 * 頁面只要在元素上標 data-anim / data-parallax，就會自動套用對應動畫，不需要各自寫 GSAP。
 *
 *   data-anim="chars"   逐字從遮罩下方升起（搭配 <Chars> 元件），用於大標題
 *   data-anim="up"      捲動到時淡入上移
 *   data-anim="stagger" 子元素依序淡入上移
 *   data-anim="rule"    分隔線由左向右畫出
 *   data-anim="clip"    圖片由下往上揭開並微縮放
 *   data-parallax="0.2" 捲動視差（數字越大位移越多，可為負數）
 *   data-delay="0.2"    額外延遲（秒）
 */
import type { RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP, getEnterDelay, prefersReducedMotion } from './motion.ts';

const inFirstView = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;

export function usePageAnimations(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || prefersReducedMotion()) return;
      const base = getEnterDelay();
      const delayOf = (el: Element) => Number((el as HTMLElement).dataset.delay ?? 0) + (inFirstView(el) ? base : 0);
      const q = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T & Element>(sel));

      q('[data-anim="chars"]').forEach((el) => {
        const chars = el.querySelectorAll('.split-char');
        gsap.from(chars, {
          yPercent: 115,
          rotate: 4,
          duration: 1.3,
          stagger: 0.03,
          delay: delayOf(el),
          scrollTrigger: inFirstView(el) ? undefined : { trigger: el, start: 'top 85%' },
        });
      });

      q('[data-anim="up"]').forEach((el) => {
        gsap.from(el, {
          y: 56,
          autoAlpha: 0,
          duration: 1.3,
          delay: delayOf(el),
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });

      q('[data-anim="stagger"]').forEach((el) => {
        gsap.from(el.children, {
          y: 48,
          autoAlpha: 0,
          duration: 1.2,
          stagger: 0.09,
          delay: delayOf(el),
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      q('[data-anim="rule"]').forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.6,
          ease: 'expo.inOut',
          delay: delayOf(el),
          scrollTrigger: { trigger: el, start: 'top 95%' },
        });
      });

      q('[data-anim="clip"]').forEach((el) => {
        const tl = gsap.timeline({ delay: delayOf(el), scrollTrigger: { trigger: el, start: 'top 85%' } });
        tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' });
        const img = el.querySelector('img');
        if (img) tl.from(img, { scale: 1.25, duration: 2, ease: 'expo.out' }, 0.2);
      });

      q('[data-parallax]').forEach((el) => {
        const speed = Number(el.dataset.parallax ?? 0.2);
        gsap.to(el, {
          yPercent: -speed * 100,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      // 版面因字型載入而改變時重新計算觸發位置
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope, dependencies: deps },
  );
}
