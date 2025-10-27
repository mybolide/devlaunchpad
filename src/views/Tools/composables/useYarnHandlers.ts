/**
 * yarn 专用逻辑处理器
 * 处理 yarn 配置保存、缓存管理、状态检测等
 */
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

export function useYarnHandlers(refreshToolInfo: (toolName: string) => Promise<void>) {
  const message = useMessage()
  
  // yarn 专用状态
  const yarnCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
  const yarnCacheLoading = ref(false)
  const yarnStatus = ref<any>(null)
  const yarnStatusLoading = ref(false)
  const yarnModalRef = ref()
  
  /**
   * 获取 yarn 缓存信息
   */
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
  
  /**
   * 清理 yarn 缓存
   */
  async function cleanYarnCache() {
    if (!window.electronAPI) return
    
    try {
      yarnCacheLoading.value = true
      const result = await window.electronAPI.invoke('yarn:cleanCache')
      
      if (result.success) {
        message.success(result.message)
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
  
  /**
   * 获取 yarn 状态
   */
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
  
  /**
   * 处理 yarn 配置保存
   */
  async function handleYarnSave(data: any) {
    const { tab, form } = data
    
    if (yarnModalRef.value) yarnModalRef.value.setSaving(true)
    
    try {
      // 保存到配置文件
      await window.electronAPI.db.saveToolConfig({
        tool_name: 'yarn',
        registry_url: tab === 'registry' ? form.registry : undefined,
        cache_dir: tab === 'cache' ? form.cacheDir : undefined,
        proxy_type: tab === 'proxy' ? form.proxyType : undefined,
        custom_proxy: tab === 'proxy' ? form.customProxy : undefined
      })
      
      // 根据 tab 执行对应操作
      if (tab === 'registry' && form.registry) {
        const result = await window.electronAPI.invoke('yarn:setRegistry', form.registry)
        if (result.success) {
          message.success(`✓ 镜像源设置成功`)
          if (yarnModalRef.value) yarnModalRef.value.updateForm({ registry: result.value })
        } else {
          message.error(`镜像源设置失败: ${result.message}`)
        }
      } else if (tab === 'proxy') {
        let proxyUrl = null
        if (form.proxyType === 'global') {
          const saved = localStorage.getItem('globalProxy')
          if (saved) {
            try {
              const config = JSON.parse(saved)
              if (config.enabled) {
                proxyUrl = `${config.protocol}://${config.host}:${config.port}`
              }
            } catch (e) {
              console.error('解析全局代理配置失败', e)
            }
          }
        } else if (form.proxyType === 'custom') {
          proxyUrl = form.customProxy
        }
        
        const result = await window.electronAPI.invoke('yarn:setProxy', proxyUrl)
        if (result.success) {
          message.success(proxyUrl ? '✓ 代理已设置' : '✓ 代理已清除')
        } else {
          message.error(`代理设置失败: ${result.message}`)
        }
      } else if (tab === 'cache' && form.cacheDir) {
        const result = await window.electronAPI.invoke('yarn:setCacheFolder', form.cacheDir)
        if (result.success) {
          message.success(`✓ 缓存目录设置成功`)
          if (yarnModalRef.value) yarnModalRef.value.updateForm({ cacheDir: result.value })
          loadYarnCacheInfo()
        } else {
          message.error(`缓存目录设置失败: ${result.message}`)
        }
      }
    } catch (error) {
      message.error('保存配置失败: ' + error)
    } finally {
      if (yarnModalRef.value) yarnModalRef.value.setSaving(false)
      refreshToolInfo('yarn')
    }
  }
  
  return {
    yarnModalRef,
    yarnCacheInfo,
    yarnCacheLoading,
    yarnStatus,
    yarnStatusLoading,
    loadYarnCacheInfo,
    cleanYarnCache,
    getYarnStatus,
    handleYarnSave
  }
}


