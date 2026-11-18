// Render the Dark-Crystal Generative Commerce Open Graph image (1200x630).
//
//   node tools/render-og.cjs
const fs = require("fs");
const path = require("path");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE ||
    "C:/Users/BeichenXu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core"
);

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "assets", "media", "art", "realrain-og.jpg");

function readDataUri(relPath, mime) {
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const EMBLEM_SVG = fs
  .readFileSync(path.join(ROOT, "assets", "logo", "realrain-logo-rain-celadon-reverse.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/i, "");
const WORDMARK_SVG = fs
  .readFileSync(path.join(ROOT, "assets", "logo", "realrain-wordmark-light.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/i, "");

const SERIF_FONT = readDataUri("assets/fonts/noto-serif-sc-600.woff2", "font/woff2");
const SANS_FONT = readDataUri("assets/fonts/noto-sans-sc-400.woff2", "font/woff2");

// Parametric 3D dot-wave SVG sculpture matching #orbCanvas
function buildDotWaveSvg() {
  const dots = [];
  const cx = 960;
  const cy = 320;
  const radius = 195;
  const rotY = -0.32;
  const rotX = 0.24;
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  for (let r = 0; r < 19; r++) {
    for (let c = 0; c < 19; c++) {
      const nx = (c - 9) / 9;
      const ny = (r - 9) / 9;
      const dist = Math.hypot(nx, ny);
      if (dist <= 1.02) {
        const baseR = Math.max(0.18, 1.0 - dist * 0.72);
        const wave = Math.sin(dist * 6.4) * 0.12;
        const nz = Math.sqrt(Math.max(0, 1 - dist * dist * 0.65)) * 0.42 + wave;

        const x1 = nx * cosY + nz * sinY;
        const z1 = -nx * sinY + nz * cosY;
        const y2 = ny * cosX - z1 * sinX;
        const z2 = ny * sinX + z1 * cosX;

        const persp = 2.6 / (2.6 - z2);
        const sx = (cx + x1 * radius * persp).toFixed(1);
        const sy = (cy + y2 * radius * persp).toFixed(1);
        const rad = Math.max(0.8, baseR * radius * 0.032 * persp).toFixed(2);
        const alpha = Math.min(0.95, Math.max(0.18, (0.45 + z2 * 0.55) * baseR)).toFixed(3);
        const mix = Math.max(0, Math.min(1, z2 + 0.4));
        const cr = Math.round(112 + mix * 110);
        const cg = Math.round(143 + mix * 98);
        const cb = Math.round(136 + mix * 96);
        dots.push(`<circle cx="${sx}" cy="${sy}" r="${rad}" fill="rgb(${cr},${cg},${cb})" fill-opacity="${alpha}" />`);
      }
    }
  }
  return `
    <svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="orb-halo" cx="80%" cy="51%" r="40%">
          <stop offset="0%" stop-color="#A4C8BF" stop-opacity="0.22" />
          <stop offset="55%" stop-color="#708F88" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#040606" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="aurora" cx="24%" cy="80%" r="55%">
          <stop offset="0%" stop-color="#1E3934" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#040606" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#aurora)" />
      <rect width="1200" height="630" fill="url(#orb-halo)" />
      ${dots.join("\n")}
    </svg>`;
}

const ORB_SVG = buildDotWaveSvg();

const HTML = `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "RealRain Serif SC";
    src: url("${SERIF_FONT}") format("woff2");
    font-weight: 600;
  }
  @font-face {
    font-family: "RealRain Sans SC";
    src: url("${SANS_FONT}") format("woff2");
    font-weight: 400;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #040606;
    color: #F6F8F6;
    font-family: "RealRain Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame {
    position: relative;
    width: 1200px;
    height: 630px;
    padding: 52px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #040606;
  }
  .bg-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .bg-layer svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .top, .center, .bottom {
    position: relative;
    z-index: 2;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brand .emblem svg { width: 24px; height: 24px; display: block; }
  .brand .wordmark svg { height: 24px; width: auto; display: block; }
  .brand-cn {
    padding-left: 16px;
    border-left: 1px solid rgba(255, 255, 255, 0.22);
    font-size: 16px;
    color: #A4C8BF;
    letter-spacing: 0.08em;
  }
  .domain {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 14px;
    letter-spacing: 0.14em;
    color: #98A39D;
  }
  .center {
    max-width: 720px;
  }
  .seal {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 13px;
    letter-spacing: 0.18em;
    color: #A4C8BF;
    margin-bottom: 18px;
  }
  h1 {
    font-family: "RealRain Serif SC", Georgia, serif;
    font-size: 62px;
    font-weight: 600;
    line-height: 1.16;
    letter-spacing: -0.02em;
    color: #F6F8F6;
  }
  .sub {
    margin-top: 20px;
    font-size: 20px;
    color: #98A39D;
  }
  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 22px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 15px;
    color: #98A39D;
  }
  .bottom b {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: #A4C8BF;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="bg-layer">${ORB_SVG}</div>
    <div class="top">
      <div class="brand">
        <span class="emblem">${EMBLEM_SVG}</span>
        <span class="wordmark">${WORDMARK_SVG}</span>
        <span class="brand-cn">非雨</span>
      </div>
      <div class="domain">REALRAIN.CO</div>
    </div>
    <div class="center">
      <div class="seal">非雨 · 生成式消费平台</div>
      <h1>让想象世界，<br>进入现实生活。</h1>
      <p class="sub">交汇之地 Crossroads × 造物工坊 Workshop · realrain.art</p>
    </div>
    <div class="bottom">
      <span>Hack to the Wonderland</span>
      <b>REALRAIN.ART ↗</b>
    </div>
  </div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(HTML, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: TARGET, type: "jpeg", quality: 92 });
    console.log("rendered", path.relative(ROOT, TARGET));
  } finally {
    await browser.close();
  }
})();
