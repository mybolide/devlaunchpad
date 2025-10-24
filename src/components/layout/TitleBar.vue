<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { Remove, Square, Close } from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const isDragging = ref(false)

/**
 * 最小化窗口
 */
async function minimize() {
  if (window.electronAPI) {
    await window.electronAPI.window.minimize()
  }
}

/**
 * 最大化/还原窗口
 */
async function maximize() {
  if (window.electronAPI) {
    const isMax = await window.electronAPI.window.maximize()
    appStore.setMaximized(isMax)
  }
}

/**
 * 关闭窗口
 */
async function close() {
  if (window.electronAPI) {
    await window.electronAPI.window.close()
  }
}
</script>

<template>
  <div class="title-bar">
    <!-- Logo 和应用名 -->
    <div class="title-bar-left" @mousedown="isDragging = true" @mouseup="isDragging = false">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#gradient1)" />
          <rect x="13" y="2" width="9" height="9" rx="2" fill="url(#gradient2)" />
          <rect x="2" y="13" width="9" height="9" rx="2" fill="url(#gradient3)" />
          <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#gradient4)" />
          <defs>
            <linearGradient id="gradient1" x1="2" y1="2" x2="11" y2="11" gradientUnits="userSpaceOnUse">
              <stop stop-color="#2563EB" />
              <stop offset="1" stop-color="#3B82F6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="13" y1="2" x2="22" y2="11" gradientUnits="userSpaceOnUse">
              <stop stop-color="#3B82F6" />
              <stop offset="1" stop-color="#60A5FA" />
            </linearGradient>
            <linearGradient id="gradient3" x1="2" y1="13" x2="11" y2="22" gradientUnits="userSpaceOnUse">
              <stop stop-color="#1E40AF" />
              <stop offset="1" stop-color="#2563EB" />
            </linearGradient>
            <linearGradient id="gradient4" x1="13" y1="13" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stop-color="#60A5FA" />
              <stop offset="1" stop-color="#93C5FD" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span class="app-name">天闲 | DevLaunchpad</span>
    </div>
    
    <!-- 窗口控制按钮 -->
    <div class="title-bar-controls">
      <n-button text class="control-btn" @click="minimize">
        <n-icon size="16"><Remove /></n-icon>
      </n-button>
      <n-button text class="control-btn" @click="maximize">
        <n-icon size="14"><Square /></n-icon>
      </n-button>
      <n-button text class="control-btn close-btn" @click="close">
        <n-icon size="16"><Close /></n-icon>
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  color: white;
  z-index: 1000;
  -webkit-app-region: drag;
  user-select: none;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.title-bar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 46px;
  height: 40px;
  border-radius: 0;
  color: white;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  background-color: #ef4444;
}
</style>


