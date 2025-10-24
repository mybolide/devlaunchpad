/**
 * git 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（使用默认实现）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * git 配置
 */
const gitConfig: Tool = {
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
}

/**
 * git 模块类
 * 使用基类的默认实现，无特殊逻辑
 */
export class GitModule extends ToolModuleBase {
  readonly config: Tool = gitConfig
}

// 导出单例
export const git = new GitModule()

// 兼容性：导出配置（用于旧代码）
export { gitConfig as gitTool }

