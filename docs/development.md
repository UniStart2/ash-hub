# 开发流程规范

版本、分支、提交与提交前检查的统一约定。脚手架初始化时按本文落地配置。

## 版本：SemVer

`MAJOR.MINOR.PATCH`：不兼容变更 / 新功能 / 修复。1.0.0 之前 minor 可含不兼容变更。发布在 `main` 打 tag（`v0.1.0`）。

## 分支模型

| 分支 | 用途 |
|---|---|
| `main` | 发布，仅接受 `release/*` 与 hotfix 合并 |
| `develop` | 日常集成 |
| `feat/<scope>` | 新功能，从 `develop` 切出，PR 合回 |
| `fix/<scope>` | 修复，同上 |
| `release/x.y.z` | 发布准备 → `main` + 回合 `develop` |

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

| Hook | 工具 | 职责 |
|---|---|---|
| `pre-commit` | lint-staged | 仅检查暂存文件 |
| `commit-msg` | commitlint | 校验提交信息（`@commitlint/config-conventional`） |

lint-staged 规则：

- `*.{ts,vue,js}` → ESLint --fix + Prettier
- `*.{css,vue,html}` → Stylelint + Prettier

约束：

- 本地与 CI 跑同一套命令，可复现
- `--no-verify` 仅限人工决策，不得默认绕过
- 依赖锁定用 pnpm，`pnpm-lock.yaml` 必须入库

## 合并要求

- 所有变更走 PR，禁止直推 `main` / `develop`
- AI 实质性参与的提交带 trailer：`AI-Assisted: true`
- 合并前回归测试；完成度以验收交付物计，不以生成量计
