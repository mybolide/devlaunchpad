/**
 * 工具检测器
 * 检测工具安装状态和代理配置
 */

import { commandExecutor } from './command-executor'
import { getTool, getAllTools } from './tools-config'
import type { ToolInfo, ToolStatus } from '../../src/types/index'

const IGNORED_VALUES = ['null', 'undefined', 'none', 'noproxy']

/**
 * 过滤掉无效的配置值
 */
function filterValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const cleaned = value.trim().toLowerCase()
  if (IGNORED_VALUES.includes(cleaned)) return undefined
  return value.trim()
}

/**
 * 工具检测器类
 */
export class ToolDetector {
  /**
   * 检测工具是否已安装
   */
  async isToolInstalled(toolName: string): Promise<boolean> {
    const tool = getTool(toolName)
    if (!tool) return false

    const result = await commandExecutor.execute(tool.checkCmd, 5000)
    return result.success
  }

  /**
   * 获取工具版本
   */
  async getToolVersion(toolName: string): Promise<string | undefined> {
    const tool = getTool(toolName)
    if (!tool) return undefined

    const result = await commandExecutor.execute(tool.checkCmd, 5000)
    if (!result.success) return undefined

    // 提取版本号（通常在第一行）
    const version = result.stdout.trim().split('\n')[0]
    return filterValue(version)
  }

  /**
   * 检查工具是否启用了代理
   */
  async isProxyEnabled(toolName: string): Promise<boolean> {
    const tool = getTool(toolName)
    if (!tool || !tool.getProxyCmd || tool.getProxyCmd.length === 0) {
      return false
    }

    const proxyValue = await this.getCurrentProxy(toolName)
    return proxyValue !== undefined && proxyValue.length > 0
  }

  /**
   * 获取工具当前的代理设置
   */
  async getCurrentProxy(toolName: string): Promise<string | undefined> {
    const tool = getTool(toolName)
    if (!tool || !tool.getProxyCmd || tool.getProxyCmd.length === 0) {
      return undefined
    }

    // 特殊处理 Yarn：直接读取 .yarnrc 文件
    if (toolName === 'yarn') {
      return this.getYarnProxy()
    }

    const result = await commandExecutor.execute(tool.getProxyCmd, 5000)

    if (!result.success) {
      return undefined
    }

    const proxyValue = filterValue(result.stdout)
    return proxyValue
  }

  /**
   * 获取 Yarn 的代理设置（从 .yarnrc 文件）
   */
  private async getYarnProxy(): Promise<string | undefined> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const os = await import('os')

      const yarnrcPath = path.join(os.homedir(), '.yarnrc')

      try {
        const content = await fs.readFile(yarnrcPath, 'utf-8')
        const lines = content.split('\n')

        for (const line of lines) {
          if (line.includes('proxy')) {
            const match = line.match(/proxy\s+"([^"]+)"/)
            if (match && match[1]) {
              return filterValue(match[1])
            }
          }
        }
      } catch {
        // .yarnrc 不存在或无法读取
        return undefined
      }
    } catch {
      return undefined
    }
  }

  /**
   * 获取工具当前的镜像源
   */
  async getCurrentRegistry(toolName: string): Promise<string | undefined> {
    const tool = getTool(toolName)
    if (!tool || !tool.getRegistryCmd || tool.getRegistryCmd.length === 0) {
      return undefined
    }

    const result = await commandExecutor.execute(tool.getRegistryCmd, 5000)

    if (!result.success) {
      return undefined
    }

    const registryValue = filterValue(result.stdout)
    return registryValue
  }

  /**
   * 获取工具当前的缓存目录
   */
  async getCurrentCacheDir(toolName: string): Promise<string | undefined> {
    const tool = getTool(toolName)
    if (!tool || !tool.getCacheDirCmd || tool.getCacheDirCmd.length === 0) {
      return undefined
    }

    const result = await commandExecutor.execute(tool.getCacheDirCmd, 5000)

    if (!result.success) {
      return undefined
    }

    const cacheDirValue = filterValue(result.stdout)
    return cacheDirValue
  }

  /**
   * 获取工具的完整信息
   */
  async getToolInfo(toolName: string): Promise<ToolInfo | null> {
    const tool = getTool(toolName)
    if (!tool) {
      console.warn(`[ToolDetector] 工具 ${toolName} 不存在`)
      return null
    }

    try {
      console.log(`[ToolDetector] 检测工具: ${toolName}`)
      const installed = await this.isToolInstalled(toolName)
      console.log(`[ToolDetector]   ${toolName} 安装状态: ${installed}`)
      
      const version = installed ? await this.getToolVersion(toolName) : undefined
      if (installed && version) {
        console.log(`[ToolDetector]   ${toolName} 版本: ${version}`)
      }
      
      const proxyEnabled = installed && (await this.isProxyEnabled(toolName))
      const currentProxy = installed ? await this.getCurrentProxy(toolName) : undefined
      
      if (installed && proxyEnabled && currentProxy) {
        console.log(`[ToolDetector]   ${toolName} 代理: ${currentProxy}`)
      }

      // 读取镜像源配置
      const registryUrl = installed ? await this.getCurrentRegistry(toolName) : undefined
      if (installed && registryUrl) {
        console.log(`[ToolDetector]   ${toolName} 镜像源: ${registryUrl}`)
      }

      // 读取缓存目录配置
      const cacheDir = installed ? await this.getCurrentCacheDir(toolName) : undefined
      if (installed && cacheDir) {
        console.log(`[ToolDetector]   ${toolName} 缓存目录: ${cacheDir}`)
      }

      return {
        name: tool.name,
        displayName: tool.displayName,
        category: tool.category,
        status: installed ? 'installed' : 'not_installed',
        version,
        proxyEnabled,
        currentProxy,
        registryUrl,
        cacheDir,
        error: undefined
      }
    } catch (error) {
      console.error(`[ToolDetector] 检测 ${toolName} 失败:`, error)
      return {
        name: tool.name,
        displayName: tool.displayName,
        category: tool.category,
        status: 'error',
        error: String(error)
      }
    }
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
    const tools = getAllTools()
    const toolNames = tools.map((t) => t.name)
    return this.getToolsInfo(toolNames)
  }
}

// 导出单例
export const toolDetector = new ToolDetector()
