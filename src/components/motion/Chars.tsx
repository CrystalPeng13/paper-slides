/**
 * 把文字拆成一個字一個 span，供 data-anim="chars" 逐字動畫使用。螢幕閱讀器讀取完整文字。
 * 預設自成一行（外層是遮罩）；inline 時不換行，可以在同一行中混用不同樣式。
 */
export default function Chars({ text, className, inline = false }: { text: string; className?: string; inline?: boolean }) {
  const chars = Array.from(text).map((ch, i) => (
    <span key={i} className="split-char" aria-hidden="true">
      {ch === ' ' ? ' ' : ch}
    </span>
  ));
  const cls = [inline ? '' : 'split-line', className].filter(Boolean).join(' ');
  return (
    <span className={cls || undefined} aria-label={text}>
      {chars}
    </span>
  );
}
