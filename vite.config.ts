import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        },
        onstart() {
          // 每次启动前复制 preload.js
          try {
            mkdirSync(path.join(__dirname, 'dist-electron'), { recursive: true })
            copyFileSync(
              path.join(__dirname, 'electron/preload.js'),
              path.join(__dirname, 'dist-electron/preload.js')
            )
            console.log('[Vite] preload.js copied to dist-electron')
          } catch (error) {
            console.error('[Vite] Failed to copy preload.js:', error)
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
