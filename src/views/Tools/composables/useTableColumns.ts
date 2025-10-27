/**
 * 工具表格列定义
 */
import { h } from 'vue'
import { NTag, NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { ToolInfo } from '../../../types'
import { extractVersion, truncateText } from '../utils/formatters'

export function useTableColumns(openToolConfig: (toolName: string) => void) {
  const columns: DataTableColumns<ToolInfo> = [
    {
      title: '工具',
      key: 'displayName',
      minWidth: 100,
      ellipsis: {
        tooltip: true
      },
      render: (row) => h('span', { style: { fontWeight: '500' } }, row.displayName)
    },
    {
      title: '版本',
      key: 'version',
      minWidth: 120,
      ellipsis: {
        tooltip: true
      },
      render: (row) => {
        if (row.status !== 'installed' || !row.version) {
          return h('span', { style: { color: '#999' } }, '-')
        }
        const version = extractVersion(row.version)
        const fullVersion = row.version || ''
        return h('span', { 
          style: { 
            fontFamily: 'monospace', 
            fontSize: '12px',
            cursor: 'help'
          },
          title: fullVersion !== version ? fullVersion : undefined
        }, version)
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row) => {
        if (row.status === 'installed') {
          return h(NTag, { type: 'success', size: 'small', round: true }, { default: () => '✓ 已安装' })
        }
        return h(NTag, { type: 'error', size: 'small', round: true }, { default: () => '✗ 未安装' })
      }
    },
    {
      title: '当前配置',
      key: 'config',
      minWidth: 300,
      render: (row) => {
        if (row.status !== 'installed') {
          return h('span', { style: { color: '#999' } }, '-')
        }
        
        const configs = []
        
        // 显示镜像源
        if (row.registryUrl) {
          configs.push(h('div', { 
            style: { fontSize: '12px', marginBottom: '4px' },
            title: row.registryUrl
          }, [
            h('span', { style: { color: '#666', marginRight: '4px' } }, '镜像:'),
            h('code', { 
              style: { 
                color: '#2563eb', 
                background: '#f0f4ff',
                padding: '2px 4px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'help'
              }
            }, truncateText(row.registryUrl || '', 50))
          ]))
        }
        
        // 显示代理
        if (row.proxyEnabled && row.currentProxy) {
          configs.push(h('div', { 
            style: { fontSize: '12px', marginBottom: '4px' },
            title: row.currentProxy
          }, [
            h('span', { style: { color: '#666', marginRight: '4px' } }, '代理:'),
            h('code', { 
              style: { 
                color: '#16a34a', 
                background: '#f0fdf4',
                padding: '2px 4px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'help'
              }
            }, truncateText(row.currentProxy, 40))
          ]))
        }
        
        // 显示缓存目录
        if (row.cacheDir) {
          configs.push(h('div', { 
            style: { fontSize: '12px' },
            title: row.cacheDir
          }, [
            h('span', { style: { color: '#666', marginRight: '4px' } }, '缓存:'),
            h('code', { 
              style: { 
                color: '#666',
                background: '#f5f5f5',
                padding: '2px 4px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'help'
              }
            }, truncateText(row.cacheDir, 40))
          ]))
        }
        
        if (configs.length === 0) {
          return h('span', { style: { color: '#999', fontSize: '12px' } }, '未配置')
        }
        
        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, configs)
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (row) => {
        if (row.status !== 'installed') {
          return h('span', { style: { color: '#999' } }, '-')
        }
        
        return h(NButton, {
          size: 'small',
          secondary: true,
          onClick: () => openToolConfig(row.name)
        }, { default: () => '配置' })
      }
    }
  ]

  return { columns }
}

