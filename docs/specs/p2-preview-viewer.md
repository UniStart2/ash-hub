# P2 规格：资产预览器

状态：待评审。P1 已合入 `develop`（[p1-platform-skeleton.md](./p1-platform-skeleton.md)）。本文档评审通过前不动代码。

## 目标

资产库卡片可打开全屏预览：图/音/视三类**真实渲染播放**，版本链可切换，元数据与溯源信息只读展示。P2 只做「看」，不做「改」。

## 非目标

- 3D 渲染：不引入 three.js（~600KB + 扩展面）。MODEL 资产只展示元数据与版本链，媒体区显示「3D 预览未实现」的明确占位，**不加载 glTF**
- 编辑、导入、导出队列、署名清单生成（P3/P4）
- 真实文件句柄与 IndexedDB（随导入功能落地）
- 图片缩放/平移、音频波形分析：需 decode 与手势处理，数据量小收益低，进 backlog
- V17 无预览交互可参照，本规格为新增设计；视觉语言取 v22 命令面板浮层

## 前置修复（P2 第一提交，独立可验）

`useHashSync`（发现域）与 `useAppView`（应用级）对 hash 的写策略不一致：前者用 `buildHash` **全量重建**，会抹掉 `view`；后者用 `URLSearchParams` **增量保留**。P2 要加 `asset`/`ver`，必须先统一。

做法：`src/lib/hash.ts` 增 `patchHash(patch: Record<string, string | null>)`——读现有 params、按 patch 增删、`history.replaceState` 写回。三个写者（useHashSync / useAppView / usePreview）全走它，`buildHash` 降为 `patchHash` 的内部实现或删除。

- 行为修复：`#view=library` 下触发发现域搜索写入后，`view` 不再丢失
- 单测：patch 增/删/保留、空值清空、既有五项语义不变

## hash 参数追加（append-only）

| 参数    | 语义              | 缺省           |
| ------- | ----------------- | -------------- |
| `asset` | 预览中的资产 uuid | 无浮层         |
| `ver`   | 预览中的版本 tag  | 该资产当前版本 |

- 非法 `asset`（不存在）/ 非法 `ver`（不在 versions 链内）→ 忽略而非报错，与现有 `parseHash` 惯例一致；`ver` 非法时回落 `currentVersion`
- 关闭浮层 = 从 hash 删除 `asset`/`ver`，其余参数原样保留
- **不引入 history 条目**（沿用 replaceState）：浏览器后退不会关闭浮层。改用 pushState 需接管 popstate 并与两个既有写者对齐，收益（后退关浮层）不抵复杂度，进 backlog

## 结构

```
src/modules/library/preview/
  PreviewOverlay.vue   # 浮层：媒体区 + 元数据侧栏 + 焦点管理
  VersionRail.vue      # 版本链列表（tag/日期/note/format）
  usePreview.ts        # 打开/关闭、当前资产、当前版本、版本切换
src/lib/hash.ts        # 增 patchHash，统一写者
```

媒体渲染不进独立组件：`<img>/<video>/<audio>` 三选一 + 一个占位分支，抽组件是过度设计（Rule of Three 未满足）。

## 交互

| 触发 / 按键           | 行为                                                       |
| --------------------- | ---------------------------------------------------------- |
| 点击卡片主体          | 打开浮层，`ver` = `currentVersion`                         |
| 点击卡片星标          | 收藏切换，`stopPropagation`，不打开浮层                    |
| 卡片 Enter / Space    | 同点击（卡片补 `role="button"` + `tabindex="0"`）          |
| `Esc`                 | 关闭浮层（全局表已有此键，浮层内语义收窄为「关浮层优先」） |
| 点击遮罩              | 关闭                                                       |
| `←` / `→`（仅浮层内） | 切换版本；聚焦在 `<input>` 等控件内时不拦截                |
| `Space`（仅音/视频）  | 播放/暂停；焦点在按钮或输入时不拦截                        |

