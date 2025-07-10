import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  define: {
    'process.env': {}
  },
  build: {
    outDir: 'assets',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.jsx',
      name: 'MoodclipUploader',
      formats: ['umd'],
      fileName: () => 'app-block.umd.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'app-block.css';
          }
          return assetInfo.name;
        },
      },
    },
  },
});
