/**
 * maven 工具模块
 * 
 * 包含：
 * - 配置信息
 * - 检测逻辑（使用默认实现）
 * - 代理管理（需要通过 settings.xml 文件配置，暂不支持）
 */

import { ToolModuleBase } from './base'
import type { Tool } from '../../../src/types/index'

/**
 * maven 配置
 */
const mavenConfig: Tool = {
  name: 'maven',
  displayName: 'Maven',
  category: 'dev_tool',
  checkCmd: ['mvn', '--version'],
  enableCmds: [
    // Maven 代理需要通过 settings.xml 文件配置
    // 这里暂时不支持命令行配置
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
      name: 'tencent',
      displayName: '腾讯云',
      url: 'https://mirrors.cloud.tencent.com/nexus/repository/maven-public',
      location: '中国·深圳'
    },
    {
      name: 'huawei',
      displayName: '华为云',
      url: 'https://mirrors.huaweicloud.com/repository/maven',
      location: '中国·深圳'
    },
    {
      name: 'central',
      displayName: 'Maven Central',
      url: 'https://repo.maven.apache.org/maven2',
      location: '美国'
    }
  ],
  description: 'Java 项目管理和构建工具'
}

/**
 * maven 模块类
 * 使用基类的默认实现，无特殊逻辑
 * 注意：Maven 的代理配置需要手动修改 settings.xml 文件
 */
export class MavenModule extends ToolModuleBase {
  readonly config: Tool = mavenConfig
}

// 导出单例
export const maven = new MavenModule()

// 兼容性：导出配置（用于旧代码）
export { mavenConfig as mavenTool }

