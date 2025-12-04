const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'screenshots';
  const out = `${outDir}/app-screenshot.png`;
  const url = process.argv[2] || 'http://localhost:4200/agents';

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  try {
    console.log('Launching Playwright chromium (default) ...');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    console.log(`Navigating to ${url} ...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Taking screenshot...');
    await page.screenshot({ path: out, fullPage: false });
    console.log(`Saved screenshot to ${out}`);
    await browser.close();
  } catch (err) {
    console.error('Playwright capture failed:', err.message);
    process.exit(1);
  }
})();