import { ref, watch } from 'vue';
import { patchHash } from '../lib/hash';

export type AppView = 'sites' | 'library';

function readView(): AppView {
  const v = new URLSearchParams(window.location.hash.slice(1)).get('view');
  return v === 'library' ? 'library' : 'sites';
}

/**
 * 应用级模块切换状态。只读写 hash 的 `view` 键，其余参数原样保留——
 * 与发现域 hash 同步（lib/hash.ts）零共享，两个模块的 URL 状态互不感知。
 */
export function useAppView() {
  const view = ref<AppView>(readView());

  watch(view, (v) => patchHash({ view: v === 'sites' ? null : v }));

  return { view };
}
