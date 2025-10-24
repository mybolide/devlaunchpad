/**
 * pip 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（使用默认实现）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * pip 配置
 */
const pipConfig: Tool = {
  name: 'pip',
  displayName: 'pip',
  category: 'package_manager',
  checkCmd: ['pip', '--version'],
  enableCmds: [
    ['pip', 'config', 'set', 'global.proxy', '{proxy}']
  ],
  disableCmds: [
    ['pip', 'config', 'unset', 'global.proxy']
  ],
  getProxyCmd: ['pip', 'config', 'get', 'global.proxy'],
  mirrors: [
    {
      name: 'tuna',
      displayName: '清华大学',
      url: 'https://pypi.tuna.tsinghua.edu.cn/simple',
      location: '中国·北京',
      homepage: 'https://mirrors.tuna.tsinghua.edu.cn/help/pypi/'
    },
    {
      name: 'aliyun',
      displayName: '阿里云',
      url: 'https://mirrors.aliyun.com/pypi/simple',
      location: '中国·杭州'
    },
    {
      name: 'tencent',
      displayName: '腾讯云',
      url: 'https://mirrors.cloud.tencent.com/pypi/simple',
      location: '中国·深圳'
    },
    {
      name: 'douban',
      displayName: '豆瓣',
      url: 'https://pypi.doubanio.com/simple',
      location: '中国·北京'
    },
    {
      name: 'pypi',
      displayName: 'PyPI 官方',
      url: 'https://pypi.org/simple',
      location: '美国'
    }
  ],
  getRegistryCmd: ['pip', 'config', 'get', 'global.index-url'],
  setRegistryCmd: ['pip', 'config', 'set', 'global.index-url', '{registry}'],
  getCacheDirCmd: ['pip', 'config', 'get', 'global.cache-dir'],
  setCacheDirCmd: ['pip', 'config', 'set', 'global.cache-dir', '{cacheDir}'],
  description: 'Python 包管理器'
}

/**
 * pip 模块类
 * 使用基类的默认实现，无特殊逻辑
 */
export class PipModule extends ToolModuleBase {
  readonly config: Tool = pipConfig
}

// 导出单例
export const pip = new PipModule()

// 兼容性：导出配置（用于旧代码）
export { pipConfig as pipTool }

