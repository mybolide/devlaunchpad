/**
 * npm 专用逻辑处理器
 * 处理 npm 配置保存、缓存管理、状态检测等
 */
import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'

export function useNpmHandlers(refreshToolInfo: (toolName: string) => Promise<void>) {
  const message = useMessage()
  const dialog = useDialog()
  
  // npm 专用状态
  const npmCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
  const npmCacheLoading = ref(false)
  const npmStatus = ref<any>(null)
  const npmStatusLoading = ref(false)
  const npmModalRef = ref()
  
  /**
   * 获取 npm 缓存信息
   */
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
  
  /**
   * 清理 npm 缓存
   */
  async function cleanNpmCache() {
    if (!window.electronAPI) return
    
    try {
      npmCacheLoading.value = true
      const result = await window.electronAPI.invoke('npm:cleanCache')
      
      if (result.success) {
        message.success(result.message)
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
  
  /**
   * 获取 npm 状态
   */
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
  
  /**
   * 一键清空 global 配置
   */
  async function clearAllGlobalConfig() {
    if (!window.electronAPI) return
    
    dialog.warning({
      title: '确认清空',
      content: '将清空所有 npm global 配置，让 user 配置接管。是否继续？',
      positiveText: '清空',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const result = await window.electronAPI.invoke('npm:clearAllGlobalConfig')
          
          if (result.success) {
            message.success(result.message || 'Global 配置已清空')
            await getNpmStatus()
            await refreshToolInfo('npm')
          } else {
            message.error(result.message || '清空失败')
          }
        } catch (error) {
          message.error('清空 global 配置失败: ' + error)
        }
      }
    })
  }
  
  /**
   * 处理 npm 配置保存
   */
  async function handleNpmSave(data: any) {
    const { tab, form } = data
    
    console.log('[handleNpmSave] 保存数据:', { tab, form })
    
    if (npmModalRef.value) npmModalRef.value.setSaving(true)
    
    try {
      // 保存到配置文件
      await window.electronAPI.db.saveToolConfig({
        tool_name: 'npm',
        registry_url: tab === 'registry' ? form.registry : undefined,
        cache_dir: tab === 'cache' ? form.cacheDir : undefined,
        proxy_type: tab === 'proxy' ? form.proxyType : undefined,
        custom_proxy: tab === 'proxy' ? form.customProxy : undefined
      })
      
      // 根据 tab 执行对应操作
      if (tab === 'registry') {
        if (!form.registry || !form.registry.trim()) {
          message.warning('请先输入或选择镜像源地址')
          if (npmModalRef.value) npmModalRef.value.setSaving(false)
          return
        }
        
        const result = await window.electronAPI.invoke('npm:setRegistry', form.registry)
        if (result.success) {
          message.success(`✓ 镜像源设置成功`)
          if (npmModalRef.value) npmModalRef.value.updateForm({ registry: result.value })
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
        
        const result = await window.electronAPI.invoke('npm:setProxy', proxyUrl)
        if (result.success) {
          message.success(proxyUrl ? '✓ 代理已设置' : '✓ 代理已清除')
        } else {
          message.error(`代理设置失败: ${result.message}`)
        }
      } else if (tab === 'cache' && form.cacheDir) {
        const result = await window.electronAPI.invoke('npm:setCacheDir', form.cacheDir)
        if (result.success) {
          message.success(`✓ 缓存目录设置成功`)
          if (npmModalRef.value) npmModalRef.value.updateForm({ cacheDir: result.value })
          loadNpmCacheInfo()
        } else {
          message.error(`缓存目录设置失败: ${result.message}`)
        }
      }
    } catch (error) {
      message.error('保存配置失败: ' + error)
    } finally {
      if (npmModalRef.value) npmModalRef.value.setSaving(false)
      refreshToolInfo('npm')
    }
  }
  
  return {
    npmModalRef,
    npmCacheInfo,
    npmCacheLoading,
    npmStatus,
    npmStatusLoading,
    loadNpmCacheInfo,
    cleanNpmCache,
    getNpmStatus,
    clearAllGlobalConfig,
    handleNpmSave
  }
}

