# src/CLAUDE.md — 網站開發規則與視覺風格

> 從根目錄 [`CLAUDE.md`](../CLAUDE.md) 拆出的 §12、§13，修改 `src/` 時適用。其餘規範（§0 快速指引、§14 自動檢查、§15.2 網站檢查清單、§16 修改權限與變更紀錄）仍以根目錄 `CLAUDE.md` 為準。

---

## 12. 網站開發規則（修改 `src/` 時適用）

### 12.1 頁面與路由

| 路由 | 頁面元件 | 內容 | 資料來源 |
|---|---|---|---|
| `/` | `HomePage` | 主視覺、跑馬燈、論文目錄（搜尋、主題篩選、排序）、運作方式 | 所有 `meta.json` |
| `/papers/:slug` | `PaperPage` | 標題與書目資訊、代表圖、一句話摘要、側邊目錄、各章節、圖表一覽、術語表、下一篇 | `meta.json` + `brief.md` |
| `/papers/:slug/slides` | `SlidesPage` | 全螢幕投影片；加上 `?print` 為匯出 PDF 模式 | `meta.json` + `slides.md` |
| `/glossary` | `GlossaryPage` | 全站術語表，A–Z 索引與搜尋，標示出處論文 | 所有 `brief.md` 的術語表 |
| `/about` | `AboutPage` | 專案說明、七個步驟、規範四面向、12 種頁面示範、技術架構 | 固定內容＋`templates/slide-types.md` |
| `*` | `NotFoundPage` | 找不到頁面 | |

### 12.2 資料流
```
content/*/meta.json ─┐
content/*/brief.md  ─┼─ src/lib/content.ts（import.meta.glob 載入 + zod 驗證）─→ 各頁面元件
content/*/slides.md ─┤
content/*/fig/*     ─┘   （圖片路徑 fig/xxx.png 在此轉換成建置後的網址）
```
- 頁面元件**只能**透過 `src/lib/content.ts` 取得內容（`getPapers`、`getPaper`、`getGlossary`、`getAllTags`…），不可自行 import `content/` 底下的檔案。
- 所有型別定義在 `src/lib/schema.ts`，修改 `meta.json` 欄位時要同步更新 schema、`templates/paper/meta.json` 與本文件 §11.1。

### 12.3 元件與樣式規則
- 頁面放 `src/pages/`，共用元件放 `src/components/`，動態元件放 `src/components/motion/`。
- 只用函式元件與 Hooks，不使用 class component。
- 每個頁面都要包在 `<Layout>` 裡（投影片播放頁例外）。
- **站內連結一律使用 `<TLink>`**（才有換頁布幕），外部連結用一般 `<a target="_blank" rel="noreferrer">`。
- 樣式寫在 CSS：共用樣式在 `global.css`，投影片在 `slides.css`；新頁面的專屬樣式加在 `global.css` 末尾，並以註解 `/* ---------- XXX 頁 ---------- */` 分段。
- 顏色、字型、字級、曲線一律用 `tokens.css` 的變數，**不可寫死**。行內 `style` 只用於會變動的數值（例如進度條的 `scaleX`）。
- 能從規範取得的數字不要寫死（例如頁面類型數量用 `SLIDE_TYPES.length`）。

### 12.4 共用元件清單
直接看 `src/components/`（動態元件在 `src/components/motion/`）；新增元件前先確認沒有可沿用的。

### 12.5 新增頁面的步驟
1. 在 `src/pages/` 新增 `XxxPage.tsx`，以下方範本為起點（骨架與 `GlossaryPage.tsx` 相同）。
2. 在 `src/App.tsx` 的 `<Routes>` 加入路由。
3. 在 `src/components/Header.tsx` 的 `NAV` 陣列加入一筆：`{ to, label, no, match }`。
   - `label`：兩個字的中文（目錄、術語、關於…）；`no`：依陣列順序重新編號 `01`、`02`…；`match`：判斷目前網址是否屬於這個分頁。
