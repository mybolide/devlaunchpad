<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { NTag, NButton, NSpin, NModal, NForm, NFormItem, NInput, NDataTable, NSelect, NTabs, NTabPane, NCard, NSpace, NRadio, NRadioGroup, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { ToolInfo } from '../types'

// 声明全局类型
declare global {
  interface Window {
    electronAPI: any
  }
}

const message = useMessage()

// 状态
const loadingCategory = ref<string>('')
const tools = ref<ToolInfo[]>([])
const categories = ref<any[]>([])
const loadedCategories = ref<Set<string>>(new Set()) // 记录已加载的分类
const showConfigModal = ref(false)
const selectedTool = ref<string>('')
const currentTab = ref('frontend')
const showScrollArrows = ref(false) // 是否显示滚动箭头
const configForm = ref({
  registry: '',
  selectedMirror: '',
  proxyType: 'none' as 'none' | 'global' | 'custom',
  customProxy: '',
  cacheDir: ''
})
const availableMirrors = ref<any[]>([])

// 提取版本号
function extractVersion(versionString: string): string {
  if (!versionString) return '-'
  
  // 匹配常见版本号格式：v1.2.3 或 1.2.3
  const match = versionString.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/)
  if (match && match[1]) {
    return match[1]
  }
  
  // 如果没有匹配到，返回前20个字符
  return versionString.substring(0, 20)
}

