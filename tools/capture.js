const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'screenshots';
  const out = `${outDir}/app-screenshot.png`;
  const url = process.argv[2] || 'http://localhost:4200/';

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const execPath = process.env.CHROME_PATH;
  if (!execPath) {
    console.error('CHROME_PATH environment variable not set. Please set it to your Chrome or Edge executable path.');
    console.error("Example (PowerShell): $env:CHROME_PATH='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; node tools/capture.js");
    process.exit(1);
  }

  console.log(`Using browser executable at ${execPath}`);

  const browser = await chromium.launch({ executablePath: execPath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'networkidle' });
  console.log('Taking screenshot...');
  await page.screenshot({ path: out, fullPage: false });
  console.log(`Saved screenshot to ${out}`);
  await browser.close();
})();
