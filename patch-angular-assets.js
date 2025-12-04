const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'angular.json');
if (!fs.existsSync(file)) {
  console.error('angular.json not found in current directory');
  process.exit(1);
}
const json = JSON.parse(fs.readFileSync(file, 'utf8'));

const projectName = 'IPA-Ai-Agents_UI';
const project = (json.projects && json.projects[projectName]) || Object.values(json.projects || {})[0];
if (!project) {
  console.error('Could not locate project in angular.json');
  process.exit(1);
}

const build = project.architect && project.architect.build;
const opts = build && build.options;
if (!opts) {
  console.error('angular.json: build.options not found');
  process.exit(1);
}

opts.assets = opts.assets || [];
const assetPath = 'src/staticwebapp.config.json';
if (!opts.assets.includes(assetPath)) {
  opts.assets.push(assetPath);
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.log('Injected asset:', assetPath);
} else {
  console.log('Asset already present:', assetPath);
}
