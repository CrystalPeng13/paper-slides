import { createRoot } from 'react-dom/client';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/500.css';
import '@fontsource/noto-serif-tc/700.css';
import '@fontsource/noto-serif-tc/900.css';
import '@fontsource/jetbrains-mono/400.css';
import 'katex/dist/katex.min.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/slides.css';
import App from './App.tsx';
import { applyTheme, getEffectiveTheme } from './lib/theme.ts';
import { prefersReducedMotion, setEnterDelay, startLenis } from './lib/motion.ts';
import { LOADER_DURATION } from './components/motion/Loader.tsx';

applyTheme(getEffectiveTheme(), false);

// 平滑捲動必須在任何元件掛載前啟動，刊頭等元件才能訂閱捲動事件
startLenis();

// 開場動畫：同一個分頁只播放一次；直接開啟投影片頁時不播放
function shouldShowLoader(): boolean {
  if (prefersReducedMotion() || location.hash.includes('/slides')) return false;
  try {
    if (sessionStorage.getItem('paper-slides-intro')) return false;
    sessionStorage.setItem('paper-slides-intro', '1');
  } catch {
    /* 無法使用 sessionStorage 時照常播放 */
  }
  return true;
}
const showLoader = shouldShowLoader();
if (showLoader) setEnterDelay(LOADER_DURATION);

// 不使用 StrictMode：reveal.js 與 GSAP 會直接操作 DOM，開發模式下重複掛載會造成異常
createRoot(document.getElementById('root')!).render(<App showLoader={showLoader} />);
