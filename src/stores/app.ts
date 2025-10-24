import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用名称
  const appName = ref('天闲 | DevLaunchpad')
  
  // 作者
  const author = ref('小墨')
  
  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false)
  
  // 窗口最大化状态
  const isMaximized = ref(false)
  
  // 测试计数器
  const count = ref(0)
  
  function increment() {
    count.value++
  }
  
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  function setMaximized(value: boolean) {
    isMaximized.value = value
  }
  
  return {
    appName,
    author,
    sidebarCollapsed,
    isMaximized,
    count,
    increment,
    toggleSidebar,
    setMaximized
  }
})

