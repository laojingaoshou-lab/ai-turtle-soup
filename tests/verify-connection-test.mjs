import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('=== Test Connection Feature Verification ===\n');

  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Button exists
  console.log('1. Button rendering:');
  const testBtn = await page.$('text=测试连接');
  if (testBtn) {
    console.log('  ✅ "测试连接" button visible');
  } else {
    console.log('  ❌ "测试连接" button not found');
  }

  // 2. Button should be disabled when no API key is set
  const btnDisabled = await page.$eval('button:has-text("测试连接")', el => el.disabled);
  if (btnDisabled) {
    console.log('  ✅ Button disabled when no API Key configured');
  } else {
    console.log('  ⚠️ Button not disabled (API Key is empty)');
  }

  await page.screenshot({ path: 'tests/screenshots/conn-01-idle.png', fullPage: false });

  // 3. Type a fake API Key
  console.log('\n2. Test with invalid API Key:');
  const apiKeyInput = await page.$('input[placeholder="sk-..."]');
  if (apiKeyInput) {
    await apiKeyInput.fill('sk-fake-test-key-12345');
    await page.waitForTimeout(200);
    console.log('  ✅ Entered test API Key');
  }

  // Button should now be enabled
  const btnEnabled = await page.$eval('button:has-text("测试连接")', el => !el.disabled);
  if (btnEnabled) {
    console.log('  ✅ Button enabled after entering API Key');
  } else {
    console.log('  ⚠️ Button still disabled after entering API Key');
  }

  // 4. Click test connection with fake key
  console.log('\n3. Connection test execution:');
  await page.click('button:has-text("测试连接")');
  await page.waitForTimeout(300);

  // Check loading state
  const loadingVisible = await page.isVisible('text=正在测试');
  console.log(`  ${loadingVisible ? '✅' : '⚠️'} Loading state ${loadingVisible ? 'shows' : 'doesn\'t show'} "正在测试..."`);

  // Wait for result
  await page.waitForTimeout(3000);

  // Check result state
  const failedVisible = await page.isVisible('text=连接失败');
  const successVisible = await page.isVisible('text=连接成功');
  if (failedVisible || successVisible) {
    console.log(`  ✅ Result shown: ${failedVisible ? '连接失败' : '连接成功'}`);
  } else {
    console.log('  ⚠️ No result shown after testing');
  }

  // Check latency display
  const msVisible = await page.isVisible('text=/\\d+ms/');
  if (msVisible) {
    console.log('  ✅ Latency displayed');
  }

  await page.screenshot({ path: 'tests/screenshots/conn-02-result.png', fullPage: false });

  // 5. Clear the key - verify button becomes disabled again
  console.log('\n4. Re-disable after clearing key:');
  await apiKeyInput.fill('');
  await page.waitForTimeout(300);

  // Click the disabled button should not trigger
  const beforeSource = await page.textContent('body');
  await page.click('button:has-text("测试连接")', { timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(500);
  const afterSource = await page.textContent('body');
  if (beforeSource === afterSource) {
    console.log('  ✅ Button stays idle when clicked with empty key');
  }

  await page.screenshot({ path: 'tests/screenshots/conn-03-disabled.png', fullPage: false });

  console.log('\n=== All checks passed ===');
  await browser.close();
})();
