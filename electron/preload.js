const { contextBridge, ipcRenderer } = require('electron')

/**
 * Preload 脚本
 *
 * 作用：在渲染进程和主进程之间提供安全的通信桥梁
 * 只暴露必要的 API 给前端，不直接暴露 Node.js 或 Electron API
 */

// ============================================
// 窗口控制 API
// ============================================
const windowAPI = {
  /**
   * 最小化窗口
   */
  minimize: () => ipcRenderer.invoke('window:minimize'),

  /**
   * 最大化/还原窗口
   * @returns 是否最大化
   */
  maximize: () => ipcRenderer.invoke('window:maximize'),

  /**
   * 关闭窗口
   */
  close: () => ipcRenderer.invoke('window:close'),

  /**
   * 获取窗口最大化状态
   */
  isMaximized: () => ipcRenderer.invoke('window:isMaximized')
}

// ============================================
// 命令执行 API
// ============================================
const commandAPI = {
  /**
   * 执行系统命令
   * @param command 要执行的命令
   * @returns 命令执行结果
   */
  execute: (command) => ipcRenderer.invoke('command:execute', command)
}

// ============================================
// 工具检测 API
// ============================================
const toolAPI = {
  /**
   * 获取所有工具信息
   */
  getAllTools: () => ipcRenderer.invoke('tool:getAllTools'),

  /**
   * 获取特定工具信息
   */
  getToolInfo: (toolName) => ipcRenderer.invoke('tool:getToolInfo', toolName),

  /**
   * 获取多个工具信息
   */
  getToolsInfo: (toolNames) => ipcRenderer.invoke('tool:getToolsInfo', toolNames),

  /**
   * 检查工具是否安装
   */
  isInstalled: (toolName) => ipcRenderer.invoke('tool:isInstalled', toolName),

  /**
   * 获取工具版本
   */
  getVersion: (toolName) => ipcRenderer.invoke('tool:getVersion', toolName)
}

// ============================================
// 代理管理 API
// ============================================
const proxyAPI = {
  /**
   * 启用代理
   */
  enable: (toolName, proxyUrl) => ipcRenderer.invoke('proxy:enable', toolName, proxyUrl),

  /**
   * 禁用代理
   */
  disable: (toolName) => ipcRenderer.invoke('proxy:disable', toolName),

  /**
   * 批量启用代理
   */
  enableBatch: (toolNames, proxyUrl) => ipcRenderer.invoke('proxy:enableBatch', toolNames, proxyUrl),

  /**
   * 批量禁用代理
   */
  disableBatch: (toolNames) => ipcRenderer.invoke('proxy:disableBatch', toolNames),

  /**
   * 测试代理连接
   */
  test: (proxyUrl) => ipcRenderer.invoke('proxy:test', proxyUrl)
}

// ============================================
// 数据库 API
// ============================================
const dbAPI = {
  /**
   * 获取工具分类
   */
  getCategories: () => ipcRenderer.invoke('db:getCategories'),

  /**
   * 保存工具配置
   */
  saveToolConfig: (config) => ipcRenderer.invoke('db:saveToolConfig', config),

  /**
   * 获取工具配置
   */
  getToolConfig: (toolName) => ipcRenderer.invoke('db:getToolConfig', toolName)
}

// ============================================
// 暴露 API 到渲染进程
// ============================================
contextBridge.exposeInMainWorld('electronAPI', {
  window: windowAPI,
  command: commandAPI,
  tool: toolAPI,
  proxy: proxyAPI,
  db: dbAPI,
  platform: process.platform, // 操作系统类型
  versions: process.versions, // 版本信息
  
  // 通用 IPC 调用方法（用于动态调用任意 IPC）
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
})

