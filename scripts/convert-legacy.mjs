// One-time converter: ports the two published episodes from the legacy
// illustrated-reader File into this repository's content architecture.
// Source: /downloads/episodes-site-src (checkout of file-01M881HDYTQBRMT9Y1BDVX9AJ7)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.env.LEGACY_SRC || '/downloads/episodes-site-src/src';
const OUT = new URL('../content/seasons/season-01/', import.meta.url).pathname;

const evalArray = (file, re) => {
  const text = readFileSync(join(SRC, file), 'utf8');
  const m = text.match(re);
  if (!m) throw new Error(`no match in ${file}`);
  return new Function(`return (${m[1]})`)();
};

const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ---- Episode 1 ----
const ep1Paras = JSON.parse(readFileSync(join(SRC, 'scenes.json'), 'utf8'));
const ep1Timings = evalArray('timings.ts', /=\s*(\[[\s\S]*?\]);?\s*export default/);
const ep1Alts = evalArray('ep1.ts', /const alts = (\[[\s\S]*?\]);/);

// ---- Episode 2 ----
const ep2Scenes = evalArray('scenes2.ts', /const scenes2[^=]*= (\[[\s\S]*?\]);\s*export default/);
const ep2Timings = evalArray('timings2.ts', /=\s*(\[[\s\S]*?\]);?\s*export default/);
const ep2Alts = evalArray('ep2.ts', /const alts = (\[[\s\S]*?\]);/);

function buildEpisode({ slug, num, title, subtitle, description, scenes, timings, alts, imgPrefix, audioPrefix, publishedAt, featured, ambient }) {
  const dir = join(OUT, 'episodes', slug);
  mkdirSync(join(dir, 'images'), { recursive: true });
  mkdirSync(join(dir, 'audio'), { recursive: true });

  const blocks = [];
  let problems = 0;
  scenes.forEach((scene, i) => {
    const n = String(i + 1).padStart(2, '0');
    const img = `images/${imgPrefix}${n}.jpg`;
    const aud = `audio/${audioPrefix}${n}.mp3`;
    copyFileSync(join(SRC, 'photos', `${imgPrefix}${n}.jpg`), join(dir, img));
    copyFileSync(join(SRC, 'audio', `${audioPrefix}${n}.mp3`), join(dir, aud));

    const paras = scene.paras ?? scene;
    const titleText = scene.headingWords ? scene.headingWords.join(' ') : undefined;
    const t = timings[i] ?? [];
    const words = (scene.headingWords?.length ?? 0) + paras.reduce((a, p) => a + wc(p), 0);
    if (words !== t.length) {
      problems++;
      console.warn(`  [timing mismatch] ${slug} scene ${n}: ${words} words vs ${t.length} timings`);
    }
    blocks.push({
      type: 'scene',
      id: `scene-${n}`,
      ...(titleText ? { title: titleText } : {}),
      paragraphs: paras,
      image: img,
      imageAlt: alts[i] ?? '',
      narration: { src: aud, wordTimings: t }
    });
  });

  writeFileSync(join(dir, 'content.json'), JSON.stringify({ blocks }, null, 2));
  writeFileSync(
    join(dir, 'episode.json'),
    JSON.stringify(
      {
        id: `s01e${String(num).padStart(2, '0')}`,
        seasonId: 'season-01',
        number: num,
        title,
        subtitle,
        description,
        language: 'ar',
        direction: 'rtl',
        coverImage: `images/${imgPrefix}01.jpg`,
        publishedAt,
        status: 'published',
        featured,
        placeholder: false,
        ambient
      },
      null,
      2
    )
  );
  console.log(`${slug}: ${scenes.length} scenes, ${problems} timing mismatches`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  join(OUT, 'season.json'),
  JSON.stringify(
    {
      id: 'season-01',
      number: 1,
      title: 'الموسم الأول',
      description: 'حكاية مستعمرة نمل في حديقة منزل: المستعمرة التي لا تنام، وما يتحرك تحت الأوراق.',
      coverImage: 'cover.jpg'
    },
    null,
    2
  )
);
copyFileSync(join(SRC, 'photos', 'comic_08.jpg'), join(OUT, 'cover.jpg'));

buildEpisode({
  slug: 'episode-01',
  num: 1,
  title: 'المدينة التي لا تنام',
  subtitle: 'الحلقة الأولى',
  description: 'أولى حلقات «أنا»: خمس عشرة لوحة مع النص الكامل وقراءة صوتية بالفصحى تتبع الكلمات.',
  scenes: ep1Paras.map((paras) => ({ paras })),
  timings: ep1Timings,
  alts: ep1Alts,
  imgPrefix: 'comic_',
  audioPrefix: 'narration_',
  publishedAt: '2026-11-24',
  featured: false,
  ambient: { profile: 'colony', label: 'أجواء المستعمرة' }
});

buildEpisode({
  slug: 'episode-02',
  num: 2,
  title: 'أشباح تحت الأوراق',
  subtitle: 'الحلقة الثانية',
  description: 'ثاني حلقات «أنا»: ثمانية وعشرون مشهدًا مع النص الكامل وقراءة صوتية بالفصحى تتبع الكلمات.',
  scenes: ep2Scenes,
  timings: ep2Timings,
  alts: ep2Alts,
  imgPrefix: 'comic2_',
  audioPrefix: 'narration2_',
  publishedAt: '2026-11-25',
  featured: true,
  ambient: { profile: 'dread', label: 'أجواء المستعمرة' }
});
