/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [vue()],
  server: {
    host: process.env.HOST,
    port: process.env.PORT,
    strictPort: true,
  },
});
