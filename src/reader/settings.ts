export type ReaderTheme = 'dark' | 'light' | 'sepia';
export type ReaderWidth = 'narrow' | 'medium' | 'wide';

export interface ReaderSettings {
  fontScale: number; // 0.85 - 1.5
  lineHeight: number; // 1.5 - 2.3
  width: ReaderWidth;
  theme: ReaderTheme;
  cinematic: boolean;
}

const KEY = 'atk.reader.v1';

export const defaultReaderSettings: ReaderSettings = {
  fontScale: 1,
  lineHeight: 1.9,
  width: 'medium',
  theme: 'dark',
  cinematic: false
};

export function loadReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultReaderSettings, ...JSON.parse(raw) } : defaultReaderSettings;
  } catch {
    return defaultReaderSettings;
  }
}

export function saveReaderSettings(s: ReaderSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* non-fatal */
  }
}
