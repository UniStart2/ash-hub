<script setup lang="ts">
defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  changePage: [p: number];
}>();
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      :disabled="currentPage === 1"
      class="px-2.5 py-1 border border-cyber-line rounded-sm hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 hover:text-cyber-cyan disabled:opacity-30 disabled:pointer-events-none transition-all"
      @click="emit('changePage', currentPage - 1)"
    >
      &lt; PREV
    </button>
    <button
      v-for="p in totalPages"
      v-show="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1"
      :key="p"
      :class="
        currentPage === p
          ? 'bg-cyber-cyan text-[#02181a] font-bold border-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]'
          : 'border-transparent text-cyber-dim hover:bg-white/5 hover:text-cyber-text'
      "
      class="w-7 h-7 flex items-center justify-center border rounded-sm transition-all"
      @click="emit('changePage', p)"
    >
      {{ p }}
    </button>
    <button
      :disabled="currentPage === totalPages"
      class="px-2.5 py-1 border border-cyber-line rounded-sm hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 hover:text-cyber-cyan disabled:opacity-30 disabled:pointer-events-none transition-all"
      @click="emit('changePage', currentPage + 1)"
    >
      NEXT &gt;
    </button>
  </div>
</template>
