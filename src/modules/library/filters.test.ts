import { describe, expect, it } from 'vitest';
import { filterAssets } from './filters';
import { MOCK_ASSETS } from './mock';

const NO_FILTER = { search: '', types: [], tags: [], favOnly: false, favorites: [] as string[] };

describe('filterAssets', () => {
  it('空筛选返回全量', () => {
    expect(filterAssets(MOCK_ASSETS, NO_FILTER).length).toBe(MOCK_ASSETS.length);
  });

  it('类型筛选为 OR：命中任一选中类型即保留', () => {
    const result = filterAssets(MOCK_ASSETS, { ...NO_FILTER, types: ['IMAGE'] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((a) => a.type === 'IMAGE')).toBe(true);
  });

  it('标签筛选为 AND：每个选中标签都必须命中', () => {
    const result = filterAssets(MOCK_ASSETS, { ...NO_FILTER, tags: ['赛博朋克'] });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((a) => expect(a.tags).toContain('赛博朋克'));
  });

  it('多标签 AND 无交集时返回空', () => {
    // 合成两条无交集标签的资产，不依赖 MOCK_ASSETS 内容（fixture 变化不应弄红此用例）
    const synthetic = [
      { ...MOCK_ASSETS[0], uuid: 'synthetic-1', tags: ['仙侠'] },
      { ...MOCK_ASSETS[0], uuid: 'synthetic-2', tags: ['机甲'] },
    ];
    expect(filterAssets(synthetic, { ...NO_FILTER, tags: ['仙侠', '机甲'] })).toEqual([]);
    expect(filterAssets(synthetic, { ...NO_FILTER, tags: ['仙侠'] }).length).toBe(1);
  });

  it('搜索多词为 AND 语义，命中名称/prompt/标签', () => {
    const byName = filterAssets(MOCK_ASSETS, { ...NO_FILTER, search: '灌灌 青丘' });
    expect(byName.map((a) => a.name)).toContain('青丘山神兽·灌灌');
    const byPrompt = filterAssets(MOCK_ASSETS, { ...NO_FILTER, search: '霓虹 机甲' });
    expect(byPrompt.map((a) => a.name)).toContain('霓虹夜市机甲巡游');
  });

  it('favOnly 只保留收藏集合内的资产', () => {
    const favs = [MOCK_ASSETS[0].uuid, MOCK_ASSETS[1].uuid];
    const result = filterAssets(MOCK_ASSETS, { ...NO_FILTER, favorites: favs, favOnly: true });
    expect(result.map((a) => a.uuid).sort()).toEqual([...favs].sort());
  });

  it('组合筛选取交集：类型 + 标签 + 搜索', () => {
    const result = filterAssets(MOCK_ASSETS, {
      ...NO_FILTER,
      types: ['IMAGE'],
      tags: ['水墨'],
      search: '概念',
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((a) => {
      expect(a.type).toBe('IMAGE');
      expect(a.tags).toContain('水墨');
      expect(`${a.name}${a.prompt ?? ''}${a.tags.join(' ')}`.toLowerCase()).toContain('概念');
    });
  });
});
