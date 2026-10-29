<script setup lang="ts">
import type { ActiveFilters, FilterKey, Site } from '../types';
import { TYPE_LABEL, LICENSE_LABEL, REGISTER_LABEL } from '../data/labels';

const props = defineProps<{
  sites: Site[];
  activeFilters: ActiveFilters;
  favorites: string[];
  favOnly: boolean;
}>();

const emit = defineEmits<{
  toggleFilter: [key: FilterKey, val: string];
  toggleFavOnly: [];
  clearRecent: [];
}>();

const recentSites = defineModel<{ name: string; url: string }[]>('recentSites', {
  required: true,
});

const filterDefs = [
  { key: 'types' as FilterKey, cn: '类型', opts: TYPE_LABEL },
  { key: 'licenses' as FilterKey, cn: '许可', opts: LICENSE_LABEL },
  { key: 'registers' as FilterKey, cn: '注册', opts: REGISTER_LABEL },
];

function getCount(group: FilterKey, val: string): number {
  if (group === 'types')
    return props.sites.filter((s) => s.types.includes(val as Site['types'][number])).length;
  if (group === 'licenses') return props.sites.filter((s) => s.license === val).length;
  return props.sites.filter((s) => s.register === val).length;
}

function openUrl(url: string) {
  window.open(url, '_blank');
}

// FilterKey 联合索引会得到 SiteType[] | License[] | Register[] 联合，
// 模板中直接 .includes 会要求 never；统一经此函数以字符串比较
function isActive(key: FilterKey, val: string): boolean {
  return (props.activeFilters[key] as string[]).includes(val);
}
</script>

<template>
  <aside
    class="sticky top-0 h-screen flex flex-col gap-6 p-6 border-r border-cyber-line bg-gradient-to-b from-[rgba(12,14,23,0.72)] to-[rgba(5,6,10,0.4)] backdrop-blur-md overflow-y-auto overflow-x-hidden"
  >
    <div class="flex flex-col gap-2 shrink-0">
      <div class="flex items-center gap-2.5">
        <div
          class="w-[11px] h-[11px] bg-cyber-cyan shadow-[0_0_14px_#00f0ff,0_0_28px_rgba(0,240,255,0.4)] animate-pulse"
          style="clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"
        ></div>
        <span class="font-display text-[19px] font-bold tracking-tight text-white"
          >ASSET<span class="text-cyber-magenta italic">//</span>HUB</span
        >
        <span
          class="ml-auto font-mono text-[9.5px] text-cyber-dim tracking-widest border border-cyber-line2 px-1.5 py-0.5 rounded-sm"
          >v22</span
        >
      </div>
      <div class="font-mono text-[10px] text-cyber-dim2 tracking-[0.18em] uppercase">
        free game asset console
      </div>
    </div>

    <div v-if="recentSites.length > 0" class="flex flex-col gap-2 shrink-0">
      <div
        class="flex items-center justify-between font-mono text-[10.5px] text-cyber-dim uppercase tracking-widest"
      >
        <span class="text-cyber-text font-semibold normal-case">最近访问</span>
        <button
          class="hover:text-cyber-magenta transition-colors p-1"
          title="清空"
          @click="emit('clearRecent')"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="site in recentSites"
          :key="site.url"
          class="font-mono text-[10px] text-cyber-dim bg-white/5 border border-cyber-line rounded-sm px-2 py-1 hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors"
          @click="openUrl(site.url)"
        >
          {{ site.name }}
        </button>
      </div>
    </div>

    <div v-for="group in filterDefs" :key="group.key" class="flex flex-col gap-2.5 shrink-0">
      <div
        class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
      >
        <span class="text-cyber-text font-semibold tracking-normal">{{ group.cn }}</span>
        <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="(label, val) in group.opts"
          :key="val"
          :class="[
            isActive(group.key, val)
              ? group.key === 'types'
                ? 'bg-cyber-cyan border-cyber-cyan text-[#02181a] font-bold shadow-cyber-cyan'
                : group.key === 'licenses'
                  ? 'bg-cyber-lime border-cyber-lime text-[#0e1400] font-bold shadow-cyber-lime'
                  : 'bg-cyber-magenta border-cyber-magenta text-white font-bold shadow-cyber-magenta'
              : 'bg-transparent border-cyber-line text-cyber-dim hover:border-cyber-line2 hover:text-cyber-text hover:bg-white/5',
          ]"
          class="font-mono text-[11px] border rounded-sm px-2 py-1 flex items-center gap-1.5 transition-all"
          @click="emit('toggleFilter', group.key, val)"
        >
          <span>{{ label }}</span
          ><span class="text-[9px] px-1 rounded-sm bg-black/20">{{
            getCount(group.key, val)
          }}</span>
        </button>
      </div>
    </div>

    <button
      :class="
        favOnly
          ? 'text-cyber-gold border-cyber-gold/40 bg-cyber-gold/5 shadow-[0_0_16px_rgba(255,209,102,0.1)]'
          : 'text-cyber-dim border-cyber-line hover:border-cyber-line2 hover:text-cyber-text hover:bg-white/5'
      "
      class="flex items-center justify-between w-full px-3 py-2 border rounded-sm font-mono text-[11px] transition-all shrink-0 mt-auto"
      @click="emit('toggleFavOnly')"
    >
      <span class="flex items-center gap-2"
        ><span class="text-[13px]" :class="{ 'text-cyber-gold': favOnly }">★</span
        ><span>只看收藏</span></span
      ><span class="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-sm">{{ favorites.length }}</span>
    </button>
  </aside>
</template>
