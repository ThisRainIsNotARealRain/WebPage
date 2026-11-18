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
- `css/styles.css`：高反差明暗建筑风格视觉系统、响应式布局与动效状态
- `js/main.js`：移动导航抽屉、自适应页头主题、出版工作台交互切换、视口入场与光效
- `assets/fonts/`：自托管的中文界面与标题字体子集（`noto-sans-sc-400.woff2` 与 `noto-sans-sc-600.woff2`）
- `assets/media/art/`：Open Graph 品牌分享图（`realrain-og.jpg`；历史插画文件保留于目录中以避免外部旧引用失效）
- `assets/logo/`：品牌标志
- `tools/`：字库子集生成（`build-fonts.py`）、OG 图渲染（`render-og.cjs`）及历史插画导出脚本
- `BRAND.md`：品牌定位、平台逻辑、信息层级、站点结构与调研依据
- `DESIGN.md`：内容、设计、国内网络与维护说明
- `THIRD_PARTY_NOTICES.md`：开源依赖与字体授权

**改了中文文案或工作台预设属性要重跑 `python tools/build-fonts.py`**，否则新出现的字会掉回系统字体。

## 发布

站点不依赖 Node.js 或打包器。线上 realrain.co 由 Cloudflare 从本仓库发布。
