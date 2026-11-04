import type { ActiveFilters } from '../types';

/** hash 序列化格式冻结（与原型一致）：q=搜索词&fav=1&types=a,b&licenses=c&registers=d */
export interface HashState {
  search: string;
  favOnly: boolean;
  filters: ActiveFilters;
}

/** 从 location.hash 解析状态；无 hash 时返回空状态。非法值被忽略而不是抛错。 */
export function parseHash(hash: string): HashState {
  const state: HashState = {
    search: '',
    favOnly: false,
    filters: { types: [], licenses: [], registers: [] },
  };
  const raw = hash.replace(/^#/, '');
  if (!raw) return state;

  const params = new URLSearchParams(raw);
  state.search = params.get('q') ?? '';
  state.favOnly = params.get('fav') === '1';
  (['types', 'licenses', 'registers'] as const).forEach((key) => {
    const value = params.get(key);
    if (value) state.filters[key] = value.split(',') as never;
  });
  return state;
}

/**
 * 唯一的 hash 写者：读现有参数、按 patch 增删键、replaceState 写回。
 * 增量而非全量重建——各模块只碰自己的键，`view` / `asset` 不会被别的模块的写入冲掉。
 * 值传 null 或空串即删除该键。
 */
export function patchHash(patch: Record<string, string | null>): void {
  const params = new URLSearchParams(window.location.hash.slice(1));
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
  }
  const next = params.toString();
  history.replaceState(
    null,
    '',
    next ? '#' + next : window.location.pathname + window.location.search,
  );
}
