# RealRain Website

RealRain / 非雨文化科技的中英文品牌官网。

网站以真实项目画面和产品界面说明非雨如何把故事开发、作品生产、叙事资产与跨媒介延展连接起来。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

项目是无构建步骤的静态站点。请使用任意静态文件服务器预览，例如：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080/`。

## 结构

- `index.html`：中文首页
- `en/index.html`：英文首页
- `css/styles.css`：视觉系统、响应式布局与动效状态
- `js/main.js`：导航、滚动、作品画廊、产品选项卡与指针交互
- `assets/media/`：网站使用的项目与产品视觉
- `assets/logo/`：品牌标志
- `DESIGN.md`：内容、设计与维护说明
- `THIRD_PARTY_NOTICES.md`：开源前端依赖

## 发布

站点不依赖 Node.js 或打包器，可直接发布到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态托管服务。
