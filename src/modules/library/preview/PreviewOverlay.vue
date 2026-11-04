<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Music, Star, X } from 'lucide-vue-next';
import { ASSET_TYPE_LABEL, type Asset, type AssetVersion } from '../types';
import { LICENSE_LABEL } from '../../../data/labels';
import type { License } from '../../../types';
import VersionRail from './VersionRail.vue';

const props = defineProps<{
  asset: Asset;
  activeVersion: AssetVersion;
  activeTag: string;
  versions: AssetVersion[];
  favorited: boolean;
  hasPrev: boolean;
  hasNext: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'select-version': [tag: string];
  step: [dir: -1 | 1];
  'toggle-favorite': [];
}>();

const root = ref<HTMLElement | null>(null);
const mediaEl = ref<HTMLVideoElement | HTMLAudioElement | null>(null);
const mediaError = ref(false);

// 换版本：先静音停播再换源，失败态复位
watch(
  () => props.activeVersion.url,
  () => {
    mediaEl.value?.pause();
    mediaError.value = false;
  },
);

let scrollY = 0;
let restoreFocus: HTMLElement | null = null;

function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName ?? '';
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

  if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
    return;
  }

  if (e.key === 'Tab') {
    trapFocus(e);
    return;
  }

  if (isTyping) return;

  // 方向键与侧栏竖直列表同向：上 = 更新，下 = 更旧
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (props.hasPrev) emit('step', -1);
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (props.hasNext) emit('step', 1);
    return;
  }

  if (e.key === ' ' && mediaEl.value && tag !== 'BUTTON') {
    e.preventDefault();
    if (mediaEl.value.paused) void mediaEl.value.play();
    else mediaEl.value.pause();
  }
}

/** 焦点陷阱：可聚焦元素少，Tab 到边界即回环 */
function trapFocus(e: KeyboardEvent) {
  const nodes = root.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], audio, video, [tabindex]:not([tabindex="-1"])',
  );
  if (!nodes || nodes.length === 0) return;
  const list = Array.from(nodes);
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;

  if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && (active === first || active === root.value)) {
    e.preventDefault();
    last.focus();
  }
}

onMounted(() => {
  scrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  restoreFocus = document.activeElement as HTMLElement | null;
  root.value?.focus();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  mediaEl.value?.pause();
  document.body.style.overflow = '';
  window.scrollTo(0, scrollY);
  window.removeEventListener('keydown', onKeydown);
  restoreFocus?.focus();
});
</script>

