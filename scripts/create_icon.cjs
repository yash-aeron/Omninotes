const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Canvas: Deep Midnight Slate -->
    <linearGradient id="appBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141724" />
      <stop offset="50%" stop-color="#0d0f17" />
      <stop offset="100%" stop-color="#06070a" />
    </linearGradient>

    <!-- App Icon Glass Bevel Rim -->
    <linearGradient id="rimGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
    </linearGradient>

    <!-- Paper Sheet Gradient: Premium Crisp Ivory/White -->
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="65%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>

    <!-- Paper Border -->
    <linearGradient id="paperEdge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.5" />
    </linearGradient>

    <!-- Luxury Pen Grip Barrel: Matte Obsidian Titanium -->
    <linearGradient id="penBarrel" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="40%" stop-color="#334155" />
      <stop offset="70%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Pen Collar Ring: Polished Platinum -->
    <linearGradient id="collarRing" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94a3b8" />
      <stop offset="30%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>

    <!-- Luxury Nib Body: Polished Platinum with central highlight -->
    <linearGradient id="nibMetal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94a3b8" />
      <stop offset="30%" stop-color="#f8fafc" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>

    <!-- Ink Stroke: Deep Royal Indigo to Sapphire -->
    <linearGradient id="inkStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="40%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>

    <!-- Realistic Multilevel Shadows -->
    <filter id="paperShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.3" />
    </filter>

    <filter id="penShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="-4" dy="12" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.4" />
      <feDropShadow dx="-1" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.25" />
    </filter>

    <filter id="inkGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1d4ed8" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- 1. Background Squircle (Apple/Windows Modern App Base) -->
  <rect x="24" y="24" width="464" height="464" rx="108" fill="url(#appBg)" />
  <rect x="24" y="24" width="464" height="464" rx="108" fill="none" stroke="url(#rimGlow)" stroke-width="2" />

  <!-- 2. The Pristine Stationery Sheet (Tilted gently -6 degrees) -->
  <g transform="translate(242, 268) rotate(-6) translate(-145, -170)" filter="url(#paperShadow)">
    <!-- Base Paper Card -->
    <rect x="0" y="0" width="290" height="340" rx="24" fill="url(#paperGrad)" />
    <rect x="0" y="0" width="290" height="340" rx="24" fill="none" stroke="url(#paperEdge)" stroke-width="1.5" />

    <!-- Ruled Margin Line (Classic Pink Margin) -->
    <line x1="56" y1="0" x2="56" y2="340" stroke="#fca5a5" stroke-width="1.5" stroke-opacity="0.75" />

    <!-- Ruled Lines -->
    <line x1="18" y1="65" x2="272" y2="65" stroke="#e2e8f0" stroke-width="1.4" />
    <line x1="18" y1="110" x2="272" y2="110" stroke="#e2e8f0" stroke-width="1.4" />
    <line x1="18" y1="155" x2="272" y2="155" stroke="#e2e8f0" stroke-width="1.4" />
    <line x1="18" y1="200" x2="272" y2="200" stroke="#e2e8f0" stroke-width="1.4" />
    <line x1="18" y1="245" x2="272" y2="245" stroke="#e2e8f0" stroke-width="1.4" />
    <line x1="18" y1="290" x2="272" y2="290" stroke="#e2e8f0" stroke-width="1.4" />

    <!-- 3. Dynamic Hand-Inked Calligraphic 'O' Monogram on the paper -->
    <g filter="url(#inkGlow)">
      <!-- Smooth, beautiful calligraphic cursive loop with natural flourish -->
      <path
        d="M 180 110
           C 125 110 78 150 78 205
           C 78 262 122 300 178 300
           C 236 300 268 258 268 198
           C 268 138 222 108 165 108
           C 118 108 88 148 88 198
           C 88 245 120 280 168 280
           C 208 280 238 245 240 205"
        fill="none"
        stroke="url(#inkStroke)"
        stroke-width="15"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </g>

  <!-- 4. The Precision Stylus / Fountain Pen (Contained within frame at 40 degrees) -->
  <g transform="translate(322, 218) rotate(40)" filter="url(#penShadow)">
    <!-- Pen Barrel -->
    <rect x="-20" y="-125" width="40" height="125" rx="7" fill="url(#penBarrel)" />
    <!-- Metallic Grip Ring -->
    <rect x="-21" y="-2" width="42" height="10" rx="2.5" fill="url(#collarRing)" />

    <!-- Pen Grip Section -->
    <path
      d="M -18,8
         L -15,55
         L 15,55
         L 18,8
         Z"
      fill="url(#penBarrel)"
    />

    <!-- Secondary Chrome Trim Ring -->
    <rect x="-15" y="55" width="30" height="5" rx="1.5" fill="url(#collarRing)" />

    <!-- The Luxury Fountain Pen Nib -->
    <path
      d="M -15,60
         L -19,82
         C -20,104 -12,126 0,154
         C 12,126 20,104 19,82
         L 15,60
         Z"
      fill="url(#nibMetal)"
    />

    <!-- Engraved Decorative Border on Nib -->
    <path
      d="M -11,68
         L -13,84
         C -14,100 -8,118 0,136
         C 8,118 14,100 13,84
         L 11,68
         Z"
      fill="none"
      stroke="#64748b"
      stroke-width="1.5"
      stroke-opacity="0.45"
    />

    <!-- Circular Breather Hole -->
    <circle cx="0" cy="102" r="3.8" fill="#0f172a" />

    <!-- Nib Slit (Running from Breather Hole to Nib Tip) -->
    <line x1="0" y1="106" x2="0" y2="154" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" />

    <!-- Specular Highlight on Nib Tip -->
    <circle cx="0" cy="154" r="1.6" fill="#ffffff" />
  </g>

  <!-- Wet Ink Reflection Dot at the Pen Tip -->
  <circle cx="236" cy="302" r="3.2" fill="#3b82f6" opacity="0.95" filter="url(#inkGlow)" />
</svg>`;

async function buildIcon() {
  const publicDir = path.resolve(__dirname, '../public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  const pngPath = path.join(publicDir, 'app-icon.png');
  const icoPath = path.join(publicDir, 'app-icon.ico');

  // Save SVG
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Saved favicon.svg');

  // Render to 512x512 PNG using Playwright
  console.log('Rendering 512x512 PNG via Playwright Edge/Chromium...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

  const base64Svg = Buffer.from(svgContent).toString('base64');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
          img { width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        <img src="data:image/svg+xml;base64,${base64Svg}" />
      </body>
    </html>
  `);

  await page.waitForTimeout(400);
  await page.screenshot({ path: pngPath, omitBackground: true });
  await browser.close();
  console.log('Saved app-icon.png (512x512)');

  // Convert PNG to Windows ICO using PowerShell script file
  console.log('Generating Windows app-icon.ico (256x256)...');
  const tempPs1 = path.join(publicDir, 'temp_ico.ps1');
  const psCode = `Add-Type -AssemblyName System.Drawing
$png = [System.Drawing.Bitmap]::FromFile('${pngPath.replace(/'/g, "''")}')
$thumb = New-Object System.Drawing.Bitmap $png, 256, 256
$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream '${icoPath.replace(/'/g, "''")}', ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$thumb.Dispose()
$png.Dispose()
`;
  fs.writeFileSync(tempPs1, psCode, 'utf8');
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);
  }
  console.log('Generated app-icon.ico successfully');
}

buildIcon().catch(console.error);
