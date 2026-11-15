/**
 * 換頁轉場（CLAUDE.md §13.5）：點擊站內連結時，五條墨色布幕由下往上蓋住畫面 → 切換頁面 → 布幕向上收起。
 * 站內連結一律使用 <TLink>，才會有轉場效果；外部連結用一般 <a>。
 */
import { createContext, useCallback, useContext, useRef, type MouseEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { gsap, prefersReducedMotion, scrollToTop, setEnterDelay } from '../../lib/motion.ts';

type Go = (to: string, label?: string) => void;
const TransitionContext = createContext<Go>(() => {});

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const curtain = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const go = useCallback<Go>(
    (to, label) => {
      const current = location.pathname + location.search;
      if (to === current || busy.current) return;
      if (prefersReducedMotion() || !curtain.current) {
        navigate(to);
        scrollToTop();
        return;
      }
      busy.current = true;
      const bars = curtain.current.children;
      if (labelRef.current) labelRef.current.textContent = label ?? '';
      const tl = gsap.timeline({
        onComplete: () => {
          busy.current = false;
        },
      });
      tl.set(bars, { transformOrigin: 'bottom' })
        .to(bars, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', stagger: 0.05 })
        .to(labelRef.current, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.35')
        .add(() => {
          setEnterDelay(0.55);
          navigate(to);
          scrollToTop();
        })
        .to(labelRef.current, { autoAlpha: 0, duration: 0.3 }, '+=0.15')
        .set(bars, { transformOrigin: 'top' })
        .to(bars, { scaleY: 0, duration: 0.8, ease: 'expo.inOut', stagger: 0.05 }, '<');
    },
    [location, navigate],
  );

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div className="curtain" ref={curtain} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="curtain-label" ref={labelRef} aria-hidden="true" />
    </TransitionContext.Provider>
  );
}

export const useGo = () => useContext(TransitionContext);

interface TLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  /** 轉場布幕上顯示的文字 */
  label?: string;
  'data-cursor'?: string;
  title?: string;
  'aria-label'?: string;
  onMouseEnter?: () => void;
}

/** 有轉場效果的站內連結。按住 Ctrl / ⌘ 點擊時仍可在新分頁開啟。 */
export function TLink({ to, children, label, ...rest }: TLinkProps) {
  const go = useGo();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to, label);
  };
  return (
    <a href={`#${to}`} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
