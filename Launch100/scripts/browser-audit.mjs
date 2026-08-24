import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';
import { TEMPLATES } from '../assets/templates.js';

const root = resolve(process.cwd());
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        const pathname = normalize(decodeURIComponent(url.pathname).replace(/^\/Launch100/, '') || '/').replace(/^([.][.][/\\])+/, '');
        let filePath = join(root, pathname);
        if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
        if (!existsSync(filePath)) {
          response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }
        response.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
        response.end(readFileSync(filePath));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(String(error));
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolveServer({ server, origin: `http://127.0.0.1:${server.address().port}/Launch100/` });
    });
  });
}

async function previewFrame(page) {
  const handle = await page.waitForSelector('#preview-frame', { state: 'attached' });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const frame = await handle.contentFrame();
    if (frame) {
      const marker = await frame.locator('[data-template]').count().catch(() => 0);
      if (marker) return frame;
    }
    await page.waitForTimeout(25);
  }
  throw new Error('Preview iframe did not render.');
}

function decodePreview(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = Buffer.from(base64 + '='.repeat((4 - base64.length % 4) % 4), 'base64');
  return JSON.parse(binary.toString('utf8'));
}

const profiles = [
  { name: 'desktop', width: 1440, height: 920, mobile: false, touch: false },
  { name: 'tablet', width: 768, height: 1024, mobile: false, touch: true },
  { name: 'mobile', width: 390, height: 844, mobile: true, touch: true }
];

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = {
  version: '2.0.0',
  startedAt: new Date().toISOString(),
  checks: 0,
  profiles: [],
  uniqueStructures: 0,
  functionalFlow: { editing: false, mobilePreview: false, sharingPrivacy: false, order: false, sharedPreview: false },
  failures: []
};
const structures = new Map();
let sharedUrl = '';

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.touch,
      deviceScaleFactor: profile.mobile ? 2 : 1
    });
    const page = await context.newPage();
    let errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const profileReport = { name: profile.name, viewport: profile.width, templates: 0, overflowFailures: 0, errors: 0 };

    for (const template of TEMPLATES) {
      errors = [];
      const url = `${origin}?template=${encodeURIComponent(template.id)}#builder`;
      let result;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
        await page.waitForSelector(`[data-select-template="${template.id}"][aria-pressed="true"]`, { timeout: 5000 });
        const frame = await previewFrame(page);
        await frame.waitForSelector(`[data-template="${template.id}"]`, { timeout: 5000 });
        result = await frame.evaluate(() => {
          const root = document.querySelector('[data-template]');
          return {
            template: root?.dataset.template || '',
            pack: document.body.dataset.pack || '',
            structure: root?.dataset.structure || '',
            viewport: innerWidth,
            documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            sections: document.querySelectorAll('main > section, main section').length,
            headings: document.querySelectorAll('h1,h2,h3').length,
            textLength: document.body.innerText.length
          };
        });
        if (result.template !== template.id || result.pack !== template.id) throw new Error(`Pack marker mismatch ${JSON.stringify(result)}`);
        if (!result.structure) throw new Error('Missing structure signature');
        if (result.documentWidth > result.viewport + 3) throw new Error(`Horizontal overflow ${result.documentWidth - result.viewport}px`);
        if (result.sections < 3 || result.headings < 5 || result.textLength < 350) throw new Error(`Shallow preview ${JSON.stringify(result)}`);
        if (structures.has(template.id) && structures.get(template.id) !== result.structure) throw new Error('Structure changed between viewports');
        structures.set(template.id, result.structure);
        if (errors.length) throw new Error(`Console errors: ${errors.join(' | ')}`);

        if (profile.name === 'desktop' && template.id === 'salt-bakery') {
          await page.locator('[data-step-go="1"]').click();
          await page.locator('[name="businessName"]').fill('검증용 브랜드');
          await page.waitForTimeout(120);
          const editedFrame = await previewFrame(page);
          await editedFrame.waitForFunction(() => document.body.innerText.includes('검증용 브랜드'));
          report.functionalFlow.editing = true;

          await page.locator('[data-device="mobile"]').click();
          const mobileWidth = await page.locator('#preview-frame').evaluate((element) => Math.round(element.getBoundingClientRect().width));
          if (mobileWidth > 392) throw new Error(`Mobile preview width ${mobileWidth}`);
          report.functionalFlow.mobilePreview = true;

          await page.locator('[data-step-go="4"]').click();
          await page.locator('[name="customerName"]').fill('PRIVATE PERSON');
          await page.locator('[name="customerEmail"]').fill('private@example.com');
          await page.locator('[name="gaId"]').fill('G-PRIVATE123');
          await page.locator('[name="clarityId"]').fill('PRIVATE-CLARITY');
          await page.locator('#share-preview').click();
          sharedUrl = await page.locator('#share-url').inputValue();
          const payload = decodePreview(new URL(sharedUrl).searchParams.get('preview'));
          for (const privateKey of ['customerName', 'customerEmail', 'gaId', 'clarityId', 'lastOrder']) {
            if (privateKey in payload) throw new Error(`Private field leaked: ${privateKey}`);
          }
          report.functionalFlow.sharingPrivacy = true;
          await page.locator('#share-dialog form button').click();

          await page.locator('#create-order').click();
          if (await page.locator('#order-result').getAttribute('hidden') !== null) throw new Error('Order result remained hidden');
          const orderText = await page.locator('#order-summary').textContent();
          if (!orderText.includes('에디토리얼 베이커리') || !orderText.includes('검증용 브랜드')) throw new Error('Order summary missing design pack or edited brand');
          report.functionalFlow.order = true;
        }
      } catch (error) {
        result = { error: error.message };
        report.failures.push({ profile: profile.name, template: template.id, error: error.message });
        if (/overflow/i.test(error.message)) profileReport.overflowFailures += 1;
        if (/console/i.test(error.message)) profileReport.errors += 1;
      }
      report.checks += 1;
      profileReport.templates += 1;
    }
    report.profiles.push(profileReport);
    await context.close();
  }

  if (new Set(structures.values()).size !== 10) {
    report.failures.push({ profile: 'all', template: 'all', error: `Expected 10 unique structures, got ${new Set(structures.values()).size}` });
  }
  report.uniqueStructures = new Set(structures.values()).size;

  if (sharedUrl) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 820 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const localSharedUrl = new URL(sharedUrl);
    const target = `${origin}?${localSharedUrl.searchParams.toString()}#builder`;
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('body.shared-mode');
      const frame = await previewFrame(page);
      const metrics = await frame.evaluate(() => ({
        pack: document.body.dataset.pack,
        width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        viewport: innerWidth
      }));
      if (metrics.pack !== 'salt-bakery' || metrics.width > metrics.viewport + 3 || errors.length) throw new Error(`Shared preview mismatch ${JSON.stringify(metrics)} ${errors.join('|')}`);
      report.functionalFlow.sharedPreview = true;
    } catch (error) {
      report.failures.push({ profile: 'shared', template: 'salt-bakery', error: error.message });
    }
    report.checks += 1;
    await context.close();
  }
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync('browser-report.json', `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (report.failures.length) {
  throw new Error(`Launch100 browser audit failed in ${report.failures.length}/${report.checks} checks:\n${report.failures.slice(0, 20).map((failure) => `${failure.profile}/${failure.template}: ${failure.error}`).join('\n')}`);
}
if (Object.values(report.functionalFlow).some((value) => !value)) throw new Error(`Functional flow incomplete: ${JSON.stringify(report.functionalFlow)}`);
console.log(`Launch100 browser audit passed: ${report.checks} checks, ${report.uniqueStructures} unique structures, desktop/tablet/mobile and shared flow.`);
