/**
 * pnpm 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（使用默认实现）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * pnpm 配置
 */
const pnpmConfig: Tool = {
  name: 'pnpm',
  displayName: 'pnpm',
  category: 'package_manager',
  checkCmd: ['pnpm', '--version'],
  enableCmds: [
    ['pnpm', 'config', 'set', 'proxy', '{proxy}'],
    ['pnpm', 'config', 'set', 'https-proxy', '{proxy}']
  ],
  disableCmds: [
    ['pnpm', 'config', 'delete', 'proxy'],
    ['pnpm', 'config', 'delete', 'https-proxy']
  ],
  getProxyCmd: ['pnpm', 'config', 'get', 'proxy'],
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
      name: 'npmjs',
      displayName: 'npm 官方',
      url: 'https://registry.npmjs.org',
      location: '美国'
    }
  ],
  getRegistryCmd: ['pnpm', 'config', 'get', 'registry'],
  setRegistryCmd: ['pnpm', 'config', 'set', 'registry', '{registry}'],
  getCacheDirCmd: ['pnpm', 'config', 'get', 'store-dir'],
  setCacheDirCmd: ['pnpm', 'config', 'set', 'store-dir', '{cacheDir}'],
  description: '快速的 Node.js 包管理器'
}

/**
 * pnpm 模块类
 * 使用基类的默认实现，无特殊逻辑
 */
export class PnpmModule extends ToolModuleBase {
  readonly config: Tool = pnpmConfig
}

// 导出单例
export const pnpm = new PnpmModule()

// 兼容性：导出配置（用于旧代码）
export { pnpmConfig as pnpmTool }

