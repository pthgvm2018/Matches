import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/Matches/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 把 node_modules 合併為 vendor chunk，避免 _ 開頭的檔名
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
