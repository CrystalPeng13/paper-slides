import Layout from '../components/Layout.tsx';
import Magnetic from '../components/motion/Magnetic.tsx';
import { TLink } from '../components/motion/Transition.tsx';

export default function NotFoundPage() {
  return (
    <Layout>
      <section className="nf wrap">
        <div>
          <div className="big" aria-hidden="true">
            404
          </div>
          <p>這一頁不在目錄裡。可能是網址打錯了，或這篇論文已經移除。</p>
          <Magnetic>
            <TLink to="/" className="btn" label="目錄">
              回到目錄 <span className="arrow">→</span>
            </TLink>
          </Magnetic>
        </div>
      </section>
    </Layout>
  );
}
