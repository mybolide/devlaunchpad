import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 复制 preload.js 的辅助函数
function copyPreloadFile() {
  try {
    mkdirSync(path.join(__dirname, 'dist-electron'), { recursive: true })
    copyFileSync(
      path.join(__dirname, 'electron/preload.js'),
      path.join(__dirname, 'dist-electron/preload.js')
    )
    console.log('[Vite] ✓ preload.js copied to dist-electron')
  } catch (error) {
    console.error('[Vite] ✗ Failed to copy preload.js:', error)
  }
}

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
        onstart(args) {
          // 开发模式：每次启动前复制 preload.js
          copyPreloadFile()
          // 启动 Electron
          args.startup()
        }
      }
    ]),
    renderer(),
    // 确保 build 时也复制 preload.js
    {
      name: 'copy-preload',
      buildEnd() {
        // 在 Electron 主进程编译完成后复制
        copyPreloadFile()
      },
      closeBundle() {
        // 在整个 bundle 关闭时也复制一次（以防万一）
        copyPreloadFile()
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
