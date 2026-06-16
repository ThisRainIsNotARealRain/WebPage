# 非雨文化科技 · 官网设计文档

> **文档性质**：公司业务介绍 / 品牌展示页，**非** SaaS 转化页、**非** 融资路演网页化。  
> **主叙事**：*From idea to world, from world to IP.* — Rain Studio + Rain Hub 双产品线。  
> **设计技能依据**：`frontend-design`（克制、留白、玻璃卡片）、`ui-ux-pro-max`（对比度、焦点、动效与 reduced-motion）。

---

## 1. 网站定位与受众

### 1.1 我们是什么

- **对外展示窗口**：向合作方、投资人、创作者说明 Rain 在做什么、服务谁、未来要成为怎样的平台。
- **核心信息**：
  1. 面向 AI 时代内容与 IP 创作的公司
  2. 两条产品线：**Rain Studio**（动漫影像生成）与 **Rain Hub**（原创世界 / IP 管理）
  3. 帮助创作者从灵感出发，生成作品，管理原创世界，让 IP 持续衍生

### 1.2 我们不是什么

- **不是**复杂产品官网：无注册、定价、购买链路
- **不是**投资人 BP 在线版：不上线融资额、估值、财务预测等
- **不是**承制接单为主轴的旧版叙事（已改版）

### 1.3 联系

- **域名**：https://www.realrain.co  
- **邮箱**：contact@realrain.co  
- **公司注册名**：非雨文化科技 · 品牌 **Rain / RealRain**

---

## 2. 信息架构（单页 Landing Page）

| 区块 | ID | 中文导航 | 要点 |
|------|-----|----------|------|
| Hero | — | — | 主标题 EN/ZH、公司介绍、Explore Studio / Hub |
| 愿景 | `#vision` | 愿景 | Building the creative infrastructure for original IP |
| 产品 | `#products` | 产品 | Rain Studio + Rain Hub 双卡 |
| 工作流 | `#workflow` | 工作流 | Idea → Character → World → Animation → IP |
| 场景 | `#use-cases` | 场景 | OC 创作者 / IP 团队 / AI 创作者 / 合作方 |
| 预览 | `#preview` | 预览 | CSS 概念 Gallery + Concept / Preview 标注 |
| 联系 | `#contact` | 联系 | Work with Rain + 三 mailto CTA |

- **中文**：`/` — 导航：愿景 · 产品 · 工作流 · 场景 · 预览 · 联系 · EN  
- **英文**：`/en/` — 结构镜像

---

## 3. 产品与文案口径

### Rain Studio

- 定位：一键生成动漫及衍生动画的 AI 创作工具  
- 状态标签：Internal Beta  
- 对外少说技术术语，强调「把想象变成动画」

### Rain Hub

- 定位：原创世界与 IP 创作者的创作管理平台  
- 状态标签：Product Preview  
- 对 C 端少说「资产管理」，多说「原创世界工作台」「创作空间」

**禁止** PCS / PES 等内部缩写上站。

---

## 4. 视觉与设计系统（#1b7f67）

- **基调**：米白 `#fafafa` + 品牌主色 `#1b7f67` 点睛；玻璃卡片（`backdrop-filter` + 轻阴影）  
- **Hero / 产品 mock**：**纯 CSS 抽象界面**，不做多图拼接；后续可选单张图替换某一处背景  
- **避免**：赛博霓虹、紫色渐变 SaaS 模板、重暗色 AI 工具风  

### Logo 三件套

| 文件 | 用途 |
|------|------|
| Logo.png | 顶栏、favicon |
| Script.png | 页脚花字 |
| Combined.png | 保留在 assets，当前 Hero 未使用 |

### 字体

- 中文标题：`Noto Serif SC`  
- 英文标题：`Fraunces`  
- 正文 / 导航：`Noto Sans SC` + `Plus Jakarta Sans`

---

## 5. 技术与部署

- 静态站点：`index.html`、`en/index.html`、`css/styles.css`、`js/main.js`  
- 无构建步骤，可托管 Cloudflare Pages  

---

## 6. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-16 | 全面改版：Rain Studio + Rain Hub 品牌展示页；7 段式 IA；CSS 抽象视觉；更新主叙事与 DESIGN 口径 |
