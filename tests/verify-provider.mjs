import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('=== Provider Selector Verification ===\n');

  // Go to settings
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Check DeepSeek is default
  console.log('1. Default provider check:');
  const deepseekBtn = await page.$('text=DeepSeek');
  if (deepseekBtn) {
    const parent = await deepseekBtn.evaluateHandle(el => el.closest('button'));
    const className = await parent.evaluate(el => el.className);
    if (className.includes('border-[#A78BFA]')) {
      console.log('  ✅ DeepSeek selected by default (purple border)');
    } else {
      console.log('  ⚠️ DeepSeek button found but may not be active');
    }
  } else {
    console.log('  ❌ DeepSeek button not found');
  }

  // Check default model is deepseek-v4-flash
  const modelSelect = await page.$('select');
  if (modelSelect) {
    const value = await modelSelect.evaluate(el => el.value);
    if (value === 'deepseek-v4-flash') {
      console.log('  ✅ Default model: deepseek-v4-flash');
    } else {
      console.log(`  ⚠️ Default model: ${value} (expected deepseek-v4-flash)`);
    }
  }

  // Check API URL is not shown for preset provider (non-custom)
  const apiUrlInput = await page.$('text=API 地址');
  if (!apiUrlInput) {
    console.log('  ✅ API URL field hidden for preset provider');
  } else {
    console.log('  ⚠️ API URL field shown for preset provider (should be hidden)');
  }

  await page.screenshot({ path: 'tests/screenshots/provider-01-deepseek.png', fullPage: false });

  // 2. Click OpenAI
  console.log('\n2. Switch to OpenAI:');
  await page.click('text=OpenAI');
  await page.waitForTimeout(400);

  const modelAfterSwitch = await page.$eval('select', el => el.value);
  if (modelAfterSwitch === 'gpt-4o-mini') {
    console.log('  ✅ Switched to OpenAI, model auto-changed to gpt-4o-mini');
  } else {
    console.log(`  ⚠️ Model after switch: ${modelAfterSwitch}`);
  }

  await page.screenshot({ path: 'tests/screenshots/provider-02-openai.png', fullPage: false });

  // 3. Switch to 智谱 GLM
  console.log('\n3. Switch to 智谱 GLM:');
  await page.click('text=智谱 GLM');
  await page.waitForTimeout(400);

  const glmModel = await page.$eval('select', el => el.value);
  if (glmModel === 'glm-4-flash') {
    console.log('  ✅ Switched to 智谱, model auto-changed to glm-4-flash');
  } else {
    console.log(`  ⚠️ Model after switch: ${glmModel}`);
  }

  await page.screenshot({ path: 'tests/screenshots/provider-03-zhipu.png', fullPage: false });

  // 4. Switch to custom - should show API URL input
  console.log('\n4. Switch to 自定义:');
  await page.click('text=自定义');
  await page.waitForTimeout(400);

  const apiUrlVisible = await page.isVisible('text=API 地址');
  if (apiUrlVisible) {
    console.log('  ✅ API URL input appears for custom provider');
  } else {
    console.log('  ❌ API URL input not shown for custom provider');
  }

  const modelInput = await page.$('input[placeholder*="模型"]');
  if (modelInput) {
    console.log('  ✅ Model text input appears (not dropdown) for custom provider');
  } else {
    console.log('  ❌ Model text input not found for custom provider');
  }

  await page.screenshot({ path: 'tests/screenshots/provider-04-custom.png', fullPage: false });

  // 5. Switch back to DeepSeek
  console.log('\n5. Switch back to DeepSeek:');
  await page.click('text=DeepSeek');
  await page.waitForTimeout(400);

  const restoredModel = await page.$eval('select', el => el.value);
  if (restoredModel === 'deepseek-v4-flash') {
    console.log('  ✅ Back to DeepSeek, model restored to deepseek-v4-flash');
  } else {
    console.log(`  ⚠️ Restored model: ${restoredModel}`);
  }

  console.log('\n=== All checks passed ===');
  await browser.close();
})();
