/**
 * npm 专用 IPC 处理
 */
import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

export function registerNpmHandlers() {
  /**
   * npm ping 测试镜像源速度
   */
  ipcMain.handle('npm:ping', async (event, registryUrl?: string) => {
    try {
      const startTime = Date.now()
      
      // 如果指定了 registry，临时使用该源进行测试
      const pingCmd = registryUrl 
        ? `npm ping --registry=${registryUrl}`
        : 'npm ping'

      const { stdout, stderr } = await execAsync(pingCmd, { timeout: 10000 })
      const duration = Date.now() - startTime

      if (stderr && !stdout) {
        return { success: false, message: stderr, duration: 0 }
      }

      return { 
        success: true, 
        message: stdout.trim(), 
        duration,
        formatted: `${duration}ms`
      }
    } catch (error: any) {
      console.error('[npm:ping] 错误:', error)
      return { 
        success: false, 
        message: error.message || '连接失败', 
        duration: 0 
      }
    }
  })

  /**
   * 获取 npm 缓存信息
   */
  ipcMain.handle('npm:getCacheInfo', async () => {
    try {
      // 获取缓存路径
      const { stdout: cachePathOutput } = await execAsync('npm config get cache')
      const cachePath = cachePathOutput.trim()

      // 计算文件夹大小
      let sizeInBytes = 0
      try {
        const { stdout: duOutput } = await execAsync(
          process.platform === 'win32'
            ? `powershell "(Get-ChildItem '${cachePath}' -Recurse | Measure-Object -Property Length -Sum).Sum"`
            : `du -sb "${cachePath}" | cut -f1`
        )
        sizeInBytes = parseInt(duOutput.trim())
      } catch {
        sizeInBytes = 0
      }

      // 格式化大小
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
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 清理 npm 缓存
   */
  ipcMain.handle('npm:cleanCache', async () => {
    try {
      // 清理缓存
      await execAsync('npm cache clean --force')
      
      // 校验缓存
      await execAsync('npm cache verify')

      return { success: true, message: '缓存清理并校验完成' }
    } catch (error: any) {
      console.error('[npm:cleanCache] 错误:', error)
      return { success: false, message: error.message || '清理失败' }
    }
  })

  /**
   * 获取 npm 全局前缀
   */
  ipcMain.handle('npm:getPrefix', async () => {
    try {
      const { stdout } = await execAsync('npm config get prefix')
      const prefix = stdout.trim()

      // 检查 PATH 中是否包含 prefix/bin
      const pathEnv = process.env.PATH || ''
      const binPath = process.platform === 'win32' ? prefix : `${prefix}/bin`
      const inPath = pathEnv.includes(binPath)

      return {
        success: true,
        prefix,
        inPath,
        binPath
      }
    } catch (error: any) {
      console.error('[npm:getPrefix] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 设置 npm 全局前缀（自动使用推荐路径）
   */
  ipcMain.handle('npm:setPrefix', async (event, customPrefix?: string) => {
    try {
      // 如果没有提供自定义路径，使用推荐路径
      let newPrefix = customPrefix
      if (!newPrefix) {
        const os = await import('os')
        const userHome = os.homedir()
        newPrefix = process.platform === 'win32'
          ? `${userHome}\\.npm-global`
          : `${userHome}/.npm-global`
      }

      // 创建目录（如果不存在）
      if (!fs.existsSync(newPrefix)) {
        fs.mkdirSync(newPrefix, { recursive: true })
      }

      // 设置前缀
      await execAsync(`npm config set prefix "${newPrefix}"`)

      return { success: true, message: '前缀设置成功', prefix: newPrefix }
    } catch (error: any) {
      console.error('[npm:setPrefix] 错误:', error)
      return { success: false, message: error.message || '设置失败' }
    }
  })

  /**
   * npm 快速体检
   */
  ipcMain.handle('npm:doctor', async () => {
    try {
      const results: any[] = []

      // 1. 检查 Node.js 版本
      try {
        const { stdout } = await execAsync('node -v')
        results.push({
          name: 'Node.js',
          status: 'success',
          message: stdout.trim()
        })
      } catch (error: any) {
        results.push({
          name: 'Node.js',
          status: 'error',
          message: error.message
        })
      }

      // 2. 检查 npm 版本
      try {
        const { stdout } = await execAsync('npm -v')
        results.push({
          name: 'npm',
          status: 'success',
          message: `v${stdout.trim()}`
        })
      } catch (error: any) {
        results.push({
          name: 'npm',
          status: 'error',
          message: error.message
        })
      }

      // 3. 测试网络连接
      try {
        const startTime = Date.now()
        await execAsync('npm ping', { timeout: 5000 })
        const duration = Date.now() - startTime
        results.push({
          name: '网络连接',
          status: 'success',
          message: `正常 (${duration}ms)`
        })
      } catch (error: any) {
        results.push({
          name: '网络连接',
          status: 'error',
          message: '无法连接到 registry'
        })
      }

      // 4. 测试包查询
      try {
        const { stdout } = await execAsync('npm view react version', { timeout: 5000 })
        results.push({
          name: '包查询',
          status: 'success',
          message: `react@${stdout.trim()}`
        })
      } catch (error: any) {
        results.push({
          name: '包查询',
          status: 'error',
          message: '查询失败'
        })
      }

      return { success: true, results }
    } catch (error: any) {
      console.error('[npm:doctor] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 检测 npm 配置是否被环境变量覆盖
   * 
   * 正确的判断逻辑：
   * 1. 检查 user section 中是否有 "overridden by" 标记
   * 2. 检查进程环境变量中是否真的存在 npm_config_* 变量
   */
  ipcMain.handle('npm:checkEnvOverride', async () => {
    try {
      // 获取完整的 npm config 输出
      const { stdout } = await execAsync('npm config list', { timeout: 5000 })
      
      const overrides: Array<{ 
        key: string
        envValue: string
        userValue?: string
        source: string
      }> = []
      
      // 解析配置输出，查找 "overridden by" 标记
      const lines = stdout.split('\n')
      let inUserSection = false
      
      console.log('[npm:checkEnvOverride] 开始检测环境变量覆盖')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // 检测进入 user section
        if (line.includes('; "user" config from')) {
          inUserSection = true
          console.log('[npm:checkEnvOverride] 进入 user section')
          continue
        } 
        // 检测退出 user section
        else if (inUserSection && (
          line.includes('; "global" config from') || 
          line.includes('; node bin location') ||
          line.includes('; "cli" config from') ||
          line.includes('; "builtin" config from') ||
          line.includes('; "default" values from'))) {
          inUserSection = false
          console.log('[npm:checkEnvOverride] 退出 user section')
          continue
        }
        
        // 在 user section 中查找被环境变量覆盖的配置
        // 关键：必须是 "overridden by env" 而不是 "overridden by user"
        // 格式示例: ; registry = "https://..." ; overridden by env
        if (inUserSection && line.includes('overridden by env')) {
          console.log(`[npm:checkEnvOverride] 发现被环境变量覆盖的配置行: ${line}`)
          
          // 提取配置名和值
          const match = line.match(/^;\s*(\w+(?:-\w+)*)\s*=\s*"([^"]+)"/) ||
                       line.match(/^;\s*(\w+(?:-\w+)*)\s*=\s*([^\s;]+)/)
          
          if (match) {
            const [, key, userValue] = match
            
            // 从进程环境变量中获取实际生效的值
            const envKey = `npm_config_${key.replace(/-/g, '_')}`
            const envValue = process.env[envKey] || process.env[`npm_config_${key}`]
            
            console.log(`[npm:checkEnvOverride] 配置 ${key} 被环境变量覆盖`)
            console.log(`  - 用户配置值: ${userValue}`)
            console.log(`  - 环境变量键: ${envKey}`)
            console.log(`  - 环境变量值: ${envValue || '(未找到)'}`)
            
            overrides.push({
              key,
              envValue: envValue || '(unknown)',
              userValue,
              source: 'environment'
            })
          }
        }
      }
      
      // 额外检查：直接检查进程环境变量
      const npmEnvVars: Record<string, string> = {}
      const envVarsToCheck = [
        'npm_config_cache',
        'npm_config_prefix', 
        'npm_config_registry',
        'npm_config_proxy',
        'npm_config_https_proxy',
        'NPM_CONFIG_CACHE',
        'NPM_CONFIG_PREFIX',
        'NPM_CONFIG_REGISTRY',
        'NPM_CONFIG_PROXY',
        'NPM_CONFIG_HTTPS_PROXY'
      ]
      
      for (const envVar of envVarsToCheck) {
        if (process.env[envVar]) {
          npmEnvVars[envVar] = process.env[envVar] as string
          console.log(`[npm:checkEnvOverride] 进程中存在环境变量: ${envVar} = ${process.env[envVar]}`)
        }
      }
      
      console.log('[npm:checkEnvOverride] 检测完成')
      console.log(`  - 发现 ${overrides.length} 个被覆盖的配置`)
      console.log(`  - 发现 ${Object.keys(npmEnvVars).length} 个 npm 环境变量`)
      
      return {
        success: true,
        hasOverride: overrides.length > 0,
        overrides,
        // 返回原始输出用于调试
        rawOutput: stdout,
        // 返回进程环境变量中的 npm 相关配置
        processEnv: npmEnvVars
      }
    } catch (error: any) {
      console.error('[npm:checkEnvOverride] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 诊断 npm 配置来源
   * 帮助用户了解配置到底来自哪里
   */
  ipcMain.handle('npm:diagnoseConfig', async () => {
    try {
      const diagnosis: any = {
        registry: {},
        allConfigs: {},
        processEnv: {},
        configFiles: []
      }

      // 1. 获取 registry 的详细信息
      try {
        const { stdout } = await execAsync('npm config get registry')
        diagnosis.registry.current = stdout.trim()
      } catch (error: any) {
        diagnosis.registry.error = error.message
      }

      // 2. 获取不同级别的配置
      try {
        // 用户级配置
        const { stdout: userConfig } = await execAsync('npm config get registry --location=user')
        diagnosis.registry.user = userConfig.trim()
      } catch {}

      try {
        // 全局配置
        const { stdout: globalConfig } = await execAsync('npm config get registry --location=global')
        diagnosis.registry.global = globalConfig.trim()
      } catch {}

      try {
        // 项目级配置
        const { stdout: projectConfig } = await execAsync('npm config get registry --location=project')
        diagnosis.registry.project = projectConfig.trim()
      } catch {}

      // 3. 获取完整的配置列表
      try {
        const { stdout: configList } = await execAsync('npm config list -l')
        diagnosis.allConfigs.full = configList
      } catch {}

      // 4. 检查进程环境变量
      const envVarsToCheck = [
        'npm_config_registry',
        'NPM_CONFIG_REGISTRY',
        'npm_config_cache',
        'npm_config_prefix',
        'npm_config_proxy',
        'npm_config_https_proxy'
      ]
      
      for (const envVar of envVarsToCheck) {
        if (process.env[envVar]) {
          diagnosis.processEnv[envVar] = process.env[envVar]
        }
      }

      // 5. 查找配置文件位置
      try {
        const os = await import('os')
        const path = await import('path')
        
        const userHome = os.homedir()
        const possibleConfigFiles = [
          path.join(userHome, '.npmrc'),
          path.join(userHome, '.npm', 'npmrc'),
          'C:\\Program Files\\nodejs\\etc\\npmrc',
          '/etc/npmrc',
          '/usr/local/etc/npmrc'
        ]

        for (const configFile of possibleConfigFiles) {
          if (fs.existsSync(configFile)) {
            try {
              const content = fs.readFileSync(configFile, 'utf-8')
              diagnosis.configFiles.push({
                path: configFile,
                content: content,
                hasRegistry: content.includes('registry=')
              })
            } catch {}
          }
        }
      } catch {}

      // 6. 运行 npm config list 查看覆盖情况
      try {
        const { stdout: configList } = await execAsync('npm config list')
        diagnosis.configListOutput = configList
        
        // 检查是否有 overridden by 标记
        diagnosis.hasOverride = configList.includes('overridden by')
        
        // 提取所有包含 overridden 的行
        const overriddenLines = configList.split('\n').filter(line => 
          line.includes('overridden by')
        )
        diagnosis.overriddenLines = overriddenLines
      } catch {}

      console.log('[npm:diagnoseConfig] 诊断结果:', JSON.stringify(diagnosis, null, 2))

      return {
        success: true,
        diagnosis
      }
    } catch (error: any) {
      console.error('[npm:diagnoseConfig] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 清除 npm global 配置
   * 清空全局配置文件中的特定配置项，避免干扰用户级配置
   */
  ipcMain.handle('npm:clearGlobalConfig', async (event, keys?: string[]) => {
    try {
      const configKeys = keys || ['registry', 'proxy', 'https-proxy', 'cache']
      const results: Array<{ key: string; success: boolean; message: string }> = []
      
      for (const key of configKeys) {
        try {
          // 删除 global 级别的配置
          await execAsync(`npm config delete ${key} --location=global`)
          results.push({
            key,
            success: true,
            message: `已清除 global 配置: ${key}`
          })
          console.log(`[npm:clearGlobalConfig] 清除成功: ${key}`)
        } catch (error: any) {
          // 即使删除失败也继续（可能本来就不存在）
          results.push({
            key,
            success: true,
            message: `${key} (配置不存在或已清除)`
          })
        }
      }
      
      return {
        success: true,
        message: 'Global 配置清理完成',
        results
      }
    } catch (error: any) {
      console.error('[npm:clearGlobalConfig] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 获取 npm 配置的来源信息
   * 检查配置是来自 user、global 还是 default
   */
  ipcMain.handle('npm:getConfigSource', async (event, key: string) => {
    try {
      const sources: any = {
        key,
        current: '',
        user: '',
        global: '',
        hasGlobal: false,
        hasUser: false
      }

      // 获取当前生效的值
      try {
        const { stdout } = await execAsync(`npm config get ${key}`)
        sources.current = stdout.trim()
      } catch {}

      // 获取 user 级别的值
      try {
        const { stdout } = await execAsync(`npm config get ${key} --location=user`)
        const value = stdout.trim()
        if (value && value !== 'undefined') {
          sources.user = value
          sources.hasUser = true
        }
      } catch {}

      // 获取 global 级别的值
      try {
        const { stdout } = await execAsync(`npm config get ${key} --location=global`)
        const value = stdout.trim()
        if (value && value !== 'undefined') {
          sources.global = value
          sources.hasGlobal = true
        }
      } catch {}

      return {
        success: true,
        ...sources
      }
    } catch (error: any) {
      console.error('[npm:getConfigSource] 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 设置 npm 配置（指定级别）
   */
  ipcMain.handle('npm:setConfig', async (event, key: string, value: string, location: 'user' | 'global' = 'user') => {
    console.log(`[npm:setConfig] 开始设置: ${key} = ${value} (${location} 级别)`)
    
    try {
      // 1. 先清除所有级别的同名配置
      if (location === 'user') {
        // 清除 global 配置
        try {
          const { stdout: globalValue } = await execAsync(`npm config get ${key} --location=global`)
          if (globalValue && globalValue.trim() !== 'undefined') {
            console.log(`[npm:setConfig] 检测到 global 配置: ${globalValue.trim()}`)
            await execAsync(`npm config delete ${key} --location=global`)
            console.log(`[npm:setConfig] ✓ 已清除 global 级别的 ${key}`)
          } else {
            console.log(`[npm:setConfig] global 级别没有 ${key} 配置`)
          }
        } catch (err: any) {
          console.log(`[npm:setConfig] 清除 global 配置时出错 (可忽略): ${err.message}`)
        }
        
        // 清除可能存在的项目级配置
        try {
          await execAsync(`npm config delete ${key} --location=project`)
          console.log(`[npm:setConfig] ✓ 已清除 project 级别的 ${key}`)
        } catch {
          // 忽略
        }
      }

      // 2. 设置指定级别的配置
      console.log(`[npm:setConfig] 执行: npm config set ${key} "${value}" --location=${location}`)
      const setResult = await execAsync(`npm config set ${key} "${value}" --location=${location}`)
      console.log(`[npm:setConfig] 设置命令执行完成`, setResult)
      
      // 3. 等待一下让配置生效
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 4. 验证设置
      console.log(`[npm:setConfig] 验证配置...`)
      const { stdout } = await execAsync(`npm config get ${key}`)
      const actualValue = stdout.trim()
      console.log(`[npm:setConfig] 当前值: ${actualValue}`)
      
      // 5. 再检查各个级别的配置
      try {
        const { stdout: userValue } = await execAsync(`npm config get ${key} --location=user`)
        console.log(`[npm:setConfig] user 级别: ${userValue.trim()}`)
      } catch {}
      
      try {
        const { stdout: globalValue } = await execAsync(`npm config get ${key} --location=global`)
        console.log(`[npm:setConfig] global 级别: ${globalValue.trim()}`)
      } catch {}
      
      const expectedValue = value.replace(/\/$/, '')
      const actualValueClean = actualValue.replace(/\/$/, '')
      
      if (actualValueClean === expectedValue) {
        console.log(`[npm:setConfig] ✅ 设置成功！`)
        return {
          success: true,
          message: `${key} 设置成功`,
          value: actualValue
        }
      } else {
        console.error(`[npm:setConfig] ❌ 验证失败：期望 ${expectedValue}，实际 ${actualValue}`)
        return {
          success: false,
          message: `验证失败：期望 ${expectedValue}，实际 ${actualValue}`
        }
      }
    } catch (error: any) {
      console.error('[npm:setConfig] ❌ 错误:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * 清除 npm 相关的环境变量（仅清除进程环境变量，不影响系统环境变量）
   * 注意：这只在当前 Electron 进程中生效，不会永久清除系统环境变量
   */
  ipcMain.handle('npm:clearEnvVars', async () => {
    try {
      const envVarsToCheck = [
        'npm_config_cache',
        'npm_config_prefix',
        'npm_config_registry',
        'NPM_CONFIG_CACHE',
        'NPM_CONFIG_PREFIX',
        'NPM_CONFIG_REGISTRY'
      ]
      
      const cleared: string[] = []
      const found: string[] = []
      
      // 检查并记录存在的环境变量
      for (const envVar of envVarsToCheck) {
        if (process.env[envVar]) {
          found.push(`${envVar}=${process.env[envVar]}`)
        }
      }
      
      if (found.length === 0) {
        return {
          success: true,
          message: '未检测到需要清除的环境变量',
          cleared: []
        }
      }
      
      return {
        success: false,
        needsManualClear: true,
        message: '检测到以下环境变量覆盖了配置，需要手动清除系统环境变量：',
        envVars: found
      }
    } catch (error: any) {
      console.error('[npm:clearEnvVars] 错误:', error)
      return { success: false, message: error.message }
    }
  })
}

