import type { PaperMeta } from '../lib/schema.ts';

const LABEL: Record<PaperMeta['status'], string> = {
  done: '可上台',
  draft: '製作中',
};

export default function StatusBadge({ status }: { status: PaperMeta['status'] }) {
  return <span className={`status status-${status}`}>{LABEL[status]}</span>;
}
