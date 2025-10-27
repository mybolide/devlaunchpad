/**
 * 工具配置模块共享类型定义
 */

/**
 * 镜像源配置
 */
export interface Mirror {
  name: string          // 镜像源标识符
  displayName: string   // 显示名称
  url: string           // 镜像源 URL
  location?: string     // 地理位置
}

/**
 * 代理配置类型
 */
export type ProxyType = 'none' | 'global' | 'custom'

/**
 * 工具配置表单数据
 */
export interface ToolConfigForm {
  registry: string          // 镜像源 URL
  selectedMirror: string    // 选中的镜像源名称
  proxyType: ProxyType      // 代理类型
  customProxy: string       // 自定义代理 URL
  cacheDir: string          // 缓存目录
}

/**
 * 配置标签页类型
 */
export type ConfigTab = 'registry' | 'proxy' | 'cache'

/**
 * 缓存信息
 */
export interface CacheInfo {
  cachePath: string         // 缓存路径
  sizeFormatted: string     // 格式化的大小
  sizeInBytes: number       // 字节大小
}

/**
 * 测速结果
 */
export interface PingResult {
  success: boolean          // 是否成功
  duration: number          // 响应时间（ms）
  message: string           // 消息
}

/**
 * 工具状态
 */
export interface ToolStatus {
  hasGlobalConfig: boolean              // 是否有全局配置
  envVars: Record<string, string>       // 环境变量
  registryUrl?: string                  // 当前镜像源
  proxyUrl?: string                     // 当前代理
  cacheDir?: string                     // 当前缓存目录
}

/**
 * 配置保存数据
 */
export interface SaveConfigData {
  tool_name: string
  registry_url?: string
  cache_dir?: string
  proxy_type?: string
  custom_proxy?: string
}

