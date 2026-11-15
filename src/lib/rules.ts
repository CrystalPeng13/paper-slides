/**
 * 專案規範中「可以被程式檢查」的常數。
 * 對應 CLAUDE.md §5、§6、§7、§11.2、§14 —— 修改這裡時要同步更新 CLAUDE.md。
 * 這個檔案同時被網站（src/）與檢查腳本（scripts/check-content.ts）使用，不可依賴瀏覽器 API。
 */

/** §6 頁面類型 */
export const SLIDE_TYPES = [
  'cover',
  'info',
  'section',
  'bullets',
  'figure',
  'table',
  'equation',
  'compare',
  'takeaway',
  'todo',
  'qa',
  'refs',
] as const;
export type SlideType = (typeof SLIDE_TYPES)[number];

/** 不需要講者備註的頁面類型（§9） */
export const NOTES_OPTIONAL: readonly SlideType[] = ['cover', 'section', 'qa', 'refs'];

/** 不顯示左上角章節名稱的頁面類型（§13.4） */
export const NO_SECTION_LABEL: readonly SlideType[] = ['cover', 'section', 'qa'];

/** 必須有來源行的頁面類型（§8.1） */
export const SOURCE_REQUIRED: readonly SlideType[] = ['figure', 'table'];

/** §5 總頁數範圍 */
export const SLIDE_COUNT_RANGE = { min: 26, max: 32 } as const;

/** §7.2 版面密度 */
export const MAX_BULLETS = 5;
export const MAX_BULLET_WIDTH = 25; // 以中文字寬計算，英數字算半個字

/** §11.2 brief.md 固定章節（名稱與順序不可更改） */
export const BRIEF_SECTIONS = [
  '一句話摘要',
  '研究問題',
  '貢獻',
  '方法',
  '實驗設定',
  '主要結果',
  '限制',
  '圖表清單',
  '術語表',
  '投影片大綱',
] as const;
export type BriefSection = (typeof BRIEF_SECTIONS)[number];

/** 閱讀筆記頁不顯示的章節 */
export const BRIEF_HIDDEN: readonly BriefSection[] = ['投影片大綱'];

/** §7.3 中國大陸用語 → 台灣用語 */
export const MAINLAND_TERMS: ReadonlyArray<[RegExp, string]> = [
  [/數據(?!庫)/g, '資料'],
  [/數據庫/g, '資料庫'],
  [/網絡/g, '網路'],
  [/優化/g, '最佳化'],
  [/默認/g, '預設'],
  [/質量/g, '品質'],
  [/信號/g, '訊號'],
  [/視頻/g, '影片'],
  [/軟件/g, '軟體'],
  [/硬件/g, '硬體'],
  [/(?<!演)算法/g, '演算法'],
  [/屏幕/g, '螢幕'],
  [/文檔/g, '文件'],
  [/鏈接/g, '連結'],
  [/圖像/g, '影像'],
];

/** 待確認／待填寫標記 */
export const TODO_MARKERS = ['[待確認]', '[待填寫]'] as const;
