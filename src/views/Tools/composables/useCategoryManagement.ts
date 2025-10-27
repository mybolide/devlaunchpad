/**
 * 分类管理 Composable
 * 负责分类加载、切换、拖拽排序
 */
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { ToolInfo } from '@/types'

export function useCategoryManagement(
  tools: Ref<ToolInfo[]>,
  toolCategoryMap: Record<string, string>
) {
  const message = useMessage()
  
  // 状态
  const categories = ref<any[]>([])
  const currentTab = ref('frontend')
  const loadedCategories = ref<Set<string>>(new Set())
  const loadingCategory = ref<string>('')
  const showScrollArrows = ref(false)
  
  // 拖拽相关
  let draggedCategoryIndex = -1
  
  /**
   * 按分类分组工具
   */
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
  
  /**
   * 获取当前分类的工具列表
   */
  const currentCategoryTools = computed(() => {
    return toolsByUserCategory.value[currentTab.value] || []
  })
  
  /**
   * 初始化分类
   */
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
  
  /**
   * 加载指定分类的工具
   */
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
  
  /**
   * Tab 切换事件
   */
  async function onTabChange(tabName: string) {
    await loadCategoryTools(tabName)
  }
  
  /**
   * 检测是否需要滚动箭头
   */
  function checkScrollable() {
    setTimeout(() => {
      const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
      
      if (tabsNav) {
        const needScroll = tabsNav.scrollWidth > tabsNav.clientWidth
        showScrollArrows.value = needScroll
      }
    }, 300)
  }
  
  /**
   * 左右滚动
   */
  function scrollTabs(direction: 'left' | 'right', event?: MouseEvent) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
    if (!tabsNav) return
    
    tabsNav.style.overflowX = 'auto'
    tabsNav.style.maxWidth = '100%'
    
    const scrollAmount = 200
    const currentPos = tabsNav.scrollLeft
    const newPos = direction === 'left' 
      ? Math.max(0, currentPos - scrollAmount)
      : currentPos + scrollAmount
    
    tabsNav.scrollLeft = newPos
  }
  
  /**
   * 拖拽排序相关
   */
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
    
    message.success('分类顺序已更新')
    draggedCategoryIndex = -1
  }
  
  return {
    categories,
    currentTab,
    loadedCategories,
    loadingCategory,
    showScrollArrows,
    toolsByUserCategory,
    currentCategoryTools,
    initCategories,
    loadCategoryTools,
    onTabChange,
    checkScrollable,
    scrollTabs,
    onDragStart,
    onDragOver,
    onDrop
  }
}


