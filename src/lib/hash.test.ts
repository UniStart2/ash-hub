import { describe, expect, it } from 'vitest';
import { buildHash, parseHash, type HashState } from './hash';

describe('parseHash', () => {
  it('空 hash 返回空状态', () => {
    expect(parseHash('')).toEqual({
      search: '',
      favOnly: false,
      filters: { types: [], licenses: [], registers: [] },
    });
  });

  it('解析完整状态：q + fav + 三维筛选', () => {
    const state = parseHash('#q=kenney&fav=1&types=2d,audio&licenses=cc0&registers=none');
    expect(state.search).toBe('kenney');
    expect(state.favOnly).toBe(true);
    expect(state.filters.types).toEqual(['2d', 'audio']);
    expect(state.filters.licenses).toEqual(['cc0']);
    expect(state.filters.registers).toEqual(['none']);
  });

  it('缺字段时保持默认，fav 值非 1 视为 false', () => {
    const state = parseHash('#types=font&fav=yes');
    expect(state.search).toBe('');
    expect(state.favOnly).toBe(false);
    expect(state.filters.types).toEqual(['font']);
  });
});

describe('buildHash', () => {
  it('与 parseHash 互逆（往返一致）', () => {
    const original: HashState = {
      search: 'a b',
      favOnly: true,
      filters: { types: ['2d'], licenses: ['cc0'], registers: [] },
    };
    expect(parseHash(buildHash(original))).toEqual(original);
  });

  it('空状态序列化为空串', () => {
    expect(
      buildHash({
        search: '',
        favOnly: false,
        filters: { types: [], licenses: [], registers: [] },
      }),
    ).toBe('');
  });

  it('只含搜索词时不产生 fav/types 等噪声参数', () => {
    expect(
      buildHash({
        search: 'x',
        favOnly: false,
        filters: { types: [], licenses: [], registers: [] },
      }),
    ).toBe('q=x');
  });
});
