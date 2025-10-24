/**
 * yarn 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（特殊：需要读取 .yarnrc 文件）
 * - 代理管理（使用默认实现）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * yarn 配置
 */
const yarnConfig: Tool = {
  name: 'yarn',
  displayName: 'Yarn',
  category: 'package_manager',
  checkCmd: ['yarn', '--version'],
  enableCmds: [
    ['yarn', 'config', 'set', 'proxy', '{proxy}'],
    ['yarn', 'config', 'set', 'https-proxy', '{proxy}']
  ],
  disableCmds: [
    ['yarn', 'config', 'delete', 'proxy'],
    ['yarn', 'config', 'delete', 'https-proxy']
  ],
  getProxyCmd: ['yarn', 'config', 'get', 'proxy'],
  mirrors: [
    {
      name: 'npmmirror',
      displayName: '阿里云（npmmirror）',
      url: 'https://registry.npmmirror.com',
      location: '中国·杭州'
    },
    {
      name: 'yarnpkg',
      displayName: 'Yarn 官方',
      url: 'https://registry.yarnpkg.com',
      location: '美国'
    }
  ],
  getRegistryCmd: ['yarn', 'config', 'get', 'registry'],
  setRegistryCmd: ['yarn', 'config', 'set', 'registry', '{registry}'],
  getCacheDirCmd: ['yarn', 'config', 'get', 'cache-folder'],
  setCacheDirCmd: ['yarn', 'config', 'set', 'cache-folder', '{cacheDir}'],
  description: '快速、可靠、安全的 Node.js 包管理器'
}

/**
 * yarn 模块类
 * 覆盖 getCurrentProxy 方法以实现读取 .yarnrc 文件的特殊逻辑
 */
export class YarnModule extends ToolModuleBase {
  readonly config: Tool = yarnConfig

  /**
   * 获取当前代理设置
   * 特殊逻辑：读取 .yarnrc 文件
   */
  async getCurrentProxy(): Promise<string | undefined> {
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
              const value = match[1].trim().toLowerCase()
              // 过滤无效值
              if (value && value !== 'null' && value !== 'undefined' && value !== 'none') {
                return match[1]
              }
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

    return undefined
  }
}

// 导出单例
export const yarn = new YarnModule()

// 兼容性：导出配置（用于旧代码）
export { yarnConfig as yarnTool }

