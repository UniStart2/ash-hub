export type SiteType =
  '2d' | '3d' | 'audio' | 'ui' | 'font' | 'icon' | 'texture' | 'palette' | 'vector';

export type License = 'cc0' | 'cc-by' | 'free-commercial' | 'mixed';
export type Register = 'none' | 'optional' | 'required';

export interface Site {
  name: string;
  url: string;
  desc: string;
  types: SiteType[];
  license: License;
  register: Register;
  tags: string[];
  featured?: boolean;
  addedAt?: string;
  /** 运行时计算：addedAt 在 7 天内 */
  isNew?: boolean;
}

export type FilterKey = 'types' | 'licenses' | 'registers';

export interface ActiveFilters {
  types: SiteType[];
  licenses: License[];
  registers: Register[];
}

export type SortMode = 'rec' | 'az';
export type ViewMode = 'grid' | 'list';

/** 命令面板命令集与原型 v22 冻结一致；action 由 App executeCommand 分发 */
export interface PaletteCommand {
  id: string;
  label: string;
  action: string;
  icon: string;
  shortcut?: string;
}
