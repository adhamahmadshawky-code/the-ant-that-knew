import type { Block } from '../lib/types';
import { episodeLang, t } from '../lib/strings';

interface TocItem {
  anchor: string;
  label: string;
}

export function tocFromBlocks(blocks: Block[]): TocItem[] {
  const items: TocItem[] = [];
  let sceneN = 0;
  blocks.forEach((b, i) => {
    if (b.type === 'scene') {
      sceneN++;
      items.push({ anchor: b.id, label: b.title ?? `${sceneN}` });
    } else if (b.type === 'heading') {
      items.push({ anchor: `b-${i}`, label: b.text });
    }
  });
  return items;
}

export default function TableOfContents({
  items,
  lang,
  open,
  onClose
}: {
  items: TocItem[];
  lang: ReturnType<typeof episodeLang>;
  open: boolean;
  onClose(): void;
}) {
  if (!open) return null;
  return (
    <nav className="toc" aria-label={t(lang, 'tableOfContents')}>
      <div className="toc-head">
        <span>{t(lang, 'tableOfContents')}</span>
        <button type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <ol>
        {items.map((it) => (
          <li key={it.anchor}>
            <a
              href={`#${it.anchor}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                onClose();
              }}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
