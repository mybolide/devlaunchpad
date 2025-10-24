/**
 * 工具模块统一导出
 * 
 * 架构说明（重构后）：
 * - 每个工具都是一个完整的模块（配置 + 检测 + 代理管理）
 * - 工具模块继承自 ToolModuleBase 基类
 * - 特殊逻辑在各自模块内实现，不污染通用代码
 * - 便于维护、扩展和测试
 */

import type { Tool } from '../../../src/types/index'
import type { IToolModule } from './base'

// 导出基类和接口
export { IToolModule, ToolModuleBase } from './base'

// 包管理器模块
import { npm } from './npm'
import { pnpm } from './pnpm'
import { yarn } from './yarn'
import { pip } from './pip'

// 开发工具模块
import { git } from './git'
import { maven } from './maven'
import { gradle } from './gradle'

/**
 * 所有工具模块
 */
export const TOOL_MODULES: Record<string, IToolModule> = {
  // 包管理器
  npm,
  pnpm,
  yarn,
  pip,
  
  // 开发工具
  git,
  maven,
  gradle
}

/**
 * 获取工具模块
 */
export function getToolModule(toolName: string): IToolModule | undefined {
  return TOOL_MODULES[toolName]
}

/**
 * 获取所有工具模块
 */
export function getAllToolModules(): IToolModule[] {
  return Object.values(TOOL_MODULES)
}

// ============================================
// 兼容性 API（保留旧的接口）
// ============================================

/**
 * 所有支持的工具配置（兼容性）
 */
export const SUPPORTED_TOOLS: Record<string, Tool> = Object.fromEntries(
  Object.entries(TOOL_MODULES).map(([name, module]) => [name, module.config])
)

/**
 * 获取所有工具名称列表
 */
export function getAllToolNames(): string[] {
  return Object.keys(TOOL_MODULES)
}

/**
 * 获取所有工具配置列表
 */
export function getAllTools(): Tool[] {
  return Object.values(TOOL_MODULES).map(module => module.config)
}

/**
 * 获取指定工具的配置
 * @alias getToolConfig
 */
export function getTool(toolName: string): Tool | undefined {
  return TOOL_MODULES[toolName]?.config
}

/**
 * 获取指定工具的配置（别名）
 */
export function getToolConfig(toolName: string): Tool | undefined {
  return getTool(toolName)
}

/**
 * 按分类获取工具列表
 */
export function getToolsByCategory(category: string): Tool[] {
  return getAllTools().filter(tool => tool.category === category)
}

/**
 * 获取所有工具分类
 */
export function getCategories(): string[] {
  const categories = new Set<string>()
  getAllTools().forEach(tool => {
    categories.add(tool.category)
  })
  return Array.from(categories)
}

/**
 * 检查工具是否支持
 */
export function isToolSupported(toolName: string): boolean {
  return toolName in TOOL_MODULES
}

/**
 * 添加新工具配置（用于运行时动态添加）
 */
export function registerTool(tool: Tool): void {
  SUPPORTED_TOOLS[tool.name] = tool
  // 注意：这个函数已废弃，新架构下应该注册模块，不只是配置
}

/**
 * 导出工具总数
 */
export const TOTAL_TOOLS = Object.keys(TOOL_MODULES).length

console.log(`[ToolsConfig] 已加载 ${TOTAL_TOOLS} 个工具模块`)

