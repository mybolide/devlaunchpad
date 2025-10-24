/**
 * 代理管理器（调度器）
 * 
 * 重构说明：
 * - 简化为调度器，不再包含具体的代理管理逻辑
 * - 所有代理管理逻辑都在各个工具模块中实现
 * - 提供统一的调用接口，便于向后兼容
 * - 保留批量操作和测试功能
 */

import { getToolModule } from './tools'
import { commandExecutor } from './command-executor'
import type { ToolOperationResult, BatchOperationResult } from '../../src/types/index'

/**
 * 代理管理器类
 */
export class ProxyManager {
  /**
   * 启用代理
   */
  async enableProxy(toolName: string, proxyUrl: string): Promise<ToolOperationResult> {
    const module = getToolModule(toolName)

    if (!module) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不存在`
      }
    }

    return module.enableProxy(proxyUrl)
  }

  /**
   * 禁用代理
   */
  async disableProxy(toolName: string): Promise<ToolOperationResult> {
    const module = getToolModule(toolName)

    if (!module) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不存在`
      }
    }

    return module.disableProxy()
  }

  /**
   * 批量启用代理
   */
  async enableProxyBatch(toolNames: string[], proxyUrl: string): Promise<BatchOperationResult> {
    const results: ToolOperationResult[] = []

    for (const toolName of toolNames) {
      const result = await this.enableProxy(toolName, proxyUrl)
      results.push(result)
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return {
      totalTools: toolNames.length,
      successCount,
      failureCount,
      results
    }
  }

  /**
   * 批量禁用代理
   */
  async disableProxyBatch(toolNames: string[]): Promise<BatchOperationResult> {
    const results: ToolOperationResult[] = []

    for (const toolName of toolNames) {
      const result = await this.disableProxy(toolName)
      results.push(result)
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return {
      totalTools: toolNames.length,
      successCount,
      failureCount,
      results
    }
  }

  /**
   * 测试代理连接
   */
  async testProxy(proxyUrl: string): Promise<boolean> {
    try {
      // 使用 curl 测试代理
      const result = await commandExecutor.execute(
        ['curl', '-x', proxyUrl, '-I', 'https://www.google.com'],
        5000
      )
      return result.success
    } catch {
      return false
    }
  }

  /**
   * 为工具设置代理
   */
  async setToolProxy(toolName: string, proxyUrl: string): Promise<ToolOperationResult> {
    return this.enableProxy(toolName, proxyUrl)
  }

  /**
   * 清除工具的代理
   */
  async clearToolProxy(toolName: string): Promise<ToolOperationResult> {
    return this.disableProxy(toolName)
  }
}

// 导出单例
export const proxyManager = new ProxyManager()
