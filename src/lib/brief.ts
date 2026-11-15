/**
 * 解析 brief.md（CLAUDE.md §11.2）：依 `## ` 標題切成章節，並取出術語表。
 * 網站與檢查腳本共用。
 */

export interface BriefSectionData {
  title: string;
  body: string;
  /** 對應 HTML 錨點 id */
  id: string;
}

export interface GlossaryTerm {
  zh: string;
  en: string;
  description: string;
}

const FENCE = /^\s*(```|~~~)/;

export function parseBrief(md: string): BriefSectionData[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const sections: BriefSectionData[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;
  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading) {
      if (current) sections.push(finish(current, sections.length));
      current = { title: heading[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(finish(current, sections.length));
  return sections;
}

function finish(s: { title: string; lines: string[] }, i: number): BriefSectionData {
  return { title: s.title, body: s.lines.join('\n').trim(), id: `sec-${i + 1}` };
}

/** 解析 Markdown 表格（跳過表頭與分隔列） */
export function parseTable(md: string): string[][] {
  const rows = md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));
  return rows
    .slice(2)
    .map((r) =>
      r
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim()),
    );
}

export function parseGlossary(sections: BriefSectionData[]): GlossaryTerm[] {
  const sec = sections.find((s) => s.title === '術語表');
  if (!sec) return [];
  return parseTable(sec.body)
    .filter((cells) => cells.length >= 3 && (cells[0] || cells[1]))
    .map(([zh, en, description]) => ({ zh, en, description }));
}
