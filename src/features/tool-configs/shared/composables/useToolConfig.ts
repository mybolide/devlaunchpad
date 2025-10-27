/**
 * 通用工具配置管理 Composable
 */
import { ref, computed } from 'vue'
import type { ToolConfigForm, ConfigTab, SaveConfigData } from '../../types'

export function useToolConfig(toolName: string) {
  // 表单数据
  const form = ref<ToolConfigForm>({
    registry: '',
    selectedMirror: '',
    proxyType: 'none',
    customProxy: '',
    cacheDir: ''
  })

  // 当前激活的标签页
  const activeTab = ref<ConfigTab>('registry')

  // 加载状态
  const loading = ref(false)
  const saving = ref(false)

  // 是否有修改
  const isDirty = ref(false)

  // 设置表单数据
  function setForm(data: Partial<ToolConfigForm>) {
    form.value = { ...form.value, ...data }
    isDirty.value = true
  }

  // 重置表单
  function resetForm() {
    form.value = {
      registry: '',
      selectedMirror: '',
      proxyType: 'none',
      customProxy: '',
      cacheDir: ''
    }
    isDirty.value = false
  }

  // 生成保存数据
  function getSaveData(): SaveConfigData {
    return {
      tool_name: toolName,
      registry_url: activeTab.value === 'registry' ? form.value.registry : undefined,
      cache_dir: activeTab.value === 'cache' ? form.value.cacheDir : undefined,
      proxy_type: activeTab.value === 'proxy' ? form.value.proxyType : undefined,
      custom_proxy: activeTab.value === 'proxy' ? form.value.customProxy : undefined
    }
  }

  return {
    form,
    activeTab,
    loading,
    saving,
    isDirty,
    setForm,
    resetForm,
    getSaveData
  }
}

