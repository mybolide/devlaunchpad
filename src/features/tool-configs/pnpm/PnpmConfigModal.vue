<script setup lang="ts">
/**
 * pnpm 配置弹窗
 * 目前复用通用配置组件，未来可以根据需要添加 pnpm 特有功能
 */
import GenericConfigModal from '../generic/GenericConfigModal.vue'

interface Props {
  show: boolean
  toolInfo?: any
  mirrors?: any[]
  globalProxyUrl?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: []
}>()
</script>

<template>
  <GenericConfigModal
    :show="show"
    tool-name="pnpm"
    :tool-info="toolInfo"
    :mirrors="mirrors"
    :global-proxy-url="globalProxyUrl"
    @update:show="emit('update:show', $event)"
    @save="emit('save')"
  />
</template>

