/** 与原型一致：转义后按空格分词高亮，长词优先，大小写不敏感 */
export function highlight(text: string, search: string): string {
  const esc = String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
  const queryParts = search.split(/\s+/).filter(Boolean);
  if (queryParts.length === 0) return esc;

  try {
    const escapedParts = queryParts
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);
    const re = new RegExp('(' + escapedParts.join('|') + ')', 'gi');
    return esc.replace(re, '<mark class="hl">$1</mark>');
  } catch {
    return esc;
  }
}
