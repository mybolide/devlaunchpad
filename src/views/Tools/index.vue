<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import CategoryTabs from './components/CategoryTabs.vue'
import { NpmConfigModal } from '@/features/tool-configs/npm'
import { YarnConfigModal } from '@/features/tool-configs/yarn'
import { useToolsData } from './composables/useToolsData'
import { useCategoryManagement } from './composables/useCategoryManagement'
import { useNpmHandlers } from './composables/useNpmHandlers'
import { useYarnHandlers } from './composables/useYarnHandlers'
import { getGlobalProxyUrl } from './utils/formatters'

// 工具数据管理
const {
  tools,
  selectedTool,
  showConfigModal,
  availableMirrors,
  toolCategoryMap,
  openToolConfig,
  refreshToolInfo
} = useToolsData()

// 分类管理
const {
  categories,
  currentTab,
  loadedCategories,
  loadingCategory,
  showScrollArrows,
  currentCategoryTools,
  initCategories,
  onTabChange,
  checkScrollable,
  scrollTabs,
  onDragStart,
  onDragOver,
  onDrop
} = useCategoryManagement(tools, toolCategoryMap)

// npm 专用处理
const {
  npmModalRef,
  npmCacheInfo,
  npmCacheLoading,
  npmStatus,
  loadNpmCacheInfo,
  cleanNpmCache,
  getNpmStatus,
  clearAllGlobalConfig,
  handleNpmSave
} = useNpmHandlers(refreshToolInfo)

// yarn 专用处理
const {
  yarnModalRef,
  yarnCacheInfo,
  yarnCacheLoading,
  yarnStatus,
  loadYarnCacheInfo,
  cleanYarnCache,
  getYarnStatus,
  handleYarnSave
} = useYarnHandlers(refreshToolInfo)

// 初始化
onMounted(() => {
  initCategories()
  window.addEventListener('resize', checkScrollable)
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', checkScrollable)
})
</script>

<template>
  <div class="tools-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🛠️ 工具配置</h1>
      <p class="subtitle">管理开发工具的代理和配置</p>
    </div>

    <!-- 分类标签和工具表格 -->
    <CategoryTabs
      v-if="categories.length > 0"
      :categories="categories"
      :current-tab="currentTab"
      :loaded-categories="loadedCategories"
      :loading-category="loadingCategory"
      :show-scroll-arrows="showScrollArrows"
      :current-category-tools="currentCategoryTools"
      @tab-change="onTabChange"
      @open-config="openToolConfig"
      @scroll-tabs="scrollTabs"
      @drag-start="onDragStart"
      @drag-over="onDragOver"
      @drop="onDrop"
    />

    <!-- npm 配置弹窗 -->
    <NpmConfigModal
      v-if="selectedTool === 'npm'"
      ref="npmModalRef"
      v-model:show="showConfigModal"
      :tool-info="tools.find(t => t.name === selectedTool)"
      :mirrors="availableMirrors"
      :global-proxy-url="getGlobalProxyUrl()"
      :npm-status="npmStatus"
      :cache-info="npmCacheInfo"
      :cache-loading="npmCacheLoading"
      @save="handleNpmSave"
      @clear-global-config="clearAllGlobalConfig"
      @clean-cache="cleanNpmCache"
      @load-cache-info="loadNpmCacheInfo"
      @load-status="getNpmStatus"
    />

    <!-- yarn 配置弹窗 -->
    <YarnConfigModal
      v-if="selectedTool === 'yarn'"
      ref="yarnModalRef"
      v-model:show="showConfigModal"
      :tool-info="tools.find(t => t.name === selectedTool)"
      :mirrors="availableMirrors"
      :global-proxy-url="getGlobalProxyUrl()"
      :cache-info="yarnCacheInfo"
      :cache-loading="yarnCacheLoading"
      @save="handleYarnSave"
      @clean-cache="cleanYarnCache"
      @load-cache-info="loadYarnCacheInfo"
      @load-status="getYarnStatus"
    />
  </div>
</template>

<style scoped>
.tools-page {
  padding: 24px;
  max-width: 100%;
  margin: 0 auto;
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
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
</style>

