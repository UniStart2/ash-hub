import { describe, expect, it } from 'vitest';
import { filterSites, getDomain } from './filter';
import { SITES, markNewSites } from '../data/sites';
import type { ActiveFilters } from '../types';

const NO_FILTERS = (): ActiveFilters => ({ types: [], licenses: [], registers: [] });

const baseOpts = {
  favOnly: false,
  activeFilters: NO_FILTERS(),
  favorites: [] as string[],
  customOrder: [] as string[],
  sort: 'rec' as const,
};

describe('filterSites', () => {
  it('无筛选时 featured 全部排在非 featured 之前，各自按名称升序', () => {
    const result = filterSites(SITES, { ...baseOpts, search: '' });
    expect(result.length).toBe(SITES.length);
    const featuredCount = SITES.filter((s) => s.featured).length;
    const head = result.slice(0, featuredCount);
    const tail = result.slice(featuredCount);
    expect(head.every((s) => s.featured)).toBe(true);
    expect(tail.every((s) => !s.featured)).toBe(true);
    for (let i = 1; i < result.length; i++) {
      const prevFeatured = result[i - 1].featured ? 1 : 0;
      const curFeatured = result[i].featured ? 1 : 0;
      if (prevFeatured === curFeatured) {
        // localeCompare 大小写不敏感，与实现保持一致
        expect(result[i].name.localeCompare(result[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('搜索命中名称的排在只命中描述的前面（评分排序）', () => {
    const result = filterSites(SITES, { ...baseOpts, search: 'kenney' });
    expect(result[0]?.name).toBe('Kenney');
  });

  it('多词搜索要求全部命中（AND 语义）', () => {
    const result = filterSites(SITES, { ...baseOpts, search: 'cc0 低多边形' });
    expect(result.length).toBeGreaterThan(0);
    // AND：每个结果的匹配域必须同时包含所有分词
    result.forEach((s) => {
      const haystack = `${s.name} ${s.desc} ${s.tags.join(' ')} ${s.url}`.toLowerCase();
      expect(haystack).toContain('cc0');
      expect(haystack).toContain('低多边形');
    });
  });

  it('类型筛选为 OR：命中任一选中类型即保留', () => {
    const result = filterSites(SITES, {
      ...baseOpts,
      search: '',
      activeFilters: { ...NO_FILTERS(), types: ['font'] },
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.types.includes('font'))).toBe(true);
  });

  it('许可 + 注册组合筛选取交集', () => {
    const result = filterSites(SITES, {
      ...baseOpts,
      search: '',
      activeFilters: { ...NO_FILTERS(), licenses: ['cc0'], registers: ['none'] },
    });
    expect(result.every((s) => s.license === 'cc0' && s.register === 'none')).toBe(true);
  });

  it('favOnly 只保留收藏集合内的站点', () => {
    const fav = ['https://kenney.nl/assets', 'https://polyhaven.com'];
    const result = filterSites(SITES, { ...baseOpts, search: '', favorites: fav, favOnly: true });
    expect(result.map((s) => s.url).sort()).toEqual([...fav].sort());
  });

  it('有搜索词时忽略 sort 与 customOrder，纯按评分', () => {
    const customOrder = [SITES[5].url, SITES[0].url];
    const result = filterSites(SITES, { ...baseOpts, search: 'cc0', customOrder });
    // 评分排序不受自定义顺序影响：首位应是名称精确/包含匹配权重最高者
    expect(result.length).toBeGreaterThan(1);
    const nameHit = result.findIndex((s) => s.name.toLowerCase().includes('cc0'));
    const descHit = result.findIndex(
      (s) => !s.name.toLowerCase().includes('cc0') && s.desc.toLowerCase().includes('cc0'),
    );
    if (nameHit !== -1 && descHit !== -1) expect(nameHit).toBeLessThan(descHit);
  });

  it('az 排序按名称 localeCompare，featured 不再优先', () => {
    const result = filterSites(SITES, { ...baseOpts, search: '', sort: 'az' });
    expect(result[0].name).toBe('3D Textures');
    expect(result[1].name).toBe('ambientCG');
  });

  it('customOrder 决定 rec 排序，未收录的站点排在已收录之后', () => {
    const ordered = [...SITES].reverse().map((s) => s.url);
    const result = filterSites(SITES, { ...baseOpts, search: '', customOrder: ordered });
    expect(result.map((s) => s.url)).toEqual(ordered);
  });

  it('空结果：不匹配的搜索返回空数组', () => {
    expect(filterSites(SITES, { ...baseOpts, search: 'zzz-no-such-keyword' })).toEqual([]);
  });
});

describe('getDomain', () => {
  it('去掉 www 前缀并返回主机名', () => {
    expect(getDomain('https://www.gameart2d.com/freebies.html')).toBe('gameart2d.com');
  });
  it('非法 URL 原样返回', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url');
  });
});

describe('markNewSites', () => {
  it('7 天内的 addedAt 标记 isNew，无 addedAt 为 false', () => {
    const now = new Date('2026-10-29T00:00:00Z').getTime();
    const sites = markNewSites(
      [
        {
          name: 'a',
          url: 'https://a.com',
          desc: '',
          types: [],
          license: 'cc0',
          register: 'none',
          tags: [],
          addedAt: '2026-10-25T00:00:00Z',
        },
        {
          name: 'b',
          url: 'https://b.com',
          desc: '',
          types: [],
          license: 'cc0',
          register: 'none',
          tags: [],
        },
      ],
      now,
    );
    expect(sites[0].isNew).toBe(true);
    expect(sites[1].isNew).toBe(false);
  });
});
