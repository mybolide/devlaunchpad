/// <reference types="vite/client" />

// Vue 单文件组件类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型声明（可选）
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // 在这里添加其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

