/**
 * 動態系統的核心（CLAUDE.md §13.5）：GSAP 外掛註冊、Lenis 平滑捲動、減少動態偏好、進場延遲。
 * 所有動畫元件都從這裡取得 gsap 與 lenis，不要各自 new Lenis()。
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: 'expo.out', duration: 1 });

export { gsap, ScrollTrigger, useGSAP };

/** 使用者的系統設定為「減少動態」時，關閉所有大型動畫 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 觸控裝置不顯示自訂游標與游標跟隨效果 */
export const isFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

// ---------- Lenis 平滑捲動 ----------
let lenis: Lenis | null = null;

export function startLenis(): Lenis | null {
  if (lenis || prefersReducedMotion()) return lenis;
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = (): Lenis | null => lenis;

/** 投影片頁要暫停平滑捲動，避免與 reveal.js 的鍵盤與滾輪操作衝突 */
export function setSmoothScroll(enabled: boolean) {
  if (!lenis) return;
  if (enabled) lenis.start();
  else lenis.stop();
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToElement(el: HTMLElement, offset = -96) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
}

// ---------- 進場延遲 ----------
// 頁面在轉場布幕或開場動畫還蓋著時就已經掛載，進場動畫要等布幕離開才開始
let enterAt = 0;
/** 設定「幾秒後畫面才會露出來」 */
export const setEnterDelay = (seconds: number) => {
  enterAt = performance.now() + seconds * 1000;
};
/** 取得距離畫面露出還剩幾秒（同一頁的多個元件都可以讀取） */
export const getEnterDelay = (): number => Math.max(0, (enterAt - performance.now()) / 1000);