**快捷键表冻结不变**：`←/→/Space` 只在浮层打开且焦点在浮层内生效，不是应用级按键，不进全局表（AGENTS §2 注明作用域）。

- 焦点：打开时焦点移入浮层（关按钮或媒体），关闭后归还触发卡片
- `role="dialog"` + `aria-modal="true"` + `aria-label` = 资产名
- 浮层打开时锁定 body 滚动；关闭后恢复原滚动位置（记录 `scrollY`）

## 媒体区

| 类型  | 渲染                                                               | 备注                         |
| ----- | ------------------------------------------------------------------ | ---------------------------- |
| IMAGE | `<img>` + `object-contain`，max-h 撑满可用高度                     | 不做缩放/平移                |
| VIDEO | 原生 `<video controls playsinline>`                                | 不自动播放（浏览器策略噪音） |
| AUDIO | 原生 `<audio controls>` + 资产名与格式静态占位块                   | 不做波形                     |
| MODEL | 类型图标 + 「3D 预览未实现（P2 非目标）」+ 版本 format/size 元数据 | 不请求任何 glTF 资源         |

- **加载失败态**（mock 外链迟早失效，P1 已预判）：`@error` 触发 → 媒体区显示错误码与「打开源地址」链接（`activeVersion.url`），不白屏
- 切版本/关闭时：`video`/`audio` 先 `pause()` 并清 `src`，防止后台继续播放
- 视觉：遮罩 `bg-[rgba(3,4,8,0.86)] + backdrop-blur-sm`，`z-[15000]`（命令面板 10000 之上、右键菜单 20000 之下）；面板 `border-cyber-line` + `bg-cyber-panel`，无新 token

## 元数据侧栏

只读展示，字段来源 `Asset` / `activeVersion`：

- 基础：名称、类型、format、`addedAt`
- 溯源护照：`source.type`（api/local/web）、`source.engine`、`source.account`、`prompt`（多行保留换行）
- 许可：`license` 徽标，值与发现域词表一致（cc0 / cc-by / free-commercial / mixed）；cc-by 显示「需署名」提示文案。**不做**署名清单生成
- 版本元数据：`activeVersion.meta` 键值对表格
- 收藏按钮（复用 `toggleFav`）、`projectRefs` 数量（0 时显示「未关联项目」）

## 验收标准

- [ ] 前置修复独立提交：`#view=library` 下发现域搜索写入不再丢 `view`；`patchHash` 有单测
- [ ] `pnpm build` / ESLint / Stylelint / Vitest 全绿；`usePreview`（版本切换、非法 ver 回落）与 hash 解析有单测
- [ ] 三类媒体在 mock 外链可达时真实播放；断网/失效 URL 显示错误态而非白屏
- [ ] 深链 `#view=library&asset=<uuid>&ver=v1.0` 刷新还原；非法 uuid 静默忽略
- [ ] Esc / 遮罩点击关闭；关闭后筛选、搜索、滚动位置不变；焦点归还触发卡片
- [ ] `←/→` 仅在浮层内切版本；MODEL 不发任何资源请求（Network 面板核对）
- [ ] 发现域五项回归 + 资产库列表（P1）回归无损
- [ ] 文档同步：AGENTS §2 冻结表（追加 asset/ver、浮层内按键作用域）、README 功能清单

## 待拍板决策点

1. **深链 vs 纯状态**：推荐深链（与现有 hash 哲学一致，且顺带修掉 hash 写者不一致）。备用：纯组件状态，零 hash 改动但不可分享
2. **3D 预览是否进 P2**：推荐不进（新依赖 + 违反「二次加载」目标）。若必须，单独提案走 V8 依赖核验
3. **mock 媒体形态**：推荐保留公开外链 demo（threejs/mdn）+ 错误态兜底；不把二进制样本下载进仓库（体积 + 许可溯源成本）
