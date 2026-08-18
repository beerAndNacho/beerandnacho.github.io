import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';

const OUTPUT = '/tmp/threecountry-pixel-final2';
const EXPECTED = [
  'cao', 'xiahou', 'dian', 'xun', 'guo', 'xu',
  'liu', 'guan', 'zhang', 'zhao', 'soldier-spear', 'soldier-archer',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('requestfailed', (request) => runtimeErrors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));

const analyzeCanvases = async (selector, minimum, label) => {
  const results = await page.locator(selector).evaluateAll((canvases) => canvases.map((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return { id: '', painted: 0, hash: 0, width: 0, height: 0 };
    const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data || [];
    let painted = 0;
    let hash = 2166136261;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] > 8) painted += 1;
      hash ^= data[index] + data[index + 1] * 3 + data[index + 2] * 7 + data[index + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return { id: canvas.dataset.pixelHero || '', painted, hash: hash >>> 0, width: canvas.width, height: canvas.height };
  }));
  if (results.length < minimum) throw new Error(`${label}: expected ${minimum}, received ${results.length}`);
  const invalid = results.find((result) => result.painted < 70 || !result.width || !result.height);
  if (invalid) throw new Error(`${label}: blank or invalid canvas ${JSON.stringify(invalid)}`);
  return results;
};

const advanceStoryTo = async (destination, limit = 20) => {
  for (let index = 0; index < limit; index += 1) {
    if (await page.locator(destination).isVisible().catch(() => false)) return;
    const next = page.locator('[data-action="story-next"]');
    if (!(await next.count())) break;
    await next.click({ force: true });
    await page.waitForTimeout(100);
  }
  await page.locator(destination).waitFor({ state: 'visible', timeout: 20_000 });
};

const closeBattleDialogue = async () => {
  for (let index = 0; index < 14; index += 1) {
    const next = page.locator('[data-action="battle-dialogue-next"]');
    if (!(await next.count())) return;
    await next.click({ force: true });
    await page.waitForTimeout(100);
  }
};

