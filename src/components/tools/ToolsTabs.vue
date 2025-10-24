<template>
  <div class="tools-container">
    <!-- 滚动箭头（右上角，仅在需要时显示） -->
    <div v-if="showScrollArrows" class="scroll-arrows">
      <n-button 
        size="small" 
        quaternary
        @click="(e: any) => scrollTabs('left', e)"
        title="向左滚动"
      >
        <template #icon>
          <span style="font-size: 18px; font-weight: bold">‹</span>
        </template>
      </n-button>
      <n-button 
        size="small" 
        quaternary
        @click="(e: any) => scrollTabs('right', e)"
        title="向右滚动"
      >
        <template #icon>
          <span style="font-size: 18px; font-weight: bold">›</span>
        </template>
      </n-button>
    </div>

    <!-- Tabs -->
    <n-tabs 
      v-model:value="currentTab" 
      type="line" 
      size="large" 
      animated
      @update:value="handleTabChange"
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
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event)"
            @drop="onDrop($event, index)"
          >
            {{ category.icon }} {{ category.display_name }}
          </div>
        </template>

        <slot :category="category" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()

// Props
const props = defineProps<{
  categories: any[]
  modelValue: string
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'tabChange': [tabName: string]
}>()

// 状态
const showScrollArrows = ref(false)
const currentTab = ref(props.modelValue)
let draggedCategoryIndex = -1

// 检测是否需要滚动箭头
function checkScrollable() {
  setTimeout(() => {
    const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
    
    if (tabsNav) {
      const needScroll = tabsNav.scrollWidth > tabsNav.clientWidth
      showScrollArrows.value = needScroll
    }
  }, 300)
}

// Tab 切换
function handleTabChange(tabName: string) {
  currentTab.value = tabName
  emit('update:modelValue', tabName)
  emit('tabChange', tabName)
}

// 左右滚动
function scrollTabs(direction: 'left' | 'right', event?: MouseEvent) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  const tabsNav = document.querySelector('.tools-container .n-tabs-nav') as HTMLElement
  if (!tabsNav) return
  
  tabsNav.style.overflowX = 'auto'
  tabsNav.style.maxWidth = '100%'
  
  const scrollAmount = 200
  const currentPos = tabsNav.scrollLeft
  const newPos = direction === 'left' 
    ? Math.max(0, currentPos - scrollAmount)
    : currentPos + scrollAmount
  
  tabsNav.scrollLeft = newPos
}

// 拖拽排序
function onDragStart(event: DragEvent, index: number) {
  draggedCategoryIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

async function onDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  
  if (draggedCategoryIndex === -1 || draggedCategoryIndex === targetIndex) {
    return
  }
  
  // 交换分类顺序
  const newCategories = [...props.categories]
  const [draggedItem] = newCategories.splice(draggedCategoryIndex, 1)
  newCategories.splice(targetIndex, 0, draggedItem)
  
  // 更新排序
  newCategories.forEach((cat, index) => {
    cat.sort_order = index
  })
  
  // TODO: 触发保存事件
  message.success('分类顺序已更新')
  draggedCategoryIndex = -1
}

// 生命周期
onMounted(() => {
  checkScrollable()
  window.addEventListener('resize', checkScrollable)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrollable)
})
</script>

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
</style>
