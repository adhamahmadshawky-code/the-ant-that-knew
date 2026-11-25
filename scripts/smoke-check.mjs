import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const DIST = new URL('../dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, p);
  if (!existsSync(file) || !statSync(file).isFile()) file = join(DIST, 'index.html');
  res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4174, r));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:4174/story/season-01/s01e01', { waitUntil: 'networkidle' });
const counts = await page.evaluate(() => ({
  scenes: document.querySelectorAll('section.scene').length,
  sceneImages: document.querySelectorAll('.scene-fig img').length,
  wordSpans: document.querySelectorAll('.w').length,
  chapterEnd: document.querySelectorAll('.r-chapter-end').length,
  placeholderBadge: document.querySelectorAll('.badge-placeholder').length
}));
console.log(JSON.stringify(counts));
if (counts.scenes !== 15) throw new Error(`expected 15 scenes, got ${counts.scenes}`);
if (counts.placeholderBadge !== 0) throw new Error('placeholder badge still rendered');
// sample episode route must no longer resolve to content
await page.goto('http://localhost:4174/story/season-01/s01e99', { waitUntil: 'networkidle' });
const leftover = await page.evaluate(() => document.querySelectorAll('section.scene').length);
console.log('s01e99 scenes after removal:', leftover);
if (leftover !== 0) throw new Error('s01e99 still renders scenes');
// mark completed fired when chapter-end visible
await page.goto('http://localhost:4174/story/season-01/s01e01', { waitUntil: 'networkidle' });
await page.locator('.r-chapter-end').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('atk.progress.v1')).episodes?.s01e01?.completed === true);
console.log('completed marked:', completed);
console.log('page errors:', errors.length ? errors : 'none');
await page.screenshot({ path: '/tmp/shot-smoke.png' });
await browser.close(); server.close();
