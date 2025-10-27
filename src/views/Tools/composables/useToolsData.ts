/**
 * 工具数据管理 Composable
 * 负责管理工具列表、配置弹窗状态
 */
import { ref } from 'vue'
import type { ToolInfo } from '@/types'

export function useToolsData() {
  // 工具列表
  const tools = ref<ToolInfo[]>([])
  
  // 选中的工具
  const selectedTool = ref<string>('')
  
  // 配置弹窗状态
  const showConfigModal = ref(false)
  
  // 可用镜像源
  const availableMirrors = ref<any[]>([])
  
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
  
  /**
   * 打开工具配置对话框
   */
  async function openToolConfig(toolName: string) {
    if (!window.electronAPI) return
    
    selectedTool.value = toolName
    
    // 获取工具当前实际配置（从命令读取）
    const tool = tools.value.find(t => t.name === toolName)
    if (!tool || tool.status !== 'installed') return
    
    // 设置可用镜像源
    availableMirrors.value = tool.mirrors || [
      { name: 'npmmirror', displayName: '阿里云', url: 'https://registry.npmmirror.com', location: '中国' },
      { name: 'tencent', displayName: '腾讯云', url: 'https://mirrors.cloud.tencent.com/npm', location: '中国' },
      { name: 'npmjs', displayName: '官方源', url: 'https://registry.npmjs.org', location: '美国' }
    ]
    
    // 显示弹窗
    showConfigModal.value = true
  }
  
  /**
   * 刷新单个工具的信息
   */
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
    selectedTool,
    showConfigModal,
    availableMirrors,
    toolCategoryMap,
    openToolConfig,
    refreshToolInfo
  }
}


