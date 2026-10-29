<script setup lang="ts">
import type { Site, ViewMode } from '../types';
import { LICENSE_LABEL, REGISTER_LABEL, TYPE_LABEL } from '../data/labels';
import { getDomain } from '../lib/filter';
import { highlight } from '../lib/highlight';

defineProps<{
  site: Site;
  /** 当前页内的下标，拖拽手势使用 */
  index: number;
  /** 全局序号（含页偏移），仅用于卡片左上角编号展示 */
  displayIndex: number;
  view: ViewMode;
  favorites: string[];
  search: string;
  isDragEnabled: boolean;
}>();

const emit = defineEmits<{
  toggleFav: [site: Site];
  open: [site: Site];
  tagClick: [tag: string];
  typeClick: [type: string];
  copy: [site: Site];
  contextMenu: [e: MouseEvent, site: Site];
  dragStart: [e: DragEvent, i: number];
  dragEnd: [e: DragEvent];
  dragOver: [e: DragEvent, i: number];
  dragLeave: [e: DragEvent];
  drop: [e: DragEvent, i: number];
}>();

function onMouseMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', e.clientX - r.left + 'px');
  el.style.setProperty('--my', e.clientY - r.top + 'px');
}

const licBadgeClass: Record<Site['license'], string> = {
  cc0: 'bg-[rgba(0,240,255,0.14)] text-cyber-cyan border-[rgba(0,240,255,0.3)]',
  'cc-by': 'bg-[rgba(255,184,0,0.13)] text-cyber-amber border-[rgba(255,184,0,0.3)]',
  'free-commercial': 'bg-[rgba(198,255,0,0.12)] text-cyber-lime border-[rgba(198,255,0,0.28)]',
  mixed: 'bg-[rgba(255,46,136,0.12)] text-cyber-magenta border-[rgba(255,46,136,0.28)]',
};

