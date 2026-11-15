import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router';
import HomePage from './pages/HomePage.tsx';
import PaperPage from './pages/PaperPage.tsx';
import SlidesPage from './pages/SlidesPage.tsx';
import GlossaryPage from './pages/GlossaryPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import Cursor from './components/motion/Cursor.tsx';
import Loader from './components/motion/Loader.tsx';
import { TransitionProvider } from './components/motion/Transition.tsx';
import { ScrollTrigger, scrollToTop, setSmoothScroll } from './lib/motion.ts';

/** 路由表（CLAUDE.md §12.1）。新增頁面時要同步更新導覽列與 CLAUDE.md。 */
function Shell({ showLoader }: { showLoader: boolean }) {
  const { pathname } = useLocation();
  const isSlides = pathname.endsWith('/slides');
  const [loading, setLoading] = useState(showLoader && !isSlides);

  // 投影片頁暫停平滑捲動；換頁後重新計算所有捲動觸發點
  useEffect(() => {
    setSmoothScroll(!isSlides);
    scrollToTop(); // 瀏覽器上一頁／直接改網址時也回到頂端
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, isSlides]);

  return (
    <TransitionProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/papers/:slug" element={<PaperPage />} />
        <Route path="/papers/:slug/slides" element={<SlidesPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {!isSlides && <div className="grain" aria-hidden="true" />}
      <Cursor enabled={!isSlides} />
      {loading && <Loader onDone={() => setLoading(false)} />}
    </TransitionProvider>
  );
}

export default function App({ showLoader }: { showLoader: boolean }) {
  return (
    <HashRouter>
      <Shell showLoader={showLoader} />
    </HashRouter>
  );
}
