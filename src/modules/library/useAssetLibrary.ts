import { computed, ref } from 'vue';
import type { Asset, AssetType } from './types';
import type { AssetRepository } from './repository';
import { filterAssets } from './filters';

const FAV_KEY = 'ah_assets_favs';

/**
 * 资产库列表状态：搜索 / 类型与标签筛选 / 收藏。
 * 与发现域 useSiteCatalog 同构但完全隔离：收藏键 ah_assets_favs，
 * 数据经 Repository 异步载入（P1 为 mock 实现，切换实现时本文件不动）。
 */
export function useAssetLibrary(repo: AssetRepository) {
  const assets = ref<Asset[]>([]);
  const loaded = ref(false);
  const search = ref('');
  const activeTypes = ref<AssetType[]>([]);
  const activeTags = ref<string[]>([]);
  const favOnly = ref(false);
  const favorites = ref<string[]>(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));

  void repo.list().then((list) => {
    assets.value = list;
    loaded.value = true;
  });

  /** 全部出现过的标签及频次，供筛选面板渲染（不重复发明标签管理） */
  const tagCounts = computed(() => {
    const counts: Record<string, number> = {};
    assets.value.forEach((a) => a.tags.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)));
    return counts;
  });

  const filteredAssets = computed(() =>
    filterAssets(assets.value, {
      search: search.value,
      types: activeTypes.value,
      tags: activeTags.value,
      favOnly: favOnly.value,
      favorites: favorites.value,
    }),
  );

  function toggleType(t: AssetType) {
    const i = activeTypes.value.indexOf(t);
    if (i > -1) activeTypes.value.splice(i, 1);
    else activeTypes.value.push(t);
  }

  function toggleTag(t: string) {
    const i = activeTags.value.indexOf(t);
    if (i > -1) activeTags.value.splice(i, 1);
    else activeTags.value.push(t);
  }

  function toggleFav(uuid: string) {
    const i = favorites.value.indexOf(uuid);
    if (i > -1) favorites.value.splice(i, 1);
    else favorites.value.push(uuid);
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value));
  }

  function resetFilters() {
    search.value = '';
    activeTypes.value = [];
    activeTags.value = [];
    favOnly.value = false;
  }

  return {
    assets,
    loaded,
    search,
    activeTypes,
    activeTags,
    favOnly,
    favorites,
    tagCounts,
    filteredAssets,
    toggleType,
    toggleTag,
    toggleFav,
    resetFilters,
  };
}
