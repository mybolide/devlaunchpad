<script setup lang="ts">
import { NFormItem, NInput, NDivider, NSpin, NCard, NSpace, NText, NButton } from 'naive-ui'
import type { CacheInfo } from '../../types'

interface Props {
  modelValue: string              // 缓存目录路径
  cacheInfo?: CacheInfo | null    // 缓存信息
  loading?: boolean               // 加载状态
}

const props = withDefaults(defineProps<Props>(), {
  cacheInfo: null,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clean': []           // 清理缓存
  'refresh': []         // 刷新信息
}>()
</script>

<template>
  <div class="cache-manager">
    <n-form-item label="缓存目录">
      <n-input
        :value="modelValue"
        type="text"
        placeholder="例如：C:\npm-cache"
        @update:value="emit('update:modelValue', $event)"
      />
    </n-form-item>

    <n-divider style="margin: 12px 0" />
    
    <n-spin :show="loading">
      <n-space vertical style="width: 100%">
        <!-- 缓存信息卡片 -->
        <n-card
          v-if="cacheInfo"
          :bordered="false"
          size="small"
          style="background: #f5f5f5"
        >
          <n-space vertical>
            <n-space align="center">
              <n-text strong>当前路径：</n-text>
              <n-text code>{{ cacheInfo.cachePath }}</n-text>
            </n-space>
            <n-space align="center">
              <n-text strong>占用空间：</n-text>
              <n-text type="info" strong style="font-size: 18px">
                {{ cacheInfo.sizeFormatted }}
              </n-text>
            </n-space>
          </n-space>
        </n-card>

        <!-- 操作按钮 -->
        <n-space>
          <n-button
            type="warning"
            :loading="loading"
            @click="emit('clean')"
          >
            清理并校验缓存
          </n-button>
          <n-button
            :loading="loading"
            @click="emit('refresh')"
          >
            刷新信息
          </n-button>
        </n-space>

        <!-- 提示信息 -->
        <slot name="hint">
          <n-text depth="3" style="font-size: 12px">
            ⚠️ 清理缓存会清空所有缓存文件
          </n-text>
        </slot>
      </n-space>
    </n-spin>
  </div>
</template>

<style scoped>
.cache-manager {
  width: 100%;
}
</style>

