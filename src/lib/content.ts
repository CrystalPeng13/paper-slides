/**
 * 內容載入的唯一入口（CLAUDE.md §12.2）。
 * 頁面元件只能透過這個檔案取得論文內容，不可自行 import content/ 底下的檔案。
 *
 * 新增論文時不需要修改這裡：Vite 會在建置時自動掃描 content/<slug>/。
 */
import { MetaSchema, SLUG_PATTERN, type PaperMeta } from './schema.ts';
import { parseBrief, parseGlossary, type BriefSectionData, type GlossaryTerm } from './brief.ts';

const metaFiles = import.meta.glob<unknown>('/content/*/meta.json', { eager: true, import: 'default' });
const briefFiles = import.meta.glob<string>('/content/*/brief.md', { eager: true, query: '?raw', import: 'default' });
const slideFiles = import.meta.glob<string>('/content/*/slides.md', { query: '?raw', import: 'default' });
const assetFiles = import.meta.glob<string>(['/content/*/fig/*', '/templates/fig/*'], {
  eager: true,
  query: '?url',
  import: 'default',
});

export interface Paper {
  slug: string;
  meta: PaperMeta;
  brief: BriefSectionData[];
  glossary: GlossaryTerm[];
  coverUrl: string | undefined;
  /** 本篇 fig/ 底下所有圖片 */
  figures: Array<{ file: string; url: string; label: string }>;
  /** 投影片延後載入，進入投影片頁時才讀取 */
  loadSlides: () => Promise<string>;
}

export interface ContentError {
  slug: string;
  message: string;
}

const slugOf = (path: string) => path.split('/')[2];

/** 把 Markdown 中的相對路徑（fig/xxx.png）轉成建置後的網址 */
export function makeAssetResolver(baseDir: string) {
  return (src: string | undefined): string | undefined => {
    if (!src || /^(https?:|data:|\/)/.test(src)) return src;
    const key = `${baseDir}/${src.replace(/^\.\//, '')}`;
    return assetFiles[key] ?? src;
  };
}

/** fig03b.png → Fig. 3b；tab02.png → Table 2；own-xxx.svg → 自繪圖 */
function figureLabel(file: string): string {
  const m = file.match(/^(fig|tab)(\d+)([a-z]?)\./i);
  if (m) return `${m[1].toLowerCase() === 'fig' ? 'Fig.' : 'Table'} ${Number(m[2])}${m[3]}`;
  if (file.startsWith('own-')) return '自繪圖';
  return file;
}

function load(): { papers: Paper[]; errors: ContentError[] } {
  const papers: Paper[] = [];
  const errors: ContentError[] = [];

  for (const [path, raw] of Object.entries(metaFiles)) {
    const slug = slugOf(path);
    if (!SLUG_PATTERN.test(slug)) {
      errors.push({ slug, message: '資料夾名稱不符合 YYYY-MM-DD-姓氏-關鍵字 格式' });
      continue;
    }
    const parsed = MetaSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ slug, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('；') });
      continue;
    }
    const base = `/content/${slug}`;
    const resolve = makeAssetResolver(base);
    const brief = parseBrief(briefFiles[`${base}/brief.md`] ?? '');
    const slideLoader = slideFiles[`${base}/slides.md`];
    const figures = Object.entries(assetFiles)
      .filter(([p]) => p.startsWith(`${base}/fig/`))
      .map(([p, url]) => {
        const file = p.slice(`${base}/fig/`.length);
        return { file, url, label: figureLabel(file) };
      })
      .sort((a, b) => a.file.localeCompare(b.file));

    papers.push({
      slug,
      meta: parsed.data,
      brief,
      glossary: parseGlossary(brief),
      coverUrl: resolve(parsed.data.cover),
      figures,
      loadSlides: slideLoader ? () => slideLoader() : () => Promise.resolve(''),
    });
  }

  papers.sort((a, b) => b.meta.report_date.localeCompare(a.meta.report_date));
  if (errors.length) console.error('[content] 內容格式錯誤，請執行 npm run check：', errors);
  return { papers, errors };
}

const { papers, errors } = load();

export const getPapers = (): Paper[] => papers;
export const getPaper = (slug: string): Paper | undefined => papers.find((p) => p.slug === slug);
export const getContentErrors = (): ContentError[] => errors;

export interface GlossaryEntry extends GlossaryTerm {
  papers: Array<{ slug: string; name: string }>;
}

/** 彙整全站術語：同一個英文術語合併成一筆，並記錄出處論文 */
export function getGlossary(): GlossaryEntry[] {
  const map = new Map<string, GlossaryEntry>();
  for (const p of papers) {
    const name = p.meta.short_name ?? p.meta.title;
    for (const t of p.glossary) {
      const key = (t.en || t.zh).toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!existing.papers.some((x) => x.slug === p.slug)) existing.papers.push({ slug: p.slug, name });
      } else {
        map.set(key, { ...t, papers: [{ slug: p.slug, name }] });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.en.localeCompare(b.en));
}

/** 關於頁使用的頁面類型示範（templates/slide-types.md） */
const demoFiles = import.meta.glob<string>('/templates/slide-types.md', { query: '?raw', import: 'default' });
export const loadSlideTypesDemo = (): Promise<string> => demoFiles['/templates/slide-types.md']?.() ?? Promise.resolve('');
export const resolveTemplateAsset = makeAssetResolver('/templates');

export function getAllTags(): string[] {
  return [...new Set(papers.flatMap((p) => p.meta.tags))].sort();
}
