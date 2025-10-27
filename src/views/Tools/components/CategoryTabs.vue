<script setup lang="ts">
import { NTabs, NTabPane, NSpin, NButton } from 'naive-ui'
import ToolsTable from './ToolsTable.vue'
import type { ToolInfo } from '@/types'

interface Props {
  categories: any[]
  currentTab: string
  loadedCategories: Set<string>
  loadingCategory: string
  showScrollArrows: boolean
  currentCategoryTools: ToolInfo[]
}

defineProps<Props>()

const emit = defineEmits<{
  tabChange: [tabName: string]
  openConfig: [toolName: string]
  scrollTabs: [direction: 'left' | 'right', event?: MouseEvent]
  dragStart: [event: DragEvent, index: number]
  dragOver: [event: DragEvent]
  drop: [event: DragEvent, index: number]
}>()
</script>

<template>
  <div class="tools-container">
    <!-- 滚动箭头（右上角，仅在需要时显示） -->
    <div v-if="showScrollArrows" class="scroll-arrows">
      <n-button 
        size="small" 
        quaternary
        title="向左滚动"
        @click="(e: any) => emit('scrollTabs', 'left', e)"
      >
        <template #icon>
          <span style="font-size: 18px; font-weight: bold">‹</span>
        </template>
      </n-button>
      <n-button 
        size="small" 
        quaternary
        title="向右滚动"
        @click="(e: any) => emit('scrollTabs', 'right', e)"
      >
        <template #icon>
          <span style="font-size: 18px; font-weight: bold">›</span>
        </template>
      </n-button>
    </div>

    <!-- Tabs -->
    <n-tabs 
      :value="currentTab"
      type="line" 
      size="large" 
      animated
      @update:value="(tab) => emit('tabChange', tab)"
    >
      <n-tab-pane
        v-for="(category, index) in categories"
        :key="category.name"
        :name="category.name"
      >
        <template #tab>
          <div
            class="draggable-tab"
            draggable="true"
            @dragstart="emit('dragStart', $event, index)"
            @dragover="emit('dragOver', $event)"
            @drop="emit('drop', $event, index)"
          >
            {{ category.icon }} {{ category.display_name }}
          </div>
        </template>

        <!-- 分类加载状态 -->
        <n-spin 
          :show="loadingCategory === category.name" 
          description="检测工具状态中..."
          style="min-height: 200px"
        >
          <!-- 工具表格 -->
          <ToolsTable
            v-if="loadedCategories.has(category.name)"
            :tools="currentCategoryTools"
            @open-config="emit('openConfig', $event)"
          />
        </n-spin>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.tools-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 滚动箭头（右上角） */
.scroll-arrows {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 4px;
  z-index: 100;
  background: white;
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Tabs 容器滚动 */
.tools-container :deep(.n-tabs-nav) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-behavior: smooth !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 100px !important;
}

.tools-container :deep(.n-tabs-nav::-webkit-scrollbar) {
  display: none;
}

.tools-container :deep(.n-tabs-nav-scroll-wrapper) {
  overflow: visible !important;
  max-width: none !important;
}

.tools-container :deep(.n-tabs-nav__prefix),
.tools-container :deep(.n-tabs-nav__suffix) {
  flex-shrink: 0 !important;
}

.tools-container :deep(.n-tabs-nav-scroll-content) {
  display: flex !important;
  gap: 4px;
  width: auto !important;
  flex-wrap: nowrap !important;
}

.tools-container :deep(.n-tabs-tab) {
  padding: 8px 20px;
  min-width: 120px !important;
  justify-content: center;
  flex-shrink: 0 !important;
  white-space: nowrap !important;
}

/* 拖拽样式 */
.draggable-tab {
  cursor: move;
  user-select: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.draggable-tab:hover {
  background: rgba(59, 130, 246, 0.05);
}

.draggable-tab:active {
  cursor: grabbing;
  opacity: 0.7;
}

/* 表格自适应 */
.tools-container :deep(.n-data-table) {
  width: 100%;
}

.tools-container :deep(.n-data-table-th),
.tools-container :deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>


