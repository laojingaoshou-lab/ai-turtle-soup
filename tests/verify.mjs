import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const results = [];

function pass(msg) { results.push(`✅ ${msg}`); }
function warn(msg) { results.push(`⚠️ ${msg}`); }
function fail(msg) { results.push(`❌ ${msg}`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Home page loads
  console.log('\n--- Test: Home Page ---');
  await page.goto(BASE + '/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const title = await page.textContent('h1');
  if (title?.includes('海 龟 汤')) pass('Home page title renders: 海 龟 汤');
  else fail(`Home page title missing, got: "${title}"`);

  const subtitle = await page.textContent('body');
  if (subtitle?.includes('情 境 推 理 谜 题')) pass('Subtitle renders: 情境推理谜题');
  else fail('Subtitle missing');

  // Stats cards
  const hasStats = await page.isVisible('text=总局数') && await page.isVisible('text=解谜率') && await page.isVisible('text=总提问');
  if (hasStats) pass('Stats cards visible (总局数, 解谜率, 总提问)');
  else fail('Stats cards not visible');

  // CTA buttons
  const hasCTA = await page.isVisible('text=立即开始') && await page.isVisible('text=随机开局') && await page.isVisible('text=多人联机');
  if (hasCTA) pass('CTA buttons visible (立即开始, 随机开局, 多人联机)');
  else fail('CTA buttons missing');

  // Empty state
  const hasEmpty = await page.isVisible('text=尚未开始游戏');
  if (hasEmpty) pass('Empty state shows "尚未开始游戏"');
  else warn('Empty state not found (may already have game history)');

  // TabBar
  const hasTabBar = await page.isVisible('text=首页') && await page.isVisible('text=剧本') && await page.isVisible('text=联机') && await page.isVisible('text=设置');
  if (hasTabBar) pass('TabBar with 4 tabs visible');
  else fail('TabBar missing');

  // Canvas particle background
  const hasCanvas = await page.$('canvas');
  if (hasCanvas) pass('Particle background canvas exists');
  else warn('Particle background canvas not found');

  // Screenshot home
  await page.screenshot({ path: 'tests/screenshots/01-home.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/01-home.png');

  // 2. Scripts page
  console.log('\n--- Test: Scripts Page ---');
  await page.click('text=剧本');
  await page.waitForTimeout(800);

  const scriptsTitle = await page.textContent('h1');
  if (scriptsTitle?.includes('剧本库')) pass('Scripts page title: 剧本库');
  else fail(`Scripts page title missing, got: "${scriptsTitle}"`);

  // Check script count badge
  const hasBadge = await page.isVisible('text=12');
  if (hasBadge) pass('Script count badge shows 12');
  else warn('Script count badge not showing 12');

  // Check builtin scripts visible
  const hasBuiltin = await page.isVisible('text=内置剧本');
  if (hasBuiltin) pass('Built-in script section visible');
  else fail('Built-in script section missing');

  // Check script cards
  const scriptCards = await page.$$('.glass.rounded-xl');
  if (scriptCards.length >= 5) pass(`${scriptCards.length} script cards found`);
  else fail(`Only ${scriptCards.length} script cards found`);

  await page.screenshot({ path: 'tests/screenshots/02-scripts.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/02-scripts.png');

  // 3. Script detail page
  console.log('\n--- Test: Script Detail Page ---');
  await page.click('text=半根火柴');
  await page.waitForTimeout(800);

  const detailTitle = await page.textContent('h1');
  if (detailTitle?.includes('半根火柴')) pass('Script detail: 半根火柴');
  else fail(`Script detail title wrong: "${detailTitle}"`);

  const hasDifficulty = await page.isVisible('text=中等');
  if (hasDifficulty) pass('Difficulty badge visible');
  else fail('Difficulty badge missing');

  const hasScenario = await page.isVisible('text=汤面');
  if (hasScenario) pass('汤面 section visible');
  else fail('汤面 section missing');

  const hasStartBtn = await page.isVisible('text=开始游戏');
  if (hasStartBtn) pass('"开始游戏" button visible');
  else fail('"开始游戏" button missing');

  const hasMultiplayerBtn = await page.isVisible('text=创建联机房');
  if (hasMultiplayerBtn) pass('"创建联机房" button visible');
  else fail('"创建联机房" button missing');

  await page.screenshot({ path: 'tests/screenshots/03-script-detail.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/03-script-detail.png');

  // 4. Settings page
  console.log('\n--- Test: Settings Page ---');
  await page.click('text=设置');
  await page.waitForTimeout(800);

  const settingsTitle = await page.textContent('h1');
  if (settingsTitle?.includes('设置')) pass('Settings page title: 设置');
  else fail(`Settings page title wrong: "${settingsTitle}"`);

  const hasApiConfig = await page.isVisible('text=AI 配置');
  if (hasApiConfig) pass('AI config section visible');
  else fail('AI config section missing');

  const hasApiUrl = await page.isVisible('text=API 地址');
  if (hasApiUrl) pass('API URL input visible');
  else fail('API URL input missing');

  const hasApiKey = await page.isVisible('text=API Key');
  if (hasApiKey) pass('API Key input visible');
  else fail('API Key input missing');

  await page.screenshot({ path: 'tests/screenshots/04-settings.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/04-settings.png');

  // 5. Lobby page
  console.log('\n--- Test: Lobby Page ---');
  await page.click('text=联机');
  await page.waitForTimeout(1000);

  const lobbyTitle = await page.textContent('h1');
  if (lobbyTitle?.includes('多人联机')) pass('Lobby title: 多人联机');
  else fail(`Lobby title wrong: "${lobbyTitle}"`);

  const hasCreateTab = await page.isVisible('text=创建房间');
  if (hasCreateTab) pass('"创建房间" tab visible');
  else fail('"创建房间" tab missing');

  const hasJoinTab = await page.isVisible('text=加入房间');
  if (hasJoinTab) pass('"加入房间" tab visible');
  else fail('"加入房间" tab missing');

  const hasConnectionStatus = await page.isVisible('text=已连接');
  if (hasConnectionStatus) pass('Connection status: 已连接');
  else warn('Connection status not showing "已连接"');

  await page.screenshot({ path: 'tests/screenshots/05-lobby.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/05-lobby.png');

  // 6. Navigate back to home and test random
  console.log('\n--- Test: Navigation & Random ---');
  await page.click('text=首页');
  await page.waitForTimeout(500);
  await page.click('text=随机开局');
  await page.waitForTimeout(800);

  const randomDetail = await page.textContent('h1');
  if (randomDetail) pass(`Random script navigates to detail: "${randomDetail}"`);
  else fail('Random script navigation failed');

  // Go back
  await page.click('svg.lucide-arrow-left, button:has(svg)');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'tests/screenshots/06-after-random.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/06-after-random.png');

  // 7. Import page
  console.log('\n--- Test: Import Page ---');
  await page.goto(BASE + '/script/import', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const importTitle = await page.textContent('h1');
  if (importTitle?.includes('导入剧本')) pass('Import page title: 导入剧本');
  else fail(`Import page title wrong: "${importTitle}"`);

  const hasImportForm = await page.isVisible('text=汤面') && await page.isVisible('text=汤底');
  if (hasImportForm) pass('Import form has 汤面 and 汤底 fields');
  else fail('Import form fields missing');

  await page.screenshot({ path: 'tests/screenshots/07-import.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/07-import.png');

  // 8. Try to start a game (without AI key - should still load)
  console.log('\n--- Test: Game Page ---');
  await page.goto(BASE + '/game/test?scriptId=builtin-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const gameTitle = await page.textContent('h1');
  if (gameTitle?.includes('半根火柴')) pass('Game page loads with correct script');
  else warn(`Game page title: "${gameTitle}"`);

  const hasScenarioCard = await page.isVisible('text=汤面');
  if (hasScenarioCard) pass('ScenarioCard visible in game');
  else fail('ScenarioCard missing in game');

  const hasChatInput = await page.$('textarea[placeholder*="问题"]');
  if (hasChatInput) pass('Chat input visible');
  else fail('Chat input missing');

  const hasGiveUpBtn = await page.$('button[title="放弃"]');
  if (hasGiveUpBtn) pass('Give up button visible');
  else fail('Give up button missing');

  await page.screenshot({ path: 'tests/screenshots/08-game.png', fullPage: false });
  console.log('  Screenshot: tests/screenshots/08-game.png');

  // 9. Test sending a question (should show loading then error without AI key)
  console.log('\n--- Test: Game Interaction ---');
  const textarea = await page.$('textarea[placeholder*="问题"]');
  if (textarea) {
    await textarea.fill('是白天发生的事情吗');
    await page.waitForTimeout(300);
    await page.click('button:has(svg.lucide-send)');
    await page.waitForTimeout(2000);

    const messages = await page.$$('.rounded-2xl');
    if (messages.length > 0) pass(`Chat messages visible (${messages.length} found)`);
    else warn('No chat messages visible after sending');

    await page.screenshot({ path: 'tests/screenshots/09-chat-interaction.png', fullPage: false });
    console.log('  Screenshot: tests/screenshots/09-chat-interaction.png');
  }

  // 10. Test summary page
  console.log('\n--- Test: Summary Page ---');
  await page.goto(BASE + '/summary/nonexistent', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const hasNotFound = await page.isVisible('text=记录不存在');
  if (hasNotFound) pass('Summary shows "记录不存在" for invalid ID');
  else warn('Summary page did not show not-found state');

  await page.screenshot({ path: 'tests/screenshots/10-summary-notfound.png', fullPage: false });

  // Report
  console.log('\n========================================');
  console.log('       Verification Results');
  console.log('========================================\n');
  for (const r of results) console.log(r);

  const failures = results.filter(r => r.startsWith('❌'));
  const warnings = results.filter(r => r.startsWith('⚠️'));
  console.log(`\nTotal: ${results.length} checks | ${failures.length} failures | ${warnings.length} warnings\n`);

  await browser.close();

  if (failures.length > 0) process.exit(1);
})();
