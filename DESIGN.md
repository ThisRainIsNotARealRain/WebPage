# RealRain 官网设计与内容基线

> **内容与事实基线：非雨（RealRain）连接数字想象与物理现实，以多模态智能、可编程权利契约与柔性造物网络贯通三条核心产品主线——交汇之地 Crossroads（`realrain.art`）、造物工房 Merch Kodo 与 ACG Daily；唯一最优先愿景为 `Hack to the Wonderland`，团队与顾问事实对齐 `RealRain_BP_v39_2026-11-16`。**

## 去框化画廊秩序与流体物理交互体系

1. **去工业框与高定排印秩序**：彻底移除沉重圆角灰框（`.glass-monolith`）与窗口伪壳（`.window-chrome`），改以烟熏曜石矿石雾气上浮现的 `1px` 极细水平滑轨、渐变垂直发丝分隔线与开放顶部发丝栏位组织空间；配色保持骨瓷白 `#F4F3EF`、暖灰石 `#A1A09C`、钛灰 `#6E6E6A`、雨青 `#8CA29B` 与轻量 `Noto Serif SC wght=460`。
2. **流体雨水导航链（`#rainRailCanvas`）与 60/120fps 引擎**：
   - **右缘液态雨丝轨 `#rainRailCanvas`**：在竖直渐变雨丝上持续落下的银青色微雨流，滚屏水滴珠随 `scrollY` 连续平滑滑动并依速度拉伸水滴形态，停靠章节时荡出细微同心水波，点击采用可打断的 `360ms` 四次缓出顺滑滚屏；
   - **第 1 幕 `#top`**：桌面全视口光标朝向追踪、移动端雕塑居上的 `3D` 点阵球体（`#orbCanvas`，`touch-action: none` 配 1:1 非反向纵向拖曳、指数平滑惯性，以及无桌面指针时柔和的自主呼吸微摆与流光高光）＋ 针对竖屏比例进行横向展宽与暗角柔化补偿的全屏 WebGL 烟熏矿石水流（`#glCanvas`），配合清晰垂直下落的雨滴下滑指引（`.scroll-drop-line::after`），零标题位移；移动端采用对称 `20px` 页边距、双列等宽主按钮及右侧 `12px` 轻量化被动细雨进度线；
   - **第 2 幕 `#what`（Layer 1：集团共享底座，开放三联排版）**：桌面端固定三等分无框栏位完整呈现 **可编程权利与账户底座**、**多模态审美与创作引擎**、**柔性实体造物网络**（静止常态下标题保持高对比清晰度并随桌面悬停或点击移动顶部 `1px` 高光光束，移除虚假可点手型，所有 `h3` 标题保持 `0px` 纵向零位移）；平板与移动端取消手风琴隐藏，三段文字全部直接展开呈现并适配 `<=700px` 矮屏防裁切；
   - **顶栏品牌标识 `.header-brand`**：采用小尺寸光学调优反白矢量点阵（`realrain-logo-rain-celadon-small-reverse.svg`，紧收 `viewBox="1.65 1.65 14.7 14.7"` 与原生内联 `<svg>`）配定比矢量标准字，消除固定定位与亚像素缩小导致的边缘发虚；
   - **第 3 幕 `#platform`（Layer 2：三大核心产品主线 3D 舞台）**：去除低层 SKU 单品卡片，仅呈现平级 **交汇之地 Crossroads**（`crossroads-ui.webp`）、**造物工房 Merch Kodo**（`merch-kodo-ui.webp`）与 **ACG Daily**（`acg-daily-ui.webp`）三块实景界面版面；采用解析 **二阶临界阻尼谐振子**（`zeta=1.0`，桌面 `omega=20.5` / 手机 `omega=14.0`）与纯 GPU `transform` + `opacity` 合成（居中卡 `z=0, scale=1` 原生清晰渲染，入场支持首次自然滚屏微倾归位，桌面两侧 `120°` 露边卡片支持悬停微亮与直接点击直转居中，无 `backdrop-filter` / `filter` 卡顿）；手机端（`<=640px`）采用全出血 `100vw` 3D 轮播舞台配 `min(74vw, 294px)` 主卡，左右相邻产品页边缘稳定各露边约 `50px` 可直接点击切卡，跟手拖拽标尺按 `66%` 视口等比调阻，每次轻扫严格限切 1 卡片；底部采用居中滑动胶囊分段控制器（`#stageTabBar` + 编号 `01/02/03` + `#stageTabThumb`）配下置独立文本外链，交互信号一目了然；
   - **渲染、网络与国内首屏加载性能基线**：`#glCanvas` 渲染缓冲限宽 `640px` 并将 2 层 `fbm`、竖屏视角补偿与暗角噪点合入单次片元着色，移除全屏 `.optical-grain` / `.ambient-vignette` 与页头/按钮 `backdrop-filter`；`#orbCanvas` 与 `#rainRailCanvas` 缓存布局几何、预分配对象池并支持空闲 `30fps` 节流与 `visibilitychange` 休眠；全面移除 `fonts.googleapis.com` 外部请求（自托管 `Cormorant Garamond` 并将中文字体按标题衬线 / 控件中字重 / 正文常规精准拆分子集），内联压缩 CSS 与 `<script type="module">` 延迟 JS 实现零阻塞首屏出画（FCP），移动抽屉与页脚通过 SVG `<use>` 零请求复用标志，采用 `6KB` `favicon-64.png`、第 3 屏 `fetchpriority="low"`、Cloudflare `<!--email_off-->` 及 `_headers` 一年 `immutable` 缓存；
   - **第 4 幕 `#team`（开放顶部发丝栏位 / 移动端显式折叠手风琴）**：桌面端无框三栏全展开人物栏位配无边框顾问名录（无交互假象）；移动端（`<=960px`）每行创始团队卡片右侧配有圆形 `+` / `−` 显式折叠圆钮（`.person-toggle`，同步 `aria-expanded` 与键盘 `Enter`/`Space` 支持），清晰传达点击展开，并下承双顾问全宽名录；
   - **第 5 幕 `#contact`**：章节 GPU 入场微动效（保持 `#whatTriptych` 与 `#top h1` 零位移）、`Hack to the Wonderland` 唯一愿景收束，以及移动端左对齐双层页脚落款。

## 红线

- 非雨 RealRain 是高于单一产品线的母品牌与创作基础设施公司；文案保持官网正大气象，不使用“旗下社区”“旗下平台”等从属化表述。
- 层级与边界严守 `Overview/docs/architecture.md`：第 2 幕只讲共享底座（账户权限、创作运行时、柔性制造），第 3 幕只列平级三条产品主线——交汇之地 Crossroads（消费与共创）、造物工房 Merch Kodo（商家、开发与多渠道发行）、ACG Daily（个人日报、图鉴与可编程媒体），不把具体周边 SKU 混入产品主线矩阵，也不宣传已搁置的版权交易市场。
- 团队简介聚焦核心实力（不含《Physics Education》）；顾问不包含已替换成员；零破折号（全文零 `——`/`—`，包括内联 SVG）、零内部世界观词汇、零保密融资数字；`@font-face` 版本后缀与 HTML 严格同步（当前 `?v=20261119-8`）。
