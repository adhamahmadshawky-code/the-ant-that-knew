import { episodeLang, t, type UiLang } from '../lib/strings';
import type { ReaderSettings as Settings, ReaderTheme, ReaderWidth } from './settings';

interface Props {
  lang: UiLang;
  settings: Settings;
  onChange(patch: Partial<Settings>): void;
}

export default function ReaderSettingsPanel({ lang, settings, onChange }: Props) {
  return (
    <div className="reader-settings" role="group" aria-label={t(lang, 'readingSettings')}>
      <div className="rs-row">
        <span className="rs-label">{t(lang, 'fontSize')}</span>
        <div className="rs-controls">
          <button
            type="button"
            onClick={() => onChange({ fontScale: Math.max(0.85, +(settings.fontScale - 0.05).toFixed(2)) })}
            aria-label="Decrease font size"
          >
            A−
          </button>
          <span className="rs-value">{Math.round(settings.fontScale * 100)}%</span>
          <button
            type="button"
            onClick={() => onChange({ fontScale: Math.min(1.5, +(settings.fontScale + 0.05).toFixed(2)) })}
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
      </div>
      <div className="rs-row">
        <span className="rs-label">{t(lang, 'lineSpacing')}</span>
        <input
          type="range"
          min={1.5}
          max={2.3}
          step={0.05}
          value={settings.lineHeight}
          onChange={(e) => onChange({ lineHeight: +e.target.value })}
          aria-label={t(lang, 'lineSpacing')}
        />
      </div>
      <div className="rs-row">
        <span className="rs-label">{t(lang, 'readingWidth')}</span>
        <div className="rs-controls">
          {(['narrow', 'medium', 'wide'] as ReaderWidth[]).map((w) => (
            <button
              key={w}
              type="button"
              className={settings.width === w ? 'is-on' : ''}
              onClick={() => onChange({ width: w })}
              aria-pressed={settings.width === w}
            >
              {w === 'narrow' ? '▪' : w === 'medium' ? '▪▪' : '▪▪▪'}
            </button>
          ))}
        </div>
      </div>
      <div className="rs-row">
        <span className="rs-label">{t(lang, 'theme')}</span>
        <div className="rs-controls">
          {(['dark', 'light', 'sepia'] as ReaderTheme[]).map((th) => (
            <button
              key={th}
              type="button"
              className={settings.theme === th ? 'is-on' : ''}
              onClick={() => onChange({ theme: th })}
              aria-pressed={settings.theme === th}
            >
              {t(lang, th === 'dark' ? 'themeDark' : th === 'light' ? 'themeLight' : 'themeSepia')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
