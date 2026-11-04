// 全局存储入口：键名前缀与迁移策略的唯一实现（docs/architecture.md §3）。
// 前缀 ash-hub_，域名段在键尾；两域零交叉由键名隔离保证。
// 旧前缀 ah_* 仅读迁移：新键缺失且旧键有值时复制一份，旧键保留不删——
// 线上已部署，旧版本回滚时数据仍在。

export const STORAGE_KEYS = {
  favs: 'ash-hub_favs',
  recent: 'ash-hub_recent',
  customOrder: 'ash-hub_custom_order',
  assetFavs: 'ash-hub_assets_favs',
} as const;

const LEGACY_KEYS: Record<string, string> = {
  [STORAGE_KEYS.favs]: 'ah_favs',
  [STORAGE_KEYS.recent]: 'ah_recent',
  [STORAGE_KEYS.customOrder]: 'ah_custom_order',
  [STORAGE_KEYS.assetFavs]: 'ah_assets_favs',
};

/** 旧键 -> 新键的一次性复制；返回旧值供本次读取使用 */
function migrateFromLegacy(key: string): string | null {
  const legacyKey = LEGACY_KEYS[key];
  if (!legacyKey) return null;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy === null) return null;
  try {
    localStorage.setItem(key, legacy);
  } catch {
    // 配额耗尽 / 隐私模式：迁移失败不能连带丢数据，本次仍按旧值返回
  }
  return legacy;
}

/**
 * 读 JSON。原值损坏或键缺失时返回 fallback，不抛错——
 * 单个坏键不应让整个视图起不来。
 */
export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key) ?? migrateFromLegacy(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
