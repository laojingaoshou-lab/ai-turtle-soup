import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  console.log('=== Multiplayer Difficulty Mode Verification ===\n');

  // 1. Verify difficulty selection UI exists in lobby
  console.log('1. Lobby difficulty selection UI:');
  await p1.goto(BASE + '/lobby', { waitUntil: 'networkidle' });
  await p1.waitForTimeout(1500);

  const hasEasy = await p1.isVisible('text=简单模式');
  const hasHardcore = await p1.isVisible('text=硬核模式');
  const hasGameDifficultyLabel = await p1.isVisible('text=游戏难度');
  console.log(`  ${hasGameDifficultyLabel ? '✅' : '❌'} "游戏难度" label`);
  console.log(`  ${hasEasy ? '✅' : '❌'} "简单模式" button`);
  console.log(`  ${hasHardcore ? '✅' : '❌'} "硬核模式" button`);

  // 2. Select hardcore mode and create room
  console.log('\n2. Create room with hardcore mode:');
  await p1.fill('input[placeholder="你的名字"]', '房主');
  await p1.waitForTimeout(100);

  // Click hardcore mode button
  const hardcoreBtn = await p1.$('text=硬核模式');
  if (hardcoreBtn) {
    await hardcoreBtn.click();
    await p1.waitForTimeout(200);
    console.log('  ✅ Clicked hardcore mode');
  }

  // Select first script
  const firstScript = await p1.$('div.space-y-1 button');
  if (firstScript) {
    await firstScript.click();
    await p1.waitForTimeout(200);
  }

  const createBtn = await p1.$('button:has(svg.lucide-plus):not(:disabled)');
  if (createBtn) {
    await createBtn.click();
    await p1.waitForTimeout(2000);

    const url = p1.url();
    if (url.includes('/room/')) {
      const code = url.split('/room/')[1];
      console.log(`  ✅ Room created: ${code}`);

      // 3. Start game as host and verify mode badge
      console.log('\n3. Start game and check mode badge:');

      // Need another player to start
      await p2.goto(BASE + '/lobby', { waitUntil: 'networkidle' });
      await p2.waitForTimeout(1000);
      await p2.click('text=加入房间');
      await p2.waitForTimeout(200);
      await p2.fill('input[placeholder="你的名字"]', '玩家2');
      await p2.fill('input[placeholder="输入6位房间码"]', code);
      await p2.waitForTimeout(200);

      const joinBtn = await p2.$('button:has(svg.lucide-log-in):not(:disabled)');
      if (joinBtn) {
        await joinBtn.click();
        await p2.waitForTimeout(1000);
        console.log(`  ${p2.url().includes('/room/') ? '✅' : '❌'} Player 2 joined`);
      }

      // Host starts game
      const startGameBtn = await p1.$('text=开始游戏');
      if (startGameBtn) {
        await startGameBtn.click();
        await p1.waitForTimeout(1000);
      }

      // Check game page for mode badge
      const p1Url = p1.url();
      if (p1Url.includes('/game/multiplayer/')) {
        console.log(`  ✅ Navigated to game page: ${p1Url}`);

        const hasSkull = await p1.isVisible('text=硬核模式');
        console.log(`  ${hasSkull ? '✅' : '❌'} Hardcore badge on game page`);
      } else {
        console.log(`  ⚠️ P1 URL: ${p1Url}`);
      }

      // Check P2 also sees the badge
      await p2.waitForTimeout(1000);
      const p2Url = p2.url();
      if (p2Url.includes('/game/multiplayer/')) {
        const p2hasSkull = await p2.isVisible('text=硬核模式');
        console.log(`  ${p2hasSkull ? '✅' : '❌'} P2 sees hardcore badge`);
      }

    } else {
      console.log(`  ❌ Room creation failed: ${url}`);
      await p1.screenshot({ path: 'tests/screenshots/mm-00-fail.png', fullPage: true });
    }
  } else {
    console.log('  ❌ Create button disabled');
    await p1.screenshot({ path: 'tests/screenshots/mm-00-debug.png', fullPage: true });
  }

  // 4. Test easy mode room
  console.log('\n4. Easy mode room creation:');
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + '/lobby', { waitUntil: 'networkidle' });
  await p3.waitForTimeout(1000);
  await p3.fill('input[placeholder="你的名字"]', 'EasyHost');
  await p3.waitForTimeout(100);

  const firstScript3 = await p3.$('div.space-y-1 button');
  if (firstScript3) await firstScript3.click();
  await p3.waitForTimeout(200);

  const createBtn3 = await p3.$('button:has(svg.lucide-plus):not(:disabled)');
  if (createBtn3) {
    await createBtn3.click();
    await p3.waitForTimeout(1500);
    console.log(`  ${p3.url().includes('/room/') ? '✅' : '❌'} Easy room created: ${p3.url()}`);
  }

  console.log('\n=== Done ===');
  await browser.close();
})();
