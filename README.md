# RealRain Website

非雨（RealRain）中英文官网（`realrain.co`），与 `RealRain BP v39`（2026-11-16 生成式消费平台）对齐。

非雨通过旗下 **交汇之地（Crossroads，`realrain.art`）** 与 **造物工坊（Workshop）**，以偏好理解、模仿演绎与可编程媒介，将想象世界直接编译为真实消费器物。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

```bash
npx --yes serve -l 8080 .
```

访问 `http://localhost:8080/`。

## 结构

- `index.html`、`en/index.html`：五幕全视口吸附（`100dvh`）品牌体验页
- `css/styles.css`：Dark-Crystal 深曜石毛玻璃设计系统、Specular 边框高光、3D 景深展台与全尺寸响应式适配
- `js/main.js`：全屏 WebGL 体积极光水波 Shader（`#glCanvas`）、官方 19×19 点阵演化 3D 球形雕塑（`#orbCanvas`）、三维透视轮播 `#stageDeck`、指针聚光灯与 3D 倾斜交互
- `assets/fonts/`：自托管中文展示衬线与正文无衬线子集（`noto-serif-sc-600.woff2`、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/logo/`：官方矢量标准字与雨青点阵徽标
- `assets/media/editions/`：交汇之地实机及同源器物展示图
- `assets/media/art/realrain-og.jpg`：由 `tools/render-og.cjs` 渲染的 OG 封面图
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了中文文案后需重跑 `python tools/build-fonts.py`**。

## 发布

静态站无构建器，推送 `main` 后由 Cloudflare Pages 自动同步发布。
