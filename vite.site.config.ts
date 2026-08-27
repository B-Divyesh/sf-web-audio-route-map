import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'site'),
  publicDir: resolve(__dirname, 'site/public'),
  build: {
    target: 'es2022',
    outDir: resolve(__dirname, 'dist/site'),
    emptyOutDir: false,
    sourcemap: true
  }
});
