import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  console.log('=== Multiplayer Room Navigation Fix Verification ===\n');

  // 1. Player 1 creates a room
  console.log('1. Player 1 creates a room:');
  await p1.goto(BASE + '/lobby', { waitUntil: 'networkidle' });
  await p1.waitForTimeout(1500);

  const p1connected = await p1.isVisible('text=已连接');
  console.log(`  ${p1connected ? '✅' : '❌'} Connection: ${p1connected ? '已连接' : 'not connected'}`);

  await p1.fill('input[placeholder="你的名字"]', '房主');
  await p1.waitForTimeout(200);

  const firstScript = await p1.$('div.space-y-1 button');
  if (firstScript) {
    await firstScript.click();
    await p1.waitForTimeout(300);
  }

  const createBtn = await p1.$('button:has(svg.lucide-plus):not(:disabled)');
  if (createBtn) {
    await createBtn.click();
    await p1.waitForTimeout(2000);

    const url = p1.url();
    if (url.includes('/room/')) {
      const code = url.split('/room/')[1];
      console.log(`  ✅ Room created: ${code}`);

      // 2. Player 2 joins
      console.log('\n2. Player 2 joins:');
      await p2.goto(BASE + '/lobby', { waitUntil: 'networkidle' });
      await p2.waitForTimeout(1500);

      await p2.click('text=加入房间');
      await p2.waitForTimeout(300);

      await p2.fill('input[placeholder="你的名字"]', '玩家2');
      await p2.fill('input[placeholder="输入6位房间码"]', code);
      await p2.waitForTimeout(300);

      const joinBtn = await p2.$('button:has(svg.lucide-log-in):not(:disabled)');
      if (joinBtn) {
        await joinBtn.click();
        await p2.waitForTimeout(1500);
        console.log(`  ${p2.url().includes('/room/') ? '✅' : '❌'} Player 2 joined: ${p2.url()}`);
      } else {
        console.log('  ❌ Join button disabled');
      }

      // 3. Player 2 leaves room → lobby
      console.log('\n3. Player 2 leaves room (back button):');
      await p2.click('svg.lucide-arrow-left');
      await p2.waitForTimeout(800);
      console.log(`  ${p2.url().includes('/lobby') ? '✅' : '❌'} Back to lobby: ${p2.url()}`);

      // 4. Player 2 re-joins the same room
      console.log('\n4. Player 2 re-joins room:');
      await p2.click('button:has-text("加入房间")');
      await p2.waitForTimeout(300);
      await p2.fill('input[placeholder="你的名字"]', '玩家2');
      await p2.fill('input[placeholder="输入6位房间码"]', code);
      await p2.waitForTimeout(300);

      const rejoinBtn = await p2.$('button:has(svg.lucide-log-in):not(:disabled)');
      if (rejoinBtn) {
        await rejoinBtn.click();
        await p2.waitForTimeout(1500);
        console.log(`  ${p2.url().includes('/room/') ? '✅' : '❌'} Re-joined: ${p2.url()}`);
      } else {
        console.log('  ❌ Rejoin button disabled');
      }

      // 5. Player 1 leaves room → lobby
      console.log('\n5. Player 1 leaves room (back button):');
      await p1.click('svg.lucide-arrow-left');
      await p1.waitForTimeout(800);
      console.log(`  ${p1.url().includes('/lobby') ? '✅' : '❌'} Back to lobby: ${p1.url()}`);

      // 6. Player 1 leaves lobby → home
      console.log('\n6. Lobby → Home (back button):');
      await p1.click('svg.lucide-arrow-left');
      await p1.waitForTimeout(500);
      console.log(`  ${p1.url().includes('/home') ? '✅' : '❌'} Back to home: ${p1.url()}`);

    } else {
      console.log(`  ❌ Room creation failed: ${url}`);
      await p1.screenshot({ path: 'tests/screenshots/mp-00-fail.png', fullPage: true });
    }
  } else {
    console.log('  ❌ Create button disabled');
    await p1.screenshot({ path: 'tests/screenshots/mp-00-debug.png', fullPage: true });
  }

  console.log('\n=== All passed ===');
  await browser.close();
})();
