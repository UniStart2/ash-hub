# 开发流程规范

版本、分支、提交与提交前检查的统一约定。脚手架初始化时按本文落地配置。

## 版本：SemVer

`MAJOR.MINOR.PATCH`：不兼容变更 / 新功能 / 修复。1.0.0 之前 minor 可含不兼容变更。发布在 `main` 打 tag（`v0.1.0`）。

## 分支模型

| 分支            | 用途                                    |
| --------------- | --------------------------------------- |
| `main`          | 发布，仅接受 `release/*` 与 hotfix 合并 |
| `develop`       | 日常集成                                |
| `feat/<scope>`  | 新功能，从 `develop` 切出，PR 合回      |
| `fix/<scope>`   | 修复，同上                              |
| `release/x.y.z` | 发布准备 → `main` + 回合 `develop`      |

## 提交：Conventional Commits

```
<type>(<scope>): <subject>

[body]

[BREAKING CHANGE: ...]
```

- type：`feat` `fix` `refactor` `docs` `style` `perf` `test` `build` `ci` `chore`
- scope：模块名（`search` `card` `tokens` `deps` …）
- subject：祈使句、小写开头、不加句号、≤72 字符
- 不兼容变更：`feat!:` 或 footer `BREAKING CHANGE:`

## Pre-commit 工具链

| Hook         | 工具        | 职责                                              |
| ------------ | ----------- | ------------------------------------------------- |
| `pre-commit` | lint-staged | 仅检查暂存文件                                    |
| `commit-msg` | commitlint  | 校验提交信息（`@commitlint/config-conventional`） |

lint-staged 规则：

- `*.{ts,vue,js}` → ESLint --fix + Prettier
- `*.{css,vue,html}` → Stylelint + Prettier

工具职责划分（同一规则不重复定义）：

| 工具      | 只管                                        |
| --------- | ------------------------------------------- |
| ESLint    | 代码质量（未用变量、危险写法、Vue/TS 规则） |
| Prettier  | 纯格式化（缩进、引号、换行）                |
| Stylelint | CSS 规范（选择器、属性书写）                |

约束：

- 本地与 CI 跑同一套命令，可复现
- `--no-verify` 仅限人工决策，不得默认绕过
- 依赖锁定用 pnpm，`pnpm-lock.yaml` 必须入库

## 合并要求

- 所有变更走 PR，禁止直推 `main` / `develop`
- AI 实质性参与的提交带 trailer：`AI-Assisted: true`
- 合并前回归测试；完成度以验收交付物计，不以生成量计

## 提交前检查

每次提交前必须完成，与 lint-staged 同一道关：

- [ ] **文档同步**：本次改动影响的文档（`README.md` / `AGENTS.md` / `docs/*`）已同步更新——过期的文档比没有文档危害更大
- [ ] 提交信息符合 Conventional Commits（commit-msg hook 会强制校验）

## 发布部署

push 到 `main` 由 `.github/workflows/deploy.yml` 自动构建并双路部署：

| 目标             | 地址形态                           | 前提配置                                                                                                                                       |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pages     | `https://<user>.github.io/<repo>/` | 仓库 Settings → Pages → Source 选 **GitHub Actions**                                                                                           |
| Cloudflare Pages | `https://asset-hub.pages.dev`      | ① Cloudflare dashboard 手动创建 Pages 项目 `asset-hub`；② 仓库 Secrets 配置 `CLOUDFLARE_API_TOKEN`（Pages 编辑权限）与 `CLOUDFLARE_ACCOUNT_ID` |

实现要点：GitHub Pages 挂在子路径，构建时注入 `VITE_BASE=/<repo>/`；Cloudflare 在根路径，`base=/`。两份产物由 matrix 分别构建，不可复用。
