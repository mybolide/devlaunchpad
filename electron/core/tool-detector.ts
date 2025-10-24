/**
 * 工具检测器（调度器）
 * 
 * 重构说明：
 * - 简化为调度器，不再包含具体的检测逻辑
 * - 所有检测逻辑都在各个工具模块中实现
 * - 提供统一的调用接口，便于向后兼容
 */

import { getToolModule, getAllToolModules } from './tools'
import type { ToolInfo } from '../../src/types/index'

/**
 * 工具检测器类
 */
export class ToolDetector {
  /**
   * 检测工具是否已安装
   */
  async isToolInstalled(toolName: string): Promise<boolean> {
    const module = getToolModule(toolName)
    if (!module) return false
    return module.isInstalled()
  }

  /**
   * 获取工具版本
   */
  async getToolVersion(toolName: string): Promise<string | undefined> {
    const module = getToolModule(toolName)
    if (!module) return undefined
    return module.getVersion()
  }

  /**
   * 检查工具是否启用了代理
   */
  async isProxyEnabled(toolName: string): Promise<boolean> {
    const module = getToolModule(toolName)
    if (!module) return false
    return module.isProxyEnabled()
  }

  /**
   * 获取工具当前的代理设置
   */
  async getCurrentProxy(toolName: string): Promise<string | undefined> {
    const module = getToolModule(toolName)
    if (!module) return undefined
    return module.getCurrentProxy()
  }

  /**
   * 获取工具当前的镜像源
   */
  async getCurrentRegistry(toolName: string): Promise<string | undefined> {
    const module = getToolModule(toolName)
    if (!module) return undefined
    return module.getCurrentRegistry()
  }

  /**
   * 获取工具当前的缓存目录
   */
  async getCurrentCacheDir(toolName: string): Promise<string | undefined> {
    const module = getToolModule(toolName)
    if (!module) return undefined
    return module.getCurrentCacheDir()
  }

  /**
   * 获取工具的完整信息
   */
  async getToolInfo(toolName: string): Promise<ToolInfo | null> {
    const module = getToolModule(toolName)
    if (!module) {
      console.warn(`[ToolDetector] 工具 ${toolName} 不存在`)
      return null
    }
    return module.getInfo()
  }

  /**
   * 获取多个工具的信息
   */
  async getToolsInfo(toolNames: string[]): Promise<ToolInfo[]> {
    const results = await Promise.all(
      toolNames.map((name) => this.getToolInfo(name))
    )
    return results.filter((info) => info !== null) as ToolInfo[]
  }

  /**
   * 获取所有工具的信息
   */
  async getAllToolsInfo(): Promise<ToolInfo[]> {
    const modules = getAllToolModules()
    const results = await Promise.all(
      modules.map((module) => module.getInfo())
    )
    return results
  }
}

// 导出单例
export const toolDetector = new ToolDetector()
