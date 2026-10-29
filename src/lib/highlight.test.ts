import { describe, expect, it } from 'vitest';
import { highlight } from './highlight';

describe('highlight', () => {
  it('无搜索词时仅转义，不插入 mark', () => {
    expect(highlight('Kenney <b>', '')).toBe('Kenney &lt;b&gt;');
  });

  it('命中词包裹 mark.hl，大小写不敏感', () => {
    expect(highlight('OpenGameArt is great', 'opengame')).toBe(
      '<mark class="hl">OpenGame</mark>Art is great',
    );
  });

  it('多个词都高亮，长词优先避免部分匹配断裂', () => {
    const result = highlight('audio and audiophile', 'audio audiophile');
    expect(result).toContain('<mark class="hl">audiophile</mark>');
    expect(result).toContain('<mark class="hl">audio</mark>');
  });

  it('HTML 特殊字符先转义再匹配，防注入', () => {
    const result = highlight('<script>alert(1)</script>', 'alert');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<mark class="hl">alert</mark>');
  });

  it('正则元字符作为搜索词不抛异常', () => {
    expect(() => highlight('a+b (c)', 'a+b (')).not.toThrow();
    expect(highlight('a+b (c)', 'a+b')).toContain('<mark class="hl">a+b</mark>');
  });
});
