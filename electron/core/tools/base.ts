/**
 * 工具模块基类和接口定义
 * 
 * 架构说明：
 * - 定义工具模块的统一接口
 * - 提供默认实现，子类可以覆盖
 * - 将通用逻辑抽取到基类，避免重复代码
 */

import { commandExecutor } from '../command-executor'
import type { Tool, ToolInfo, ToolOperationResult } from '../../../src/types/index'

/**
 * 忽略的无效配置值
 */
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
 * 工具模块接口
 * 每个工具都需要实现这个接口
 */
export interface IToolModule {
  /** 工具配置信息 */
  readonly config: Tool

  /** 检测工具是否已安装 */
  isInstalled(): Promise<boolean>

  /** 获取工具版本 */
  getVersion(): Promise<string | undefined>

  /** 检查代理是否已启用 */
  isProxyEnabled(): Promise<boolean>

  /** 获取当前代理设置 */
  getCurrentProxy(): Promise<string | undefined>

  /** 获取当前镜像源 */
  getCurrentRegistry(): Promise<string | undefined>

  /** 获取当前缓存目录 */
  getCurrentCacheDir(): Promise<string | undefined>

  /** 启用代理 */
  enableProxy(proxyUrl: string): Promise<ToolOperationResult>

  /** 禁用代理 */
  disableProxy(): Promise<ToolOperationResult>

  /** 获取工具的完整信息 */
  getInfo(): Promise<ToolInfo>
}

/**
 * 工具模块基类
 * 提供基于配置的默认实现，子类可以覆盖特殊逻辑
 * 【性能优化】添加短期缓存避免重复命令执行
 */
export abstract class ToolModuleBase implements IToolModule {
  /** 工具配置（子类必须提供） */
  abstract readonly config: Tool

  /** 【性能优化】命令结果缓存（5秒TTL，保持实时性） */
  private cache = new Map<string, { value: any; timestamp: number }>()
  private readonly CACHE_TTL = 5000 // 5秒缓存，避免频繁执行

