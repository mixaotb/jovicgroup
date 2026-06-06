import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3001';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--ignore-gpu-blocklist'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));

  await page.evaluate(() => document.querySelector('#prednosti')?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: `_desktop-bento.png` });

  await page.evaluate(() => document.querySelector('#o-nama')?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `_desktop-onama.png` });

  console.log('saved');
} catch (e) {
  console.log('ERROR', String(e).slice(0, 300));
} finally {
  await browser.close();
}
