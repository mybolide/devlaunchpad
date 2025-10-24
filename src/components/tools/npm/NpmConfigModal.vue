<template>
  <n-modal
    v-model:show="visible"
    title="npm 配置"
    style="width: 700px"
    :mask-closable="!saving"
    :closable="!saving"
    :on-update:show="handleUpdateShow"
  >
    <n-card :bordered="false">
      <n-spin :show="loading" description="加载配置中...">
        <n-tabs v-model:value="activeTab" type="line" animated>
          <!-- 镜像源配置 -->
          <n-tab-pane name="registry" tab="📦 镜像源">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <!-- npm 配置状态提示 -->
              <n-alert 
                v-if="npmStatus?.hasGlobalConfig || Object.keys(npmStatus?.envVars || {}).length > 0"
                type="warning" 
                title="⚠️ 检测到配置问题"
                style="margin-bottom: 16px"
              >
                <n-space vertical size="small">
                  <template v-if="Object.keys(npmStatus?.envVars || {}).length > 0">
                    <n-text>检测到环境变量覆盖了配置：</n-text>
                    <n-space vertical size="small" style="margin-left: 12px">
                      <n-text
                        v-for="(value, key) in npmStatus.envVars"
                        :key="key"
                        depth="3"
                        style="font-size: 12px"
                      >
                        • {{ key }}: <n-text code>{{ value }}</n-text>
                      </n-text>
                    </n-space>
                    <n-text depth="3" style="font-size: 12px">
                      环境变量会覆盖配置文件，建议在系统中删除这些环境变量后重启应用。
                    </n-text>
                  </template>
                  <template v-if="npmStatus?.hasGlobalConfig">
                    <n-text>检测到 global 级别的配置，建议清空后使用 user 配置。</n-text>
                  </template>
                  <n-button size="small" type="error" @click="$emit('clearGlobalConfig')" style="margin-top: 8px">
                    🧹 一键清空 Global 配置
                  </n-button>
                </n-space>
              </n-alert>

              <n-form-item label="选择镜像源">
                <n-select
                  v-model:value="form.selectedMirror"
                  :options="mirrors.map(m => ({
                    label: `${m.displayName} ${m.location ? `(${m.location})` : ''}`,
                    value: m.name
                  }))"
                  placeholder="选择预设镜像源"
                  clearable
                  @update:value="handleMirrorChange"
                />
              </n-form-item>

              <n-form-item label="自定义 URL">
                <n-input
                  v-model:value="form.registry"
                  type="text"
                  placeholder="或手动输入镜像源地址"
                />
              </n-form-item>

              <!-- 测速功能 -->
              <n-form-item label="测试速度">
                <n-space vertical style="width: 100%">
                  <n-space>
                    <n-button
                      :loading="pingLoading"
                      :disabled="!form.registry"
                      @click="testRegistry(form.registry)"
                    >
                      测试当前源
                    </n-button>
                    <n-button
                      :loading="pingLoading"
                      @click="testRegistry()"
                    >
                      测试默认源
                    </n-button>
                  </n-space>
                  
                  <n-card v-if="pingResult" :bordered="false" size="small" style="background: #f5f5f5">
                    <n-space align="center">
                      <n-tag :type="pingResult.success ? 'success' : 'error'" size="small">
                        {{ pingResult.success ? '✓ 连接成功' : '✗ 连接失败' }}
                      </n-tag>
                      <n-text v-if="pingResult.success" strong>
                        响应时间：{{ pingResult.duration }}ms
                      </n-text>
                      <n-text v-else depth="3" style="font-size: 12px">
                        {{ pingResult.message }}
                      </n-text>
                    </n-space>
                  </n-card>
                </n-space>
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <!-- 代理配置 -->
          <n-tab-pane name="proxy" tab="🌐 代理">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <n-form-item label="代理设置">
                <n-radio-group v-model:value="form.proxyType">
                  <n-radio value="none">不使用代理</n-radio>
                  <n-radio value="global">使用全局代理</n-radio>
                  <n-radio value="custom">自定义代理</n-radio>
                </n-radio-group>
              </n-form-item>

              <n-form-item v-if="form.proxyType === 'global'" label="全局代理">
                <n-input
                  :value="globalProxyUrl"
                  readonly
                  placeholder="请先在设置页面配置全局代理"
                />
              </n-form-item>

              <n-form-item v-if="form.proxyType === 'custom'" label="代理 URL">
                <n-input
                  v-model:value="form.customProxy"
                  type="text"
                  placeholder="例如：http://127.0.0.1:1080"
                />
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <!-- 缓存配置 -->
          <n-tab-pane name="cache" tab="💾 缓存">
            <n-form label-placement="left" label-width="100px" style="margin-top: 12px">
              <n-form-item label="缓存目录">
                <n-input
                  v-model:value="form.cacheDir"
                  type="text"
                  placeholder="例如：C:\npm-cache"
                />
              </n-form-item>

              <n-divider style="margin: 12px 0" />
              
              <n-spin :show="cacheLoading">
                <n-space vertical style="width: 100%">
                  <n-card v-if="cacheInfo" :bordered="false" size="small" style="background: #f5f5f5">
                    <n-space vertical>
                      <n-space align="center">
                        <n-text strong>当前路径：</n-text>
                        <n-text code>{{ cacheInfo.cachePath }}</n-text>
                      </n-space>
                      <n-space align="center">
                        <n-text strong>占用空间：</n-text>
                        <n-text type="info" strong style="font-size: 18px">
                          {{ cacheInfo.sizeFormatted }}
                        </n-text>
                      </n-space>
                    </n-space>
                  </n-card>

                  <n-space>
                    <n-button
                      type="warning"
                      :loading="cacheLoading"
                      @click="$emit('cleanCache')"
                    >
                      清理并校验缓存
                    </n-button>
                    <n-button
                      :loading="cacheLoading"
                      @click="$emit('loadCacheInfo')"
                    >
                      刷新信息
                    </n-button>
                  </n-space>

                  <n-text depth="3" style="font-size: 12px">
                    ⚠️ 清理缓存会执行 <n-text code>npm cache clean --force && npm cache verify</n-text>
                  </n-text>
                </n-space>
              </n-spin>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-spin>
    </n-card>

    <template #footer>
      <n-space justify="end">
        <n-button type="primary" @click="handleSave" :loading="saving" :disabled="saving">
          {{ saving ? '保存中...' : '保存配置' }}
        </n-button>
        <n-button @click="handleClose" :disabled="saving">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()

