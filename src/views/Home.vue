<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">👋 欢迎使用天闲</h1>
        <p class="welcome-subtitle">开发者工具配置管理器 - 让开发更高效</p>
      </div>
    </div>

    <!-- 快速操作卡片 -->
    <div class="quick-actions">
      <n-grid :cols="3" :x-gap="20" :y-gap="20">
        <n-gi>
          <n-card 
            class="action-card" 
            hoverable 
            @click="goToTools"
          >
            <div class="card-content">
              <div class="card-icon">🔧</div>
              <h3 class="card-title">工具管理</h3>
              <p class="card-desc">检测和管理开发工具</p>
            </div>
          </n-card>
        </n-gi>
        
        <n-gi>
          <n-card 
            class="action-card" 
            hoverable 
            @click="goToSoftware"
          >
            <div class="card-content">
              <div class="card-icon">📦</div>
              <h3 class="card-title">软件商店</h3>
              <p class="card-desc">浏览和安装常用软件</p>
            </div>
          </n-card>
        </n-gi>
        
        <n-gi>
          <n-card 
            class="action-card" 
            hoverable 
            @click="goToSettings"
          >
            <div class="card-content">
              <div class="card-icon">⚙️</div>
              <h3 class="card-title">系统设置</h3>
              <p class="card-desc">配置应用和代理设置</p>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <!-- 功能特性 -->
    <div class="features-section">
      <h2 class="section-title">✨ 核心功能</h2>
      <n-grid :cols="2" :x-gap="20" :y-gap="20">
        <n-gi>
          <div class="feature-item">
            <div class="feature-icon">🚀</div>
            <div class="feature-content">
              <h4>一键配置</h4>
              <p>快速配置 Git、npm、pip 等工具的代理设置</p>
            </div>
          </div>
        </n-gi>
        
        <n-gi>
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div class="feature-content">
              <h4>智能检测</h4>
              <p>自动检测已安装的开发工具和版本信息</p>
            </div>
          </div>
        </n-gi>
        
        <n-gi>
          <div class="feature-item">
            <div class="feature-icon">🌐</div>
            <div class="feature-content">
              <h4>镜像源管理</h4>
              <p>轻松切换各种工具的镜像源，提升下载速度</p>
            </div>
          </div>
        </n-gi>
        
        <n-gi>
          <div class="feature-item">
            <div class="feature-icon">💾</div>
            <div class="feature-content">
              <h4>配置备份</h4>
              <p>保存和恢复工具配置，多设备同步</p>
            </div>
          </div>
        </n-gi>
      </n-grid>
    </div>

    <!-- 页脚信息 -->
    <div class="footer-info">
      <n-space vertical align="center" :size="8">
        <n-text depth="3">{{ appStore.appName }} v1.0.0</n-text>
        <n-text depth="3">作者：{{ appStore.author }}</n-text>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGi, NSpace, NText } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const goToTools = () => {
  router.push('/tools')
}

const goToSoftware = () => {
  router.push('/software')
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<style scoped>
.home-container {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-content {
  text-align: center;
  color: white;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.95;
}

/* 快速操作卡片 */
.quick-actions {
  margin-bottom: 40px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-content {
  text-align: center;
  padding: 20px 10px;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.card-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 功能特性 */
.features-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: #f0f1f3;
}

.feature-icon {
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
}

.feature-content h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #333;
}

.feature-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* 页脚信息 */
.footer-info {
  padding: 20px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 20px;
}
</style>
