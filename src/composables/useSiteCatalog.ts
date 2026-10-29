import { computed, ref, watch } from 'vue';
import type { ActiveFilters, FilterKey, Site } from '../types';
import { filterSites } from '../lib/filter';

const EMPTY_FILTERS = (): ActiveFilters => ({ types: [], licenses: [], registers: [] });

/** 目录浏览核心状态：搜索 / 筛选 / 收藏 / 排序 / 分页 */
export function useSiteCatalog(allSites: Site[]) {
  const sites = ref(allSites);
  const search = ref('');
  const favOnly = ref(false);
  const activeFilters = ref<ActiveFilters>(EMPTY_FILTERS());
  const sort = ref<'rec' | 'az'>('rec');
  const view = ref<'grid' | 'list'>('grid');
  const currentPage = ref(1);
  const pageSize = ref(12);

  const favorites = ref<string[]>(JSON.parse(localStorage.getItem('ah_favs') || '[]'));
  const customOrder = ref<string[]>(JSON.parse(localStorage.getItem('ah_custom_order') || '[]'));

  const filteredSites = computed(() =>
    filterSites(sites.value, {
      search: search.value,
      favOnly: favOnly.value,
      activeFilters: activeFilters.value,
      favorites: favorites.value,
      sort: sort.value,
      customOrder: customOrder.value,
    }),
  );
  const totalSites = computed(() => filteredSites.value.length);
  const totalPages = computed(() => Math.ceil(totalSites.value / pageSize.value) || 1);
  const displayedSites = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredSites.value.slice(start, start + pageSize.value);
  });
  const hasActiveFilters = computed(
    () =>
      !!search.value ||
      favOnly.value ||
      Object.values(activeFilters.value).some((arr) => arr.length > 0),
  );

  watch([search, favOnly, activeFilters], () => {
    currentPage.value = 1;
  });

  function toggleFilter(key: FilterKey, val: string) {
    const arr = activeFilters.value[key] as string[];
    const index = arr.indexOf(val);
    if (index > -1) arr.splice(index, 1);
    else arr.push(val);
  }

  function resetAll() {
    search.value = '';
    favOnly.value = false;
    activeFilters.value = EMPTY_FILTERS();
    currentPage.value = 1;
  }

  function applyPreset(preset: { type?: string[]; lic?: string[]; reg?: string[] }) {
    resetAll();
    if (preset.type) activeFilters.value.types = preset.type as ActiveFilters['types'];
    if (preset.lic) activeFilters.value.licenses = preset.lic as ActiveFilters['licenses'];
    if (preset.reg) activeFilters.value.registers = preset.reg as ActiveFilters['registers'];
  }

  function toggleFav(site: Site) {
    const index = favorites.value.indexOf(site.url);
    if (index > -1) favorites.value.splice(index, 1);
    else favorites.value.push(site.url);
    localStorage.setItem('ah_favs', JSON.stringify(favorites.value));
  }

  function changePage(p: number) {
    if (p >= 1 && p <= totalPages.value) {
      currentPage.value = p;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return {
    sites,
    search,
    favOnly,
    activeFilters,
    sort,
    view,
    currentPage,
    pageSize,
    favorites,
    customOrder,
    filteredSites,
    totalSites,
    totalPages,
    displayedSites,
    hasActiveFilters,
    toggleFilter,
    resetAll,
    applyPreset,
    toggleFav,
    changePage,
  };
}
