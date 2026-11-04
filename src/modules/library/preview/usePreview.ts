import { computed, ref, type Ref } from 'vue';
import { patchHash } from '../../../lib/hash';
import type { Asset } from '../types';

/**
 * 预览浮层的导航态：打开态 = assetUuid 非空，且与 hash 同构（asset / ver）。
 * 不含数据访问——资产列表由调用方传入，浮层组件只做展示，可脱离 Repository 单测。
 */
export function usePreview(deps: { assets: Ref<Asset[]> }) {
  // 只在 setup 读一次：全项目统一 replaceState，没有第二方会改这两个键
  const params = new URLSearchParams(window.location.hash.slice(1));
  const assetUuid = ref<string | null>(params.get('asset'));
  const versionTag = ref<string | null>(params.get('ver'));

  const asset = computed(() => deps.assets.value.find((a) => a.uuid === assetUuid.value) ?? null);
  const versions = computed(() => asset.value?.versions ?? []);
  const activeIndex = computed(() => {
    const requested = versionTag.value;
    const list = versions.value;
    const hit = requested ? list.findIndex((v) => v.tag === requested) : -1;
    if (hit > -1) return hit;
    // ver 非法或缺失：回落到 currentVersion，找不到则视为无选中
    return list.findIndex((v) => v.tag === asset.value?.currentVersion);
  });
  const activeVersion = computed(() => versions.value[activeIndex.value] ?? null);
  const activeTag = computed(() => activeVersion.value?.tag ?? '');

  // 列表新版本在前：step(-1) 往更新走，step(+1) 往更旧走
  const hasPrev = computed(() => activeIndex.value > 0);
  const hasNext = computed(
    () => activeIndex.value > -1 && activeIndex.value < versions.value.length - 1,
  );

  function open(uuid: string) {
    assetUuid.value = uuid;
    versionTag.value = null;
    patchHash({ asset: uuid, ver: null });
  }

  function close() {
    assetUuid.value = null;
    versionTag.value = null;
    patchHash({ asset: null, ver: null });
  }

  function selectVersion(tag: string) {
    if (!versions.value.some((v) => v.tag === tag)) return;
    versionTag.value = tag;
    patchHash({ ver: tag });
  }

  function step(dir: -1 | 1) {
    const next = versions.value[activeIndex.value + dir];
    if (next) selectVersion(next.tag);
  }

  return {
    asset,
    versions,
    activeTag,
    activeVersion,
    hasPrev,
    hasNext,
    open,
    close,
    selectVersion,
    step,
  };
}
