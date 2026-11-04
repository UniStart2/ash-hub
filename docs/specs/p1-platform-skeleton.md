# P1 规格：平台骨架 + 资产库列表

状态：待评审。依据 [product.md](../product.md) 定位与关键架构决策制定；评审通过前不动代码。

## 目标

证明「一个壳、两个模块」的架构成立：资产域以 mock 数据落地，与发现域（现有站点导航）共存且互不污染。P1 是骨架，不是功能堆叠。

## 非目标（本期明确不做）

- 特色功能零实现：许可引擎、AI 溯源 UI、登记下载、引擎导出——**只落字段**
- 预览器/编辑器/导出队列（V17 的重头）一律不做
- 真实文件导入；数据源仅 mock
- 不重构现有发现域代码（文件保持原位）

## Asset 数据模型（`src/modules/library/types.ts`）

```ts
// 类型系统按文件模态划分（打开方式），美术类别走 tags/meta：
// 精灵图、概念稿、UI 切图都是 IMAGE；SPRITE/MATERIAL 等垂直类型将来按需追加
export type AssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MODEL';

// 来源三值与 V17 一致；local 涵盖本地生成（ComfyUI）与本地文件登记
export type AssetSourceType = 'api' | 'local' | 'web';

export interface AssetSource {
  type: AssetSourceType;
  engine?: string; // "Suno AI" / "本地 ComfyUI" —— AI 溯源护照字段
  account?: string;
  url?: string; // 来源深链（重新生成入口的伏笔）
}

export interface AssetVersion {
  tag: string; // "v2.0"
  date: string; // ISO 日期
  note: string;
  url: string; // 版本资源地址（mock 期为外链）
  format: string;
  meta: Record<string, string>; // 分辨率/采样率等，按类型自由键值
}

export interface Asset {
  uuid: string; // UUIDv7（时间有序）；P1 mock 手写，新增 ID 必须 v7，
  // 浏览器 crypto.randomUUID 仅产 v4，v7 生成器随导入功能引入（届时核验依赖）
  name: string;
  type: AssetType;
  tags: string[];
  thumbnail?: string; // mock 期为 SVG 占位或本地化小图；真实导入后改句柄引用
  prompt?: string; // AI 溯源
  license?: string; // 许可引擎字段（值与站点域 license 词表对齐）
  source: AssetSource;
  versions: AssetVersion[];
  currentVersion: string; // versions[].tag 之一
  projectRefs: string[]; // L3：素材↔项目关联，P1 只存不用
  rev: number; // 单调递增，Repository 冲突检测位
  addedAt: string; // ISO；与 uuidv7 时间位冗余，显式字段优先可读性
}
```

派生：`activeVersion(asset)` = versions 中 tag === currentVersion 的项。

## Repository 接口（冲突通道先行）

```ts
export type PutResult = { ok: true; asset: Asset } | { conflict: true; remote: Asset };

export interface AssetRepository {
  list(): Promise<Asset[]>;
  get(uuid: string): Promise<Asset | null>;
  put(asset: Asset): Promise<PutResult>;
  remove(uuid: string): Promise<void>;
}
```

P1 实现 `MockAssetRepository`：内存数据 + 每次 put 自增 rev、永不冲突（本地恒为最新）。IndexedDB 实现（`IdbAssetRepository`）与句柄持久化留待导入功能。

存储键：`ash-hub_assets_favs`（收藏，uuid 数组）。**禁用**发现域 `ash-hub_favs`（站点专属）。
键名统一经 `src/lib/storage.ts` 的 `STORAGE_KEYS` 取用，组件内不写字面量；旧前缀 `ah_*` 由该模块只读迁移（P1 初版键名为 `ah_assets_favs`，已在存储层改名）。

## 应用壳与模块切换

- 新增 hash 参数 `view`：`sites`（默认，现有行为）/ `library`。冻结参数表**追加**此项（append-only，既有五项语义不变）
- 无 vue-router：单一 composable `useAppView` 读写 `view`，与现有 hash 同步机制同构
- 壳布局：侧栏顶部加模块切换（发现 / 资产库），其余不动；现有发现域视觉、快捷键、localStorage 行为全部回归无损
- 快捷键表冻结追加：`Ctrl/Cmd+K` 命令面板注册资产域命令（切换模块、收藏视图），不新增按键

## 资产库列表（V17 信息架构 → cyber token 映射）

| V17 元素                                           | 映射                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 顶部搜索框（`>` 进命令模式）                       | 纯搜索框；命令能力并入全局 `Ctrl+K` 面板，不建第二套命令系统                                                                   |
| 类型筛选（3D/视频/音频/图片）                      | 侧栏筛选组，选中态 cyan 发光（同发现域交互）                                                                                   |
| 标签筛选 + 收藏视图                                | 同侧栏；收藏持久化 `ash-hub_assets_favs`                                                                                       |
| 资产卡片（缩略图/类型角标/版本/来源引擎/悬浮详情） | `SiteCard` 同款 cyber-card：角标 hover、聚光灯、许可配色规则不适用（资产域无 license 配色语义，统一 cyan 主色）                |
| zinc 调色                                          | `bg-base→cyber-bg`、`panel→cyber-panel`、`border-zinc-700/800→cyber-line`、`text-zinc-400→cyber-dim`、`primary(蓝)→cyber-cyan` |
| daisyUI 组件类（btn/input/kbd）                    | 不用 daisyUI；按现有 input/button 风格重写                                                                                     |
| lucide 图标                                        | 沿用（已入依赖）                                                                                                               |

检索语义：名称/prompt/标签 子串匹配（多词 AND），与发现域搜索同构；不做评分排序（数据量小，V17 亦无）。

## 目录结构（新增不搬迁）

```
src/modules/library/
  types.ts            # 数据模型
  mock.ts             # mock 资产（替换 V17 外链图为占位生成图）
  repository.ts       # 接口 + MockAssetRepository
  useAssetLibrary.ts  # 列表状态：搜索/筛选/收藏/分页
  LibraryView.vue     # 资产库页
src/components/AppShell.vue   # 壳：模块切换 + 视图出口
```

## 验收标准

- [ ] `pnpm build` / ESLint / Stylelint 全绿；Repository 与筛选逻辑有单测
- [ ] 双模块切换流畅，`#view=library` 可还原；发现域五项回归（视觉/快捷键/hash/localStorage/搜索语义）逐项过
- [ ] 收藏刷新后保留；两域 localStorage 键零交叉
- [ ] 代码评审确认：无许可引擎/溯源 UI/导入/预览实现混入
- [ ] 文档同步：AGENTS.md §1 定位、§2 冻结表（追加 view 参数）、README 功能清单

## 已决议项（评审通过记录）

- mock 缩略图：默认 cyber 风格 SVG 占位（按类型图标 + 名称首字，零依赖零失效）；真实观感需要时允许本地化外链小图进 `public/mock-thumbs/`；**不直接引用外链图**（unsplash 等迟早失效）
- 资产库拖拽排序：**不做**（YAGNI；发现域 customOrder 机制不复制到资产域）
- AssetType 命名：`MODEL` 替代 `'3D'`（枚举是代码，展示文案映射为「3D 模型」）
- 来源类型：仅 `api | local | web`，与 V17 一致，不增设 `manual`
- UUID：UUIDv7 为规定格式；v7 生成器依赖随导入功能落地时引入并核验，P1 不新增依赖
