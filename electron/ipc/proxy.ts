/**
 * 代理管理相关 IPC 处理
 */
import { ipcMain } from 'electron'
import { proxyManager } from '../core/proxy-manager'

export function registerProxyHandlers() {
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
}

