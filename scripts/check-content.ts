/**
 * 內容規範檢查（CLAUDE.md §14）。執行：npm run check
 *
 * ✖ 錯誤：必須修正，會讓 npm run build 失敗
 * ⚠ 警告：需要逐一確認
 * ℹ 提示：列出 [待確認]／[待填寫] 位置，供交件回報
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { MetaSchema, SLUG_PATTERN } from '../src/lib/schema.ts';
import { parseSlides, type Slide } from '../src/lib/slides.ts';
import { parseBrief } from '../src/lib/brief.ts';
import {
  BRIEF_SECTIONS,
  MAINLAND_TERMS,
  MAX_BULLETS,
  MAX_BULLET_WIDTH,
  NOTES_OPTIONAL,
  SLIDE_COUNT_RANGE,
  SLIDE_TYPES,
  SOURCE_REQUIRED,
  TODO_MARKERS,
} from '../src/lib/rules.ts';

type Level = 'error' | 'warn' | 'info';
interface Issue {
  level: Level;
  where: string;
  message: string;
}

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');
const ICON: Record<Level, string> = { error: '✖', warn: '⚠', info: 'ℹ' };
const COLOR: Record<Level, string> = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m' };
const RESET = '\x1b[0m';

const rel = (p: string) => relative(ROOT, p).replace(/\\/g, '/');

/** 中文字算 1，英數字算 0.5 */
function visualWidth(text: string): number {
  const plain = text
    .replace(/\$[^$]*\$/g, 'xxxx')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '');
  let w = 0;
  for (const ch of plain) w += /[⺀-鿿豈-﫿＀-￯　-〿]/.test(ch) ? 1 : 0.5;
  return w;
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function scanTerms(file: string, text: string, issues: Issue[]) {
  for (const [pattern, fix] of MAINLAND_TERMS) {
    for (const m of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
      issues.push({ level: 'warn', where: `${rel(file)}:${lineOf(text, m.index ?? 0)}`, message: `大陸用語「${m[0]}」→ 建議改為「${fix}」` });
    }
  }
}

function scanMarkers(file: string, text: string, issues: Issue[]) {
  for (const marker of TODO_MARKERS) {
    let i = text.indexOf(marker);
    while (i !== -1) {
      issues.push({ level: 'info', where: `${rel(file)}:${lineOf(text, i)}`, message: `${marker}` });
      i = text.indexOf(marker, i + marker.length);
    }
  }
}

function checkImages(dir: string, file: string, slide: Slide, issues: Issue[]) {
  const refs = [...slide.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g), ...slide.body.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of refs) {
    if (/^(https?:|data:)/.test(src)) continue;
    if (!existsSync(join(dir, src))) {
      issues.push({ level: 'error', where: `${rel(file)}:${slide.line}`, message: `第 ${slide.index} 頁引用的圖片不存在：${src}` });
    }
  }
}

function checkSlides(dir: string, file: string, md: string, issues: Issue[], strictCount: boolean) {
  const slides = parseSlides(md);
  if (slides.length === 0) {
    issues.push({ level: 'error', where: rel(file), message: 'slides.md 沒有任何投影片' });
    return;
  }
  if (slides[0].type !== 'cover') issues.push({ level: 'error', where: `${rel(file)}:1`, message: '第一頁必須是 cover' });
  if (strictCount && (slides.length < SLIDE_COUNT_RANGE.min || slides.length > SLIDE_COUNT_RANGE.max)) {
    issues.push({ level: 'warn', where: rel(file), message: `總頁數 ${slides.length} 頁，不在 ${SLIDE_COUNT_RANGE.min}～${SLIDE_COUNT_RANGE.max} 頁之間` });
  }

  for (const s of slides) {
    const where = `${rel(file)}:${s.line}`;
    if (s.declaredType !== null && !(SLIDE_TYPES as readonly string[]).includes(s.declaredType)) {
      issues.push({ level: 'error', where, message: `第 ${s.index} 頁使用了不存在的頁面類型「${s.declaredType}」` });
    }
    if (SOURCE_REQUIRED.includes(s.type) && !/class="source"/.test(s.body)) {
      issues.push({ level: 'error', where, message: `第 ${s.index} 頁（${s.type}）缺少來源行 <p class="source">` });
    }
    if (!NOTES_OPTIONAL.includes(s.type) && !s.notes) {
      issues.push({ level: 'warn', where, message: `第 ${s.index} 頁（${s.type}）缺少講者備註 Note:` });
    }
    checkImages(dir, file, s, issues);

    if (['bullets', 'takeaway', 'compare', 'figure', 'equation'].includes(s.type)) {
      const lines = s.body.split('\n');
      const topLevel = lines.filter((l) => /^([-*]|\d+\.)\s+/.test(l));
      const perColumn = s.type === 'compare' ? MAX_BULLETS * 2 : MAX_BULLETS;
      if (topLevel.length > perColumn) {
        issues.push({ level: 'warn', where, message: `第 ${s.index} 頁有 ${topLevel.length} 個條列，超過 ${MAX_BULLETS} 點` });
      }
      for (const l of lines.filter((x) => /^\s*([-*]|\d+\.)\s+/.test(x))) {
        const text = l.replace(/^\s*([-*]|\d+\.)\s+/, '');
        const w = visualWidth(text);
        if (w > MAX_BULLET_WIDTH) {
          issues.push({ level: 'warn', where, message: `第 ${s.index} 頁條列過長（約 ${Math.ceil(w)} 字）：${text.slice(0, 20)}…` });
        }
      }
    }
  }
  return slides.length;
}

