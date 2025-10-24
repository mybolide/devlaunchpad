/**
 * npm 功能重构版
 * 
 * 核心功能：
 * 1. 设置镜像源（处理环境变量覆盖）
 * 2. 设置代理
 * 3. 设置缓存目录
 * 4. 清空缓存
 * 5. 一键清空 global 配置
 */

import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

/**
 * 清除进程中的 npm 环境变量
 * 这些环境变量会覆盖配置文件
 */
function clearNpmEnvVarsFromProcess() {
  const envVarsToDelete = [
    'npm_config_registry',
    'npm_config_cache', 
    'npm_config_prefix',
    'npm_config_proxy',
    'npm_config_https_proxy',
    'NPM_CONFIG_REGISTRY',
    'NPM_CONFIG_CACHE',
    'NPM_CONFIG_PREFIX', 
    'NPM_CONFIG_PROXY',
    'NPM_CONFIG_HTTPS_PROXY'
  ]
  
  for (const envVar of envVarsToDelete) {
    if (process.env[envVar]) {
      console.log(`[npm] 删除进程环境变量: ${envVar} = ${process.env[envVar]}`)
      delete process.env[envVar]
    }
  }
}

/**
 * 执行 npm 命令（清除环境变量后）
 */
async function execNpmCommand(command: string) {
  // 先清除环境变量
  clearNpmEnvVarsFromProcess()
  
  // 创建一个干净的环境变量副本（排除 npm_config_* 变量）
  const cleanEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value && !key.toLowerCase().startsWith('npm_config_')) {
      cleanEnv[key] = value
    }
  }
  
  // 执行命令，使用干净的环境变量
  return await execAsync(command, { env: cleanEnv })
}

