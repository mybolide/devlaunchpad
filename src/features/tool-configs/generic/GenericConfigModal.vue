<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NCard, NSpin, NTabs, NTabPane, NForm, NSpace, NButton } from 'naive-ui'
import { RegistrySelector, ProxyConfig, CacheManager } from '../shared/components'
import { useToolConfig } from '../shared/composables'
import type { Mirror } from '../types'

interface Props {
  show: boolean
  toolName: string
  toolInfo?: any
  mirrors?: Mirror[]
  globalProxyUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  toolInfo: null,
  mirrors: () => [],
  globalProxyUrl: ''
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: []
}>()

// 使用共享的配置管理
const { form, activeTab, saving, getSaveData } = useToolConfig(props.toolName)

// 计算属性
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// 保存配置
function handleSave() {
  emit('save')
}
</script>

<template>
  <n-modal
    v-model:show="visible"
    :title="`${toolName} 配置`"
    style="width: 700px"
    :mask-closable="!saving"
    :closable="!saving"
  >
    <n-card :bordered="false">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <!-- 镜像源配置 -->
        <n-tab-pane name="registry" tab="📦 镜像源">
          <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
            <RegistrySelector
              v-model="form.registry"
              :mirrors="mirrors"
            />
          </n-form>
        </n-tab-pane>

        <!-- 代理配置 -->
        <n-tab-pane name="proxy" tab="🌐 代理">
          <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
            <ProxyConfig
              v-model="form.proxyType"
              v-model:custom-proxy="form.customProxy"
              :global-proxy-url="globalProxyUrl"
            />
          </n-form>
        </n-tab-pane>

        <!-- 缓存配置 -->
        <n-tab-pane name="cache" tab="💾 缓存">
          <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
            <CacheManager
              v-model="form.cacheDir"
            />
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <template #footer>
        <n-space justify="end">
          <n-button
            type="primary"
            :loading="saving"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? '保存中...' : '保存配置' }}
          </n-button>
          <n-button
            :disabled="saving"
            @click="visible = false"
          >
            关闭
          </n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

