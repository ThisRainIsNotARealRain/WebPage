# RealRain Website

非雨（RealRain）的中英文公司官网（`realrain.co`）。

非雨是面向开放创作的 IP 商业化发行平台：以消费品为出版媒介，连接 IP 方、创作者、生产方与消费者，运营线上平台交汇地（Crossroads，`realrain.art`）。中文首页位于 `/`，英文版位于 `/en/`。

**改结构前先读 `BRAND.md`，改实现前读 `DESIGN.md`。**

## 本地预览

项目是无构建步骤的静态站点。请使用任意静态文件服务器预览，例如：

```bash
npx --yes serve -l 8080 .
```

然后访问 `http://localhost:8080/`。

## 结构

- `index.html`：中文首页（六屏全视口吸附章节架构）
- `en/index.html`：英文首页
- `css/styles.css`：全视口强制吸附（`100dvh` + `scroll-snap-type: y mandatory`）、三极明暗高反差画布、`Noto Serif SC` 衬线主标题、横向拖拽轨道及全尺寸响应式布局
- `js/main.js`：封面交互雨景与水面波纹画布、右缘可拖拽章节标尺、弹簧惯性横向拖拽轨道与样本柜、微磁吸交互及全屏移动抽屉
- `assets/fonts/`：自托管中文展示衬线与正文无衬线子集（`noto-serif-sc-600.woff2`、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/logo/`：官方雕刻矢量标准字（`realrain-wordmark-light.svg`、`realrain-wordmark-dark.svg`）及徽标图标
- `assets/media/editions/`：交汇地工房及实体样本图（只在第 3 屏交汇地样本柜陈列，不置于封面）
- `assets/media/art/`：纯品牌氛围 Open Graph 分享图（`realrain-og.jpg`）
- `tools/`：`prepare-media.py`、`build-fonts.py` 与 `render-og.cjs`
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了任何中文文案后需重跑 `python tools/build-fonts.py`**。

## 发布

站点不依赖前端构建器，推送至 GitHub `main` 分支后自动同步发布至 `realrain.co`。
