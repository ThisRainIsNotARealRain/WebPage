# RealRain Website

非雨（RealRain）中英文官网（`realrain.co`），围绕清晰业务表达与核心团队（`RealRain BP v39` 对齐）构建，唯一最高愿景：**Hack to the Wonderland**。

非雨以 AI 连接正版 IP、创作者与实体周边发行，旗下运营 **交汇之地（Crossroads，`realrain.art`）**，将喜爱的角色与灵感变成触手可及的日常实物。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

```bash
npx --yes serve -l 8080 .
```

访问 `http://localhost:8080/`。

## 结构

- `index.html`、`en/index.html`：五幕全视口吸附（`100dvh`）品牌体验页（封面 / 建筑三联画展开 / 交汇之地 360° 点击即转三维展台 / 近距边光团队单块 / 唯一愿景 Hack to the Wonderland）
- `css/styles.css`：Obsidian & Smoked Mineral 顶部受光无边框设计系统、近距 `1px` 边光照射（`.proximity-rim`）、几何矢量纹样与全尺寸响应式适配
- `js/main.js`：全屏 WebGL 烟熏曜石极光（`#glCanvas`）、低扰动 3D 品牌点阵雕塑（`#orbCanvas`）、动态扩展三联画引擎（`initWhatTriptych`）、单调临界阻尼（零过冲零晃动）点击优先 3D 转盘引擎（`initTurntableStage`）与移动端卡片组
- `assets/fonts/`：自托管轻量中文展示衬线与正文无衬线子集（`noto-serif-sc-500.woff2` [wght=460]、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/media/editions/`：交汇之地实机及同源器物展示图
- `assets/media/art/realrain-og.jpg`：由 `tools/render-og.cjs` 渲染的 OG 封面图
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了中文文案后需重跑 `python tools/build-fonts.py`**。

## 发布

静态站无构建器，推送 `main` 后由 Cloudflare Pages 自动同步发布。
