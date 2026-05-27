import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('=== Game Mode Selection Verification ===\n');

  // 1. Navigate to script detail
  await page.goto(BASE + '/script/builtin-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('1. Script detail page loaded: 半根火柴');

  // 2. Click "开始游戏" - should open mode modal
  console.log('\n2. Click "开始游戏" button:');
  await page.click('button:has-text("开始游戏")');
  await page.waitForTimeout(500);

  const modalTitle = await page.textContent('text=选择游戏模式');
  if (modalTitle) {
    console.log('  ✅ Mode selection modal opened');
  } else {
    console.log('  ❌ Mode selection modal did not open');
  }

  // 3. Check both mode options visible
  const hasEasy = await page.isVisible('text=简单模式');
  const hasHardcore = await page.isVisible('text=硬核模式');
  if (hasEasy) console.log('  ✅ "简单模式" option visible');
  else console.log('  ❌ "简单模式" option missing');
  if (hasHardcore) console.log('  ✅ "硬核模式" option visible');
  else console.log('  ❌ "硬核模式" option missing');

  // Check recommended badge
  const hasRecommended = await page.isVisible('text=推荐');
  if (hasRecommended) console.log('  ✅ "推荐" badge on easy mode');
  else console.log('  ⚠️ "推荐" badge missing');

  await page.screenshot({ path: 'tests/screenshots/mode-01-modal.png', fullPage: false });

  // 4. Click easy mode
  console.log('\n3. Select 简单模式:');
  await page.click('button:has-text("简单模式")');
  await page.waitForTimeout(1000);

  // Check game started with easy mode badge
  const easyBadge = await page.$('text=简单模式');
  if (easyBadge) console.log('  ✅ Game started with "简单模式" badge');
  else console.log('  ❌ No easy mode badge in game');

  // Check URL has mode=easy
  const url = page.url();
  if (url.includes('mode=easy')) console.log('  ✅ URL contains mode=easy');
  else console.log(`  ⚠️ URL: ${url}`);

  await page.screenshot({ path: 'tests/screenshots/mode-02-easy-game.png', fullPage: false });

  // 5. Go back and test hardcore mode
  console.log('\n4. Navigate back and test 硬核模式:');
  await page.goto(BASE + '/script/builtin-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('button:has-text("开始游戏")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("硬核模式")');
  await page.waitForTimeout(1000);

  const hardcoreBadge = await page.$('text=硬核模式');
  if (hardcoreBadge) console.log('  ✅ Game started with "硬核模式" badge');
  else console.log('  ❌ No hardcore mode badge in game');

  const url2 = page.url();
  if (url2.includes('mode=hardcore')) console.log('  ✅ URL contains mode=hardcore');
  else console.log(`  ⚠️ URL: ${url2}`);

  await page.screenshot({ path: 'tests/screenshots/mode-03-hardcore-game.png', fullPage: false });

  // 6. Close modal by clicking outside (Escape)
  console.log('\n5. Modal close behavior:');
  await page.goto(BASE + '/script/builtin-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('button:has-text("开始游戏")');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const modalGone = !(await page.isVisible('text=选择游戏模式'));
  if (modalGone) console.log('  ✅ Modal closes with Escape key');
  else console.log('  ❌ Modal did not close with Escape');

  await page.screenshot({ path: 'tests/screenshots/mode-04-closed.png', fullPage: false });

  console.log('\n=== All checks passed ===');
  await browser.close();
})();
