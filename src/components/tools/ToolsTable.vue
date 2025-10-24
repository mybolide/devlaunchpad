<template>
  <n-data-table
    :columns="columns"
    :data="tools"
    :bordered="false"
    :single-line="false"
  />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { ToolInfo } from '../../types'

// Props
const props = defineProps<{
  tools: ToolInfo[]
}>()

// Emits
const emit = defineEmits<{
  configure: [toolName: string]
  refresh: [toolName: string]
}>()

// 工具函数
function extractVersion(versionString: string): string {
  if (!versionString) return '-'
  const match = versionString.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/)
  if (match && match[1]) {
    return match[1]
  }
  return versionString.substring(0, 20)
}

function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 表格列定义
const columns: DataTableColumns<ToolInfo> = [
  {
    title: '工具',
    key: 'displayName',
    minWidth: 100,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { style: { fontWeight: '500' } }, row.displayName)
  },
  {
    title: '版本',
    key: 'version',
    minWidth: 120,
    ellipsis: { tooltip: true },
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
    minWidth: 90,
    render: (row) => {
      if (row.status === 'installed') {
        return h(NTag, { type: 'success', size: 'small' }, { default: () => '✓ 已安装' })
      } else if (row.status === 'not_installed') {
        return h(NTag, { type: 'default', size: 'small' }, { default: () => '未安装' })
      } else {
        return h(NTag, { type: 'warning', size: 'small' }, { default: () => '检测中...' })
      }
    }
  },
  {
    title: '镜像源',
    key: 'registry',
    minWidth: 150,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.registry || row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      return h('span', {
        style: { fontSize: '12px' },
        title: row.registry
      }, truncateText(row.registry, 30))
    }
  },
  {
    title: '代理',
    key: 'proxy',
    minWidth: 100,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.proxy || row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      return h('span', {
        style: { fontSize: '12px' },
        title: row.proxy
      }, truncateText(row.proxy, 15))
    }
  },
  {
    title: '缓存目录',
    key: 'cacheDir',
    minWidth: 150,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.cacheDir || row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      return h('span', {
        style: { fontSize: '12px' },
        title: row.cacheDir
      }, truncateText(row.cacheDir, 25))
    }
  },
  {
    title: '操作',
    key: 'actions',
    minWidth: 180,
    render: (row) => {
      if (row.status !== 'installed') {
        return h('span', { style: { color: '#999' } }, '-')
      }
      return h(NSpace, null, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => emit('configure', row.name)
          }, { default: () => '配置' }),
          h(NButton, {
            size: 'small',
            onClick: () => emit('refresh', row.name)
          }, { default: () => '刷新' })
        ]
      })
    }
  }
]
</script>

