/**
 * 工具配置注册表
 * 用于动态加载各工具的配置组件
 */
import type { Component } from 'vue'

export interface ToolConfigModule {
  name: string                    // 工具名称：npm, yarn, pnpm
  component: () => Promise<any>   // 动态导入的配置弹窗组件
  category: string                // 分类：frontend, backend, devops
  hasCustomModal: boolean         // 是否有自定义弹窗
}

// 工具配置模块注册表
const configModules: Record<string, ToolConfigModule> = {
  npm: {
    name: 'npm',
    component: () => import('./npm/NpmConfigModal.vue'),
    category: 'frontend',
    hasCustomModal: true
  },
  yarn: {
    name: 'yarn',
    component: () => import('./yarn/YarnConfigModal.vue'),
    category: 'frontend',
    hasCustomModal: true
  },
  pnpm: {
    name: 'pnpm',
    component: () => import('./pnpm/PnpmConfigModal.vue'),
    category: 'frontend',
    hasCustomModal: true
  },
  bun: {
    name: 'bun',
    component: () => import('./generic/GenericConfigModal.vue'),
    category: 'frontend',
    hasCustomModal: false
  },
  git: {
    name: 'git',
    component: () => import('./generic/GenericConfigModal.vue'),
    category: 'devops',
    hasCustomModal: false
  },
  curl: {
    name: 'curl',
    component: () => import('./generic/GenericConfigModal.vue'),
    category: 'backend',
    hasCustomModal: false
  },
  wget: {
    name: 'wget',
    component: () => import('./generic/GenericConfigModal.vue'),
    category: 'backend',
    hasCustomModal: false
  }
}

/**
 * 获取工具配置组件
 */
export function getToolConfigComponent(toolName: string): (() => Promise<any>) | null {
  const module = configModules[toolName]
  return module ? module.component : null
}

/**
 * 检查工具是否有自定义配置弹窗
 */
export function hasCustomModal(toolName: string): boolean {
  return configModules[toolName]?.hasCustomModal ?? false
}

/**
 * 获取所有已注册的工具
 */
export function getRegisteredTools(): string[] {
  return Object.keys(configModules)
}

/**
 * 根据分类获取工具列表
 */
export function getToolsByCategory(category: string): string[] {
  return Object.values(configModules)
    .filter(m => m.category === category)
    .map(m => m.name)
}

// 统一导出配置组件（用于直接导入）
export { default as NpmConfigModal } from './npm/index.js'
export { default as YarnConfigModal } from './yarn/index.js'

// 导出共享组件
export * from './shared/components/index.js'
export * from './shared/composables/index.js'

// 导出类型
export type * from './types.js'

