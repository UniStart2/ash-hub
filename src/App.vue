<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { markNewSites, SITES } from './data/sites';
import { useSiteCatalog } from './composables/useSiteCatalog';
import { useRecent, addRecent } from './composables/useRecent';
import { toast, copyText, type TimerHandle } from './composables/useToast';
import { useHashSync } from './composables/useHashSync';
import { useHotkeys } from './composables/useHotkeys';
import { useDragSort } from './composables/useDragSort';
import { applyCustomOrder } from './lib/reorder';
import type { PaletteCommand, Site } from './types';
import AppSidebar from './components/AppSidebar.vue';
import SiteCard from './components/SiteCard.vue';
import AppPagination from './components/AppPagination.vue';
import EmptyState from './components/EmptyState.vue';
import AppToast from './components/AppToast.vue';
import CommandPalette from './components/CommandPalette.vue';
import ContextMenu from './components/ContextMenu.vue';
import type { FilterKey } from './types';
import { TYPE_LABEL, LICENSE_LABEL, REGISTER_LABEL } from './data/labels';

// 初始化顺序（与原型 init 一致）：标记 NEW → 应用自定义排序 → 目录状态
const initialOrder: string[] = JSON.parse(localStorage.getItem('ah_custom_order') || '[]');
const catalog = useSiteCatalog(applyCustomOrder(markNewSites(SITES), initialOrder));
const { recentSites, clearRecent } = useRecent();

const searchInput = ref<HTMLInputElement | null>(null);
const paletteEl = ref<InstanceType<typeof CommandPalette> | null>(null);
const contextMenuEl = ref<InstanceType<typeof ContextMenu> | null>(null);

const {
  sites,
  search,
  favOnly,
  activeFilters,
  sort,
  view,
  currentPage,
  pageSize,
  favorites,
  customOrder,
  filteredSites,
  totalSites,
  totalPages,
  displayedSites,
  hasActiveFilters,
  toggleFilter: catalogToggleFilter,
  resetAll,
  applyPreset,
  toggleFav,
  changePage,
} = catalog;

const pageStart = computed(() => (currentPage.value - 1) * pageSize.value);

// ------------- 标签映射 -------------
const LABELS: Record<FilterKey, Record<string, string>> = {
  types: TYPE_LABEL,
  licenses: LICENSE_LABEL,
  registers: REGISTER_LABEL,
};
function getLabel(key: FilterKey, val: string): string {
  return LABELS[key][val] ?? val; // 查不到标签时回退显示原始值，界面永不空白
}

// ---------- URL hash 同步 ----------
useHashSync({ search, favOnly, activeFilters });

// ---------- 拖拽排序 ----------
const drag = useDragSort({
  displayedSites,
  customOrder,
  sort,
  search,
  hasActiveFilters,
  currentPage,
  pageSize,
});

// 拖放落盘后重排全量站点，使当前页成为全局序的可见窗口
watch(customOrder, (order) => {
  sites.value = applyCustomOrder(sites.value, order);
});

function toggleFilter(key: 'types' | 'licenses' | 'registers', val: string) {
  catalogToggleFilter(key, val);
  drag.clearDragState();
}

function setSort(next: 'rec' | 'az') {
  sort.value = next;
  currentPage.value = 1;
  drag.clearDragState();
}

function setView(next: 'grid' | 'list') {
  view.value = next;
  drag.clearDragState();
}

// ---------- 命令面板 ----------
const paletteVisible = ref(false);
const palette = {
  get visible() {
    return paletteVisible.value;
  },
  open: (mode: 'cmd' | 'help') => paletteEl.value?.open(mode),
  close: () => {
    paletteVisible.value = false;
  },
};

const COMMANDS: PaletteCommand[] = [
  { id: 'view-grid', label: '切换到网格视图', action: 'grid', icon: 'G', shortcut: 'G' },
  { id: 'view-list', label: '切换到列表视图', action: 'list', icon: 'L', shortcut: 'L' },
  { id: 'random', label: '随机打开一个站点', action: 'random', icon: '🎲', shortcut: 'R' },
  { id: 'toggle-fav', label: '切换只看收藏', action: 'fav', icon: '★' },
  { id: 'reset', label: '清空所有筛选和搜索', action: 'reset', icon: '×' },
  { id: 'preset-commercial', label: '应用预设：直接商用', action: 'preset-commercial', icon: '🚀' },
  { id: 'preset-2d', label: '应用预设：2D 美术', action: 'preset-2d', icon: '🎨' },
  { id: 'preset-audio', label: '应用预设：音频音效', action: 'preset-audio', icon: '🔊' },
];

