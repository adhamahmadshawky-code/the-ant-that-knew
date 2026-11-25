// Local smoke test: serves dist/ and exercises the main flows headlessly.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, p);
  if (!existsSync(file) || !statSync(file).isFile()) file = join(DIST, 'index.html'); // SPA fallback
  res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4173, r));

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
check('home renders hero', await page.locator('.hero-content .wordmark-title').isVisible());
check('home shows featured', await page.locator('.featured-title').first().isVisible());
check('home shows seasons', (await page.locator('.season-card').count()) >= 1);
check('home shows recently added', (await page.locator('.episode-card').count()) >= 2);
await page.screenshot({ path: '/tmp/shot-home.png', fullPage: false });

await page.goto('http://localhost:4173/story', { waitUntil: 'networkidle' });
check('story lists episodes', (await page.locator('.episode-card').count()) >= 3);
await page.screenshot({ path: '/tmp/shot-story.png' });

// Reader: episode 2
await page.goto('http://localhost:4173/story/season-01/s01e02', { waitUntil: 'networkidle' });
check('reader title', await page.locator('.reader-title').isVisible());
check('reader is RTL', (await page.locator('.reader').getAttribute('dir')) === 'rtl');
check('scenes render', (await page.locator('.scene').count()) === 28, `got ${await page.locator('.scene').count()}`);
check('scene images render', (await page.locator('.scene-fig img').count()) >= 28);
const dim = await page.locator('.scene-fig img').first().evaluate((img) => ({ w: img.naturalWidth, h: img.naturalHeight }));
check('scene image has pixels', dim.w > 100, JSON.stringify(dim));
check('TOC opens', await (async () => { await page.locator('.reader-actions button').first().click(); return page.locator('.toc').isVisible(); })());
check('TOC lists scenes', (await page.locator('.toc li').count()) === 28, `got ${await page.locator('.toc li').count()}`);
await page.keyboard.press('Escape');
await page.locator('.toc-head button').click().catch(() => {});
check('settings open', await (async () => { await page.locator('.reader-actions button').nth(1).click(); return page.locator('.reader-settings').isVisible(); })());
await page.screenshot({ path: '/tmp/shot-reader.png' });

// Narration play (headless chrome needs an autoplay waiver for audio)
await page.locator('.scene-actions .chip-btn').first().click();
await page.waitForTimeout(2000);
const chipText = await page.locator('.scene-actions .chip-btn').first().innerText();
check('narration started playing', chipText.includes('❚❚'), chipText.trim());
await page.waitForTimeout(3500);
const activeWords = await page.locator('.w-on').count();
check('word highlight active', activeWords >= 1, `${activeWords} highlighted`);
// word click seek: click a word deep into the scene
await page.locator('.scene').first().locator('.w-click').nth(40).click();
await page.waitForTimeout(800);
const chipStill = await page.locator('.scene-actions .chip-btn').first().innerText();
check('word click keeps playback', chipStill.includes('❚❚'), chipStill.trim());
await page.screenshot({ path: '/tmp/shot-reader-playing.png' });

// Mini player appears on a different page while narration is loaded.
// Navigate client-side (a full page.goto reload would reset in-memory audio).
await page.click('text=Timeline');
await page.waitForTimeout(600);
check('mini player visible off-reader', await page.locator('.mini-player').isVisible());
await page.goto('http://localhost:4173/story/season-01/s01e02', { waitUntil: 'networkidle' });

// Progress persistence
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
await page.waitForTimeout(2200);
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('atk.progress.v1') ?? '{}'));
check('progress persisted', saved?.episodes?.s01e02?.position > 0.3, JSON.stringify(saved?.episodes?.s01e02?.position));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const scrollAfter = await page.evaluate(() => window.scrollY / (document.documentElement.scrollHeight - innerHeight));
check('position restored after reload', scrollAfter > 0.25, scrollAfter.toFixed(2));

// Continue reading on home
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
check('continue reading appears', await page.locator('.continue-card').isVisible());

// Other pages
await page.goto('http://localhost:4173/timeline', { waitUntil: 'networkidle' });
check('timeline renders', (await page.locator('.timeline-item').count()) === 8);
await page.goto('http://localhost:4173/encyclopedia', { waitUntil: 'networkidle' });
check('encyclopedia renders', (await page.locator('.enc-card').count()) === 7);
await page.goto('http://localhost:4173/encyclopedia/the-queen', { waitUntil: 'networkidle' });
check('encyclopedia entry', await page.locator('.enc-entry h1').isVisible());
await page.screenshot({ path: '/tmp/shot-ency.png' });
await page.goto('http://localhost:4173/stats', { waitUntil: 'networkidle' });
check('stats renders', (await page.locator('.stat-card').count()) === 4);
check('stats shows progress rows', (await page.locator('.progress-list li').count()) >= 2);
await page.goto('http://localhost:4173/search', { waitUntil: 'networkidle' });
await page.fill('.search-input', 'الملكة');
await page.waitForTimeout(400);
check('search finds arabic', (await page.locator('.search-results li').count()) >= 1, `${await page.locator('.search-results li').count()} hits`);
await page.screenshot({ path: '/tmp/shot-search.png' });

// 404
await page.goto('http://localhost:4173/no/such/route', { waitUntil: 'networkidle' });
check('404 page', await page.locator('.notfound').isVisible());

// Mobile pass
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:4173/story/season-01/s01e01', { waitUntil: 'networkidle' });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow @390px', overflow <= 1, `overflow=${overflow}px`);
check('mobile scenes render', (await page.locator('.scene').count()) === 15);
await page.screenshot({ path: '/tmp/shot-mobile.png' });
await page.setViewportSize({ width: 320, height: 700 });
await page.waitForTimeout(300);
const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow @320px', overflow2 <= 1, `overflow=${overflow2}px`);

const realErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('fonts.g'));
check('no page errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
