# RealRain Website

非雨（RealRain）中英文官网（`realrain.co`），围绕母公司理念架构与核心团队（`RealRain BP v39` 对齐）构建，唯一最高愿景：**Hack to the Wonderland**。

非雨连接数字想象与物理现实，以多模态智能、可编程权利契约与柔性造物网络，贯通 **交汇之地 Crossroads**（`realrain.art`）、**造物工房 Merch Kodo** 与 **ACG Daily**。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

```bash
npx --yes serve -l 8080 .
```

访问 `http://localhost:8080/`。

## 结构

- `index.html`、`en/index.html`：五幕全视口吸附（`100dvh`）品牌体验页（公司封面与 3D 鼠标跟随雕塑 / 共享底层底座三栏 / 三大核心产品主线 3D 展台 / 开放顶线团队名录 / 唯一愿景 Hack to the Wonderland）
- `css/styles.css`：Obsidian & Smoked Mineral 去工业框画廊设计系统、顶部滑动发丝光束、1:1 原生锐利 3-Plate 纯 GPU 3D 产品舞台与全尺寸响应式适配
- `js/main.js`：限宽 `640px` 2 层 `fbm` WebGL 烟熏曜石极光（`#glCanvas`）、缓存几何与空闲节流的 3D 点阵雕塑（`#orbCanvas`）、零布局抖动液态雨水导航轨（`#rainRailCanvas`）、零标题位移底座控制器（`initWhatTriptych`）与二阶临界阻尼 3 产品 3D 转盘（`initTurntableStage`）
- `assets/fonts/`：全量自托管字体子集（按角色拆分：`cormorant-garamond-500.woff2`、`noto-serif-sc-500.woff2` [wght=460]、`noto-sans-sc-500.woff2`、`noto-sans-sc-400.woff2`，零境外字体外链）
- `assets/media/editions/`：交汇之地（`crossroads-ui.webp`）、造物工房（`merch-kodo-ui.webp`）、ACG Daily（`acg-daily-ui.webp`）实机界面展示图
- `assets/media/art/realrain-og.jpg`：由 `tools/render-og.cjs` 渲染的 OG 封面图
- `_headers`：Cloudflare Pages 长期不可变静态缓存配置（`assets/*` 1 年 `immutable`，HTML `max-age=0, must-revalidate`）
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了文案、样式或脚本后运行 `python tools/build-site.py`**（自动按角色重建字体子集并向 `index.html`、`en/index.html` 内联压缩 CSS 与延迟模块 JS）。

## 发布

静态站无构建器，推送 `main` 后由 Cloudflare Pages 自动同步发布。
