/**
 * 拖拽重排为纯函数，便于测试：把「当前页显示列表内 fromIdx → toIdx」的拖动
 * 映射为全局 customOrder（url 数组）的新顺序。
 *
 * 与 prototype/base.html v22 handleDrop 的交换逻辑逐行对齐：
 * 以当前页为窗口，把窗口内元素逐个摆到目标位置，与原全局序做交换。
 */
export function reorderUrls(
  displayedUrls: string[],
  fromIdx: number,
  toIdx: number,
  pageStartOffset: number,
  customOrder: string[],
): string[] {
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return customOrder;

  const next = [...displayedUrls];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);

  // 全局序为空（从未拖拽过）时以传入的全量 url 列表为基准
  const newGlobalOrder = customOrder.length > 0 ? [...customOrder] : [...displayedUrls];

  next.forEach((url, idx) => {
    const globalIdx = newGlobalOrder.indexOf(url);
    const targetIdx = pageStartOffset + idx;
    if (globalIdx !== -1 && targetIdx < newGlobalOrder.length) {
      const tmp = newGlobalOrder[targetIdx];
      newGlobalOrder[targetIdx] = newGlobalOrder[globalIdx];
      newGlobalOrder[globalIdx] = tmp;
    }
  });

  return newGlobalOrder;
}

/** customOrder 非空时按它排序全量站点；未收录的站点保持相对原位（原型 init 行为） */
export function applyCustomOrder<T extends { url: string }>(
  sites: T[],
  customOrder: string[],
): T[] {
  if (customOrder.length === 0) return sites;
  return [...sites].sort((a, b) => {
    const idxA = customOrder.indexOf(a.url);
    const idxB = customOrder.indexOf(b.url);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}
