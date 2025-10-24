<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  NConfigProvider, 
  NMessageProvider, 
  NDialogProvider, 
  NNotificationProvider 
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import AppLayout from '@/components/layout/AppLayout.vue'
import SplashScreen from '@/components/SplashScreen.vue'

const appStore = useAppStore()
const showSplash = ref(true)
const showApp = ref(false)

// 启动动画完成后显示主应用
function onSplashFinish() {
  showSplash.value = false
  setTimeout(() => {
    showApp.value = true
  }, 100)
}

// 监听窗口最大化状态变化
onMounted(async () => {
  if (window.electronAPI) {
    await window.electronAPI.window.isMaximized()
  }
})
</script>

<template>
  <div>
    <!-- 启动动画 -->
    <splash-screen v-if="showSplash" :on-finish="onSplashFinish" />
    
    <!-- 主应用 -->
    <n-config-provider v-if="showApp" :theme="null">
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <app-layout />
          </n-notification-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