  /**
   * 【性能优化】缓存辅助方法
   * 如果缓存存在且未过期则返回缓存，否则执行函数并缓存结果
   */
  private async getCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value as T
    }
    
    const value = await fn()
    this.cache.set(key, { value, timestamp: Date.now() })
    return value
  }

  /**
   * 【性能优化】清除缓存（配置变更时调用）
   */
  protected clearCache(): void {
    this.cache.clear()
  }

  /**
   * 检测工具是否已安装
   * 默认实现：执行 checkCmd
   */
  async isInstalled(): Promise<boolean> {
    try {
      const result = await commandExecutor.execute(this.config.checkCmd, 5000)
      return result.success
    } catch {
      return false
    }
  }

  /**
   * 获取工具版本
   * 默认实现：执行 checkCmd 并提取第一行
   */
  async getVersion(): Promise<string | undefined> {
    try {
      const result = await commandExecutor.execute(this.config.checkCmd, 5000)
      if (!result.success) return undefined

      // 提取版本号（通常在第一行）
      const version = result.stdout.trim().split('\n')[0]
      return filterValue(version)
    } catch {
      return undefined
    }
  }

  /**
   * 检查代理是否已启用
   * 默认实现：检查是否有代理值
   */
  async isProxyEnabled(): Promise<boolean> {
    const proxyValue = await this.getCurrentProxy()
    return proxyValue !== undefined && proxyValue.length > 0
  }

  /**
   * 获取当前代理设置
   * 默认实现：执行 getProxyCmd
   * 子类可以覆盖此方法以实现特殊逻辑
   */
  async getCurrentProxy(): Promise<string | undefined> {
    if (!this.config.getProxyCmd || this.config.getProxyCmd.length === 0) {
      return undefined
    }

    try {
      const result = await commandExecutor.execute(this.config.getProxyCmd, 5000)
      if (!result.success) return undefined

      return filterValue(result.stdout)
    } catch {
      return undefined
    }
  }

  /**
   * 获取当前镜像源
   * 默认实现：执行 getRegistryCmd
   */
  async getCurrentRegistry(): Promise<string | undefined> {
    if (!this.config.getRegistryCmd || this.config.getRegistryCmd.length === 0) {
      return undefined
    }

    try {
      const result = await commandExecutor.execute(this.config.getRegistryCmd, 5000)
      if (!result.success) return undefined

      return filterValue(result.stdout)
    } catch {
      return undefined
    }
  }

  /**
   * 获取当前缓存目录
   * 默认实现：执行 getCacheDirCmd
   */
  async getCurrentCacheDir(): Promise<string | undefined> {
    if (!this.config.getCacheDirCmd || this.config.getCacheDirCmd.length === 0) {
      return undefined
    }

    try {
      const result = await commandExecutor.execute(this.config.getCacheDirCmd, 5000)
      if (!result.success) return undefined

      return filterValue(result.stdout)
    } catch {
      return undefined
    }
  }

  /**
   * 启用代理
   * 默认实现：执行 enableCmds
   */
  async enableProxy(proxyUrl: string): Promise<ToolOperationResult> {
    if (!this.config.enableCmds || this.config.enableCmds.length === 0) {
      return {
        toolName: this.config.name,
        success: false,
        message: `工具 ${this.config.name} 不支持代理设置`
      }
    }

    try {
      // 执行所有启用命令
      for (const cmdTemplate of this.config.enableCmds) {
        const cmd = cmdTemplate.map((part) => (part === '{proxy}' ? proxyUrl : part))
        const result = await commandExecutor.execute(cmd)

        if (!result.success) {
          return {
            toolName: this.config.name,
            success: false,
            message: `启用代理失败: ${result.stderr || '未知错误'}`,
            details: result
          }
        }
      }

      // 验证代理已启用
      await new Promise((resolve) => setTimeout(resolve, 100))
      const verified = await this.isProxyEnabled()

      if (!verified) {
        return {
          toolName: this.config.name,
          success: false,
          message: '代理设置失败，验证未通过'
        }
      }

      // 【性能优化】代理配置变更后清除缓存
      this.clearCache()

      return {
        toolName: this.config.name,
        success: true,
        message: `成功为 ${this.config.displayName} 启用代理`
      }
    } catch (error) {
      return {
        toolName: this.config.name,
        success: false,
        message: `启用代理异常: ${error}`
      }
    }
  }

  /**
   * 禁用代理
   * 默认实现：执行 disableCmds
   */
  async disableProxy(): Promise<ToolOperationResult> {
    if (!this.config.disableCmds || this.config.disableCmds.length === 0) {
      return {
        toolName: this.config.name,
        success: false,
        message: `工具 ${this.config.name} 不支持代理设置`
      }
    }

    try {
      // 执行所有禁用命令
      for (const cmd of this.config.disableCmds) {
        const result = await commandExecutor.execute(cmd)

        // 对于 git config --unset，返回 5 是正常的（表示没有找到配置）
        if (!result.success && !(cmd[0] === 'git' && result.returnCode === 5)) {
          // 继续执行其他命令，不立即返回
          console.warn(`[${this.config.name}] 执行禁用命令失败: ${cmd.join(' ')}`)
        }
      }

      // 等待命令执行完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 验证代理已禁用
      const stillEnabled = await this.isProxyEnabled()

      if (stillEnabled) {
        return {
          toolName: this.config.name,
          success: false,
          message: '代理禁用失败，验证未通过'
        }
      }

      // 【性能优化】代理配置变更后清除缓存
      this.clearCache()

      return {
        toolName: this.config.name,
        success: true,
        message: `成功为 ${this.config.displayName} 禁用代理`
      }
    } catch (error) {
      return {
        toolName: this.config.name,
        success: false,
        message: `禁用代理异常: ${error}`
      }
    }
  }

  /**
   * 获取工具的完整信息
   * 默认实现：调用各个检测方法
   * 【性能优化】使用缓存避免重复命令执行，并行执行多个检测
   */
  async getInfo(): Promise<ToolInfo> {
    try {
      console.log(`[${this.config.name}] 开始检测工具信息`)
      const startTime = Date.now()
      
      // 【性能优化】使用缓存的版本检测（避免重复执行 checkCmd）
      const checkResult = await this.getCached('checkCmd', async () => {
        return await commandExecutor.execute(this.config.checkCmd, 5000)
      })
      
      const installed = checkResult.success
      console.log(`[${this.config.name}] 安装状态: ${installed}`)

      // 【性能优化】从缓存的结果中提取版本信息，无需再次执行命令
      const version = installed ? filterValue(checkResult.stdout.trim().split('\n')[0]) : undefined
      if (installed && version) {
        console.log(`[${this.config.name}] 版本: ${version}`)
      }

      // 【性能优化】如果工具已安装，并行执行所有配置检测
      let proxyEnabled = false
      let currentProxy: string | undefined
      let registryUrl: string | undefined
      let cacheDir: string | undefined

      if (installed) {
        const [proxy, registry, cache] = await Promise.all([
          this.getCurrentProxy(),
          this.getCurrentRegistry(),
          this.getCurrentCacheDir()
        ])
        
        currentProxy = proxy
        registryUrl = registry
        cacheDir = cache
        proxyEnabled = proxy !== undefined && proxy.length > 0

        if (proxyEnabled && currentProxy) {
          console.log(`[${this.config.name}] 代理: ${currentProxy}`)
        }
        if (registryUrl) {
          console.log(`[${this.config.name}] 镜像源: ${registryUrl}`)
        }
        if (cacheDir) {
          console.log(`[${this.config.name}] 缓存目录: ${cacheDir}`)
        }
      }

      const duration = Date.now() - startTime
      console.log(`[${this.config.name}] ✓ 检测完成 (${duration}ms)`)

      return {
        name: this.config.name,
        displayName: this.config.displayName,
        category: this.config.category,
        status: installed ? 'installed' : 'not_installed',
        version,
        proxyEnabled,
        currentProxy,
        registryUrl,
        cacheDir,
        mirrors: this.config.mirrors,
        setRegistryCmd: this.config.setRegistryCmd,
        setCacheDirCmd: this.config.setCacheDirCmd,
        error: undefined
      }
    } catch (error) {
      console.error(`[${this.config.name}] 检测失败:`, error)
      return {
        name: this.config.name,
        displayName: this.config.displayName,
        category: this.config.category,
        status: 'error',
        error: String(error)
      }
    }
  }
}