4. 在 `src/components/Layout.tsx` 頁尾的「索引」清單加入連結。
5. 若頁面需要新的資料取用方式，在 `src/lib/content.ts` 新增函式，不要在頁面裡直接處理原始檔案。
6. 更新本文件：§12.1 路由表、§1 成品清單；若關於頁的描述受影響也一併更新。
7. 完成 §15.2 網站修改檢查清單。

```tsx
import { useRef } from 'react';
import Layout from '../components/Layout.tsx';
import Chars from '../components/motion/Chars.tsx';
import { usePageAnimations } from '../lib/usePageAnimations.ts';

export default function XxxPage() {
  const root = useRef<HTMLDivElement>(null);
  usePageAnimations(root, []); // 套用 data-anim 進場動畫

  return (
    <Layout>
      <div ref={root}>
        <section className="page-hero wrap">
          <span className="eyebrow" data-anim="up">English Label · 中文副標</span>
          <div className="page-hero-grid">
            <h1 className="page-title" data-anim="chars"><Chars text="頁面標題" /></h1>
            <p className="lead" data-anim="up" data-delay="0.3">一段說明文字。</p>
          </div>
        </section>
        <section className="section wrap">
          <div className="section-head">
            <h2 className="section-title" data-anim="chars"><Chars text="區塊標題" /></h2>
            <span className="meta">補充資訊</span>
          </div>
          <div data-anim="stagger">{/* 內容 */}</div>
        </section>
      </div>
    </Layout>
  );
}
```

### 12.6 常用版面 class（`global.css`）
直接看 `src/styles/global.css`（以 `/* ---------- XXX ---------- */` 註解分段）；新頁面優先沿用既有 class（`wrap`、`page-hero`、`section-head`…），不要另寫一套。

### 12.7 常見陷阱
- **頁內跳轉不可用 `href="#xxx"`**：HashRouter 會把它當成路由，跳到 404。請用 `src/lib/motion.ts` 的 `scrollToElement(el)`（參考 `Toc.tsx`、`GlossaryPage.tsx`）。
- **捲動一律透過 Lenis**：要捲到頂端用 `scrollToTop()`；需要暫停捲動（例如彈出視窗）用 `setSmoothScroll(false)`，結束後恢復。
- **版面高度改變後**（例如非同步載入內容），呼叫 `ScrollTrigger.refresh()`，否則捲動動畫的觸發點會錯位。
- **不使用 React StrictMode**：reveal.js 與 GSAP 直接操作 DOM，重複掛載會壞掉。
- **投影片的列印模式**（`?print`）會改寫 DOM，只在新分頁開啟。
- 新增的動畫一律走 `data-anim`（§13.5），不要在頁面中各自寫進場動畫。
- **`katex` 的版本必須與 `rehype-katex` 內建的 KaTeX 相同**（目前 0.16.x）：`package.json` 的 `katex` 只用來載入 CSS（`src/main.tsx`），HTML 則由 `rehype-katex` 產生。兩者主版本不同時 class 名稱會對不上（例如 0.19 把 `.sizing` 改名為 `.katex-sizing`），上下標會變成原尺寸、與 min/max 疊字。升級時兩個一起升，並確認 `node_modules` 裡只有一份 `katex`。改完依賴後要**重啟** `npm run dev`（Vite 不監看 `node_modules`）。

### 12.8 測試用內容
- 修改網站時，若 `content/` 沒有足夠的論文可以測試：可以把 `templates/paper/` 複製成 `content/2026-01-01-test-xxx/`（日期與 slug 開頭一致）當暫時測試內容，並用 `pdf_figures.py crop` 截一張圖當 `fig/fig01.png`。
- 測試內容**必須在交件前刪除**，並確認 `npm run check` 中不再出現。
- 不可修改使用者既有論文的內容來做測試。

---

## 13. 視覺風格：溫潤紙本 × 編輯期刊

