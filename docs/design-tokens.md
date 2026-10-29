# 设计系统基准

本文档是 `base.html`（v22）设计 token 的提取参考。实现以 `base.html` 为准，本文档随其同步更新；组件化时先落地 tokens，再写组件。

## 色板

| Token | 值 | 用途 |
|---|---|---|
| `cyber-bg` | `#05060a` | 页面底色 |
| `cyber-panel` | `#0c0e17` | 面板一级 |
| `cyber-panel2` | `#0f1220` | 面板二级 |
| `cyber-panel3` | `#131728` | 面板三级 |
| `cyber-line` | `#191d2c` | 边框 |
| `cyber-line2` | `#252b3f` | 边框高亮 |
| `cyber-text` | `#c4ccd8` | 正文 |
| `cyber-dim` | `#5a6379` | 次要文字 |
| `cyber-dim2` | `#343b4e` | 最弱文字 |
| `cyber-cyan` | `#00f0ff` | 主强调色 |
| `cyber-magenta` | `#ff2e88` | 次强调 / MIXED 许可 |
| `cyber-lime` | `#c6ff00` | 免费商用 |
| `cyber-amber` | `#ffb800` | CC-BY |
| `cyber-gold` | `#ffd166` | 提示 |
| `cyber-violet` | `#a78bfa` | 装饰 |
| `cyber-danger` | `#ff3333` | 危险操作 |

发光阴影：`shadow-cyber-cyan` / `shadow-cyber-lime` / `shadow-cyber-magenta`（外发光 + 内高光，见 tailwind.config 段）。

## 字体

- 展示：`Chakra Petch`（system-ui 兜底）
- 等宽：`JetBrains Mono`（标签、快捷键、徽章）

## 许可配色映射

卡片悬停边框 / 发光随 `data-lic` 变色：

| `data-lic` | 颜色 |
|---|---|
| `free-commercial` | lime |
| `cc-by` | amber |
| `mixed` | magenta |
| 默认 | cyan |

## 标志性视觉

| 元素 | 实现 |
|---|---|
| 网格地板 | `.grid-floor`：perspective 旋转 + mask 渐隐 |
| 氛围光斑 | `.glow-orb`（cyan / pink） |
| 噪点 | `.noise`：SVG feTurbulence，overlay 混合 |
| 扫描线 | `body::after`：repeating-linear-gradient |
| glitch 标题 | `.title-glitch`：双层 clip-path 错位动画 |
| 卡片角标 | `.cyber-card::before/::after`：对角边框，悬停显现 |
| 卡片聚光灯 | `.card-spotlight`：跟随鼠标的 radial-gradient |
| 搜索高亮 | `mark.hl`：cyan 底色 + 下划线 |

完整 CSS 见 `base.html` `<style>` 段；动画参数（时长、缓动 `cubic-bezier(.22,.68,.32,1)`）不得擅改。
