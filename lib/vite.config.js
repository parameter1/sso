/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const { defineConfig } = require('vite');

// https://vitejs.dev/config/
module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'p1sso',
      formats: ['iife', 'umd', 'es'],
      fileName: (format) => `p1-sso.${format}.js`,
    },
  },
  server: {
    host: process.env.HOST,
    port: process.env.PORT,
    strictPort: true,
  },
});
