/**
 * IPC 处理统一注册入口
 * 将所有 IPC 处理模块化管理
 */
import { BrowserWindow } from 'electron'
import { registerWindowHandlers } from './window'
import { registerToolHandlers } from './tool'
import { registerProxyHandlers } from './proxy'
import { registerDbHandlers } from './db'
import { registerCommandHandlers } from './command'
import { registerNpmHandlers } from './npm-refactored'
import { registerYarnHandlers } from './yarn-refactored'

/**
 * 注册所有 IPC 处理函数
 * @param mainWindow 主窗口实例（用于窗口控制）
 */
export function registerAllHandlers(mainWindow: BrowserWindow | null) {
  console.log('[IPC] 开始注册所有 IPC 处理函数...')

  // 窗口管理
  registerWindowHandlers(mainWindow)
  console.log('[IPC] ✓ 窗口管理')

  // 工具检测
  registerToolHandlers()
  console.log('[IPC] ✓ 工具检测')

  // 代理管理
  registerProxyHandlers()
  console.log('[IPC] ✓ 代理管理')

  // 数据库操作
  registerDbHandlers()
  console.log('[IPC] ✓ 数据库操作')

  // 命令执行
  registerCommandHandlers()
  console.log('[IPC] ✓ 命令执行')

  // npm 专用功能
  registerNpmHandlers()
  console.log('[IPC] ✓ npm 专用功能')

  // yarn 专用功能
  registerYarnHandlers()
  console.log('[IPC] ✓ yarn 专用功能')

  console.log('[IPC] 所有 IPC 处理函数注册完成！')
}

