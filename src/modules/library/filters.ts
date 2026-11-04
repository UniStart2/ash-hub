import type { Asset, AssetType } from './types';

export interface LibraryFilterOptions {
  search: string;
  types: AssetType[]; // OR：命中任一选中类型即保留
  tags: string[]; // AND：每个选中标签都必须在资产标签中
  favOnly: boolean;
  favorites: string[]; // uuid 集合
}

/** 检索域：名称 + prompt + 标签（多词空格分词 AND，与发现域搜索同构）；不做评分排序 */
function matchesSearch(asset: Asset, parts: string[]): boolean {
  if (parts.length === 0) return true;
  const haystack = `${asset.name} ${asset.prompt ?? ''} ${asset.tags.join(' ')}`.toLowerCase();
  return parts.every((p) => haystack.includes(p));
}

export function filterAssets(assets: Asset[], opts: LibraryFilterOptions): Asset[] {
  const parts = opts.search.toLowerCase().split(/\s+/).filter(Boolean);
  return assets.filter((asset) => {
    if (opts.favOnly && !opts.favorites.includes(asset.uuid)) return false;
    if (opts.types.length > 0 && !opts.types.includes(asset.type)) return false;
    if (opts.tags.length > 0 && !opts.tags.every((t) => asset.tags.includes(t))) return false;
    return matchesSearch(asset, parts);
  });
}
