<script setup lang="ts">
import { computed } from 'vue';
import { Box, Image as ImageIcon, Music, Search, Star, Video } from 'lucide-vue-next';
import { MockAssetRepository } from './repository';
import { MOCK_ASSETS } from './mock';
import { useAssetLibrary } from './useAssetLibrary';
import { ASSET_TYPE_LABEL, type Asset, type AssetType } from './types';
import EmptyState from '../../components/EmptyState.vue';

// 数据经 Repository 载入；P1 为 mock 实现，真实实现替换时本组件零改动
const lib = useAssetLibrary(new MockAssetRepository(MOCK_ASSETS));
const {
  search,
  activeTypes,
  activeTags,
  favOnly,
  favorites,
  tagCounts,
  filteredAssets,
  assets: allAssets,
  toggleType,
  toggleTag,
  toggleFav,
  resetFilters,
} = lib;

const TYPE_ICONS = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  AUDIO: Music,
  MODEL: Box,
} as const;

const activeVersionOf = (a: Asset) => a.versions.find((v) => v.tag === a.currentVersion);

const hasFilters = computed(
  () =>
    !!search.value || activeTypes.value.length > 0 || activeTags.value.length > 0 || favOnly.value,
);

const typeFilters = (Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map((t) => ({
  type: t,
  label: ASSET_TYPE_LABEL[t],
  count: MOCK_ASSETS.filter((a) => a.type === t).length,
}));
</script>

<template>
  <div class="grid-floor"></div>
  <div class="glow-orb"></div>
  <div class="glow-orb pink"></div>
  <div class="noise"></div>

  <div
    class="relative z-10 grid grid-cols-1 lg:grid-cols-[272px_1fr] max-w-[1540px] mx-auto min-h-screen"
  >
    <aside
      class="sticky top-0 h-screen flex flex-col gap-6 p-6 border-r border-cyber-line bg-gradient-to-b from-[rgba(12,14,23,0.72)] to-[rgba(5,6,10,0.4)] backdrop-blur-md overflow-y-auto overflow-x-hidden"
    >
      <div class="flex flex-col gap-2 shrink-0">
        <span class="font-display text-[19px] font-bold tracking-tight text-white"
          >ASSET<span class="text-cyber-magenta italic">//</span>HUB</span
        >
        <div class="font-mono text-[10px] text-cyber-dim2 tracking-[0.18em] uppercase">
          asset library
        </div>
      </div>

      <div class="flex flex-col gap-2.5 shrink-0">
        <div
          class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
        >
          <span class="text-cyber-text font-semibold tracking-normal">类型</span>
          <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="f in typeFilters"
            :key="f.type"
            :class="
              activeTypes.includes(f.type)
                ? 'bg-cyber-cyan border-cyber-cyan text-[#02181a] font-bold shadow-cyber-cyan'
                : 'bg-transparent border-cyber-line text-cyber-dim hover:border-cyber-line2 hover:text-cyber-text hover:bg-white/5'
            "
            class="font-mono text-[11px] border rounded-sm px-2 py-1 flex items-center gap-1.5 transition-all"
            @click="toggleType(f.type)"
          >
            <span>{{ f.label }}</span
            ><span class="text-[9px] px-1 rounded-sm bg-black/20">{{ f.count }}</span>
          </button>
        </div>
      </div>

      <div v-if="Object.keys(tagCounts).length > 0" class="flex flex-col gap-2.5 shrink-0">
        <div
          class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
        >
          <span class="text-cyber-text font-semibold tracking-normal">标签</span>
          <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(count, tag) in tagCounts"
            :key="tag"
            :class="
              activeTags.includes(tag)
                ? 'bg-cyber-magenta border-cyber-magenta text-white font-bold shadow-cyber-magenta'
                : 'bg-transparent border-cyber-line text-cyber-dim hover:border-cyber-line2 hover:text-cyber-text hover:bg-white/5'
            "
            class="font-mono text-[11px] border rounded-sm px-2 py-1 flex items-center gap-1.5 transition-all"
            @click="toggleTag(tag)"
          >
            <span>{{ tag }}</span
            ><span class="text-[9px] px-1 rounded-sm bg-black/20">{{ count }}</span>
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
        @click="favOnly = !favOnly"
      >
        <span class="flex items-center gap-2"
          ><Star class="w-3.5 h-3.5" :fill="favOnly ? 'currentColor' : 'none'" /><span
            >只看收藏</span
          ></span
        ><span class="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-sm">{{ favorites.length }}</span>
      </button>
    </aside>

    <main class="flex flex-col p-6 lg:p-8 pb-16 min-w-0">
      <header class="flex flex-col gap-5 mb-6 shrink-0 relative z-20">
        <div class="flex flex-col gap-1.5">
          <h1
            class="font-display text-[clamp(26px,3.6vw,40px)] font-bold tracking-tighter text-white leading-none"
          >
            资产<span class="text-cyber-cyan">库</span>
          </h1>
          <div class="font-mono text-[11px] text-cyber-dim tracking-widest flex items-center gap-2">
            <div class="w-5 h-px bg-cyber-dim2"></div>
            多模态素材 · 版本溯源 ·
            <b class="text-cyber-cyan font-medium">{{ filteredAssets.length }}</b> 项
          </div>
        </div>

        <div
          class="relative flex items-center gap-3 h-[50px] px-4 bg-gradient-to-b from-cyber-panel2 to-cyber-panel border border-cyber-line rounded-sm transition-all group focus-within:border-cyber-cyan/50 focus-within:shadow-[0_0_30px_rgba(0,240,255,0.07)]"
        >
          <Search
            class="w-[15px] h-[15px] text-cyber-dim group-focus-within:text-cyber-cyan transition-colors shrink-0"
          />
          <input
            v-model="search"
            type="text"
            placeholder="搜索名称 / 提示词 / 标签（空格分词）…"
            class="flex-1 min-w-0 bg-transparent border-none outline-none text-white font-mono text-[13.5px] tracking-wide placeholder:text-cyber-dim2"
            autocomplete="off"
            spellcheck="false"
            @keydown.escape="search = ''"
          />
          <button
            v-show="search.length > 0"
            class="text-cyber-dim hover:text-cyber-magenta p-1 shrink-0"
            @click="search = ''"
          >
            ×
          </button>
        </div>

        <div
          class="flex items-center justify-between gap-3 flex-wrap font-mono text-[11px] tracking-wider px-0.5 min-h-[24px]"
        >
          <div class="flex items-center gap-2 text-cyber-dim">
            <div
              class="w-1.5 h-1.5 rounded-full bg-cyber-lime shadow-[0_0_10px_#c6ff00] animate-pulse"
            ></div>
            <span
              >MATCH <b class="text-cyber-lime font-medium">{{ filteredAssets.length }}</b>
              <span class="text-cyber-dim2">/</span> {{ allAssets.length }}</span
            >
          </div>
          <button
            v-show="hasFilters"
            class="bg-transparent border border-cyber-line2 rounded-sm text-cyber-dim hover:text-cyber-magenta hover:border-cyber-magenta/50 hover:bg-cyber-magenta/5 font-mono text-[10.5px] tracking-wider px-2.5 py-1 transition-all"
            @click="resetFilters"
          >
            RESET
          </button>
        </div>
      </header>

      <div
        v-if="filteredAssets.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 transition-all duration-300"
      >
        <div
          v-for="asset in filteredAssets"
          :key="asset.uuid"
          class="cyber-card card-anim group flex flex-col px-4 py-4 text-inherit"
        >
          <div class="relative z-10 flex flex-col h-full">
            <div class="flex items-center gap-2 mb-2.5">
              <span
                class="font-mono text-[9.5px] font-bold tracking-wider bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded-sm px-1.5 py-0.5 shrink-0"
              >
                {{ ASSET_TYPE_LABEL[asset.type] }}
              </span>
              <span
                class="font-mono text-[9.5px] text-cyber-dim2 border border-cyber-line rounded-sm px-1.5 py-0.5"
                >{{ asset.currentVersion }}</span
              >
              <span
                v-if="asset.source.engine"
                class="font-mono text-[9px] text-cyber-dim truncate"
                >{{ asset.source.engine }}</span
              >
              <button
                class="ml-auto p-1 rounded-sm transition-colors shrink-0"
                :class="
                  favorites.includes(asset.uuid)
                    ? 'text-cyber-gold'
                    : 'text-cyber-dim2 hover:text-cyber-gold hover:bg-cyber-gold/10'
                "
                @click="toggleFav(asset.uuid)"
              >
                <Star
                  class="w-3.5 h-3.5"
                  :fill="favorites.includes(asset.uuid) ? 'currentColor' : 'none'"
                />
              </button>
            </div>

            <div
              class="relative h-[120px] mb-3 rounded-sm border border-cyber-line bg-gradient-to-br from-cyber-panel3 to-cyber-panel overflow-hidden flex items-center justify-center"
            >
              <component
                :is="TYPE_ICONS[asset.type]"
                class="w-8 h-8 text-cyber-dim2 group-hover:text-cyber-cyan transition-colors"
              />
              <span class="absolute bottom-1.5 right-2 font-mono text-[9px] text-cyber-dim2">{{
                activeVersionOf(asset)?.format
              }}</span>
            </div>

            <h3
              class="font-display text-[15px] font-bold text-white leading-tight mb-1 group-hover:text-cyber-cyan transition-colors truncate"
            >
              {{ asset.name }}
            </h3>
            <p
              v-if="asset.prompt"
              class="font-display text-[11.5px] leading-relaxed text-[#8892a4] mb-2.5 line-clamp-2 flex-1"
            >
              {{ asset.prompt }}
            </p>
            <div class="flex flex-wrap gap-1 pt-2.5 border-t border-white/5">
              <span
                v-for="tag in asset.tags"
                :key="tag"
                class="font-mono text-[9.5px] tracking-wide bg-white/5 text-cyber-dim border border-transparent rounded-sm px-1.5 py-0.5 cursor-pointer hover:bg-white/10 hover:text-cyber-text transition-colors"
                @click="toggleTag(tag)"
                >{{ tag }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="favOnly && favorites.length === 0"
        alert-code="ERR_0x454D505459"
        headline="EMPTY_COLLECTION"
        :lines="['资产收藏库为空。']"
      >
        <template #actions> 点击卡片右上角星标即可添加收藏 </template>
      </EmptyState>

      <EmptyState
        v-else-if="filteredAssets.length === 0"
        alert-code="ERR_0x4E4F5F"
        headline="NO_ASSET_FOUND"
        :lines="['没有匹配的资产，请检查输入。']"
      >
        <template #actions>
          没有找到匹配的资产 ·
          <button class="text-cyber-cyan hover:underline" @click="resetFilters">清空筛选</button>
        </template>
      </EmptyState>
    </main>
  </div>
</template>
