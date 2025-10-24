/**
 * 工具检测相关 IPC 处理
 */
import { ipcMain } from 'electron'
import { toolDetector } from '../core/tool-detector'

export function registerToolHandlers() {
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
}

