// Render the Atmospheric Rain Cover Open Graph image (1200x630) with headless Chrome.
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

// Generate subtle SVG diagonal rain threads & elliptical water horizon ripples
const RAIN_SVG = `
<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="h-glow" cx="72%" cy="68%" r="52%">
      <stop offset="0%" stop-color="#708F88" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#708F88" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#090B0A" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#h-glow)" />
  <g stroke="#B6CEC8" stroke-width="1" stroke-linecap="round">
    <line x1="780" y1="60" x2="770" y2="128" stroke-opacity="0.16" />
    <line x1="840" y1="110" x2="828" y2="195" stroke-opacity="0.24" />
    <line x1="910" y1="40" x2="900" y2="112" stroke-opacity="0.14" />
    <line x1="965" y1="160" x2="950" y2="260" stroke-opacity="0.28" />
    <line x1="1030" y1="88" x2="1018" y2="178" stroke-opacity="0.18" />
    <line x1="1095" y1="145" x2="1082" y2="235" stroke-opacity="0.22" />
    <line x1="1140" y1="70" x2="1130" y2="142" stroke-opacity="0.14" />
    <line x1="720" y1="220" x2="708" y2="310" stroke-opacity="0.18" />
    <line x1="875" y1="255" x2="862" y2="352" stroke-opacity="0.26" />
    <line x1="1008" y1="290" x2="996" y2="375" stroke-opacity="0.2" />
    <line x1="1120" y1="280" x2="1108" y2="365" stroke-opacity="0.16" />
    <line x1="650" y1="140" x2="641" y2="205" stroke-opacity="0.12" />
  </g>
  <g fill="none" stroke="#A2BEB7">
    <ellipse cx="900" cy="458" rx="92" ry="22" stroke-opacity="0.28" stroke-width="1" />
    <ellipse cx="900" cy="458" rx="164" ry="39" stroke-opacity="0.14" stroke-width="1" />
    <ellipse cx="1040" cy="492" rx="64" ry="15" stroke-opacity="0.2" stroke-width="1" />
  </g>
</svg>`;

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
    background: #090B0A;
    color: #F5F6F4;
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
    background: #090B0A;
  }
  .rain-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .rain-layer svg {
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.11);
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
    color: #A2BEB7;
    letter-spacing: 0.08em;
  }
  .domain {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 14px;
    letter-spacing: 0.14em;
    color: #9BA39E;
  }
  .center {
    max-width: 780px;
  }
  .seal {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 13px;
    letter-spacing: 0.2em;
    color: #A2BEB7;
    margin-bottom: 18px;
  }
  h1 {
    font-family: "RealRain Serif SC", Georgia, serif;
    font-size: 64px;
    font-weight: 600;
    line-height: 1.16;
    letter-spacing: -0.02em;
    color: #F5F6F4;
  }
  .sub {
    margin-top: 22px;
    font-size: 20px;
    color: #9BA39E;
  }
  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 22px;
    border-top: 1px solid rgba(255, 255, 255, 0.11);
    font-size: 15px;
    color: #9BA39E;
  }
  .bottom b {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: #A2BEB7;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="rain-layer">${RAIN_SVG}</div>
    <div class="top">
      <div class="brand">
        <span class="emblem">${EMBLEM_SVG}</span>
        <span class="wordmark">${WORDMARK_SVG}</span>
        <span class="brand-cn">非雨</span>
      </div>
      <div class="domain">REALRAIN.CO</div>
    </div>
    <div class="center">
      <div class="seal">非雨 · REALRAIN</div>
      <h1>让想象世界，<br>进入现实生活。</h1>
      <p class="sub">面向开放创作的 IP 实体出版平台 · realrain.art</p>
    </div>
    <div class="bottom">
      <span>Hack to the Wonderland</span>
      <b>CROSSROADS · REALRAIN.ART ↗</b>
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
