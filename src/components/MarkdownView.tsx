import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';

interface Props {
  markdown: string;
  /** 把 fig/xxx.png 轉成實際網址 */
  resolveAsset?: (src: string | undefined) => string | undefined;
  className?: string;
}

/** 全站統一的 Markdown 渲染：投影片與閱讀筆記共用（CLAUDE.md §2） */
export default function MarkdownView({ markdown, resolveAsset, className }: Props) {
  const components: Components = {
    img: ({ src, alt, ...rest }) => (
      <img src={resolveAsset ? resolveAsset(typeof src === 'string' ? src : undefined) : (src as string)} alt={alt ?? ''} loading="lazy" {...rest} />
    ),
    a: ({ href, children, ...rest }) => {
      const external = href?.startsWith('http');
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
          {children}
        </a>
      );
    },
  };

  const content = (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
  return className ? <div className={className}>{content}</div> : content;
}
