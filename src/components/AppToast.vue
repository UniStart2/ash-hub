<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { visible, message, type } = useToast();
</script>

<template>
  <div
    v-show="visible"
    :class="
      type === 'warn'
        ? 'border-cyber-magenta text-cyber-magenta shadow-[0_0_30px_rgba(255,46,136,0.22)]'
        : type === 'ok'
          ? 'border-cyber-lime text-cyber-lime shadow-[0_0_30px_rgba(198,255,0,0.22)]'
          : 'border-cyber-cyan text-cyber-cyan shadow-[0_0_30px_rgba(0,240,255,0.22)]'
    "
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] font-mono text-[11.5px] tracking-widest px-5 py-2.5 rounded-sm bg-[rgba(12,14,23,0.96)] border shadow-2xl max-w-[90vw] truncate"
  >
    {{ message }}
  </div>
</template>
