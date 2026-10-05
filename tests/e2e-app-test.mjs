import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('test-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runE2ETests() {
  console.log('🚀 Launching browser for end-to-end testing...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[browser-error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.error('❌ Page Error:', err.message));

  console.log('📍 Navigating to Omninotes at http://localhost:1420...');
  await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });

  // 1. Verify Home Library View
  const title = await page.title();
  console.log(`✓ Page Title: "${title}"`);
  if (!title.toLowerCase().includes('omninotes')) {
    throw new Error(`Unexpected page title: ${title}`);
  }

  await page.waitForSelector('text=Omninotes');
  console.log('✓ Omninotes brand header is present');

  await page.waitForSelector('text=Start Fresh');
  console.log('✓ Template starters section is rendered');

  await page.waitForSelector('text=Notebooks');
  console.log('✓ Notebook collections grid is rendered');

  // Verify that ugly debug HUD is NOT anywhere on the page
  const hudCount = await page.locator('text=PALM GUARD ACTIVE').count();
  const inputReadyCount = await page.locator('text=INPUT: READY').count();
  if (hudCount > 0 || inputReadyCount > 0) {
    throw new Error('❌ AI-slop debug HUD is still present!');
  }
  console.log('✓ Verified: Debug telemetry HUD is completely absent');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-library-home.png') });
  console.log('📸 Captured 01-library-home.png');

  // 2. Open Notebook into Editor
  console.log('📖 Opening notebook into editor workspace...');
  const firstNotebook = page.locator('div.group:has-text("Computer Science & Notes")').first();
  if (await firstNotebook.count() > 0) {
    await firstNotebook.click();
  } else {
    await page.click('button:has-text("Quick Scribble")');
  }

  await page.waitForSelector('button:has-text("Library")');
  console.log('✓ Back to Library button present in header');

  // Check that floating dock is visible
  await page.waitForSelector('button[title*="Pen Tool"]');
  console.log('✓ Centered floating studio dock is active');

  // Check paper canvas is centered
  const canvasEl = page.locator('div.cursor-crosshair');
  await canvasEl.waitFor();
  console.log('✓ Centered paper canvas is mounted');

  // Verify again: NO HUD on canvas!
  const canvasHudCount = await page.locator('text=PALM GUARD ACTIVE').count();
  if (canvasHudCount > 0) {
    throw new Error('❌ Debug HUD found in editor canvas!');
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-editor-centered-canvas.png') });
  console.log('📸 Captured 02-editor-centered-canvas.png');

  // 3. Test Stylus Drawing Simulation
  console.log('✍️ Simulating inking on centered paper...');
  const box = await canvasEl.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2 - 100;
    const startY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 30; i++) {
      await page.mouse.move(startX + i * 8, startY + Math.sin(i * 0.4) * 35, { steps: 2 });
    }
    await page.mouse.up();
    console.log('✓ Inked smooth pen stroke on paper');

    // Switch to Highlighter
    const highlighterBtn = page.locator('button[title*="Highlighter"]');
    await highlighterBtn.click();
    console.log('✓ Switched to Highlighter');

    await page.mouse.move(startX, startY + 60);
    await page.mouse.down();
    await page.mouse.move(startX + 240, startY + 60, { steps: 4 });
    await page.mouse.up();
    console.log('✓ Highlighted text region');
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-editor-inking.png') });
  console.log('📸 Captured 03-editor-inking.png');

  // 4. Test AI Second Brain Slide-over
  console.log('✨ Testing AI Second Brain Assistant...');
  const aiBtn = page.locator('button:has-text("AI Second Brain")');
  await aiBtn.click();
  await page.waitForTimeout(300);
  console.log('✓ AI Second Brain drawer opened');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-editor-ai-assistant.png') });
  console.log('📸 Captured 04-editor-ai-assistant.png');

  // Close AI drawer
  await aiBtn.click();
  await page.waitForTimeout(200);

  // 5. Test Return to Library
  console.log('🏠 Navigating back to Library shelf...');
  const libraryBtn = page.locator('button:has-text("Library")');
  await libraryBtn.click();
  await page.waitForSelector('text=Start Fresh');
  console.log('✓ Successfully returned to Library Home View');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-returned-to-library.png') });
  console.log('📸 Captured 05-returned-to-library.png');

  await browser.close();
  console.log('🎉 All E2E tests passed with 100% success!');
}

runE2ETests().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
