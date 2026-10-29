import type { License, Register, SiteType } from '../types';

export const TYPE_LABEL: Record<SiteType, string> = {
  '2d': '2D 美术',
  '3d': '3D 模型',
  audio: '音频',
  ui: 'UI 界面',
  font: '字体',
  icon: '图标',
  texture: '纹理',
  palette: '调色板',
  vector: '矢量',
};

export const LICENSE_LABEL: Record<License, string> = {
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'free-commercial': '免费商用',
  mixed: '混合许可',
};

export const REGISTER_LABEL: Record<Register, string> = {
  none: '免注册',
  optional: '可选注册',
  required: '需注册',
};