// 截断文本
function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 表格列定义
const columns: DataTableColumns<ToolInfo> = [
  {
    title: '工具',
    key: 'displayName',
    minWidth: 100,
    ellipsis: {
      tooltip: true
    },
    render: (row) => h('span', { style: { fontWeight: '500' } }, row.displayName)
  },
  {
    title: '版本',
    key: 'version',
    minWidth: 120,
    ellipsis: {
      tooltip: true
    },
    render: (row) => {
      if (row.status !== 'installed' || !row.version) {
        return h('span', { style: { color: '#999' } }, '-')
      }
      const version = extractVersion(row.version)
      const fullVersion = row.version || ''
      return h('span', { 
        style: { 
          fontFamily: 'monospace', 
          fontSize: '12px',
          cursor: 'help'
        },
        title: fullVersion !== version ? fullVersion : undefined
      }, version)
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      if (row.status === 'installed') {
        return h(NTag, { type: 'success', size: 'small', round: true }, { default: () => '✓ 已安装' })
      }
      return h(NTag, { type: 'error', size: 'small', round: true }, { default: () => '✗ 未安装' })
    }
  },
  {
    title: '当前配置',
    key: 'config',
    minWidth: 300,
    render: (row) => {
      if (row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      
      const configs = []
      
      // 显示镜像源
      if (row.registryUrl) {
        configs.push(h('div', { 
          style: { fontSize: '12px', marginBottom: '4px' },
          title: row.registryUrl
        }, [
          h('span', { style: { color: '#666', marginRight: '4px' } }, '镜像:'),
          h('code', { 
            style: { 
              color: '#2563eb', 
              background: '#f0f4ff',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'help'
            }
          }, truncateText(row.registryUrl || '', 50))
        ]))
      }
      
      // 显示代理
      if (row.proxyEnabled && row.currentProxy) {
        configs.push(h('div', { 
          style: { fontSize: '12px', marginBottom: '4px' },
          title: row.currentProxy
        }, [
          h('span', { style: { color: '#666', marginRight: '4px' } }, '代理:'),
          h('code', { 
            style: { 
              color: '#16a34a', 
              background: '#f0fdf4',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'help'
            }
          }, truncateText(row.currentProxy, 40))
        ]))
      }
      
      // 显示缓存目录
      if (row.cacheDir) {
        configs.push(h('div', { 
          style: { fontSize: '12px' },
          title: row.cacheDir
        }, [
          h('span', { style: { color: '#666', marginRight: '4px' } }, '缓存:'),
          h('code', { 
            style: { 
              color: '#666',
              background: '#f5f5f5',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'help'
            }
          }, truncateText(row.cacheDir, 40))
        ]))
      }
      
      if (configs.length === 0) {
        return h('span', { style: { color: '#999', fontSize: '12px' } }, '未配置')
      }
      
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, configs)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center' as const,
    render: (row) => {
      if (row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      
      return h(NButton, {
        size: 'small',
        secondary: true,
        onClick: () => openToolConfig(row.name)
      }, { default: () => '配置' })
    }
  }
]

// 工具默认分类映射
const toolCategoryMap: Record<string, string> = {
  npm: 'frontend',
  yarn: 'frontend',
  pnpm: 'frontend',
  bun: 'frontend',
  git: 'devops',
  curl: 'backend',
  wget: 'backend'
}

// 计算属性：按用户自定义分类分组
const toolsByUserCategory = computed(() => {
  const grouped: Record<string, ToolInfo[]> = {}
  
  // 初始化所有分类
  categories.value.forEach((cat: any) => {
    grouped[cat.name] = []
  })
  
  // 将工具分配到对应分类
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

// 获取当前分类的工具列表
const currentCategoryTools = computed(() => {
  return toolsByUserCategory.value[currentTab.value] || []
})

// 检测是否需要滚动箭头
function checkScrollable() {
  setTimeout(() => {
    const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
    
    if (tabsNav) {
      const needScroll = tabsNav.scrollWidth > tabsNav.clientWidth
      showScrollArrows.value = needScroll
    }
  }, 300)
}

// 初始化：只加载分类，不加载工具
async function initCategories() {
  if (!window.electronAPI) return
  
  try {
    const allCategories = await window.electronAPI.db.getCategories()
    categories.value = allCategories
    
    // 设置默认 tab 为第一个分类
    if (allCategories.length > 0) {
      currentTab.value = allCategories[0].name
      // 加载第一个分类的工具
      await loadCategoryTools(allCategories[0].name)
    }
    
    // 检测是否需要滚动
    checkScrollable()
  } catch (error) {
    console.error('加载分类失败:', error)
    message.error('加载分类失败: ' + error)
  }
}

// 加载指定分类的工具（按需加载）
async function loadCategoryTools(categoryName: string) {
  if (!window.electronAPI) return
  
  // 如果已经加载过，跳过
  if (loadedCategories.value.has(categoryName)) {
    return
  }
  
  try {
    loadingCategory.value = categoryName
    
    // 获取该分类下的工具名称
    const categoryToolNames = Object.entries(toolCategoryMap)
      .filter(([_, cat]) => cat === categoryName)
      .map(([name, _]) => name)
    
    if (categoryToolNames.length === 0) {
      loadedCategories.value.add(categoryName)
      return
    }
    
    // 获取这些工具的详细信息
    const toolInfos = await window.electronAPI.tool.getToolsInfo(categoryToolNames)
    
    // 合并到总列表
    toolInfos.forEach((toolInfo: ToolInfo) => {
      const index = tools.value.findIndex((t) => t.name === toolInfo.name)
      if (index >= 0) {
        tools.value[index] = toolInfo
      } else {
        tools.value.push(toolInfo)
      }
    })
    
    // 标记该分类已加载
    loadedCategories.value.add(categoryName)
  } catch (error) {
    console.error(`加载 ${categoryName} 分类失败:`, error)
    message.error(`加载工具失败: ${error}`)
  } finally {
    loadingCategory.value = ''
  }
}

// Tab 切换事件
async function onTabChange(tabName: string) {
  await loadCategoryTools(tabName)
}

// 左右滚动
function scrollTabs(direction: 'left' | 'right', event?: MouseEvent) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  // 找到 tabs nav 容器
  const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
  if (!tabsNav) return
  
  // 设置滚动样式
  tabsNav.style.overflowX = 'auto'
  tabsNav.style.maxWidth = '100%'
  
  const scrollAmount = 200
  const currentPos = tabsNav.scrollLeft
  const newPos = direction === 'left' 
    ? Math.max(0, currentPos - scrollAmount)
    : currentPos + scrollAmount
  
  // 直接设置
  tabsNav.scrollLeft = newPos
}

// 拖拽排序相关
let draggedCategoryIndex = -1

function onDragStart(event: DragEvent, index: number) {
  draggedCategoryIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

async function onDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  
  if (draggedCategoryIndex === -1 || draggedCategoryIndex === targetIndex) {
    return
  }
  
  // 交换分类顺序
  const newCategories = [...categories.value]
  const [draggedItem] = newCategories.splice(draggedCategoryIndex, 1)
  newCategories.splice(targetIndex, 0, draggedItem)
  
  // 更新排序
  newCategories.forEach((cat, index) => {
    cat.sort_order = index
  })
  
  categories.value = newCategories
  
  // 保存排序到配置文件
  if (window.electronAPI) {
    // TODO: 实现保存分类排序的 API
  }
  
  message.success('分类顺序已更新')
  draggedCategoryIndex = -1
}

// 刷新单个工具的信息
async function refreshToolInfo(toolName: string) {
  if (!window.electronAPI) return
  
  try {
    const updatedInfo = await window.electronAPI.tool.getToolInfo(toolName)
    if (updatedInfo) {
      const index = tools.value.findIndex((t) => t.name === toolName)
      if (index !== -1) {
        tools.value[index] = updatedInfo
      }
    }
  } catch (error) {
    console.error('刷新工具信息失败:', error)
  }
}

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

// 打开工具配置对话框
async function openToolConfig(toolName: string) {
  if (!window.electronAPI) return
  
  selectedTool.value = toolName
  
  // 获取工具当前实际配置（从命令读取）
  const tool = tools.value.find(t => t.name === toolName)
  if (!tool || tool.status !== 'installed') return
  
  // 临时镜像源列表（TODO: 从 tools-config 获取）
  availableMirrors.value = [
    { name: 'npmmirror', displayName: '阿里云', url: 'https://registry.npmmirror.com', location: '中国' },
    { name: 'tencent', displayName: '腾讯云', url: 'https://mirrors.cloud.tencent.com/npm', location: '中国' },
    { name: 'npmjs', displayName: '官方源', url: 'https://registry.npmjs.org', location: '美国' }
  ]
  
  // 从数据库读取用户保存的配置
  const savedConfig = await window.electronAPI.db.getToolConfig(toolName)
  
  // chsrc 原理：使用命令读取的实际配置作为初始值
  configForm.value = {
    registry: tool.registryUrl || '',  // 从命令读取的实际值
    selectedMirror: savedConfig?.registry_url ? '' : '',
    proxyType: (savedConfig?.proxy_type as any) || (tool.proxyEnabled ? 'custom' : 'none'),
    customProxy: tool.currentProxy || '',  // 从命令读取的实际值
    cacheDir: tool.cacheDir || ''  // 从命令读取的实际值
  }
  
  showConfigModal.value = true
}

// 镜像源选择改变
function onMirrorChange(mirrorName: string) {
  const mirror = availableMirrors.value.find(m => m.name === mirrorName)
  if (mirror) {
    configForm.value.registry = mirror.url
  }
}

// 保存工具配置
async function saveToolConfig() {
  if (!window.electronAPI) return
  
  try {
    const config = {
      tool_name: selectedTool.value,
      registry_url: configForm.value.registry,
      cache_dir: configForm.value.cacheDir,
      proxy_type: configForm.value.proxyType,
      custom_proxy: configForm.value.customProxy
    }
    
    // 保存到 JSON 配置文件
    await window.electronAPI.db.saveToolConfig(config)
    
    // chsrc 原理：执行命令设置配置
    // 1. 设置镜像源
    if (configForm.value.registry) {
      message.info(`设置镜像源: ${truncateText(configForm.value.registry, 40)}`)
      // TODO: 调用后端 API - npm config set registry xxx
    }
    
    // 2. 设置代理
    if (configForm.value.proxyType === 'global') {
      const globalProxy = getGlobalProxyUrl()
      if (globalProxy) {
        await window.electronAPI.proxy.enable(selectedTool.value, globalProxy)
        message.success('已启用全局代理')
      }
    } else if (configForm.value.proxyType === 'custom' && configForm.value.customProxy) {
      await window.electronAPI.proxy.enable(selectedTool.value, configForm.value.customProxy)
      message.success('已启用自定义代理')
    } else if (configForm.value.proxyType === 'none') {
      await window.electronAPI.proxy.disable(selectedTool.value)
      message.success('已禁用代理')
    }
    
    // 3. 设置缓存目录
    if (configForm.value.cacheDir) {
      message.info(`设置缓存目录: ${truncateText(configForm.value.cacheDir, 30)}`)
      // TODO: 调用后端 API - npm config set cache xxx
    }
    
    showConfigModal.value = false
    
    // 刷新工具信息
    await refreshToolInfo(selectedTool.value)
  } catch (error) {
    message.error('保存配置失败: ' + error)
  }
}

// 初始化
onMounted(() => {
  initCategories()
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScrollable)
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', checkScrollable)
})
</script>

<template>
  <div class="tools-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🛠️ 工具配置</h1>
      <p class="subtitle">管理开发工具的代理和配置</p>
    </div>

    <!-- 使用 Tabs 按分类显示（带箭头和拖拽） -->
    <div v-if="categories.length > 0" class="tools-container">
      <!-- 滚动箭头（右上角，仅在需要时显示） -->
      <div v-if="showScrollArrows" class="scroll-arrows">
        <n-button 
          size="small" 
          quaternary
          @click="(e: any) => scrollTabs('left', e)"
          title="向左滚动"
        >
          <template #icon>
            <span style="font-size: 18px; font-weight: bold">‹</span>
          </template>
        </n-button>
        <n-button 
          size="small" 
          quaternary
          @click="(e: any) => scrollTabs('right', e)"
          title="向右滚动"
        >
          <template #icon>
            <span style="font-size: 18px; font-weight: bold">›</span>
          </template>
        </n-button>
      </div>

      <!-- Tabs -->
      <n-tabs 
        v-model:value="currentTab" 
        type="line" 
        size="large" 
        animated
        @update:value="onTabChange"
      >
        <n-tab-pane
          v-for="(category, index) in categories"
          :key="category.name"
          :name="category.name"
        >
          <template #tab>
            <div
              class="draggable-tab"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover="onDragOver($event)"
              @drop="onDrop($event, index)"
            >
              {{ category.icon }} {{ category.display_name }}
            </div>
          </template>

          <!-- 分类加载状态 -->
          <n-spin 
            :show="loadingCategory === category.name" 
            description="检测工具状态中..."
            style="min-height: 200px"
          >
            <!-- 工具表格 -->
            <n-data-table
              v-if="loadedCategories.has(category.name)"
              :columns="columns"
              :data="currentCategoryTools"
              :bordered="false"
              :single-line="false"
              style="margin-top: 16px"
            />
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 工具配置对话框 -->
    <n-modal
      v-model:show="showConfigModal"
      :title="`${selectedTool} 配置`"
      style="width: 700px"
    >
      <n-card :bordered="false">
        <n-tabs type="line" animated>
          <!-- 镜像源配置 -->
          <n-tab-pane name="registry" tab="📦 镜像源">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <n-form-item label="选择镜像源">
                <n-select
                  v-model:value="configForm.selectedMirror"
                  :options="availableMirrors.map(m => ({
                    label: `${m.displayName} ${m.location ? `(${m.location})` : ''}`,
                    value: m.name
                  }))"
                  placeholder="选择预设镜像源"
                  clearable
                  @update:value="onMirrorChange"
                />
              </n-form-item>

              <n-form-item label="自定义 URL">
                <n-input
                  v-model:value="configForm.registry"
                  type="text"
                  placeholder="或手动输入镜像源地址"
                />
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <!-- 代理配置 -->
          <n-tab-pane name="proxy" tab="🌐 代理">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <n-form-item label="代理设置">
                <n-radio-group v-model:value="configForm.proxyType">
                  <n-radio value="none">不使用代理</n-radio>
                  <n-radio value="global">使用全局代理</n-radio>
                  <n-radio value="custom">自定义代理</n-radio>
                </n-radio-group>
              </n-form-item>

              <n-form-item v-if="configForm.proxyType === 'global'" label="全局代理">
                <n-input
                  :value="getGlobalProxyUrl()"
                  readonly
                  placeholder="请先在设置页面配置全局代理"
                />
              </n-form-item>

              <n-form-item v-if="configForm.proxyType === 'custom'" label="代理 URL">
                <n-input
                  v-model:value="configForm.customProxy"
                  type="text"
                  placeholder="例如：http://127.0.0.1:1080"
                />
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <!-- 缓存配置 -->
          <n-tab-pane name="cache" tab="💾 缓存">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <n-form-item label="缓存目录">
                <n-input
                  v-model:value="configForm.cacheDir"
                  type="text"
                  placeholder="例如：C:\npm-cache"
                />
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showConfigModal = false">取消</n-button>
            <n-button type="primary" @click="saveToolConfig">保存配置</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
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
  position: relative;
}

