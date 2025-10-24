/**
 * 窗口管理相关 IPC 处理
 */
import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(mainWindow: BrowserWindow | null) {
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
}

