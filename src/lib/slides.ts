/**
 * 將 slides.md 解析成一頁一頁的資料（CLAUDE.md §6）。
 * 網站與檢查腳本共用這份解析器，確保「網站怎麼顯示」與「檢查怎麼判斷」一致。
 */
import { SLIDE_TYPES, type SlideType } from './rules.ts';

export interface Slide {
  /** 第幾頁（從 1 開始） */
  index: number;
  /** 頁面類型；未指定時為 bullets */
  type: SlideType;
  /** slides.md 中寫的原始類型（用來檢查是否寫了不存在的類型） */
  declaredType: string | null;
  /** 投影片本體 Markdown（不含類型註解與講者備註） */
  body: string;
  /** 講者備註 Markdown；沒有則為空字串 */
  notes: string;
  /** 所屬章節標示，例如「03 研究方法」；尚未進入任何章節時為空字串 */
  sectionLabel: string;
  /** 在 slides.md 中的起始行號（從 1 開始），供錯誤訊息使用 */
  line: number;
}

const TYPE_COMMENT = /<!--\s*\.slide:\s*class="([^"]*)"\s*-->\s*\n?/;
const FENCE = /^\s*(```|~~~)/;

/** 依單獨一行的 `---` 切頁，忽略程式碼區塊中的 `---` */
function splitPages(md: string): Array<{ text: string; line: number }> {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const pages: Array<{ text: string; line: number }> = [];
  let buf: string[] = [];
  let start = 1;
  let inFence = false;
  lines.forEach((line, i) => {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && /^\s*---\s*$/.test(line)) {
      pages.push({ text: buf.join('\n'), line: start });
      buf = [];
      start = i + 2;
    } else {
      buf.push(line);
    }
  });
  pages.push({ text: buf.join('\n'), line: start });
  return pages.filter((p) => p.text.trim() !== '');
}

/** 從章節分隔頁取出「03 研究方法」這樣的標示 */
function sectionLabelOf(body: string): string {
  const no = body.match(/class="section-no"[^>]*>\s*([^<\s]+)\s*</)?.[1] ?? '';
  const title = body.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim() ?? '';
  return [no, title].filter(Boolean).join(' ');
}

export function parseSlides(md: string): Slide[] {
  let currentSection = '';
  return splitPages(md).map(({ text, line }, i) => {
    const typeMatch = text.match(TYPE_COMMENT);
    const declaredType = typeMatch ? typeMatch[1].trim() : null;
    const type: SlideType = (SLIDE_TYPES as readonly string[]).includes(declaredType ?? '')
      ? (declaredType as SlideType)
      : 'bullets';
    const withoutType = typeMatch ? text.replace(TYPE_COMMENT, '') : text;

    // 講者備註：單獨一行以 Note: 開頭，之後全部都是備註
    const noteMatch = withoutType.match(/^Note:[ \t]*(.*)$/m);
    let body = withoutType;
    let notes = '';
    if (noteMatch && noteMatch.index !== undefined) {
      body = withoutType.slice(0, noteMatch.index);
      notes = withoutType.slice(noteMatch.index).replace(/^Note:[ \t]*/, '');
    }

    if (type === 'section') currentSection = sectionLabelOf(body);
    if (type === 'qa' || type === 'refs') currentSection = '';

    return {
      index: i + 1,
      type,
      declaredType,
      body: body.trim(),
      notes: notes.trim(),
      sectionLabel: currentSection,
      line,
    };
  });
}
