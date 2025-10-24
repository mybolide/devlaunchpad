<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { NTag, NButton, NSpin, NModal, NForm, NFormItem, NInput, NDataTable, NSelect, NTabs, NTabPane, NCard, NSpace, NRadio, NRadioGroup, NText, NProgress, NStatistic, NDivider, NAlert, NOl, NLi, NCode, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { ToolInfo } from '../types'
import NpmConfigModal from '../components/tools/npm/NpmConfigModal.vue'
import YarnConfigModal from '../components/tools/yarn/YarnConfigModal.vue'

const message = useMessage()
const dialog = useDialog()

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
const configLoading = ref(false) // 加载配置时的 loading
const savingConfig = ref(false) // 保存配置时的 loading
const activeConfigTab = ref('registry') // 当前激活的配置 tab

// npm 专用状态
const npmPingLoading = ref(false)
const npmPingResult = ref<{ success: boolean; duration: number; message: string } | null>(null)
const npmCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
const npmCacheLoading = ref(false)

// npm 状态
const npmStatus = ref<any>(null)
const npmStatusLoading = ref(false)

// yarn 专用状态
const yarnCacheInfo = ref<{ cachePath: string; sizeFormatted: string; sizeInBytes: number } | null>(null)
const yarnCacheLoading = ref(false)
const yarnStatus = ref<any>(null)
const yarnStatusLoading = ref(false)

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
  
  // 先显示弹窗，然后加载数据
  showConfigModal.value = true
  configLoading.value = true
  
  try {
    // 临时镜像源列表（TODO: 从 tools-config 获取）
    availableMirrors.value = tool.mirrors || [
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
    
    // 立即结束 loading，让用户看到表单
    configLoading.value = false
    
    // 如果是 npm 工具，后台异步加载专用信息（不阻塞）
    if (toolName === 'npm') {
      npmPingResult.value = null
      // 异步加载，不等待
      Promise.all([
        loadNpmCacheInfo(),
        getNpmStatus()
      ]).catch(error => {
        console.error('加载 npm 额外信息失败:', error)
      })
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    message.error('加载配置失败')
    configLoading.value = false
  }
}

// 镜像源选择改变
function onMirrorChange(mirrorName: string) {
  const mirror = availableMirrors.value.find(m => m.name === mirrorName)
  if (mirror) {
    configForm.value.registry = mirror.url
  }
}

// ============================================
// npm 专用功能
// ============================================

// npm ping 测速
async function npmPingTest(registryUrl?: string) {
  if (!window.electronAPI) return
  
  try {
    npmPingLoading.value = true
    npmPingResult.value = null
    
    const result = await window.electronAPI.invoke('npm:testRegistry', registryUrl)
    npmPingResult.value = result
    
    if (result.success) {
      message.success(`测速成功：${result.duration}ms`)
    } else {
      message.error(`测速失败：${result.message}`)
    }
  } catch (error) {
    message.error('测速失败: ' + error)
  } finally {
    npmPingLoading.value = false
  }
}

// 获取 npm 缓存信息
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

// 清理 npm 缓存
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

// 一键清空 global 配置
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
          // 刷新状态
          await getNpmStatus()
          // 刷新工具信息
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

// ============================================
// npm 组件专用处理函数
// ============================================
const npmModalRef = ref()
const yarnModalRef = ref()

async function handleNpmSave(data: any) {
  const { tab, form } = data
  
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
    if (tab === 'registry' && form.registry) {
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

// ============================================
// yarn 组件专用处理函数
// ============================================
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

// ============================================
// yarn 专用功能
// ============================================

// 获取 yarn 缓存信息
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

// 清理 yarn 缓存
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


// 保存工具配置
async function saveToolConfig() {
  if (!window.electronAPI) return
  
  // 防止重复点击
  if (savingConfig.value) {
    message.warning('正在保存配置，请稍候...')
    return
  }
  
  savingConfig.value = true
  
  try {
    // 根据当前 tab 决定要保存哪些配置
    const config = {
      tool_name: selectedTool.value,
      registry_url: activeConfigTab.value === 'registry' ? configForm.value.registry : undefined,
      cache_dir: activeConfigTab.value === 'cache' ? configForm.value.cacheDir : undefined,
      proxy_type: activeConfigTab.value === 'proxy' ? configForm.value.proxyType : undefined,
      custom_proxy: activeConfigTab.value === 'proxy' ? configForm.value.customProxy : undefined
    }
    
    // 保存到 JSON 配置文件（只保存当前 tab 相关的配置）
    await window.electronAPI.db.saveToolConfig(config)
    
    // 根据当前 tab 执行对应的配置操作
    if (activeConfigTab.value === 'registry') {
      // 1. 设置镜像源
      if (configForm.value.registry && configForm.value.registry.trim()) {
        const registryUrl = configForm.value.registry.trim()
        
        // 验证 URL 格式
        if (!registryUrl.startsWith('http://') && !registryUrl.startsWith('https://')) {
          message.error('镜像源地址必须以 http:// 或 https:// 开头')
          savingConfig.value = false
          return
        }
        
        console.log('[saveToolConfig] 准备设置镜像源:', registryUrl)
        message.info(`正在设置镜像源: ${truncateText(registryUrl, 40)}`)
        
        try {
          let result
          
          // npm 使用新的 setRegistry API
          if (selectedTool.value === 'npm') {
            console.log('[saveToolConfig] 调用 npm:setRegistry，设置 registry =', registryUrl)
            result = await window.electronAPI.invoke('npm:setRegistry', registryUrl)
            console.log('[saveToolConfig] npm:setRegistry 结果:', result)
            
            if (result && result.success) {
              message.success(`✓ 镜像源设置成功: ${truncateText(result.value || registryUrl, 40)}`)
              // 更新表单显示的值
              configForm.value.registry = result.value || registryUrl
              // 后台异步刷新状态（不阻塞）
              getNpmStatus()
            } else {
              console.error('[saveToolConfig] npm:setRegistry 失败:', result)
              message.error(`镜像源设置失败: ${result?.message || '未知错误'}`)
              savingConfig.value = false
              return
            }
          } 
          // yarn 使用新的 setRegistry API
          else if (selectedTool.value === 'yarn') {
            console.log('[saveToolConfig] 调用 yarn:setRegistry，设置 registry =', registryUrl)
            result = await window.electronAPI.invoke('yarn:setRegistry', registryUrl)
            console.log('[saveToolConfig] yarn:setRegistry 结果:', result)
            
            if (result && result.success) {
              message.success(`✓ 镜像源设置成功: ${truncateText(result.value || registryUrl, 40)}`)
              // 更新表单显示的值
              configForm.value.registry = result.value || registryUrl
              // 后台异步刷新状态（不阻塞）
              getYarnStatus()
            } else {
              console.error('[saveToolConfig] yarn:setRegistry 失败:', result)
              message.error(`镜像源设置失败: ${result?.message || '未知错误'}`)
              savingConfig.value = false
              return
            }
          }
          // pnpm 使用命令行
          else if (selectedTool.value === 'pnpm') {
            const cmd = `${selectedTool.value} config set registry "${registryUrl}"`
            result = await window.electronAPI.invoke('command:execute', cmd)
            
            console.log('[saveToolConfig] 执行命令:', cmd)
            console.log('[saveToolConfig] 执行结果:', result)
            
            if (result && result.success === false) {
              message.error(`镜像源设置失败: ${result.stderr || result.message}`)
              savingConfig.value = false
              return
            }
            
            // 等待命令执行完成
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // 验证设置是否成功
            const verifyCmd = `${selectedTool.value} config get registry`
            const verifyResult = await window.electronAPI.invoke('command:execute', verifyCmd)
            console.log('[saveToolConfig] 验证结果:', verifyResult)
            
            if (verifyResult && verifyResult.success && verifyResult.stdout) {
              const actualRegistry = verifyResult.stdout.trim()
              const expectedRegistry = registryUrl.replace(/\/$/, '')
              const actualRegistryClean = actualRegistry.replace(/\/$/, '')
              
              console.log('[saveToolConfig] 期望:', expectedRegistry)
              console.log('[saveToolConfig] 实际:', actualRegistryClean)
              
              if (actualRegistryClean === expectedRegistry) {
                message.success(`✓ 镜像源设置成功: ${truncateText(actualRegistry, 40)}`)
              } else {
                message.error(`镜像源设置后验证失败\n期望: ${expectedRegistry}\n实际: ${actualRegistry}`)
                console.error('[saveToolConfig] 验证失败！')
                savingConfig.value = false
                return
              }
            } else {
              message.error('无法验证镜像源设置')
              savingConfig.value = false
              return
            }
          }
        } catch (error) {
          console.error('[saveToolConfig] 异常:', error)
          message.error('设置镜像源失败: ' + error)
          savingConfig.value = false
          return
        }
      }
    } else if (activeConfigTab.value === 'proxy') {
      // 2. 设置代理
      if (selectedTool.value === 'npm') {
        // npm 使用新的 setProxy API
        let proxyUrl = null
        if (configForm.value.proxyType === 'global') {
          proxyUrl = getGlobalProxyUrl()
        } else if (configForm.value.proxyType === 'custom') {
          proxyUrl = configForm.value.customProxy
        }
        
        const result = await window.electronAPI.invoke('npm:setProxy', proxyUrl)
        if (result.success) {
          message.success(proxyUrl ? '✓ 代理已设置' : '✓ 代理已清除')
          // 更新表单显示的值
          if (proxyUrl) {
            configForm.value.customProxy = proxyUrl
          }
          // 后台异步刷新状态（不阻塞）
          getNpmStatus()
        } else {
          message.error('代理设置失败: ' + result.message)
        }
      } else if (selectedTool.value === 'yarn') {
        // yarn 使用新的 setProxy API
        let proxyUrl = null
        if (configForm.value.proxyType === 'global') {
          proxyUrl = getGlobalProxyUrl()
        } else if (configForm.value.proxyType === 'custom') {
          proxyUrl = configForm.value.customProxy
        }
        
        const result = await window.electronAPI.invoke('yarn:setProxy', proxyUrl)
        if (result.success) {
          message.success(proxyUrl ? '✓ 代理已设置' : '✓ 代理已清除')
          // 更新表单显示的值
          if (proxyUrl) {
            configForm.value.customProxy = proxyUrl
          }
          // 后台异步刷新状态（不阻塞）
          getYarnStatus()
        } else {
          message.error('代理设置失败: ' + result.message)
        }
      } else {
      // 其他工具使用原有逻辑
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
    }
    } else if (activeConfigTab.value === 'cache') {
      // 3. 设置缓存目录
      if (configForm.value.cacheDir && configForm.value.cacheDir.trim()) {
        const cacheDirPath = configForm.value.cacheDir.trim()
        message.info(`正在设置缓存目录...`)
        try {
          // npm 使用新的 setCacheDir API
          if (selectedTool.value === 'npm') {
            const result = await window.electronAPI.invoke('npm:setCacheDir', cacheDirPath)
            if (result.success) {
              message.success(`✓ 缓存目录设置成功: ${truncateText(result.value || cacheDirPath, 40)}`)
              // 更新表单显示的值
              configForm.value.cacheDir = result.value || cacheDirPath
              // 后台异步刷新状态和缓存信息（不阻塞）
              getNpmStatus()
              loadNpmCacheInfo()
            } else {
              message.error(`缓存目录设置失败: ${result.message}`)
            }
          } else {
            // 其他工具使用命令行
            let result
            if (selectedTool.value === 'yarn') {
              result = await window.electronAPI.invoke('command:execute', `yarn config set cache-folder "${cacheDirPath}"`)
            } else if (selectedTool.value === 'pnpm') {
              result = await window.electronAPI.invoke('command:execute', `pnpm config set cache-dir "${cacheDirPath}"`)
            }
            
            if (result && result.success === false) {
              message.error(`缓存目录设置失败: ${result.stderr || result.message}`)
            } else {
              // 等待命令执行完成
              await new Promise(resolve => setTimeout(resolve, 300))
              
              // 验证设置是否成功：重新读取配置
              const verifyCmd = selectedTool.value === 'yarn' ? 'yarn config get cache-folder' :
                               'pnpm config get cache-dir'
              
              const verifyResult = await window.electronAPI.invoke('command:execute', verifyCmd)
              if (verifyResult && verifyResult.success && verifyResult.stdout) {
                const actualCacheDir = verifyResult.stdout.trim()
                // 路径比较（处理反斜杠和正斜杠）
                const normalizedExpected = cacheDirPath.replace(/\\/g, '/').replace(/\/$/, '')
                const normalizedActual = actualCacheDir.replace(/\\/g, '/').replace(/\/$/, '')
                
                if (normalizedActual === normalizedExpected) {
                  message.success(`✓ 缓存目录设置成功: ${truncateText(actualCacheDir, 40)}`)
                } else {
                  message.warning(`缓存目录设置后验证失败\n期望: ${cacheDirPath}\n实际: ${actualCacheDir}\n⚠️ 可能被环境变量覆盖`)
                }
              }
            }
          }
        } catch (error) {
          message.error('设置缓存目录失败: ' + error)
        }
      }
    }
    
    // 不关闭窗口，用户可以继续操作
    // showConfigModal.value = false
  } catch (error) {
    message.error('保存配置失败: ' + error)
  } finally {
    // 立即解除 loading 状态
    savingConfig.value = false
    
    // 异步刷新工具信息（不阻塞保存按钮）
    if (selectedTool.value) {
      refreshToolInfo(selectedTool.value)
    }
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
      @clear-global-config="clearAllGlobalConfig"
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

    <!-- 其他工具的配置弹窗 (pnpm 等) -->
    <n-modal
      v-if="selectedTool !== 'npm' && selectedTool !== 'yarn'"
      v-model:show="showConfigModal"
      :title="`${selectedTool} 配置`"
      style="width: 700px"
      :mask-closable="!savingConfig"
      :closable="!savingConfig"
      :on-update:show="(show: boolean) => { if (!savingConfig) showConfigModal = show }"
    >
      <n-card :bordered="false">
        <n-spin :show="configLoading" description="加载配置中...">
        <n-tabs v-model:value="activeConfigTab" type="line" animated>
          <!-- 镜像源配置 -->
          <n-tab-pane name="registry" tab="📦 镜像源">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <!-- npm 配置状态提示 -->
              <n-alert 
                v-if="npmStatus?.hasGlobalConfig || Object.keys(npmStatus?.envVars || {}).length > 0"
                type="warning" 
                title="⚠️ 检测到配置问题"
                style="margin-bottom: 16px"
              >
                <n-space vertical size="small">
                  <template v-if="Object.keys(npmStatus?.envVars || {}).length > 0">
                    <n-text>检测到环境变量覆盖了配置：</n-text>
                    <n-space vertical size="small" style="margin-left: 12px">
                      <n-text
                        v-for="(value, key) in npmStatus.envVars"
                        :key="key"
                        depth="3"
                        style="font-size: 12px"
                      >
                        • {{ key }}: <n-text code>{{ value }}</n-text>
                      </n-text>
                    </n-space>
                    <n-text depth="3" style="font-size: 12px">
                      环境变量会覆盖配置文件，建议在系统中删除这些环境变量后重启应用。
                    </n-text>
                  </template>
                  <template v-if="npmStatus?.hasGlobalConfig">
                    <n-text>检测到 global 级别的配置，建议清空后使用 user 配置。</n-text>
                  </template>
                  <n-button size="small" type="error" @click="clearAllGlobalConfig" style="margin-top: 8px">
                    🧹 一键清空 Global 配置
                  </n-button>
                </n-space>
              </n-alert>

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

              <!-- npm 专用：测速功能 -->
              <n-form-item v-if="selectedTool === 'npm'" label="测试速度">
                <n-space vertical style="width: 100%">
                  <n-space>
                    <n-button
                      :loading="npmPingLoading"
                      :disabled="!configForm.registry"
                      @click="npmPingTest(configForm.registry)"
                    >
                      测试当前源
                    </n-button>
                    <n-button
                      :loading="npmPingLoading"
                      @click="npmPingTest()"
                    >
                      测试默认源
                    </n-button>
                  </n-space>
                  
                  <n-card v-if="npmPingResult" :bordered="false" size="small" style="background: #f5f5f5">
                    <n-space align="center">
                      <n-tag :type="npmPingResult.success ? 'success' : 'error'" size="small">
                        {{ npmPingResult.success ? '✓ 连接成功' : '✗ 连接失败' }}
                      </n-tag>
                      <n-text v-if="npmPingResult.success" strong>
                        响应时间：{{ npmPingResult.duration }}ms
                      </n-text>
                      <n-text v-else depth="3" style="font-size: 12px">
                        {{ npmPingResult.message }}
                      </n-text>
                    </n-space>
                  </n-card>
                </n-space>
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

              <!-- npm 专用：缓存信息 -->
              <template v-if="selectedTool === 'npm'">
                <n-divider style="margin: 12px 0" />
                
                <n-spin :show="npmCacheLoading">
                  <n-space vertical style="width: 100%">
                    <n-card v-if="npmCacheInfo" :bordered="false" size="small" style="background: #f5f5f5">
                      <n-space vertical>
                        <n-space align="center">
                          <n-text strong>当前路径：</n-text>
                          <n-text code>{{ npmCacheInfo.cachePath }}</n-text>
                        </n-space>
                        <n-space align="center">
                          <n-text strong>占用空间：</n-text>
                          <n-text type="info" strong style="font-size: 18px">
                            {{ npmCacheInfo.sizeFormatted }}
                          </n-text>
                        </n-space>
                      </n-space>
                    </n-card>

                    <!-- 配置状态提示 -->
                    <n-alert 
                      v-if="npmStatus && (Object.keys(npmStatus.envVars || {}).length > 0 || npmStatus.hasGlobalConfig)"
                      type="info"
                      title="📋 配置状态"
                      style="margin-top: 12px"
                    >
                      <n-space vertical size="small">
                        <template v-if="Object.keys(npmStatus.envVars || {}).length > 0">
                          <n-text type="warning">⚠️ 检测到环境变量：</n-text>
                          <n-ul style="font-size: 12px">
                            <n-li v-for="(value, key) in npmStatus.envVars" :key="key">
                              {{ key }} = {{ value }}
                            </n-li>
                          </n-ul>
                        </template>
                        <template v-if="npmStatus.hasGlobalConfig">
                          <n-text type="warning">⚠️ 存在 global 级别配置</n-text>
                        </template>
                        <n-button 
                          size="small" 
                          type="error"
                          @click="clearAllGlobalConfig"
                          style="margin-top: 8px"
                        >
                          🧹 一键清空 Global 配置
                        </n-button>
                      </n-space>
                    </n-alert>

                    <n-space>
                      <n-button
                        type="warning"
                        :loading="npmCacheLoading"
                        @click="cleanNpmCache"
                      >
                        清理并校验缓存
                      </n-button>
                      <n-button
                        :loading="npmCacheLoading"
                        @click="loadNpmCacheInfo"
                      >
                        刷新信息
                      </n-button>
                    </n-space>

                    <n-text depth="3" style="font-size: 12px">
                      ⚠️ 清理缓存会执行 <n-text code>npm cache clean --force && npm cache verify</n-text>
                    </n-text>
                  </n-space>
                </n-spin>
              </template>
            </n-form>
          </n-tab-pane>
        </n-tabs>
        </n-spin>
        
        <template #footer>
          <n-space justify="end">
            <n-button type="primary" @click="saveToolConfig" :loading="savingConfig" :disabled="savingConfig">
              {{ savingConfig ? '保存中...' : '保存配置' }}
            </n-button>
            <n-button @click="showConfigModal = false" :disabled="savingConfig">关闭</n-button>
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



