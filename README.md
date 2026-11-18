# RealRain Website

非雨（RealRain）的中英文公司官网（`realrain.co`）。

非雨是面向开放创作的 IP 商业化发行平台：以实体消费品为出版媒介，连接 IP 方、创作者、生产方与消费者，运营线上平台交汇地（Crossroads，`realrain.art`）。中文首页位于 `/`，英文版位于 `/en/`。

**改结构前先读 `BRAND.md`，改实现前读 `DESIGN.md`。** 事实基线保留 2026-09-23 公司介绍与团队/顾问履历；BP 中的保密经营、分成与融资数字不上官网。

## 本地预览

项目是无构建步骤的静态站点。请使用任意静态文件服务器预览，例如：

```bash
npx --yes serve -l 8080 .
```

然后访问 `http://localhost:8080/`。

## 结构

- `index.html`：中文首页
- `en/index.html`：英文首页
- `css/styles.css`：画廊级博物馆专辑排版系统（Obsidian Dark / Alabaster White / Warm Celadon Stone 三种极性画布交替、Serif 衬线标题层级与全响应式适配）
- `js/main.js`：随滚动极性切换的矢量页头、首屏实体周边展台 3 切页（支持键盘方向键）、全屏移动端抽屉导航、轻量入场动画与语言偏好 Cookie 记忆
- `assets/fonts/`：自托管中文展示衬线与正文无衬线子集（`noto-serif-sc-600.woff2`、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/logo/`：官方矢量雕刻标准字（`realrain-wordmark-light.svg`、`realrain-wordmark-dark.svg`）及徽标图标
- `assets/media/editions/`：经严格裁切与去背景处理的一手原创作品《霏霏》周边实拍与交汇地工坊展台图（双闪吧唧、典藏透卡、异形立牌、原画及无世界观干扰词的工坊工作台截图）
- `assets/media/art/`：Open Graph 品牌分享图（`realrain-og.jpg`；历史插画文件保留于目录中以避免外部旧引用失效）
- `tools/`：`prepare-media.py`（一手素材精裁与透明蒙版导出）、`build-fonts.py`（中文字体子集生成）与 `render-og.cjs`（OG 分享图渲染）
- `BRAND.md`：品牌定位、信息层级、站点结构与对外红线
- `DESIGN.md`：视觉规范、排版系统、国内网络保障与验收清单
- `THIRD_PARTY_NOTICES.md`：开源依赖与字体授权

**改了中文文案后需重跑 `python tools/build-fonts.py`**，以确保新出现的汉字纳入自托管子集。

## 发布

站点不依赖 Node.js 或前端打包器。推送至 GitHub `main` 分支后，Cloudflare 自动同步并发布至 `realrain.co`。