export function registerNpmHandlers() {
  /**
   * 获取 npm 配置状态
   */
  ipcMain.handle('npm:getStatus', async () => {
    try {
      console.log('[npm:getStatus] 开始获取状态')
      
      // 清除环境变量
      clearNpmEnvVarsFromProcess()
      
      const status: any = {
        registry: { user: '', global: '', effective: '' },
        proxy: { user: '', global: '', effective: '' },
        httpsProxy: { user: '', global: '', effective: '' },
        cache: { user: '', global: '', effective: '' },
        prefix: { user: '', global: '', effective: '' },
        envVars: {},
        hasGlobalConfig: false
      }
      
      // 获取各级别配置
      const configs = ['registry', 'proxy', 'https-proxy', 'cache', 'prefix']
      
      for (const config of configs) {
        const key = config === 'https-proxy' ? 'httpsProxy' : config
        
        // 获取有效值
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config}`)
          status[key].effective = stdout.trim()
        } catch {}
        
        // 获取 user 值
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config} --location=user`)
          const value = stdout.trim()
          if (value && value !== 'undefined') {
            status[key].user = value
          }
        } catch {}
        
        // 获取 global 值
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config} --location=global`)
          const value = stdout.trim()
          
          // npm 的默认值（不算作 global 配置）
          const npmDefaults: Record<string, string[]> = {
            'registry': ['https://registry.npmjs.org/', 'https://registry.npmjs.org'],
            'proxy': ['null', '', 'undefined'],
            'https-proxy': ['null', '', 'undefined'],
            'cache': [], // cache 有默认路径，但通常不同
            'prefix': []  // prefix 有默认路径，但通常不同
          }
          
          const isDefault = npmDefaults[config]?.includes(value)
          const isSameAsUser = status[key].user && value === status[key].user
          
          // 只有当值存在，且不是默认值，且不同于user值时，才认为有global配置
          if (value && value !== 'undefined' && !isDefault && !isSameAsUser) {
            status[key].global = value
            status.hasGlobalConfig = true
          }
        } catch {}
      }
      
      // 检查环境变量（在进程中）
      const envVars = [
        'npm_config_registry', 'npm_config_cache', 'npm_config_prefix',
        'npm_config_proxy', 'npm_config_https_proxy',
        'NPM_CONFIG_REGISTRY', 'NPM_CONFIG_CACHE', 'NPM_CONFIG_PREFIX',
        'NPM_CONFIG_PROXY', 'NPM_CONFIG_HTTPS_PROXY'
      ]
      
      for (const envVar of envVars) {
        if (process.env[envVar]) {
          status.envVars[envVar] = process.env[envVar]
        }
      }
      
      console.log('[npm:getStatus] 状态:', JSON.stringify(status, null, 2))
      
      return {
        success: true,
        data: status
      }
    } catch (error: any) {
      console.error('[npm:getStatus] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 设置镜像源
   */
  ipcMain.handle('npm:setRegistry', async (event, registryUrl: string) => {
    try {
      console.log(`[npm:setRegistry] 设置镜像源: ${registryUrl}`)
      
      // 1. 清除环境变量
      clearNpmEnvVarsFromProcess()
      
      // 2. 删除 global 配置
      try {
        await execNpmCommand('npm config delete registry --location=global')
        console.log('[npm:setRegistry] 已删除 global registry')
      } catch {}
      
      // 3. 设置 user 配置
      await execNpmCommand(`npm config set registry "${registryUrl}" --location=user`)
      console.log('[npm:setRegistry] 已设置 user registry')
      
      // 4. 验证
      await new Promise(resolve => setTimeout(resolve, 500))
      const { stdout } = await execNpmCommand('npm config get registry')
      const actualValue = stdout.trim()
      
      if (actualValue === registryUrl || actualValue === registryUrl.replace(/\/$/, '')) {
        console.log('[npm:setRegistry] ✓ 设置成功')
        return { success: true, value: actualValue }
      } else {
        console.error(`[npm:setRegistry] ✗ 验证失败: 期望 ${registryUrl}, 实际 ${actualValue}`)
        return { success: false, message: `设置后验证失败，可能存在环境变量覆盖` }
      }
    } catch (error: any) {
      console.error('[npm:setRegistry] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 设置代理
   */
  ipcMain.handle('npm:setProxy', async (event, proxyUrl: string | null) => {
    try {
      console.log(`[npm:setProxy] 设置代理: ${proxyUrl || '(清除)'}`)
      
      clearNpmEnvVarsFromProcess()
      
      if (proxyUrl) {
        // 设置代理
        await execNpmCommand(`npm config set proxy "${proxyUrl}" --location=user`)
        await execNpmCommand(`npm config set https-proxy "${proxyUrl}" --location=user`)
        
        // 删除 global 代理
        try {
          await execNpmCommand('npm config delete proxy --location=global')
          await execNpmCommand('npm config delete https-proxy --location=global')
        } catch {}
        
        console.log('[npm:setProxy] ✓ 代理已设置')
        return { success: true, value: proxyUrl }
      } else {
        // 清除代理
        await execNpmCommand('npm config delete proxy --location=user')
        await execNpmCommand('npm config delete https-proxy --location=user')
        await execNpmCommand('npm config delete proxy --location=global')
        await execNpmCommand('npm config delete https-proxy --location=global')
        
        console.log('[npm:setProxy] ✓ 代理已清除')
        return { success: true, value: null }
      }
    } catch (error: any) {
      console.error('[npm:setProxy] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 设置缓存目录
   */
  ipcMain.handle('npm:setCacheDir', async (event, cacheDir: string) => {
    try {
      console.log(`[npm:setCacheDir] 设置缓存目录: ${cacheDir}`)
      
      clearNpmEnvVarsFromProcess()
      
      // 创建目录（如果不存在）
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }
      
      // 删除 global 配置
      try {
        await execNpmCommand('npm config delete cache --location=global')
      } catch {}
      
      // 设置 user 配置
      await execNpmCommand(`npm config set cache "${cacheDir}" --location=user`)
      
      console.log('[npm:setCacheDir] ✓ 缓存目录已设置')
      return { success: true, value: cacheDir }
    } catch (error: any) {
      console.error('[npm:setCacheDir] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 清空缓存
   */
  ipcMain.handle('npm:cleanCache', async () => {
    try {
      console.log('[npm:cleanCache] 开始清理缓存')
      
      clearNpmEnvVarsFromProcess()
      
      // 强制清理缓存
      await execNpmCommand('npm cache clean --force')
      
      // 验证缓存
      await execNpmCommand('npm cache verify')
      
      console.log('[npm:cleanCache] ✓ 缓存已清理')
      return { success: true, message: '缓存已清理并验证' }
    } catch (error: any) {
      console.error('[npm:cleanCache] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 获取缓存信息
   */
  ipcMain.handle('npm:getCacheInfo', async () => {
    try {
      clearNpmEnvVarsFromProcess()
      
      const { stdout } = await execNpmCommand('npm config get cache')
      const cachePath = stdout.trim()
      
      // 计算缓存大小
      let sizeInBytes = 0
      try {
        if (process.platform === 'win32') {
          const { stdout: sizeOutput } = await execAsync(
            `powershell "(Get-ChildItem '${cachePath}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`
          )
          sizeInBytes = parseInt(sizeOutput.trim()) || 0
        } else {
          const { stdout: sizeOutput } = await execAsync(`du -sb "${cachePath}" | cut -f1`)
          sizeInBytes = parseInt(sizeOutput.trim()) || 0
        }
      } catch {
        sizeInBytes = 0
      }
      
      const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
      }
      
      return {
        success: true,
        cachePath,
        sizeInBytes,
        sizeFormatted: formatSize(sizeInBytes)
      }
    } catch (error: any) {
      console.error('[npm:getCacheInfo] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 一键清空所有 global 配置
   */
  ipcMain.handle('npm:clearAllGlobalConfig', async () => {
    try {
      console.log('[npm:clearAllGlobalConfig] 开始清空 global 配置')
      
      clearNpmEnvVarsFromProcess()
      
      const configsToDelete = [
        'registry', 'proxy', 'https-proxy', 'cache', 'prefix',
        'cafile', 'cert', 'key', 'strict-ssl', 'user-agent'
      ]
      
      const results: any[] = []
      
      for (const config of configsToDelete) {
        try {
          await execNpmCommand(`npm config delete ${config} --location=global`)
          results.push({ config, success: true })
          console.log(`[npm:clearAllGlobalConfig] ✓ 删除 ${config}`)
        } catch (error: any) {
          // 忽略不存在的配置
          if (!error.message.includes('not found')) {
            results.push({ config, success: false, error: error.message })
          }
        }
      }
      
      console.log('[npm:clearAllGlobalConfig] ✓ global 配置已清空')
      
      return {
        success: true,
        message: 'Global 配置已清空，现在使用 user 配置',
        results
      }
    } catch (error: any) {
      console.error('[npm:clearAllGlobalConfig] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  /**
   * 测试镜像源速度
   */
  ipcMain.handle('npm:testRegistry', async (event, registryUrl: string) => {
    try {
      const startTime = Date.now()
      
      clearNpmEnvVarsFromProcess()
      
      // 使用指定的镜像源进行 ping 测试
      const { stdout, stderr } = await execNpmCommand(
        `npm ping --registry=${registryUrl}`
      )
      
      const duration = Date.now() - startTime
      
      if (stderr && !stdout) {
        return { success: false, message: stderr, duration }
      }
      
      return {
        success: true,
        message: stdout.trim(),
        duration,
        formatted: `${duration}ms`
      }
    } catch (error: any) {
      console.error('[npm:testRegistry] 错误:', error)
      return {
        success: false,
        message: error.message || '连接失败',
        duration: 0
      }
    }
  })
  
  /**
   * 快速诊断
   */
  ipcMain.handle('npm:diagnose', async () => {
    try {
      console.log('[npm:diagnose] 开始诊断')
      
      const diagnosis: any = {
        version: '',
        configList: '',
        envVars: {},
        globalConfig: {},
        userConfig: {},
        effectiveConfig: {}
      }
      
      // npm 版本
      try {
        const { stdout } = await execNpmCommand('npm --version')
        diagnosis.version = stdout.trim()
      } catch {}
      
      // 完整配置列表
      try {
        const { stdout } = await execNpmCommand('npm config list')
        diagnosis.configList = stdout
      } catch {}
      
      // 环境变量
      for (const [key, value] of Object.entries(process.env)) {
        if (key.toLowerCase().startsWith('npm_config_')) {
          diagnosis.envVars[key] = value
        }
      }
      
      // 主要配置的各级别值
      const configs = ['registry', 'proxy', 'https-proxy', 'cache', 'prefix']
      
      for (const config of configs) {
        // effective
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config}`)
          diagnosis.effectiveConfig[config] = stdout.trim()
        } catch {}
        
        // user
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config} --location=user`)
          const value = stdout.trim()
          if (value && value !== 'undefined') {
            diagnosis.userConfig[config] = value
          }
        } catch {}
        
        // global
        try {
          const { stdout } = await execNpmCommand(`npm config get ${config} --location=global`)
          const value = stdout.trim()
          if (value && value !== 'undefined') {
            diagnosis.globalConfig[config] = value
          }
        } catch {}
      }
      
      console.log('[npm:diagnose] 诊断完成')
      
      return {
        success: true,
        diagnosis
      }
    } catch (error: any) {
      console.error('[npm:diagnose] 错误:', error)
      return { success: false, message: error.message }
    }
  })
  
  console.log('[npm] ✓ 重构版 handlers 注册完成')
}
