/**
 * 代理管理器
 * 负责管理工具的代理配置
 */

import { commandExecutor } from './command-executor'
import { getTool } from './tools-config'
import { toolDetector } from './tool-detector'
import type { ToolOperationResult, BatchOperationResult } from '../../src/types/index'

/**
 * 代理管理器类
 */
export class ProxyManager {
  /**
   * 启用代理
   */
  async enableProxy(toolName: string, proxyUrl: string): Promise<ToolOperationResult> {
    const tool = getTool(toolName)

    if (!tool) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不支持`
      }
    }

    if (!tool.enableCmds || tool.enableCmds.length === 0) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不支持代理设置`
      }
    }

    try {
      // 执行所有启用命令
      for (const cmdTemplate of tool.enableCmds) {
        const cmd = cmdTemplate.map((part) => (part === '{proxy}' ? proxyUrl : part))
        const result = await commandExecutor.execute(cmd)

        if (!result.success) {
          return {
            toolName,
            success: false,
            message: `启用代理失败: ${result.stderr || '未知错误'}`,
            details: result
          }
        }
      }

      // 验证代理已启用
      await new Promise((resolve) => setTimeout(resolve, 100))
      const verified = await toolDetector.isProxyEnabled(toolName)

      if (!verified) {
        return {
          toolName,
          success: false,
          message: '代理设置失败，验证未通过'
        }
      }

      return {
        toolName,
        success: true,
        message: `成功为 ${tool.displayName} 启用代理`
      }
    } catch (error) {
      return {
        toolName,
        success: false,
        message: `启用代理异常: ${error}`
      }
    }
  }

  /**
   * 禁用代理
   */
  async disableProxy(toolName: string): Promise<ToolOperationResult> {
    const tool = getTool(toolName)

    if (!tool) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不支持`
      }
    }

    if (!tool.disableCmds || tool.disableCmds.length === 0) {
      return {
        toolName,
        success: false,
        message: `工具 ${toolName} 不支持代理设置`
      }
    }

    try {
      // 执行所有禁用命令
      for (const cmd of tool.disableCmds) {
        const result = await commandExecutor.execute(cmd)

        // 对于 git config --unset，返回 5 是正常的（表示没有找到配置）
        if (!result.success && !(cmd[0] === 'git' && result.returnCode === 5)) {
          // 继续执行其他命令，不立即返回
          console.warn(`执行禁用命令失败: ${cmd.join(' ')}`)
        }
      }

      // 等待命令执行完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 验证代理已禁用
      const stillEnabled = await toolDetector.isProxyEnabled(toolName)

      if (stillEnabled) {
        return {
          toolName,
          success: false,
          message: '代理禁用失败，验证未通过'
        }
      }

      return {
        toolName,
        success: true,
        message: `成功为 ${tool.displayName} 禁用代理`
      }
    } catch (error) {
      return {
        toolName,
        success: false,
        message: `禁用代理异常: ${error}`
      }
    }
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
    // 如果工具还没有启用代理，则启用
    const isEnabled = await toolDetector.isProxyEnabled(toolName)

    if (!isEnabled) {
      return this.enableProxy(toolName, proxyUrl)
    } else {
      // 如果已启用，也执行启用命令来更新代理 URL
      return this.enableProxy(toolName, proxyUrl)
    }
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
