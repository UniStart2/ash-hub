# AGENTS.md — AI 协作约束

面向 AI 编码助手的行为约定。工程流程见 [docs/development.md](docs/development.md)，设计细节见 [docs/design-tokens.md](docs/design-tokens.md)，本文不重复。

## 1. 项目现状

ASSET//HUB：免费游戏素材导航控制台。纯前端、无后端、数据静态、状态存 localStorage。

- `base.html`（v22）：唯一完整实现，Alpine.js + Tailwind CDN 单文件原型
- 目标栈：Vite + Vue 3（`<script setup>`）+ TypeScript + Tailwind + pnpm
- 尚无脚手架；`assets/` 素材包未接入

## 2. base.html 是最高基准

它同时是功能规格、UI/UX 基准与 design token 来源。**拆分与迭代不得违背：**

- 组件化重写须像素级保留视觉与交互；改设计单独提交并说明理由
- 迁移顺序：先抽 tokens → 再抽组件 → 最后接状态（composables，不引入全局状态库）
- localStorage 键名冻结：`ah_favs` / `ah_recent` / `ah_custom_order`
- URL hash 参数冻结：`q` / `f` / `v` / `fav`
- 站点数据结构冻结：`{ name, url, cn, desc, tags, type, license, register, alias, addedAt }`
- 快捷键表冻结：`/` `R` `G` `L` `S` `?` `Esc` `Ctrl/Cmd+K`，收拢为单一 composable

## 3. 文档职责

| 文档 | 只写什么 |
|---|---|
| `README.md` | 项目门面：简介、功能、快速开始、导航 |
| `AGENTS.md` | AI 行为约束与验证清单 |
| `docs/design-tokens.md` | 设计系统参考 |
| `docs/development.md` | 版本 / 分支 / 提交 / hooks 规范 |

单一职责、见名知意、≤230 行；超限先拆分再写。内容更新同步改对应文档，不跨文档复制段落。

## 4. LLM 使用原则

LLM 是降低重复劳动的工具，不是自动打字机：

1. **一次生成，长期复用**：tokens、schema、骨架生成后入库维护，不重复生成
2. **生成即评审**：AI 产出按正式代码标准走评审与验证，不搞"先跑起来再说"
3. **不制造噪音**：不写复述代码的注释、不预建未使用的抽象（Rule of Three）
4. **可核验**：引用、API、命令参数必须真实可验证；不确定的标注「未核验」
5. **最小变更**：只做被要求的事，不顺手加功能、重构无关代码

## 5. 验证清单

改动后至少验证：

- [ ] 视觉对照 `base.html`：色板、间距、动画、许可配色一致
- [ ] 快捷键全部可用
- [ ] localStorage 旧数据可读取
- [ ] hash 分享链接可还原状态
- [ ] 高级搜索（`lic:` `-register:` `*` 拼音映射）行为不变
