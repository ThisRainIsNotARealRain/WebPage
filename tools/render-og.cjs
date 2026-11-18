// Render the Monograph Editorial Open Graph image (1200x630) with headless Chrome.
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
const BADGES_URI = readDataUri("assets/media/editions/edition-badges.webp", "image/webp");

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
    background: #0F1110;
    color: #F5F6F4;
    font-family: "RealRain Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame {
    position: relative;
    width: 1200px;
    height: 630px;
    padding: 52px 68px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background:
      radial-gradient(620px 440px at 82% 52%, rgba(112, 143, 136, 0.22), rgba(15, 17, 16, 0) 74%),
      #0F1110;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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
    color: #A1A8A4;
  }
  .body {
    display: grid;
    grid-template-columns: 1.25fr 0.9fr;
    align-items: center;
    gap: 40px;
  }
  h1 {
    font-family: "RealRain Serif SC", Georgia, serif;
    font-size: 56px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: #F5F6F4;
  }
  .sub {
    margin-top: 22px;
    font-size: 20px;
    line-height: 1.62;
    color: #A1A8A4;
  }
  .art {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .art img {
    width: 100%;
    height: auto;
    max-height: 295px;
    object-fit: contain;
  }
  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 22px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 15px;
    color: #A1A8A4;
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
    <div class="top">
      <div class="brand">
        <span class="emblem">${EMBLEM_SVG}</span>
        <span class="wordmark">${WORDMARK_SVG}</span>
        <span class="brand-cn">非雨</span>
      </div>
      <div class="domain">REALRAIN.CO</div>
    </div>
    <div class="body">
      <div>
        <h1>让想象世界，<br>进入现实生活。</h1>
        <p class="sub">面向开放创作的 IP 商业化发行平台 · 交汇地 realrain.art</p>
      </div>
      <div class="art">
        <img src="${BADGES_URI}" alt="" />
      </div>
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
