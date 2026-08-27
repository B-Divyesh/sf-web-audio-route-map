import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist/package',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebAudioRouteMap',
      cssFileName: 'style',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs')
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) => asset.name === 'style.css' ? 'style.css' : 'assets/[name]-[hash][extname]'
      }
    }
  }
});
