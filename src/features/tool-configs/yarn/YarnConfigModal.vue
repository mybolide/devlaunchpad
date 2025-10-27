<template>
  <n-modal
    v-model:show="visible"
    title="yarn 配置"
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
                  placeholder="例如：C:\yarn-cache"
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
                      清理缓存
                    </n-button>
                    <n-button
                      :loading="cacheLoading"
                      @click="$emit('loadCacheInfo')"
                    >
                      刷新信息
                    </n-button>
                  </n-space>

                  <n-text depth="3" style="font-size: 12px">
                    ⚠️ 清理缓存会执行 <n-text code>yarn cache clean</n-text>
                  </n-text>
                </n-space>
              </n-spin>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-spin>
      
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" @click="handleSave" :loading="saving" :disabled="saving">
            {{ saving ? '保存中...' : '保存配置' }}
          </n-button>
          <n-button @click="handleClose" :disabled="saving">关闭</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  NModal, 
  NCard, 
  NSpin, 
  NTabs, 
  NTabPane, 
  NForm, 
  NFormItem, 
  NSpace, 
  NText, 
  NButton, 
  NSelect, 
  NInput, 
  NRadioGroup, 
  NRadio, 
  NDivider, 
  NTag,
  useMessage 
} from 'naive-ui'

const message = useMessage()

// Props
const props = defineProps<{
  show: boolean
  toolInfo: any
  mirrors: any[]
  globalProxyUrl: string
  cacheInfo: any
  cacheLoading: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [config: any]
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
  if (newVal) {
    console.log('[YarnConfigModal] 弹窗打开')
    console.log('[YarnConfigModal] toolInfo:', props.toolInfo)
    console.log('[YarnConfigModal] 缓存信息:', props.cacheInfo)
    
    loading.value = true
    
    // 初始化表单数据
    initializeForm()
    
    loading.value = false
  }
})

// 初始化表单数据的函数
function initializeForm() {
  if (!props.toolInfo) {
    console.warn('[YarnConfigModal] toolInfo 为空，跳过初始化')
    return
  }
  
  // 1. 初始化镜像源 URL
  form.value.registry = props.toolInfo.registryUrl || props.toolInfo.registry || ''
  console.log('[YarnConfigModal] 初始化 registry:', form.value.registry)
  
  // 2. 初始化缓存目录（优先使用 cacheInfo 中的实际路径）
  form.value.cacheDir = props.cacheInfo?.cachePath || props.toolInfo.cacheDir || ''
  console.log('[YarnConfigModal] 初始化 cacheDir:', form.value.cacheDir)
  
  // 3. 初始化代理配置
  if (props.toolInfo.currentProxy) {
    form.value.proxyType = 'custom'
    form.value.customProxy = props.toolInfo.currentProxy
  } else {
    form.value.proxyType = 'none'
    form.value.customProxy = ''
  }
  console.log('[YarnConfigModal] 初始化代理:', form.value.proxyType, form.value.customProxy)
  
  // 4. 根据当前 registry URL 匹配镜像源名称
  if (form.value.registry && props.mirrors.length > 0) {
    const currentMirror = props.mirrors.find(m => m.url === form.value.registry)
    if (currentMirror) {
      form.value.selectedMirror = currentMirror.name
      console.log('[YarnConfigModal] ✓ 匹配到镜像源:', currentMirror.name)
    } else {
      form.value.selectedMirror = ''
      console.log('[YarnConfigModal] 使用自定义镜像源地址:', form.value.registry)
    }
  } else {
    form.value.selectedMirror = ''
  }
  
  console.log('[YarnConfigModal] ✓ 表单初始化完成:', JSON.stringify(form.value, null, 2))
}

// 监听 toolInfo 变化，重新初始化表单
watch(() => props.toolInfo, (newToolInfo) => {
  if (newToolInfo && props.show) {
    console.log('[YarnConfigModal] toolInfo 更新，重新初始化表单')
    initializeForm()
  }
}, { deep: true })

// 监听缓存信息变化，更新表单中的缓存目录
watch(() => props.cacheInfo, (newCacheInfo) => {
  if (newCacheInfo && newCacheInfo.cachePath && props.show) {
    form.value.cacheDir = newCacheInfo.cachePath
    console.log('[YarnConfigModal] 缓存信息更新，更新表单:', newCacheInfo.cachePath)
  }
}, { deep: true })

// 镜像源选择
function handleMirrorChange(mirrorName: string) {
  console.log('[handleMirrorChange] 选择镜像源:', mirrorName)
  const mirror = props.mirrors.find(m => m.name === mirrorName)
  console.log('[handleMirrorChange] 找到镜像源:', mirror)
  if (mirror) {
    form.value.registry = mirror.url || mirror.registryUrl
    console.log('[handleMirrorChange] 设置 registry:', form.value.registry)
  }
}

// 测试镜像源
async function testRegistry(url?: string) {
  if (!window.electronAPI) return
  
  try {
    pingLoading.value = true
    pingResult.value = null
    
    const result = await window.electronAPI.invoke('yarn:testRegistry', url)
    
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

