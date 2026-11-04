<script setup lang="ts">
import type { AssetVersion } from '../types';

defineProps<{ versions: AssetVersion[]; activeTag: string }>();
defineEmits<{ select: [tag: string] }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim">
      <span class="text-cyber-text font-semibold tracking-normal">版本链</span>
      <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
      <span class="text-[10px] text-cyber-dim2">{{ versions.length }}</span>
    </div>

    <ul class="flex flex-col gap-1" role="listbox" aria-label="版本链">
      <li v-for="v in versions" :key="v.tag">
        <button
          :aria-selected="v.tag === activeTag"
          role="option"
          :class="
            v.tag === activeTag
              ? 'border-cyber-cyan/60 bg-cyber-cyan/5 text-cyber-text'
              : 'border-cyber-line text-cyber-dim hover:border-cyber-line2 hover:bg-white/5 hover:text-cyber-text'
          "
          class="w-full text-left border rounded-sm px-2.5 py-2 transition-all flex flex-col gap-1"
          @click="$emit('select', v.tag)"
        >
          <span class="flex items-center gap-2 font-mono text-[11px]">
            <b :class="v.tag === activeTag ? 'text-cyber-cyan' : ''" class="font-semibold">{{
              v.tag
            }}</b>
            <span class="text-[9.5px] text-cyber-dim2">{{ v.date }}</span>
            <span class="ml-auto text-[9px] text-cyber-dim2">{{ v.format }}</span>
          </span>
          <span class="font-display text-[11px] leading-snug text-cyber-dim line-clamp-1">{{
            v.note
          }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