function applyPresetWithToast(preset: { type?: string[]; lic?: string[]; reg?: string[] }) {
  applyPreset(preset);
  toast('已应用快捷预设', 'ok');
}

function executeCommand(action: string, payload?: string) {
  switch (action) {
    case 'grid':
      setView('grid');
      toast('已切换到网格视图');
      break;
    case 'list':
      setView('list');
      toast('已切换到列表视图');
      break;
    case 'random':
      openRandom();
      break;
    case 'fav':
      favOnly.value = !favOnly.value;
      break;
    case 'reset':
      resetAll();
      break;
    case 'preset-commercial':
      applyPresetWithToast({ lic: ['cc0', 'free-commercial'], reg: ['none'] });
      break;
    case 'preset-2d':
      applyPresetWithToast({ type: ['2d'] });
      break;
    case 'preset-audio':
      applyPresetWithToast({ type: ['audio'] });
      break;
    case 'openUrl':
      if (payload) window.open(payload, '_blank');
      break;
  }
}

// ---------- 右键菜单 ----------
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const menuSite = ref<Site | null>(null);
const contextMenu = {
  close: () => {
    menuVisible.value = false;
  },
};

function onContextMenuAction(action: 'open' | 'copy' | 'fav' | 'google', site: Site) {
  if (action === 'open') {
    addRecent(site);
    window.open(site.url, '_blank');
  } else if (action === 'copy') {
    copyText(site.url);
  } else if (action === 'fav') {
    onToggleFav(site);
  } else {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(site.name)}`, '_blank');
  }
}

// ---------- 全局快捷键 ----------
useHotkeys({
  search,
  favOnly,
  hasActiveFilters,
  totalSites,
  view,
  searchInput,
  palette,
  contextMenu,
  filteredFirst: () => filteredSites.value[0],
  resetAll,
  openRandom,
});

// ---------- 业务动作 ----------
function onToggleFav(site: Site) {
  toggleFav(site);
  if (favorites.value.includes(site.url)) toast(`已收藏 · ${site.name}`, 'ok');
  else toast(`已取消收藏 · ${site.name}`, 'warn');
}

function onClearRecent() {
  clearRecent();
  toast('已清空最近访问', 'ok');
}

// 500ms 节流防止连按打开多页（原型行为）
let randomTimer: TimerHandle | undefined;
function openRandom() {
  if (randomTimer) return;
  randomTimer = setTimeout(() => {
    randomTimer = undefined;
  }, 500);

  if (totalSites.value === 0) {
    toast('当前筛选结果为空', 'warn');
    return;
  }
  const pick = filteredSites.value[Math.floor(Math.random() * filteredSites.value.length)];
  toast(`🎲 命中 · ${pick.name}`, 'ok');
  window.open(pick.url, '_blank');
}

function copyAll() {
  if (totalSites.value === 0) {
    toast('当前结果为空', 'warn');
    return;
  }
  copyText(
    filteredSites.value.map((s) => s.url).join('\n'),
    `已复制全部 ${totalSites.value} 条链接`,
  );
}

function onCopySite(site: Site) {
  copyText(site.url);
}

// 与原型一致：点击页面任意处关闭右键菜单（卡片上的菜单按钮已 stop 冒泡）
watch(menuVisible, (v) => {
  if (!v) return;
  const onClick = () => {
    menuVisible.value = false;
    window.removeEventListener('click', onClick);
  };
  window.addEventListener('click', onClick);
});
</script>

<template>
  <div class="grid-floor"></div>
  <div class="glow-orb"></div>
  <div class="glow-orb pink"></div>
  <div class="noise"></div>

  <div
    class="relative z-10 grid grid-cols-1 lg:grid-cols-[272px_1fr] max-w-[1540px] mx-auto min-h-screen"
  >
    <AppSidebar
      v-model:recent-sites="recentSites"
      :sites="sites"
      :active-filters="activeFilters"
      :favorites="favorites"
      :fav-only="favOnly"
      @toggle-filter="toggleFilter"
      @toggle-fav-only="favOnly = !favOnly"
      @clear-recent="onClearRecent"
    />

    <main class="flex flex-col p-6 lg:p-8 pb-16 min-w-0">
      <header class="flex flex-col gap-5 mb-6 shrink-0 relative z-20">
        <div class="flex items-end justify-between flex-wrap gap-5">
          <div class="flex flex-col gap-1.5">
            <h1
              class="title-glitch font-display text-[clamp(30px,4.4vw,48px)] font-bold tracking-tighter text-white leading-none"
              data-text="ASSET//HUB"
            >
              ASSET<span class="text-cyber-magenta drop-shadow-[0_0_24px_rgba(255,46,136,0.7)]"
                >//</span
              >HUB
            </h1>
            <div
              class="font-mono text-[11px] text-cyber-dim tracking-widest flex items-center gap-2"
            >
              <div class="w-5 h-px bg-cyber-dim2"></div>
              高质量免费游戏素材 ·
              <b class="text-cyber-cyan font-medium">{{ sites.length }}</b> 个站点
            </div>
          </div>
        </div>

        <div class="flex gap-2.5 items-stretch">
          <div
            class="relative flex-1 flex items-center gap-3 h-12.5 px-4 bg-linear-to-b from-cyber-panel2 to-cyber-panel border border-cyber-line rounded-sm transition-all group focus-within:border-cyber-cyan/50 focus-within:shadow-[0_0_30px_rgba(0,240,255,0.07)] cursor-text"
            @click="searchInput?.focus()"
          >
            <div
              class="absolute left-0 top-0 w-0.75 h-full bg-cyber-cyan shadow-[0_0_12px_#00f0ff] opacity-0 transition-opacity rounded-l-sm group-focus-within:opacity-100"
            ></div>
            <svg
              class="w-3.75 h-3.75 text-cyber-dim group-focus-within:text-cyber-cyan transition-colors shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
            <input
              id="searchInput"
              ref="searchInput"
              v-model="search"
              type="text"
              placeholder="搜索站点 (支持空格分词，按 Enter 打开首个)…"
              class="flex-1 min-w-0 bg-transparent border-none outline-none text-white font-mono text-[13.5px] tracking-wide placeholder:text-cyber-dim2"
              autocomplete="off"
              spellcheck="false"
              @keydown.escape="search = ''"
            />
            <button
              v-show="search.length > 0"
              class="text-cyber-dim hover:text-cyber-magenta p-1 shrink-0"
              @click.stop="search = ''"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              class="ml-1 flex items-center gap-1.5 px-2 py-1 bg-black/25 border border-cyber-line2 rounded-sm text-cyber-dim hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors shrink-0 group-focus-within:border-cyber-cyan/40"
              title="打开命令面板"
              @click.stop="palette.open('cmd')"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
                />
              </svg>
              <span class="font-mono text-[10px] tracking-wider hidden sm:inline-block"
                >Ctrl K</span
              >
            </button>
            <kbd
              class="font-mono text-[10px] text-cyber-dim2 border border-cyber-line2 rounded-sm px-1.5 py-0.5 shrink-0 group-focus-within:hidden sm:hidden"
              >/</kbd
            >
          </div>

          <button
            type="button"
            class="btn-random-group flex items-center justify-center w-12.5 h-12.5 bg-linear-to- from-[rgba(255,46,136,0.09)] to-[rgba(255,46,136,0.04)] border border-cyber-magenta/30 rounded-sm text-cyber-magenta hover:from-[rgba(255,46,136,0.18)] hover:to-[rgba(255,46,136,0.08)] hover:border-cyber-magenta hover:shadow-[0_0_24px_rgba(255,46,136,0.25)] hover:bg-[rgba(255,46,136,0.1)] active:scale-95 transition-all shrink-0"
            title="随机发现 (R)"
            @click="openRandom"
          >
            <svg
              class="w-4.5 h-4.5 random-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>
        </div>

        <div
          class="flex items-center gap-3 flex-wrap p-2.5 bg-linear-to-b from-[rgba(15,18,32,0.55)] to-[rgba(12,14,23,0.55)] border border-cyber-line rounded-sm backdrop-blur-sm"
        >
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span class="font-mono text-[9.5px] text-cyber-dim2 tracking-widest px-1 uppercase"
              >预设</span
            >
            <button
              class="whitespace-nowrap font-mono text-[10px] bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-2 py-1 rounded-sm hover:bg-cyber-cyan/20 transition-colors"
              @click="applyPresetWithToast({ lic: ['cc0', 'free-commercial'], reg: ['none'] })"
            >
              🚀 直接商用
            </button>
            <button
              class="whitespace-nowrap font-mono text-[10px] bg-cyber-lime/10 text-cyber-lime border border-cyber-lime/20 px-2 py-1 rounded-sm hover:bg-cyber-lime/20 transition-colors"
              @click="applyPresetWithToast({ type: ['2d'] })"
            >
              🎨 2D 美术
            </button>
            <button
              class="whitespace-nowrap font-mono text-[10px] bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/20 px-2 py-1 rounded-sm hover:bg-cyber-magenta/20 transition-colors"
              @click="applyPresetWithToast({ type: ['audio'] })"
            >
              🔊 音频音效
            </button>
          </div>
          <div class="w-px h-4.5 bg-cyber-line2 mx-0.5 hidden sm:block"></div>

          <div
            class="flex items-center gap-0.5 p-0.5 bg-black/25 border border-cyber-line rounded-sm"
          >
            <button
              v-for="s in [
                { k: 'rec', l: '推荐' },
                { k: 'az', l: 'A-Z' },
              ]"
              :key="s.k"
              :class="
                sort === s.k
                  ? 'bg-cyber-cyan text-[#02181a] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-cyber-dim hover:text-cyber-text hover:bg-white/5'
              "
              class="font-mono text-[10.5px] px-2.5 py-1 rounded-sm transition-all"
              @click="setSort(s.k as 'rec' | 'az')"
            >
              {{ s.l }}
            </button>
          </div>

          <div
            class="flex items-center gap-0.5 p-0.5 bg-black/25 border border-cyber-line rounded-sm"
          >
            <button
              :class="
                view === 'grid'
                  ? 'bg-cyber-cyan text-[#02181a] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-cyber-dim hover:text-cyber-text hover:bg-white/5'
              "
              class="p-1 rounded-sm transition-all"
              @click="setView('grid')"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              :class="
                view === 'list'
                  ? 'bg-cyber-cyan text-[#02181a] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-cyber-dim hover:text-cyber-text hover:bg-white/5'
              "
              class="p-1 rounded-sm transition-all"
              @click="setView('list')"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <div class="ml-auto flex items-center gap-1.5">
            <button
              class="w-7.5 h-7.5 flex items-center justify-center bg-transparent border border-cyber-line rounded-sm text-cyber-dim hover:text-cyber-cyan hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 transition-all"
              title="复制全部"
              @click="copyAll"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>

        <div
          class="relative z-30 flex items-center justify-between gap-3 flex-wrap font-mono text-[11px] tracking-wider px-0.5 min-h-6"
        >
          <div class="flex items-center gap-2 text-cyber-dim shrink-0">
            <div
              class="w-1.5 h-1.5 rounded-full bg-cyber-lime shadow-[0_0_10px_#c6ff00] animate-pulse"
            ></div>
            <span
              >MATCH <b class="text-cyber-lime font-medium">{{ totalSites }}</b>
              <span class="text-cyber-dim2">/</span> {{ sites.length }}</span
            >
          </div>
          <div class="flex-1 flex flex-wrap justify-center gap-1.5">
            <template v-for="(vals, key) in activeFilters" :key="key">
              <button
                v-for="v in vals"
                :key="v"
                :class="{
                  'bg-[rgba(0,240,255,0.07)] border-[rgba(0,240,255,0.18)] text-cyber-cyan hover:bg-[rgba(0,240,255,0.14)] hover:border-cyber-cyan':
                    key === 'types',
                  'bg-[rgba(198,255,0,0.07)] border-[rgba(198,255,0,0.18)] text-cyber-lime hover:bg-[rgba(198,255,0,0.14)] hover:border-cyber-lime':
                    key === 'licenses',
                  'bg-[rgba(255,46,136,0.07)] border-[rgba(255,46,136,0.18)] text-cyber-magenta hover:bg-[rgba(255,46,136,0.14)] hover:border-cyber-magenta':
                    key === 'registers',
                }"
                class="flex items-center gap-1 px-2 py-0.5 border rounded-sm text-[10px] transition-colors shrink-0"
                @click="toggleFilter(key, v)"
              >
                <span>{{ getLabel(key, v) }}</span
                ><span class="opacity-60 text-[11px] leading-none">×</span>
              </button>
            </template>
            <button
              v-if="favOnly"
              class="flex items-center gap-1 px-2 py-0.5 border border-cyber-gold/40 text-cyber-gold bg-cyber-gold/10 rounded-sm text-[10px] hover:bg-cyber-gold/20 transition-colors shrink-0"
              @click="favOnly = false"
            >
              <span>★ 收藏</span><span class="opacity-60 text-[11px] leading-none">×</span>
            </button>
          </div>
          <button
            v-show="hasActiveFilters"
            class="bg-transparent border border-cyber-line2 rounded-sm text-cyber-dim hover:text-cyber-magenta hover:border-cyber-magenta/50 hover:bg-cyber-magenta/5 font-mono text-[10.5px] tracking-wider px-2.5 py-1 transition-all"
            @click="resetAll"
          >
            RESET
          </button>
        </div>
      </header>

      <div class="flex-1 relative flex flex-col">
        <div
          v-show="displayedSites.length > 0"
          :class="
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'
              : 'flex flex-col gap-1.5'
          "
          class="transition-all duration-300"
        >
          <SiteCard
            v-for="(site, i) in displayedSites"
            :key="site.url"
            :site="site"
            :index="i"
            :display-index="pageStart + i"
            :view="view"
            :favorites="favorites"
            :search="search"
            :is-drag-enabled="drag.isDragEnabled.value"
            @toggle-fav="onToggleFav"
            @open="addRecent"
            @copy="onCopySite"
            @context-menu="(e, s) => contextMenuEl?.openAt(e.clientX, e.clientY, s)"
            @type-click="(t) => toggleFilter('types', t)"
            @tag-click="(tag) => (search = tag)"
            @drag-start="drag.onDragStart"
            @drag-end="drag.onDragEnd"
            @drag-over="drag.onDragOver"
            @drag-leave="drag.onDragLeave"
            @drop="drag.onDrop"
          />
        </div>

        <EmptyState
          v-if="displayedSites.length === 0"
          :fav-only="favOnly"
          @reset-filters="resetAll"
          @clear-search="search = ''"
          @exit-fav="favOnly = false"
        />

        <div
          v-show="totalSites > 0"
          class="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-cyber-line pt-5 gap-4 font-mono text-[11px] text-cyber-dim tracking-wider"
        >
          <div class="flex items-center gap-3">
            <span>每页显示</span>
            <select
              v-model.number="pageSize"
              class="bg-cyber-panel2 border border-cyber-line rounded-sm text-cyber-text px-2 py-1 outline-none cursor-pointer focus:border-cyber-cyan"
            >
              <option :value="12">12</option>
              <option :value="24">24</option>
              <option :value="48">48</option>
            </select>
            <span
              >条，共 <b class="text-cyber-cyan">{{ totalSites }}</b> 条结果</span
            >
          </div>

          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @change-page="changePage"
          />
        </div>
      </div>

      <footer
        class="mt-auto pt-8 flex justify-between items-center flex-wrap gap-4 font-mono text-[10px] tracking-widest text-cyber-dim2 shrink-0"
      >
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-[0_0_8px_#00f0ff]"></div>
          ASSET//HUB · v22
        </div>
        <div class="flex items-center gap-4">
          <button
            class="flex items-center gap-1.5 hover:text-cyber-cyan transition-colors"
            @click="palette.open('help')"
          >
            <span class="border border-cyber-line2 rounded-sm px-1 bg-cyber-panel2 text-cyber-dim"
              >?</span
            >
            快捷键
          </button>
        </div>
      </footer>
    </main>
  </div>

  <CommandPalette
    ref="paletteEl"
    v-model="paletteVisible"
    :sites="sites"
    :commands="COMMANDS"
    @execute="executeCommand"
  />
  <ContextMenu
    ref="contextMenuEl"
    v-model="menuVisible"
    v-model:x="menuX"
    v-model:y="menuY"
    v-model:site="menuSite"
    :is-fav="menuSite ? favorites.includes(menuSite.url) : false"
    @action="onContextMenuAction"
  />
  <AppToast />
</template>

<style scoped>
.btn-random-group:hover .random-icon {
  transform: rotate(180deg) scale(1.1);
}
.random-icon {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
