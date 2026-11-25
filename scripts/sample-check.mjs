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
await page.goto('http://localhost:4174/story/season-01/s01e99', { waitUntil: 'networkidle' });
const counts = await page.evaluate(() => ({
  dialogue: document.querySelectorAll('.r-dialogue').length,
  pull: document.querySelectorAll('.r-pull').length,
  quote: document.querySelectorAll('.r-quote').length,
  fullimg: document.querySelectorAll('.r-fig-full').length,
  gallery: document.querySelectorAll('.gallery').length,
  spoiler: document.querySelectorAll('.spoiler-box').length,
  note: document.querySelectorAll('.r-note').length,
  chapterEnd: document.querySelectorAll('.r-chapter-end').length,
  placeholderBadge: document.querySelectorAll('.badge-placeholder').length
}));
console.log(JSON.stringify(counts));
// spoiler reveal
await page.click('.spoiler-box .chip-btn');
await page.waitForTimeout(300);
console.log('spoiler revealed:', await page.locator('.spoiler-box.is-open').count());
// konami easter egg
for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight']) await page.keyboard.press(k);
await page.waitForTimeout(300);
console.log('easter egg shown:', await page.locator('.egg-overlay').count());
// mark completed fired when chapter-end visible
await page.locator('.r-chapter-end').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('atk.progress.v1')).episodes?.s01e99?.completed === true);
console.log('completed marked:', completed);
console.log('page errors:', errors.length ? errors : 'none');
await page.screenshot({ path: '/tmp/shot-sample.png' });
await browser.close(); server.close();
