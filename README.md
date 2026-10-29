# ASSET//HUB

免费游戏素材导航控制台 —— 赛博朋克风格的静态站点聚合工具。

当前处于**原型阶段**：产品形态与设计系统已沉淀在单文件原型 `base.html`（v22）中，后续基于 Vite + Vue 3 组件化拆分迭代。

## 功能

- 素材站点目录：43 个免费游戏素材站点，类型 / 许可 / 注册要求三维标注
- 搜索与筛选：空格分词 AND 匹配，命中按名称 > 标签 > 描述评分排序，关键词高亮
- 命令面板：`Ctrl/Cmd + K`，视图切换、随机站点、筛选预设
- 自定义排序：拖拽卡片，localStorage 持久化
- 状态分享：搜索 / 筛选 / 收藏同步 URL hash
- 快捷键：`/` 搜索、`R` 随机、`G`/`L` 视图、`S` 收藏、`?` 帮助

## 快速开始

```bash
pnpm install
pnpm dev        # 开发
pnpm build      # 产物在 dist/
pnpm test       # vitest
```

原始单文件原型在 `prototype/base.html`，直接用浏览器打开即可查看。

## 文档

| 文档                                           | 内容                                   |
| ---------------------------------------------- | -------------------------------------- |
| [docs/design-tokens.md](docs/design-tokens.md) | 设计系统基准（色板 / 字体 / 视觉特征） |
| [docs/development.md](docs/development.md)     | 开发流程（版本 / 分支 / 提交 / hooks） |
| [AGENTS.md](AGENTS.md)                         | AI 协作约束与验证清单                  |

## 目录

```
prototype/  # 原型：功能规格 + design token 唯一事实来源
assets/     # 原始素材包（Kenney 等），未接入
docs/       # 专项文档
```

## License

站点数据仅供导航索引，素材许可以各原站标注为准。
