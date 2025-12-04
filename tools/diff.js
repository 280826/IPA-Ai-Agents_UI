const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const xdPath = 'screenshots/xd-design.png';
const appPath = 'screenshots/app-screenshot.png';
const diffPath = 'screenshots/diff.png';

(async () => {
  console.log(`Comparing:\n  XD Design: ${xdPath}\n  App Screenshot: ${appPath}\n`);

  if (!fs.existsSync(xdPath)) {
    console.error(`XD design file not found: ${xdPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(appPath)) {
    console.error(`App screenshot file not found: ${appPath}`);
    process.exit(1);
  }

  const xd = PNG.sync.read(fs.readFileSync(xdPath));
  const app = PNG.sync.read(fs.readFileSync(appPath));

  if (xd.width !== app.width || xd.height !== app.height) {
    console.warn(
      `⚠️  Image dimensions differ:\n  XD: ${xd.width}×${xd.height}\n  App: ${app.width}×${app.height}\n`
    );
  }

  const width = Math.min(xd.width, app.width);
  const height = Math.min(xd.height, app.height);
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(
    xd.data.slice(0, width * height * 4),
    app.data.slice(0, width * height * 4),
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const percentageDiff = ((mismatchedPixels / totalPixels) * 100).toFixed(2);

  console.log(`📊 Pixel Diff Report:\n`);
  console.log(`  Mismatched Pixels: ${mismatchedPixels} / ${totalPixels}`);
  console.log(`  Percentage Different: ${percentageDiff}%\n`);

  if (mismatchedPixels === 0) {
    console.log('✅ PERFECT MATCH! No visual differences detected.\n');
  } else if (percentageDiff < 5) {
    console.log('✅ EXCELLENT! Diff is less than 5%.\n');
  } else if (percentageDiff < 10) {
    console.log('⚠️  GOOD! Diff is less than 10%, minor tweaks may help.\n');
  } else {
    console.log('🔴 Notable visual differences detected. Iteration needed.\n');
  }

  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  console.log(`✓ Diff image saved to: ${diffPath}`);
  console.log(`  (Red pixels show the differences between XD and current app)\n`);
})();
