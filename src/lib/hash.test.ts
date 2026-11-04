import { beforeEach, describe, expect, it } from 'vitest';
import { parseHash, patchHash, type HashState } from './hash';

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

describe('patchHash', () => {
  beforeEach(() => history.replaceState(null, '', '/'));

  const current = () => window.location.hash.slice(1);

  it('写入键值后可从 hash 解析回来（与 parseHash 往返一致）', () => {
    const state: HashState = {
      search: 'a b',
      favOnly: true,
      filters: { types: ['2d'], licenses: ['cc0'], registers: [] },
    };
    patchHash({
      q: state.search,
      fav: state.favOnly ? '1' : null,
      types: state.filters.types.join(',') || null,
      licenses: state.filters.licenses.join(',') || null,
      registers: state.filters.registers.join(',') || null,
    });

    expect(parseHash(window.location.hash)).toEqual(state);
  });

  it('保留无关键：发现域写入不抹掉 view 与 asset', () => {
    history.replaceState(null, '', '/#view=library&asset=uuid-1');
    patchHash({ q: 'kenney', fav: '1' });

    const params = new URLSearchParams(current());
    expect(params.get('view')).toBe('library');
    expect(params.get('asset')).toBe('uuid-1');
    expect(params.get('q')).toBe('kenney');
  });

  it('null 与空串都表示删除该键，其余键不动', () => {
    history.replaceState(null, '', '/#view=library&q=kenney&fav=1');
    patchHash({ q: null, fav: '' });

    expect(current()).toBe('view=library');
  });

  it('全部键删除后回到不带 # 的地址', () => {
    history.replaceState(null, '', '/#view=library');
    patchHash({ view: null });

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/');
  });

  it('只写一个键时不产生其他噪声参数', () => {
    patchHash({ q: 'x' });

    expect(current()).toBe('q=x');
  });
});
