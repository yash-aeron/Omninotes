const { chromium } = require('playwright');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

async function testPdfWorkflow() {
  console.log('1. Generating sample PDF document...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  
  // Page 1
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 595, 842, 'F');
  doc.setFontSize(26);
  doc.setTextColor(30, 41, 59);
  doc.text('Advanced Neuroscience Lecture Notes', 50, 80);
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('Chapter 4: Action Potential Propagation & Synaptic Transmission', 50, 115);
  doc.setDrawColor(203, 213, 225);
  doc.line(50, 135, 545, 135);
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'The action potential is an explosion of electrical activity that is created by a depolarizing current.\nThis means that some event (a stimulus) causes the resting potential to move toward 0 mV.\nWhen the depolarization reaches about -55 mV a neuron will fire an action potential.',
    50,
    170
  );
  doc.setFillColor(224, 231, 255);
  doc.roundedRect(50, 240, 495, 140, 8, 8, 'F');
  doc.setFontSize(13);
  doc.setTextColor(67, 56, 202);
  doc.text('Key Takeaway for Exam:', 70, 275);
  doc.setFontSize(11);
  doc.setTextColor(55, 48, 163);
  doc.text('- Threshold potential: -55 mV\n- Depolarization phase: Voltage-gated Na+ channels open\n- Repolarization phase: Voltage-gated K+ channels open', 70, 305);

  // Page 2
  doc.addPage();
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 595, 842, 'F');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('Synaptic Vesicle Exocytosis', 50, 80);
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('Neurotransmitter release is triggered by Ca2+ influx through voltage-gated calcium channels.', 50, 120);

  const samplePdfPath = path.resolve(__dirname, 'sample-lecture.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(samplePdfPath, Buffer.from(pdfBytes));
  console.log(`Saved sample PDF to: ${samplePdfPath}`);

  console.log('2. Launching headless browser...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER PAGE ERROR:', err));

  console.log('3. Navigating to http://localhost:1420...');
  await page.goto('http://localhost:1420', { waitUntil: 'networkidle', timeout: 15000 });

  console.log('4. Locating Import PDF input...');
  const fileInput = await page.locator('input[type="file"][accept*="pdf"]').first();
  await fileInput.setInputFiles(samplePdfPath);
  console.log('PDF file selected, waiting for import...');

  // Wait for editor view to appear (e.g. StudioToolbar or canvas)
  await page.waitForSelector('header button:has-text("Library")', { timeout: 15000 });
  console.log('Editor opened successfully!');

  // Check if PDF background image rendered
  const pdfBgImg = await page.locator('[data-testid="pdf-page-background"]').first();
  await pdfBgImg.waitFor({ state: 'visible', timeout: 15000 });
  const src = await pdfBgImg.getAttribute('src');
  console.log('Rendered PDF page background image found, length:', src ? src.length : 0);

  // Check Pages panel thumbnail
  const pdfBadge = await page.locator('div:has-text("PDF")').first();
  console.log('PDF badge in thumbnail strip visible:', await pdfBadge.isVisible());

  // Simulate drawing a stylus stroke on the PDF
  console.log('5. Drawing stylus annotations directly on PDF...');
  const canvasElem = await page.locator('div.cursor-crosshair').first();
  const box = await canvasElem.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + 260;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 180, startY + 15, { steps: 10 });
    await page.mouse.move(startX + 220, startY + 50, { steps: 10 });
    await page.mouse.up();
    console.log('Stylus stroke drawn on top of PDF!');
  }

  await page.waitForTimeout(1000);

  const screenshotPath = path.resolve(__dirname, 'pdf-annotated-test.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();

  // Cleanup test PDF
  if (fs.existsSync(samplePdfPath)) fs.unlinkSync(samplePdfPath);
  console.log('PDF support verification completed successfully!');
}

testPdfWorkflow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
