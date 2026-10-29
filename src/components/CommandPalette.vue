<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { PaletteCommand, Site } from '../types';
import { getDomain } from '../lib/filter';
import { CircleHelp, Search } from 'lucide-vue-next';

const props = defineProps<{
  sites: Site[];
  commands: PaletteCommand[];
}>();

const emit = defineEmits<{
  execute: [action: string, payload?: string];
  close: [];
}>();

const visible = defineModel<boolean>({ required: true });
const mode = ref<'cmd' | 'help'>('cmd');
const query = ref('');
const activeIndex = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.commands;
  return props.commands.filter((c) => c.label.toLowerCase().includes(q));
});

/** 站点搜索分区：名称或标签命中，最多 5 条（原型行为） */
const matchedSites = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return props.sites
    .filter((s) => s.name.toLowerCase().includes(q) || s.tags.join(' ').toLowerCase().includes(q))
    .slice(0, 5);
});

const totalItems = computed(() => filteredCommands.value.length + matchedSites.value.length);

function open(nextMode: 'cmd' | 'help') {
  mode.value = nextMode;
  visible.value = true;
  query.value = '';
  activeIndex.value = 0;
  nextTick(() => inputEl.value?.focus());
}

/** 输入 ? 或 help 时切换到帮助模式（原型 handleCmdInput） */
function onInput() {
  const q = query.value.trim().toLowerCase();
  if (q === '?' || q === 'help') {
    mode.value = 'help';
    query.value = '';
  }
}

function navigate(dir: 1 | -1) {
  if (mode.value === 'help' || totalItems.value === 0) return;
  activeIndex.value += dir;
  if (activeIndex.value < 0) activeIndex.value = totalItems.value - 1;
  if (activeIndex.value >= totalItems.value) activeIndex.value = 0;
}

function executeActive() {
  if (mode.value === 'help') return;
  if (activeIndex.value < filteredCommands.value.length) {
    run(filteredCommands.value[activeIndex.value].action);
  } else {
    const site = matchedSites.value[activeIndex.value - filteredCommands.value.length];
    if (site) run('openUrl', site.url);
  }
}

function run(action: string, payload?: string) {
  visible.value = false;
  emit('execute', action, payload);
}

watch(visible, (v) => {
  if (v) open(mode.value);
});

defineExpose({ open });
</script>

