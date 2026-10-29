import process from 'node:process';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// base 由 VITE_BASE 注入：GitHub Pages 子路径部署时 workflow 会设 /repo-name/，本地与 Cloudflare 默认 /
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
