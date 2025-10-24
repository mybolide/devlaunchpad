# 贡献指南

感谢你考虑为 **天闲 | DevLaunchpad** 做出贡献！👏

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 [Issue](https://github.com/yourusername/devlaunchpad/issues/new)，并包含以下信息：

- **Bug 描述**：清晰简洁的描述
- **复现步骤**：如何重现这个问题
- **期望行为**：你期望发生什么
- **实际行为**：实际发生了什么
- **截图**：如果适用，添加截图帮助说明
- **环境信息**：
  - 操作系统：Windows / macOS / Linux
  - 应用版本：v1.0.0
  - Node.js 版本

### 提出新功能

如果你有新功能的想法，欢迎创建 [Feature Request](https://github.com/yourusername/devlaunchpad/issues/new)：

- **功能描述**：详细描述你的想法
- **使用场景**：这个功能解决什么问题
- **可选方案**：如果有，提供其他解决方案

### 提交代码

1. **Fork 项目**
   ```bash
   # 克隆你 Fork 的仓库
   git clone https://github.com/yourusername/devlaunchpad.git
   cd devlaunchpad
   ```

2. **创建分支**
   ```bash
   # 从 main 分支创建新分支
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **开发**
   ```bash
   # 启动开发模式
   npm run dev
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加某某功能"
   # 或
   git commit -m "fix: 修复某某问题"
   ```

6. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述，说明你的更改

## 📝 代码规范

### Commit 消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

**类型 (type)**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是 Bug 修复）
- `perf`: 性能优化
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

**示例**：
```bash
feat(tools): 添加 Docker 工具支持
fix(proxy): 修复代理设置不生效的问题
docs(readme): 更新安装说明
```

### TypeScript 代码规范

- 使用 TypeScript 编写代码
- 为函数和变量添加类型注解
- 避免使用 `any` 类型
- 使用接口定义数据结构

```typescript
// ✅ 好的示例
interface ToolConfig {
  name: string
  version: string
  enabled: boolean
}

function getTool(name: string): ToolConfig | null {
  // ...
}

// ❌ 不好的示例
function getTool(name) {
  return {} as any
}
```

### Vue 组件规范

- 使用 `<script setup lang="ts">` 语法
- 组件文件名使用 PascalCase（如 `ToolCard.vue`）
- 合理拆分组件，保持单一职责
- 添加必要的注释

```vue
<template>
  <div class="tool-card">
    {{ tool.name }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tool } from '@/types'

interface Props {
  tool: Tool
}

const props = defineProps<Props>()
</script>

<style scoped>
.tool-card {
  /* ... */
}
</style>
```

### 文件结构

- 组件放在 `src/components/` 目录
- 页面放在 `src/views/` 目录
- 类型定义放在 `src/types/` 目录
- Electron 主进程代码放在 `electron/` 目录

## 🧪 测试

在提交 PR 前，请确保：

- [ ] 代码能够正常编译（`npm run build`）
- [ ] 应用能够正常启动（`npm run dev`）
- [ ] 新功能已经过手动测试
- [ ] 没有引入新的 TypeScript 错误

## 📖 文档

如果你的更改涉及：
- 新功能：更新 README.md
- API 变更：更新相关文档
- 配置变更：更新说明文档

## 💬 交流

- 有问题？创建 [Issue](https://github.com/yourusername/devlaunchpad/issues)
- 想讨论？使用 [Discussions](https://github.com/yourusername/devlaunchpad/discussions)

## 📄 许可证

通过贡献代码，你同意你的贡献将遵循本项目的 [MIT License](LICENSE)。

---

再次感谢你的贡献！🎉

