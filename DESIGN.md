# RealRain 官网设计与内容基线

> **内容与事实基线：非雨（RealRain）连接数字想象与物理现实，以多模态智能、可编程权利契约与柔性造物网络贯通三条核心产品主线——交汇之地 Crossroads（`realrain.art`）、造物工房 Merch Kodo 与 ACG Daily；唯一最优先愿景为 `Hack to the Wonderland`，团队与顾问事实对齐 `RealRain_BP_v39_2026-11-16`。**

## 去框化画廊秩序与流体物理交互体系

1. **去工业框与高定排印秩序**：彻底移除沉重圆角灰框（`.glass-monolith`）与窗口伪壳（`.window-chrome`），改以烟熏曜石矿石雾气上浮现的 `1px` 极细水平滑轨、渐变垂直发丝分隔线与开放顶部发丝栏位组织空间；配色保持骨瓷白 `#F4F3EF`、暖灰石 `#A1A09C`、钛灰 `#6E6E6A`、雨青 `#8CA29B` 与轻量 `Noto Serif SC wght=460`。
2. **流体雨水导航链（`#rainRailCanvas`）与 60/120fps 引擎**：
   - **右缘液态雨丝轨 `#rainRailCanvas`**：在竖直渐变雨丝上持续落下的银青色微雨流，滚屏水滴珠随 `scrollY` 连续平滑滑动并依速度拉伸水滴形态，停靠章节时荡出细微同心水波，点击采用可打断的 `360ms` 四次缓出顺滑滚屏；
   - **第 1 幕 `#top`**：桌面全视口光标朝向追踪、移动端雕塑居上的 `3D` 点阵球体（`#orbCanvas`，`touch-action: none` 配 1:1 非反向纵向拖曳与指数平滑惯性）＋ 全屏 WebGL 烟熏矿石水流（`#glCanvas`），零标题位移；
   - **第 2 幕 `#what`（Layer 1：集团共享底座，无框三栏 / 移动端发丝手风琴）**：桌面端固定三等分栏位展示 **可编程权利与账户底座**、**多模态审美与创作引擎**、**柔性实体造物网络**（顶部滑动两端羽化 `1px` 高光光束，所有 `h3` 标题保持 `0px` 纵向零位移）；移动端取消横向滑框、标签栏与矩形焦点选中框，改以全可见三行极细发丝垂直手风琴直击展开；
   - **顶栏品牌标识 `.header-brand`**：采用小尺寸光学调优反白矢量点阵（`realrain-logo-rain-celadon-small-reverse.svg`，紧收 `viewBox="1.65 1.65 14.7 14.7"` 与原生内联 `<svg>`）配定比矢量标准字，消除固定定位与亚像素缩小导致的边缘发虚；
   - **第 3 幕 `#platform`（Layer 2：三大核心产品主线 3D 舞台）**：去除低层 SKU 单品卡片，仅呈现平级 **交汇之地 Crossroads**（`crossroads-ui.webp`）、**造物工房 Merch Kodo**（`merch-kodo-ui.webp`）与 **ACG Daily**（`acg-daily-ui.webp`）三块实景界面版面；采用解析 **二阶临界阻尼谐振子**（`zeta=1.0, omega=21`）与纯 GPU `transform` + `opacity` 合成（居中卡 `z=0, scale=1` 原生清晰渲染，两侧 `120°` 露边卡片支持直接点击直转居中，无 `backdrop-filter` / `filter` 卡顿）；
   - **渲染与合成器性能基线**：`#glCanvas` 渲染缓冲限宽 `640px` 并将 2 层 `fbm` 与暗角噪点合入单次片元着色，移除全屏 `.optical-grain` / `.ambient-vignette` 与页头 `backdrop-filter`；`#orbCanvas` 与 `#rainRailCanvas` 缓存布局几何、预分配对象池、改用 JS 属性记录状态并支持空闲 `30fps` 节流与 `visibilitychange` 休眠；
   - **第 4 幕 `#team`（开放顶部发丝栏位）**：无框顶线人物栏位配无边框顾问名录，手机端平滑横滑；
   - **第 5 幕 `#contact`**：`Hack to the Wonderland` 唯一愿景收束与联系落款。

## 红线

- 非雨 RealRain 是高于单一产品线的母品牌与创作基础设施公司；文案保持官网正大气象，不使用“旗下社区”“旗下平台”等从属化表述。
- 层级与边界严守 `Overview/docs/architecture.md`：第 2 幕只讲共享底座（账户权限、创作运行时、柔性制造），第 3 幕只列平级三条产品主线——交汇之地 Crossroads（消费与共创）、造物工房 Merch Kodo（商家、开发与多渠道发行）、ACG Daily（个人日报、图鉴与可编程媒体），不把具体周边 SKU 混入产品主线矩阵，也不宣传已搁置的版权交易市场。
- 团队简介聚焦核心实力（不含《Physics Education》）；顾问不包含已替换成员；零破折号（全文零 `——`/`—`，包括内联 SVG）、零内部世界观词汇、零保密融资数字；`@font-face` 版本后缀与 HTML 严格同步（当前 `?v=20261119-4`）。
