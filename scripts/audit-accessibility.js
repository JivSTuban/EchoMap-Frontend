const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  const results = await new AxePuppeteer(page).analyze();

  console.log('Accessibility Audit Results:', results);

  await browser.close();
})();