<template>
  <div
    ref="root"
    role="dialog"
    aria-modal="true"
    :aria-label="asset.name"
    tabindex="-1"
    class="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-[rgba(3,4,8,0.86)] backdrop-blur-sm outline-none"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-[1200px] max-h-[88vh] grid grid-cols-1 lg:grid-cols-[1fr_340px] border border-cyber-line bg-cyber-panel rounded-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
    >
      <!-- 媒体区 -->
      <div
        class="relative flex items-center justify-center bg-black/40 min-h-[260px] overflow-hidden"
      >
        <template v-if="!mediaError && activeVersion">
          <img
            v-if="asset.type === 'IMAGE'"
            :src="activeVersion.url"
            :alt="asset.name"
            class="max-h-[80vh] max-w-full object-contain"
            @error="mediaError = true"
          />
          <video
            v-else-if="asset.type === 'VIDEO'"
            ref="mediaEl"
            :src="activeVersion.url"
            controls
            playsinline
            class="max-h-[80vh] w-full"
            @error="mediaError = true"
          ></video>
          <audio
            v-else-if="asset.type === 'AUDIO'"
            ref="mediaEl"
            :src="activeVersion.url"
            controls
            class="w-3/4"
            @error="mediaError = true"
          ></audio>
          <div
            v-else
            class="flex flex-col items-center gap-2 font-mono text-[11px] text-cyber-dim2"
          >
            <Music class="w-8 h-8" />
            <span>3D 预览未实现（P2 非目标）</span>
            <span class="text-[10px]"
              >{{ activeVersion.format }} · {{ activeVersion.meta.size }}</span
            >
          </div>
        </template>

        <div v-else class="flex flex-col items-center gap-2 font-mono text-[11px] text-center px-6">
          <span class="text-cyber-magenta tracking-widest">ERR_MEDIA_UNAVAILABLE</span>
          <span class="text-cyber-dim2 text-[10px]">资源无法加载，可直接访问源地址</span>
          <a
            v-if="activeVersion"
            :href="activeVersion.url"
            target="_blank"
            rel="noreferrer"
            class="text-cyber-cyan hover:underline text-[11px]"
            >打开源地址 ↗</a
          >
        </div>
      </div>

      <!-- 元数据侧栏 -->
      <aside
        class="flex flex-col gap-4 p-5 border-t lg:border-t-0 lg:border-l border-cyber-line bg-cyber-panel overflow-y-auto"
      >
        <header class="flex items-start gap-2">
          <div class="flex flex-col gap-1 min-w-0">
            <h2 class="font-display text-[17px] font-bold text-white leading-tight">
              {{ asset.name }}
            </h2>
            <div class="flex items-center gap-1.5 font-mono text-[9.5px]">
              <span
                class="bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded-sm px-1.5 py-0.5"
                >{{ ASSET_TYPE_LABEL[asset.type] }}</span
              >
              <span class="text-cyber-dim2 border border-cyber-line rounded-sm px-1.5 py-0.5">{{
                activeTag
              }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 ml-auto shrink-0">
            <button
              :class="favorited ? 'text-cyber-gold' : 'text-cyber-dim2 hover:text-cyber-gold'"
              class="p-1 rounded-sm transition-colors hover:bg-cyber-gold/10"
              :title="favorited ? '取消收藏' : '收藏'"
              @click="emit('toggle-favorite')"
            >
              <Star class="w-4 h-4" :fill="favorited ? 'currentColor' : 'none'" />
            </button>
            <button
              class="p-1 rounded-sm text-cyber-dim2 hover:text-cyber-magenta transition-colors hover:bg-white/5"
              title="关闭 (Esc)"
              @click="emit('close')"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </header>

        <VersionRail
          :versions="versions"
          :active-tag="activeTag"
          @select="emit('select-version', $event)"
        />

        <!-- 溯源护照 -->
        <section class="flex flex-col gap-2">
          <div
            class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
          >
            <span class="text-cyber-text font-semibold tracking-normal">来源</span>
            <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
          </div>
          <dl class="grid grid-cols-[72px_1fr] gap-y-1 font-mono text-[10.5px]">
            <dt class="text-cyber-dim2">类型</dt>
            <dd class="text-cyber-text">{{ asset.source.type }}</dd>
            <template v-if="asset.source.engine">
              <dt class="text-cyber-dim2">引擎</dt>
              <dd class="text-cyber-text">{{ asset.source.engine }}</dd>
            </template>
            <template v-if="asset.source.account">
              <dt class="text-cyber-dim2">账号</dt>
              <dd class="text-cyber-text">{{ asset.source.account }}</dd>
            </template>
          </dl>
          <p
            v-if="asset.prompt"
            class="font-display text-[11px] leading-relaxed text-[#8892a4] whitespace-pre-line border-l border-cyber-line2 pl-2.5"
          >
            {{ asset.prompt }}
          </p>
        </section>

        <!-- 许可 -->
        <section v-if="asset.license" class="flex flex-col gap-2">
          <div
            class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
          >
            <span class="text-cyber-text font-semibold tracking-normal">许可</span>
            <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
          </div>
          <div class="flex items-center gap-2 font-mono text-[11px]">
            <span
              class="bg-cyber-lime/10 text-cyber-lime border border-cyber-lime/30 rounded-sm px-1.5 py-0.5"
              >{{ LICENSE_LABEL[asset.license as License] ?? asset.license }}</span
            >
            <span v-if="asset.license === 'cc-by'" class="text-[10px] text-cyber-amber"
              >需署名</span
            >
          </div>
        </section>

        <!-- 版本元数据 -->
        <section v-if="activeVersion" class="flex flex-col gap-2">
          <div
            class="flex items-center font-mono text-[10.5px] uppercase tracking-widest text-cyber-dim"
          >
            <span class="text-cyber-text font-semibold tracking-normal">
              {{ activeTag }} 参数
            </span>
            <div class="flex-1 h-px ml-2.5 bg-gradient-to-r from-cyber-line2 to-transparent"></div>
          </div>
          <dl class="grid grid-cols-[72px_1fr] gap-y-1 font-mono text-[10.5px]">
            <dt class="text-cyber-dim2">格式</dt>
            <dd class="text-cyber-text">{{ activeVersion.format }}</dd>
            <template v-for="(value, key) in activeVersion.meta" :key="key">
              <dt class="text-cyber-dim2 truncate">{{ key }}</dt>
              <dd class="text-cyber-text truncate">{{ value }}</dd>
            </template>
          </dl>
        </section>

        <p class="mt-auto font-mono text-[9.5px] text-cyber-dim2 tracking-wider">
          {{ asset.projectRefs.length ? `关联项目 ${asset.projectRefs.length}` : '未关联项目' }}
        </p>
      </aside>
    </div>
  </div>
</template>
