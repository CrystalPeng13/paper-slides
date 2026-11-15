/** 網站深淺色模式（CLAUDE.md §13.3）。投影片固定淺色，不受影響。 */
export type ThemeMode = 'light' | 'dark';

const KEY = 'paper-slides-theme';

export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function getEffectiveTheme(): ThemeMode {
  return getStoredTheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function applyTheme(mode: ThemeMode, persist: boolean) {
  document.documentElement.dataset.theme = mode;
  if (!persist) return;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* 無法儲存時忽略（例如無痕模式） */
  }
}
