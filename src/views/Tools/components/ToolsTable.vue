<script setup lang="ts">
import { NDataTable } from 'naive-ui'
import type { ToolInfo } from '@/types'
import { useTableColumns } from '../composables/useTableColumns'

interface Props {
  tools: ToolInfo[]
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  openConfig: [toolName: string]
}>()

// 使用表格列定义
const { columns } = useTableColumns((toolName) => emit('openConfig', toolName))
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="tools"
    :bordered="false"
    :single-line="false"
    :loading="loading"
    style="margin-top: 16px"
  />
</template>