try {
  const response = await page.goto(`https://beerandnacho.github.io/threecountry-v2/?final2=${Date.now()}`, {
    waitUntil: 'networkidle', timeout: 120_000,
  });
  if (!response?.ok()) throw new Error(`Live page returned HTTP ${response?.status()}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForFunction(() => window.__pixelArtV2?.ready === true && window.__pixelArtV2?.heroCount === 12, undefined, { timeout: 30_000 });

  const assets = await page.evaluate(() => ({
    version: window.__pixelArtV2.version,
    heroes: window.__pixelArtV2.heroes,
    geometryCss: [...document.styleSheets].some((sheet) => sheet.href?.includes('pixel-geometry-fix.css')),
    externalCharacterRequests: performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => /raw\.githubusercontent|cdn\.jsdelivr/.test(name)),
  }));
  if (assets.version !== '20260818-9') throw new Error(`Unexpected pixel renderer version: ${assets.version}`);
  if (!assets.geometryCss) throw new Error('pixel-geometry-fix.css is not loaded.');
  if (assets.externalCharacterRequests.length) throw new Error(`External character requests detected: ${assets.externalCharacterRequests.join(', ')}`);

  await page.locator('[data-action="new-game"]').waitFor({ state: 'visible', timeout: 30_000 });
  const title = await analyzeCanvases('.title-cast canvas.pixel-portrait-v2', 2, 'title portraits');
  await page.screenshot({ path: `${OUTPUT}/01-title.png` });
  await page.locator('[data-action="new-game"]').click({ force: true });

  await advanceStoryTo('.roster-screen');
  const roster = await analyzeCanvases('.roster-card canvas.pixel-portrait-v2', 6, 'roster portraits');
  if (new Set(roster.map((item) => item.hash)).size !== 6) throw new Error('The six playable portraits are not visually distinct.');
  await page.screenshot({ path: `${OUTPUT}/02-roster.png`, fullPage: true });

  await page.locator('[data-pixel-detail]').first().click({ force: true });
  await page.locator('.pixel-sheet-modal.show').waitFor({ state: 'visible', timeout: 10_000 });
  await analyzeCanvases('.pixel-sheet-modal canvas.pixel-sheet-portrait-art', 1, 'detail portrait');
  const actionStates = await analyzeCanvases('.pixel-sheet-modal canvas.pixel-state-art', 4, 'action states');
  if (new Set(actionStates.map((item) => item.hash)).size < 3) throw new Error('Idle, move, attack, and skill art are not sufficiently distinct.');
  await page.screenshot({ path: `${OUTPUT}/03-detail.png` });
  await page.locator('[data-pixel-sheet-close]').last().click({ force: true });
  await page.locator('.pixel-sheet-modal').waitFor({ state: 'detached', timeout: 10_000 });

  await page.locator('[data-action="confirm-roster"]').click({ force: true });
  await advanceStoryTo('.deployment-screen');
  const deployment = await analyzeCanvases('.preview-unit canvas.pixel-sprite-v2', 8, 'deployment sprites');
  await page.screenshot({ path: `${OUTPUT}/04-deployment.png` });
  await page.locator('[data-action="start-battle"]').click({ force: true });
  await closeBattleDialogue();
  await page.locator('.battle-grid').waitFor({ state: 'visible', timeout: 20_000 });
  const battle = await analyzeCanvases('.battle-unit canvas.pixel-sprite-v2', 10, 'battle sprites');

  const renderedIds = [...new Set([...roster, ...battle].map((item) => item.id))].sort();
  const missing = EXPECTED.filter((id) => !renderedIds.includes(id));
  if (missing.length) throw new Error(`Missing character renderings: ${missing.join(', ')}`);
  if (await page.locator('.battle-cell').count() !== 96) throw new Error('Expected a 12x8 tactical grid.');

  const geometry = await page.evaluate(() => {
    const gridRect = document.querySelector('.battle-grid')?.getBoundingClientRect();
    const grid = gridRect ? { left: gridRect.left, top: gridRect.top, right: gridRect.right, bottom: gridRect.bottom, width: gridRect.width, height: gridRect.height } : null;
    const units = [...document.querySelectorAll('.battle-unit')].map((unit) => {
      const rect = unit.getBoundingClientRect();
      const canvasRect = unit.querySelector('canvas.pixel-sprite-v2')?.getBoundingClientRect();
      const computed = getComputedStyle(unit);
      return {
        id: unit.dataset.unit,
        hero: unit.dataset.pixelHero,
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
        canvas: canvasRect ? { left: canvasRect.left, top: canvasRect.top, right: canvasRect.right, bottom: canvasRect.bottom, width: canvasRect.width, height: canvasRect.height } : null,
        transform: computed.transform,
        translate: computed.translate,
        animation: computed.animationName,
      };
    });
    return { grid, units };
  });
  if (!geometry.grid) throw new Error('Battle grid geometry is unavailable.');
  for (const unit of geometry.units) {
    if (Object.values(unit.rect).some((value) => !Number.isFinite(value) || Math.abs(value) > 100000)) throw new Error(`Runaway unit geometry: ${JSON.stringify(unit)}`);
    if (unit.rect.right < geometry.grid.left || unit.rect.left > geometry.grid.right || unit.rect.bottom < geometry.grid.top || unit.rect.top > geometry.grid.bottom) throw new Error(`Unit is outside the battlefield: ${JSON.stringify(unit)}`);
    if (!unit.canvas || unit.canvas.width < 18 || unit.canvas.width > 40 || unit.canvas.height < 18 || unit.canvas.height > 40) throw new Error(`Unexpected pixel-unit dimensions: ${JSON.stringify(unit)}`);
    if (unit.transform !== 'none' || unit.translate !== 'none' || unit.animation !== 'none') throw new Error(`Unit animation geometry is not neutralized: ${JSON.stringify(unit)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/05-battle.png` });

  const actor = page.locator('.battle-unit.player:not(.acted)').first();
  const actorId = await actor.getAttribute('data-unit');
  await actor.click({ force: true });
  const actorElement = page.locator(`.battle-unit[data-unit="${actorId}"]`);
  const origin = await actorElement.evaluate((element) => ({
    x: element.style.getPropertyValue('--x').trim(),
    y: element.style.getPropertyValue('--y').trim(),
  }));
  const reachable = page.locator('.battle-cell.reachable');
  let target = null;
  for (let index = 0; index < await reachable.count(); index += 1) {
    const cell = reachable.nth(index);
    if ((await cell.getAttribute('data-x')) !== origin.x || (await cell.getAttribute('data-y')) !== origin.y) {
      target = cell;
      break;
    }
  }
  if (!target) throw new Error('No distinct reachable cell was found.');
  const destination = { x: await target.getAttribute('data-x'), y: await target.getAttribute('data-y') };
  const movementEffect = page.waitForSelector('.pixel-action-sprite-v2.move', { state: 'attached', timeout: 5_000 });
  await target.click({ force: true });
  await movementEffect;
  await page.waitForFunction(({ actorId, destination }) => {
    const element = document.querySelector(`.battle-unit[data-unit="${actorId}"]`);
    return element?.style.getPropertyValue('--x').trim() === destination.x && element?.style.getPropertyValue('--y').trim() === destination.y;
  }, { actorId, destination }, { timeout: 10_000 });
  await page.screenshot({ path: `${OUTPUT}/06-moved.png` });

  const movedActor = page.locator(`.battle-unit[data-unit="${actorId}"]`);
  await movedActor.click({ force: true });
  const attackButton = page.locator('[data-action="command-attack"]');
  if (!(await attackButton.count())) throw new Error('Attack command is unavailable after movement.');
  await attackButton.click({ force: true });
  const attackEffect = page.waitForSelector('.pixel-hit-fx-v2.attack', { state: 'attached', timeout: 5_000 });
  await page.locator('.battle-unit.enemy').first().dispatchEvent('pointerdown', { pointerType: 'mouse', bubbles: true });
  await attackEffect;
  await page.screenshot({ path: `${OUTPUT}/07-attack.png` });

  if (runtimeErrors.length) throw new Error(runtimeErrors.join('\n'));
  const result = {
    status: 'success',
    version: assets.version,
    renderedCharacters: renderedIds,
    titlePortraits: title.length,
    rosterPortraits: roster.length,
    actionStates: actionStates.length,
    deploymentSprites: deployment.length,
    battleSprites: battle.length,
    visibleGridUnits: geometry.units.length,
    movement: 'success',
    attackEffect: 'success',
    screenshots: 7,
  };
  await writeFile(`${OUTPUT}/result.json`, JSON.stringify(result, null, 2));
  await writeFile(`${OUTPUT}/geometry.json`, JSON.stringify(geometry, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  await page.screenshot({ path: `${OUTPUT}/99-failure.png` }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
