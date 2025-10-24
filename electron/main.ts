process.on('uncaughtException', (error) => {
  console.error('[Main] uncaughtException:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Main] unhandledRejection:', reason)
})

import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initConfigStorage } from './core/config-storage'
import { registerAllHandlers } from './ipc'

// 在 ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 开发环境检测
const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
function createWindow() {
  console.log('[Main] 开始创建窗口...')
  
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 600,
      frame: false, // 无边框窗口（自定义标题栏）
      backgroundColor: '#ffffff',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, // 安全考虑
        contextIsolation: true, // 启用上下文隔离
        sandbox: false // 允许访问 Node.js API
      }
    })
    
    console.log('[Main] 窗口创建成功')
  } catch (error) {
    console.error('[Main] 窗口创建失败:', error)
    return
  }

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Main] 加载开发服务器:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools() // 开发模式打开调试工具
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    console.log('[Main] mainWindow closed')
    mainWindow = null
  })
}

/**
 * 应用就绪时创建窗口
 */
app.whenReady().then(async () => {
  console.log('[Main] 应用已就绪，准备创建窗口')
  
  // 先创建窗口，再初始化配置（避免阻塞）
  createWindow()
  
  // 注册所有 IPC 处理函数
  registerAllHandlers(mainWindow)
  
  // 异步初始化配置存储
  initConfigStorage().catch((error) => {
    console.error('[Main] 配置存储初始化失败:', error)
  })

  // macOS 特性：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * 所有窗口关闭时退出应用（macOS 除外）
 */
app.on('window-all-closed', () => {
  console.log('[Main] window-all-closed triggered')
  if (process.platform !== 'darwin') {
    console.log('[Main] quitting app because not darwin')
    app.quit()
  }
})

// 开发模式日志
if (isDev) {
  console.log('天闲 | DevLaunchpad 主进程已启动 [开发模式]')
}

app.on('before-quit', () => {
  console.log('[Main] before-quit triggered')
})

app.on('will-quit', () => {
  console.log('[Main] will-quit triggered')
})

app.on('quit', (_event, exitCode) => {
  console.log('[Main] quit event exitCode:', exitCode)
})
