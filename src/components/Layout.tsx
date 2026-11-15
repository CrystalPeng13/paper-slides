import type { ReactNode } from 'react';
import Header from './Header.tsx';
import { SITE } from '../config.ts';
import { getPapers } from '../lib/content.ts';
import { scrollToTop } from '../lib/motion.ts';
import { TLink } from './motion/Transition.tsx';
import Magnetic from './motion/Magnetic.tsx';

export default function Layout({ children }: { children: ReactNode }) {
  const papers = getPapers();
  return (
    <>
      <Header />
      <main className="page">{children}</main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <h4>關於本庫</h4>
            <p className="footer-lead">每一篇論文，都依照同一套規範，被讀成一場三十分鐘的報告。</p>
          </div>
          <div>
            <h4>索引</h4>
            <ul>
              <li>
                <TLink to="/" className="link-u" label="目錄">
                  論文目錄（{papers.length}）
                </TLink>
              </li>
              <li>
                <TLink to="/glossary" className="link-u" label="術語">
                  術語表
                </TLink>
              </li>
              <li>
                <TLink to="/about" className="link-u" label="關於">
                  關於這套規範
                </TLink>
              </li>
            </ul>
          </div>
          <div>
            <h4>規範</h4>
            <ul>
              <li>CLAUDE.md · 標準流程七步</li>
              <li>十二種頁面類型</li>
              <li>npm run check 自動檢查</li>
            </ul>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">
          論文報告<span className="accent">投影片</span>庫
        </div>
        <div className="footer-bottom">
          <span>© 2026 {SITE.name} · 論文圖表版權屬原作者所有</span>
          <Magnetic>
            <button className="back-top" onClick={() => scrollToTop(false)}>
              回到頂端 ↑
            </button>
          </Magnetic>
        </div>
      </footer>
    </>
  );
}
