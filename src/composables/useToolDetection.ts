/**
 * 工具检测 Composable
 */
import { ref } from 'vue'
import type { ToolInfo } from '../types'

export function useToolDetection() {
  const tools = ref<ToolInfo[]>([])
  const loadingCategory = ref<string>('')
  const loadedCategories = ref<Set<string>>(new Set())
  
  // 加载指定分类的工具
  async function loadCategoryTools(categoryName: string) {
    if (!window.electronAPI || loadedCategories.value.has(categoryName)) {
      return
    }
    
    try {
      loadingCategory.value = categoryName
      
      // 获取该分类下的工具
      const categoryTools = tools.value.filter(t => t.category === categoryName)
      
      // 并发检测所有工具
      await Promise.all(
        categoryTools.map(async (tool) => {
          try {
            const info = await window.electronAPI.tool.detect(tool.name)
            const index = tools.value.findIndex(t => t.name === tool.name)
            if (index !== -1) {
              tools.value[index] = { ...tools.value[index], ...info }
            }
          } catch (error) {
            console.error(`检测工具 ${tool.name} 失败:`, error)
          }
        })
      )
      
      // 标记该分类已加载
      loadedCategories.value.add(categoryName)
    } finally {
      loadingCategory.value = ''
    }
  }
  
  // 刷新单个工具信息
  async function refreshToolInfo(toolName: string) {
    if (!window.electronAPI) return
    
    try {
      const info = await window.electronAPI.tool.detect(toolName)
      const index = tools.value.findIndex(t => t.name === toolName)
      if (index !== -1) {
        tools.value[index] = { ...tools.value[index], ...info }
      }
    } catch (error) {
      console.error(`刷新工具 ${toolName} 信息失败:`, error)
    }
  }
  
  return {
    tools,
    loadingCategory,
    loadedCategories,
    loadCategoryTools,
    refreshToolInfo
  }
}

