import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), VueDevTools(), viteCompression(), svgLoader()],
  build: {
    target: 'esnext'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    fs: {
      cachedChecks: false
    }
  }
})
