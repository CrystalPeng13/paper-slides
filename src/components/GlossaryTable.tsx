import type { GlossaryEntry } from '../lib/content.ts';
import type { GlossaryTerm } from '../lib/brief.ts';
import { TLink } from './motion/Transition.tsx';

interface Props {
  terms: Array<GlossaryTerm | GlossaryEntry>;
  /** 是否顯示「出處」欄（全站術語表才需要） */
  showSources?: boolean;
}

export default function GlossaryTable({ terms, showSources = false }: Props) {
  if (terms.length === 0) return <p className="muted">沒有符合的術語。</p>;
  return (
    <table className="terms">
      <thead>
        <tr>
          <th className="col-zh">中文</th>
          <th className="col-en">English</th>
          <th>說明</th>
          {showSources && <th className="col-src">出處</th>}
        </tr>
      </thead>
      <tbody>
        {terms.map((t) => (
          <tr key={`${t.en}-${t.zh}`}>
            <td className="zh">{t.zh}</td>
            <td className="en">{t.en}</td>
            <td className="desc">{t.description}</td>
            {showSources && 'papers' in t && (
              <td>
                <div className="src">
                  {t.papers.map((p) => (
                    <TLink key={p.slug} to={`/papers/${p.slug}`} className="chip chip-accent" label={p.name}>
                      {p.name}
                    </TLink>
                  ))}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
