import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const startsPreview = !process.env.SITE_URL;
const siteUrl = process.env.SITE_URL ?? 'http://127.0.0.1:4174/';
const axeSource = await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(siteUrl)).ok) return;
    } catch {
      // The Vite preview server has not bound its port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for preview at ${siteUrl}`);
}

async function assertPageBasics(page) {
  await page.goto(siteUrl, { waitUntil: 'networkidle' });
  check(await page.title() === 'Web Audio Route Map — Make the signal path visible', 'Unexpected document title.');
  check(await page.locator('html').getAttribute('lang') === 'en', 'Document language is missing.');
  check(await page.locator('h1').count() === 1, 'Expected exactly one h1.');
  check(await page.locator('main').count() === 1, 'Expected exactly one main landmark.');
}

const preview = startsPreview
  ? spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--config', 'vite.site.config.ts', '--host', '127.0.0.1', '--port', '4174'], { stdio: 'ignore' })
  : undefined;

try {
  if (preview) await waitForPreview();
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
  await assertPageBasics(page);
  await page.getByRole('button', { name: 'Wet / dry' }).click();
  await page.getByRole('button', { name: 'Mute dry route' }).click();
  check(await page.getByRole('button', { name: 'Restore dry route' }).getAttribute('aria-pressed') === 'true', 'Muted route was not announced.');
  check(await page.locator('.warm-route--inactive').count() === 1, 'Muted route was not rendered as inactive.');

  await page.locator('.warm-node').first().focus();
  await page.keyboard.press('ArrowRight');
  check(await page.locator('.warm-node').nth(1).evaluate((node) => document.activeElement === node), 'Arrow-key node navigation failed.');

  await page.evaluate(axeSource);
  const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
  check(!axe.violations.some((violation) => ['serious', 'critical'].includes(violation.impact)), 'Axe found a serious or critical violation.');

  await page.evaluate(() => navigator.serviceWorker.ready);
  await desktop.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  check(await page.locator('.warm-node').count() === 4, 'Offline reload did not retain the interactive map.');
  await desktop.setOffline(false);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
  });
  check(await page.locator('#offline-note').isVisible(), 'Offline notice did not appear after an offline event.');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobile.newPage();
  await assertPageBasics(mobilePage);
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth === window.innerWidth), 'Mobile page has unintended horizontal overflow.');
  await mobile.close();

  check(errors.length === 0, `Browser reported errors: ${errors.join(' | ')}`);
  console.log('Desktop, keyboard, axe, offline, and 390px mobile browser smoke checks passed.');
  } finally {
    await desktop.close();
    await browser.close();
  }
} finally {
  preview?.kill('SIGTERM');
}
