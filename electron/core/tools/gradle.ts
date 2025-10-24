/**
 * gradle 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（需要通过 gradle.properties 配置，暂不支持）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * gradle 配置
 */
const gradleConfig: Tool = {
  name: 'gradle',
  displayName: 'Gradle',
  category: 'dev_tool',
  checkCmd: ['gradle', '--version'],
  enableCmds: [
    // Gradle 代理需要通过 gradle.properties 配置
  ],
  disableCmds: [],
  getProxyCmd: [],
  mirrors: [
    {
      name: 'aliyun',
      displayName: '阿里云',
      url: 'https://maven.aliyun.com/repository/public',
      location: '中国·杭州'
    },
    {
      name: 'gradle',
      displayName: 'Gradle 官方',
      url: 'https://services.gradle.org/distributions',
      location: '美国'
    }
  ],
  description: '基于 Groovy 的构建工具'
}

/**
 * gradle 模块类
 * 使用基类的默认实现，无特殊逻辑
 * 注意：Gradle 的代理配置需要手动修改 gradle.properties 文件
 */
export class GradleModule extends ToolModuleBase {
  readonly config: Tool = gradleConfig
}

// 导出单例
export const gradle = new GradleModule()

// 兼容性：导出配置（用于旧代码）
export { gradleConfig as gradleTool }

