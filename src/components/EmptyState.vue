<script setup lang="ts">
defineProps<{
  favOnly: boolean;
}>();

const emit = defineEmits<{
  resetFilters: [];
  clearSearch: [];
  exitFav: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 gap-4 text-center w-full flex-1">
    <div class="empty-hud-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="flex items-center justify-between border-b border-cyber-line pb-2.5 mb-3">
        <div class="flex items-center gap-2">
          <div
            class="w-1.5 h-1.5 rounded-full bg-cyber-magenta animate-pulse shadow-[0_0_8px_#ff2e88]"
          ></div>
          <span class="text-[10px] text-cyber-magenta tracking-widest font-bold">SYSTEM_ALERT</span>
        </div>
        <span class="text-[10px] text-cyber-dim2">tty0</span>
      </div>
      <div class="font-mono text-[12px] leading-relaxed text-left text-cyber-text">
        <div class="text-cyber-dim2 select-none mb-1">$ query --status</div>
        <div class="text-cyber-magenta">
          <span v-if="favOnly">&gt; ERR_0x454D505459 : EMPTY_COLLECTION</span>
          <span v-else>&gt; ERR_0x4E4F5F : NO_MATCH_FOUND</span>
        </div>
        <div class="text-cyber-dim mt-1">
          <span v-if="favOnly">&gt; 收藏库为空，请先添加收藏。</span>
          <span v-else>&gt; 没有匹配的条目，请检查输入。</span>
        </div>
        <div class="mt-4 flex items-center gap-1.5 text-[10px] text-cyber-cyan">
          <span>等待输入_</span><span class="w-1.5 h-3 bg-cyber-cyan animate-pulse"></span>
        </div>
      </div>
    </div>

    <div class="font-mono text-[12px] tracking-widest text-cyber-dim mt-2">
      <span v-if="favOnly"
        >你还没有收藏任何素材 ·
        <button class="text-cyber-cyan hover:underline" @click="emit('exitFav')">
          返回全部
        </button></span
      >
      <span v-else
        >没有找到匹配的站点 · 试试
        <button class="text-cyber-cyan hover:underline" @click="emit('resetFilters')">
          放宽筛选
        </button>
        或
        <button class="text-cyber-cyan hover:underline" @click="emit('clearSearch')">
          清空搜索
        </button></span
      >
    </div>
  </div>
</template>
