import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Site } from '../types';
import { reorderUrls } from '../lib/reorder';

/**
 * 拖拽排序状态与手势处理，重排数学在 lib/reorder.ts（纯函数，已单测）。
 * 与原型一致：仅「推荐排序 + 无搜索 + 无筛选」时允许拖拽，
 * customOrder 持久化到 ah_custom_order，切换视图/排序/筛选时清理拖拽态。
 */
export function useDragSort(deps: {
  displayedSites: { value: Site[] };
  customOrder: { value: string[] };
  sort: { value: string };
  search: { value: string };
  hasActiveFilters: { value: boolean };
  currentPage: { value: number };
  pageSize: { value: number };
}) {
  const isDragging = ref(false);
  const draggedIndex = ref(-1);

  /** 仅默认排序且无任何过滤时开放拖拽，保证列表即全局序的可见窗口 */
  const isDragEnabled = computed(
    () => deps.sort.value === 'rec' && !deps.search.value && !deps.hasActiveFilters.value,
  );

  function clearDragClasses() {
    document.querySelectorAll('.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
    document.querySelectorAll('.drag-target').forEach((el) => el.classList.remove('drag-target'));
  }

  function clearDragState() {
    isDragging.value = false;
    draggedIndex.value = -1;
    clearDragClasses();
  }

  function onDragStart(e: DragEvent, i: number) {
    if (!isDragEnabled.value) {
      e.preventDefault();
      return;
    }
    isDragging.value = true;
    draggedIndex.value = i;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', String(i));
    // 延迟加类，避免拖动幽灵图立即带上半透明样式
    setTimeout(() => (e.target as HTMLElement).classList.add('is-dragging'), 0);
  }

  function onDragEnd(e: DragEvent) {
    isDragging.value = false;
    (e.target as HTMLElement).classList.remove('is-dragging');
    clearDragClasses();
  }

  function onDragOver(e: DragEvent, i: number) {
    if (!isDragging.value || draggedIndex.value === i) return;
    (e.currentTarget as HTMLElement).classList.add('drag-target');
  }

  function onDragLeave(e: DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove('drag-target');
  }

  function onDrop(e: DragEvent, targetIndex: number) {
    (e.currentTarget as HTMLElement).classList.remove('drag-target');
    const from = draggedIndex.value;
    if (!isDragging.value || from === -1 || from === targetIndex) return;

    const displayedUrls = deps.displayedSites.value.map((s) => s.url);
    const nextOrder = reorderUrls(
      displayedUrls,
      from,
      targetIndex,
      (deps.currentPage.value - 1) * deps.pageSize.value,
      deps.customOrder.value,
    );
    deps.customOrder.value = nextOrder;
    localStorage.setItem('ah_custom_order', JSON.stringify(nextOrder));
    clearDragState();
  }

  // 兜底：任何位置松开鼠标都立即清理拖拽态，防止状态泄漏（原型同款）
  function onWindowDragEnd() {
    clearDragState();
  }

  onMounted(() => window.addEventListener('dragend', onWindowDragEnd));
  onUnmounted(() => window.removeEventListener('dragend', onWindowDragEnd));

  return {
    isDragging,
    draggedIndex,
    isDragEnabled,
    clearDragState,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
