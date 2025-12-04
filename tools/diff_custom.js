const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const a = process.argv[2];
const b = process.argv[3];
const out = process.argv[4] || 'screenshots/diff.png';

if (!a || !b) {
  console.error('Usage: node tools/diff_custom.js <pathA> <pathB> [outPath]');
  process.exit(1);
}

if (!fs.existsSync(a)) {
  console.error(`File not found: ${a}`);
  process.exit(1);
}
if (!fs.existsSync(b)) {
  console.error(`File not found: ${b}`);
  process.exit(1);
}

const A = PNG.sync.read(fs.readFileSync(a));
const B = PNG.sync.read(fs.readFileSync(b));

const width = Math.min(A.width, B.width);
const height = Math.min(A.height, B.height);
const diff = new PNG({ width, height });

const mismatchedPixels = pixelmatch(
  A.data.slice(0, width * height * 4),
  B.data.slice(0, width * height * 4),
  diff.data,
  width,
  height,
  { threshold: 0.1 }
);

const total = width * height;
const percent = ((mismatchedPixels / total) * 100).toFixed(2);

console.log(`Compared:\n  ${a}\n  ${b}`);
console.log(`Size used for comparison: ${width}x${height}`);
console.log(`Mismatched pixels: ${mismatchedPixels} / ${total} (${percent}%)`);
fs.writeFileSync(out, PNG.sync.write(diff));
console.log(`Diff image written to ${out}`);
