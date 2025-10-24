<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NSpin, NTabs, NTabPane, useMessage, useDialog } from 'naive-ui'
import type { ToolInfo } from '../types'

// 导入 composables
import { useNpmConfig } from '../composables/useNpmConfig'
import { useYarnConfig } from '../composables/useYarnConfig'
import { useToolDetection } from '../composables/useToolDetection'

// 导入组件
import ToolsTable from '../components/tools/ToolsTable.vue'
import NpmConfigModal from '../components/tools/npm/NpmConfigModal.vue'
import YarnConfigModal from '../components/tools/yarn/YarnConfigModal.vue'
import PnpmConfigModal from '../components/tools/PnpmConfigModal.vue'

const message = useMessage()
const dialog = useDialog()

// ============================================
// 使用 Composables
// ============================================
const {
  npmStatus,
  npmCacheInfo,
  npmCacheLoading,
  getNpmStatus,
  loadNpmCacheInfo,
  cleanNpmCache,
  clearAllGlobalConfig
} = useNpmConfig()

const {
  yarnStatus,
  yarnCacheInfo,
  yarnCacheLoading,
  getYarnStatus,
  loadYarnCacheInfo,
  cleanYarnCache
} = useYarnConfig()

const {
  tools,
  loadingCategory,
  loadedCategories,
  loadCategoryTools,
  refreshToolInfo,
  toolCategoryMap
} = useToolDetection()

// ============================================
// 基础状态
// ============================================
const categories = ref<any[]>([])
const currentTab = ref('frontend')
const showConfigModal = ref(false)
const selectedTool = ref<string>('')
const availableMirrors = ref<any[]>([])

// ============================================
// 计算属性
// ============================================
const toolsByUserCategory = computed(() => {
  const grouped: Record<string, ToolInfo[]> = {}
  
  categories.value.forEach((cat: any) => {
    grouped[cat.name] = []
  })
  
  tools.value.forEach((tool) => {
    const categoryName = toolCategoryMap[tool.name] || 'other'
    
    if (grouped[categoryName]) {
      grouped[categoryName].push(tool)
    } else {
      grouped['other'] = grouped['other'] || []
      grouped['other'].push(tool)
    }
  })
  
  return grouped
})

const currentCategoryTools = computed(() => {
  return toolsByUserCategory.value[currentTab.value] || []
})