const licTextClass: Record<Site['license'], string> = {
  cc0: 'text-cyber-cyan',
  'cc-by': 'text-cyber-amber',
  'free-commercial': 'text-cyber-lime',
  mixed: 'text-cyber-magenta',
};
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- 搜索高亮依赖 v-html，但 highlight() 始终先转义原文再插入 <mark>，输出无注入风险 -->
  <a
    :href="site.url"
    target="_blank"
    rel="noopener noreferrer"
    :data-lic="site.license"
    :draggable="isDragEnabled"
    :class="[
      view === 'list' ? 'flex-row items-center px-4 py-2.5 gap-3' : 'flex-col px-4 py-4',
      isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
    ]"
    class="cyber-card card-anim group flex rounded-sm text-inherit no-underline context-card"
    @click="emit('open', site)"
    @mousemove="onMouseMove"
    @dragstart="emit('dragStart', $event, index)"
    @dragend="emit('dragEnd', $event)"
    @dragover.prevent="emit('dragOver', $event, index)"
    @dragleave="emit('dragLeave', $event)"
    @drop.prevent="emit('drop', $event, index)"
    @contextmenu.prevent.stop="emit('contextMenu', $event, site)"
  >
    <span class="card-spotlight"></span>

    <div v-show="view === 'grid'" class="flex flex-col h-full w-full relative z-10">
      <div class="flex items-center gap-2 mb-2.5 w-full">
        <span class="font-mono text-[10px] text-cyber-dim2 tracking-widest shrink-0"
          >// <b class="text-cyber-dim">{{ String(displayIndex + 1).padStart(2, '0') }}</b></span
        >
        <div class="ml-auto flex items-center gap-1 overflow-hidden justify-end">
          <span
            v-if="site.isNew"
            class="font-mono text-[8.5px] font-bold tracking-wider bg-cyber-violet/15 text-cyber-violet border border-cyber-violet/30 rounded-sm px-1.5 py-0.5 shrink-0"
            >NEW</span
          >
          <span
            v-if="site.featured"
            class="font-mono text-[8.5px] font-bold tracking-wider bg-cyber-gold/15 text-cyber-gold border border-cyber-gold/30 rounded-sm px-1.5 py-0.5 shrink-0"
            >★ 推荐</span
          >
          <span
            :class="licBadgeClass[site.license]"
            class="font-mono text-[9.5px] font-bold tracking-wider border rounded-sm px-1.5 py-0.5 whitespace-nowrap shrink-0"
            >{{ LICENSE_LABEL[site.license] }}</span
          >
        </div>
        <div class="flex items-center gap-1 shrink-0 ml-1 pl-1.5 border-l border-cyber-line2">
          <button
            :class="
              favorites.includes(site.url)
                ? 'text-cyber-gold'
                : 'text-cyber-dim2 hover:text-cyber-gold'
            "
            class="w-[22px] h-[22px] flex items-center justify-center rounded-sm hover:bg-cyber-gold/10 transition-colors p-0"
            @click.prevent.stop="emit('toggleFav', site)"
          >
            <svg
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              :fill="favorites.includes(site.url) ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </svg>
          </button>
          <button
            class="w-[22px] h-[22px] flex items-center justify-center rounded-sm text-cyber-dim2 hover:bg-cyber-cyan/20 hover:text-cyber-cyan transition-colors p-0 opacity-0 group-hover:opacity-100"
            @click.prevent.stop="emit('contextMenu', $event, site)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>

      <h3
        class="font-display text-[16.5px] font-bold text-white leading-tight mb-1 group-hover:text-cyber-cyan transition-colors"
        v-html="highlight(site.name, search)"
      ></h3>
      <div
        class="flex items-center gap-1.5 font-mono text-[10px] text-cyber-dim tracking-wide mb-2.5"
      >
        <span>{{ getDomain(site.url) }}</span
        ><span class="w-0.5 h-0.5 rounded-full bg-cyber-dim2"></span
        ><span class="text-cyber-dim2">{{ REGISTER_LABEL[site.register] }}</span>
      </div>
      <p
        class="font-display text-[12.5px] leading-relaxed text-[#8892a4] flex-1 mb-3 line-clamp-2"
        v-html="highlight(site.desc, search)"
      ></p>
      <div class="flex flex-wrap gap-1 mb-3.5">
        <span
          v-for="t in site.types"
          :key="t"
          class="font-mono text-[9.5px] tracking-wide bg-[rgba(0,240,255,0.07)] text-cyber-cyan border border-[rgba(0,240,255,0.14)] rounded-sm px-1.5 py-0.5 cursor-pointer hover:bg-[rgba(0,240,255,0.15)] hover:border-cyber-cyan transition-colors whitespace-nowrap"
          @click.prevent.stop="emit('typeClick', t)"
          >{{ TYPE_LABEL[t] }}</span
        >
        <span
          v-for="tag in site.tags.slice(0, 3)"
          :key="tag"
          class="font-mono text-[9.5px] tracking-wide bg-white/5 text-cyber-dim border border-transparent rounded-sm px-1.5 py-0.5 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-cyber-text transition-colors"
          @click.prevent.stop="emit('tagClick', tag)"
          >{{ tag }}</span
        >
      </div>
      <div
        class="flex gap-1.5 pt-3 border-t border-white/5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
      >
        <div
          class="flex-1 flex items-center justify-center gap-1.5 border border-cyber-line2 text-cyber-dim font-mono text-[10.5px] tracking-wider rounded-sm py-1.5 group-hover:text-cyber-cyan group-hover:border-cyber-cyan/45 group-hover:bg-cyber-cyan/5 transition-all"
        >
          打开
        </div>
        <button
          class="flex-1 flex items-center justify-center gap-1.5 border border-cyber-line2 text-cyber-dim font-mono text-[10.5px] tracking-wider rounded-sm py-1.5 hover:text-cyber-lime hover:border-cyber-lime/45 hover:bg-cyber-lime/5 transition-all"
          @click.prevent="emit('copy', site)"
        >
          复制
        </button>
      </div>
    </div>

    <div v-show="view === 'list'" class="flex items-center gap-3 w-full relative z-10">
      <div class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="site.featured"
          class="w-1.5 h-1.5 rounded-full bg-cyber-gold shadow-[0_0_8px_#ffd166]"
          title="推荐"
        ></span>
        <span
          :class="licTextClass[site.license]"
          class="font-mono text-[9.5px] font-bold tracking-wider whitespace-nowrap"
          >{{ LICENSE_LABEL[site.license] }}</span
        >
      </div>
      <h3
        class="font-display text-[14px] font-bold text-white group-hover:text-cyber-cyan transition-colors min-w-[150px] truncate"
        v-html="highlight(site.name, search)"
      ></h3>
      <div class="flex items-center gap-1.5 font-mono text-[10px] text-cyber-dim tracking-wide">
        <span>{{ getDomain(site.url) }}</span
        ><span class="w-0.5 h-0.5 rounded-full bg-cyber-dim2"></span
        ><span class="text-cyber-dim2">{{ REGISTER_LABEL[site.register] }}</span>
      </div>
      <div
        class="ml-auto flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          :class="
            favorites.includes(site.url)
              ? 'text-cyber-gold'
              : 'text-cyber-dim hover:text-cyber-gold'
          "
          class="p-1 hover:bg-cyber-gold/10 rounded-sm transition-colors"
          @click.prevent.stop="emit('toggleFav', site)"
        >
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            :fill="favorites.includes(site.url) ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
        </button>
        <button
          class="p-1 text-cyber-dim hover:text-cyber-lime hover:bg-cyber-lime/10 rounded-sm transition-colors"
          @click.prevent="emit('copy', site)"
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
        <button
          class="p-1 text-cyber-dim hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-sm transition-colors"
          @click.prevent.stop="emit('contextMenu', $event, site)"
        >
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>
    </div>
  </a>
</template>
