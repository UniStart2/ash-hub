<script setup lang="ts">
// 跨域通用的赛博 HUD 空态：视觉 chrome（角标/终端字效/光标）留在组件内，
// 文案经 props 注入，动作按钮走 actions 插槽——发现域与资产域共用同一实现。
defineProps<{
  alertCode: string; // 如 "ERR_0x454D505459"
  headline: string; // 如 "EMPTY_COLLECTION"
  lines: string[]; // 提示行，逐行渲染
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
        <div class="text-cyber-magenta">&gt; {{ alertCode }} : {{ headline }}</div>
        <div v-for="(line, i) in lines" :key="i" class="text-cyber-dim mt-1">&gt; {{ line }}</div>
        <div class="mt-4 flex items-center gap-1.5 text-[10px] text-cyber-cyan">
          <span>等待输入_</span><span class="w-1.5 h-3 bg-cyber-cyan animate-pulse"></span>
        </div>
      </div>
    </div>

    <div class="font-mono text-[12px] tracking-widest text-cyber-dim mt-2">
      <slot name="actions" />
    </div>
  </div>
</template>
