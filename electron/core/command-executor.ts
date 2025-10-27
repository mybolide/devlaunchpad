/**
 * 命令执行器
 * 负责执行系统命令并捕获输出
 */

import { execFile } from 'child_process'
import type { CommandResult } from '../../src/types/index'

export class CommandExecutor {
  private defaultTimeout: number
  private runningCommands: Map<string, NodeJS.Timeout>

  constructor(defaultTimeout: number = 10000) {
    this.defaultTimeout = defaultTimeout
    this.runningCommands = new Map()
    console.log(`[CommandExecutor] 初始化，默认超时: ${defaultTimeout}ms`)
  }

  /**
   * 同步执行命令（实际上是 Promise 包装的异步执行）
   * 【性能优化】避免不必要的环境变量拷贝
   */
  async execute(
    command: string[],
    timeout?: number,
    options?: { shell?: boolean; env?: Record<string, string> }
  ): Promise<CommandResult> {
    const cmd = command[0]
    const args = command.slice(1)
    const timeoutMs = timeout || this.defaultTimeout
    const commandStr = command.join(' ')

    console.log(`[CommandExecutor] 执行命令: ${commandStr}`)
    const startTime = Date.now()

    // 【性能优化】只在需要自定义环境变量时才合并
    const execEnv = options?.env 
      ? { ...process.env, ...options.env }  // 有自定义环境变量，合并
      : process.env  // 无自定义环境变量，直接使用（避免拷贝）

    return new Promise((resolve) => {
      try {
        const child = execFile(cmd, args, {
          timeout: timeoutMs,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
          shell: true, // Windows 需要 shell
          env: execEnv
        }, (error, stdout, stderr) => {
          const executionTime = Date.now() - startTime

          if (error && error.code === null && error.signal) {
            // 进程被杀死
            console.warn(`[CommandExecutor] 命令超时: ${commandStr}`)
            resolve({
              success: false,
              returnCode: -1,
              stdout: stdout || '',
              stderr: `命令执行超时（>${timeoutMs}ms）`,
              command: commandStr,
              executionTime
            })
            return
          }

          const returnCode = error?.code || 0
          const success = returnCode === 0

          if (success) {
            console.log(`[CommandExecutor] ✓ 命令执行成功: ${commandStr} (${executionTime}ms)`)
            console.log(`[CommandExecutor]   输出: ${stdout ? stdout.substring(0, 100) : '(无输出)'}`)
          } else {
            // 对于配置查询类命令，返回码 1 是正常的
            const isConfigQuery = commandStr.toLowerCase().includes('config')

            if (isConfigQuery && [1, 5].includes(returnCode)) {
              console.log(`[CommandExecutor] ℹ 配置查询返回空: ${commandStr}`)
            } else {
              console.warn(
                `[CommandExecutor] ✗ 命令执行失败: ${commandStr}\n` +
                `  返回码: ${returnCode}\n` +
                `  错误: ${(stderr || '').substring(0, 200)}`
              )
            }
          }

          resolve({
            success,
            returnCode,
            stdout: stdout || '',
            stderr: stderr || '',
            command: commandStr,
            executionTime
          })
        })
      } catch (error) {
        const executionTime = Date.now() - startTime
        console.error(`[CommandExecutor] 命令执行异常: ${commandStr}, 错误: ${error}`)

        resolve({
          success: false,
          returnCode: -3,
          stdout: '',
          stderr: String(error),
          command: commandStr,
          executionTime
        })
      }
    })
  }

  /**
   * 检查工具是否已安装
   */
  async checkToolInstalled(toolName: string): Promise<boolean> {
    const result = await this.execute([toolName, '--version'], 5000)
    return result.success
  }

  /**
   * 获取工具版本
   */
  async getToolVersion(toolName: string): Promise<string | null> {
    const result = await this.execute([toolName, '--version'], 5000)
    if (result.success) {
      const version = result.stdout.trim().split('\n')[0]
      return version
    }
    return null
  }
}

// 导出单例
export const commandExecutor = new CommandExecutor()
