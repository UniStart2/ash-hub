<script setup lang="ts">
import type { Site } from '../types';

const emit = defineEmits<{
  action: [action: 'open' | 'copy' | 'fav' | 'google', site: Site];
}>();

defineProps<{ isFav: boolean }>();

const visible = defineModel<boolean>({ required: true });
const x = defineModel<number>('x', { required: true });
const y = defineModel<number>('y', { required: true });
const site = defineModel<Site | null>('site', { required: true });

/** 菜单一角越出视口时向内收（原型按 208x160 的固定尺寸估算） */
function openAt(clientX: number, clientY: number, target: Site) {
  const menuWidth = 208;
  const menuHeight = 160;
  let nextX = clientX;
  let nextY = clientY;
  if (nextX + menuWidth > window.innerWidth) nextX -= menuWidth;
  if (nextY + menuHeight > window.innerHeight) nextY -= menuHeight;
  x.value = nextX;
  y.value = nextY;
  site.value = target;
  visible.value = true;
}

function run(action: 'open' | 'copy' | 'fav' | 'google') {
  if (!site.value) return;
  const target = site.value;
  visible.value = false;
  emit('action', action, target);
}

defineExpose({ openAt });
</script>

<template>
  <div
    v-show="visible"
    class="fixed z-[20000] w-52 bg-[rgba(12,14,23,0.95)] border border-cyber-cyan/50 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)] backdrop-blur-md overflow-hidden font-mono text-[11px]"
    :style="`left: ${x}px; top: ${y}px;`"
    @contextmenu.prevent
  >
    <div
      class="bg-cyber-cyan/10 text-cyber-cyan px-3 py-1.5 border-b border-cyber-cyan/20 font-bold flex items-center gap-1.5 overflow-hidden"
    >
      <div class="w-1 h-3 bg-cyber-cyan shrink-0"></div>
      <span class="truncate">{{ site?.name }}</span>
    </div>

    <div class="p-1 flex flex-col gap-0.5">
      <button
        class="flex items-center gap-2 px-2.5 py-1.5 text-cyber-text hover:bg-cyber-cyan/20 hover:text-cyber-cyan rounded-sm transition-colors text-left"
        @click="run('open')"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14L21 3" />
        </svg>
        打开站点
      </button>
      <button
        class="flex items-center gap-2 px-2.5 py-1.5 text-cyber-text hover:bg-cyber-cyan/20 hover:text-cyber-lime rounded-sm transition-colors text-left"
        @click="run('copy')"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        复制链接
      </button>
      <button
        class="flex items-center gap-2 px-2.5 py-1.5 text-cyber-text hover:bg-cyber-gold/20 hover:text-cyber-gold rounded-sm transition-colors text-left"
        @click="run('fav')"
      >
        <span class="text-[13px]">★</span>
        <span>{{ isFav ? '取消收藏' : '加入收藏' }}</span>
      </button>
      <div class="h-px bg-cyber-line my-1 mx-1"></div>
      <button
        class="flex items-center gap-2 px-2.5 py-1.5 text-cyber-dim hover:bg-cyber-line hover:text-cyber-text rounded-sm transition-colors text-left"
        @click="run('google')"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.2-4.2" />
        </svg>
        搜索该站点
      </button>
    </div>
  </div>
</template>
