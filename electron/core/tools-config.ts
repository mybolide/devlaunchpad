/**
 * 工具配置定义
 * 定义所有支持的开发工具及其配置命令
 */

import type { Tool, ToolCategory } from '../../src/types/index'

/**
 * 所有支持的工具配置
 */
const SUPPORTED_TOOLS: Record<string, Tool> = {
  // ========== 包管理器 ==========
  npm: {
    name: 'npm',
    displayName: 'npm',
    category: 'package_manager',
    checkCmd: ['npm', '--version'],
    enableCmds: [
      ['npm', 'config', 'set', 'proxy', '{proxy}', '--global'],
      ['npm', 'config', 'set', 'https-proxy', '{proxy}', '--global']
    ],
    disableCmds: [
      ['npm', 'config', 'delete', 'proxy', '--global'],
      ['npm', 'config', 'delete', 'https-proxy', '--global']
    ],
    getProxyCmd: ['npm', 'config', 'get', 'proxy', '--global'],
    // 镜像源配置
    mirrors: [
      {
        name: 'npmmirror',
        displayName: '阿里云（npmmirror）',
        url: 'https://registry.npmmirror.com',
        location: '中国·杭州',
        homepage: 'https://npmmirror.com'
      },
      {
        name: 'tencent',
        displayName: '腾讯云',
        url: 'https://mirrors.cloud.tencent.com/npm',
        location: '中国·深圳'
      },
      {
        name: 'huawei',
        displayName: '华为云',
        url: 'https://mirrors.huaweicloud.com/repository/npm',
        location: '中国·深圳'
      },
      {
        name: 'npmjs',
        displayName: 'npm 官方',
        url: 'https://registry.npmjs.org',
        location: '美国'
      }
    ],
    getRegistryCmd: ['npm', 'config', 'get', 'registry', '--global'],
    setRegistryCmd: ['npm', 'config', 'set', 'registry', '{registry}', '--global'],
    getCacheDirCmd: ['npm', 'config', 'get', 'cache', '--global'],
    setCacheDirCmd: ['npm', 'config', 'set', 'cache', '{cacheDir}', '--global'],
    description: 'Node.js 包管理器'
  },

  yarn: {
    name: 'yarn',
    displayName: 'Yarn',
    category: 'package_manager',
    checkCmd: ['yarn', '--version'],
    enableCmds: [
      ['yarn', 'config', 'set', 'proxy', '{proxy}', '--global'],
      ['yarn', 'config', 'set', 'https-proxy', '{proxy}', '--global']
    ],
    disableCmds: [
      ['yarn', 'config', 'delete', 'proxy', '--global'],
      ['yarn', 'config', 'delete', 'https-proxy', '--global']
    ],
    getProxyCmd: ['yarn', 'config', 'get', 'proxy', '--global'],
    // 镜像源配置（与 npm 共享镜像源）
    mirrors: [
      {
        name: 'npmmirror',
        displayName: '阿里云（npmmirror）',
        url: 'https://registry.npmmirror.com',
        location: '中国·杭州'
      },
      {
        name: 'tencent',
        displayName: '腾讯云',
        url: 'https://mirrors.cloud.tencent.com/npm',
        location: '中国·深圳'
      },
      {
        name: 'yarnpkg',
        displayName: 'Yarn 官方',
        url: 'https://registry.yarnpkg.com',
        location: '美国'
      }
    ],
    getRegistryCmd: ['yarn', 'config', 'get', 'registry'],
    setRegistryCmd: ['yarn', 'config', 'set', 'registry', '{registry}', '--global'],
    getCacheDirCmd: ['yarn', 'config', 'get', 'cache-folder'], // yarn 使用 cache-folder 而不是 cache
    setCacheDirCmd: ['yarn', 'config', 'set', 'cache-folder', '{cacheDir}', '--global'],
    description: '快速可靠的 JavaScript 包管理器'
  },

  pnpm: {
    name: 'pnpm',
    displayName: 'pnpm',
    category: 'package_manager',
    checkCmd: ['pnpm', '--version'],
    enableCmds: [
      ['pnpm', 'config', 'set', 'proxy', '{proxy}', '--global'],
      ['pnpm', 'config', 'set', 'https-proxy', '{proxy}', '--global']
    ],
    disableCmds: [
      ['pnpm', 'config', 'delete', 'proxy', '--global'],
      ['pnpm', 'config', 'delete', 'https-proxy', '--global']
    ],
    getProxyCmd: ['pnpm', 'config', 'get', 'proxy', '--global'],
    // 镜像源配置
    mirrors: [
      {
        name: 'npmmirror',
        displayName: '阿里云（npmmirror）',
        url: 'https://registry.npmmirror.com',
        location: '中国·杭州'
      },
      {
        name: 'npmjs',
        displayName: 'npm 官方',
        url: 'https://registry.npmjs.org',
        location: '美国'
      }
    ],
    getRegistryCmd: ['pnpm', 'config', 'get', 'registry'],
    setRegistryCmd: ['pnpm', 'config', 'set', 'registry', '{registry}', '--global'],
    getCacheDirCmd: ['pnpm', 'config', 'get', 'store-dir'], // pnpm 使用 store-dir
    setCacheDirCmd: ['pnpm', 'config', 'set', 'store-dir', '{cacheDir}', '--global'],
    description: '高效的磁盘空间利用的包管理器'
  },

  bun: {
    name: 'bun',
    displayName: 'Bun',
    category: 'package_manager',
    checkCmd: ['bun', '--version'],
    enableCmds: [
      ['bun', 'pm', 'config', 'set', 'httpProxy', '{proxy}', '--global'],
      ['bun', 'pm', 'config', 'set', 'httpsProxy', '{proxy}', '--global']
    ],
    disableCmds: [
      ['bun', 'pm', 'config', 'rm', 'httpProxy', '--global'],
      ['bun', 'pm', 'config', 'rm', 'httpsProxy', '--global']
    ],
    getProxyCmd: ['bun', 'pm', 'config', 'get', 'httpProxy', '--global'],
    getRegistryCmd: ['bun', 'pm', 'config', 'get', 'registry'],
    setRegistryCmd: ['bun', 'pm', 'config', 'set', 'registry', '{registry}'],
    description: '极速 JavaScript 运行时和包管理器'
  },

  // ========== 开发工具 ==========
  git: {
    name: 'git',
    displayName: 'Git',
    category: 'dev_tool',
    checkCmd: ['git', '--version'],
    enableCmds: [
      ['git', 'config', '--global', 'http.proxy', '{proxy}'],
      ['git', 'config', '--global', 'https.proxy', '{proxy}']
    ],
    disableCmds: [
      ['git', 'config', '--global', '--unset', 'http.proxy'],
      ['git', 'config', '--global', '--unset', 'https.proxy']
    ],
    getProxyCmd: ['git', 'config', '--global', 'http.proxy'],
    description: '分布式版本控制系统'
  },

  curl: {
    name: 'curl',
    displayName: 'cURL',
    category: 'dev_tool',
    checkCmd: ['curl', '--version'],
    enableCmds: [], // curl 使用环境变量
    disableCmds: [],
    getProxyCmd: [],
    description: '命令行数据传输工具'
  },

  wget: {
    name: 'wget',
    displayName: 'Wget',
    category: 'dev_tool',
    checkCmd: ['wget', '--version'],
    enableCmds: [], // wget 使用 .wgetrc 文件
    disableCmds: [],
    getProxyCmd: [],
    description: '网络文件下载工具'
  }
}

/**
 * 获取工具定义
 */
export function getTool(toolName: string): Tool | null {
  return SUPPORTED_TOOLS[toolName] || null
}

/**
 * 获取所有支持的工具
 */
export function getAllTools(): Tool[] {
  return Object.values(SUPPORTED_TOOLS)
}

/**
 * 按类别获取工具
 */
export function getToolsByCategory(category: ToolCategory): Tool[] {
  return Object.values(SUPPORTED_TOOLS).filter((tool) => tool.category === category)
}

/**
 * 获取所有工具类别
 */
export function getCategories(): ToolCategory[] {
  const categories = new Set<ToolCategory>(
    Object.values(SUPPORTED_TOOLS).map((tool) => tool.category)
  )
  return Array.from(categories).sort()
}

/**
 * 检查工具是否支持
 */
export function isToolSupported(toolName: string): boolean {
  return toolName in SUPPORTED_TOOLS
}

export default {
  getTool,
  getAllTools,
  getToolsByCategory,
  getCategories,
  isToolSupported,
  SUPPORTED_TOOLS
}
