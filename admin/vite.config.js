import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 固定挂在 /admin/ 下，避免访问 /admin（无尾斜杠）时相对资源路径解析到 /assets
  base: '/admin/',
})
