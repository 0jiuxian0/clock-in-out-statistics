import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './', // 默认使用相对路径，GitHub Actions 构建时会通过 --base 参数覆盖
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})

