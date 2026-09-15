# RealRain Website

RealRain / 非雨文化科技的中英文品牌官网。

非雨是面向开放创作的 IP 商业化发行平台：IP 出版平台，做实体商业化出版。站点讲清三件事：消费品怎样成为出版媒介、四个产品、四种合作。中文首页位于 `/`，英文版位于 `/en/`。

**改结构前先读 `BRAND.md`（放什么、为什么），改实现前读 `DESIGN.md`（怎么做、踩过的坑）。**事实基线是 2026-09-12 公司介绍；BP 中的融资、分成区间与经营数字不上官网。

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
- `js/main.js`：移动导航、滚动状态、视口动效、视差与指针交互
- `assets/media/`：主视觉与产品界面截图
- `assets/logo/`：品牌标志
- `BRAND.md`：品牌定位、平台逻辑、信息层级与站点结构
- `DESIGN.md`：内容、设计与维护说明
- `THIRD_PARTY_NOTICES.md`：开源前端依赖

## 发布

站点不依赖 Node.js 或打包器，可直接发布到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态托管服务。
