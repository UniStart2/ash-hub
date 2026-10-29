import type { ActiveFilters, Site, SortMode } from '../types';

export interface FilterOptions {
  search: string;
  favOnly: boolean;
  activeFilters: ActiveFilters;
  favorites: string[];
  sort: SortMode;
  customOrder: string[];
}

/**
 * 站点过滤 + 排序，逻辑逐行对齐 prototype/base.html v22 的 filteredSites。
 * 有搜索词时按评分降序（评分规则：全名 50 / 名称包含 20 / 标签 10 / 描述 2）；
 * 无搜索词时按 sort：az 为名称升序，rec 有自定义序则用自定义序，否则 featured 优先 + 名称升序。
 */
export function filterSites(sites: Site[], opts: FilterOptions): Site[] {
  const queryParts = opts.search.toLowerCase().split(/\s+/).filter(Boolean);

  const results = sites.filter((site) => {
    if (opts.favOnly && !opts.favorites.includes(site.url)) return false;
    if (
      opts.activeFilters.types.length > 0 &&
      !site.types.some((t) => opts.activeFilters.types.includes(t))
    )
      return false;
    if (
      opts.activeFilters.licenses.length > 0 &&
      !opts.activeFilters.licenses.includes(site.license)
    )
      return false;
    if (
      opts.activeFilters.registers.length > 0 &&
      !opts.activeFilters.registers.includes(site.register)
    )
      return false;

    if (queryParts.length > 0) {
      const haystack = `${site.name} ${site.desc} ${site.tags.join(' ')} ${site.url}`.toLowerCase();
      if (!queryParts.every((part) => haystack.includes(part))) return false;
    }
    return true;
  });

  if (queryParts.length > 0) {
    return results
      .map((site) => {
        let score = 0;
        const nameStr = site.name.toLowerCase();
        const tagsStr = site.tags.join(' ').toLowerCase();
        const descStr = site.desc.toLowerCase();

        queryParts.forEach((part) => {
          if (nameStr === part) score += 50;
          else if (nameStr.includes(part)) score += 20;
          if (tagsStr.includes(part)) score += 10;
          if (descStr.includes(part)) score += 2;
        });
        return { site, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.site);
  }

  if (opts.sort === 'az') {
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (opts.customOrder.length > 0) {
    return [...results].sort((a, b) => {
      const idxA = opts.customOrder.indexOf(a.url);
      const idxB = opts.customOrder.indexOf(b.url);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }
  return [...results].sort(
    (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name),
  );
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
