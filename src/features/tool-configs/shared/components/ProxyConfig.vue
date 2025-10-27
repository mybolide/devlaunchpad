<script setup lang="ts">
import { NFormItem, NRadioGroup, NRadio, NInput } from 'naive-ui'
import type { ProxyType } from '../../types'

interface Props {
  modelValue: ProxyType
  customProxy: string
  globalProxyUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ProxyType]
  'update:customProxy': [value: string]
}>()
</script>

<template>
  <div class="proxy-config">
    <n-form-item label="代理设置">
      <n-radio-group
        :value="modelValue"
        @update:value="emit('update:modelValue', $event)"
      >
        <n-radio value="none">不使用代理</n-radio>
        <n-radio value="global">使用全局代理</n-radio>
        <n-radio value="custom">自定义代理</n-radio>
      </n-radio-group>
    </n-form-item>

    <n-form-item v-if="modelValue === 'global'" label="全局代理">
      <n-input
        :value="globalProxyUrl"
        readonly
        placeholder="请先在设置页面配置全局代理"
      />
    </n-form-item>

    <n-form-item v-if="modelValue === 'custom'" label="代理 URL">
      <n-input
        :value="customProxy"
        type="text"
        placeholder="例如：http://127.0.0.1:1080"
        @update:value="emit('update:customProxy', $event)"
      />
    </n-form-item>
  </div>
</template>

<style scoped>
.proxy-config {
  width: 100%;
}
</style>


