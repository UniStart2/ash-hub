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

/** 序列化为 hash 字符串（不含 # 前缀）；全空返回空串 */
export function buildHash(state: HashState): string {
  const params = new URLSearchParams();
  if (state.search) params.set('q', state.search);
  if (state.favOnly) params.set('fav', '1');
  Object.entries(state.filters).forEach(([key, arr]) => {
    if (arr.length > 0) params.set(key, arr.join(','));
  });
  return params.toString();
}
