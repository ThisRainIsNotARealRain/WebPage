// Render the architectural Open Graph image (1200x630) from inline HTML/SVG
// with headless Chrome.
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
const LOGO_SVG = fs
  .readFileSync(path.join(ROOT, "assets", "logo", "realrain-logo-rain-celadon-reverse.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/i, "");

const HTML = `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #111214;
    color: #ECECEE;
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame {
    position: relative;
    width: 1200px;
    height: 630px;
    padding: 58px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background:
      radial-gradient(640px 420px at 82% 24%, rgba(112, 143, 136, 0.16), transparent 72%),
      radial-gradient(480px 320px at 18% 92%, rgba(168, 189, 182, 0.08), transparent 70%),
      #111214;
  }
  .grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
    background-size: 96px 96px;
    mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, #000 35%, transparent 100%);
    pointer-events: none;
  }
  .rails {
    position: absolute;
    inset: 0 72px;
    border-inline: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }
  .watermark {
    position: absolute;
    right: -40px;
    bottom: -70px;
    width: 460px;
    height: 460px;
    opacity: 0.09;
    pointer-events: none;
  }
  .watermark svg { width: 100%; height: 100%; display: block; }
  .top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand svg { width: 42px; height: 42px; display: block; }
  .wordmark {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.16em;
    color: #ECECEE;
  }
  .cn {
    padding-left: 16px;
    border-left: 1px solid rgba(255, 255, 255, 0.18);
    font-size: 16px;
    color: #A8BDB6;
  }
  .tag {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 14px;
    letter-spacing: 0.14em;
    color: #A8BDB6;
    text-transform: uppercase;
  }
  .center {
    position: relative;
    z-index: 2;
    max-width: 880px;
  }
  .kicker {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 14px;
    letter-spacing: 0.14em;
    color: #708F88;
    text-transform: uppercase;
    margin-bottom: 22px;
  }
  h1 {
    font-size: 64px;
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.028em;
    color: #FFFFFF;
  }
  h1 span {
    color: #A8BDB6;
  }
  .sub {
    margin-top: 22px;
    font-size: 22px;
    line-height: 1.55;
    color: rgba(236, 236, 238, 0.72);
    max-width: 740px;
  }
  .bottom {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: rgba(236, 236, 238, 0.64);
  }
  .bottom b {
    color: #A8BDB6;
    font-weight: 500;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="grid"></div>
    <div class="rails"></div>
    <div class="watermark">${LOGO_SVG}</div>
    <div class="top">
      <div class="brand">
        ${LOGO_SVG}
        <span class="wordmark">REALRAIN</span>
        <span class="cn">非雨</span>
      </div>
      <div class="tag">REALRAIN.CO</div>
    </div>
    <div class="center">
      <div class="kicker">IP PUBLISHING PLATFORM</div>
      <h1>让想象世界，<br /><span>进入现实生活。</span></h1>
      <p class="sub">面向开放创作的 IP 商业化发行平台 · 交汇地 realrain.art</p>
    </div>
    <div class="bottom">
      <span>CONSUMER GOODS AS THE MEDIUM</span>
      <b>CROSSROADS ↗</b>
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
    await page.screenshot({ path: TARGET, type: "jpeg", quality: 92 });
    console.log("rendered", path.relative(ROOT, TARGET));
  } finally {
    await browser.close();
  }
})();
