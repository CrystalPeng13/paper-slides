"""
PDF 工具：讀全文、找圖說、輸出預覽頁、裁切圖表（CLAUDE.md §8.3）。

需求：pip install pymupdf

用法：
  python tools/pdf_figures.py text  papers/xxx.pdf [--out tmp/xxx.txt]
  python tools/pdf_figures.py find  papers/xxx.pdf
  python tools/pdf_figures.py page  papers/xxx.pdf 4 [--out tmp/p4.png]
  python tools/pdf_figures.py crop  papers/xxx.pdf 4 --box x0 y0 x1 y1 --out content/<slug>/fig/fig03.png

座標系統：一律使用 PDF 點座標（1 pt = 1/72 英吋，原點在頁面左上角）。
`page` 輸出的預覽圖上會畫出每 50 pt 一條的格線並標上座標，用來判斷 `crop` 的範圍；
`find` 也會列出每個圖說的座標，圖通常位於圖說的正上方（表格則常在表格標題的正下方）。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:  # 舊版 PyMuPDF
    try:
        import fitz as pymupdf  # type: ignore
    except ImportError:
        sys.exit("找不到 PyMuPDF，請先執行：pip install pymupdf")

# Windows 終端機預設 cp950，強制輸出 UTF-8 避免特殊符號造成錯誤
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 圖說：「Figure 3:」「Fig. 3.」「Table 2:」；IEEE 格式的表格標題為全大寫「TABLE II」（後面不一定有標點）
# 要求編號後緊接 : 或 .，避免把內文「Table 1 reports ...」誤判為圖說
CAPTION = re.compile(r"^\s*(?:(Figure|Fig\.|Table)\s*(\d+)\s*[.:]|(TABLE|FIGURE)\s+([0-9]+|[IVX]+)\b)", re.IGNORECASE)
GRID = 50  # 預覽格線間距（pt）


def open_pdf(path: str):
    p = Path(path)
    if not p.exists():
        sys.exit(f"找不到檔案：{path}")
    return pymupdf.open(p)


def get_page(doc, page_no: int):
    if not 1 <= page_no <= doc.page_count:
        sys.exit(f"頁碼超出範圍：1～{doc.page_count}")
    return doc[page_no - 1]


def cmd_text(args):
    doc = open_pdf(args.pdf)
    chunks = [f"==== p.{i + 1} ====\n{page.get_text()}" for i, page in enumerate(doc)]
    out = "\n".join(chunks)
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(out, encoding="utf-8")
        print(f"已輸出 {doc.page_count} 頁全文 → {args.out}")
    else:
        print(out)


def _match_caption(text: str):
    """回傳 (類型, 編號) 或 None。"""
    m = CAPTION.match(text)
    if not m or (m.group(3) and not m.group(3).isupper()):
        return None
    word, num = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
    return ("Table" if word.lower().startswith("tab") else "Fig."), num


def cmd_find(args):
    """逐「行」比對圖說。

    表格標題常和表格內容被 PDF 合併成同一個文字區塊（區塊開頭是表格內容），
    只看區塊開頭會漏掉，所以改成逐行檢查。
    """
    doc = open_pdf(args.pdf)
    seen: dict[tuple[str, str], int] = {}
    for i, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        for block in page.get_text("dict")["blocks"]:
            lines = block.get("lines", [])
            for li, line in enumerate(lines):
                text = " ".join("".join(s["text"] for s in line["spans"]).split())
                hit = _match_caption(text)
                if not hit or hit in seen:
                    continue
                seen[hit] = i + 1
                # 圖說可能跨好幾行：從這一行開始到區塊結尾的範圍
                x0 = min(l["bbox"][0] for l in lines[li:])
                y0 = line["bbox"][1]
                x1 = max(l["bbox"][2] for l in lines[li:])
                y1 = lines[-1]["bbox"][3]
                rest = " ".join(" ".join("".join(s["text"] for s in l["spans"]) for l in lines[li:]).split())
                kind, num = hit
                print(
                    f"p.{i + 1:<3} {kind:<5} {num:<4} 圖說位置 ({x0:.0f}, {y0:.0f}, {x1:.0f}, {y1:.0f})  "
                    f"頁面 {w:.0f}×{h:.0f}  | {rest[:70]}"
                )

    if not seen:
        print("找不到任何圖說（可能是掃描檔，或圖說格式特殊），請改用 text 搜尋「Figure／Table」再用 page 逐頁查看。")
        return

    # 編號不連續時提醒：可能有圖說沒抓到
    def as_int(n: str) -> int:
        roman = {"I": 1, "V": 5, "X": 10}
        if n.isdigit():
            return int(n)
        total = 0
        for a, b in zip(n, n[1:] + " "):
            v = roman.get(a, 0)
            total += -v if roman.get(b, 0) > v else v
        return total

    for kind in ("Fig.", "Table"):
        nums = sorted(as_int(n) for k, n in seen if k == kind)
        if nums:
            missing = [n for n in range(1, nums[-1] + 1) if n not in nums]
            if missing:
                print(f"⚠ {kind} 編號不連續，可能漏抓：{missing}。請用 text 指令搜尋後以 page 確認位置。")


def cmd_page(args):
    doc = open_pdf(args.pdf)
    page = get_page(doc, args.page)
    w, h = page.rect.width, page.rect.height
    # 在記憶體中畫格線（不會修改原始 PDF 檔）
    shape = page.new_shape()
    for x in range(0, int(w) + 1, GRID):
        shape.draw_line((x, 0), (x, h))
    for y in range(0, int(h) + 1, GRID):
        shape.draw_line((0, y), (w, y))
    shape.finish(color=(0.85, 0.2, 0.2), width=0.3, stroke_opacity=0.6)
    shape.commit()
    for x in range(0, int(w) + 1, GRID * 2):
        page.insert_text((x + 2, 9), str(x), fontsize=7, color=(0.85, 0.1, 0.1))
    for y in range(GRID * 2, int(h) + 1, GRID * 2):
        page.insert_text((2, y - 2), str(y), fontsize=7, color=(0.85, 0.1, 0.1))

    out = Path(args.out or f"tmp/{Path(args.pdf).stem}-p{args.page}.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    page.get_pixmap(dpi=args.dpi).save(out)
    print(f"p.{args.page}（{w:.0f}×{h:.0f} pt）預覽圖 → {out}")


def cmd_crop(args):
    doc = open_pdf(args.pdf)
    page = get_page(doc, args.page)
    x0, y0, x1, y1 = args.box
    rect = pymupdf.Rect(x0, y0, x1, y1) & page.rect
    if rect.is_empty or rect.width < 10 or rect.height < 10:
        sys.exit("裁切範圍無效，請確認座標（x0 y0 x1 y1，單位 pt）")
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    pix = page.get_pixmap(dpi=args.dpi, clip=rect)
    pix.save(out)
    print(f"已裁切 p.{args.page} ({x0:.0f}, {y0:.0f}, {x1:.0f}, {y1:.0f}) → {out}（{pix.width}×{pix.height} px）")


def main():
    parser = argparse.ArgumentParser(description="論文 PDF 工具：讀全文、找圖說、預覽、裁切")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("text", help="輸出全文，每頁前加上 ==== p.N ==== 標記")
    p.add_argument("pdf")
    p.add_argument("--out", help="輸出到檔案（建議放 tmp/）")
    p.set_defaults(func=cmd_text)

    p = sub.add_parser("find", help="列出所有圖說（Figure / Fig. / Table）的頁碼與座標")
    p.add_argument("pdf")
    p.set_defaults(func=cmd_find)

    p = sub.add_parser("page", help="輸出某頁的預覽圖（含座標格線）")
    p.add_argument("pdf")
    p.add_argument("page", type=int, help="頁碼（從 1 開始）")
    p.add_argument("--out", help="輸出路徑，預設 tmp/<檔名>-p<頁碼>.png")
    p.add_argument("--dpi", type=int, default=110)
    p.set_defaults(func=cmd_page)

    p = sub.add_parser("crop", help="依座標裁切並輸出高解析度 PNG")
    p.add_argument("pdf")
    p.add_argument("page", type=int, help="頁碼（從 1 開始）")
    p.add_argument("--box", type=float, nargs=4, required=True, metavar=("X0", "Y0", "X1", "Y1"), help="裁切範圍（pt）")
    p.add_argument("--out", required=True, help="輸出路徑，例如 content/<slug>/fig/fig03.png")
    p.add_argument("--dpi", type=int, default=200)
    p.set_defaults(func=cmd_crop)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
