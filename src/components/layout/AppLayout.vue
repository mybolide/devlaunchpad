<script setup lang="ts">
import { computed } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import TitleBar from './TitleBar.vue'
import Sidebar from './Sidebar.vue'

const appStore = useAppStore()

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? 64 : 200)
</script>

<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <title-bar />
    
    <!-- 主布局 -->
    <n-layout style="height: calc(100vh - 40px); margin-top: 40px" has-sider>
      <!-- 侧边栏 -->
      <n-layout-sider
        :width="sidebarWidth"
        :collapsed-width="64"
        :collapsed="appStore.sidebarCollapsed"
        collapse-mode="width"
        bordered
      >
        <sidebar />
      </n-layout-sider>
      
      <!-- 主内容区 -->
      <n-layout-content content-style="padding: 24px; overflow-y: auto;">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

