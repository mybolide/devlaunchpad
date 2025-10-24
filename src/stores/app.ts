import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用名称
  const appName = ref('天闲 | DevLaunchpad')
  
  // 作者
  const author = ref('小墨')
  
  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false)
  
  // 测试计数器
  const count = ref(0)
  
  function increment() {
    count.value++
  }
  
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  return {
    appName,
    author,
    sidebarCollapsed,
    count,
    increment,
    toggleSidebar
  }
})

