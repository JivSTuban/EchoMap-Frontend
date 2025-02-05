import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  const results = await new AxePuppeteer(page).analyze();

  console.log('Accessibility Audit Results:', JSON.stringify(results, null, 2));

  await browser.close();
})();
