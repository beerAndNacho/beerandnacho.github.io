import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};
const templateIds = [
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

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        let pathname = decodeURIComponent(url.pathname).replace(/^\/Launch100/, '') || '/';
        pathname = normalize(pathname).replace(/^([.][.][/\\])+/, '');
        let filePath = join(root, pathname);
        if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
        if (!existsSync(filePath)) {
          response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }
        response.writeHead(200, {
          'content-type': mime[extname(filePath)] || 'application/octet-stream',
          'cache-control': 'no-store'
        });
        response.end(readFileSync(filePath));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(String(error));
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolveServer({ server, origin: `http://127.0.0.1:${server.address().port}/Launch100` });
    });
  });
}

async function previewSnapshot(page, templateId) {
  await page.locator(`[data-select-template="${templateId}"]`).click();
  const frame = page.frameLocator('#preview-frame');
  await frame.locator(`body[data-design-id="${templateId}"]`).waitFor({ state: 'attached', timeout: 5000 });
  return frame.locator('body').evaluate((body) => {
    const main = body.querySelector('main');
    const sections = main ? [...main.querySelectorAll(':scope > section')] : [];
    const scrollWidth = Math.max(body.scrollWidth, document.documentElement.scrollWidth);
    return {
      designId: body.dataset.designId,
      family: body.dataset.designFamily,
      signature: body.dataset.layoutSignature,
      navStyle: body.dataset.navStyle,
      cardStyle: body.dataset.cardStyle,
      sectionCount: sections.length,
      sectionClasses: sections.map((section) => section.className).filter(Boolean),
      viewport: innerWidth,
      scrollWidth,
      overflow: scrollWidth - innerWidth,
      title: document.title
    };
  });
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = {
  version: '2.0.0',
  startedAt: new Date().toISOString(),
  desktop: [],
  mobile: [],
  signatures: [],
  families: [],
  errors: [],
  failures: []
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.errors.push(`page: ${error.message}`));
  const response = await page.goto(`${origin}/?audit=design-v2#builder`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
  await page.locator('.builder-template-v2').first().waitFor({ state: 'visible', timeout: 6000 });
  if (await page.locator('.template-card-v2').count() !== 10) report.failures.push('Gallery does not contain 10 v2 cards.');
  if (await page.locator('.builder-template-v2').count() !== 10) report.failures.push('Builder does not contain 10 v2 template controls.');

  for (const templateId of templateIds) {
    const snapshot = await previewSnapshot(page, templateId);
    report.desktop.push(snapshot);
    if (snapshot.designId !== templateId) report.failures.push(`${templateId}: wrong design id ${snapshot.designId}`);
    if (!snapshot.signature || !snapshot.family || !snapshot.navStyle || !snapshot.cardStyle) report.failures.push(`${templateId}: incomplete design metadata`);
    if (snapshot.sectionCount < 4) report.failures.push(`${templateId}: only ${snapshot.sectionCount} main sections`);
    if (snapshot.overflow > 3) report.failures.push(`${templateId}: desktop preview overflow ${snapshot.overflow}px`);
  }

  const signatures = new Set(report.desktop.map((item) => item.signature));
  const families = new Set(report.desktop.map((item) => item.family));
  report.signatures = [...signatures];
  report.families = [...families];
  if (signatures.size !== 10) report.failures.push(`Expected 10 unique layout signatures, got ${signatures.size}.`);
  if (families.size !== 10) report.failures.push(`Expected 10 unique design families, got ${families.size}.`);

  await page.locator('[data-device="mobile"]').click();
  const iframeWidth = await page.locator('#preview-frame').evaluate((element) => Math.round(element.getBoundingClientRect().width));
  if (iframeWidth > 392) report.failures.push(`Mobile preview iframe is ${iframeWidth}px wide.`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.builder-template-v2').first().waitFor({ state: 'visible', timeout: 6000 });
  const appWidth = await page.evaluate(() => ({ viewport: innerWidth, document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) }));
  if (appWidth.document > appWidth.viewport + 3) report.failures.push(`Mobile builder overflow ${appWidth.document - appWidth.viewport}px.`);

  for (const templateId of templateIds) {
    const snapshot = await previewSnapshot(page, templateId);
    report.mobile.push(snapshot);
    if (snapshot.overflow > 3) report.failures.push(`${templateId}: mobile preview overflow ${snapshot.overflow}px`);
  }

  await page.locator('[data-step-go="4"]').click();
  await page.locator('#create-order').click();
  if (await page.locator('#order-result').getAttribute('hidden') !== null) report.failures.push('Order draft did not open.');
  const orderSummary = await page.locator('#order-summary').textContent();
  if (!orderSummary?.includes('디자인 시스템:')) report.failures.push('Order draft is missing the design system name.');
  if (!orderSummary?.includes('레이아웃 지문:')) report.failures.push('Order draft is missing the layout signature.');

  await context.close();
} finally {
  report.finishedAt = new Date().toISOString();
  report.checks = report.desktop.length + report.mobile.length;
  writeFileSync(resolve(root, 'design-browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (report.errors.length || report.failures.length) {
  throw new Error(`Launch100 design browser audit failed.\n${[...report.errors, ...report.failures].slice(0, 40).join('\n')}`);
}

console.log(`Launch100 design audit passed: ${report.checks} responsive previews, 10 unique signatures and 10 unique families.`);
