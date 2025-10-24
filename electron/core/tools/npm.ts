/**
 * npm 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（使用默认实现）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * npm 配置
 */
const npmConfig: Tool = {
  name: 'npm',
  displayName: 'npm',
  category: 'package_manager',
  checkCmd: ['npm', '--version'],
  enableCmds: [
    ['npm', 'config', 'set', 'proxy', '{proxy}'],
    ['npm', 'config', 'set', 'https-proxy', '{proxy}']
  ],
  disableCmds: [
    ['npm', 'config', 'delete', 'proxy'],
    ['npm', 'config', 'delete', 'https-proxy']
  ],
  getProxyCmd: ['npm', 'config', 'get', 'proxy'],
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
  getRegistryCmd: ['npm', 'config', 'get', 'registry'],
  setRegistryCmd: ['npm', 'config', 'set', 'registry', '{registry}'],
  getCacheDirCmd: ['npm', 'config', 'get', 'cache'],
  setCacheDirCmd: ['npm', 'config', 'set', 'cache', '{cacheDir}'],
  description: 'Node.js 包管理器'
}

/**
 * npm 模块类
 * 使用基类的默认实现，无特殊逻辑
 */
export class NpmModule extends ToolModuleBase {
  readonly config: Tool = npmConfig
}

// 导出单例
export const npm = new NpmModule()

// 兼容性：导出配置（用于旧代码）
export { npmConfig as npmTool }

