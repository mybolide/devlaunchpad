<script setup lang="ts">
import { computed, h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const route = useRoute()

// 当前激活的菜单项
const activeKey = computed(() => route.path)

// 菜单项配置
const menuOptions = computed<MenuOption[]>(() => [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Home',
          },
        },
        { default: () => '首页' }
      ),
    key: '/',
    icon: () => h('span', { style: { fontSize: '18px' } }, '🏠'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Tools',
          },
        },
        { default: () => '工具配置' }
      ),
    key: '/tools',
    icon: () => h('span', { style: { fontSize: '18px' } }, '🛠️'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Software',
          },
        },
        { default: () => '软件管理' }
      ),
    key: '/software',
    icon: () => h('span', { style: { fontSize: '18px' } }, '📦'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Settings',
          },
        },
        { default: () => '设置' }
      ),
    key: '/settings',
    icon: () => h('span', { style: { fontSize: '18px' } }, '⚙️'),
  },
])
</script>

<template>
  <div class="sidebar">
    <n-menu
      :value="activeKey"
      :options="menuOptions"
      :root-indent="24"
      :indent="16"
    />
  </div>
</template>

<style scoped>
.sidebar {
  height: 100%;
  padding-top: 16px;
}
</style>


