import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 固定挂在 /alveytools-admin/ 下
  base: '/alveytools-admin/',
})
