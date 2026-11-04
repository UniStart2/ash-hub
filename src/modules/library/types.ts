// 资产域数据模型 —— 依据 docs/specs/p1-platform-skeleton.md 定义
// 类型系统按文件模态划分（打开方式），美术类别走 tags/meta：
// 精灵图、概念稿、UI 切图都是 IMAGE；SPRITE/MATERIAL 等垂直类型将来按需追加
export type AssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MODEL';

// 来源三值与 V17 原型一致；local 涵盖本地生成（ComfyUI）与本地文件登记
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
  url: string; // 版本资源地址（mock 期为外链 demo 资源）
  format: string;
  meta: Record<string, string>; // 分辨率/采样率等，按类型自由键值
}

export interface Asset {
  // UUIDv7（时间有序）。浏览器 crypto.randomUUID 仅产 v4，
  // v7 生成器依赖随导入功能落地时引入（走 V8 核验流程），P1 mock 手写固定值
  uuid: string;
  name: string;
  type: AssetType;
  tags: string[];
  thumbnail?: string; // mock 期缺省（视图生成 SVG 占位）；真实导入后改句柄引用
  prompt?: string; // AI 溯源护照字段
  license?: string; // 许可引擎字段，值与发现域 license 词表对齐（cc0/cc-by/free-commercial/mixed）
  source: AssetSource;
  versions: AssetVersion[];
  currentVersion: string; // 必须为 versions[].tag 之一
  projectRefs: string[]; // L3 素材↔项目关联，P1 只存不用
  rev: number; // 单调递增，Repository 冲突检测位（开放写接口时自增）
  addedAt: string; // ISO；与 uuidv7 时间位冗余，显式字段优先可读性
}

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  IMAGE: '图片',
  VIDEO: '视频',
  AUDIO: '音频',
  MODEL: '3D 模型',
};
