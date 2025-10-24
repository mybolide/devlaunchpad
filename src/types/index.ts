/**
 * DevKit 类型定义
 * 核心数据结构和接口定义
 */

// ==================== Electron API ====================

declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<boolean>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
      command: {
        execute: (command: string) => Promise<{
          success: boolean
          stdout: string
          stderr: string
        }>
      }
      tool: {
        getAllTools: () => Promise<ToolInfo[]>
        getToolInfo: (toolName: string) => Promise<ToolInfo | null>
        getToolsInfo: (toolNames: string[]) => Promise<ToolInfo[]>
        isInstalled: (toolName: string) => Promise<boolean>
        getVersion: (toolName: string) => Promise<string | undefined>
      }
      proxy: {
        enable: (toolName: string, proxyUrl: string) => Promise<ToolOperationResult>
        disable: (toolName: string) => Promise<ToolOperationResult>
        enableBatch: (toolNames: string[], proxyUrl: string) => Promise<BatchOperationResult>
        disableBatch: (toolNames: string[]) => Promise<BatchOperationResult>
        test: (proxyUrl: string) => Promise<boolean>
      }
      db: {
        getCategories: () => Promise<any[]>
        saveToolConfig: (config: any) => Promise<any>
        getToolConfig: (toolName: string) => Promise<any>
      }
      platform: string
      versions: NodeJS.ProcessVersions
    }
  }
}

// ==================== 命令执行结果 ====================

export interface CommandResult {
  success: boolean
  returnCode: number
  stdout: string
  stderr: string
  command: string
  executionTime: number
}

// ==================== 工具定义 ====================

export type ToolCategory = 'package_manager' | 'dev_tool' | 'browser'

// 镜像源定义
export interface Mirror {
  name: string
  displayName: string
  url: string
  location?: string // 镜像站位置，如 "中国·北京"
  homepage?: string
}

export interface Tool {
  name: string
  displayName: string
  category: ToolCategory
  checkCmd: string[]
  enableCmds: string[][]
  disableCmds: string[][]
  getProxyCmd: string[]
  // 镜像源相关
  mirrors?: Mirror[] // 可用镜像源列表
  getRegistryCmd?: string[] // 获取当前镜像源命令
  setRegistryCmd?: string[] // 设置镜像源命令，{registry} 会被替换
  // 缓存目录相关
  getCacheDirCmd?: string[] // 获取缓存目录
  setCacheDirCmd?: string[] // 设置缓存目录
  iconPath?: string
  description: string
}

// ==================== 工具状态 ====================

export enum ToolStatus {
  Installed = 'installed',
  NotInstalled = 'not_installed',
  Unknown = 'unknown',
  Error = 'error'
}

export interface ToolInfo {
  name: string
  displayName: string
  category: ToolCategory
  status: ToolStatus
  version?: string
  proxyEnabled?: boolean
  currentProxy?: string
  cacheDir?: string
  registryUrl?: string
  error?: string
}

// ==================== 代理配置 ====================

export interface ProxyConfig {
  protocol: 'http' | 'https' | 'socks5'
  host: string
  port: number
  username?: string
  password?: string
}

export function proxyConfigToString(config: ProxyConfig): string {
  let proxy = `${config.protocol}://`
  if (config.username && config.password) {
    proxy += `${config.username}:${config.password}@`
  }
  proxy += `${config.host}:${config.port}`
  return proxy
}

export function stringToProxyConfig(proxy: string): ProxyConfig | null {
  try {
    const url = new URL(proxy)
    return {
      protocol: (url.protocol.replace(':', '') as any) || 'http',
      host: url.hostname,
      port: parseInt(url.port) || 80,
      username: url.username || undefined,
      password: url.password || undefined
    }
  } catch {
    return null
  }
}

// ==================== 软件定义 ====================

export interface Software {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  downloadUrl: string
  icon?: string
  category?: string
  installed?: boolean
  installTime?: number
  tags?: string[]
}

// ==================== 应用配置 ====================

export interface AppConfig {
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
  proxyGlobal?: ProxyConfig
  cacheDirs: Record<string, string>
  registryUrls: Record<string, string>
}

// ==================== IPC 事件类型 ====================

export interface IpcMessage<T = any> {
  event: string
  data?: T
  timestamp: number
}

export interface IpcResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}

// ==================== 工具操作结果 ====================

export interface ToolOperationResult {
  toolName: string
  success: boolean
  message: string
  details?: CommandResult
}

// ==================== 批量操作结果 ====================

export interface BatchOperationResult {
  totalTools: number
  successCount: number
  failureCount: number
  results: ToolOperationResult[]
}
