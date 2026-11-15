/**
 * meta.json 的資料格式（CLAUDE.md §11.1）。
 * 修改欄位時，要同步更新 CLAUDE.md §11.1 與 templates/paper/meta.json。
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須是 YYYY-MM-DD');

export const MetaSchema = z.object({
  title: z.string().min(1, 'title 不可為空'),
  title_zh: z.string().min(1, 'title_zh 不可為空'),
  short_name: z.string().optional(),
  authors: z.array(z.string().min(1)).min(1, 'authors 至少要有一位作者'),
  venue: z.string().min(1, 'venue 不可為空'),
  year: z.number().int().min(1900).max(2100),
  report_date: isoDate,
  presenter: z.string().min(1, 'presenter 不可為空'),
  tags: z.array(z.string().min(1)).min(1, 'tags 至少 1 個').max(3, 'tags 最多 3 個'),
  paper_url: z.url('paper_url 必須是網址').optional(),
  cover: z.string().regex(/^fig\/[\w.-]+\.(png|jpe?g|svg|webp)$/, 'cover 必須是 fig/ 底下的圖片'),
  status: z.enum(['draft', 'done']),
});

export type PaperMeta = z.infer<typeof MetaSchema>;

/** slug 格式：YYYY-MM-DD-姓氏-關鍵字（§3） */
export const SLUG_PATTERN = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(-[a-z0-9]+)*$/;