<template>
  <div
    v-show="visible"
    class="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4 bg-[rgba(3,4,8,0.7)] backdrop-blur-sm transition-opacity"
    @click="visible = false"
  >
    <div
      class="w-full max-w-[600px] bg-[rgba(12,14,23,0.95)] border border-cyber-cyan/40 rounded-md shadow-[0_0_50px_rgba(0,240,255,0.15),0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden font-mono flex flex-col"
      @click.stop
    >
      <div class="flex items-center px-4 py-3 border-b border-cyber-line shrink-0">
        <!-- Search icon -->
        <Search v-if="mode === 'cmd'" class="w-5 h-5 text-cyber-cyan mr-3 shrink-0" />
        <!-- Help icon -->
        <CircleHelp v-else class="w-5 h-5 text-cyber-cyan mr-3 shrink-0" />

        <input
          ref="inputEl"
          v-model="query"
          type="text"
          :placeholder="mode === 'help' ? '快捷键列表' : '输入搜索词或命令（输入 ? 查看快捷键）...'"
          :readonly="mode === 'help'"
          autocomplete="off"
          spellcheck="false"
          class="flex-1 bg-transparent border-none outline-none text-white text-[15px] tracking-wide placeholder:text-cyber-dim2 cursor-default focus:outline-none"
          @keydown.escape.prevent="visible = false"
          @keydown.down.prevent="navigate(1)"
          @keydown.up.prevent="navigate(-1)"
          @keydown.enter.prevent="executeActive"
          @input="onInput"
        />
        <button
          class="text-[10px] text-cyber-dim border border-cyber-line2 rounded-sm px-1.5 py-0.5 shrink-0 hover:text-cyber-magenta transition-colors"
          @click="visible = false"
        >
          Esc
        </button>
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-2">
        <div v-if="mode === 'cmd'">
          <div v-show="filteredCommands.length > 0" class="mb-2">
            <div class="text-[10px] text-cyber-dim tracking-widest px-2 py-1 uppercase">动作</div>
            <div
              v-for="(cmd, idx) in filteredCommands"
              :key="cmd.id"
              :class="
                activeIndex === idx
                  ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan'
                  : 'border-transparent text-cyber-text hover:bg-white/5'
              "
              class="flex items-center gap-3 px-3 py-2.5 rounded-sm border cursor-pointer transition-colors"
              @click="run(cmd.action)"
              @mouseenter="activeIndex = idx"
            >
              <div
                class="w-6 h-6 flex items-center justify-center rounded-sm bg-cyber-line/50 text-[10px] font-bold"
              >
                {{ cmd.icon }}
              </div>
              <span class="text-[13px]">{{ cmd.label }}</span>
              <span
                v-if="cmd.shortcut"
                class="ml-auto text-[10px] text-cyber-dim2 border border-cyber-line px-1 rounded-sm"
                >{{ cmd.shortcut }}</span
              >
            </div>
          </div>

          <div v-show="query.trim().length > 0 && matchedSites.length > 0" class="mb-2">
            <div class="text-[10px] text-cyber-dim tracking-widest px-2 py-1 uppercase">
              站点搜索
            </div>
            <div
              v-for="(site, idx) in matchedSites"
              :key="site.url"
              :class="
                activeIndex === filteredCommands.length + idx
                  ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan'
                  : 'border-transparent text-cyber-text hover:bg-white/5'
              "
              class="flex items-center justify-between px-3 py-2 rounded-sm border cursor-pointer transition-colors"
              @click="run('openUrl', site.url)"
              @mouseenter="activeIndex = filteredCommands.length + idx"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-6 h-6 flex items-center justify-center rounded-sm bg-cyber-magenta/10 text-cyber-magenta text-[10px]"
                >
                  🔗
                </div>
                <span class="text-[13px]">{{ site.name }}</span>
              </div>
              <span class="text-[10px] text-cyber-dim">{{ getDomain(site.url) }}</span>
            </div>
          </div>

          <div
            v-show="filteredCommands.length === 0 && matchedSites.length === 0"
            class="py-10 text-center text-cyber-dim text-[12px]"
          >
            没有找到相关命令或站点
          </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-3">
          <div
            v-for="item in [
              ['命令面板', 'Ctrl + K'],
              ['聚焦搜索', '/'],
              ['随机打开', 'R'],
              ['网格视图', 'G'],
              ['列表视图', 'L'],
              ['只看收藏', 'S'],
              ['打开快捷键列表', '?'],
              ['打开首个/关闭', 'Enter / Esc'],
            ]"
            :key="item[0]"
            class="flex items-center justify-between py-1 border-b border-white/5"
          >
            <span class="text-cyber-text text-[12px]">{{ item[0] }}</span>
            <kbd
              class="text-cyber-dim2 bg-cyber-panel2 border border-cyber-line2 rounded-sm px-1.5 py-0.5 text-[10px]"
              >{{ item[1] }}</kbd
            >
          </div>
        </div>
      </div>

      <div
        class="px-4 py-2 border-t border-cyber-line bg-black/20 text-[10px] text-cyber-dim2 flex justify-between items-center shrink-0"
      >
        <span>{{ mode === 'help' ? '按 Esc 返回' : '按 ↑↓ 选择，Enter 确认' }}</span>
        <span v-show="mode === 'cmd'">按 <kbd class="text-cyber-dim">?</kbd> 查看快捷键</span>
      </div>
    </div>
  </div>
</template>
