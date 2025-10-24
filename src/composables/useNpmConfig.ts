/**
 * npm 配置管理 Composable
 */
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

export function useNpmConfig() {
  const message = useMessage()
  
  // 状态
  const npmStatus = ref<any>(null)
  const npmStatusLoading = ref(false)
  const npmCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
  const npmCacheLoading = ref(false)
  const npmPingResult = ref<{ success: boolean; duration: number; message: string } | null>(null)
  const npmPingLoading = ref(false)
  
  // 获取 npm 状态
  async function getNpmStatus() {
    if (!window.electronAPI) return
    
    try {
      npmStatusLoading.value = true
      const result = await window.electronAPI.invoke('npm:getStatus')
      
      if (result.success) {
        npmStatus.value = result.data
        console.log('[getNpmStatus] 状态:', result.data)
      }
    } catch (error) {
      console.error('获取 npm 状态失败:', error)
    } finally {
      npmStatusLoading.value = false
    }
  }
  
  // 获取缓存信息
  async function loadNpmCacheInfo() {
    if (!window.electronAPI) return
    
    try {
      npmCacheLoading.value = true
      const result = await window.electronAPI.invoke('npm:getCacheInfo')
      
      if (result.success) {
        npmCacheInfo.value = {
          cachePath: result.cachePath,
          sizeFormatted: result.sizeFormatted,
          sizeInBytes: result.sizeInBytes
        }
      } else {
        message.error('获取缓存信息失败: ' + result.message)
      }
    } catch (error) {
      message.error('获取缓存信息失败: ' + error)
    } finally {
      npmCacheLoading.value = false
    }
  }
  
  // 清理缓存
  async function cleanNpmCache() {
    if (!window.electronAPI) return
    
    try {
      npmCacheLoading.value = true
      const result = await window.electronAPI.invoke('npm:cleanCache')
      
      if (result.success) {
        message.success(result.message)
        // 重新加载缓存信息
        await loadNpmCacheInfo()
      } else {
        message.error('清理缓存失败: ' + result.message)
      }
    } catch (error) {
      message.error('清理缓存失败: ' + error)
    } finally {
      npmCacheLoading.value = false
    }
  }
  
  // 测试镜像源
  async function npmPingTest(registryUrl?: string) {
    if (!window.electronAPI) return
    
    try {
      npmPingLoading.value = true
      npmPingResult.value = null
      
      const result = await window.electronAPI.invoke('npm:testRegistry', registryUrl)
      
      npmPingResult.value = result
    } catch (error: any) {
      message.error('测试失败: ' + error.message)
    } finally {
      npmPingLoading.value = false
    }
  }
  
  // 清空全局配置
  async function clearAllGlobalConfig(refreshCallback?: () => void) {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.invoke('npm:clearAllGlobalConfig')
      
      if (result.success) {
        message.success(result.message || 'Global 配置已清空')
        // 刷新状态
        await getNpmStatus()
        // 调用回调刷新工具信息
        if (refreshCallback) refreshCallback()
      } else {
        message.error(result.message || '清空失败')
      }
    } catch (error) {
      message.error('清空 global 配置失败: ' + error)
    }
  }
  
  return {
    // 状态
    npmStatus,
    npmStatusLoading,
    npmCacheInfo,
    npmCacheLoading,
    npmPingResult,
    npmPingLoading,
    
    // 方法
    getNpmStatus,
    loadNpmCacheInfo,
    cleanNpmCache,
    npmPingTest,
    clearAllGlobalConfig
  }
}

