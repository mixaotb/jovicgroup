import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3001';
const tag = process.argv[3] || 'shot';
const wait = Number(process.argv[4] || 7000);

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.25 });
  page.on('console', (m) => console.log('  [page]', m.type(), m.text().slice(0, 160)));
  page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));

  console.log('goto', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => console.log('  no canvas yet'));
  await new Promise((r) => setTimeout(r, wait));

  // Full hero viewport
  await page.screenshot({ path: `_${tag}-hero.png` });

  // Just the 3D showcase element
  const el = await page.$('[aria-label^="3D prikaz"]');
  if (el) {
    await el.screenshot({ path: `_${tag}-showcase.png` });
    console.log('saved showcase');
  } else {
    console.log('showcase element not found');
  }
  console.log('saved hero');
} catch (e) {
  console.log('ERROR', String(e).slice(0, 300));
} finally {
  await browser.close();
}
