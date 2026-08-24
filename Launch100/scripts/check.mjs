import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const baseCss = readFileSync('assets/app.css', 'utf8');
const galleryCss = readFileSync('assets/template-gallery-v2.css', 'utf8');
const loader = readFileSync('assets/app.js', 'utf8');
const app = readFileSync('assets/app-v2.js', 'utf8');
const templates = readFileSync('assets/templates.js', 'utf8');
const renderers = readFileSync('assets/preview-renderers.js', 'utf8');

for (const token of ['id="builder"', 'id="template-gallery"', 'id="preview-frame"', 'id="create-order"', 'data-step="4"']) {
  if (!html.includes(token)) throw new Error(`Missing ${token}`);
}
for (const token of ['@media(max-width:620px)', 'preview-shell.mobile', 'builder-layout']) {
  if (!baseCss.includes(token)) throw new Error(`Missing base CSS ${token}`);
}
for (const token of ['template-card-v2', 'builder-template-v2', 'design-thumb--salt-bakery', 'design-thumb--desktop-cv']) {
  if (!galleryCss.includes(token)) throw new Error(`Missing v2 gallery CSS ${token}`);
}
for (const token of ["import('./app-v2.js')", 'template-gallery-v2.css']) {
  if (!loader.includes(token)) throw new Error(`Loader missing ${token}`);
}
for (const token of ['renderPreviewDocument', 'renderTemplateThumbnail', 'DESIGN_MANIFEST', '디자인 시스템:', '레이아웃 지문:']) {
  if (!app.includes(token)) throw new Error(`App v2 missing ${token}`);
}

const ids = [
  'salt-bakery',
  'noon-barber',
  'table7-restaurant',
  'dal-hanok-stay',
  'compile-bootcamp',
  'harbor-law',
  'void-architecture',
  'mint-clinic',
  'endpoint-api',
  'desktop-cv'
];
for (const id of ids) {
  if (!templates.includes(`id:'${id}'`)) throw new Error(`Missing template ${id}`);
  if (!renderers.includes(`'${id}':`)) throw new Error(`Missing manifest or renderer ${id}`);
  if (!galleryCss.includes(`design-thumb--${id}`)) throw new Error(`Missing thumbnail design ${id}`);
}

const rendererFunctions = [
  'renderBakery',
  'renderBarber',
  'renderDining',
  'renderHanok',
  'renderAcademy',
  'renderLaw',
  'renderArchitecture',
  'renderClinic',
  'renderTech',
  'renderPortfolio'
];
for (const name of rendererFunctions) {
  if (!renderers.includes(`function ${name}(`)) throw new Error(`Missing independent renderer ${name}`);
}

const signatures = [...renderers.matchAll(/signature: '([^']+)'/g)].map((match) => match[1]);
const families = [...renderers.matchAll(/family: '([^']+)'/g)].map((match) => match[1]);
if (signatures.length !== 10 || new Set(signatures).size !== 10) throw new Error(`Expected 10 unique signatures, got ${new Set(signatures).size}/${signatures.length}`);
if (families.length !== 10 || new Set(families).size !== 10) throw new Error(`Expected 10 unique families, got ${new Set(families).size}/${families.length}`);

for (const file of ['assets/templates.js', 'assets/app.js', 'assets/app-v2.js', 'assets/preview-renderers.js', 'scripts/design-browser-audit.mjs']) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log('Launch100 v2 static check passed: 10 independent renderers, 10 design families, 10 unique layout signatures and responsive gallery artwork.');