// 获取全局代理 URL
function getGlobalProxyUrl() {
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

// ============================================
// 初始化
// ============================================
async function initCategories() {
  if (!window.electronAPI) return
  
  try {
    const allCategories = await window.electronAPI.db.getCategories()
    categories.value = allCategories
    
    if (allCategories.length > 0) {
      currentTab.value = allCategories[0].name
      await loadCategoryTools(allCategories[0].name)
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    message.error('加载分类失败: ' + error)
  }
}

// Tab 切换处理
async function handleTabChange(tabName: string) {
  currentTab.value = tabName
  await loadCategoryTools(tabName)
}

// ============================================
// 配置管理
// ============================================
async function openToolConfig(toolName: string) {
  if (!window.electronAPI) return
  
  selectedTool.value = toolName
  
  const tool = tools.value.find(t => t.name === toolName)
  if (!tool || tool.status !== 'installed') return
  
  // 获取镜像源列表
  availableMirrors.value = tool.mirrors || [
    { name: 'npmmirror', displayName: '阿里云', registryUrl: 'https://registry.npmmirror.com', location: '中国' },
    { name: 'tencent', displayName: '腾讯云', registryUrl: 'https://mirrors.cloud.tencent.com/npm', location: '中国' },
    { name: 'npmjs', displayName: '官方源', registryUrl: 'https://registry.npmjs.org', location: '美国' }
  ]
  
  showConfigModal.value = true
  
  // 加载工具特定的状态
  if (toolName === 'npm') {
    loadNpmCacheInfo()
    getNpmStatus()
  } else if (toolName === 'yarn') {
    loadYarnCacheInfo()
    getYarnStatus()
  }
}

// ============================================
// 保存处理函数
// ============================================
const npmModalRef = ref()
const yarnModalRef = ref()
const pnpmModalRef = ref()

async function handleNpmSave(data: any) {
  const { tab, form } = data
  
  if (npmModalRef.value) npmModalRef.value.setSaving(true)
  
  try {
    await window.electronAPI.db.saveToolConfig({
      tool_name: 'npm',
      registry_url: tab === 'registry' ? form.registry : undefined,
      cache_dir: tab === 'cache' ? form.cacheDir : undefined,
      proxy_type: tab === 'proxy' ? form.proxyType : undefined,
      custom_proxy: tab === 'proxy' ? form.customProxy : undefined
    })
    
    if (tab === 'registry' && form.registry) {
      const result = await window.electronAPI.invoke('npm:setRegistry', form.registry)
      if (result.success) {
        message.success('✓ 镜像源设置成功')
        if (npmModalRef.value) npmModalRef.value.updateForm({ registry: result.value })
      } else {
        message.error(`镜像源设置失败: ${result.message}`)
      }
    } else if (tab === 'proxy') {
      let proxyUrl = null
      if (form.proxyType === 'global') {
        proxyUrl = getGlobalProxyUrl()
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
        message.success('✓ 缓存目录设置成功')
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

async function handleYarnSave(data: any) {
  const { tab, form } = data
  
  if (yarnModalRef.value) yarnModalRef.value.setSaving(true)
  
  try {
    await window.electronAPI.db.saveToolConfig({
      tool_name: 'yarn',
      registry_url: tab === 'registry' ? form.registry : undefined,
      cache_dir: tab === 'cache' ? form.cacheDir : undefined,
      proxy_type: tab === 'proxy' ? form.proxyType : undefined,
      custom_proxy: tab === 'proxy' ? form.customProxy : undefined
    })
    
    if (tab === 'registry' && form.registry) {
      const result = await window.electronAPI.invoke('yarn:setRegistry', form.registry)
      if (result.success) {
        message.success('✓ 镜像源设置成功')
        if (yarnModalRef.value) yarnModalRef.value.updateForm({ registry: result.value })
      } else {
        message.error(`镜像源设置失败: ${result.message}`)
      }
    } else if (tab === 'proxy') {
      let proxyUrl = null
      if (form.proxyType === 'global') {
        proxyUrl = getGlobalProxyUrl()
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
        message.success('✓ 缓存目录设置成功')
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

async function handlePnpmSave(data: any) {
  const { tab, form } = data
  
  if (pnpmModalRef.value) pnpmModalRef.value.setSaving(true)
  
  try {
    await window.electronAPI.db.saveToolConfig({
      tool_name: 'pnpm',
      registry_url: tab === 'registry' ? form.registry : undefined,
      cache_dir: tab === 'cache' ? form.cacheDir : undefined,
      proxy_type: tab === 'proxy' ? form.proxyType : undefined,
      custom_proxy: tab === 'proxy' ? form.customProxy : undefined
    })
    
    // pnpm 使用命令行设置
    if (tab === 'registry' && form.registry) {
      const result = await window.electronAPI.invoke('command:execute', `pnpm config set registry "${form.registry}"`)
      if (result.success) {
        message.success('✓ 镜像源设置成功')
      } else {
        message.error(`镜像源设置失败: ${result.message}`)
      }
    } else if (tab === 'proxy') {
      // TODO: 实现 pnpm 代理设置
      message.info('pnpm 代理设置功能开发中')
    } else if (tab === 'cache' && form.cacheDir) {
      const result = await window.electronAPI.invoke('command:execute', `pnpm config set cache-dir "${form.cacheDir}"`)
      if (result.success) {
        message.success('✓ 缓存目录设置成功')
      } else {
        message.error(`缓存目录设置失败: ${result.message}`)
      }
    }
  } catch (error) {
    message.error('保存配置失败: ' + error)
  } finally {
    if (pnpmModalRef.value) pnpmModalRef.value.setSaving(false)
    refreshToolInfo('pnpm')
  }
}

// 清空 npm global 配置（带确认）
function handleClearGlobalConfig() {
  dialog.warning({
    title: '确认清空',
    content: '将清空所有 npm global 配置，让 user 配置接管。是否继续？',
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: () => {
      clearAllGlobalConfig(() => refreshToolInfo('npm'))
    }
  })
}

// 初始化
onMounted(() => {
  initCategories()
})
</script>

<template>
  <div class="tools-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🛠️ 工具配置</h1>
      <p class="subtitle">管理开发工具的代理和配置</p>
    </div>

    <!-- 分类 Tabs - 直接使用 NTabs 不包装 -->
    <div v-if="categories.length > 0" class="tools-container">
      <n-tabs 
        v-model:value="currentTab" 
        type="line" 
        size="large" 
        animated
        @update:value="handleTabChange"
      >
        <n-tab-pane
          v-for="category in categories"
          :key="category.name"
          :name="category.name"
          :tab="`${category.icon} ${category.display_name}`"
        >
          <!-- 分类加载状态 -->
          <n-spin 
            :show="loadingCategory === category.name" 
            description="检测工具状态中..."
            style="min-height: 200px"
          >
            <!-- 工具表格 -->
            <ToolsTable
              v-if="loadedCategories.has(category.name) && currentTab === category.name"
              :tools="currentCategoryTools"
              @configure="openToolConfig"
              @refresh="refreshToolInfo"
              style="margin-top: 16px"
            />
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- npm 配置弹窗 -->
    <NpmConfigModal
      v-if="selectedTool === 'npm'"
      ref="npmModalRef"
      v-model:show="showConfigModal"
      :tool-info="tools.find(t => t.name === selectedTool)"
      :mirrors="availableMirrors"
      :global-proxy-url="getGlobalProxyUrl()"
      :npm-status="npmStatus"
      :cache-info="npmCacheInfo"
      :cache-loading="npmCacheLoading"
      @save="handleNpmSave"
      @clear-global-config="handleClearGlobalConfig"
      @clean-cache="cleanNpmCache"
      @load-cache-info="loadNpmCacheInfo"
      @load-status="getNpmStatus"
    />

    <!-- yarn 配置弹窗 -->
    <YarnConfigModal
      v-if="selectedTool === 'yarn'"
      ref="yarnModalRef"
      v-model:show="showConfigModal"
      :tool-info="tools.find(t => t.name === selectedTool)"
      :mirrors="availableMirrors"
      :global-proxy-url="getGlobalProxyUrl()"
      :cache-info="yarnCacheInfo"
      :cache-loading="yarnCacheLoading"
      @save="handleYarnSave"
      @clean-cache="cleanYarnCache"
      @load-cache-info="loadYarnCacheInfo"
      @load-status="getYarnStatus"
    />

    <!-- pnpm 配置弹窗 -->
    <PnpmConfigModal
      v-if="selectedTool === 'pnpm'"
      ref="pnpmModalRef"
      v-model:show="showConfigModal"
      :tool-info="tools.find(t => t.name === selectedTool)"
      :mirrors="availableMirrors"
      :global-proxy-url="getGlobalProxyUrl()"
      @save="handlePnpmSave"
    />
  </div>
</template>

<style scoped>
.tools-page {
  padding: 24px;
  max-width: 100%;
  margin: 0 auto;
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.tools-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>
