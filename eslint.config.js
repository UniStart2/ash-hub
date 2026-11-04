import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      // 未定义标识符由 vue-tsc 检查（build 即类型检查），no-undef 对 TS 是重复且需手写全局白名单
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  // 架构边界（docs/architecture.md §2/§7）：模块互斥、lib 纯化、通用组件脱领域。
  // no-restricted-imports 匹配 import 说明符原文，故按相对路径层级逐一列出。
  {
    files: ['src/modules/discover/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../library/**', '../../library/**', '../../../library/**'],
              message:
                '模块间禁止直接依赖：共享能力上移到 lib/ 或 composables/（docs/architecture.md）',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/library/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../discover/**', '../../discover/**', '../../../discover/**'],
              message:
                '模块间禁止直接依赖：共享能力上移到 lib/ 或 composables/（docs/architecture.md）',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'vue', message: 'lib/ 保持纯函数：不依赖 Vue，才能脱离组件树单测' }] },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../modules/**', '../../modules/**'],
              message: '通用组件不得依赖模块（仅 AppShell 作为视图出口例外）',
            },
          ],
        },
      ],
    },
  },
  // 唯一例外：壳层视图出口
  {
    files: ['src/components/AppShell.vue'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    ignores: ['dist/', 'node_modules/', 'prototype/'],
  },
);
