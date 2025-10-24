/**
 * 工具检测 Composable
 */
import { ref } from 'vue'
import type { ToolInfo } from '../types'

export function useToolDetection() {
  const tools = ref<ToolInfo[]>([])
  const loadingCategory = ref<string>('')
  const loadedCategories = ref<Set<string>>(new Set())
  
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
  
  // 加载指定分类的工具
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
    } finally {
      loadingCategory.value = ''
    }
  }
  
  // 刷新单个工具信息
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
  
  return {
    tools,
    loadingCategory,
    loadedCategories,
    loadCategoryTools,
    refreshToolInfo,
    toolCategoryMap
  }
}