function checkPaper(slug: string): { issues: Issue[]; slideCount?: number } {
  const dir = join(CONTENT, slug);
  const issues: Issue[] = [];
  const metaPath = join(dir, 'meta.json');
  const briefPath = join(dir, 'brief.md');
  const slidesPath = join(dir, 'slides.md');

  if (!SLUG_PATTERN.test(slug)) issues.push({ level: 'error', where: rel(dir), message: '資料夾名稱不符合 YYYY-MM-DD-姓氏-關鍵字（全小寫）' });

  // meta.json
  if (!existsSync(metaPath)) {
    issues.push({ level: 'error', where: rel(dir), message: '缺少 meta.json' });
  } else {
    const raw = readFileSync(metaPath, 'utf8');
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      issues.push({ level: 'error', where: rel(metaPath), message: `JSON 格式錯誤：${(e as Error).message}` });
    }
    if (json !== undefined) {
      const parsed = MetaSchema.safeParse(json);
      if (!parsed.success) {
        for (const i of parsed.error.issues) issues.push({ level: 'error', where: rel(metaPath), message: `${i.path.join('.') || '(根)'}：${i.message}` });
      } else {
        const m = parsed.data;
        if (!slug.startsWith(m.report_date)) issues.push({ level: 'error', where: rel(metaPath), message: `report_date（${m.report_date}）與資料夾日期不一致` });
        if (!existsSync(join(dir, m.cover))) issues.push({ level: 'error', where: rel(metaPath), message: `cover 指定的圖片不存在：${m.cover}` });
      }
    }
    scanTerms(metaPath, raw, issues);
  }

  // brief.md
  if (!existsSync(briefPath)) {
    issues.push({ level: 'error', where: rel(dir), message: '缺少 brief.md' });
  } else {
    const md = readFileSync(briefPath, 'utf8');
    const titles = parseBrief(md).map((s) => s.title);
    const expected = [...BRIEF_SECTIONS];
    const missing = expected.filter((t) => !titles.includes(t));
    const extra = titles.filter((t) => !(expected as string[]).includes(t));
    if (missing.length) issues.push({ level: 'error', where: rel(briefPath), message: `缺少固定章節：${missing.join('、')}` });
    if (extra.length) issues.push({ level: 'error', where: rel(briefPath), message: `出現規範外的 ## 章節：${extra.join('、')}（細項請用 ###）` });
    if (!missing.length && !extra.length && titles.join('|') !== expected.join('|')) {
      issues.push({ level: 'error', where: rel(briefPath), message: `章節順序錯誤，應為：${expected.join(' → ')}` });
    }
    scanTerms(briefPath, md, issues);
    scanMarkers(briefPath, md, issues);
  }

  // slides.md
  let slideCount: number | undefined;
  if (!existsSync(slidesPath)) {
    issues.push({ level: 'error', where: rel(dir), message: '缺少 slides.md' });
  } else {
    const md = readFileSync(slidesPath, 'utf8');
    slideCount = checkSlides(dir, slidesPath, md, issues, true);
    scanTerms(slidesPath, md, issues);
    scanMarkers(slidesPath, md, issues);
  }

  return { issues, slideCount };
}

function print(title: string, issues: Issue[]) {
  console.log(`\n\x1b[1m${title}${RESET}`);
  if (issues.length === 0) {
    console.log('  \x1b[32m✔ 全部通過\x1b[0m');
    return;
  }
  const order: Level[] = ['error', 'warn', 'info'];
  for (const level of order) {
    for (const i of issues.filter((x) => x.level === level)) {
      console.log(`  ${COLOR[level]}${ICON[level]}${RESET} ${i.message}  \x1b[2m${i.where}${RESET}`);
    }
  }
}

// ---------- 主程式 ----------
let errors = 0;
let warns = 0;

const templateIssues: Issue[] = [];
const demoPath = join(ROOT, 'templates', 'slide-types.md');
if (existsSync(demoPath)) checkSlides(join(ROOT, 'templates'), demoPath, readFileSync(demoPath, 'utf8'), templateIssues, false);
const templateErrors = templateIssues.filter((i) => i.level === 'error');
if (templateErrors.length) print('templates/slide-types.md', templateErrors);
errors += templateErrors.length;

const slugs = existsSync(CONTENT) ? readdirSync(CONTENT).filter((n) => statSync(join(CONTENT, n)).isDirectory()) : [];
if (slugs.length === 0) console.log('\ncontent/ 底下還沒有任何論文。');

for (const slug of slugs) {
  const { issues, slideCount } = checkPaper(slug);
  print(`📄 ${slug}${slideCount !== undefined ? `（${slideCount} 頁）` : ''}`, issues);
  errors += issues.filter((i) => i.level === 'error').length;
  warns += issues.filter((i) => i.level === 'warn').length;
}

console.log(`\n共檢查 ${slugs.length} 篇論文：${errors} 個錯誤、${warns} 個警告。`);
if (errors > 0) {
  console.log('\x1b[31m請修正所有錯誤後再交件（npm run build 會因此失敗）。\x1b[0m');
  process.exit(1);
}
