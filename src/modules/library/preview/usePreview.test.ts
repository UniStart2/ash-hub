import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { usePreview } from './usePreview';
import type { Asset } from '../types';

const version = (tag: string, date: string) => ({
  tag,
  date,
  note: `${tag} note`,
  url: `https://cdn.test/${tag}.png`,
  format: 'PNG',
  meta: {},
});

const asset: Asset = {
  uuid: 'uuid-a',
  name: 'A',
  type: 'IMAGE',
  tags: [],
  source: { type: 'local' },
  versions: [
    version('v3.0', '2026-11-03'),
    version('v2.0', '2026-11-02'),
    version('v1.0', '2026-11-01'),
  ],
  currentVersion: 'v2.0',
  projectRefs: [],
  rev: 3,
  addedAt: '2026-11-01T00:00:00.000Z',
};

const setup = (hash = '') => {
  history.replaceState(null, '', `/${hash}`);
  const preview = usePreview({ assets: ref([asset]) });
  return preview;
};

const params = () => new URLSearchParams(window.location.hash.slice(1));

describe('usePreview', () => {
  beforeEach(() => history.replaceState(null, '', '/'));

  it('无 hash 参数时不打开', () => {
    const p = setup();
    expect(p.asset.value).toBeNull();
    expect(p.activeVersion.value).toBeNull();
  });

  it('从 hash 恢复 asset 与 ver，缺 ver 时落到 currentVersion', () => {
    expect(setup('#asset=uuid-a').activeTag.value).toBe('v2.0');
    expect(setup('#asset=uuid-a&ver=v1.0').activeTag.value).toBe('v1.0');
  });

  it('ver 不在版本链内时回落 currentVersion，且不抛错', () => {
    const p = setup('#asset=uuid-a&ver=v9.9');
    expect(p.activeTag.value).toBe('v2.0');
    expect(p.activeVersion.value?.url).toBe('https://cdn.test/v2.0.png');
  });

  it('uuid 不存在时 asset 为空，但保留 hash（异步载入期不自清）', () => {
    const p = setup('#asset=uuid-missing');
    expect(p.asset.value).toBeNull();
    expect(params().get('asset')).toBe('uuid-missing');
  });

  it('open 写 asset 并清掉 ver，同步保留 view 等无关键', () => {
    history.replaceState(null, '', '/#view=library&ver=v1.0');
    const p = usePreview({ assets: ref([asset]) });

    p.open('uuid-a');

    expect(params().get('asset')).toBe('uuid-a');
    expect(params().get('ver')).toBeNull();
    expect(params().get('view')).toBe('library');
  });

  it('step 按列表顺序走：-1 更新，+1 更旧，越界不动', () => {
    const p = setup('#asset=uuid-a&ver=v1.0');
    expect(p.hasNext.value).toBe(false);

    p.step(1);
    expect(p.activeTag.value).toBe('v1.0');

    p.step(-1);
    expect(p.activeTag.value).toBe('v2.0');

    p.step(-1);
    expect(p.activeTag.value).toBe('v3.0');
    expect(p.hasPrev.value).toBe(false);

    p.step(-1);
    expect(p.activeTag.value).toBe('v3.0');
  });

  it('selectVersion 拒绝链外 tag，不污染 hash', () => {
    const p = setup('#asset=uuid-a');
    p.selectVersion('v9.9');

    expect(p.activeTag.value).toBe('v2.0');
    expect(params().get('ver')).toBeNull();
  });

  it('close 清空 asset 与 ver，其余参数保留', () => {
    history.replaceState(null, '', '/#view=library');
    const p = usePreview({ assets: ref([asset]) });
    p.open('uuid-a');
    p.selectVersion('v1.0');

    p.close();

    expect(p.asset.value).toBeNull();
    expect(params().get('asset')).toBeNull();
    expect(params().get('ver')).toBeNull();
    expect(params().get('view')).toBe('library');
  });
});
