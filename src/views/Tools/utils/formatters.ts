/**
 * 工具页面通用格式化函数
 */

/**
 * 提取版本号
 */
export function extractVersion(versionString: string): string {
  if (!versionString) return '-'
  
  // 匹配常见版本号格式：v1.2.3 或 1.2.3
  const match = versionString.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/)
  if (match && match[1]) {
    return match[1]
  }
  
  // 如果没有匹配到，返回前20个字符
  return versionString.substring(0, 20)
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 获取全局代理 URL
 */
export function getGlobalProxyUrl(): string {
  const saved = localStorage.getItem('globalProxy')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      if (config.enabled) {
        return `${config.protocol}://${config.host}:${config.port}`
      }
    } catch (e) {
      console.error('解析全局代理配置失败', e)
    }
  }
  return ''
}

