# 天闲 | DevLaunchpad

<div align="center">

<img src="public/logo.svg" alt="DevLaunchpad Logo" width="200"/>

<br/>
<br/>
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-38.4.0-47848f?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**开发者工具配置管理器 - 让开发更高效**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [项目结构](#-项目结构) • [开发指南](#-开发指南)

</div>

---

## 📖 项目简介

**天闲 (DevLaunchpad)** 是一款为开发者打造的桌面工具配置管理器，帮助开发者快速管理和配置各种开发工具的代理、镜像源、缓存目录等设置。告别繁琐的命令行配置，一键完成工具设置！

### 🎯 解决的问题

- ✅ 统一管理多个开发工具的配置（Git、npm、pip、Maven 等）
- ✅ 一键切换镜像源，提升国内下载速度
- ✅ 批量设置代理，解决网络问题
- ✅ 可视化界面，告别命令行
- ✅ 配置备份与恢复，换机无忧

---

## ✨ 功能特性

### 🔧 工具管理
- **智能检测**：自动扫描系统已安装的开发工具
- **版本显示**：实时显示工具版本信息
- **状态监控**：查看工具当前配置状态（代理、镜像源等）
- **快速配置**：可视化界面配置工具参数

### 🌐 代理管理
- **全局代理**：一键为所有工具设置统一代理
- **单独配置**：为特定工具配置独立代理
- **批量操作**：支持批量启用/禁用代理
- **代理测试**：测试代理连接是否可用

### 📦 镜像源管理
- **内置镜像源**：集成常用国内镜像源（阿里云、腾讯云、华为云等）
- **快速切换**：一键切换工具镜像源
- **自定义源**：支持添加自定义镜像源

### 💾 配置管理
- **配置保存**：持久化存储工具配置
- **配置导入/导出**：备份和恢复配置
- **多端同步**：支持配置文件跨设备使用

### 🎨 界面特性
- **现代化 UI**：基于 Naive UI 的精美界面
- **自定义标题栏**：无边框窗口，支持拖拽
- **启动动画**：优雅的启动加载效果
- **响应式设计**：适配不同屏幕尺寸

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/mybolide/devlaunchpad.git

# 进入项目目录
cd devlaunchpad

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建

```bash
# 构建 Windows 应用
npm run build

# 构建并打包
npm run build
```

---

## 🛠️ 技术栈

### 前端框架
- **[Vue 3](https://vuejs.org/)** - 渐进式 JavaScript 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[Naive UI](https://www.naiveui.com/)** - Vue 3 组件库
- **[Pinia](https://pinia.vuejs.org/)** - Vue 状态管理
- **[Vue Router](https://router.vuejs.org/)** - Vue 路由管理

### 桌面应用
- **[Electron](https://www.electronjs.org/)** - 跨平台桌面应用框架
- **[Electron Builder](https://www.electron.build/)** - 应用打包工具

### 构建工具
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **[vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)** - Electron + Vite 集成

### 工具库
- **[@vicons/ionicons5](https://www.naiveui.com/zh-CN/os-theme/components/icon)** - 图标库

---

## 📁 项目结构

```
devlaunchpad/
├── electron/                    # Electron 主进程
│   ├── core/                   # 核心业务逻辑
│   │   ├── command-executor.ts # 命令执行器
│   │   ├── config-storage.ts   # 配置存储
│   │   ├── proxy-manager.ts    # 代理管理
│   │   ├── tool-detector.ts    # 工具检测
│   │   └── tools-config.ts     # 工具配置定义
│   ├── main.ts                 # Electron 主进程入口
│   └── preload.js              # 预加载脚本（IPC 通信）
│
├── src/                        # Vue 前端代码
│   ├── components/             # 组件
│   │   ├── layout/            # 布局组件
│   │   │   ├── AppLayout.vue  # 应用布局
│   │   │   ├── TitleBar.vue   # 标题栏
│   │   │   └── Sidebar.vue    # 侧边栏
│   │   └── SplashScreen.vue   # 启动屏幕
│   │
│   ├── views/                 # 页面
│   │   ├── Home.vue           # 首页
│   │   ├── Tools.vue          # 工具管理
│   │   ├── Software.vue       # 软件商店
│   │   └── Settings.vue       # 设置
│   │
│   ├── stores/                # Pinia 状态管理
│   │   └── app.ts             # 应用状态
│   │
│   ├── router/                # 路由配置
│   │   └── index.ts
│   │
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── App.vue                # 根组件
│   └── main.ts                # Vue 入口
│
├── dist-electron/             # Electron 编译输出
├── dist/                      # 前端编译输出
├── public/                    # 静态资源
├── index.html                 # HTML 模板
├── package.json               # 项目配置
├── vite.config.ts             # Vite 配置
└── tsconfig.json              # TypeScript 配置
```

---

## 🔨 开发指南

### 开发模式

```bash
npm run dev
```

开发模式会同时启动：
- Vite 开发服务器（前端热更新）
- Electron 应用窗口

### 添加新工具支持

1. 在 `electron/core/tools-config.ts` 中添加工具配置：

```typescript
export const TOOLS_CONFIG = {
  'your-tool': {
    name: 'your-tool',
    displayName: '工具显示名',
    category: 'dev_tool',
    checkCmd: ['your-tool', '--version'],
    enableCmds: [['your-tool', 'config', 'set', 'proxy', '{proxy}']],
    disableCmds: [['your-tool', 'config', 'unset', 'proxy']],
    getProxyCmd: ['your-tool', 'config', 'get', 'proxy'],
    description: '工具描述'
  }
}
```

2. 在 `electron/core/tool-detector.ts` 的 `toolCategoryMap` 中添加分类映射

3. 前端会自动检测并显示新工具

### IPC 通信

前端调用 Electron API：

```typescript
// 获取所有工具
const tools = await window.electronAPI.tool.getAllTools()

// 设置代理
await window.electronAPI.proxy.enable('npm', 'http://127.0.0.1:7890')

// 执行命令
const result = await window.electronAPI.command.execute('git --version')
```

### 构建发布

```bash
# 构建应用
npm run build

# 输出目录：dist/
# 包含 Windows 安装包、便携版等
```

---

## 🎨 截图

<!-- TODO: 添加应用截图 -->

<div align="center">

### 启动页面
![启动页](docs/screenshots/splash.png)

### 工具管理
![工具管理](docs/screenshots/tools.png)

### 代理设置
![代理设置](docs/screenshots/proxy.png)

</div>

---

## 🤝 贡献

欢迎贡献代码、提交 Issue 或 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开发日志

- **v1.0.0** (2025-10-24)
  - ✨ 初始版本发布
  - ✅ 支持 Git、npm、pip、Maven 等工具管理
  - ✅ 代理和镜像源配置
  - ✅ 现代化 UI 界面

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 👨‍💻 作者

**小墨**

- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 强大的跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Naive UI](https://www.naiveui.com/) - 优秀的 Vue 3 组件库
- [Vite](https://vitejs.dev/) - 极速的构建工具

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by 小墨

</div>
