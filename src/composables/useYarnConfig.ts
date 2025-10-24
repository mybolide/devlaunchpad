/**
 * yarn 配置管理 Composable
 */
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

export function useYarnConfig() {
  const message = useMessage()
  
  // 状态
  const yarnStatus = ref<any>(null)
  const yarnStatusLoading = ref(false)
  const yarnCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
  const yarnCacheLoading = ref(false)
  
  // 获取 yarn 状态
  async function getYarnStatus() {
    if (!window.electronAPI) return
    
    try {
      yarnStatusLoading.value = true
      const result = await window.electronAPI.invoke('yarn:getStatus')
      
      if (result.success) {
        yarnStatus.value = result.data
        console.log('[getYarnStatus] 状态:', result.data)
      }
    } catch (error) {
      console.error('获取 yarn 状态失败:', error)
    } finally {
      yarnStatusLoading.value = false
    }
  }
  
  // 获取缓存信息
  async function loadYarnCacheInfo() {
    if (!window.electronAPI) return
    
    try {
      yarnCacheLoading.value = true
      const result = await window.electronAPI.invoke('yarn:getCacheInfo')
      
      if (result.success) {
        yarnCacheInfo.value = {
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
      yarnCacheLoading.value = false
    }
  }
  
  // 清理缓存
  async function cleanYarnCache() {
    if (!window.electronAPI) return
    
    try {
      yarnCacheLoading.value = true
      const result = await window.electronAPI.invoke('yarn:cleanCache')
      
      if (result.success) {
        message.success(result.message)
        // 重新加载缓存信息
        await loadYarnCacheInfo()
      } else {
        message.error('清理缓存失败: ' + result.message)
      }
    } catch (error) {
      message.error('清理缓存失败: ' + error)
    } finally {
      yarnCacheLoading.value = false
    }
  }
  
  return {
    // 状态
    yarnStatus,
    yarnStatusLoading,
    yarnCacheInfo,
    yarnCacheLoading,
    
    // 方法
    getYarnStatus,
    loadYarnCacheInfo,
    cleanYarnCache
  }
}

