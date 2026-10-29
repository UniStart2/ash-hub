import { describe, expect, it } from 'vitest';
import { applyCustomOrder, reorderUrls } from './reorder';

describe('reorderUrls', () => {
  // 全局序 A B C D E，第一页显示前 3 个（pageSize=3）
  const all = ['A', 'B', 'C', 'D', 'E'];

  it('页内首元素拖到末尾：A B C → B C A，全局序同步变化', () => {
    const result = reorderUrls(['A', 'B', 'C'], 0, 2, 0, all);
    expect(result.slice(0, 3)).toEqual(['B', 'C', 'A']);
    expect(result.slice(3)).toEqual(['D', 'E']);
  });

  it('页内末尾拖到首位：A B C → C A B', () => {
    const result = reorderUrls(['A', 'B', 'C'], 2, 0, 0, all);
    expect(result.slice(0, 3)).toEqual(['C', 'A', 'B']);
  });

  it('第二页（offset=3）内的拖动只影响窗口内位置，不越界', () => {
    const result = reorderUrls(['D', 'E'], 0, 1, 3, all);
    expect(result[3]).toBe('E');
    expect(result[4]).toBe('D');
  });

  it('customOrder 为空时以当前显示列表为基准', () => {
    const result = reorderUrls(['A', 'B', 'C'], 0, 1, 0, []);
    expect(result).toEqual(['B', 'A', 'C']);
  });

  it('起止同位或非法索引时不产生变化（返回原引用语义的新数组）', () => {
    expect(reorderUrls(['A', 'B'], 1, 1, 0, all)).toEqual(all);
    expect(reorderUrls(['A', 'B'], -1, 1, 0, all)).toEqual(all);
  });

  it('拖动后全局序仍是同一集合，无重复无丢失', () => {
    const result = reorderUrls(['A', 'B', 'C'], 0, 2, 0, all);
    expect([...result].sort()).toEqual([...all].sort());
    expect(result.length).toBe(all.length);
  });
});

describe('applyCustomOrder', () => {
  const sites = [{ url: 'a' }, { url: 'b' }, { url: 'c' }];

  it('按 customOrder 全量重排', () => {
    expect(applyCustomOrder(sites, ['c', 'a', 'b']).map((s) => s.url)).toEqual(['c', 'a', 'b']);
  });

  it('customOrder 为空时原样返回', () => {
    expect(applyCustomOrder(sites, [])).toEqual(sites);
  });

  it('未收录的站点排在已收录之后且相对顺序不变', () => {
    const more = [{ url: 'a' }, { url: 'x' }, { url: 'b' }, { url: 'y' }];
    expect(applyCustomOrder(more, ['b', 'a']).map((s) => s.url)).toEqual(['b', 'a', 'x', 'y']);
  });

  it('不修改入参数组', () => {
    const input = [...sites];
    applyCustomOrder(input, ['c', 'b', 'a']);
    expect(input.map((s) => s.url)).toEqual(['a', 'b', 'c']);
  });
});
