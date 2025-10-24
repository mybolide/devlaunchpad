<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NProgress } from 'naive-ui'

const props = defineProps<{
  onFinish: () => void
}>()

const progress = ref(0)
const statusText = ref('正在启动...')

// 模拟加载进度
onMounted(() => {
  const stages = [
    { progress: 20, text: '初始化应用...' },
    { progress: 40, text: '加载组件...' },
    { progress: 60, text: '准备界面...' },
    { progress: 80, text: '即将完成...' },
    { progress: 100, text: '启动完成！' },
  ]

  let currentStage = 0
  
  const interval = setInterval(() => {
    if (currentStage < stages.length) {
      const stage = stages[currentStage]
      if (stage) {
        progress.value = stage.progress
        statusText.value = stage.text
      }
      currentStage++
    } else {
      clearInterval(interval)
      setTimeout(() => {
        props.onFinish()
      }, 300)
    }
  }, 400)
})
</script>

<template>
  <div class="splash-screen">
    <div class="splash-content">
      <!-- Logo -->
      <div class="logo">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
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
      
      <!-- 应用名 -->
      <h1 class="app-name">天闲</h1>
      <h2 class="app-name-en">DevLaunchpad</h2>
      <p class="app-subtitle">开发者工具配置管理器</p>
      
      <!-- 进度条 -->
      <div class="progress-container">
        <n-progress
          type="line"
          :percentage="progress"
          :show-indicator="false"
          :height="4"
          color="#3B82F6"
          rail-color="rgba(255, 255, 255, 0.2)"
        />
        <p class="status-text">{{ statusText }}</p>
      </div>
    </div>
    
    <!-- 背景动画 -->
    <div class="background-animation">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.splash-content {
  position: relative;
  z-index: 2;
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

.logo {
  animation: pulse 2s infinite;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.app-name {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
  letter-spacing: 2px;
}

.app-name-en {
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 16px;
  letter-spacing: 3px;
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 48px;
}

.progress-container {
  width: 300px;
  margin: 0 auto;
}

.status-text {
  margin-top: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  height: 20px;
}

/* 背景动画圆圈 */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  right: -100px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: -75px;
  animation-delay: 10s;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}
</style>


