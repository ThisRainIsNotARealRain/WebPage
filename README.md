# RealRain Website

非雨（RealRain）中英文官网（`realrain.co`），围绕母公司理念架构与核心团队（`RealRain BP v39` 对齐）构建，唯一最高愿景：**Hack to the Wonderland**。

非雨致力于搭建数字想象与物理现实之间的智能与造物底座，旗下运营首个开放创作与实体周边社区 **交汇之地（Crossroads，`realrain.art`）**，让每一份热爱、角色与灵感进入现实生活。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

```bash
npx --yes serve -l 8080 .
```

访问 `http://localhost:8080/`。

## 结构

- `index.html`、`en/index.html`：五幕全视口吸附（`100dvh`）品牌体验页（公司封面与 3D 鼠标跟随雕塑 / 理念三联画 / 交汇之地 360° 直接点选展台 / 近距边光团队单块 / 唯一愿景 Hack to the Wonderland）
- `css/styles.css`：Obsidian & Smoked Mineral 顶部受光无边框设计系统、近距 `1px` 边光照射（`.proximity-rim`）、高速交互过渡（`140–220ms`）与全尺寸响应式适配
- `js/main.js`：全屏 WebGL 烟熏曜石极光（`#glCanvas`）、桌面全屏光标朝向跟随 3D 点阵雕塑（`#orbCanvas`）、纯排印动态三联画（`initWhatTriptych`）、临界阻尼（`1 - exp(-20 * dt)`）直接点选 3D 转盘引擎（`initTurntableStage`）与移动端卡片组
- `assets/fonts/`：自托管轻量中文展示衬线与正文无衬线子集（`noto-serif-sc-500.woff2` [wght=460]、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/media/editions/`：交汇之地实机及同源器物展示图
- `assets/media/art/realrain-og.jpg`：由 `tools/render-og.cjs` 渲染的 OG 封面图
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了中文文案后需重跑 `python tools/build-fonts.py`**。

## 发布

静态站无构建器，推送 `main` 后由 Cloudflare Pages 自动同步发布。
