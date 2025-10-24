<template>
  <div class="about">
    <n-space vertical :size="20" align="center">
      <h1>关于</h1>
      <n-card title="天闲 | DevLaunchpad" style="max-width: 600px">
        <template #header-extra>
          <n-tag type="success">v1.0.0</n-tag>
        </template>
        <n-space vertical>
          <n-text>开发者工具配置管理器</n-text>
          <n-text>作者：小墨</n-text>
          <n-text>让开发环境配置变得简单</n-text>
        </n-space>
      </n-card>
      <n-button type="primary" @click="goHome">返回首页</n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NSpace, NButton, NCard, NTag, NText } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.about {
  text-align: center;
  margin-top: 100px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #10B981;
  font-size: 48px;
  margin: 0;
}
</style>

