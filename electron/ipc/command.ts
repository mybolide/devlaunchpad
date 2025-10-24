/**
 * 命令执行相关 IPC 处理
 */
import { ipcMain } from 'electron'

export function registerCommandHandlers() {
  /**
   * 执行系统命令
   */
  ipcMain.handle('command:execute', async (event, command: string) => {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      const { stdout, stderr } = await execAsync(command)
      return {
        success: !stderr,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      }
    } catch (error: any) {
      return {
        success: false,
        stdout: '',
        stderr: error.message
      }
    }
  })
}

