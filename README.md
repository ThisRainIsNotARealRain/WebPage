# RealRain Website

非雨（RealRain）中英文官网（`realrain.co`），围绕真实业务与核心团队（`RealRain BP v39` 对齐）构建，唯一最高愿景：**Hack to the Wonderland**。

非雨以 AI 连接正版 IP、创作者与多载体实体周边发行，旗下运营 **交汇之地（Crossroads，`realrain.art`）**，将喜爱的角色与灵感变成触手可及的日常实物。中文首页位于 `/`，英文版位于 `/en/`。

## 本地预览

```bash
npx --yes serve -l 8080 .
```

访问 `http://localhost:8080/`。

## 结构

- `index.html`、`en/index.html`：五幕全视口吸附（`100dvh`）品牌体验页（封面 / 我们在做什么 / 交汇之地光学展台 / 核心团队 / 唯一愿景 Hack to the Wonderland）
- `css/styles.css`：Dark-Crystal 深曜石毛玻璃设计系统、Specular 边框高光、光学分栏展台（景深模糊过渡 + 光扫斜束 + 多层视差）与全尺寸响应式适配
- `js/main.js`：全屏 WebGL 体积极光水波 Shader（`#glCanvas`）、官方 19×19 点阵演化 3D 球形雕塑（`#orbCanvas`）、光学交互展台 `#stageViewport`、移动端创始团队轮播、指针聚光灯与 3D 倾斜交互
- `assets/fonts/`：自托管中文展示衬线与正文无衬线子集（`noto-serif-sc-600.woff2`、`noto-sans-sc-400.woff2`、`noto-sans-sc-500.woff2`）
- `assets/logo/`：官方矢量标准字与雨青点阵徽标
- `assets/media/editions/`：交汇之地实机及同源器物展示图（含透明前景分层实物立牌、典藏卡、双闪徽章）
- `assets/media/art/realrain-og.jpg`：由 `tools/render-og.cjs` 渲染的 OG 封面图
- `BRAND.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md`

**改了中文文案后需重跑 `python tools/build-fonts.py`**。

## 发布

静态站无构建器，推送 `main` 后由 Cloudflare Pages 自动同步发布。
