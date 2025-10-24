/**
 * 配置存储（JSON 文件）
 * 替代 SQLite，避免 ES modules 兼容性问题
 */

import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { app } = require('electron') as typeof import('electron')

interface Category {
  name: string
  display_name: string
  icon: string
  sort_order: number
}

interface ToolConfig {
  tool_name: string
  category_name?: string
  registry_url?: string
  cache_dir?: string
  proxy_type?: string
  custom_proxy?: string
  sort_order?: number
}

interface ConfigData {
  categories: Category[]
  toolConfigs: Record<string, ToolConfig>
  userConfigs: Record<string, any>
}

let configPath: string = ''
let configData: ConfigData = {
  categories: [
    { name: 'frontend', display_name: '前端开发', icon: '🎨', sort_order: 1 },
    { name: 'backend', display_name: '后端开发', icon: '⚙️', sort_order: 2 },
    { name: 'devops', display_name: '运维工具', icon: '🚀', sort_order: 3 },
    { name: 'database', display_name: '数据库', icon: '💾', sort_order: 4 },
    { name: 'other', display_name: '其他工具', icon: '📦', sort_order: 99 }
  ],
  toolConfigs: {},
  userConfigs: {}
}

/**
 * 初始化配置存储
 */
export async function initConfigStorage() {
  try {
    const userDataPath = app.getPath('userData')
    configPath = path.join(userDataPath, 'devkit-config.json')
    
    console.log(`[ConfigStorage] 配置文件路径: ${configPath}`)
    
    // 尝试读取现有配置
    try {
      const data = await fs.readFile(configPath, 'utf-8')
      configData = JSON.parse(data)
      console.log('[ConfigStorage] 配置加载成功')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件不存在，使用默认配置
        console.log('[ConfigStorage] 配置文件不存在，使用默认配置')
        await saveConfig()
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('[ConfigStorage] 初始化失败:', error)
    throw error
  }
}

/**
 * 保存配置到文件
 */
async function saveConfig() {
  try {
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8')
  } catch (error) {
    console.error('[ConfigStorage] 保存配置失败:', error)
  }
}

/**
 * 获取所有分类
 */
export function getCategories() {
  return configData.categories
}

/**
 * 更新分类排序
 */
export async function updateCategoryOrder(categoryName: string, sortOrder: number) {
  const category = configData.categories.find((c) => c.name === categoryName)
  if (category) {
    category.sort_order = sortOrder
    await saveConfig()
  }
}

/**
 * 获取工具配置
 */
export function getToolConfig(toolName: string) {
  return configData.toolConfigs[toolName] || null
}

/**
 * 保存工具配置
 */
export async function saveToolConfig(config: ToolConfig) {
  configData.toolConfigs[config.tool_name] = config
  await saveConfig()
  return { success: true }
}

/**
 * 获取用户配置
 */
export function getUserConfig(key: string) {
  return configData.userConfigs[key]
}

/**
 * 保存用户配置
 */
export async function saveUserConfig(key: string, value: any) {
  configData.userConfigs[key] = value
  await saveConfig()
}

