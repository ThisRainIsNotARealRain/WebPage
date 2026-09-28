// Render the site's illustrations from their SVG sources with headless Chrome.
// Each output is drawn at its own scale, so no raster is resampled.
//
//   node tools/render-art.cjs <png-out-dir>
//   python tools/export-art.py <png-out-dir>
//
// Needs playwright-core and a local Chrome. Paths can be overridden with
// PLAYWRIGHT_CORE and CHROME_PATH.
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE ||
    "C:/Users/BeichenXu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core"
);

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "art.json"), "utf8"));
const outDir = path.resolve(process.argv[2] || "art-png");

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--allow-file-access-from-files"]
  });

  for (const art of config.art) {
    const url = pathToFileURL(path.join(config.sourceRoot, art.source)).href;
    for (const output of art.outputs) {
      const [x, y, w, h] = output.box;
      const scale = output.width / w;
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      await page.waitForTimeout(500);
      const file = path.join(outDir, `${art.name}-${output.suffix}.png`);
      await page.screenshot({ path: file, clip: { x, y, width: w, height: h } });
      await page.close();
      console.log("rendered", path.basename(file));
    }
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
