# RealRain Website

RealRain / 非雨文化科技的中英文公司官网（realrain.co）。

非雨是面向开放创作的 IP 商业化发行平台：IP 出版平台，做实体商业化出版。它运营的平台是交汇地（realrain.art）。官网讲清五件事：非雨是谁、交汇地是什么、消费品怎样成为出版媒介、五项业务、团队与联系方式；产品入口常驻页头。中文首页位于 `/`，英文版位于 `/en/`。

**改结构前先读 `BRAND.md`（放什么、为什么、调研依据），改实现前读 `DESIGN.md`（怎么做、国内网络、踩过的坑）。**事实基线：公司层面是 2026-09-23 公司介绍 v21，产品层面是交汇地当前版本；BP 中的融资、分成区间与经营数字不上官网。

## 本地预览

项目是无构建步骤的静态站点。请使用任意静态文件服务器预览，例如：

```bash
npx --yes serve -l 8080 .
```

然后访问 `http://localhost:8080/`。

## 结构

- `index.html`：中文首页
- `en/index.html`：英文首页
- `css/styles.css`：视觉系统、响应式布局与动效状态
- `js/main.js`：移动导航、滚动状态、视口动效与视差
- `js/vendor/`：自托管的第三方脚本（anime.js）
- `assets/media/art/`：插画场景（由 SVG 源文件导出，来源与哈希见 `manifest.json`）
- `assets/fonts/`：自托管的中文标题字体子集
- `assets/logo/`：品牌标志
- `tools/`：插画导出（`art.json`、`render-art.cjs`、`export-art.py`）与字体子集（`build-fonts.py`）脚本，只在重新生成时用
- `BRAND.md`：品牌定位、平台逻辑、信息层级、站点结构与调研依据
- `DESIGN.md`：内容、设计、国内网络与维护说明
- `THIRD_PARTY_NOTICES.md`：开源依赖与字体授权

**改了中文文案要重跑 `python tools/build-fonts.py`**，否则新出现的字会掉回系统字体。

## 发布

站点不依赖 Node.js 或打包器。线上 realrain.co 由 Cloudflare 从本仓库发布。
