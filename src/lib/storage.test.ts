import { beforeEach, describe, expect, it } from 'vitest';
import { readJson, STORAGE_KEYS } from './storage';

describe('readJson', () => {
  beforeEach(() => localStorage.clear());

  it('键缺失时返回 fallback', () => {
    expect(readJson(STORAGE_KEYS.favs, [] as string[])).toEqual([]);
  });

  it('原值损坏时返回 fallback 而不抛错', () => {
    localStorage.setItem(STORAGE_KEYS.favs, '{broken');
    expect(readJson(STORAGE_KEYS.favs, [] as string[])).toEqual([]);
  });

  it('旧前缀 ah_* 有值、新键缺失时接管旧值并复制到新键', () => {
    localStorage.setItem('ah_favs', JSON.stringify(['https://a.dev']));

    expect(readJson(STORAGE_KEYS.favs, [] as string[])).toEqual(['https://a.dev']);
    expect(localStorage.getItem(STORAGE_KEYS.favs)).toBe('["https://a.dev"]');
    // 旧键保留：回滚到旧版本时数据仍在
    expect(localStorage.getItem('ah_favs')).toBe('["https://a.dev"]');
  });

  it('新键已有值时优先于旧键，不再迁移', () => {
    localStorage.setItem('ah_favs', JSON.stringify(['https://old.dev']));
    localStorage.setItem(STORAGE_KEYS.favs, JSON.stringify(['https://new.dev']));

    expect(readJson(STORAGE_KEYS.favs, [] as string[])).toEqual(['https://new.dev']);
  });

  it('四类键各自的旧前缀都能迁移', () => {
    localStorage.setItem('ah_recent', JSON.stringify([{ name: 'A', url: 'a' }]));
    localStorage.setItem('ah_custom_order', JSON.stringify(['a', 'b']));
    localStorage.setItem('ah_assets_favs', JSON.stringify(['uuid-1']));

    expect(readJson(STORAGE_KEYS.recent, [])).toHaveLength(1);
    expect(readJson(STORAGE_KEYS.customOrder, [])).toEqual(['a', 'b']);
    expect(readJson(STORAGE_KEYS.assetFavs, [])).toEqual(['uuid-1']);
  });

  it('两域键零交叉：站点收藏不落到资产键', () => {
    localStorage.setItem('ah_favs', JSON.stringify(['https://a.dev']));
    readJson(STORAGE_KEYS.favs, [] as string[]);

    expect(localStorage.getItem(STORAGE_KEYS.assetFavs)).toBeNull();
  });
});
