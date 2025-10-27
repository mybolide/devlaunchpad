<script setup lang="ts">
import { ref, watch } from 'vue'
import { NFormItem, NSelect, NInput, NButton, NSpace, NCard, NTag, NText } from 'naive-ui'
import type { Mirror, PingResult } from '../../types'

interface Props {
  mirrors: Mirror[]           // 可用镜像源列表
  modelValue: string          // 当前镜像源 URL
  loading?: boolean           // 测速加载状态
  pingResult?: PingResult | null  // 测速结果
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pingResult: null
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'test': [url: string]
}>()

const selectedMirror = ref<string>('')
const registryUrl = ref<string>(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  registryUrl.value = newVal
  // 反向查找对应的镜像源
  const mirror = props.mirrors.find(m => m.url === newVal)
  selectedMirror.value = mirror?.name || ''
}, { immediate: true })

// 镜像源改变
function handleMirrorChange(mirrorName: string) {
  const mirror = props.mirrors.find(m => m.name === mirrorName)
  if (mirror) {
    registryUrl.value = mirror.url
    emit('update:modelValue', mirror.url)
  }
}

// 手动输入
function handleManualInput(value: string) {
  selectedMirror.value = ''
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="registry-selector">
    <n-form-item label="选择镜像源">
      <n-select
        v-model:value="selectedMirror"
        :options="mirrors.map(m => ({
          label: `${m.displayName} ${m.location ? `(${m.location})` : ''}`,
          value: m.name
        }))"
        placeholder="选择预设镜像源"
        clearable
        @update:value="handleMirrorChange"
      />
    </n-form-item>

    <n-form-item label="自定义 URL">
      <n-space style="width: 100%" size="small">
        <n-input
          :value="registryUrl"
          type="text"
          placeholder="或手动输入镜像源地址"
          style="flex: 1"
          @update:value="handleManualInput"
        />
        <n-button
          :loading="loading"
          :disabled="!registryUrl"
          @click="emit('test', registryUrl)"
        >
          测速
        </n-button>
      </n-space>
    </n-form-item>

    <!-- 测速结果 -->
    <n-form-item v-if="pingResult" label="测试结果">
      <n-card :bordered="false" size="small" style="background: #f5f5f5; width: 100%">
        <n-space align="center">
          <n-tag :type="pingResult.success ? 'success' : 'error'" size="small">
            {{ pingResult.success ? '✓ 连接成功' : '✗ 连接失败' }}
          </n-tag>
          <n-text v-if="pingResult.success" strong>
            响应时间：{{ pingResult.duration }}ms
          </n-text>
          <n-text v-else depth="3" style="font-size: 12px">
            {{ pingResult.message }}
          </n-text>
        </n-space>
      </n-card>
    </n-form-item>
  </div>
</template>

<style scoped>
.registry-selector {
  width: 100%;
}
</style>


