/**
 * 工具配置导出（兼容层）
 * 
 * 注意：工具配置已重构为独立文件
 * 实际配置位于 ./tools/ 目录下
 * 
 * 如需添加新工具：
 * 1. 在 ./tools/ 目录下创建新的工具配置文件（如 docker.ts）
 * 2. 在 ./tools/index.ts 中导入并导出
 * 3. 无需修改此文件
 */

// 从新的 tools 目录导出所有配置和函数
export {
  // 核心配置
  SUPPORTED_TOOLS,
  TOTAL_TOOLS,
  
  // 查询函数
  getTool,              // 获取单个工具配置
  getToolConfig,        // getTool 的别名
  getAllTools,          // 获取所有工具配置列表
  getAllToolNames,      // 获取所有工具名称
  getToolsByCategory,   // 按分类获取工具
  getCategories,        // 获取所有分类
  isToolSupported,      // 检查工具是否支持
  
  // 动态注册
  registerTool          // 运行时添加新工具
} from './tools/index'

// 为了保持向后兼容，也导出默认值
export { SUPPORTED_TOOLS as default } from './tools/index'
