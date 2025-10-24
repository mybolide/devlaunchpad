/**
 * 数据库相关 IPC 处理
 */
import { ipcMain } from 'electron'
import { getCategories, saveToolConfig, getToolConfig } from '../core/config-storage'

export function registerDbHandlers() {
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
}

