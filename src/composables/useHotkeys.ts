import { onMounted, onUnmounted } from 'vue';
import type { Site, ViewMode } from '../types';
import { toast } from './useToast';

export interface HotkeyDeps {
  search: { value: string };
  favOnly: { value: boolean };
  hasActiveFilters: { value: boolean };
  totalSites: { value: number };
  view: { value: ViewMode };
  searchInput: { value: HTMLInputElement | null };
  palette: { visible: boolean; open: (mode: 'cmd' | 'help') => void; close: () => void };
  contextMenu: { close: () => void };
  filteredFirst: () => Site | undefined;
  resetAll: () => void;
  openRandom: () => void;
}

/**
 * 全局快捷键，按键表与原型 v22 冻结一致：
 * Ctrl/Cmd+K 命令面板 · ? 帮助 · / 聚焦搜索 · Esc 逐层退出 · Enter 打开首个结果
 * R 随机 · G/L 网格/列表 · S 只看收藏
 *
 * 输入框聚焦时（isTyping）不触发单键快捷键；palette 打开时只响应 Esc。
 */
export function useHotkeys(deps: HotkeyDeps) {
  function onKeydown(e: KeyboardEvent) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '');

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      deps.palette.open('cmd');
      return;
    }

    if (deps.palette.visible) {
      if (e.key === 'Escape') {
        e.preventDefault();
        deps.palette.close();
      }
      return;
    }

    if (e.key === '?' && !isTyping) {
      e.preventDefault();
      deps.palette.open('help');
      return;
    }

    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      deps.searchInput.value?.focus();
    }
    if (e.key === 'Escape') {
      if (isTyping) (document.activeElement as HTMLElement | null)?.blur();
      if (deps.search.value) deps.search.value = '';
      else if (deps.hasActiveFilters.value) deps.resetAll();
      deps.contextMenu.close();
    }
    if (e.key === 'Enter' && isTyping && document.activeElement?.id === 'searchInput') {
      const first = deps.filteredFirst();
      if (deps.totalSites.value > 0 && first) {
        // 原型行为：回车直接打开，不记入最近访问
        toast(`打开首个结果 · ${first.name}`, 'ok');
        setTimeout(() => window.open(first.url, '_blank'), 300);
      }
    }
    if (e.key.toLowerCase() === 'r' && !isTyping && !e.repeat) deps.openRandom();
    if (e.key.toLowerCase() === 'g' && !isTyping) deps.view.value = 'grid';
    if (e.key.toLowerCase() === 'l' && !isTyping) deps.view.value = 'list';
    if (e.key.toLowerCase() === 's' && !isTyping) deps.favOnly.value = !deps.favOnly.value;
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
