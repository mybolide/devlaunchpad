<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NRadioGroup, NRadioButton, NSwitch, NForm, NFormItem, NInput, NInputNumber, NButton, NText, useMessage } from 'naive-ui'
import { useAppStore } from '../stores/app'

const message = useMessage()
const appStore = useAppStore()

const theme = ref<'light' | 'dark' | 'auto'>('auto')
const platform = ref('Windows')
const nodeVersion = ref('v18.0.0')

// 代理配置
const proxyConfig = ref({
  enabled: false,
  protocol: 'http' as 'http' | 'https' | 'socks5',
  host: '127.0.0.1',
  port: 10808
})

function updateTheme(value: 'light' | 'dark' | 'auto') {
  theme.value = value
  message.success('主题已切换')
}

function getProxyUrl() {
  if (!proxyConfig.value.enabled) return ''
  return `${proxyConfig.value.protocol}://${proxyConfig.value.host}:${proxyConfig.value.port}`
}

function saveProxyConfig() {
  // TODO: 保存到应用配置
  localStorage.setItem('globalProxy', JSON.stringify(proxyConfig.value))
  message.success('代理配置已保存')
}

function loadProxyConfig() {
  const saved = localStorage.getItem('globalProxy')
  if (saved) {
    try {
      proxyConfig.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载代理配置失败', e)
    }
  }
}

onMounted(() => {
  // 获取系统信息
  if (window.electronAPI) {
    platform.value = window.electronAPI.platform === 'darwin' ? 'macOS' : 
                     window.electronAPI.platform === 'win32' ? 'Windows' : 
                     'Linux'
    nodeVersion.value = window.electronAPI.versions.node || 'unknown'
  }
  
  // 加载代理配置
  loadProxyConfig()
})
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>⚙️ 设置</h1>
      <p class="subtitle">应用偏好设置</p>
    </div>

    <div class="settings-container">
      <!-- 代理设置 -->
      <n-card title="🌐 代理设置" class="setting-section">
        <div class="setting-item">
          <div class="setting-label">
            <span>启用全局代理</span>
            <p class="setting-desc">启用后，工具可以选择使用此代理</p>
          </div>
          <n-switch v-model:value="proxyConfig.enabled" />
        </div>
        
        <div v-if="proxyConfig.enabled" style="margin-top: 16px; padding-left: 16px; border-left: 3px solid #3B82F6;">
          <n-form label-placement="left" label-width="100px">
            <n-form-item label="协议类型">
              <n-radio-group v-model:value="proxyConfig.protocol">
                <n-radio-button value="http">HTTP</n-radio-button>
                <n-radio-button value="https">HTTPS</n-radio-button>
                <n-radio-button value="socks5">SOCKS5</n-radio-button>
              </n-radio-group>
            </n-form-item>
            
            <n-form-item label="地址">
              <n-input v-model:value="proxyConfig.host" placeholder="127.0.0.1" />
            </n-form-item>
            
            <n-form-item label="端口">
              <n-input-number v-model:value="proxyConfig.port" placeholder="10808" :min="1" :max="65535" style="width: 100%" />
            </n-form-item>
            
            <n-form-item>
              <n-button type="primary" @click="saveProxyConfig">保存代理配置</n-button>
              <n-text style="margin-left: 12px; color: #999; font-size: 12px;">
                完整地址: {{ getProxyUrl() }}
              </n-text>
            </n-form-item>
          </n-form>
        </div>
      </n-card>

      <!-- 通用设置 -->
      <n-card title="🎨 界面" class="setting-section">
        <div class="setting-item">
          <div class="setting-label">
            <span>主题</span>
            <p class="setting-desc">选择应用主题风格</p>
          </div>
          <n-radio-group v-model:value="theme" @update:value="updateTheme">
            <n-radio-button value="light">浅色</n-radio-button>
            <n-radio-button value="dark">深色</n-radio-button>
            <n-radio-button value="auto">自动</n-radio-button>
          </n-radio-group>
        </div>
      </n-card>

      <!-- 关于 -->
      <n-card title="ℹ️ 关于" class="setting-section">
        <div class="about-info">
          <div class="info-item">
            <span class="label">应用名称</span>
            <span class="value">天闲 | DevLaunchpad</span>
          </div>
          <div class="info-item">
            <span class="label">版本</span>
            <span class="value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="label">平台</span>
            <span class="value">{{ platform }}</span>
          </div>
          <div class="info-item">
            <span class="label">Node 版本</span>
            <span class="value">{{ nodeVersion }}</span>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 24px;
  max-width: 800px;
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

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-section {
  margin-top: 0 !important;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label span {
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-item .label {
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
}
</style>


