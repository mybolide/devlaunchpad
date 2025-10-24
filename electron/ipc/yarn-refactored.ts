/**
 * yarn 功能重构版
 * 
 * 核心功能：
 * 1. 设置镜像源
 * 2. 设置代理
 * 3. 设置缓存目录
 * 4. 清理缓存
 */

import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

/**
 * 执行 yarn 命令
 */
async function execYarnCommand(command: string) {
  // yarn 没有像 npm 那样复杂的环境变量覆盖问题
  return await execAsync(command)
}

/**
 * 获取 yarn 配置文件路径
 */
function getYarnConfigPath(): string {
  return path.join(os.homedir(), '.yarnrc')
}

export function registerYarnHandlers() {
  /**
   * 获取 yarn 配置状态
   */
  ipcMain.handle('yarn:getStatus', async () => {
    try {
      console.log('[yarn:getStatus] 开始获取状态')
      
      const status: any = {
        registry: { value: '', effective: '' },
        proxy: { value: '', effective: '' },
        httpsProxy: { value: '', effective: '' },
        cacheFolder: { value: '', effective: '' }
      }
      
      // 获取各配置
      const configs = [
        { key: 'registry', name: 'registry' },
        { key: 'proxy', name: 'proxy' },
        { key: 'httpsProxy', name: 'https-proxy' },
        { key: 'cacheFolder', name: 'cache-folder' }
      ]
      
      for (const config of configs) {
        try {
          const { stdout } = await execYarnCommand(`yarn config get ${config.name}`)
          const value = stdout.trim()
          status[config.key].value = value
          status[config.key].effective = value
        } catch (error) {
          // 配置不存在
          status[config.key].value = ''
          status[config.key].effective = ''
        }
      }
      
      console.log('[yarn:getStatus] 状态:', status)
      
      return {
        success: true,
        data: status
      }
    } catch (error: any) {
      console.error('[yarn:getStatus] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 设置镜像源
   */
  ipcMain.handle('yarn:setRegistry', async (_event, registryUrl: string) => {
    try {
      console.log('[yarn:setRegistry] 设置镜像源:', registryUrl)
      
      // 设置镜像源
      await execYarnCommand(`yarn config set registry "${registryUrl}"`)
      
      // 验证设置
      const { stdout } = await execYarnCommand('yarn config get registry')
      const actualValue = stdout.trim()
      
      console.log('[yarn:setRegistry] ✓ 设置成功')
      
      return {
        success: true,
        value: actualValue,
        message: '镜像源设置成功'
      }
    } catch (error: any) {
      console.error('[yarn:setRegistry] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 设置代理
   */
  ipcMain.handle('yarn:setProxy', async (_event, proxyUrl: string | null) => {
    try {
      if (proxyUrl) {
        console.log('[yarn:setProxy] 设置代理:', proxyUrl)
        
        // 设置 HTTP 和 HTTPS 代理
        await execYarnCommand(`yarn config set proxy "${proxyUrl}"`)
        await execYarnCommand(`yarn config set https-proxy "${proxyUrl}"`)
        
        console.log('[yarn:setProxy] ✓ 代理已设置')
        
        return {
          success: true,
          message: '代理已设置'
        }
      } else {
        console.log('[yarn:setProxy] 设置代理: (清除)')
        
        // 删除代理配置
        await execYarnCommand('yarn config delete proxy')
        await execYarnCommand('yarn config delete https-proxy')
        
        console.log('[yarn:setProxy] ✓ 代理已清除')
        
        return {
          success: true,
          message: '代理已清除'
        }
      }
    } catch (error: any) {
      console.error('[yarn:setProxy] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 设置缓存目录
   */
  ipcMain.handle('yarn:setCacheFolder', async (_event, cachePath: string) => {
    try {
      console.log('[yarn:setCacheFolder] 设置缓存目录:', cachePath)
      
      // 设置缓存目录
      await execYarnCommand(`yarn config set cache-folder "${cachePath}"`)
      
      // 验证设置
      const { stdout } = await execYarnCommand('yarn config get cache-folder')
      const actualValue = stdout.trim()
      
      console.log('[yarn:setCacheFolder] ✓ 缓存目录已设置')
      
      return {
        success: true,
        value: actualValue,
        message: '缓存目录设置成功'
      }
    } catch (error: any) {
      console.error('[yarn:setCacheFolder] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 清理缓存
   */
  ipcMain.handle('yarn:cleanCache', async () => {
    try {
      console.log('[yarn:cleanCache] 开始清理缓存')
      
      await execYarnCommand('yarn cache clean')
      
      console.log('[yarn:cleanCache] ✓ 缓存已清理')
      
      return {
        success: true,
        message: 'Yarn 缓存已清理'
      }
    } catch (error: any) {
      console.error('[yarn:cleanCache] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 获取缓存信息
   */
  ipcMain.handle('yarn:getCacheInfo', async () => {
    try {
      console.log('[yarn:getCacheInfo] 开始获取缓存信息')
      
      // 获取缓存目录
      const { stdout: cacheDir } = await execYarnCommand('yarn cache dir')
      const cachePath = cacheDir.trim()
      
      // 获取缓存大小
      let sizeInBytes = 0
      let sizeFormatted = '0 B'
      
      try {
        if (fs.existsSync(cachePath)) {
          // 递归计算目录大小
          const calculateSize = (dirPath: string): number => {
            let size = 0
            const items = fs.readdirSync(dirPath)
            
            for (const item of items) {
              const itemPath = path.join(dirPath, item)
              const stats = fs.statSync(itemPath)
              
              if (stats.isDirectory()) {
                size += calculateSize(itemPath)
              } else {
                size += stats.size
              }
            }
            
            return size
          }
          
          sizeInBytes = calculateSize(cachePath)
          
          // 格式化大小
          if (sizeInBytes < 1024) {
            sizeFormatted = `${sizeInBytes} B`
          } else if (sizeInBytes < 1024 * 1024) {
            sizeFormatted = `${(sizeInBytes / 1024).toFixed(2)} KB`
          } else if (sizeInBytes < 1024 * 1024 * 1024) {
            sizeFormatted = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
          } else {
            sizeFormatted = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
          }
        }
      } catch (error) {
        console.error('[yarn:getCacheInfo] 计算缓存大小失败:', error)
      }
      
      console.log('[yarn:getCacheInfo] 缓存信息:', { cachePath, sizeFormatted })
      
      return {
        success: true,
        cachePath,
        sizeInBytes,
        sizeFormatted
      }
    } catch (error: any) {
      console.error('[yarn:getCacheInfo] 错误:', error)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 测试镜像源速度
   */
  ipcMain.handle('yarn:testRegistry', async (_event, registryUrl?: string) => {
    try {
      console.log('[yarn:testRegistry] 测试镜像源:', registryUrl || '当前配置')
      
      const testUrl = registryUrl || (await execYarnCommand('yarn config get registry')).stdout.trim()
      const startTime = Date.now()
      
      // 测试访问镜像源（获取 react 包信息）
      const testPackage = 'react'
      const fullUrl = `${testUrl.replace(/\/$/, '')}/${testPackage}`
      
      await fetch(fullUrl, { method: 'HEAD' })
      
      const duration = Date.now() - startTime
      
      console.log('[yarn:testRegistry] 测试完成，耗时:', duration, 'ms')
      
      return {
        success: true,
        duration,
        message: `响应时间: ${duration}ms`
      }
    } catch (error: any) {
      console.error('[yarn:testRegistry] 测试失败:', error)
      return {
        success: false,
        duration: -1,
        message: error.message
      }
    }
  })

  console.log('[yarn] IPC handlers 已注册')
}