/* 滚动箭头（右上角） */
.scroll-arrows {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 4px;
  z-index: 100;
  background: white;
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Tabs 容器滚动 */
.tools-container :deep(.n-tabs-nav) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-behavior: smooth !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 100px !important; /* 为右上角箭头留空间 */
}

.tools-container :deep(.n-tabs-nav::-webkit-scrollbar) {
  display: none;
}

.tools-container :deep(.n-tabs-nav-scroll-wrapper) {
  overflow: visible !important;
  max-width: none !important;
}

.tools-container :deep(.n-tabs-nav__prefix),
.tools-container :deep(.n-tabs-nav__suffix) {
  flex-shrink: 0 !important;
}

.tools-container :deep(.n-tabs-nav-scroll-content) {
  display: flex !important;
  gap: 4px;
  width: auto !important;
  flex-wrap: nowrap !important;
}

.tools-container :deep(.n-tabs-tab) {
  padding: 8px 20px;
  min-width: 120px !important;
  justify-content: center;
  flex-shrink: 0 !important;
  white-space: nowrap !important;
}

/* 拖拽样式 */
.draggable-tab {
  cursor: move;
  user-select: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.draggable-tab:hover {
  background: rgba(59, 130, 246, 0.05);
}

.draggable-tab:active {
  cursor: grabbing;
  opacity: 0.7;
}

/* 表格自适应 */
.tools-container :deep(.n-data-table) {
  width: 100%;
}

.tools-container :deep(.n-data-table-th),
.tools-container :deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>



