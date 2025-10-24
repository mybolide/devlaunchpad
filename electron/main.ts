process.on('uncaughtException', (error) => {
  console.error('[Main] uncaughtException:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Main] unhandledRejection:', reason)
})

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { toolDetector } from './core/tool-detector'
import { proxyManager } from './core/proxy-manager'
import { initConfigStorage, getCategories, saveToolConfig, getToolConfig } from './core/config-storage'

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

// ============================================
// IPC 通信处理
// ============================================

/**
 * 窗口控制：最小化
 */
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

/**
 * 窗口控制：最大化/还原
 */
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
    return false
  } else {
    mainWindow?.maximize()
    return true
  }
})

/**
 * 窗口控制：关闭
 */
ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

/**
 * 获取窗口最大化状态
 */
ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() || false
})

/**
 * 示例：执行系统命令
 * 实际使用时会在 core/ 模块中实现
 */
ipcMain.handle('command:execute', async (event, command: string) => {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    const { stdout, stderr } = await execAsync(command)
    return {
      success: !stderr,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    }
  } catch (error: any) {
    return {
      success: false,
      stdout: '',
      stderr: error.message
    }
  }
})

// ============================================
// 工具检测 IPC 处理
// ============================================

/**
 * 获取所有工具信息
 */
ipcMain.handle('tool:getAllTools', async () => {
  try {
    return await toolDetector.getAllToolsInfo()
  } catch (error: any) {
    console.error('[IPC] tool:getAllTools 错误:', error)
    return []
  }
})

/**
 * 获取特定工具信息
 */
ipcMain.handle('tool:getToolInfo', async (event, toolName: string) => {
  try {
    return await toolDetector.getToolInfo(toolName)
  } catch (error: any) {
    console.error('[IPC] tool:getToolInfo 错误:', error)
    return null
  }
})

/**
 * 获取多个工具信息
 */
ipcMain.handle('tool:getToolsInfo', async (event, toolNames: string[]) => {
  try {
    return await toolDetector.getToolsInfo(toolNames)
  } catch (error: any) {
    console.error('[IPC] tool:getToolsInfo 错误:', error)
    return []
  }
})

/**
 * 检查工具是否安装
 */
ipcMain.handle('tool:isInstalled', async (event, toolName: string) => {
  try {
    return await toolDetector.isToolInstalled(toolName)
  } catch (error: any) {
    console.error('[IPC] tool:isInstalled 错误:', error)
    return false
  }
})

/**
 * 获取工具版本
 */
ipcMain.handle('tool:getVersion', async (event, toolName: string) => {
  try {
    return await toolDetector.getToolVersion(toolName)
  } catch (error: any) {
    console.error('[IPC] tool:getVersion 错误:', error)
    return undefined
  }
})

// ============================================
// 代理管理 IPC 处理
// ============================================

/**
 * 启用代理
 */
ipcMain.handle('proxy:enable', async (event, toolName: string, proxyUrl: string) => {
  try {
    return await proxyManager.enableProxy(toolName, proxyUrl)
  } catch (error: any) {
    console.error('[IPC] proxy:enable 错误:', error)
    return {
      toolName,
      success: false,
      message: String(error)
    }
  }
})

/**
 * 禁用代理
 */
ipcMain.handle('proxy:disable', async (event, toolName: string) => {
  try {
    return await proxyManager.disableProxy(toolName)
  } catch (error: any) {
    console.error('[IPC] proxy:disable 错误:', error)
    return {
      toolName,
      success: false,
      message: String(error)
    }
  }
})

/**
 * 批量启用代理
 */
ipcMain.handle('proxy:enableBatch', async (event, toolNames: string[], proxyUrl: string) => {
  try {
    return await proxyManager.enableProxyBatch(toolNames, proxyUrl)
  } catch (error: any) {
    console.error('[IPC] proxy:enableBatch 错误:', error)
    return {
      totalTools: toolNames.length,
      successCount: 0,
      failureCount: toolNames.length,
      results: []
    }
  }
})

/**
 * 批量禁用代理
 */
ipcMain.handle('proxy:disableBatch', async (event, toolNames: string[]) => {
  try {
    return await proxyManager.disableProxyBatch(toolNames)
  } catch (error: any) {
    console.error('[IPC] proxy:disableBatch 错误:', error)
    return {
      totalTools: toolNames.length,
      successCount: 0,
      failureCount: toolNames.length,
      results: []
    }
  }
})

/**
 * 测试代理连接
 */
ipcMain.handle('proxy:test', async (event, proxyUrl: string) => {
  try {
    return await proxyManager.testProxy(proxyUrl)
  } catch (error: any) {
    console.error('[IPC] proxy:test 错误:', error)
    return false
  }
})

// ============================================
// 数据库 IPC 处理
// ============================================

/**
 * 获取工具分类
 */
ipcMain.handle('db:getCategories', async () => {
  try {
    return getCategories()
  } catch (error: any) {
    console.error('[IPC] db:getCategories 错误，返回默认分类:', error)
    // 返回默认分类
    return [
      { name: 'frontend', display_name: '前端开发', icon: '🎨', sort_order: 1 },
      { name: 'backend', display_name: '后端开发', icon: '⚙️', sort_order: 2 },
      { name: 'devops', display_name: '运维工具', icon: '🚀', sort_order: 3 },
      { name: 'other', display_name: '其他工具', icon: '📦', sort_order: 99 }
    ]
  }
})

/**
 * 保存工具配置
 */
ipcMain.handle('db:saveToolConfig', async (event, config: any) => {
  try {
    return await saveToolConfig(config)
  } catch (error: any) {
    console.error('[IPC] db:saveToolConfig 错误:', error)
    return { success: false, error: String(error) }
  }
})

/**
 * 获取工具配置
 */
ipcMain.handle('db:getToolConfig', async (event, toolName: string) => {
  try {
    return getToolConfig(toolName)
  } catch (error: any) {
    console.error('[IPC] db:getToolConfig 错误:', error)
    return null
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
