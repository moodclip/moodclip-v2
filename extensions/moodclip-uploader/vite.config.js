import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  define: {
    'process.env': {}
  },
  build: {
    outDir: 'assets',
    lib: {
      entry: 'src/index.jsx',
      name: 'MoodclipUploader',
      fileName: 'app-block',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
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