// Props
const props = defineProps<{
  show: boolean
  toolInfo: any
  mirrors: any[]
  globalProxyUrl: string
  npmStatus: any
  cacheInfo: any
  cacheLoading: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [config: any]
  clearGlobalConfig: []
  cleanCache: []
  loadCacheInfo: []
  loadStatus: []
}>()

// 状态
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const activeTab = ref('registry')
const loading = ref(false)
const saving = ref(false)
const pingLoading = ref(false)
const pingResult = ref<any>(null)

// 表单数据
const form = ref({
  registry: '',
  selectedMirror: '',
  proxyType: 'none',
  customProxy: '',
  cacheDir: ''
})

// 监听弹窗打开，加载配置
watch(() => props.show, async (newVal) => {
  if (newVal && props.toolInfo) {
    loading.value = true
    
    // 加载表单数据
    form.value.registry = props.toolInfo.registry || ''
    form.value.cacheDir = props.toolInfo.cacheDir || ''
    form.value.proxyType = props.toolInfo.proxyType || 'none'
    form.value.customProxy = props.toolInfo.customProxy || ''
    
    loading.value = false
    
    // 异步加载额外信息
    emit('loadCacheInfo')
    emit('loadStatus')
  }
})

// 镜像源选择
function handleMirrorChange(mirrorName: string) {
  const mirror = props.mirrors.find(m => m.name === mirrorName)
  if (mirror) {
    form.value.registry = mirror.registryUrl
  }
}

// 测试镜像源
async function testRegistry(url?: string) {
  if (!window.electronAPI) return
  
  try {
    pingLoading.value = true
    pingResult.value = null
    
    const result = await window.electronAPI.invoke('npm:testRegistry', url)
    
    pingResult.value = result
  } catch (error: any) {
    message.error('测试失败: ' + error.message)
  } finally {
    pingLoading.value = false
  }
}

// 保存配置
function handleSave() {
  emit('save', {
    tab: activeTab.value,
    form: form.value
  })
}

// 关闭弹窗
function handleClose() {
  if (!saving.value) {
    visible.value = false
  }
}

// 处理弹窗显示更新
function handleUpdateShow(show: boolean) {
  if (!saving.value) {
    emit('update:show', show)
  }
}

// 暴露方法给父组件
defineExpose({
  setSaving: (val: boolean) => { saving.value = val },
  updateForm: (data: any) => { Object.assign(form.value, data) }
})
</script>

<style scoped>
/* 组件样式 */
</style>

