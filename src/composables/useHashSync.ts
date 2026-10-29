import { watch } from 'vue';
import type { ActiveFilters } from '../types';
import { buildHash, parseHash } from '../lib/hash';

/**
 * URL hash 双向同步：初始化时从 hash 恢复状态，之后任何状态变化写回 hash。
 * 参数格式冻结为 q/fav/types/licenses/registers（原型 v22 行为），分享链接可还原。
 */
export function useHashSync(deps: {
  search: { value: string };
  favOnly: { value: boolean };
  activeFilters: { value: ActiveFilters };
}) {
  // 恢复：先解析再挂 watcher，避免初始化时把默认状态回写覆盖地址栏
  const initial = parseHash(window.location.hash);
  deps.search.value = initial.search;
  deps.favOnly.value = initial.favOnly;
  deps.activeFilters.value = initial.filters;

  watch(
    [deps.search, deps.favOnly, deps.activeFilters],
    () => {
      const newHash = buildHash({
        search: deps.search.value,
        favOnly: deps.favOnly.value,
        filters: deps.activeFilters.value,
      });
      history.replaceState(
        null,
        '',
        newHash ? '#' + newHash : window.location.pathname + window.location.search,
      );
    },
    { deep: true },
  );
}
