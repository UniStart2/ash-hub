import { describe, expect, it } from 'vitest';
import { MockAssetRepository } from './repository';
import { MOCK_ASSETS } from './mock';

describe('MockAssetRepository', () => {
  it('list 返回全部资产，且与内部存储隔离', async () => {
    const repo = new MockAssetRepository(MOCK_ASSETS);
    const list = await repo.list();
    expect(list.length).toBe(MOCK_ASSETS.length);
    list[0].name = '被外部篡改';
    expect((await repo.list())[0].name).toBe(MOCK_ASSETS[0].name);
  });

  it('get 命中返回资产，未命中返回 null', async () => {
    const repo = new MockAssetRepository(MOCK_ASSETS);
    const hit = await repo.get(MOCK_ASSETS[0].uuid);
    expect(hit?.name).toBe(MOCK_ASSETS[0].name);
    expect(await repo.get('no-such-uuid')).toBeNull();
  });

  it('put 已存在资产时 rev 自增并返回 ok 分支', async () => {
    const repo = new MockAssetRepository(MOCK_ASSETS);
    const before = structuredClone(MOCK_ASSETS[0]);
    const result = await repo.put(before);
    expect('ok' in result).toBe(true);
    if ('ok' in result) {
      expect(result.asset.rev).toBe(before.rev + 1);
    }
    expect((await repo.get(before.uuid))?.rev).toBe(before.rev + 1);
  });

  it('put 不影响传入对象（入参与存储隔离）', async () => {
    const repo = new MockAssetRepository([]);
    const asset = structuredClone(MOCK_ASSETS[0]);
    await repo.put(asset);
    asset.name = '事后篡改';
    expect((await repo.get(asset.uuid))?.name).toBe(structuredClone(MOCK_ASSETS[0]).name);
  });

  it('put 新 uuid 视为插入，rev 保持调用方给的初始值', async () => {
    const repo = new MockAssetRepository([]);
    const asset = {
      ...structuredClone(MOCK_ASSETS[0]),
      uuid: 'new-uuid-0000-7000-8000-000000000000',
    };
    const result = await repo.put(asset);
    expect('ok' in result).toBe(true);
    expect(await repo.get(asset.uuid)).not.toBeNull();
  });

  it('remove 删除后 get 返回 null，重复删除不报错', async () => {
    const repo = new MockAssetRepository(MOCK_ASSETS);
    const uuid = MOCK_ASSETS[0].uuid;
    await repo.remove(uuid);
    expect(await repo.get(uuid)).toBeNull();
    await expect(repo.remove(uuid)).resolves.toBeUndefined();
  });
});