> 定位：一本關於論文的期刊——米白紙張、墨色文字、赤陶色點綴、超大襯線標題、細線網格、卷期編號。
> 所有顏色、字型、字級、動態曲線都定義在 `src/styles/tokens.css`，**元件與其他 CSS 中不可寫死色碼**。調整風格時只改 `tokens.css` 與本節。

### 13.1 配色

色碼與變數名稱一律看 `src/styles/tokens.css`（淺色、深色兩組；`--s-*` 是投影片專用的固定淺色）。

- 強調色只有赤陶色一種；狀態色：可上台綠（`--ok`）、製作中琥珀（`--warn`，圓點會閃爍）。
- 版面以細線（`--line`）與粗線（`--line-strong`）分隔，不使用卡片陰影；全站覆蓋一層極淡的紙張顆粒。

### 13.2 字型（全中文介面）
| 用途 | 字型 | 字重 |
|---|---|---|
| 大標題、編號 | 思源宋體 Noto Serif TC | 900（主標）／700 |
| 內文、介面 | 思源黑體 Noto Sans TC | 400／500 |
| 後設資料、日期、編號標籤 | JetBrains Mono（中文自動退回黑體） | 400 |

- 介面文字一律中文；英文只出現在論文原文標題、術語與等寬的後設資料標籤。
- 字型以 `@fontsource` 打包進網站，**離線也能正常顯示**。字級使用流體變數（`--fs-hero`、`--fs-display`…）。

### 13.3 深淺色模式
- **網站**：預設跟隨系統設定，刊頭可手動切換（記錄在瀏覽器）。
- **投影片**：固定淺色紙本風（投影機上較清楚），不受深色模式影響。

### 13.4 投影片版面
- 比例 16:9，設計尺寸 1280 × 720。
- 封面：期刊刊頭式（頂端粗線＋「碩班論文報告 · PAPER READING」、右上赤陶色圓圈、標題置於下方）。
- 章節分隔頁：220px 鏤空赤陶數字＋粗線＋72px 標題。
- 內容頁標題：思源宋體約 40px，左對齊；內文約 26px。
- 固定元素：**左上角章節名稱**（自動帶入，`cover`／`section`／`qa` 頁不顯示）、**右下角頁碼**、**底部赤陶色進度條**。
- 播放頁工具列平常隱形，滑鼠移到頂端才浮現（返回、快捷鍵、全螢幕）。

### 13.5 動態系統
| 效果 | 實作 | 用在哪裡 |
|---|---|---|
| 平滑捲動 | Lenis（`src/lib/motion.ts` 單例） | 全站；投影片頁與放大檢視時暫停 |
| 開場動畫 | `motion/Loader`，計數到 100 後墨幕收起 | 每個分頁第一次開啟網站時 |
| 換頁布幕 | `motion/Transition`，五條墨色布幕 | 所有 `<TLink>` 站內連結 |
| 逐字浮現 | `<Chars>` ＋ `data-anim="chars"` | 所有大標題 |
| 捲動進場 | `data-anim="up"`／`"stagger"`／`"rule"`／`"clip"` | 區塊、列表、分隔線、代表圖 |
| 視差 | `data-parallax="0.2"` | 選用 |
| 自訂游標 | `motion/Cursor`；`data-cursor="閱讀"` 顯示標籤 | 桌機（觸控裝置自動停用） |
| 游標跟隨圖 | `IndexList` | 首頁目錄 |
| 釘選橫移 | GSAP ScrollTrigger pin | 關於頁「七個步驟」 |
| 跑馬燈 | `motion/Marquee` | 首頁 |
| 磁吸按鈕 | `motion/Magnetic` | 主要按鈕 |

規則：
- 頁面動畫一律透過 `usePageAnimations(ref)` 與 `data-anim` 屬性套用，**不要在頁面裡各自寫 GSAP 進場動畫**。
- 系統設定為「減少動態」時，開場動畫、平滑捲動、游標、布幕與進場動畫全部停用，內容直接顯示。
- 動畫只用 `transform` 與 `opacity`（必要時 `clip-path`），避免觸發版面重排。
