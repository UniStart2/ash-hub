import type { Asset } from './types';

/**
 * 资产仓储接口。冲突通道在签名层先行：将来远程实现遇到更高 rev 时走 conflict
 * 分支而非覆盖，UI 策略后置。P1 本地实现恒为最新（单机单写者）。
 */
export type PutResult = { ok: true; asset: Asset } | { conflict: true; remote: Asset };

export interface AssetRepository {
  list(): Promise<Asset[]>;
  get(uuid: string): Promise<Asset | null>;
  put(asset: Asset): Promise<PutResult>;
  remove(uuid: string): Promise<void>;
}

/**
 * P1 mock 实现：内存存储，数据源自 mock.ts。
 * - put 视为 upsert：已存在则 rev +1，不存在则写入（rev 原样保留，由调用方负责初始值）
 * - 永不返回 conflict（单机单写者无冲突源）；该分支由远程实现启用
 * - 读写均经 structuredClone 隔离，外部改动不会污染仓储内部状态
 */
export class MockAssetRepository implements AssetRepository {
  private readonly store = new Map<string, Asset>();

  constructor(initial: Asset[] = []) {
    initial.forEach((a) => this.store.set(a.uuid, structuredClone(a)));
  }

  async list(): Promise<Asset[]> {
    return [...this.store.values()].map((a) => structuredClone(a));
  }

  async get(uuid: string): Promise<Asset | null> {
    const hit = this.store.get(uuid);
    return hit ? structuredClone(hit) : null;
  }

  async put(asset: Asset): Promise<PutResult> {
    const existing = this.store.get(asset.uuid);
    const next = structuredClone(asset);
    if (existing) next.rev = existing.rev + 1;
    this.store.set(next.uuid, next);
    return { ok: true, asset: structuredClone(next) };
  }

  async remove(uuid: string): Promise<void> {
    this.store.delete(uuid);
  }
}
