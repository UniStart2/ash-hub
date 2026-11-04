<script setup lang="ts">
import { useAppView } from '../composables/useAppView';
import SitesView from '../modules/discover/SitesView.vue';
import LibraryView from '../modules/library/LibraryView.vue';
import AppToast from './AppToast.vue';

// 壳层只负责模块切换与视图出口；两视图组件互不感知，背景与布局各自携带。
// toast 属全局能力，挂在壳层：两个模块共用同一通知层。
const { view } = useAppView();
</script>

<template>
  <SitesView v-if="view === 'sites'" />
  <LibraryView v-else />

  <AppToast />

  <!-- 模块切换 HUD：壳层所有，未来新增视图无需改动视图内部 -->
  <nav
    class="fixed top-4 right-4 z-[30000] flex items-center gap-0.5 p-0.5 bg-black/40 border border-cyber-line rounded-sm backdrop-blur-md font-mono text-[11px]"
  >
    <button
      v-for="tab in [
        { k: 'sites', l: '发现' },
        { k: 'library', l: '资产库' },
      ]"
      :key="tab.k"
      :class="
        view === tab.k
          ? 'bg-cyber-cyan text-[#02181a] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
          : 'text-cyber-dim hover:text-cyber-text hover:bg-white/5'
      "
      class="px-3 py-1 rounded-sm transition-all"
      @click="view = tab.k as typeof view"
    >
      {{ tab.l }}
    </button>
  </nav>
</template>
