import { watch } from 'vue';
import type { ActiveFilters } from '../types';
import { parseHash, patchHash } from '../lib/hash';

/**
 * URL hash 双向同步：初始化时从 hash 恢复状态，之后任何状态变化写回。
 * 参数格式冻结为 q/fav/types/licenses/registers（原型 v22 行为），分享链接可还原。
 * 写回走 patchHash 增量合并，不碰 `view`（应用级）等其他模块的键。
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
      const { types, licenses, registers } = deps.activeFilters.value;
      patchHash({
        q: deps.search.value || null,
        fav: deps.favOnly.value ? '1' : null,
        types: types.join(',') || null,
        licenses: licenses.join(',') || null,
        registers: registers.join(',') || null,
      });
    },
    { deep: true },
  );
}
