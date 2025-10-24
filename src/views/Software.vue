<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui'
</script>

<template>
  <div class="software-page">
    <div class="page-header">
      <h1>📦 软件管理</h1>
      <p class="subtitle">搜索和管理开发工具</p>
    </div>

    <n-card class="coming-soon">
      <n-empty description="功能开发中...">
        <template #extra>
          <div class="features-list">
            <p>即将支持：</p>
            <ul>
              <li>从 Scoop 搜索软件</li>
              <li>一键安装和卸载</li>
              <li>软件列表管理</li>
              <li>配置导入/导出</li>
            </ul>
          </div>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<style scoped>
.software-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.coming-soon {
  margin-top: 24px;
}

.features-list p {
  color: #666;
  margin-bottom: 8px;
}

.features-list ul {
  text-align: left;
  color: #666;
  margin-top: 8px;
}
</style>


