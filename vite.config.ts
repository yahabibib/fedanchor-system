import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'; // 引入插件

export default defineConfig({
  plugins: [
    react(),
    cesium() // 注册插件，它会自动处理 Cesium 的静态资源复制
  ],
})