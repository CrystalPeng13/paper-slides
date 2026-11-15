import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 讓建置結果可以放在 GitHub Pages 的任何子路徑底下（搭配 HashRouter）
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
